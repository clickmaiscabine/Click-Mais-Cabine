import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

function load(code,nodeName){
  const snapshot=JSON.parse(fs.readFileSync(
    new URL("../../n8n/workflows/f5/CM-WF-"+code+".lab.json",import.meta.url),
    "utf8"
  ));
  const node=snapshot.nodes.find((item)=>item.name===nodeName);
  assert.ok(node,"missing node "+nodeName);
  return {snapshot,execute:new Function("$json",node.parameters.jsCode),jsCode:node.parameters.jsCode};
}

const decision=load("040","Validate Closed JEV Decision");
const handoff=load("050","Plan Human Handoff");
const composer=load("060","Compose Bounded Response");
const responseGuard=load("061","Run F2 Response Guard Shadow");

test("040: closed vocabulary normalizes documented alias without inventing action",()=>{
  const out=decision.execute({
    commercial_stage:"ORCAMENTO",
    message:"Quero contratar",
    jev_choice:"QUER_CONTRATAR"
  }).json;
  assert.equal(out.status,"ready");
  assert.equal(out.decision,"QUER_FECHAR");
  assert.deepEqual(out.next_action,{action:"REQUEST_CLOSING"});
});

test("040: discount request routes to human bargaining lock",()=>{
  const out=decision.execute({jev_choice:"PEDIU_DESCONTO"}).json;
  assert.equal(out.decision,"PEDIU_DESCONTO");
  assert.deepEqual(out.next_action,{action:"HANDOFF_HUMANO",reason_code:"BARGAIN",force_lock:true});
});

test("040: absent JEV result cannot be guessed",()=>{
  const out=decision.execute({commercial_stage:"ORCAMENTO",message:"hmm"}).json;
  assert.equal(out.status,"model_required");
  assert.equal(out.next_action,null);
  assert.ok(out.blockers.includes("JEV_NOT_CONNECTED"));
});

test("040: out-of-vocabulary JEV result fails closed",()=>{
  const out=decision.execute({jev_choice:"ALTERAR_PRECO"}).json;
  assert.equal(out.status,"human_required");
  assert.equal(out.next_action.action,"HANDOFF_HUMANO");
  assert.ok(out.blockers.includes("JEV_CHOICE_OUT_OF_VOCABULARY"));
});

test("050: canonical bargaining reason enables lock + task + cancels followups",()=>{
  const out=handoff.execute({
    customer_event_id:"e1",reason_code:"BARGAIN",force_lock:false,human_lock:false
  }).json;
  assert.equal(out.lock_required,true);
  assert.deepEqual(out.operations.map(x=>x.action),[
    "ENABLE_HUMAN_LOCK","CREATE_HUMAN_TASK","CANCEL_AUTOMATIC_FOLLOWUPS"
  ]);
});

test("050: general review can create task without over-locking",()=>{
  const out=handoff.execute({
    customer_event_id:"e2",reason_code:"GENERAL_REVIEW",force_lock:false,human_lock:false
  }).json;
  assert.equal(out.lock_required,false);
  assert.deepEqual(out.operations,[{action:"CREATE_HUMAN_TASK",reason_code:"GENERAL_REVIEW"}]);
});

test("060: unauthorized action never produces text",()=>{
  const out=composer.execute({action_authorized:false,action:"REQUEST_CLOSING"}).json;
  assert.equal(out.status,"blocked");
  assert.equal(out.candidate_text,null);
});

test("060: quote template keeps structured prices for downstream guard",()=>{
  const out=composer.execute({
    action_authorized:true,
    action:"COMPOSE_QUOTE_PRESENTATION",
    presentation:{customer_visible_prices:{pix:1500,card:1770},promotion_applied:true}
  }).json;
  assert.equal(out.status,"ready");
  assert.deepEqual(out.claimed_prices,{pix:1500,card:1770});
  assert.equal(out.availability_claim,"preliminary");
  assert.match(out.candidate_text,/PIX:/);
  assert.match(out.candidate_text,/CARTÃO:/);
});

test("060: one missing known fact produces one fixed question",()=>{
  const out=composer.execute({
    action_authorized:true,
    action:"ASK_ONE_CLARIFYING_QUESTION",
    missing_fact_key:"event_date"
  }).json;
  assert.equal(out.status,"ready");
  assert.equal(out.candidate_text,"Qual é a data do evento?");
  assert.deepEqual(out.asked_fact_keys,["event_date"]);
});

test("060: semantic FAQ without model credential stays pending, not fabricated",()=>{
  const out=composer.execute({
    action_authorized:true,
    action:"RESPONDER_DUVIDA",
    facts:{service_interest:["cabine_fotos"]}
  }).json;
  assert.equal(out.status,"model_required");
  assert.equal(out.candidate_text,null);
  assert.ok(out.blockers.includes("LLM_CREDENTIAL_NOT_CONNECTED"));
});

test("061 snapshot uses exactly the versioned F2 shadow adapter",()=>{
  const generated=fs.readFileSync(
    new URL("../../n8n/generated/f2-response-guard.generated.js",import.meta.url),
    "utf8"
  );
  assert.equal(responseGuard.jsCode,generated);
});

test("061: valid response is shadow only and cannot dispatch",()=>{
  const out=responseGuard.execute({
    action_authorized:true,
    candidate_text:"PIX R$ 1.190 e cartão R$ 1.410",
    claimed_prices:{pix:1190,card:1410},
    quote_result:{customerVisible:{pix:1190,card:1410}},
    whatsapp_window_open:true
  }).json;
  assert.equal(out.decision,"shadow");
  assert.equal(out.dispatchAllowed,false);
  assert.ok(out.blockers.includes("SEND_DISABLED"));
});
