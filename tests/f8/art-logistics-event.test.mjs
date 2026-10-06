import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  evaluateModuleReadiness,
  guardEventDateChange,
  guardOperationalTransition,
} from "../../src/functions/f2/index.mjs";

function load(code){
  return JSON.parse(fs.readFileSync(
    new URL("../../n8n/workflows/f8/CM-WF-"+code+".lab.json",import.meta.url),"utf8"
  ));
}
function getNode(snapshot,name){
  const n=snapshot.nodes.find(x=>x.name===name);
  assert.ok(n,"missing "+name);
  return n;
}
function runSimple(node,input){ return new Function("$json",node.parameters.jsCode)(input).json; }
function mockNodes(values){ return (name)=>({item:{json:values[name]}}); }

const s130=load("130"), s140=load("140"), s150=load("150");
const art=getNode(s130,"Plan Art Lifecycle");
const dateGuard=getNode(s140,"Run F2 Post-win Date Guard");
const prepLog=getNode(s140,"Prepare Logistics Readiness");
const logReady=getNode(s140,"Run F2 Logistics Readiness");
const planLog=getNode(s140,"Plan Logistics and Pre-event");
const prepOp=getNode(s150,"Prepare Operational Guard Input");
const opGuard=getNode(s150,"Run F2 Operational Guard");
const planOp=getNode(s150,"Plan Event Execution Transition");

test("140 adapters are exact generated artifacts",()=>{
  assert.equal(dateGuard.parameters.jsCode,fs.readFileSync(new URL("../../n8n/generated/f2-event-date-change-guard.generated.js",import.meta.url),"utf8"));
  assert.equal(logReady.parameters.jsCode,fs.readFileSync(new URL("../../n8n/generated/f2-logistics-readiness.generated.js",import.meta.url),"utf8"));
});
test("150 operational guard is exact generated artifact",()=>{
  assert.equal(opGuard.parameters.jsCode,fs.readFileSync(new URL("../../n8n/generated/f2-operational-transition-guard.generated.js",import.meta.url),"utf8"));
});

test("130 event_won creates art job only when required",()=>{
  const yes=runSimple(art,{trigger_type:"event_won",customer_event_id:"e1",art_required:true,current_art:null});
  assert.deepEqual(yes.operations.map(x=>x.action),["CREATE_ART_JOB","UPSERT_MODULE_STATE"]);
  const no=runSimple(art,{trigger_type:"event_won",customer_event_id:"e2",art_required:false,current_art:null});
  assert.equal(no.status,"not_applicable");
  assert.equal(no.operations[0].ready,true);
});
test("130 missing briefing blocks; valid briefing waits for production adapter",()=>{
  const bad=runSimple(art,{trigger_type:"briefing_received",customer_event_id:"e",current_art:{id:"a"},briefing_payload:null});
  assert.ok(bad.blockers.includes("ART_BRIEFING_MISSING"));
  const ok=runSimple(art,{trigger_type:"briefing_received",customer_event_id:"e",current_art:{id:"a"},briefing_payload:{theme:"x"}});
  assert.equal(ok.status,"adapter_required");
  assert.ok(ok.blockers.includes("ART_PRODUCTION_ADAPTER_NOT_CONNECTED"));
});
test("AT-035: art semantic choice is closed and customer approval is only pre_approved",()=>{
  const approved=runSimple(art,{trigger_type:"customer_message",customer_event_id:"e",current_art:{id:"a"},jev_choice:"APROVADA"});
  assert.equal(approved.status,"pre_approved");
  assert.equal(approved.operations[0].status,"pre_approved");
  assert.equal(approved.operations.some(x=>x.status==="final"),false);
  assert.equal(approved.operations.some(x=>x.task_type==="art_final_review"),true);

  const invalid=runSimple(art,{trigger_type:"customer_message",customer_event_id:"e",current_art:{id:"a"},jev_choice:"AUTO_APROVAR_FINAL"});
  assert.equal(invalid.status,"human_required");
  assert.ok(invalid.blockers.includes("ART_CHOICE_OUT_OF_VOCABULARY"));
});
test("130 no JEV result is model_required; no guessing",()=>{
  const out=runSimple(art,{trigger_type:"customer_message",customer_event_id:"e",current_art:{id:"a"}});
  assert.equal(out.status,"model_required");
  assert.deepEqual(out.allowed_choices,["approved","change_requested","question","undefined"]);
});
test("130 final art requires explicit human + final_ref",()=>{
  const agent=runSimple(art,{trigger_type:"human_finalize",customer_event_id:"e",current_art:{id:"a"},actor_type:"agent",final_ref:"x"});
  assert.equal(agent.status,"denied");
  const missing=runSimple(art,{trigger_type:"human_finalize",customer_event_id:"e",current_art:{id:"a"},actor_type:"human"});
  assert.equal(missing.status,"blocked");
  const human=runSimple(art,{trigger_type:"human_finalize",customer_event_id:"e",current_art:{id:"a"},actor_type:"human",final_ref:"final://1"});
  assert.equal(human.status,"final");
  assert.equal(human.operations.some(x=>x.event_type==="art_final"),true);
});

function run140(input){
  const dg=runSimple(dateGuard,{commercial_stage:input.commercial_stage,human_authorized:input.human_authorized});
  const prep=new Function("$json","$",prepLog.parameters.jsCode)(
    {},
    mockNodes({"Receive Logistics Context":input})
  ).json;
  const readiness=runSimple(logReady,prep);
  const out=new Function("$json","$",planLog.parameters.jsCode)(
    readiness,
    mockNodes({
      "Receive Logistics Context":input,
      "Run F2 Post-win Date Guard":dg,
      "Prepare Logistics Readiness":prep
    })
  ).json;
  return {dg,prep,readiness,out};
}
test("140 critical checklist matches F2 readiness and never moves Trello list",()=>{
  const input={trigger_type:"schedule_check",customer_event_id:"e",commercial_stage:"GANHO",human_authorized:false,
    checklist:[{code:"date",critical:true,status:"verified"},{code:"team",critical:true,status:"verified"}],external_blockers:[]};
  const {readiness,out}=run140(input);
  assert.deepEqual(readiness,evaluateModuleReadiness("logistics",{criticalChecklistReady:true,blockers:[]}));
  assert.equal(out.status,"ready");
  assert.equal(out.trello_move_allowed,false);
  assert.equal(out.operations.some(x=>x.move_list===true),false);
  assert.equal(out.operations.some(x=>x.event_type==="logistics_ready"),true);
});
test("140 incomplete/external blocker blocks logistics",()=>{
  const a=run140({trigger_type:"schedule_check",customer_event_id:"e",commercial_stage:"GANHO",human_authorized:false,
    checklist:[{code:"team",critical:true,status:"pending"}],external_blockers:[]}).out;
  assert.ok(a.blockers.includes("CHECKLIST_INCOMPLETE:team"));
  const b=run140({trigger_type:"schedule_check",customer_event_id:"e",commercial_stage:"GANHO",human_authorized:false,
    checklist:[{code:"team",critical:true,status:"verified"}],external_blockers:["VENUE_ACCESS_UNKNOWN"]}).out;
  assert.ok(b.blockers.includes("VENUE_ACCESS_UNKNOWN"));
});
test("140 post-win date change requires human unless explicitly authorized",()=>{
  const denied=run140({trigger_type:"date_changed",customer_event_id:"e",commercial_stage:"GANHO",human_authorized:false,
    checklist:[],external_blockers:[]});
  assert.deepEqual(denied.dg,guardEventDateChange({commercialStage:"GANHO",humanAuthorized:false}));
  assert.equal(denied.out.status,"human_required");
  assert.equal(denied.out.operations.some(x=>x.action==="ENABLE_HUMAN_LOCK"),true);
  assert.equal(denied.out.trello_move_allowed,false);

  const allowed=run140({trigger_type:"date_changed",customer_event_id:"e",commercial_stage:"GANHO",human_authorized:true,
    checklist:[],external_blockers:[]}).out;
  assert.equal(allowed.status,"planned");
  assert.equal(allowed.operations.some(x=>x.action==="REBUILD_LOGISTICS_CHECKLIST"),true);
  assert.equal(allowed.operations.some(x=>x.move_list===true),false);
});

function run150(input){
  const prepared=runSimple(prepOp,input);
  const guard=runSimple(opGuard,prepared);
  const out=new Function("$json","$",planOp.parameters.jsCode)(
    guard,mockNodes({"Receive Event Execution Action":input,"Prepare Operational Guard Input":prepared})
  ).json;
  return {prepared,guard,out};
}
test("150 valid operational sequence is strict",()=>{
  const cases=[
    ["mark_ready","PRE_EVENT","EVENT_READY"],
    ["start_event","EVENT_READY","EVENT_DAY"],
    ["finish_event","EVENT_DAY","POST_EVENT"],
    ["complete_cycle","POST_EVENT","COMPLETED"],
    ["suspend","PRE_EVENT","SUSPENDED"]
  ];
  for(const [action,from,to] of cases){
    const {guard,out}=run150({action,customer_event_id:"e",commercial_stage:"GANHO",operational_stage:from,stage_version:1,has_contract:true,actor_authorized:true,actor_type:"human"});
    assert.deepEqual(guard,guardOperationalTransition({from,to,commercialStage:"GANHO",hasContract:true,humanAuthorized:true}));
    assert.equal(out.status,"planned");
    assert.equal(out.target_operational_stage,to);
  }
});
test("150 finish_event emits event_completed but does not skip directly to COMPLETED",()=>{
  const {out}=run150({action:"finish_event",customer_event_id:"e",commercial_stage:"GANHO",operational_stage:"EVENT_DAY",stage_version:1,has_contract:true,actor_authorized:true,actor_type:"human"});
  assert.equal(out.target_operational_stage,"POST_EVENT");
  assert.equal(out.operations.some(x=>x.event_type==="event_completed"),true);
  assert.equal(out.operations.some(x=>x.to_stage==="COMPLETED"),false);
});
test("150 contracted cancellation requires human authority",()=>{
  const denied=run150({action:"cancel",customer_event_id:"e",commercial_stage:"GANHO",operational_stage:"PRE_EVENT",stage_version:1,has_contract:true,actor_authorized:true,actor_type:"agent"});
  assert.equal(denied.out.status,"denied");
  assert.ok(denied.out.blockers.includes("CONTRACTED_CANCEL_REQUIRES_HUMAN"));
  const allowed=run150({action:"cancel",customer_event_id:"e",commercial_stage:"GANHO",operational_stage:"PRE_EVENT",stage_version:1,has_contract:true,actor_authorized:true,actor_type:"human"});
  assert.equal(allowed.out.status,"planned");
  assert.equal(allowed.out.target_operational_stage,"CANCELLED");
});
test("150 cannot skip PRE_EVENT straight to EVENT_DAY",()=>{
  const {out}=run150({action:"start_event",customer_event_id:"e",commercial_stage:"GANHO",operational_stage:"PRE_EVENT",stage_version:1,has_contract:true,actor_authorized:true,actor_type:"human"});
  assert.equal(out.status,"denied");
  assert.ok(out.blockers.includes("OPERATIONAL_TRANSITION_NOT_ALLOWED"));
});
