import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  resolveLocality,
  evaluateDatePolicy,
  evaluateQuoteReadiness,
  calculateQuote,
} from "../../src/functions/f2/index.mjs";

const adapterCode = fs.readFileSync(
  new URL("../../n8n/generated/f2-quote-kernel.generated.js", import.meta.url),
  "utf8"
);
const executeAdapter = new Function("$json", adapterCode);

const RULES = {
  version: "2026-10-05",
  cardSurchargeRate: 0.18,
  cardRoundUpMultiple: 10,
  comboSecondMainDiscountRate: 0.50,
};

const LOCALITIES = [
  { id:"l1", canonical_name:"mogi das cruzes", normalized_name:"mogi das cruzes", pricing_tier_id:"T1190", status:"active" },
  { id:"l2", canonical_name:"jundiaí", normalized_name:"jundiai", pricing_tier_id:"T1690", status:"active" },
  { id:"l3", canonical_name:"raposo tavares", normalized_name:"raposo tavares", pricing_tier_id:null, status:"human_required" },
];
const ALIASES = [
  { locality_id:"l1", alias:"Mogi", normalized_alias:"mogi" },
  { locality_id:"l2", alias:"Jundiai", normalized_alias:"jundiai" },
];

const TIERS = [
  { id:"T1190", code:"T1190", pix_base:1190 },
  { id:"T1690", code:"T1690", pix_base:1690 },
];

const MAIN = (code="cabine_fotos") => ({code,category:"main",quoteableAutomatically:true,quantity:1});
const PANEL = {code:"painel_fotografico_2x1",category:"addon",quoteableAutomatically:false,quantity:1};

function direct(input) {
  const facts=input.facts??{};
  const services=input.services??[];
  const localityResult=resolveLocality({input:facts.locality,localities:input.localities??[],aliases:input.locality_aliases??[]});
  const readiness=evaluateQuoteReadiness({facts,localityResult,services,ruleSetAvailable:Boolean(input.rule_set)});
  if(!readiness.ready) return {status:readiness.status,localityResult,readiness,datePolicy:null,quoteResult:null};
  const datePolicy=evaluateDatePolicy({eventDate:facts.event_date,referenceDate:input.reference_date,eventType:facts.event_type});
  if(datePolicy.status!=="ok") return {status:"blocked",localityResult,readiness,datePolicy,quoteResult:null};
  const tierId=localityResult.locality?.pricingTierId??null;
  const tier=(input.pricing_tiers??[]).find(x=>String(x.id??x.code??"")===String(tierId))??null;
  const quoteResult=calculateQuote({tier,services,ruleSet:input.rule_set,datePolicy,sameEventDateTime:input.same_event_date_time??true});
  return {status:quoteResult.status,localityResult,readiness,datePolicy,quoteResult};
}

function compare(input) {
  const actual=executeAdapter(input).json;
  const expected=direct(input);
  assert.equal(actual.status,expected.status);
  assert.deepEqual(actual.locality_result,expected.localityResult);
  assert.deepEqual(actual.readiness,expected.readiness);
  assert.deepEqual(actual.date_policy,expected.datePolicy);
  assert.deepEqual(actual.quote_result,expected.quoteResult);
}

test("adapter: normal quote parity",()=>compare({
  facts:{service_interest:["cabine_fotos"],event_date:"2027-01-10",locality:"Mogi",event_type:"aniversário"},
  localities:LOCALITIES,locality_aliases:ALIASES,pricing_tiers:TIERS,
  services:[MAIN()],rule_set:RULES,reference_date:"2026-10-05"
}));

test("adapter: combo+promo parity",()=>compare({
  facts:{service_interest:["cabine_fotos","plataforma_360"],event_date:"2026-11-04",locality:"Mogi das Cruzes",event_type:"casamento"},
  localities:LOCALITIES,locality_aliases:ALIASES,pricing_tiers:TIERS,
  services:[MAIN(),MAIN("plataforma_360")],rule_set:RULES,reference_date:"2026-10-05"
}));

test("adapter: São Paulo generic parity",()=>compare({
  facts:{service_interest:["cabine_fotos"],event_date:"2027-01-10",locality:"São Paulo",event_type:"aniversário"},
  localities:LOCALITIES,locality_aliases:ALIASES,pricing_tiers:TIERS,
  services:[MAIN()],rule_set:RULES,reference_date:"2026-10-05"
}));

test("adapter: Raposo Tavares human parity",()=>compare({
  facts:{service_interest:["cabine_fotos"],event_date:"2027-01-10",locality:"Raposo Tavares",event_type:"aniversário"},
  localities:LOCALITIES,locality_aliases:ALIASES,pricing_tiers:TIERS,
  services:[MAIN()],rule_set:RULES,reference_date:"2026-10-05"
}));

test("adapter: missing addon price parity",()=>compare({
  facts:{service_interest:["cabine_fotos","painel_fotografico_2x1"],event_date:"2027-01-10",locality:"Mogi",event_type:"aniversário"},
  localities:LOCALITIES,locality_aliases:ALIASES,pricing_tiers:TIERS,
  services:[MAIN(),PANEL],rule_set:RULES,reference_date:"2026-10-05"
}));

for (const [id,pix,card] of [
  ["T1190",1190,1410],
  ["T1690",1690,2000],
]) {
  test("adapter matrix "+id,()=>{
    const input={
      facts:{service_interest:["cabine_fotos"],event_date:"2027-01-10",locality:id==="T1190"?"Mogi":"Jundiaí",event_type:"aniversário"},
      localities:LOCALITIES,locality_aliases:ALIASES,pricing_tiers:TIERS,
      services:[MAIN()],rule_set:RULES,reference_date:"2026-10-05"
    };
    const actual=executeAdapter(input).json;
    assert.deepEqual(actual.quote_result.customerVisible,{pix,card});
    compare(input);
  });
}
