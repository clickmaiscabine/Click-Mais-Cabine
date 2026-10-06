import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { evaluateModuleReadiness } from "../../src/functions/f2/index.mjs";

function load(code){
  return JSON.parse(fs.readFileSync(
    new URL("../../n8n/workflows/f9/CM-WF-"+code+".lab.json",import.meta.url),"utf8"
  ));
}
function getNode(snapshot,name){
  const n=snapshot.nodes.find(x=>x.name===name);
  assert.ok(n,"missing "+name);
  return n;
}
function runSimple(node,input){ return new Function("$json",node.parameters.jsCode)(input).json; }
function mockNodes(values){ return (name)=>({item:{json:values[name]}}); }

const s160=load("160"), s170=load("170");
const p160=getNode(s160,"Prepare Delivery Readiness");
const r160=getNode(s160,"Run F2 Delivery Readiness");
const plan160=getNode(s160,"Plan OneDrive Delivery");
const p170=getNode(s170,"Prepare Post-sale Readiness");
const r170=getNode(s170,"Run F2 Post-sale Readiness");
const plan170=getNode(s170,"Plan Post-sale and Consent");

test("160/170 readiness adapters are exact generated artifacts",()=>{
  assert.equal(r160.parameters.jsCode,fs.readFileSync(new URL("../../n8n/generated/f2-delivery-readiness.generated.js",import.meta.url),"utf8"));
  assert.equal(r170.parameters.jsCode,fs.readFileSync(new URL("../../n8n/generated/f2-post-sale-readiness.generated.js",import.meta.url),"utf8"));
});

function run160(input){
  const prep=runSimple(p160,input);
  const readiness=runSimple(r160,prep);
  const out=new Function("$json","$",plan160.parameters.jsCode)(
    readiness,mockNodes({"Receive Delivery Context":input})
  ).json;
  return {prep,readiness,out};
}
function run170(input){
  const prep=runSimple(p170,input);
  const readiness=runSimple(r170,prep);
  const out=new Function("$json","$",plan170.parameters.jsCode)(
    readiness,mockNodes({"Receive Post-sale Context":input})
  ).json;
  return {prep,readiness,out};
}

test("AT-036: event_completed without OneDrive link stays pending and never invents URL",()=>{
  const {out}=run160({
    trigger_type:"event_completed",customer_event_id:"e1",source_event_id:"event-completed",existing_delivery:null
  });
  assert.equal(out.status,"adapter_required");
  assert.equal(out.operations.some(x=>x.action==="REQUEST_ONEDRIVE_LOOKUP"),true);
  assert.equal(out.operations.some(x=>x.share_url),false);
  assert.ok(out.blockers.includes("ONEDRIVE_ADAPTER_NOT_CONNECTED"));
});
test("AT-036: OneDrive not found creates human task with no link",()=>{
  const {out}=run160({
    trigger_type:"onedrive_lookup",customer_event_id:"e2",existing_delivery:{id:"d2",status:"pending"},
    onedrive_lookup:{status:"not_found",provider:"onedrive",folder_ref:null,share_url:null}
  });
  assert.equal(out.status,"pending_human");
  assert.equal(out.operations.some(x=>x.action==="CREATE_HUMAN_TASK"),true);
  const delivery=out.operations.find(x=>x.action==="UPSERT_DELIVERY");
  assert.equal(delivery.share_url,null);
});
test("160 found canonical link becomes ready_shadow, never sent automatically",()=>{
  const {out}=run160({
    trigger_type:"onedrive_lookup",customer_event_id:"e3",existing_delivery:{id:"d3",status:"pending"},
    onedrive_lookup:{status:"found",provider:"onedrive",folder_ref:"onedrive://folder/e3",share_url:"https://1drv.ms/f/x"}
  });
  assert.equal(out.status,"ready_shadow");
  assert.ok(out.blockers.includes("SEND_DISABLED"));
  assert.equal(out.operations.find(x=>x.action==="UPSERT_DELIVERY").status,"ready");
  assert.equal(out.operations.some(x=>x.action==="UPDATE_DELIVERY_STATUS" && x.to_status==="sent"),false);
});
test("160 sent requires dispatch success of the exact canonical link",()=>{
  const mismatch=run160({
    trigger_type:"dispatch_success",customer_event_id:"e4",
    existing_delivery:{id:"d4",status:"ready",share_url:"https://1drv.ms/f/good"},
    dispatched_share_url:"https://example.com/wrong"
  }).out;
  assert.equal(mismatch.status,"blocked");
  assert.ok(mismatch.blockers.includes("DELIVERY_LINK_MISMATCH"));

  const ok=run160({
    trigger_type:"dispatch_success",customer_event_id:"e4",
    existing_delivery:{id:"d4",status:"ready",share_url:"https://1drv.ms/f/good"},
    dispatched_share_url:"https://1drv.ms/f/good"
  }).out;
  assert.equal(ok.status,"sent");
  assert.equal(ok.operations.some(x=>x.event_type==="delivery_link_sent"),true);
});
test("160 confirmation closes delivery only after sent and retry is no-op",()=>{
  const early=run160({
    trigger_type:"customer_confirmation",customer_event_id:"e5",
    existing_delivery:{id:"d5",status:"ready",share_url:"https://1drv.ms/f/x"}
  }).out;
  assert.equal(early.status,"blocked");

  const confirmed=run160({
    trigger_type:"customer_confirmation",customer_event_id:"e5",
    existing_delivery:{id:"d5",status:"sent",share_url:"https://1drv.ms/f/x"}
  }).out;
  assert.equal(confirmed.status,"confirmed");
  assert.equal(confirmed.module_readiness.ready,true);
  assert.equal(confirmed.operations.some(x=>x.event_type==="delivery_confirmed"),true);

  const retry=run160({
    trigger_type:"customer_confirmation",customer_event_id:"e5",
    existing_delivery:{id:"d5",status:"confirmed",share_url:"https://1drv.ms/f/x"}
  }).out;
  assert.equal(retry.status,"no_action");
  assert.deepEqual(retry.operations,[]);
});
test("160 readiness parity matches F2 for sent/confirmed",()=>{
  const sent=run160({trigger_type:"event_completed",customer_event_id:"x",existing_delivery:{status:"sent"}}).readiness;
  assert.deepEqual(sent,evaluateModuleReadiness("delivery",{linkSent:true,confirmationPolicySatisfied:false}));
  const confirmed=run160({trigger_type:"event_completed",customer_event_id:"x",existing_delivery:{status:"confirmed"}}).readiness;
  assert.deepEqual(confirmed,evaluateModuleReadiness("delivery",{linkSent:true,confirmationPolicySatisfied:true}));
});

test("170 review request only begins after confirmed delivery and remains shadow",()=>{
  const bad=run170({trigger_type:"delivery_confirmed",customer_event_id:"e",delivery_status:"sent",actions_completed_or_skipped:false}).out;
  assert.equal(bad.status,"blocked");
  const ok=run170({trigger_type:"delivery_confirmed",customer_event_id:"e",delivery_status:"confirmed",actions_completed_or_skipped:false}).out;
  assert.equal(ok.status,"planned_shadow");
  assert.ok(ok.blockers.includes("SEND_DISABLED"));
  assert.equal(ok.operations.some(x=>x.response_action==="COMPOSE_REVIEW_REQUEST"),true);
});
test("AT-037: publication request without explicit consent is denied",()=>{
  const out=run170({
    trigger_type:"publication_request",customer_event_id:"e",delivery_status:"confirmed",
    publication_consent:null,actions_completed_or_skipped:false
  }).out;
  assert.equal(out.status,"denied");
  assert.ok(out.blockers.includes("PUBLICATION_CONSENT_REQUIRED"));
  assert.equal(out.operations.length,0);
});
test("170 negative consent suppresses publication and never changes delivery",()=>{
  const out=run170({
    trigger_type:"publication_consent_received",customer_event_id:"e",delivery_status:"confirmed",
    publication_consent:{channel:"facebook",consent:false,source_type:"customer",source_ref:"m1"},
    actions_completed_or_skipped:false
  }).out;
  assert.equal(out.status,"suppressed");
  assert.equal(out.delivery_affected,false);
  assert.equal(out.operations.some(x=>x.action==="SUPPRESS_PUBLICATION"),true);
  assert.equal(out.operations.some(x=>/DELIVERY/.test(x.action)),false);
});
test("170 positive consent only makes publication adapter eligible, never publishes in LAB",()=>{
  const consent={channel:"facebook",consent:true,source_type:"customer",source_ref:"m2"};
  const recorded=run170({
    trigger_type:"publication_consent_received",customer_event_id:"e",delivery_status:"confirmed",
    publication_consent:consent,actions_completed_or_skipped:false
  }).out;
  assert.equal(recorded.status,"consent_recorded");
  assert.equal(recorded.delivery_affected,false);

  const request=run170({
    trigger_type:"publication_request",customer_event_id:"e",delivery_status:"confirmed",
    publication_consent:consent,actions_completed_or_skipped:false
  }).out;
  assert.equal(request.status,"adapter_required");
  assert.ok(request.blockers.includes("PUBLICATION_ADAPTER_NOT_CONNECTED"));
  assert.equal(request.operations[0].action,"REQUEST_AUTHORIZED_PUBLICATION_ADAPTER");
});
test("170 post-sale completes only when actions are completed or explicitly skipped",()=>{
  const blocked=run170({
    trigger_type:"post_sale_complete",customer_event_id:"e",delivery_status:"confirmed",actions_completed_or_skipped:false
  });
  assert.deepEqual(blocked.readiness,evaluateModuleReadiness("post_sale",{actionsCompletedOrSkipped:false}));
  assert.equal(blocked.out.status,"blocked");

  const done=run170({
    trigger_type:"post_sale_complete",customer_event_id:"e",delivery_status:"confirmed",actions_completed_or_skipped:true
  });
  assert.deepEqual(done.readiness,evaluateModuleReadiness("post_sale",{actionsCompletedOrSkipped:true}));
  assert.equal(done.out.status,"completed");
  assert.equal(done.out.operations.some(x=>x.event_type==="post_sale_completed"),true);
});
