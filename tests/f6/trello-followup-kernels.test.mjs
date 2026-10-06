import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  guardCommercialTransition,
  evaluateFollowupPolicy,
} from "../../src/functions/f2/index.mjs";

function loadSnapshot(code){
  return JSON.parse(fs.readFileSync(
    new URL("../../n8n/workflows/f6/CM-WF-"+code+".lab.json",import.meta.url),
    "utf8"
  ));
}
function codeNode(snapshot,name){
  const node=snapshot.nodes.find((item)=>item.name===name);
  assert.ok(node,"missing node "+name);
  return node;
}

const s070=loadSnapshot("070");
const s071=loadSnapshot("071");
const s080=loadSnapshot("080");

const n070=codeNode(s070,"Plan Canonical Trello Projection");
const n071=codeNode(s071,"Run F2 Trello Commercial Guard");
const n080Policy=codeNode(s080,"Run F2 Follow-up Policy");
const n080Lifecycle=codeNode(s080,"Plan Follow-up Lifecycle");

const exec070=new Function("$json",n070.parameters.jsCode);
const exec071=new Function("$json",n071.parameters.jsCode);
const exec080Policy=new Function("$json",n080Policy.parameters.jsCode);
const exec080Lifecycle=new Function("$json","$",n080Lifecycle.parameters.jsCode);

const canonicalLists=[
  {name:"ORÇAMENTO",id:"list-orcamento"},
  {name:"RESPOSTA",id:"list-resposta"},
  {name:"FAC / DÚVIDAS",id:"list-fac"},
  {name:"NEGOCIAÇÃO — BOT / HUMANO",id:"list-negociacao"},
  {name:"FECHAMENTO",id:"list-fechamento"},
  {name:"GANHO",id:"list-ganho"},
  {name:"PERDIDO",id:"list-perdido"},
];

const baseProjection={
  source_event_type:"quote_sent",
  customer_event_id:"event-070-1",
  qualified_at:"2026-10-05T20:00:00-03:00",
  commercial_stage:"ORCAMENTO",
  stage_version:1,
  customer_name:"Cliente Teste",
  event_date:"2027-01-10",
  city:"Mogi das Cruzes",
  event_type:"aniversário",
  services:["cabine_fotos"],
  origin_summary:"Google Ads",
  last_interaction_at:"2026-10-05T20:00:00-03:00",
  next_action_at:"2026-10-06T19:00:00-03:00",
  human_lock:false,
  internal_tier:"T1190",
  quote:{status:"presented",version:1,pix:1190,card:1410},
  existing_projection:null,
  list_directory:canonicalLists,
};

test("070: card nasce somente após quote_sent + presented + qualified",()=>{
  const ok=exec070(baseProjection).json;
  assert.equal(ok.status,"planned");
  assert.equal(ok.operations[0].action,"CREATE_CARD");

  const noQuoteSent=exec070({
    ...baseProjection,
    source_event_type:"facts_committed",
    customer_event_id:"event-no-card",
  }).json;
  assert.equal(noQuoteSent.status,"no_projection");
  assert.equal(noQuoteSent.operations.length,0);
});

test("070: projection never leaks internal pricing tier",()=>{
  const out=exec070(baseProjection).json;
  assert.equal(out.projection.description.includes("T1190"),false);
  assert.equal(out.projection.title.includes("T1190"),false);
  assert.equal(out.projection.description.includes("EVENT_ID=event-070-1"),true);
});

test("070: observed legacy board fails closed until canonical migration",()=>{
  const inventory=JSON.parse(fs.readFileSync(
    new URL("./fixtures/trello-commercial-inventory-2026-10-05.json",import.meta.url),
    "utf8"
  ));
  const listDirectory=inventory.open_lists.map((name,index)=>({name,id:"legacy-"+index}));
  const out=exec070({...baseProjection,list_directory:listDirectory}).json;
  assert.equal(out.status,"migration_required");
  assert.equal(out.operations.length,0);
  assert.equal(out.missing_list,"ORÇAMENTO");
});

test("070: identical projection is true no-op",()=>{
  const first=exec070(baseProjection).json;
  const out=exec070({
    ...baseProjection,
    source_event_type:"state_transition_confirmed",
    existing_projection:{
      card_id:"card-1",
      list_name:"ORÇAMENTO",
      list_id:"list-orcamento",
      projection_version:first.projection.projection_version,
      projection_hash:first.projection.projection_hash,
    }
  }).json;
  assert.equal(out.status,"in_sync");
  assert.deepEqual(out.operations,[]);
});

test("070: canonical state transition produces move/update plan, never reverse adoption",()=>{
  const out=exec070({
    ...baseProjection,
    source_event_type:"state_transition_confirmed",
    commercial_stage:"RESPOSTA",
    stage_version:2,
    existing_projection:{
      card_id:"card-1",
      list_name:"ORÇAMENTO",
      list_id:"list-orcamento",
      projection_version:"1:1",
      projection_hash:"old",
    }
  }).json;
  assert.deepEqual(out.operations.slice(0,2).map(x=>x.action),["MOVE_CARD","UPDATE_CARD"]);
  assert.equal(out.projection.target_list_name,"RESPOSTA");
});

test("071 snapshot uses the generated F2 Trello guard adapter exactly",()=>{
  const generated=fs.readFileSync(
    new URL("../../n8n/generated/f2-trello-commercial-guard.generated.js",import.meta.url),
    "utf8"
  );
  assert.equal(n071.parameters.jsCode,generated);
});

test("071: valid move matches F2 state guard",()=>{
  const input={
    actor_authorized:true,
    trello_action_id:"a1",
    customer_event_id:"e1",
    card_event_id:"e1",
    target_list_name:"RESPOSTA",
    commercial_stage:"ORCAMENTO",
    stage_version:2,
    projection_stage_version:2,
    human_lock:false,
    quote_sent:true,
  };
  const out=exec071(input).json;
  const direct=guardCommercialTransition({
    from:"ORCAMENTO",to:"RESPOSTA",actorType:"human",
    expectedVersion:2,actualVersion:2,humanLock:false,
    quoteSent:true,source:"trello",trelloProjectionValid:true,
  });
  assert.deepEqual(out.guard,direct);
  assert.equal(out.status,"authorized");
});

test("071: legacy/noncanonical target list is rejected and reprojected",()=>{
  const out=exec071({
    actor_authorized:true,customer_event_id:"e1",card_event_id:"e1",
    target_list_name:"DUVIDAS/OBJEÇÕES",commercial_stage:"ORCAMENTO",
    stage_version:2,projection_stage_version:2,quote_sent:true,
  }).json;
  assert.equal(out.status,"denied");
  assert.equal(out.reprojection_required,true);
  assert.equal(out.guard.reasonCode,"TRELLO_TARGET_LIST_NOT_CANONICAL");
});

test("071: optimistic version conflict never overwrites canonical state",()=>{
  const out=exec071({
    actor_authorized:true,customer_event_id:"e1",card_event_id:"e1",
    target_list_name:"RESPOSTA",commercial_stage:"ORCAMENTO",
    stage_version:3,projection_stage_version:2,quote_sent:true,
  }).json;
  assert.equal(out.status,"denied");
  assert.equal(out.guard.reasonCode,"STATE_VERSION_CONFLICT");
  assert.equal(out.guard.nextAction,"reload_reevaluate");
});

test("071: GANHO requires signed contract and verified signal/full",()=>{
  const denied=exec071({
    actor_authorized:true,customer_event_id:"e1",card_event_id:"e1",
    target_list_name:"GANHO",commercial_stage:"FECHAMENTO",
    stage_version:5,projection_stage_version:5,quote_sent:true,
    contract_status:"signed",payment_verified:false,payment_kind:"signal",
  }).json;
  assert.equal(denied.guard.reasonCode,"GANHO_REQUIRES_VERIFIED_SIGNAL_OR_FULL_PAYMENT");

  const allowed=exec071({
    actor_authorized:true,customer_event_id:"e1",card_event_id:"e1",
    target_list_name:"GANHO",commercial_stage:"FECHAMENTO",
    stage_version:5,projection_stage_version:5,quote_sent:true,
    contract_status:"signed",payment_verified:true,payment_kind:"signal",
  }).json;
  assert.equal(allowed.status,"authorized");
});

test("080 policy adapter stays in parity with F2",()=>{
  const cases=[
    {automatic_sent_count:0,customer_responded:false,human_lock:false,commercial_stage:"ORCAMENTO",quote_changed:false},
    {automatic_sent_count:1,customer_responded:false,human_lock:false,commercial_stage:"ORCAMENTO",quote_changed:false},
    {automatic_sent_count:0,customer_responded:true,human_lock:false,commercial_stage:"RESPOSTA",quote_changed:false},
    {automatic_sent_count:0,customer_responded:false,human_lock:true,commercial_stage:"NEGOCIACAO",quote_changed:false},
    {automatic_sent_count:0,customer_responded:false,human_lock:false,commercial_stage:"GANHO",quote_changed:false},
    {automatic_sent_count:0,customer_responded:false,human_lock:false,commercial_stage:"ORCAMENTO",quote_changed:true},
  ];
  for(const input of cases){
    const actual=exec080Policy(input).json;
    const expected=evaluateFollowupPolicy({
      automaticSentCount:input.automatic_sent_count,
      customerResponded:input.customer_responded,
      humanLock:input.human_lock,
      commercialStage:input.commercial_stage,
      quoteChanged:input.quote_changed,
      delayHours:23,
    });
    assert.deepEqual(actual,expected);
  }
});

function lifecycle(input){
  const policy=exec080Policy(input).json;
  const mock$=(name)=>{
    assert.equal(name,"Receive Follow-up Context");
    return {item:{json:input}};
  };
  return exec080Lifecycle(policy,mock$).json;
}

test("080: first automatic follow-up schedules exactly +23h and no discount",()=>{
  const out=lifecycle({
    trigger_type:"quote_sent",customer_event_id:"e80",commercial_stage:"ORCAMENTO",
    quote_version:1,quote_sent_at:"2026-10-05T20:00:00-03:00",
    automatic_sent_count:0,customer_responded:false,human_lock:false,quote_changed:false,
    existing_followup:null,
  });
  assert.equal(out.status,"scheduled");
  assert.equal(out.operations.length,1);
  assert.equal(out.operations[0].template_key,"FOLLOWUP_23H_NO_DISCOUNT");
  assert.equal(out.operations[0].discount_allowed,false);
  assert.equal(out.next_action_at,"2026-10-06T22:00:00.000Z");
});

test("080: response/lock/terminal/quote change cancel pending follow-up",()=>{
  for(const input of [
    {customer_responded:true,human_lock:false,commercial_stage:"RESPOSTA",quote_changed:false},
    {customer_responded:false,human_lock:true,commercial_stage:"NEGOCIACAO",quote_changed:false},
    {customer_responded:false,human_lock:false,commercial_stage:"GANHO",quote_changed:false},
    {customer_responded:false,human_lock:false,commercial_stage:"ORCAMENTO",quote_changed:true},
  ]){
    const out=lifecycle({
      trigger_type:"state_change",customer_event_id:"e80",quote_version:1,
      automatic_sent_count:0,
      existing_followup:{id:"f1",status:"pending",due_at:"2026-10-06T22:00:00.000Z"},
      ...input,
    });
    assert.equal(out.operations[0]?.action,"CANCEL_FOLLOWUP");
  }
});

test("080: due follow-up remains shadow and never dispatches",()=>{
  const out=lifecycle({
    trigger_type:"schedule_tick",customer_event_id:"e80",commercial_stage:"ORCAMENTO",
    quote_version:1,now:"2026-10-07T00:00:00.000Z",
    automatic_sent_count:0,customer_responded:false,human_lock:false,quote_changed:false,
    existing_followup:{id:"f3",status:"pending",due_at:"2026-10-06T22:00:00.000Z"},
  });
  assert.equal(out.status,"due_shadow");
  assert.ok(out.blockers.includes("SEND_DISABLED"));
  assert.equal(out.operations.some(x=>/SEND|DISPATCH/.test(x.action)),false);
  assert.equal(out.operations[0].discount_allowed,false);
});

test("080: one automatic send is the hard ceiling",()=>{
  const out=lifecycle({
    trigger_type:"schedule_tick",customer_event_id:"e80",commercial_stage:"ORCAMENTO",
    quote_version:1,now:"2026-10-07T00:00:00.000Z",
    automatic_sent_count:1,customer_responded:false,human_lock:false,quote_changed:false,
    existing_followup:{id:"f4",status:"sent",due_at:"2026-10-06T22:00:00.000Z"},
  });
  assert.equal(out.status,"no_action");
  assert.deepEqual(out.operations,[]);
});
