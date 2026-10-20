import { runF2QuoteAdapter } from './quote-social.mjs';
import { resolveLocality, normalizeText, daysBetweenDateOnly, parseDateOnly } from '../functions/f2/index.mjs';
import { calcularOrcamentoCorporativo } from '../functions/corporate-pricing.cjs';

// Inputs come from the orchestrator/catalog, never from a model's price proposal.
export function runQuoteEngine(input, source) {
  const facts = input.facts ?? {};
  const eventType = normalizeText(facts.event_type);
  const group = input.event_group ?? facts.event_group ?? undefined;
  const corporate = eventType === 'empresarial' || group === 'GRUPO_CORPORATIVO';
  const corporateFacts = ['dias_evento','periodos_por_dia','data_inicio','data_fim','event_dates'].some(k => facts[k] !== undefined);
  if (!corporate && !corporateFacts && (group === undefined || group === 'GRUPO_SOCIAL')) {
    return runF2QuoteAdapter(input);
  }
  const stop = (codes, human = false, locality = null) => ({
    contract_version:'1.1.0', source_component:'F2+BR-002',
    status:human ? 'human_required' : 'blocked',
    locality_result:locality, readiness:{ready:false, humanRequired:human, blockers:codes},
    date_policy:null, quote_result:null,
    requested_actions:human ? [{action:'CREATE_HUMAN_TASK',reason_codes:codes}] : [], blockers:codes
  });
  if (!corporate || (group !== undefined && group !== 'GRUPO_CORPORATIVO') ||
      (eventType && eventType !== 'empresarial')) return stop(['EVENT_PRICING_ROUTE_CONFLICT'], true);
  if (input.human_lock === true || input.humanLock === true) return stop(['HUMAN_LOCK_ACTIVE'], true);

  const missing = [];
  for (const key of ['service_interest','locality','dias_evento','periodos_por_dia']) {
    const v = facts[key];
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) missing.push('FACT_MISSING:'+key);
  }
  if (missing.length) return stop(missing);
  if (!Number.isSafeInteger(facts.dias_evento) || facts.dias_evento < 1) return stop(['CORPORATE_DAYS_INVALID']);
  if (!Number.isInteger(facts.periodos_por_dia) || facts.periodos_por_dia < 1 || facts.periodos_por_dia > 3) {
    return stop(['CORPORATE_PERIODS_REQUIRE_HUMAN'], true);
  }
  // BR-002 defines one main service. Combinations/addons need an explicit policy.
  const services = input.services ?? [];
  if (!Array.isArray(facts.service_interest) || facts.service_interest.length !== 1 ||
      !Array.isArray(services) || services.length !== 1 ||
      services[0]?.code !== facts.service_interest[0] || services[0]?.category !== 'main' ||
      services[0]?.quoteableAutomatically !== true || (services[0]?.quantity ?? 1) !== 1 ||
      services[0]?.active === false || input.special_configuration === true) {
    return stop(['CORPORATE_SERVICE_CONFIGURATION_REQUIRES_HUMAN'], true);
  }
  const serviceCode = services[0].code;
  if (!['cabine_fotos','totem_fotos','plataforma_360','set_fotografico','fotografo_evento'].includes(serviceCode)) {
    return stop(['CORPORATE_SERVICE_NOT_REGISTERED'], true);
  }

  let start = facts.data_inicio ?? facts.event_date;
  let end = facts.data_fim;
  const dates = facts.event_dates;
  if (!input.reference_date) return stop(['REFERENCE_DATE_MISSING']);
  if (dates !== undefined && (!Array.isArray(dates) || dates.length === 0)) return stop(['CORPORATE_DATES_INVALID']);
  try {
    parseDateOnly(input.reference_date);
    if (dates) {
      for (const date of dates) parseDateOnly(date);
      if (new Set(dates).size !== dates.length || dates.length !== facts.dias_evento) return stop(['CORPORATE_DATES_DAYS_CONFLICT']);
      const sorted = [...dates].sort();
      if ((start && start !== sorted[0]) || (end && end !== sorted.at(-1))) return stop(['CORPORATE_DATES_RANGE_CONFLICT']);
      start = sorted[0]; end = sorted.at(-1);
    } else {
      if (!start || !end) return stop(['FACT_MISSING:corporate_dates']);
      if (daysBetweenDateOnly(start, end) + 1 !== facts.dias_evento) return stop(['CORPORATE_DATES_DAYS_CONFLICT']);
    }
    if (facts.event_date && facts.event_date !== start) return stop(['CORPORATE_START_DATE_CONFLICT']);
    if (daysBetweenDateOnly(input.reference_date, start) < 0) return stop(['EVENT_DATE_IN_PAST']);
  } catch { return stop(['CORPORATE_DATES_INVALID']); }

  // The archived official text is immutable input to the generator, not another editable tariff.
  if (!source || input.pricing_source?.file_id !== source.file_id ||
      input.pricing_source?.revision_id !== source.revision_id) return stop(['PRICING_SOURCE_NOT_VERIFIED'], true);
  if (!Array.isArray(input.localities) || !Array.isArray(input.pricing_tiers) ||
      (input.locality_aliases !== undefined && !Array.isArray(input.locality_aliases))) {
    return stop(['CATALOG_INPUT_INVALID'], true);
  }
  const official = resolveLocality({input:facts.locality, localities:source.localities, aliases:source.aliases});
  if (official.status !== 'resolved') return stop([official.reasonCode], official.status !== 'needs_region', official);
  const locality = resolveLocality({input:facts.locality, localities:input.localities ?? [],
    aliases:(input.locality_aliases ?? []).filter(a=>a.active !== false)});
  if (locality.status !== 'resolved') return stop([locality.reasonCode], true, locality);
  if (normalizeText(locality.locality?.canonicalName) !== normalizeText(official.locality?.canonicalName)) {
    return stop(['CATALOG_LOCALITY_SOURCE_MISMATCH'], true, locality);
  }
  const tierId = locality.locality.pricingTierId;
  const tiers = (input.pricing_tiers ?? []).filter(t =>
    String(t.id ?? t.code) === String(tierId) && (!t.active_from || t.active_from <= input.reference_date) &&
    (!t.active_to || t.active_to >= input.reference_date));
  if (tiers.length !== 1) return stop(['CATALOG_PRICING_TIER_NOT_UNIQUE'], true, locality);
  const tier = tiers[0];
  const officialTier = source.tiers.find(t=>t.code === official.locality.pricingTierId);
  const base = Number(tier.pix_base);
  if (tier.code !== officialTier?.code || base !== officialTier?.pix_base) return stop(['CATALOG_PRICE_SOURCE_MISMATCH'], true, locality);
  const explicit = input.pricing_tier ?? input.tier;
  if (explicit && (String(explicit.id ?? explicit.code) !== String(tier.id ?? tier.code) || Number(explicit.pix_base ?? explicit.pixBase) !== base)) {
    return stop(['EXPLICIT_TIER_OVERRIDE_REJECTED'], true, locality);
  }

  let amounts;
  try {
    amounts = calcularOrcamentoCorporativo({dias_evento:facts.dias_evento,
      periodos_por_dia:facts.periodos_por_dia,valor_base_1_periodo:base});
  } catch (error) {
    return stop(['CORPORATE_MONETARY_INPUT_INVALID'], true, locality);
  }
  const schedule = {data_inicio:start,data_fim:end,dias_evento:facts.dias_evento,
    ...(dates ? {event_dates:[...dates].sort()} : {})};
  return {
    contract_version:'1.1.0', source_component:'F2+BR-002', status:'ready', locality_result:locality,
    readiness:{ready:true,status:'ready',humanRequired:false,blockers:[]},
    date_policy:{status:'ok',window:'CORPORATE_BR_002',automaticPixDiscountPerMain:0,
      gift:{eligible:false,serviceCode:null,commercialValue:null},followupDelayHours:null},
    quote_result:{
      status:'ready',humanRequired:false,blockers:[],pricingRuleVersion:'BR-002@1.0',
      comboApplied:false,promotionApplied:false,
      items:[{lineType:'main',serviceCode,basePix:base,promotionDiscount:0,comboDiscount:0,
        finalPix:amounts.valor_avista,ruleRefs:['BR-002','DEC-017']}],
      totals:{pix:amounts.valor_avista,card:amounts.valor_parcelado},
      customerVisible:{pix:amounts.valor_avista,card:amounts.valor_parcelado},
      corporate:{...amounts,schedule},
      pricing_source:{file_id:source.file_id,url:source.url,revision_id:source.revision_id,
        sha256:source.sha256,catalog_source_version:tier.source_version ?? null,
        locality_id:locality.locality.localityId,tier_id:tier.id ?? tier.code,tier_code:tier.code},
      availability:{status:'not_checked',claim_authorized:false},
      presentation_requires:'corporate_presentation_v1'
    },
    requested_actions:[{action:'RECORD_QUOTE'},{action:'EMIT_EVENT',event_type:'quote_generated'}],blockers:[]
  };
}
