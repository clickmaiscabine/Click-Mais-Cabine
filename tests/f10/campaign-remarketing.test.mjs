import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { evaluateResponseGuard } from "../../src/functions/f2/index.mjs";

const snapshot=JSON.parse(fs.readFileSync(
  new URL("../../n8n/workflows/f10/CM-WF-180.lab.json",import.meta.url),
  "utf8"
));

function getNode(name){
  const node=snapshot.nodes.find((item)=>item.name===name);
  assert.ok(node,"missing node "+name);
  return node;
}
const planner=getNode("Plan Campaign Lifecycle");
const guardNode=getNode("Run Campaign Dispatch Shadow Guard");
const finalizer=getNode("Finalize Campaign Plan");

const runPlanner=(input)=>new Function("$json",planner.parameters.jsCode)(input).json;
const runGuard=(input)=>new Function("$json",guardNode.parameters.jsCode)(input).json;
const runFinalizer=(guarded,planned)=>{
  const mock$=(name)=>{
    assert.equal(name,"Plan Campaign Lifecycle");
    return {item:{json:planned}};
  };
  return new Function("$json","$",finalizer.parameters.jsCode)(guarded,mock$).json;
};

const draftCampaign={
  id:"camp-180",
  name:"Remarketing Outubro",
  status:"draft",
  segment_rules:{commercial_stage:["PERDIDO"],min_days_since_loss:30},
  offer_rules:{message_key:"REMARKETING_GENERIC",benefit:"condicao_especial"},
  starts_at:"2026-10-06T00:00:00-03:00",
  ends_at:"2026-10-31T23:59:59-03:00",
  approved_by:null,
  metadata:{}
};

function buildSnapshot(){
  return runPlanner({
    trigger_type:"build_snapshot",
    campaign:draftCampaign,
    now:"2026-10-06T01:30:00-03:00",
    candidate_events:[
      {customer_event_id:"e1",commercial_stage:"PERDIDO",status:"closed",segment_match:true,current_policy:{opt_out:false,suppressed:false,human_lock:false,contactable:true}},
      {customer_event_id:"e2",commercial_stage:"PERDIDO",status:"closed",segment_match:true,current_policy:{opt_out:true,suppressed:false,human_lock:false,contactable:true}},
      {customer_event_id:"e3",commercial_stage:"PERDIDO",status:"closed",segment_match:true,current_policy:{opt_out:false,suppressed:false,human_lock:true,contactable:true}},
      {customer_event_id:"e4",commercial_stage:"PERDIDO",status:"closed",segment_match:false,current_policy:{opt_out:false,suppressed:false,human_lock:false,contactable:true}}
    ]
  }).lifecycle_plan;
}

function approvedCampaign(hash){
  return {
    ...draftCampaign,
    status:"approved",
    approved_by:"regis",
    metadata:{approval_snapshot_hash:hash}
  };
}

test("180: snapshot records immutable segment/offer data and excludes opt-out/human_lock/non-match",()=>{
  const plan=buildSnapshot();
  assert.equal(plan.status,"snapshot_ready");
  assert.equal(plan.eligible_count,1);
  assert.equal(plan.excluded_count,3);
  const members=plan.operations.filter(x=>x.action==="UPSERT_CAMPAIGN_MEMBER");
  assert.equal(members.length,4);
  const byEvent=Object.fromEntries(members.map(x=>[x.customer_event_id,x]));
  assert.equal(byEvent.e1.eligibility_status,"eligible");
  assert.equal(byEvent.e2.eligibility_reason,"OPT_OUT");
  assert.equal(byEvent.e3.eligibility_reason,"HUMAN_LOCK");
  assert.equal(byEvent.e4.eligibility_reason,"SEGMENT_QUERY_NOT_MATCHED");
  assert.deepEqual(byEvent.e1.offer_snapshot,draftCampaign.offer_rules);
  assert.equal(plan.operations.some(x=>/PRICE|PRICING|CATALOG/.test(x.action)),false);
  assert.equal(plan.operations.some(x=>x.action==="CREATE_HUMAN_TASK" && x.task_type==="campaign_approval"),true);
});

test("180: human approval is bound to the exact reviewed snapshot",()=>{
  const snapshotPlan=buildSnapshot();
  const hash=snapshotPlan.snapshot_hash;
  const approved=runPlanner({
    trigger_type:"human_approve",
    campaign:draftCampaign,
    actor_type:"human",
    actor_ref:"regis",
    review_snapshot_hash:hash,
    eligible_member_count:1,
    now:"2026-10-06T01:35:00-03:00"
  }).lifecycle_plan;
  assert.equal(approved.status,"approved");
  assert.equal(approved.approval_snapshot_hash,hash);
  assert.equal(approved.operations[0].approved_by,"regis");
  assert.equal(approved.operations[1].action,"APPROVE_ELIGIBLE_CAMPAIGN_MEMBERS");

  const agent=runPlanner({
    trigger_type:"human_approve",
    campaign:draftCampaign,
    actor_type:"agent",
    actor_ref:"model",
    review_snapshot_hash:hash,
    eligible_member_count:1
  }).lifecycle_plan;
  assert.equal(agent.status,"denied");

  const changed=runPlanner({
    trigger_type:"human_approve",
    campaign:{...draftCampaign,offer_rules:{...draftCampaign.offer_rules,benefit:"changed"}},
    actor_type:"human",
    actor_ref:"regis",
    review_snapshot_hash:hash,
    eligible_member_count:1
  }).lifecycle_plan;
  assert.ok(changed.blockers.includes("CAMPAIGN_SNAPSHOT_CHANGED_REAPPROVAL_REQUIRED"));
});

function prepareDispatch(overrides={}){
  const hash=buildSnapshot().snapshot_hash;
  return runPlanner({
    trigger_type:"dispatch_candidate",
    campaign:approvedCampaign(hash),
    member:{id:"m1",customer_event_id:"e1",eligibility_status:"approved"},
    current_policy:{opt_out:false,suppressed:false,human_lock:false,contactable:true},
    now:"2026-10-06T02:00:00-03:00",
    whatsapp_window_open:true,
    template_approved:false,
    candidate_text:"Olá! Temos uma condição especial para você.",
    allowed_links:[],
    send_enabled:true,
    campaign_send_enabled:true,
    ...overrides
  });
}

test("180: valid campaign candidate is hard shadow even if input asks to enable send",()=>{
  const planned=prepareDispatch();
  const guarded=runGuard(planned);
  const final=runFinalizer(guarded,planned);
  assert.equal(guarded.decision,"shadow");
  assert.equal(guarded.dispatchAllowed,false);
  assert.equal(guarded.campaignDispatchAllowed,false);
  assert.ok(guarded.blockers.includes("SEND_DISABLED"));
  assert.ok(guarded.blockers.includes("CAMPAIGN_SEND_DISABLED"));
  assert.equal(final.status,"shadow_candidate");
  assert.equal(final.dispatch_allowed,false);
  assert.equal(final.operations.some(x=>/SEND|DISPATCH/.test(x.action)),false);
});

test("180: outside Meta window requires approved template; approved template stays shadow",()=>{
  const noTemplate=prepareDispatch({whatsapp_window_open:false,template_approved:false});
  const denied=runGuard(noTemplate);
  assert.equal(denied.decision,"deny");
  assert.ok(denied.blockers.includes("META_TEMPLATE_REQUIRED_OUTSIDE_WINDOW"));

  const withTemplate=prepareDispatch({
    whatsapp_window_open:false,
    template_approved:true,
    approved_template_name:"remarketing_outubro_v1"
  });
  const allowedShadow=runGuard(withTemplate);
  assert.equal(allowedShadow.decision,"shadow");
  assert.equal(allowedShadow.delivery_mode,"template");
  assert.equal(allowedShadow.approved_template_name,"remarketing_outubro_v1");
  assert.equal(allowedShadow.dispatchAllowed,false);
});

test("180: opt-out, human_lock, suppression and unapproved member fail closed at dispatch time",()=>{
  const cases=[
    [{current_policy:{opt_out:true,suppressed:false,human_lock:false,contactable:true}},"CAMPAIGN_OPT_OUT","deny"],
    [{current_policy:{opt_out:false,suppressed:true,human_lock:false,contactable:true}},"CAMPAIGN_SUPPRESSED","deny"],
    [{current_policy:{opt_out:false,suppressed:false,human_lock:true,contactable:true}},"HUMAN_LOCK_ACTIVE","human"],
    [{member:{id:"m1",customer_event_id:"e1",eligibility_status:"excluded"}},"CAMPAIGN_MEMBER_NOT_APPROVED","deny"]
  ];
  for(const [override,reason,decision] of cases){
    const planned=prepareDispatch(override);
    const guarded=runGuard(planned);
    assert.equal(guarded.decision,decision);
    assert.ok(guarded.blockers.includes(reason));
    assert.equal(guarded.dispatchAllowed,false);
  }
});

test("180: modifying approved offer invalidates approval before candidate dispatch",()=>{
  const hash=buildSnapshot().snapshot_hash;
  const planned=runPlanner({
    trigger_type:"dispatch_candidate",
    campaign:{
      ...approvedCampaign(hash),
      offer_rules:{message_key:"REMARKETING_GENERIC",benefit:"different"}
    },
    member:{id:"m1",customer_event_id:"e1",eligibility_status:"approved"},
    current_policy:{opt_out:false,suppressed:false,human_lock:false,contactable:true},
    now:"2026-10-06T02:00:00-03:00",
    whatsapp_window_open:true,
    candidate_text:"Olá"
  });
  const guarded=runGuard(planned);
  assert.ok(guarded.blockers.includes("CAMPAIGN_APPROVAL_SNAPSHOT_MISMATCH"));
  assert.equal(guarded.dispatchAllowed,false);
});

test("180 campaign guard preserves F2 Response Guard semantics for price/tier safety",()=>{
  for(const testCase of [
    {
      override:{
        candidate_text:"Oferta da faixa T1190 para você."
      },
      f2:{
        candidateText:"Oferta da faixa T1190 para você.",
        claimedPrices:null,quoteResult:null
      },
      expected:"INTERNAL_TIER_EXPOSED"
    },
    {
      override:{
        candidate_text:"PIX R$ 900 e cartão R$ 1.000",
        claimed_prices:{pix:900,card:1000},
        quote_result:{customerVisible:{pix:1190,card:1410}}
      },
      f2:{
        candidateText:"PIX R$ 900 e cartão R$ 1.000",
        claimedPrices:{pix:900,card:1000},
        quoteResult:{customerVisible:{pix:1190,card:1410}}
      },
      expected:"PRICE_MISMATCH"
    }
  ]){
    const planned=prepareDispatch(testCase.override);
    const guarded=runGuard(planned);
    const direct=evaluateResponseGuard({
      humanLock:false,
      actionAuthorized:true,
      candidateText:testCase.f2.candidateText,
      claimedPrices:testCase.f2.claimedPrices,
      quoteResult:testCase.f2.quoteResult,
      availabilityClaim:"none",
      reservationConfirmed:false,
      askedFactKeys:[],
      currentFacts:{},
      containsPii:false,
      containsSecret:false,
      allowedLinks:[],
      whatsappWindowOpen:true,
      isCampaign:true,
      campaignApproved:true,
      sendEnabled:false
    });
    assert.ok(direct.blockers.includes(testCase.expected));
    assert.ok(guarded.blockers.includes(testCase.expected));
    assert.equal(guarded.dispatchAllowed,false);
  }
});

test("180: campaign end date blocks candidate",()=>{
  const planned=prepareDispatch({now:"2026-11-02T12:00:00-03:00"});
  const guarded=runGuard(planned);
  assert.ok(guarded.blockers.includes("CAMPAIGN_ENDED"));
});

test("180: dispatch-success lifecycle is idempotent and requires external message id",()=>{
  const hash=buildSnapshot().snapshot_hash;
  const campaign=approvedCampaign(hash);
  const sent=runPlanner({
    trigger_type:"dispatch_success",campaign,
    member:{id:"m1",customer_event_id:"e1",eligibility_status:"approved"},
    external_message_id:"wamid-camp-1"
  }).lifecycle_plan;
  assert.equal(sent.status,"sent");
  assert.equal(sent.operations[0].to_status,"sent");
  assert.equal(sent.operations[1].event_type,"campaign_sent");

  const duplicate=runPlanner({
    trigger_type:"dispatch_success",campaign,
    member:{id:"m1",customer_event_id:"e1",eligibility_status:"sent"},
    external_message_id:"wamid-camp-1"
  }).lifecycle_plan;
  assert.equal(duplicate.status,"duplicate_noop");
  assert.deepEqual(duplicate.operations,[]);

  const missing=runPlanner({
    trigger_type:"dispatch_success",campaign,
    member:{id:"m1",customer_event_id:"e1",eligibility_status:"approved"}
  }).lifecycle_plan;
  assert.ok(missing.blockers.includes("CAMPAIGN_EXTERNAL_MESSAGE_ID_REQUIRED"));
});

test("180: response and conversion lifecycle only advance from valid prior member states",()=>{
  const hash=buildSnapshot().snapshot_hash;
  const campaign=approvedCampaign(hash);

  const response=runPlanner({
    trigger_type:"customer_response",campaign,
    member:{id:"m1",customer_event_id:"e1",eligibility_status:"sent"}
  }).lifecycle_plan;
  assert.equal(response.status,"responded");
  assert.equal(response.operations[0].to_status,"responded");

  const converted=runPlanner({
    trigger_type:"converted",campaign,
    member:{id:"m1",customer_event_id:"e1",eligibility_status:"responded"}
  }).lifecycle_plan;
  assert.equal(converted.status,"converted");

  const invalid=runPlanner({
    trigger_type:"converted",campaign,
    member:{id:"m2",customer_event_id:"e2",eligibility_status:"approved"}
  }).lifecycle_plan;
  assert.ok(invalid.blockers.includes("CAMPAIGN_CONVERSION_REQUIRES_SENT_OR_RESPONDED"));
});
