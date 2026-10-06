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

const MATRIX = [
  ["T1190",1190,1410,1785,2110,1000,1180,1500,1770],
  ["T1290",1290,1530,1935,2290,1100,1300,1650,1950],
  ["T1390",1390,1650,2085,2470,1200,1420,1800,2130],
  ["T1490",1490,1760,2235,2640,1300,1540,1950,2310],
  ["T1590",1590,1880,2385,2820,1400,1660,2100,2480],
  ["T1690",1690,2000,2535,3000,1500,1770,2250,2660],
  ["T1790",1790,2120,2685,3170,1600,1890,2400,2840],
  ["T1890",1890,2240,2835,3350,1700,2010,2550,3010],
];

const LOCALITIES = MATRIX.map(([code]) => ({
  id:"loc-"+code,
  canonical_name:"localidade "+code.toLowerCase(),
  normalized_name:"localidade "+code.toLowerCase(),
  pricing_tier_id:code,
  status:"active",
})).concat([
  { id:"mogi", canonical_name:"mogi das cruzes", normalized_name:"mogi das cruzes", pricing_tier_id:"T1190", status:"active" },
  { id:"jundiai", canonical_name:"jundiaí", normalized_name:"jundiai", pricing_tier_id:"T1690", status:"active" },
  { id:"raposo", canonical_name:"raposo tavares", normalized_name:"raposo tavares", pricing_tier_id:null, status:"human_required" },
]);

const ALIASES = [
  { locality_id:"mogi", alias:"Mogi", normalized_alias:"mogi" },
  { locality_id:"jundiai", alias:"Jundiai", normalized_alias:"jundiai" },
];

const TIERS = MATRIX.map(([code,pix]) => ({id:code,code,pix_base:pix}));

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
  return actual;
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

for (const [code,pix,card,comboPix,comboCard,promoPix,promoCard,comboPromoPix,comboPromoCard] of MATRIX) {
  test("adapter full matrix "+code,()=>{
    const locality="localidade "+code.toLowerCase();

    const normal=compare({
      facts:{service_interest:["cabine_fotos"],event_date:"2027-01-10",locality,event_type:"aniversário"},
      localities:LOCALITIES,locality_aliases:ALIASES,pricing_tiers:TIERS,
      services:[MAIN()],rule_set:RULES,reference_date:"2026-10-05"
    });
    assert.deepEqual(normal.quote_result.customerVisible,{pix,card});

    const combo=compare({
      facts:{service_interest:["cabine_fotos","plataforma_360"],event_date:"2027-01-10",locality,event_type:"aniversário"},
      localities:LOCALITIES,locality_aliases:ALIASES,pricing_tiers:TIERS,
      services:[MAIN(),MAIN("plataforma_360")],rule_set:RULES,reference_date:"2026-10-05"
    });
    assert.deepEqual(combo.quote_result.customerVisible,{pix:comboPix,card:comboCard});

    const promo=compare({
      facts:{service_interest:["cabine_fotos"],event_date:"2026-11-04",locality,event_type:"aniversário"},
      localities:LOCALITIES,locality_aliases:ALIASES,pricing_tiers:TIERS,
      services:[MAIN()],rule_set:RULES,reference_date:"2026-10-05"
    });
    assert.deepEqual(promo.quote_result.customerVisible,{pix:promoPix,card:promoCard});

    const comboPromo=compare({
      facts:{service_interest:["cabine_fotos","plataforma_360"],event_date:"2026-11-04",locality,event_type:"aniversário"},
      localities:LOCALITIES,locality_aliases:ALIASES,pricing_tiers:TIERS,
      services:[MAIN(),MAIN("plataforma_360")],rule_set:RULES,reference_date:"2026-10-05"
    });
    assert.deepEqual(comboPromo.quote_result.customerVisible,{pix:comboPromoPix,card:comboPromoCard});
  });
}
