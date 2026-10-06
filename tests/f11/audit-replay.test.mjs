import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

function load(code){
  return JSON.parse(fs.readFileSync(
    new URL("../../n8n/workflows/f11/CM-WF-"+code+".lab.json",import.meta.url),
    "utf8"
  ));
}
function getNode(snapshot,name){
  const n=snapshot.nodes.find(x=>x.name===name);
  assert.ok(n,"missing node "+name);
  return n;
}
const s900=load("900");
const s910=load("910");
const n900=getNode(s900,"Evaluate Canonical Watchdog Findings");
const n910=getNode(s910,"Evaluate Replay and Shadow Cases");
const run900=(input)=>new Function("$json",n900.parameters.jsCode)(input).json;
const run910=(input)=>new Function("$json",n910.parameters.jsCode)(input).json;

function emptySnapshot(){
  return {
    overdue_followups:[],
    impossible_states:[],
    signed_payment_inconsistencies:[],
    invalid_wins:[],
    upcoming_logistics_blocked:[],
    delayed_deliveries:[],
    projection_drifts:[],
    open_dead_letters:[],
    duplicate_campaign_members:[],
    recurring_state_version_conflicts:[]
  };
}

test("900: clean snapshot produces no tasks and no auto-correction",()=>{
  const out=run900({now:"2026-10-06T02:45:00-03:00",snapshot:emptySnapshot()});
  assert.equal(out.status,"clean");
  assert.equal(out.counts.total,0);
  assert.deepEqual(out.operations,[]);
  assert.deepEqual(out.auto_corrections,[]);
});

test("900: canonical anomaly set produces prioritized human tasks only",()=>{
  const out=run900({
    now:"2026-10-06T02:45:00-03:00",
    snapshot:{
      overdue_followups:[{id:"f1",customer_event_id:"e1"}],
      impossible_states:[{id:"e2",customer_event_id:"e2",commercial_stage:"PRE_QUOTE",operational_stage:"EVENT_DAY"}],
      signed_payment_inconsistencies:[{id:"c3",customer_event_id:"e3",contract_status:"signed",payment_status:"missing"}],
      invalid_wins:[{id:"e4",customer_event_id:"e4",commercial_stage:"GANHO",contract_status:"sent"}],
      upcoming_logistics_blocked:[
        {id:"e5",customer_event_id:"e5",days_until_event:1},
        {id:"e6",customer_event_id:"e6",days_until_event:5}
      ],
      delayed_deliveries:[{id:"d7",customer_event_id:"e7"}],
      projection_drifts:[
        {id:"p8",customer_event_id:"e8",drift_status:"drifted"},
        {id:"p9",customer_event_id:"e9",drift_status:"error"}
      ],
      open_dead_letters:[{id:"dl10",customer_event_id:"e10"}],
      duplicate_campaign_members:[{id:"cm11",customer_event_id:"e11"}],
      recurring_state_version_conflicts:[{id:"e12",customer_event_id:"e12",count:4}]
    }
  });
  assert.equal(out.status,"findings");
  assert.deepEqual(out.counts,{critical:4,high:7,normal:1,low:0,total:12});
  assert.equal(out.findings.length,12);
  assert.equal(out.operations.length,12);
  assert.ok(out.operations.every(x=>x.action==="CREATE_HUMAN_TASK"));
  assert.ok(out.findings.every(x=>x.auto_correction_allowed===false));
  assert.deepEqual(out.auto_corrections,[]);
  assert.equal(out.operations.some(x=>/TRANSITION|UPDATE_CUSTOMER_EVENT|VERIFY_PAYMENT/.test(x.action)),false);
});

test("900: invalid GANHO and signed/payment incoherence are critical",()=>{
  const out=run900({
    snapshot:{
      ...emptySnapshot(),
      signed_payment_inconsistencies:[{id:"c1",customer_event_id:"e1"}],
      invalid_wins:[{id:"e2",customer_event_id:"e2"}]
    }
  });
  const priorities=Object.fromEntries(out.findings.map(x=>[x.reason_code,x.priority]));
  assert.equal(priorities.SIGNED_PAYMENT_STATE_INCOHERENT,"critical");
  assert.equal(priorities.GANHO_WITHOUT_CRITERIA,"critical");
});

test("900: event <=2 days with blocked logistics is critical; later is high",()=>{
  const out=run900({
    snapshot:{
      ...emptySnapshot(),
      upcoming_logistics_blocked:[
        {id:"e1",customer_event_id:"e1",days_until_event:2},
        {id:"e2",customer_event_id:"e2",days_until_event:3}
      ]
    }
  });
  const byRef=Object.fromEntries(out.findings.map(x=>[x.source_ref,x.priority]));
  assert.equal(byRef.e1,"critical");
  assert.equal(byRef.e2,"high");
});

test("900: dedupe keys are deterministic across repeated evaluation",()=>{
  const input={snapshot:{...emptySnapshot(),open_dead_letters:[{id:"dl1",customer_event_id:"e1"}]}};
  const a=run900(input);
  const b=run900(input);
  assert.equal(a.findings[0].dedupe_key,b.findings[0].dedupe_key);
  assert.equal(a.operations[0].payload.dedupe_key,b.operations[0].payload.dedupe_key);
});

function mixedReplay(){
  return {
    replay_run_id:"replay-1",
    cases:[
      {
        fixture:{
          id:"fx-pass",input_event_id:"ev1",customer_event_id:"e1",correlation_id:"c1",
          expected_ref:{
            action:{action:"RESPONDER_AGUARDAR_DECISAO"},
            state:{commercial_stage:"ORCAMENTO"},
            guard:{decision:"shadow",dispatchAllowed:false},
            answer_constraints:{
              response_required:true,must_include:["reserva"],
              must_not_include:["T1190"],max_chars:300,forbid_internal_tier:true
            }
          },
          context_snapshot:{commercial_stage:"ORCAMENTO"}
        },
        candidate:{
          action:{action:"RESPONDER_AGUARDAR_DECISAO"},
          state:{commercial_stage:"ORCAMENTO",stage_version:2},
          guard:{decision:"shadow",dispatchAllowed:false,blockers:["SEND_DISABLED"]},
          response:"A reserva da data acontece somente após contrato e sinal.",
          side_effects:[]
        }
      },
      {
        fixture:{
          id:"fx-fail",input_event_id:"ev2",customer_event_id:"e2",
          expected_ref:{
            action:{action:"HANDOFF_HUMANO"},
            state:{commercial_stage:"NEGOCIACAO"},
            answer_constraints:{must_not_include:["T1190"],forbid_internal_tier:true}
          }
        },
        candidate:{
          action:{action:"RESPONDER_DUVIDA"},
          state:{commercial_stage:"ORCAMENTO"},
          response:"Faixa T1190 liberada.",
          side_effects:["whatsapp_send"]
        }
      },
      {
        fixture:{
          id:"fx-review",input_event_id:"ev3",customer_event_id:"e3",
          expected_ref:{action:{action:"CREATE_HUMAN_TASK"},review_required:true}
        },
        candidate:{action:{action:"CREATE_HUMAN_TASK"},side_effects:[]}
      },
      {
        fixture:{id:"fx-none",input_event_id:"ev4",customer_event_id:"e4"},
        candidate:{action:{action:"NOOP"},side_effects:[]}
      }
    ]
  };
}

test("910: mixed corpus produces pass/fail/review/not_evaluated summary",()=>{
  const out=run910(mixedReplay());
  assert.equal(out.status,"fail");
  assert.deepEqual(out.summary,{pass:1,fail:1,review:1,not_evaluated:1,total:4});
  assert.equal(out.side_effects_executed,false);
  assert.equal(out.operations.length,4);
  assert.ok(out.operations.every(x=>x.action==="RECORD_SHADOW_EVALUATION"));
});

test("910: passing case supports state/guard subset and answer constraints",()=>{
  const out=run910(mixedReplay());
  const pass=out.evaluations.find(x=>x.fixture_id==="fx-pass");
  assert.equal(pass.verdict,"pass");
  assert.equal(pass.metrics.checks_failed,0);
  assert.equal(pass.metrics.pass_rate,1);
  assert.ok(pass.checks.some(x=>x.name==="state_match" && x.pass));
  assert.ok(pass.checks.some(x=>x.name==="guard_match" && x.pass));
});

test("910: any replay side effect is a hard failure",()=>{
  const out=run910({
    replay_run_id:"side-effect-test",
    cases:[{
      fixture:{id:"fx",expected_ref:{action:{action:"NOOP"}}},
      candidate:{action:{action:"NOOP"},side_effects:["trello_move"]}
    }]
  });
  assert.equal(out.summary.fail,1);
  assert.equal(out.evaluations[0].verdict,"fail");
  assert.ok(out.evaluations[0].checks.some(x=>x.name==="zero_side_effects" && !x.pass));
  assert.equal(out.side_effects_executed,false);
});

test("910: internal tier and wrong action/state are independently observable failures",()=>{
  const out=run910(mixedReplay());
  const fail=out.evaluations.find(x=>x.fixture_id==="fx-fail");
  assert.equal(fail.verdict,"fail");
  const failedNames=fail.checks.filter(x=>!x.pass).map(x=>x.name);
  assert.ok(failedNames.includes("action_match"));
  assert.ok(failedNames.includes("state_match"));
  assert.ok(failedNames.includes("forbid_internal_tier"));
  assert.ok(failedNames.includes("zero_side_effects"));
});

test("910: case without expected reference is not_evaluated when side-effect free",()=>{
  const out=run910(mixedReplay());
  const item=out.evaluations.find(x=>x.fixture_id==="fx-none");
  assert.equal(item.verdict,"not_evaluated");
  assert.equal(item.metrics.side_effect_count,0);
});

test("910: output fields map directly to audit.shadow_evaluations contract",()=>{
  const out=run910(mixedReplay());
  for(const op of out.operations){
    assert.equal(op.action,"RECORD_SHADOW_EVALUATION");
    assert.ok(["pass","fail","review","not_evaluated"].includes(op.verdict));
    assert.ok(Object.prototype.hasOwnProperty.call(op,"candidate_action"));
    assert.ok(Object.prototype.hasOwnProperty.call(op,"candidate_response"));
    assert.ok(Object.prototype.hasOwnProperty.call(op,"expected_ref"));
    assert.ok(Object.prototype.hasOwnProperty.call(op,"metrics"));
    assert.ok(Object.prototype.hasOwnProperty.call(op,"context_snapshot"));
  }
});
