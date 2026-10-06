import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  guardCommercialTransition,
  guardPaymentVerification,
} from "../../src/functions/f2/index.mjs";

function load(code){
  return JSON.parse(fs.readFileSync(
    new URL("../../n8n/workflows/f7/CM-WF-"+code+".lab.json",import.meta.url),
    "utf8"
  ));
}
function node(snapshot,name){
  const n=snapshot.nodes.find((item)=>item.name===name);
  assert.ok(n,"missing node "+name);
  return n;
}
function exec(n,...args){
  const params=["$json"];
  if(args.length>0) params.push("$");
  const fn=new Function(...params,n.parameters.jsCode);
  return fn(...args).json;
}
function mockInput(name,input){
  return (requested)=>{
    assert.equal(requested,name);
    return {item:{json:input}};
  };
}

const s090=load("090");
const s100=load("100");
const s110=load("110");
const s120=load("120");

const n090Prepare=node(s090,"Prepare FECHAMENTO Guard Input");
const n090Guard=node(s090,"Run F2 FECHAMENTO Guard");
const n090Plan=node(s090,"Plan Closing Intake");
const n100=node(s100,"Plan Contract Lifecycle");
const n110Guard=node(s110,"Run F2 Payment Verification Guard");
const n110Plan=node(s110,"Plan Payment Intake & Verification");
const n120Prepare=node(s120,"Prepare GANHO Guard Input");
const n120Guard=node(s120,"Run F2 GANHO Guard");
const n120Plan=node(s120,"Plan Win and Operations Handoff");

test("090/120 use the same generated commercial guard artifact",()=>{
  const generated=fs.readFileSync(
    new URL("../../n8n/generated/f2-commercial-transition-guard.generated.js",import.meta.url),
    "utf8"
  );
  assert.equal(n090Guard.parameters.jsCode,generated);
  assert.equal(n120Guard.parameters.jsCode,generated);
});

test("110 uses the generated payment verification guard artifact",()=>{
  const generated=fs.readFileSync(
    new URL("../../n8n/generated/f2-payment-verification-guard.generated.js",import.meta.url),
    "utf8"
  );
  assert.equal(n110Guard.parameters.jsCode,generated);
});

function run090(input){
  const prepared=exec(n090Prepare,input);
  const guard=exec(n090Guard,prepared);
  const mock=mockInput("Receive Closing Context",input);
  return {prepared,guard,out:exec(n090Plan,guard,mock)};
}

test("090: wants-close enters FECHAMENTO but never guarantees reservation",()=>{
  const input={
    trigger_type:"customer_wants_to_close",
    customer_event_id:"e90",
    source_event_id:"m90",
    commercial_stage:"ORCAMENTO",
    stage_version:3,
    human_lock:false,
    quote_sent:true,
    form_submission:null
  };
  const {guard,out}=run090(input);
  assert.deepEqual(guard,guardCommercialTransition({
    from:"ORCAMENTO",to:"FECHAMENTO",actorType:"system",
    expectedVersion:3,actualVersion:3,humanLock:false,
    quoteSent:true,source:"system",trelloProjectionValid:false
  }));
  assert.equal(out.status,"planned");
  assert.equal(out.operations[0].to_stage,"FECHAMENTO");
  assert.equal(out.operations.some(x=>x.action==="PRESENT_CLOSING_FORM"),true);
  assert.equal(out.reservation_guaranteed,false);
});

test("090: closing form becomes facts with form provenance and no reservation claim",()=>{
  const {out}=run090({
    trigger_type:"closing_form_callback",
    customer_event_id:"e91",
    source_event_id:"form-event-1",
    form_submission_id:"form-1",
    commercial_stage:"RESPOSTA",
    stage_version:4,
    human_lock:false,
    quote_sent:true,
    form_submission:{
      customer_name:"Ana",
      event_date:"2027-03-10",
      locality:"Mogi das Cruzes",
      event_type:"casamento",
      service_interest:["cabine_fotos"]
    }
  });
  const facts=out.operations.filter(x=>x.action==="RECORD_EVENT_FACT");
  assert.equal(facts.length,5);
  assert.ok(facts.every(x=>x.source_ref==="closing_form"));
  assert.equal(out.operations.some(x=>x.event_type==="closing_form_received"),true);
  assert.equal(out.reservation_guaranteed,false);
});

test("090: human_lock or PRE_QUOTE blocks closing transition",()=>{
  const locked=run090({
    trigger_type:"customer_wants_to_close",customer_event_id:"e",commercial_stage:"ORCAMENTO",
    stage_version:1,human_lock:true,quote_sent:true
  }).out;
  assert.equal(locked.status,"human_required");
  assert.equal(locked.operations.length,0);

  const pre=run090({
    trigger_type:"customer_wants_to_close",customer_event_id:"e",commercial_stage:"PRE_QUOTE",
    stage_version:1,human_lock:false,quote_sent:false
  }).out;
  assert.equal(pre.status,"blocked");
  assert.equal(pre.operations.length,0);
});

test("100: closing-ready creates a versioned contract request but no external call",()=>{
  const out=exec(n100,{
    trigger_type:"closing_ready",
    customer_event_id:"e100",
    source_event_id:"close-100",
    human_lock:false,
    latest_contract:null,
    latest_contract_version:0
  });
  assert.equal(out.status,"adapter_required");
  assert.deepEqual(out.operations.map(x=>x.action),["CREATE_CONTRACT_RECORD","REQUEST_AUTENTIQUE_CREATE"]);
  assert.equal(out.operations[0].contract_version,1);
  assert.equal(out.operations[0].idempotency_key,out.operations[1].idempotency_key);
  assert.ok(out.blockers.includes("AUTENTIQUE_ADAPTER_NOT_CONNECTED"));
});

test("100: active contract and duplicate provider webhook are no-op",()=>{
  const existing=exec(n100,{
    trigger_type:"closing_ready",customer_event_id:"e",human_lock:false,
    latest_contract:{id:"c1",contract_version:1,status:"sent"},latest_contract_version:1
  });
  assert.equal(existing.status,"no_action");
  assert.deepEqual(existing.operations,[]);

  const duplicate=exec(n100,{
    trigger_type:"provider_webhook",customer_event_id:"e",
    provider_event_id:"prov-1",provider_status:"signed",
    latest_contract:{id:"c1",contract_version:1,status:"sent"},
    seen_provider_event_ids:["prov-1"]
  });
  assert.equal(duplicate.status,"duplicate_noop");
  assert.deepEqual(duplicate.operations,[]);
});

test("100: signed contract never regresses; cancellation after signed routes human",()=>{
  const stale=exec(n100,{
    trigger_type:"provider_webhook",customer_event_id:"e",
    provider_event_id:"prov-2",provider_status:"sent",
    latest_contract:{id:"c1",contract_version:1,status:"signed"},
    seen_provider_event_ids:[]
  });
  assert.equal(stale.status,"stale_noop");
  assert.equal(stale.operations[0].ignored,true);

  const cancelled=exec(n100,{
    trigger_type:"provider_webhook",customer_event_id:"e",
    provider_event_id:"prov-3",provider_status:"cancelled",
    latest_contract:{id:"c1",contract_version:1,status:"signed"},
    seen_provider_event_ids:[]
  });
  assert.equal(cancelled.status,"human_required");
  assert.equal(cancelled.operations[0].action,"ENABLE_HUMAN_LOCK");
  assert.equal(cancelled.operations[0].reason_code,"NON_STANDARD_POST_CONTRACT_CHANGE");
});

test("100: signed provider event produces contract_signed event",()=>{
  const out=exec(n100,{
    trigger_type:"provider_webhook",customer_event_id:"e",
    source_event_id:"provider-msg",provider_event_id:"prov-signed",provider_status:"signed",
    latest_contract:{id:"c1",contract_version:1,status:"sent"},
    seen_provider_event_ids:[]
  });
  assert.equal(out.status,"planned");
  assert.equal(out.operations[0].to_status,"signed");
  assert.equal(out.operations.some(x=>x.event_type==="contract_signed"),true);
});

function run110(input){
  const guard=exec(n110Guard,input);
  const mock=mockInput("Receive Payment Context",input);
  return {guard,out:exec(n110Plan,guard,mock)};
}

test("110: proof extraction never verifies payment by itself",()=>{
  const {out}=run110({
    trigger_type:"proof_received",
    customer_event_id:"e110",
    source_event_id:"proof-event",
    actor_type:"agent",
    payment_kind:"signal",
    expected_amount:595,
    extracted_amount:595,
    proof_ref:"proof://ok"
  });
  assert.equal(out.status,"pending_human_verification");
  assert.equal(out.extraction_status,"apparent_ok");
  assert.equal(out.payment_verified,false);
  assert.equal(out.operations[0].human_status,"pending");
  assert.equal(out.operations.some(x=>x.action==="CREATE_HUMAN_TASK"),true);
});

test("110: divergent payment activates human lock",()=>{
  const {out}=run110({
    trigger_type:"proof_received",
    customer_event_id:"e111",
    source_event_id:"proof-div",
    actor_type:"agent",
    payment_kind:"signal",
    expected_amount:595,
    extracted_amount:500
  });
  assert.equal(out.extraction_status,"divergent");
  assert.equal(out.payment_verified,false);
  assert.equal(out.operations.some(x=>x.action==="ENABLE_HUMAN_LOCK"),true);
});

test("110: only a human can verify payment",()=>{
  const denied=run110({
    trigger_type:"human_verification",
    customer_event_id:"e",
    actor_type:"llm",
    actor_ref:"model",
    verification_decision:"verified",
    current_payment:{id:"p1",verification_version:0}
  });
  assert.deepEqual(denied.guard,guardPaymentVerification({actorType:"llm"}));
  assert.equal(denied.out.status,"denied");
  assert.equal(denied.out.payment_verified,false);

  const allowed=run110({
    trigger_type:"human_verification",
    customer_event_id:"e",
    actor_type:"human",
    actor_ref:"finance-user",
    verification_decision:"verified",
    current_payment:{id:"p1",verification_version:2}
  });
  assert.deepEqual(allowed.guard,guardPaymentVerification({actorType:"human"}));
  assert.equal(allowed.out.status,"verified");
  assert.equal(allowed.out.payment_verified,true);
  assert.equal(allowed.out.operations[0].expected_verification_version,2);
});

test("110: verification without payment id is blocked",()=>{
  const {out}=run110({
    trigger_type:"human_verification",
    customer_event_id:"e",
    actor_type:"human",
    actor_ref:"finance-user",
    verification_decision:"verified",
    current_payment:{verification_version:0}
  });
  assert.equal(out.status,"blocked");
  assert.ok(out.blockers.includes("PAYMENT_ID_REQUIRED_FOR_VERIFICATION"));
});

function run120(input){
  const prepared=exec(n120Prepare,input);
  const guard=exec(n120Guard,prepared);
  const mock=mockInput("Receive Win Gate Context",input);
  return {prepared,guard,out:exec(n120Plan,guard,mock)};
}

test("120: signed + verified signal produces one deterministic win handoff plan",()=>{
  const input={
    customer_event_id:"e120",
    commercial_stage:"FECHAMENTO",
    stage_version:7,
    operational_stage:"NOT_STARTED",
    human_lock:false,
    contract:{id:"c1",status:"signed"},
    payment:{id:"p1",payment_kind:"signal",human_status:"verified"},
    reservation:null,
    logistics_projection:null
  };
  const {guard,out}=run120(input);
  assert.deepEqual(guard,guardCommercialTransition({
    from:"FECHAMENTO",to:"GANHO",actorType:"system",
    expectedVersion:7,actualVersion:7,humanLock:false,
    quoteSent:false,contractStatus:"signed",paymentVerified:true,paymentKind:"signal",
    source:"system",trelloProjectionValid:false
  }));
  assert.equal(out.status,"planned");
  assert.equal(out.operations[0].to_stage,"GANHO");
  assert.equal(out.operations.some(x=>x.action==="UPSERT_RESERVATION"),true);
  const logistics=out.operations.find(x=>x.action==="UPSERT_LOGISTICS_PROJECTION");
  assert.equal(logistics.target_list_name,"CONTRATOS EM ANDAMENTO");
  assert.equal(logistics.preserve_existing_structure,true);
  assert.equal(logistics.move_other_lists,false);
  assert.equal(out.logistics_board_structure_change,false);
});

test("120: existing reservation/projection are not duplicated",()=>{
  const {out}=run120({
    customer_event_id:"e121",
    commercial_stage:"FECHAMENTO",
    stage_version:7,
    operational_stage:"NOT_STARTED",
    human_lock:false,
    contract:{id:"c1",status:"signed"},
    payment:{id:"p1",payment_kind:"full",human_status:"verified"},
    reservation:{status:"confirmed"},
    logistics_projection:{card_id:"log-card-1"}
  });
  assert.equal(out.operations.some(x=>x.action==="UPSERT_RESERVATION"),false);
  assert.equal(out.operations.some(x=>x.action==="UPSERT_LOGISTICS_PROJECTION"),false);
});

test("120: no signed contract or no verified payment => no GANHO",()=>{
  const noPayment=run120({
    customer_event_id:"e",commercial_stage:"FECHAMENTO",stage_version:7,operational_stage:"NOT_STARTED",human_lock:false,
    contract:{status:"signed"},payment:{payment_kind:"signal",human_status:"pending"}
  }).out;
  assert.equal(noPayment.status,"blocked");
  assert.equal(noPayment.operations.length,0);
  assert.ok(noPayment.blockers.includes("GANHO_REQUIRES_VERIFIED_SIGNAL_OR_FULL_PAYMENT"));

  const unsigned=run120({
    customer_event_id:"e",commercial_stage:"FECHAMENTO",stage_version:7,operational_stage:"NOT_STARTED",human_lock:false,
    contract:{status:"sent"},payment:{payment_kind:"signal",human_status:"verified"}
  }).out;
  assert.equal(unsigned.status,"blocked");
  assert.equal(unsigned.operations.length,0);
  assert.ok(unsigned.blockers.includes("GANHO_REQUIRES_SIGNED_CONTRACT"));
});

test("120: retry after canonical GANHO is a no-op/blocked plan, never duplicate win",()=>{
  const {out}=run120({
    customer_event_id:"e125",commercial_stage:"GANHO",stage_version:8,operational_stage:"PRE_EVENT",human_lock:false,
    contract:{status:"signed"},payment:{payment_kind:"signal",human_status:"verified"},
    reservation:{status:"confirmed"},logistics_projection:{card_id:"log-card"}
  });
  assert.equal(out.status,"blocked");
  assert.deepEqual(out.operations,[]);
});
