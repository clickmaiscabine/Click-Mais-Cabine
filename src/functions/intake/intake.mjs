// Pure intake kernel. No network, prices, availability promises or dispatch.
export const normalizeText = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const stable = value => JSON.stringify(value, (_key, item) => item && !Array.isArray(item) && typeof item === 'object' ? Object.fromEntries(Object.keys(item).sort().map(k=>[k,item[k]])) : item);
const same = (a, b) => stable(a) === stable(b);
const servicePatterns = {
  cabine_fotos: /\bcabine(?: de fotos?)?\b/g,
  totem_fotos: /\btotem(?: de fotos?)?\b/g,
  plataforma_360: /\b(?:plataforma(?: 360)?|360(?: graus)?)\b/g,
  set_fotografico: /\bset fotografico\b/g,
  fotografo_evento: /\bfotografo(?: para evento)?\b/g,
  album_assinaturas: /\balbum(?: de assinaturas)?\b/g,
  painel_fotografico_2x1: /\bpainel fotografico\b/g,
  drop_box_octogonal: /\bdrop box(?: octogonal)?\b/g,
};
const required = ['service_interest', 'event_type', 'event_date', 'locality'];
const questions = {
  service_interest: 'Somos a Click Mais! Trabalhamos com Cabine de Fotos, Totem, Plataforma 360, Set Fotográfico e Fotógrafo. Qual serviço você deseja orçar?',
  event_type: 'Qual é a finalidade da festa ou do evento?',
  event_date: 'Qual é a data do evento, incluindo o ano?',
  locality: 'Em qual cidade ou localidade será o evento?',
};
export function normalizeIngress(input) {
  const payload = input.body ?? input.payload ?? input;
  const values = payload.entry ? payload.entry.flatMap(e => (e.changes ?? []).map(c => c.value)) :
    payload.changes ? payload.changes.map(c => c.value) : [payload.value ?? payload];
  const result = [];
  for (const value of values.filter(Boolean)) {
    for (const message of value.messages ?? (input.message ? [input.message] : [])) {
      const sender = message.from;
      const ts = Number(message.timestamp);
      const blockers = [];
      if (!message.id) blockers.push('EXTERNAL_MESSAGE_ID_MISSING');
      if (!/^\d{7,15}$/.test(sender ?? '')) blockers.push('SENDER_ID_INVALID');
      if (!value.metadata?.phone_number_id) blockers.push('PHONE_NUMBER_ID_MISSING');
      if (!Number.isFinite(ts) || ts <= 0 || !Number.isFinite(new Date(ts * 1000).valueOf())) blockers.push('MESSAGE_TIMESTAMP_INVALID');
      result.push({ accepted: blockers.length === 0, blockers,
        message_context: { contract_version: '1.0.0', event_type: 'message_received', channel: 'whatsapp', transport: 'meta_whatsapp',
          external_message_id: message.id ?? null, idempotency_key: message.id ? `meta:${value.metadata?.phone_number_id}:${message.id}` : null,
          sender_id: sender ?? null, phone_number_id: value.metadata?.phone_number_id ?? null,
          sender_display_name: value.contacts?.find(c => c.wa_id === sender)?.profile?.name ?? null,
          message_type: message.type, text: message.type === 'text' ? message.text?.body ?? '' : '',
          occurred_at: blockers.includes('MESSAGE_TIMESTAMP_INVALID') ? null : new Date(ts * 1000).toISOString(),
          referral: message.referral ?? null,
        },
      });
    }
  }
  return result;
}
function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}
function candidate(key, value, evidence, extra = {}) {
  return { fact_key: key, fact_value: value, fact_status: 'known', source_type: 'customer', confidence: 1, metadata: { evidence, ...extra } };
}
export function extractFacts(message, snapshot = {}) {
  const text = message.text;
  const normalized = normalizeText(text);
  const candidates = [], ambiguities = [], positive = [], negative = [];
  for (const [code, pattern] of Object.entries(servicePatterns)) {
    pattern.lastIndex = 0;
    for (const match of normalized.matchAll(pattern)) {
      const before = normalized.slice(Math.max(0, match.index - 65), match.index).split(/[;,.!?]|\bmas\b/).at(-1);
      const negatives = [...before.matchAll(/\b(?:nao (?:quero|desejo|preciso)|nao tenho interesse|sem|dispenso|cancelar|cancele)\b/g)];
      const affirmatives = [...before.matchAll(/\b(?:quero|desejo|preciso)\b/g)].filter(v => !/\bnao\s*$/.test(before.slice(0,v.index)));
      const negated = negatives.length > 0 && (negatives.at(-1).index > (affirmatives.at(-1)?.index ?? -1));
      (negated ? negative : positive).push(code);
    }
  }
  const add = [...new Set(positive)], remove = [...new Set(negative)];
  if (add.some(s => remove.includes(s)) || (add.length > 1 && /\bou\b/.test(normalized))) ambiguities.push('service_interest');
  else if (add.length || remove.length) {
    const previous = snapshot.facts?.find(f => f.fact_key === 'service_interest' && f.is_current !== false)?.fact_value ??
      snapshot.services?.filter(s => s.status !== 'cancelled').map(s => s.service_code) ?? [];
    const services = [...new Set([...( /\b(so|apenas|somente)\b/.test(normalized) ? [] : previous), ...add])].filter(s => !remove.includes(s)).sort();
    candidates.push(candidate('service_interest', services, text, { explicit_service_change: true }));
  }
  const types = ['casamento', 'aniversario', 'debutante', 'formatura', 'corporativo', 'empresarial', 'confraternizacao'];
  const purposes = types.filter(t => new RegExp(`\\b${t}\\b`).test(normalized));
  if (purposes.length === 1 && !/\bnao (?:e|sera|vai ser)\b/.test(normalized)) candidates.push(candidate('event_type', purposes[0], text));
  else if (purposes.length > 1 || (purposes.length && /\bnao (?:e|sera|vai ser)\b/.test(normalized))) ambiguities.push('event_type');
  const dates = [...normalized.matchAll(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/g)].map(m => `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`);
  for (const match of normalized.matchAll(/\b\d{4}-\d{2}-\d{2}\b/g)) dates.push(match[0]);
  if (dates.length === 1 && validDate(dates[0])) candidates.push(candidate('event_date', dates[0], text));
  else if (dates.length || /\b\d{1,2}[/-]\d{1,2}\b/.test(normalized)) ambiguities.push('event_date');
  const cities = [];
  for (const entry of snapshot.localities ?? []) {
    const aliases = [entry.canonical_name, ...(entry.aliases ?? [])].map(normalizeText);
    const matched = aliases.find(a => a && new RegExp(`(?:^|[^a-z])${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[^a-z])`).test(normalized));
    if (matched) {
      // Home city is not automatically the venue city.
      const before = normalized.slice(0, normalized.indexOf(matched));
      if (/(?:moro|sou) (?:em|de)\s*$/.test(before)) continue;
      cities.push(entry.canonical_name);
    }
  }
  if (cities.length === 1) candidates.push(candidate('locality', cities[0], text));
  else if (cities.length > 1) ambiguities.push('locality');
  const name = text.match(/\b(?:me chamo|meu nome [ée])\s+([\p{L}][\p{L} ]{1,60}?)(?=[,.!;\n]|$)/iu);
  if (name) candidates.push(candidate('customer_name', name[1].trim(), name[0]));
  const relationship = text.match(/\b(?:sou (?:a |o )?)(m[ãa]e|pai|noiva|noivo|debutante|assessora?|respons[áa]vel)(?: (?:da|do|pela|pelo) [\p{L} ]+)?/iu);
  if (relationship) candidates.push(candidate('relationship_to_event', relationship[0], relationship[0]));
  const source = normalized.match(/\b(?:vim|cheguei|encontrei voces) (?:pelo|pela|por|no|na) (instagram|facebook|google maps|indicacao)\b/);
  if (source) candidates.push(candidate('acquisition_source', source[1].replace(' ','_'), text));
  const address = text.match(/\bendere[çc]o:\s*([^;\n]{3,150})/iu);
  if(address) candidates.push(candidate('venue_address',address[1].trim(),address[0]));
  return { candidates, ambiguities: [...new Set(ambiguities)], text };
}
export function validateSemanticFacts(response, message, snapshot) {
  const candidates = [], rejected = [];
  for (const c of response?.fact_candidates ?? []) {
    const key = c.fact_key, value = c.fact_value, evidence = c.metadata?.evidence;
    const allowed = [...required, 'venue_address', 'customer_name', 'relationship_to_event', 'acquisition_source'];
    let valid = allowed.includes(key) && typeof evidence === 'string' && evidence.length > 0 && message.text.includes(evidence) &&
      Number.isFinite(c.confidence) && c.confidence >= 0.8 && c.confidence <= 1;
    if (extractFacts(message,snapshot).ambiguities.includes(key)) valid = false;
    if (key === 'service_interest') valid &&= Array.isArray(value) && value.length > 0 && value.every(s => Object.hasOwn(servicePatterns, s));
    else valid &&= typeof value === 'string' && value.trim().length > 0;
    if (key === 'event_date') valid &&= validDate(value) && /\b\d{4}\b/.test(evidence) &&
      extractDateCandidates(evidence).some(c => c.fact_value === value);
    if (key === 'acquisition_source') valid &&= ['instagram','facebook','google_maps','indicacao','unknown'].includes(value);
    if (['venue_address','customer_name','relationship_to_event','event_type','locality'].includes(key)) valid &&= normalizeText(evidence).includes(normalizeText(value));
    // Semantic service extraction must also respect deterministic exclusions.
    const denied = extractFacts(message, snapshot).candidates.find(f => f.fact_key === 'service_interest');
    if (key === 'service_interest' && denied && !value.every(s => denied.fact_value.includes(s))) valid = false;
    if (valid) candidates.push({ ...candidate(key, value, evidence, { semantic: true }), confidence: c.confidence });
    else rejected.push(key ?? 'UNKNOWN');
  }
  return { candidates, rejected };
}
function extractDateCandidates(text) {
  const result = [];
  const normalized = normalizeText(text);
  const months = ['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  for (const m of normalized.matchAll(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/g)) {
    const value = `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
    if (validDate(value)) result.push(candidate('event_date',value,text));
  }
  for (const m of normalized.matchAll(/\b\d{4}-\d{2}-\d{2}\b/g)) if(validDate(m[0])) result.push(candidate('event_date',m[0],text));
  for (const m of normalized.matchAll(/\b(\d{1,2}) de ([a-z]+) de (\d{4})\b/g)) {
    const month = months.indexOf(m[2]) + 1;
    const value = `${m[3]}-${String(month).padStart(2,'0')}-${m[1].padStart(2,'0')}`;
    if (month && validDate(value)) result.push(candidate('event_date',value,text));
  }
  return result;
}
export function buildJevRequest(message, snapshot = {}) {
  // Jev chooses values from bounded, evidence-backed candidates, never free text.
  const options = {}, questions = {};
  const add = (key, list) => {
    const unique = list.filter((c,i) => list.findIndex(v => same(v.fact_value,c.fact_value)) === i);
    if (!unique.length) return;
    options[key] = Object.fromEntries(unique.map((c,i) => ['c'+i,c]));
    questions[key] = { type:'choice', instructions:`Extraia ${key} referente ao evento que está sendo orçado. Respeite negações e contexto. Escolha none se nenhuma opção for declarada com clareza. Não escolha uma opção para resolver informação conflitante por suposição.`,
      criteria:Object.fromEntries([...unique.map((c,i)=>['c'+i,JSON.stringify(c.fact_value)+'; evidência: '+c.metadata.evidence]),['none','Não informado, negado ou ambíguo']]) };
  };
  add('event_date',extractDateCandidates(message.text));
  const otherPurpose = message.text.match(/\b(?:evento|festa) (?:[ée]|ser[áa]) (?:um |uma )?([^,.!;\n]{2,80})/iu);
  if(otherPurpose) add('event_type',[candidate('event_type',otherPurpose[1].trim(),otherPurpose[0])]);
  const address = message.text.match(/\b(?:endere[çc]o|local):\s*([^;\n]{3,150})/iu);
  if(address) add('venue_address',[candidate('venue_address',address[1].trim(),address[0])]);
  const city = message.text.match(/\b(?:cidade|localidade):\s*([^,.!;\n]{2,80})/iu);
  if(city) add('locality',[candidate('locality',city[1].trim(),city[0])]);
  const extracted = extractFacts(message,snapshot);
  for(const key of ['event_type','locality','customer_name','relationship_to_event','acquisition_source']) add(key,extracted.candidates.filter(c=>c.fact_key===key));
  add('service_interest',extracted.candidates.filter(c=>c.fact_key==='service_interest' && c.fact_value.length));
  return { request:{ model:'typesafe/jev-1.13', state:{message:message.text,current_facts:snapshot.facts??[]},questions }, options };
}
export function mapJevResponse(response, requestContext) {
  const fact_candidates = [], rejected = [];
  for(const [key, choices] of Object.entries(requestContext.options ?? {})) {
    const answer = response?.answers?.[key];
    if(answer?.choice === 'none') continue;
    const picked = choices[answer?.choice];
    if(!picked || !Number.isFinite(answer?.confidence) || answer.confidence < 0.8 || answer.confidence > 1) { rejected.push(key); continue; }
    fact_candidates.push({...picked,confidence:answer.confidence});
  }
  return {fact_candidates,rejected};
}
export function planIntake(normalized, snapshot = {}, semantic = null) {
  const m = normalized.message_context;
  const effects = { database_write: false, whatsapp_reply: false, quote_calculation: false };
  const base = { contract_version: '1.0.0', message_context: m, effects, expected_version: snapshot.session?.state_version ?? 0,
    customer_event_id: snapshot.customer_event?.id ?? null, expected_event_intake_version: snapshot.customer_event?.metadata?.quote_intake?.version ?? 0,
    operations: [], conflicts: [], ignored: [], ready_for_quote_checks: false };
  if (!normalized.accepted) return { ...base, route: 'REJECT', blockers: normalized.blockers };
  if (snapshot.duplicate) return { ...base, route: 'DUPLICATE', blockers: [] };
  if (snapshot.identity_ambiguous) return { ...base, route: 'CLARIFY_EVENT', blockers: ['MULTIPLE_ACTIVE_EVENTS'] };
  if (['personal','vendor','staff','venue','other'].includes(snapshot.contact?.contact_category ?? snapshot.contact?.relationship_type)) return { ...base, route: 'NONCOMMERCIAL', blockers: [] };
  if (snapshot.human_lock || snapshot.session?.status === 'paused') return { ...base, route: 'HUMAN_LOCK', blockers: [] };
  if (snapshot.customer_event && (snapshot.customer_event.commercial_stage !== 'PRE_QUOTE' || snapshot.customer_event.status !== 'active')) return { ...base, route: 'EXISTING_LIFECYCLE', blockers: [] };
  if (m.message_type !== 'text') return { ...base, route: 'MEDIA_REQUIRES_REVIEW', blockers: ['TEXT_EXTRACTION_REQUIRED'] };
  const deterministic = extractFacts(m, snapshot);
  const semanticResult = validateSemanticFacts(semantic, m, snapshot);
  const facts = Object.fromEntries((snapshot.facts ?? []).filter(f => f.is_current !== false).map(f => [f.fact_key, f.fact_value]));
  facts.service_interest ??= snapshot.services?.filter(s => s.status !== 'cancelled').map(s => s.service_code).sort() ?? [];
  facts.event_type ??= snapshot.customer_event?.event_type;
  facts.event_date ??= snapshot.customer_event?.event_date;
  facts.locality ??= snapshot.customer_event?.city;
  facts.acquisition_source ??= 'unknown';
  const conflicts = { ...(snapshot.customer_event?.metadata?.quote_intake?.conflicts ?? {}) };
  const operations = [];
  const groups = {};
  for (const c of [...deterministic.candidates, ...semanticResult.candidates]) (groups[c.fact_key] ??= []).push(c);
  for (const [key, list] of Object.entries(groups)) {
    if (list.some(c => !same(c.fact_value, list[0].fact_value))) {
      conflicts[key] = { current_value: facts[key] ?? null, candidate_values: list.map(c=>c.fact_value), evidence: m.text };
      continue;
    }
    const c = list[0], previous = facts[key];
    const explicitConfirmation = /\b(?:confirmo|confirmado|correto|corrigindo|correcao)\b/.test(normalizeText(m.text));
    if (conflicts[key] && !explicitConfirmation) continue;
    if (previous != null && !same(previous, c.fact_value) && !(key === 'acquisition_source' && previous === 'unknown') && !(key === 'service_interest' && c.metadata.explicit_service_change) && !explicitConfirmation) {
      conflicts[key] = { current_value: previous, candidate_values: [c.fact_value], evidence: m.text };
      continue;
    }
    if (explicitConfirmation) delete conflicts[key];
    if (!same(previous, c.fact_value)) { operations.push({ action: 'RECORD_EVENT_FACT', ...c }); facts[key] = c.fact_value; }
  }
  for (const key of deterministic.ambiguities) if (!semanticResult.candidates.some(c => c.fact_key === key)) conflicts[key] = { current_value: facts[key] ?? null, candidate_values: [], evidence: m.text };
  const missing = required.filter(k => k === 'service_interest' ? !facts[k]?.length : !facts[k]);
  const conflictKeys = Object.keys(conflicts);
  const next = conflictKeys[0] ?? missing[0] ?? null;
  const mainCount = (facts.service_interest ?? []).filter(s => ['cabine_fotos','totem_fotos','plataforma_360','set_fotografico','fotografo_evento'].includes(s)).length;
  const route = conflictKeys.length ? 'CLARIFY_CONFLICT' : missing.length ? 'ASK_MISSING_FIELD' : mainCount > 2 ? 'COMBO_REQUIRES_HUMAN' : 'QUOTE_CHECKS';
  const actionKey = next ? `${route}:${next}:${stable(conflicts[next] ?? null)}` : `${route}:${stable(facts)}`;
  const suppressed = actionKey === snapshot.session?.context?.quote_intake?.last_action_key;
  return { ...base, operations, facts, conflicts, ignored: semanticResult.rejected, missing_required: missing,
    ready_for_quote_checks: route === 'QUOTE_CHECKS', route, next_field: next,
    proposed_response: suppressed ? null : route === 'ASK_MISSING_FIELD' ? questions[next] : route === 'CLARIFY_CONFLICT' ? `Pode confirmar ${ { service_interest:'o serviço desejado',event_type:'a finalidade do evento',event_date:'a data com o ano',locality:'a cidade do evento'}[next] ?? 'essa informação' }? Recebi informações diferentes ou ambíguas.` : null,
    action_key: actionKey, duplicate_response_suppressed: suppressed,
    combo: { services: facts.service_interest, main_count: mainCount, rule: mainCount === 2 ? 'combo_second_main_discount' : null, apply_price_here: false },
    blockers: route === 'COMBO_REQUIRES_HUMAN' ? ['MAIN_SERVICE_COMBINATION_OVER_TWO_UNDEFINED'] : [],
    requires_jev: !semantic && Object.keys(buildJevRequest(m,snapshot).options).some(k => missing.includes(k) || deterministic.ambiguities.includes(k) || k === 'venue_address'),
  };
}
