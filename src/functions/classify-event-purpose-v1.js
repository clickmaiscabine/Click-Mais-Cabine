// Pure deterministic engine: no database, network, clock, credentials, WhatsApp or JEV.
function classifyPurposeV1(input, taxonomy) {
  if (!taxonomy || taxonomy.version !== '1.0.1') throw new Error('unsupported_taxonomy_version');
  const original = String(input?.text ?? '');
  const norm = s => String(s ?? '').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
  const text = norm(original);
  const context = input?.context ?? {};
  const features = taxonomy.features.filter(f => new RegExp(f.pattern).test(text)).map(f => f.id);
  const result = (status, rule, certainty, matches, route) => ({
    status, operational: rule?.code ?? null, group: rule?.group ?? null,
    subtype: rule?.subtype ?? null, features, certainty: certainty ?? 'none',
    rule_id: rule?.id ?? null, matches: matches ?? [],
    version: taxonomy.version, route,
    requires_jev: route === 'jev',
    requires_confirmation: status === 'conflict' || status === 'ambiguous'
      || (status === 'identified' && !rule?.code)
  });
  if (!text) return result('unclassified', null, 'none', [], 'none');
  // Only the actual, persisted purpose menu licenses 1-4 as purpose codes.
  if (/^[1-4]$/.test(text) && context.pending_question === 'purpose') {
    const x = taxonomy.numeric_menu[text];
    return result('identified', {id:'MENU-PURPOSE-'+text, ...x}, 'direct',
      [{rule_id:'MENU-PURPOSE-'+text, term:text, group:x.group}], 'deterministic');
  }
  if (/^\d+$/.test(text)) return result('unclassified', null, 'none', [], 'none');
  const hits = [];
  for (const rule of taxonomy.rules) {
    const match = new RegExp(rule.pattern, 'i').exec(text);
    if (!match) continue;
    const before = text.slice(Math.max(0, match.index - 45), match.index);
    if (/\b(nao e|nao sera|nao foi|nao quero|nao se trata de|ao inves de|em vez de|sem)\s*$/.test(before)) continue;
    hits.push({...rule, start:match.index, end:match.index+match[0].length, term:match[0]});
  }
  // Distinguish an individual's age from organization age, dates or tenure.
  const personal = /\b(meu filho|minha filha|minha mae|meu pai|minha avo|meu avo|ela|ele|dela|dele|menino|menina)\b/;
  const age = /\b(vai fazer|vai completar|completa|faz|comemorar(?:emos)? os?|comemora os?)\s+(\d{1,3})(?:\s+anos?)?\b/.exec(text);
  const inverted = /\b(comemorar|celebrar) os (\d{1,3})(?: anos)? (dela|dele)\b/.exec(text);
  const a = age ?? inverted;
  if (a && personal.test(text) && +a[2] >= 1 && +a[2] <= 120) {
    const n = Number(a[2]);
    const subtype = n === 15 ? 'debutante' : n === 1 ? 'primeiro_aniversario'
      : n < 13 ? 'infantil' : 'idade_informada';
    hits.push({id:'P-AGE', group:'aniversario_pessoal', subtype,
      code:n === 15 ? 'debutante' : 'aniversario', priority:114,
      certainty:'direct', start:a.index, end:a.index+a[0].length,
      term:a[0], age:n});
  }
  if (!hits.length) {
    const contextual = taxonomy.contextual_terms.some(p => new RegExp(p).test(text));
    // An isolated date, place or party FORMAT is not a request for semantic event classification.
    const otherField = /\b(data|dia \d{1,2}|outubro|novembro|dezembro|janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|endereco|local|bairro|regiao|avenida|shopping|mogi|suzano|sao paulo|guarulhos|confirmo a data|fechando a data)\b/.test(text)
      || /\b\d{1,2}[\/.-]\d{1,2}\b/.test(original) || /\b(mogi|br[aá]s cubas|braz cubas|vila oliveira|shangai|alto tiet[eê]|umc|shopping|suzano|guarulhos|po[aá]|itaqua|localiza[cç][aã]o|convite|gps|sexta|fim do m[eê]s)\b/i.test(original);
    const route = otherField || features.length ? 'clarify'
      : context.pending_question === 'purpose' ? 'jev' : 'none';
    return result(contextual || features.length ? 'ambiguous':'unclassified',
      null, contextual ? 'contextual':'none', [], route);
  }
  hits.sort((a,b) => b.priority-a.priority);
  // A generic "aniversário" nested inside "aniversário da empresa" adds no second event.
  const candidates = [];
  for (const h of hits) {
    if (candidates.some(c => c.start <= h.start && c.end >= h.end)) continue;
    candidates.push(h);
  }
  if (new Set(candidates.map(c=>c.group)).size > 1) {
    const out = result('conflict', null, 'conflict',
      candidates.map(c=>({rule_id:c.id,term:c.term,group:c.group})), 'clarify');
    return out;
  }
  const chosen = candidates[0];
  const out = result('identified', chosen, chosen.certainty,
    candidates.map(c=>({rule_id:c.id,term:c.term,group:c.group})),
    chosen.code ? 'deterministic' : 'clarify');
  if (chosen.age) out.age = chosen.age;
  return out;
}
if (typeof module !== 'undefined') module.exports = {classifyPurposeV1};
