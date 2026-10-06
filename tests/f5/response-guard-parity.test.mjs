import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { evaluateResponseGuard } from "../../src/functions/f2/index.mjs";

const code=fs.readFileSync(
  new URL("../../n8n/generated/f2-response-guard.generated.js",import.meta.url),
  "utf8"
);
const execute=new Function("$json",code);

function compare(input){
  const actual=execute(input).json;
  const expected=evaluateResponseGuard({
    humanLock:Boolean(input.humanLock??input.human_lock),
    actionAuthorized:Boolean(input.actionAuthorized??input.action_authorized),
    candidateText:input.candidateText??input.candidate_text??"",
    claimedPrices:input.claimedPrices??input.claimed_prices??null,
    quoteResult:input.quoteResult??input.quote_result??null,
    availabilityClaim:input.availabilityClaim??input.availability_claim??"none",
    reservationConfirmed:Boolean(input.reservationConfirmed??input.reservation_confirmed),
    askedFactKeys:input.askedFactKeys??input.asked_fact_keys??[],
    currentFacts:input.currentFacts??input.current_facts??{},
    containsPii:Boolean(input.containsPii??input.contains_pii),
    containsSecret:Boolean(input.containsSecret??input.contains_secret),
    allowedLinks:input.allowedLinks??input.allowed_links??[],
    whatsappWindowOpen:Boolean(input.whatsappWindowOpen??input.whatsapp_window_open),
    isCampaign:Boolean(input.isCampaign??input.is_campaign),
    campaignApproved:Boolean(input.campaignApproved??input.campaign_approved),
    sendEnabled:false
  });
  assert.deepEqual(actual,expected);
  assert.equal(actual.dispatchAllowed,false);
  return actual;
}

test("061 parity: valid candidate stays shadow",()=>{
  const out=compare({
    actionAuthorized:true,
    candidateText:"PIX R$ 1.190 e cartão R$ 1.410",
    claimedPrices:{pix:1190,card:1410},
    quoteResult:{customerVisible:{pix:1190,card:1410}},
    whatsappWindowOpen:true
  });
  assert.equal(out.decision,"shadow");
});

test("061 parity: price mismatch denies",()=>{
  const out=compare({
    actionAuthorized:true,
    candidateText:"PIX R$ 1.000 e cartão R$ 1.180",
    claimedPrices:{pix:1000,card:1180},
    quoteResult:{customerVisible:{pix:1190,card:1410}},
    whatsappWindowOpen:true
  });
  assert.ok(out.blockers.includes("PRICE_MISMATCH"));
});

test("061 parity: internal tier denies",()=>{
  const out=compare({
    actionAuthorized:true,
    candidateText:"Faixa T1190",
    whatsappWindowOpen:true
  });
  assert.ok(out.blockers.includes("INTERNAL_TIER_EXPOSED"));
});

test("061 parity: human lock routes human",()=>{
  const out=compare({
    humanLock:true,
    actionAuthorized:true,
    candidateText:"Olá",
    whatsappWindowOpen:true
  });
  assert.equal(out.decision,"human");
});

test("061 parity: definitive availability without reservation denies",()=>{
  const out=compare({
    actionAuthorized:true,
    candidateText:"Sua data está garantida",
    availabilityClaim:"definitive",
    reservationConfirmed:false,
    whatsappWindowOpen:true
  });
  assert.ok(out.blockers.includes("DEFINITIVE_AVAILABILITY_NOT_ALLOWED"));
});

test("061 parity: known fact cannot be asked again",()=>{
  const out=compare({
    actionAuthorized:true,
    candidateText:"Qual a data?",
    askedFactKeys:["event_date"],
    currentFacts:{event_date:"2027-01-10"},
    whatsappWindowOpen:true
  });
  assert.ok(out.blockers.includes("REPEATED_KNOWN_FACT:event_date"));
});

test("061 parity: outside WhatsApp window blocks free message",()=>{
  const out=compare({
    actionAuthorized:true,
    candidateText:"Oi",
    whatsappWindowOpen:false
  });
  assert.ok(out.blockers.includes("WHATSAPP_WINDOW_CLOSED"));
});
