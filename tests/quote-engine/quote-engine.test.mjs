import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { runQuoteEngine } from '../../src/adapters/quote-engine.mjs';

const code = fs.readFileSync(new URL('../../n8n/generated/quote-engine.generated.js',import.meta.url),'utf8');
const source = JSON.parse(code.split('\n')[1].slice('const OFFICIAL_PRICING_SOURCE = '.length,-1));
const legacy = new Function('$json',fs.readFileSync(new URL('../../n8n/generated/f2-quote-kernel.generated.js',import.meta.url),'utf8'));
const execute = input => new Function('$json',code)(input).json;
const rules={version:'2026-10-05',cardSurchargeRate:0.18,cardRoundUpMultiple:10,comboSecondMainDiscountRate:0.5};
const MAIN=code=>({code,category:'main',quoteableAutomatically:true,quantity:1});
function fixture(tierCode='T1390',days=3,periods=2) {
  const locality=source.localities.find(l=>l.pricing_tier_id===tierCode);
  return {
    facts:{event_type:'empresarial',service_interest:['cabine_fotos'],locality:locality.canonical_name,
      dias_evento:days,periodos_por_dia:periods,data_inicio:'2026-11-01',data_fim:days===1?'2026-11-01':'2026-11-03'},
    reference_date:'2026-10-18',services:[MAIN('cabine_fotos')],rule_set:rules,
    localities:structuredClone(source.localities),locality_aliases:structuredClone(source.aliases),
    pricing_tiers:source.tiers.map(t=>({...t,id:t.code,source_version:'approved-test-catalog'})),
    pricing_source:{file_id:source.file_id,revision_id:source.revision_id}
  };
}
function both(input) {
  const original=structuredClone(input);
  const result=execute(input);
  assert.deepEqual(result,runQuoteEngine(input,source));
  assert.deepEqual(input,original,'pure engine must not mutate input');
  return result;
}
const daily=[
  ['T1190',[1190,1785,2380]],['T1290',[1290,1935,2580]],
  ['T1390',[1390,2085,2780]],['T1490',[1490,2235,2980]],
  ['T1590',[1590,2385,3180]],['T1690',[1690,2535,3380]],
  ['T1790',[1790,2685,3580]],['T1890',[1890,2835,3780]]
];
for (const [tier,expected] of daily) for(const days of [1,3]) for(const periods of [1,2,3]) {
  test(`corporate ${tier}/${days}d/${periods}p: official lookup, bundle parity, no social rules`,()=>{
    const result=both(fixture(tier,days,periods));
    assert.equal(result.status,'ready');
    assert.equal(result.quote_result.corporate.valor_1_dia,expected[periods-1]);
    assert.equal(result.quote_result.customerVisible.card,expected[periods-1]*days);
    assert.equal(result.quote_result.corporate.horas_por_dia,periods*4);
    assert.equal(result.quote_result.promotionApplied,false);
    assert.equal(result.quote_result.comboApplied,false);
    assert.equal(result.date_policy.gift.eligible,false);
    assert.equal(result.quote_result.pricing_source.revision_id,source.revision_id);
    assert.equal(result.quote_result.availability.claim_authorized,false);
  });
}
test('acceptance example: 3d x 2p T1390 has exact commercial amounts',()=>{
  const r=both(fixture()).quote_result;
  assert.deepEqual(r.customerVisible,{pix:5129.10,card:6255});
  assert.deepEqual([r.corporate.sinal_50,r.corporate.saldo_no_evento],[2564.55,2564.55]);
});
test('acceptance example: 1d x 3p T1190',()=>{
  const r=both(fixture('T1190',1,3)).quote_result;
  assert.deepEqual(r.customerVisible,{pix:1951.60,card:2380});
  assert.equal(r.corporate.sinal_50,975.80);
});

for (const [tier] of daily) for(const date of ['2026-11-01','2026-12-01','2027-03-01']) for(const count of [1,2]) {
  test(`social deep regression ${tier}/${date}/${count} services`,()=>{
    const i=fixture(tier);
    i.facts={event_type:'casamento',service_interest:count===1?['cabine_fotos']:['cabine_fotos','plataforma_360'],locality:i.facts.locality,event_date:date};
    i.services=i.facts.service_interest.map(MAIN);
    assert.deepEqual(both(i),legacy(i).json,'entire social output must remain unchanged');
  });
}
for (const [name,mutate,blocker] of [
  ['missing days',i=>delete i.facts.dias_evento,'FACT_MISSING:dias_evento'],
  ['string days',i=>i.facts.dias_evento='3','CORPORATE_DAYS_INVALID'],
  ['zero days',i=>i.facts.dias_evento=0,'CORPORATE_DAYS_INVALID'],
  ['extreme days',i=>i.facts.dias_evento=Number.MAX_SAFE_INTEGER+1,'CORPORATE_DAYS_INVALID'],
  ['more than three periods',i=>i.facts.periodos_por_dia=4,'CORPORATE_PERIODS_REQUIRE_HUMAN'],
  ['fractional periods',i=>i.facts.periodos_por_dia=1.5,'CORPORATE_PERIODS_REQUIRE_HUMAN'],
  ['unknown source',i=>delete i.pricing_source,'PRICING_SOURCE_NOT_VERIFIED'],
  ['new source revision',i=>i.pricing_source.revision_id='unreconciled','PRICING_SOURCE_NOT_VERIFIED'],
  ['malformed catalog',i=>i.localities={rows:[]},'CATALOG_INPUT_INVALID'],
  ['malformed aliases',i=>i.locality_aliases='mogi','CATALOG_INPUT_INVALID'],
  ['forged monetary price',i=>i.pricing_tiers.find(t=>t.code==='T1390').pix_base=1200,'CATALOG_PRICE_SOURCE_MISMATCH'],
  ['override base',i=>i.pricing_tier={id:'T1190',code:'T1190',pix_base:1190},'EXPLICIT_TIER_OVERRIDE_REJECTED'],
  ['missing catalog tier',i=>i.pricing_tiers=[],'CATALOG_PRICING_TIER_NOT_UNIQUE'],
  ['duplicate catalog tier',i=>i.pricing_tiers.push({...i.pricing_tiers[2]}),'CATALOG_PRICING_TIER_NOT_UNIQUE'],
  ['expired catalog tier',i=>i.pricing_tiers[2].active_to='2026-10-01','CATALOG_PRICING_TIER_NOT_UNIQUE'],
  ['locality ambiguity',i=>i.facts.locality='São Paulo','SAO_PAULO_GENERIC'],
  ['unknown locality',i=>i.facts.locality='cidade inventada','LOCALITY_UNKNOWN'],
  ['manual locality',i=>i.facts.locality='raposo tavares','LOCALITY_POLICY_HUMAN'],
  ['mismatched duration',i=>i.facts.data_fim='2026-11-04','CORPORATE_DATES_DAYS_CONFLICT'],
  ['invalid date',i=>i.facts.data_inicio='2026-02-30','CORPORATE_DATES_INVALID'],
  ['missing end date',i=>delete i.facts.data_fim,'FACT_MISSING:corporate_dates'],
  ['missing reference date',i=>delete i.reference_date,'REFERENCE_DATE_MISSING'],
  ['past date',i=>i.reference_date='2026-11-02','EVENT_DATE_IN_PAST'],
  ['inconsistent primary date',i=>i.facts.event_date='2026-11-02','CORPORATE_START_DATE_CONFLICT'],
  ['human lock',i=>i.human_lock=true,'HUMAN_LOCK_ACTIVE'],
  ['corporate facts on social event',i=>i.facts.event_type='aniversario','EVENT_PRICING_ROUTE_CONFLICT'],
  ['contradictory route',i=>i.event_group='GRUPO_SOCIAL','EVENT_PRICING_ROUTE_CONFLICT'],
  ['addon gift attempt',i=>i.services.push(MAIN('album_assinaturas')),'CORPORATE_SERVICE_CONFIGURATION_REQUIRES_HUMAN'],
  ['multiple equipment',i=>i.services[0].quantity=2,'CORPORATE_SERVICE_CONFIGURATION_REQUIRES_HUMAN'],
  ['not registered',i=>{i.facts.service_interest=['inventado'];i.services=[MAIN('inventado')];},'CORPORATE_SERVICE_NOT_REGISTERED'],
  ['not quoteable',i=>i.services[0].quoteableAutomatically=false,'CORPORATE_SERVICE_CONFIGURATION_REQUIRES_HUMAN'],
  ['special configuration',i=>i.special_configuration=true,'CORPORATE_SERVICE_CONFIGURATION_REQUIRES_HUMAN']
]) test('guard: '+name,()=>{
  const i=fixture();mutate(i);const r=both(i);
  assert.notEqual(r.status,'ready');assert.equal(r.quote_result,null);assert.ok(r.blockers.includes(blocker),JSON.stringify(r.blockers));
});
test('corporate never applies social promotions even with hostile social rules',()=>{
  const i=fixture();i.rule_set={version:'hostile',cardSurchargeRate:99,comboSecondMainDiscountRate:1};
  assert.deepEqual(both(i).quote_result.customerVisible,{pix:5129.1,card:6255});
});
test('corporate can run without a social rule set',()=>{
  const i=fixture();delete i.rule_set;assert.equal(both(i).status,'ready');
});
test('GRUPO_CORPORATIVO selects BR-002 with no legacy event_type',()=>{
  const i=fixture();delete i.facts.event_type;i.event_group='GRUPO_CORPORATIVO';assert.equal(both(i).status,'ready');
});
test('nonconsecutive dates are validated individually, without charging intervening dates',()=>{
  const i=fixture();i.facts.event_dates=['2026-11-10','2026-11-01','2026-11-03'];i.facts.data_fim='2026-11-10';
  assert.deepEqual(both(i).quote_result.corporate.schedule.event_dates,['2026-11-01','2026-11-03','2026-11-10']);
});
test('duplicate event dates must not increase billable days',()=>{
  const i=fixture();i.facts.event_dates=['2026-11-01','2026-11-01','2026-11-03'];
  assert.ok(both(i).blockers.includes('CORPORATE_DATES_DAYS_CONFLICT'));
});
test('catalog locality cannot be silently reassigned to another official tier',()=>{
  const i=fixture();i.localities.find(l=>l.canonical_name===i.facts.locality).pricing_tier_id='T1190';
  assert.ok(both(i).blockers.includes('CATALOG_PRICE_SOURCE_MISMATCH'));
});
test('n8n sandbox without require/module/import can execute the actual generated code',()=>{
  const r=vm.runInNewContext('(function(){'+code+'})()',{$json:fixture()});
  assert.equal(r.json.quote_result.corporate.sinal_50,2564.55);
});
test('null optional group preserves the exact social output',()=>{
  const i=fixture();i.facts={service_interest:['cabine_fotos'],event_type:'casamento',event_date:'2026-11-01',locality:'suzano',event_group:null};
  assert.deepEqual(both(i),legacy(i).json);
});
