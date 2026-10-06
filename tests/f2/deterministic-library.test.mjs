import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveLocality,
  evaluateDatePolicy,
  evaluateFollowupPolicy,
  calculateQuote,
  evaluateQuoteReadiness,
  evaluateModuleReadiness,
  guardCommercialTransition,
  guardOperationalTransition,
  guardPaymentVerification,
  guardEventDateChange,
  requiresHumanLock,
  buildMetaIdempotencyKey,
  buildQuoteFingerprint,
  buildActionId,
  evaluateResponseGuard,
  containsInternalTier,
} from "../../src/functions/f2/index.mjs";

const RULES = {
  version: "2026-10-05",
  cardSurchargeRate: 0.18,
  cardRoundUpMultiple: 10,
  comboSecondMainDiscountRate: 0.50,
};

const MAIN = (code="cabine_fotos") => ({
  code,
  category: "main",
  quoteableAutomatically: true,
  quantity: 1,
});

const ALBUM = {
  code: "album_assinaturas",
  category: "addon",
  quoteableAutomatically: true,
  fixedPix: 300,
  quantity: 1,
};

const PANEL = {
  code: "painel_fotografico_2x1",
  category: "addon",
  quoteableAutomatically: false,
  quantity: 1,
};

const LOCALITIES = [
  { id:"l1", canonical_name:"mogi das cruzes", normalized_name:"mogi das cruzes", pricing_tier_id:"p1190", status:"active" },
  { id:"l2", canonical_name:"jundiaí", normalized_name:"jundiai", pricing_tier_id:"p1690", status:"active" },
  { id:"l3", canonical_name:"raposo tavares", normalized_name:"raposo tavares", pricing_tier_id:null, status:"human_required" },
];
const ALIASES = [
  { locality_id:"l1", alias:"Mogi", normalized_alias:"mogi" },
  { locality_id:"l2", alias:"Jundiai", normalized_alias:"jundiai" },
];

test("locality: accent/case normalization resolves canonical", () => {
  const r=resolveLocality({input:"MOGI DAS CRUZES",localities:LOCALITIES,aliases:ALIASES});
  assert.equal(r.status,"resolved");
  assert.equal(r.locality.localityId,"l1");
});

test("locality: alias resolves", () => {
  const r=resolveLocality({input:"meu evento será em Mogi",localities:LOCALITIES,aliases:ALIASES});
  assert.equal(r.status,"resolved");
  assert.equal(r.locality.canonicalName,"mogi das cruzes");
});

test("AT-004: São Paulo genérico pede região sem lock", () => {
  const r=resolveLocality({input:"São Paulo",localities:LOCALITIES,aliases:ALIASES});
  assert.equal(r.status,"needs_region");
  assert.equal(r.humanLock,false);
  assert.equal(r.reasonCode,"SAO_PAULO_GENERIC");
});

test("AT-005: Raposo Tavares exige humano", () => {
  const r=resolveLocality({input:"Raposo Tavares",localities:LOCALITIES,aliases:ALIASES});
  assert.equal(r.status,"human_required");
  assert.equal(r.humanLock,true);
});

test("AT-003: localidade desconhecida nunca recebe preço", () => {
  const r=resolveLocality({input:"Cidade Inexistente",localities:LOCALITIES,aliases:ALIASES});
  assert.equal(r.status,"human_required");
  assert.equal(r.reasonCode,"LOCALITY_UNKNOWN");
});

test("duas localidades na mesma entrada ficam ambíguas", () => {
  const r=resolveLocality({input:"Mogi das Cruzes ou Jundiaí",localities:LOCALITIES,aliases:ALIASES});
  assert.equal(r.status,"human_required");
  assert.equal(r.reasonCode,"LOCALITY_AMBIGUOUS");
});

test("AT-006: promoção exatamente 30 dias", () => {
  const r=evaluateDatePolicy({referenceDate:"2026-10-05",eventDate:"2026-11-04",eventType:"aniversário"});
  assert.equal(r.window,"SHORT_TERM_PROMO");
  assert.equal(r.automaticPixDiscountPerMain,190);
});

test("AT-007: 31 dias = preço normal + followup 23h sem desconto", () => {
  const r=evaluateDatePolicy({referenceDate:"2026-10-05",eventDate:"2026-11-05",eventType:"aniversário"});
  assert.equal(r.window,"D31_60");
  assert.equal(r.automaticPixDiscountPerMain,0);
  assert.equal(r.followupDelayHours,23);
});

test("AT-033: brinde só >4 meses e tipo autorizado", () => {
  const exact=evaluateDatePolicy({referenceDate:"2026-10-05",eventDate:"2027-02-05",eventType:"casamento"});
  const after=evaluateDatePolicy({referenceDate:"2026-10-05",eventDate:"2027-02-06",eventType:"casamento"});
  const wrong=evaluateDatePolicy({referenceDate:"2026-10-05",eventDate:"2027-03-01",eventType:"corporativo"});
  assert.equal(exact.gift.eligible,false);
  assert.equal(after.gift.eligible,true);
  assert.equal(after.gift.serviceCode,"album_assinaturas");
  assert.equal(wrong.gift.eligible,false);
});

const PRICE_MATRIX=[
  ["T1190",1190,1410,1785,2110,1000,1180,1500,1770],
  ["T1290",1290,1530,1935,2290,1100,1300,1650,1950],
  ["T1390",1390,1650,2085,2470,1200,1420,1800,2130],
  ["T1490",1490,1760,2235,2640,1300,1540,1950,2310],
  ["T1590",1590,1880,2385,2820,1400,1660,2100,2480],
  ["T1690",1690,2000,2535,3000,1500,1770,2250,2660],
  ["T1790",1790,2120,2685,3170,1600,1890,2400,2840],
  ["T1890",1890,2240,2835,3350,1700,2010,2550,3010],
];

for (const [code,pix,card,comboPix,comboCard,promoPix,promoCard,comboPromoPix,comboPromoCard] of PRICE_MATRIX) {
  test(`pricing matrix ${code}`, () => {
    const tier={code,pix_base:pix};
    const normal=calculateQuote({tier,services:[MAIN()],ruleSet:RULES});
    const combo=calculateQuote({tier,services:[MAIN("cabine_fotos"),MAIN("plataforma_360")],ruleSet:RULES});
    const promo=calculateQuote({
      tier,services:[MAIN()],ruleSet:RULES,
      datePolicy:{automaticPixDiscountPerMain:190},
    });
    const comboPromo=calculateQuote({
      tier,services:[MAIN("cabine_fotos"),MAIN("plataforma_360")],ruleSet:RULES,
      datePolicy:{automaticPixDiscountPerMain:190},
    });
    assert.deepEqual(normal.customerVisible,{pix,card});
    assert.deepEqual(combo.customerVisible,{pix:comboPix,card:comboCard});
    assert.deepEqual(promo.customerVisible,{pix:promoPix,card:promoCard});
    assert.deepEqual(comboPromo.customerVisible,{pix:comboPromoPix,card:comboPromoCard});
  });
}

test("álbum custa 300 e não recebe combo 50%", () => {
  const r=calculateQuote({tier:{pix_base:1190},services:[MAIN(),ALBUM],ruleSet:RULES});
  assert.equal(r.status,"ready");
  assert.equal(r.totals.pix,1490);
  const album=r.items.find(x=>x.serviceCode==="album_assinaturas");
  assert.equal(album.finalPix,300);
  assert.equal(album.comboDiscount,0);
});

test("AT-034: adicional sem preço automático exige humano", () => {
  const r=calculateQuote({tier:{pix_base:1190},services:[MAIN(),PANEL],ruleSet:RULES});
  assert.equal(r.status,"blocked");
  assert.equal(r.humanRequired,true);
  assert.ok(r.blockers.includes("SERVICE_PRICE_REQUIRES_HUMAN:painel_fotografico_2x1"));
});

test("pricing não inventa combinação de mais de 2 serviços principais", () => {
  const r=calculateQuote({tier:{pix_base:1190},services:[MAIN("a"),MAIN("b"),MAIN("c")],ruleSet:RULES});
  assert.equal(r.status,"human_required");
});

test("readiness exige service/date/locality/type", () => {
  const r=evaluateQuoteReadiness({
    facts:{service_interest:["cabine_fotos"],event_date:"2027-01-10",locality:"mogi das cruzes",event_type:"aniversario"},
    localityResult:{status:"resolved"},
    services:[MAIN()],
    ruleSetAvailable:true,
  });
  assert.equal(r.ready,true);
});

test("readiness não repete inferência quando falta fato", () => {
  const r=evaluateQuoteReadiness({
    facts:{service_interest:["cabine_fotos"],event_date:null,locality:"mogi das cruzes",event_type:"aniversario"},
    localityResult:{status:"resolved"},
    services:[MAIN()],
  });
  assert.equal(r.ready,false);
  assert.ok(r.blockers.includes("FACT_MISSING:event_date"));
});

test("module readiness respeita assinatura e pagamento verificado", () => {
  assert.equal(evaluateModuleReadiness("contract",{contractStatus:"signed"}).ready,true);
  assert.equal(evaluateModuleReadiness("payment",{paymentVerified:true,paymentKind:"signal"}).ready,true);
  assert.equal(evaluateModuleReadiness("payment",{paymentVerified:false,paymentKind:"signal"}).ready,false);
});

test("state: PRE_QUOTE só vira ORCAMENTO com quote_sent", () => {
  const denied=guardCommercialTransition({from:"PRE_QUOTE",to:"ORCAMENTO",quoteSent:false});
  const allowed=guardCommercialTransition({from:"PRE_QUOTE",to:"ORCAMENTO",quoteSent:true});
  assert.equal(denied.allowed,false);
  assert.equal(allowed.allowed,true);
});

test("AT-011/012: ORCAMENTO não pula para GANHO e contrato sem pagamento não ganha", () => {
  assert.equal(guardCommercialTransition({from:"ORCAMENTO",to:"GANHO"}).allowed,false);
  const r=guardCommercialTransition({
    from:"FECHAMENTO",to:"GANHO",contractStatus:"signed",
    paymentVerified:false,paymentKind:"signal",
  });
  assert.equal(r.allowed,false);
  assert.equal(r.reasonCode,"GANHO_REQUIRES_VERIFIED_SIGNAL_OR_FULL_PAYMENT");
});

test("AT-013: FECHAMENTO vira GANHO só com signed + signal/full verified", () => {
  const r=guardCommercialTransition({
    from:"FECHAMENTO",to:"GANHO",contractStatus:"signed",
    paymentVerified:true,paymentKind:"signal",
  });
  assert.equal(r.allowed,true);
});

test("PERDIDO não volta direto para GANHO", () => {
  const r=guardCommercialTransition({from:"PERDIDO",to:"GANHO",contractStatus:"signed",paymentVerified:true,paymentKind:"full"});
  assert.equal(r.allowed,false);
});

test("PERDIDO não pode nascer de silêncio", () => {
  const r=guardCommercialTransition({from:"ORCAMENTO",to:"PERDIDO",lossReasonType:"silence"});
  assert.equal(r.allowed,false);
});

test("AT-038 primitive: conflito de versão pede reload/reevaluate", () => {
  const r=guardCommercialTransition({from:"ORCAMENTO",to:"RESPOSTA",expectedVersion:2,actualVersion:3});
  assert.equal(r.allowed,false);
  assert.equal(r.nextAction,"reload_reevaluate");
});

test("Trello não altera estado sem ator/guard válido", () => {
  const bad=guardCommercialTransition({from:"ORCAMENTO",to:"RESPOSTA",source:"trello",actorType:"human",trelloProjectionValid:false});
  const ok=guardCommercialTransition({from:"ORCAMENTO",to:"RESPOSTA",source:"trello",actorType:"human",trelloProjectionValid:true});
  assert.equal(bad.allowed,false);
  assert.equal(ok.allowed,true);
});

test("operacional: PRE_EVENT só nasce após GANHO", () => {
  assert.equal(guardOperationalTransition({from:"NOT_STARTED",to:"PRE_EVENT",commercialStage:"FECHAMENTO"}).allowed,false);
  assert.equal(guardOperationalTransition({from:"NOT_STARTED",to:"PRE_EVENT",commercialStage:"GANHO"}).allowed,true);
});

test("cancelamento com contrato exige humano", () => {
  const r=guardOperationalTransition({from:"PRE_EVENT",to:"CANCELLED",commercialStage:"GANHO",hasContract:true,humanAuthorized:false});
  assert.equal(r.allowed,false);
});

test("payment_verified é humano, nunca LLM/JEV", () => {
  assert.equal(guardPaymentVerification({actorType:"llm"}).allowed,false);
  assert.equal(guardPaymentVerification({actorType:"jev"}).allowed,false);
  assert.equal(guardPaymentVerification({actorType:"human"}).allowed,true);
});

test("AT-016: data muda pós-GANHO => human review", () => {
  const r=guardEventDateChange({commercialStage:"GANHO",humanAuthorized:false});
  assert.equal(r.decision,"human");
});

test("AT-009/010: desconto extra e proposta de preço ativam human lock", () => {
  assert.equal(requiresHumanLock("EXTRA_DISCOUNT"),true);
  assert.equal(requiresHumanLock("CUSTOMER_PRICE_PROPOSAL"),true);
  assert.equal(requiresHumanLock("BARGAIN"),true);
});

test("AT-021: Meta idempotency key é determinística", () => {
  assert.equal(
    buildMetaIdempotencyKey({phoneNumberId:"123",wamid:"abc"}),
    "meta:123:abc"
  );
});

test("AT-039: mesma quote input produz mesma fingerprint, mudança de fato muda hash", () => {
  const a=buildQuoteFingerprint({customerEventId:"evt",relevantFacts:{date:"2027-01-01",service:["a"]},ruleSetVersion:"v1"});
  const b=buildQuoteFingerprint({customerEventId:"evt",relevantFacts:{service:["a"],date:"2027-01-01"},ruleSetVersion:"v1"});
  const c=buildQuoteFingerprint({customerEventId:"evt",relevantFacts:{date:"2027-01-02",service:["a"]},ruleSetVersion:"v1"});
  assert.equal(a,b);
  assert.notEqual(a,c);
});

test("action id muda com state version", () => {
  const a=buildActionId({customerEventId:"evt",actionType:"SEND_QUOTE",stateVersion:1,sourceEventId:"m1"});
  const b=buildActionId({customerEventId:"evt",actionType:"SEND_QUOTE",stateVersion:2,sourceEventId:"m1"});
  assert.notEqual(a,b);
});

test("AT-032: follow-up automático no máximo 1, 23h e sem desconto", () => {
  const first=evaluateFollowupPolicy({automaticSentCount:0,commercialStage:"ORCAMENTO"});
  const second=evaluateFollowupPolicy({automaticSentCount:1,commercialStage:"ORCAMENTO"});
  assert.deepEqual(first,{action:"schedule",reasonCode:"FIRST_AUTOMATIC_FOLLOWUP",delayHours:23,discountAllowed:false});
  assert.equal(second.action,"none");
  assert.equal(second.discountAllowed,false);
});

test("human lock cancela/skip followup automático", () => {
  const r=evaluateFollowupPolicy({automaticSentCount:0,humanLock:true,commercialStage:"NEGOCIACAO"});
  assert.equal(r.action,"skip");
});

const QUOTE={customerVisible:{pix:1190,card:1410}};

test("AT-030: SEND=false gera shadow e zero dispatch", () => {
  const r=evaluateResponseGuard({
    actionAuthorized:true,
    candidateText:"PIX R$ 1.190 e cartão R$ 1.410",
    claimedPrices:{pix:1190,card:1410},
    quoteResult:QUOTE,
    whatsappWindowOpen:true,
    sendEnabled:false,
  });
  assert.equal(r.decision,"shadow");
  assert.equal(r.dispatchAllowed,false);
  assert.equal(r.eventType,"shadow_candidate_generated");
});

test("AT-031: faixa interna nunca passa pelo response guard", () => {
  assert.equal(containsInternalTier("Valor interno T1190"),true);
  const r=evaluateResponseGuard({
    actionAuthorized:true,candidateText:"Faixa T1190",whatsappWindowOpen:true,sendEnabled:false,
  });
  assert.ok(r.blockers.includes("INTERNAL_TIER_EXPOSED"));
});

test("response guard bloqueia preço diferente do QuoteResult", () => {
  const r=evaluateResponseGuard({
    actionAuthorized:true,candidateText:"PIX R$ 1.000",
    claimedPrices:{pix:1000,card:1180},quoteResult:QUOTE,
    whatsappWindowOpen:true,sendEnabled:false,
  });
  assert.ok(r.blockers.includes("PRICE_MISMATCH"));
});

test("response guard bloqueia disponibilidade definitiva antes da reserva", () => {
  const r=evaluateResponseGuard({
    actionAuthorized:true,candidateText:"Data garantida",
    availabilityClaim:"definitive",reservationConfirmed:false,
    whatsappWindowOpen:true,sendEnabled:false,
  });
  assert.ok(r.blockers.includes("DEFINITIVE_AVAILABILITY_NOT_ALLOWED"));
});

test("response guard bloqueia pergunta de fato já conhecido", () => {
  const r=evaluateResponseGuard({
    actionAuthorized:true,candidateText:"Qual é a data?",
    askedFactKeys:["event_date"],currentFacts:{event_date:"2027-01-10"},
    whatsappWindowOpen:true,sendEnabled:false,
  });
  assert.ok(r.blockers.includes("REPEATED_KNOWN_FACT:event_date"));
});

test("response guard bloqueia link fora da allowlist", () => {
  const r=evaluateResponseGuard({
    actionAuthorized:true,candidateText:"Veja https://evil.example/teste",
    allowedLinks:["https://clickmais-microsite.lia-regis.chatgpt.site"],
    whatsappWindowOpen:true,sendEnabled:false,
  });
  assert.ok(r.blockers.some(x=>x.startsWith("LINK_NOT_ALLOWED:")));
});

test("AT-023: human lock bloqueia dispatch", () => {
  const r=evaluateResponseGuard({
    humanLock:true,actionAuthorized:true,candidateText:"teste",
    whatsappWindowOpen:true,sendEnabled:true,
  });
  assert.equal(r.dispatchAllowed,false);
  assert.equal(r.decision,"human");
});
