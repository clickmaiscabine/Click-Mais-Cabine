const i=$json,p=i.body??i.payload??i,v=p.entry?.[0]?.changes?.[0]?.value??p.value??p,m=v.messages?.[0]??{},text=String(i.text??m.text?.body??i.message??''),clean=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9/°\s-]/g,' ').replace(/\s+/g,' ').trim(),t=clean(text);
const st=JSON.parse(JSON.stringify(i.state??{})),facts=st.facts??{},extracted={},conflicts={},evidence={},id=i.message_id??m.id??null,processed=st.processed_message_ids??[],duplicate=!!id&&processed.includes(id);st.pending_conflicts=st.pending_conflicts??{};
function add(k,val,src='customer'){if(val===null||val===undefined||val===''||(Array.isArray(val)&&!val.length))return;const old=facts[k],pending=st.pending_conflicts[k];if(pending){if(JSON.stringify(val)===JSON.stringify(pending.incoming)||JSON.stringify(val)===JSON.stringify(pending.existing)){facts[k]=val;extracted[k]=val;evidence[k]='customer_clarification';delete st.pending_conflicts[k];return;}conflicts[k]={existing:old,incoming:val};st.pending_conflicts[k]=conflicts[k];return;}if(old!==undefined&&JSON.stringify(old)!==JSON.stringify(val)){conflicts[k]={existing:old,incoming:val};st.pending_conflicts[k]=conflicts[k];return;}if(old===undefined){facts[k]=val;extracted[k]=val;evidence[k]=src;}}
let category='commercial';
if(/\b(fotos?.{0,35}(documentos?|3x4|rg|passaporte)|foto de rg|passaporte)\b/.test(t))category='out_of_scope';
if(/\b(ja estao chegando|ja esta chegando|quando voces chegam|frete da festa|orcamento do frete)\b/.test(t))category='operational';
if(['vendor','personal','staff','automated','institution'].includes(i.contact_category))category='noncommercial';
const services=[
['cabine_fotos',/\bcabine( de fotos?| fotografica)?\b/g],
['totem_fotos',/\btotem( de fotos?)?\b/g],
['plataforma_360',/\bplataforma( 360)?\b|\b360( graus)?\b|\bgiratoria\b|\bvideo girando\b|\bgira e grava\b|\baquele que gira\b|\baquela que gira\b/g],
['set_fotografico',/\bset fotografico\b|\bcenario fotografico\b/g],
['fotografo',/\bfotografo (para|de) eventos?\b/g]
];
const mentioned=[];for(const [code,re] of services){let ok=false;for(const hit of t.matchAll(re)){const prefix=t.slice(Math.max(0,hit.index-35),hit.index);if(/(nao quero|nao tenho interesse em|sem|dispenso|nao gostaria de)( a| o| de| da| do)?\s*$/.test(prefix))continue;ok=true;}if(ok)mentioned.push(code)}
const comparing=/\b(em duvida entre|qual e melhor|diferencas? entre|quais as diferencas)\b/.test(t)||(/\b(voces tem|trabalham com)\b/.test(t)&&mentioned.length>1);
let desired=comparing?[]:mentioned.slice();
const cta=i.cta??{};const allowed=['cabine_fotos','totem_fotos','plataforma_360','set_fotografico','fotografo'];
if(!desired.length&&cta.verified===true&&allowed.includes(cta.service_code))desired=[cta.service_code];
if(!desired.length&&st.pending_question==='service'&&/^[1-5]$/.test(t))desired=[allowed[Number(t)-1]];
// Data and logic compiled from the single versioned source; generated for the n8n Code node.
const TAXONOMY_PURPOSE={"id":"cm-event-purpose","version":"1.0.1","description":"Base canônica de finalidade; códigos operacionais legados intocados. A categoria não é autorização de brinde.","operational_codes":["casamento","aniversario","debutante","empresarial","formatura"],"groups":{"aniversario_pessoal":"Aniversário pessoal","matrimonial":"Casamento e comemorações matrimoniais","empresarial_institucional":"Corporativo, escolar e institucional","cultural_religioso":"Celebrações culturais ou religiosas","formatura":"Formaturas"},"rules":[{"id":"M01","group":"matrimonial","subtype":"aniversario_casamento","code":"casamento","priority":120,"pattern":"\\b(aniversario (de |do |da )?(casamento|matrimonio|uniao)|\\d{1,3} anos (de (casados|casamento|matrimonio|uniao)|juntos)|comemorar \\d{1,3} anos (de uniao|juntos))\\b","certainty":"direct"},{"id":"M02","group":"matrimonial","subtype":"bodas","code":"casamento","priority":119,"pattern":"\\b(bodas?( de (papel|algodao|prata|ouro|diamante|porcelana|rubi|perola|esmeralda|cristal))?|bodas)\\b","certainty":"direct"},{"id":"M03","group":"matrimonial","subtype":"renovacao_votos","code":"casamento","priority":116,"pattern":"\\b(renovacao de votos|renovar os votos|reafirmacao dos votos|confirmacao dos votos)\\b","certainty":"direct"},{"id":"M04","group":"matrimonial","subtype":"noivado","code":"casamento","priority":115,"pattern":"\\b(noivado|festa de noivado|ficamos noivos)\\b","certainty":"direct"},{"id":"M05","group":"matrimonial","subtype":"casamento","code":"casamento","priority":108,"pattern":"\\b(casamento|casar|noiva|noivo|matrimonio|celebracao de uniao)\\b","certainty":"direct"},{"id":"E01","group":"empresarial_institucional","subtype":"aniversario_empresa","code":"empresarial","priority":121,"pattern":"\\b(aniversario (da |de |do )?(empresa|firma|companhia|negocio|instituicao)|empresa (faz|completa|vai fazer|esta fazendo) \\d{1,3} anos|(\\d{1,3} anos) (da |de )?(empresa|firma|fundacao)|centenario da empresa)\\b","certainty":"direct"},{"id":"E02","group":"empresarial_institucional","subtype":"escolar","code":"empresarial","priority":113,"pattern":"\\b(confraternizacao (do pessoal|da equipe|dos funcionarios|de professores) da escola|festa da escola|evento escolar|festa dos professores|festa da turma|gincana escolar)\\b","certainty":"direct"},{"id":"E03","group":"empresarial_institucional","subtype":"academico","code":"empresarial","priority":112,"pattern":"\\b(simposio|congresso academico|encontro academico|jornada academica|semana academica)\\b","certainty":"direct"},{"id":"E04","group":"empresarial_institucional","subtype":"fundacao_institucional","code":"empresarial","priority":111,"pattern":"\\b(aniversario de fundacao|fundacao (da escola|da universidade|do instituto)|aniversario (do instituto|da faculdade|da universidade))\\b","certainty":"direct"},{"id":"E05","group":"empresarial_institucional","subtype":"confraternizacao_corporativa","code":"empresarial","priority":107,"pattern":"\\b(confraternizacao (da empresa|da firma|corporativa|dos funcionarios|da equipe|do pessoal do trabalho)|festa (de funcionarios|da firma|da empresa)|festa de fim de ano da empresa)\\b","certainty":"direct"},{"id":"E06","group":"empresarial_institucional","subtype":"premiacao_empresa","code":"empresarial","priority":105,"pattern":"\\b(premiacao empresarial|premiacao (da empresa|dos colaboradores)|premio corporativo|reconhecimento da equipe)\\b","certainty":"direct"},{"id":"E07","group":"empresarial_institucional","subtype":"feira_comercial","code":"empresarial","priority":104,"pattern":"\\b(feira comercial|feira de negocios|exposicao comercial|feira profissional)\\b","certainty":"direct"},{"id":"E08","group":"empresarial_institucional","subtype":"congresso_profissional","code":"empresarial","priority":103,"pattern":"\\b(congresso|encontro profissional|seminario institucional)\\b","certainty":"direct"},{"id":"E09","group":"empresarial_institucional","subtype":"corporativo_generico","code":"empresarial","priority":90,"pattern":"\\b(evento corporativo|evento empresarial|evento institucional|confraternizacao da firma|evento de rh|pessoal do rh)\\b","certainty":"direct"},{"id":"R01","group":"cultural_religioso","subtype":"bar_mitzvah","code":null,"priority":118,"pattern":"\\b(bar mitzv[ah]+|bar mitsv[ah]+)\\b","certainty":"direct"},{"id":"R02","group":"cultural_religioso","subtype":"bat_mitzvah","code":null,"priority":118,"pattern":"\\b(bat mitzv[ah]+|bat mitsv[ah]+)\\b","certainty":"direct"},{"id":"R03","group":"cultural_religioso","subtype":"seijin_shiki","code":null,"priority":118,"pattern":"\\b(seijin.?shiki|dia da maioridade japonesa)\\b","certainty":"direct"},{"id":"R04","group":"cultural_religioso","subtype":"vesak","code":null,"priority":118,"pattern":"\\b(vesak|visakha puja)\\b","certainty":"direct"},{"id":"R05","group":"cultural_religioso","subtype":"aniversario_batismo","code":null,"priority":117,"pattern":"\\b(aniversario (de |do )?batismo|comemoracao do batismo)\\b","certainty":"direct"},{"id":"R06","group":"cultural_religioso","subtype":"onomastico","code":null,"priority":117,"pattern":"\\b(onomastico|dia do santo|dia do meu santo)\\b","certainty":"direct"},{"id":"R07","group":"cultural_religioso","subtype":"data_hebraica_nao_especificada","code":null,"priority":104,"pattern":"\\b(data comemorativa (no |do )?calendario (hebraico|judaico)|festa do calendario hebraico)\\b","certainty":"direct"},{"id":"R08","group":"cultural_religioso","subtype":"marco_religioso_nao_especificado","code":null,"priority":103,"pattern":"\\b(comemoracao religiosa de maioridade|cerimonia religiosa de maioridade|rito religioso de passagem)\\b","certainty":"contextual"},{"id":"P01","group":"aniversario_pessoal","subtype":"calendario_hebraico","code":"aniversario","priority":119,"pattern":"\\b(aniversario (no |pelo |em )?calendario (hebraico|judaico)|aniversario hebraico)\\b","certainty":"direct"},{"id":"P02","group":"aniversario_pessoal","subtype":"debutante","code":"debutante","priority":118,"pattern":"\\b(debutante|festa de 15 anos|15 anos da minha filha|festa dos quinze anos|quinze anos|quinceanera)\\b","certainty":"direct"},{"id":"P03","group":"aniversario_pessoal","subtype":"sweet_sixteen","code":"aniversario","priority":117,"pattern":"\\b(sweet sixteen|festa de 16 anos|dezesseis anos)\\b","certainty":"direct"},{"id":"P04","group":"aniversario_pessoal","subtype":"mesversario","code":"aniversario","priority":117,"pattern":"\\b(mesversario|comemoracao mensal do bebe)\\b","certainty":"direct"},{"id":"P05","group":"aniversario_pessoal","subtype":"primeiro_aniversario","code":"aniversario","priority":116,"pattern":"\\b(um aninho|1 aninho|primeiro aniversario|festa de 1 ano|completar 1 aninho)\\b","certainty":"direct"},{"id":"P06","group":"aniversario_pessoal","subtype":"meio_aniversario","code":"aniversario","priority":116,"pattern":"\\b(half.birthday|meio aniversario)\\b","certainty":"direct"},{"id":"P07","group":"aniversario_pessoal","subtype":"aniversario_postumo","code":"aniversario","priority":115,"pattern":"\\b(aniversario postumo|aniversario de nascimento (de|do|da) (falecido|falecida)|homenagem no aniversario de nascimento)\\b","certainty":"direct"},{"id":"P08","group":"aniversario_pessoal","subtype":"infantil","code":"aniversario","priority":113,"pattern":"\\b(aniversario infantil|aniversario (do|da) (meu filho|minha filha|pequeno|pequena|crianca)|niver (do|da) (filho|filha))\\b","certainty":"direct"},{"id":"P09","group":"aniversario_pessoal","subtype":"adolescente","code":"aniversario","priority":110,"pattern":"\\b(aniversario adolescente|aniversario de adolescente)\\b","certainty":"direct"},{"id":"P10","group":"aniversario_pessoal","subtype":"centenario_pessoal","code":"aniversario","priority":110,"pattern":"\\b(centenario (da|do|de) (minha mae|meu pai|minha avo|meu avo|uma pessoa)|100 anos (da|do) (minha mae|meu pai|meu avo|minha avo))\\b","certainty":"direct"},{"id":"P11","group":"aniversario_pessoal","subtype":"marco_de_idade","code":"aniversario","priority":109,"pattern":"\\b(meio seculo|cinquentao|cinquentona|sessentao|sessentona|festa de (18|20|21|30|40|50|60|70|80|90|100) anos|aniversario de (18|20|21|30|40|50|60|70|80|90|100) anos|festa de maioridade)\\b","certainty":"direct"},{"id":"P12","group":"aniversario_pessoal","subtype":"aniversario_nao_especificado","code":"aniversario","priority":66,"pattern":"\\b(aniversario|niver|b.day|mais um ano de vida|fazer anos|dia do aniversario|aniversariante)\\b","certainty":"direct"},{"id":"P13","group":"aniversario_pessoal","subtype":"aniversario_nao_especificado","code":"aniversario","priority":64,"pattern":"\\b(cantar parabens para (meu|minha|nosso|nossa)|assoprar velinhas (do|da|com)|apagar velinhas (do|da|com))\\b","certainty":"contextual"},{"id":"F01","group":"formatura","subtype":"formatura","code":"formatura","priority":115,"pattern":"\\b(formatura|colacao de grau|festa dos formandos|baile de formatura|conclusao do curso|cerimonia de graduacao)\\b","certainty":"direct"}],"features":[{"id":"surpresa","pattern":"\\b(surpresa|festa surpresa)\\b"},{"id":"tematico","pattern":"\\b(tematic[ao]|festa a fantasia|tema da festa)\\b"},{"id":"beneficente","pattern":"\\b(beneficente|solidari[ao]|arrecadacao)\\b"},{"id":"virtual","pattern":"\\b(virtual|online|por videochamada)\\b"},{"id":"religioso","pattern":"\\b(religios[ao]|espiritual|igreja|templo)\\b"},{"id":"cultural","pattern":"\\b(cultural|tradicional|judaic[ao]|hebraic[ao]|japones[ao])\\b"}],"contextual_terms":["\\b(data especial|dia importante|presentinho|mimo|presentear|festinha|nao deixar passar em branco|pessoa especial|cartaozinho|bolo e balao)\\b"],"numeric_menu":{"1":{"code":"casamento","group":"matrimonial","subtype":"casamento"},"2":{"code":"aniversario","group":"aniversario_pessoal","subtype":"aniversario_nao_especificado"},"3":{"code":"debutante","group":"aniversario_pessoal","subtype":"debutante"},"4":{"code":"empresarial","group":"empresarial_institucional","subtype":"corporativo_generico"}}};
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

const purposeDecision=classifyPurposeV1({text,context:st},TAXONOMY_PURPOSE);
const purpose=purposeDecision.operational;
const months={janeiro:1,fevereiro:2,marco:3,abril:4,maio:5,junho:6,julho:7,agosto:8,setembro:9,outubro:10,novembro:11,dezembro:12,jan:1,fev:2,mar:3,abr:4,mai:5,jun:6,jul:7,ago:8,set:9,out:10,nov:11,dez:12};
const toDate=(d,m,y)=>{d=+d;m=+m;y=+y;if(y<100)y+=2000;if(y<2020||y>2100||m<1||m>12||d<1||d>31)return null;const iso=y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');let z=new Date(iso+'T12:00:00Z');return z.getUTCDate()===d&&z.getUTCMonth()+1===m&&z.getUTCFullYear()===y?iso:null};
let date=null,partial=null,dm=t.match(/\b(\d{1,2})[ /.-]+(\d{1,2})[ /.-]+(\d{2,4})\b/);if(dm)date=toDate(dm[1],dm[2],dm[3]);if(!date){dm=t.match(/\b(\d{1,2})\s*(?:de\s+)?(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\s*(?:de\s+)?(\d{4})\b/);if(dm)date=toDate(dm[1],months[dm[2]],dm[3]);}
if(!date){let q=t.match(/\b(\d{1,2})[/.](\d{1,2})\b/);if(q)partial=q[0];else {let dayMonth=t.match(/\b(\d{1,2})\s*(?:de\s+)?(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/);if(dayMonth)partial=dayMonth[0];}if(!partial&&/\b(mes que vem|segundo semestre|em (janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)|ainda estou vendo a data)\b/.test(t))partial=text;}
if(!date&&facts.event_date_partial&&/\bano\b/.test(t)){const yy=t.match(/\b(20\d{2})\b/),dd=String(facts.event_date_partial).match(/^(\d{1,2})[/.](\d{1,2})$/);if(yy&&dd)date=toDate(dd[1],dd[2],yy[1]);}
const cities=['mogi das cruzes','suzano','poa','santa isabel','guarulhos','itaquaquecetuba','bertioga','santo andre','ferraz de vasconcelos','santos','campinas','sao bernardo do campo','sao paulo','ar uja'];
const aliases={'mogi das cruzes':['mogi das cruzes','mogi'],'itaquaquecetuba':['itaquaquecetuba','itaqua'],'sao bernardo do campo':['sao bernardo do campo','sbc'],'ar uja':['aruja']};
const located=cities.filter(c=>(aliases[c]??[c]).some(a=>(' '+t+' ').includes(' '+a+' ')));
let city=located.length===1?located[0]:null;
if(city==='ar uja')city='aruja';
let district=city==='sao paulo'?(t.match(/\bzona (leste|oeste|norte|sul|central)\b/)??[])[0]:null;
const vagueGeo=/\b(alto tiete|grande sao paulo)\b/.test(t);
const rel=/\b(sou a noiva|sou noiva)\b/.test(t)?'noiva':/\b(sou o noivo|sou noivo)\b/.test(t)?'noivo':/\bmae (da|do) (noiva|noivo|debutante|aniversariante)\b/.test(t)?'mae':/\bpai (da|do) (noiva|noivo|debutante|aniversariante)\b/.test(t)?'pai':/\b(irma|irmao|tia|tio|sobrinha)\b/.test(t)?'familiar':/\b(sou assessora|somos assessoria|sou organizadora|trabalho com cerimonial)\b/.test(t)?'assessoria':/\b(sou a debutante|a debutante sou eu)\b/.test(t)?'homenageada':/\b(sou do rh|responsavel pelas cotacoes)\b/.test(t)?'responsavel_empresa':null;
const who=text.match(/\b(?:me chamo|meu nome é|sou a|sou o)\s+([A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+)?)/i);if(who&&/^(noiva|noivo|mae|mãe|pai|debutante|assessora|responsavel|responsável|organizadora|pessoa|irma|irmã|irmao|irmão|rh)\b/i.test(who[1]))who[1]=null;
let origin=null;for(const [o,re] of [['google_maps',/\b(google maps|no maps|no perfil da empresa no maps)\b/],['instagram',/\b(instagram|pelo insta)\b/],['facebook',/\b(facebook|pelo face|no face)\b/],['google',/\bgoogle\b/],['foto_impressa',/\b(foto impressa|verso da foto|fotos da festa|lembranca impressa|material.*fotos)\b/],['indicacao',/\b(indicacao|indicou|recomendou|passou o contato|me passou o contato)\b/]])if(!origin&&re.test(t))origin=o;
if(cta.verified===true&&cta.source)origin=cta.source;
if(!duplicate&&category==='commercial'){add('services',desired,cta.verified&&mentioned.length===0?'verified_cta':'customer');add('purpose',purpose);add('event_date',date);if(city&&city!=='sao paulo')add('city',city);if(city==='sao paulo')add('city',city);add('district',district);add('relationship_to_event',rel);if(who)add('contact_name',who[1]);add('acquisition_source',origin,cta.verified?'verified_cta':'customer_declared');if(partial)add('event_date_partial',partial);}
// Trace EVERY decision in the inbound message evidence journal. Only verified legacy
// purpose values are written as canonical event facts by the existing Supabase RPC.
if(category==='commercial'&&!duplicate){
  evidence.purpose_taxonomy={group:purposeDecision.group,subtype:purposeDecision.subtype,features:purposeDecision.features,
    status:purposeDecision.status,certainty:purposeDecision.certainty,rule_id:purposeDecision.rule_id,
    matches:purposeDecision.matches,version:purposeDecision.version,requires_confirmation:purposeDecision.requires_confirmation};
  if(extracted.purpose)evidence.purpose={source:'deterministic_taxonomy',rule_id:purposeDecision.rule_id,
    group:purposeDecision.group,subtype:purposeDecision.subtype,features:purposeDecision.features,
    matches:purposeDecision.matches,version:purposeDecision.version,certainty:purposeDecision.certainty};
}
const missing=[];if(!facts.services?.length)missing.push('service');if(!facts.purpose)missing.push('purpose');if(!facts.event_date)missing.push('event_date');if(!facts.city||(facts.city==='sao paulo'&&!facts.district))missing.push('event_location');
const routeMap={service:'FLOW_1_SERVICE',purpose:'FLOW_2_PURPOSE',event_date:'FLOW_3_DATE',event_location:'FLOW_4_LOCALITY'};
let next=missing.length?routeMap[missing[0]]:'FLOW_5_READY';if(category!=='commercial')next=category==='operational'?'ROUTE_OPERATIONS':'ROUTE_HUMAN';if(Object.keys(st.pending_conflicts).length)next='CLARIFY_CONFLICT';if(duplicate)next='DUPLICATE_NOOP';if(i.human_lock)next='HUMAN_LOCK_NO_REPLY';
let question=next==='FLOW_1_SERVICE'?'Qual serviço deseja orçar?\n1. Cabine de Fotos\n2. Totem de Fotos\n3. Plataforma 360\n4. Set Fotográfico\n5. Fotógrafo':next==='FLOW_2_PURPOSE'?'Para qual ocasião será o serviço?\n1. Casamento\n2. Aniversário\n3. Debutante (15 anos)\n4. Evento empresarial':next==='FLOW_3_DATE'?'Qual é a data completa da festa (dia, mês e ano)?':next==='FLOW_4_LOCALITY'?(facts.city==='sao paulo'?'Qual o bairro ou região em São Paulo?':'Em qual cidade será a festa?'):next==='FLOW_5_READY'?'Já tenho os dados necessários para verificar seu orçamento. 😊':next==='CLARIFY_CONFLICT'?'Pode confirmar os dados divergentes sobre '+Object.keys(st.pending_conflicts).join(', ')+'?':null;
if(!duplicate&&id)processed.push(id);
if(!duplicate&&question&&category==='commercial')st.introduced=true;
st.facts=facts;st.processed_message_ids=[...new Set(processed)].slice(-100);st.pending_question=next==='FLOW_1_SERVICE'?'service':next==='FLOW_2_PURPOSE'?'purpose':next==='FLOW_3_DATE'?'event_date':next==='FLOW_4_LOCALITY'?'event_location':null;
// Deterministic fields and numeric menu options never use an LLM.
// JEV only handles an unresolved semantic service description, or an open-text
// purpose reply to a purpose question (never a fixed numeric option).
const serviceHint=/\b(equipamento|maquina|foto|fotografias?|video|gira|giratoria|imprime|impressao|lembrancas?|selfie|camera|espelho|fotografo|fotografico)\b/.test(t);
const safeSemantic=category==='commercial'&&!duplicate&&!i.human_lock&&!Object.keys(st.pending_conflicts).length&&t.length>7&&!/^[1-5]$/.test(t)&&!comparing;
let semanticTarget=null;
if(safeSemantic&&!facts.services?.length&&!desired.length&&serviceHint&&!cta.verified)semanticTarget='service';
else if(safeSemantic&&facts.services?.length&&!facts.purpose&&!purpose&&i.state?.pending_question==='purpose'&&purposeDecision.requires_jev)semanticTarget='purpose';
const greet=!i.state?.introduced&&category==='commercial'&&question?'Olá! Eu sou a Click, assistente virtual da Click Mais Cabine 😊\n\n':'';
return {json:{sender_id:i.sender_id??m.from??null,text,requires_jev:semanticTarget!==null,semantic_target:semanticTarget,flow:'FLOW_1',version:'0.3.0-taxonomy-v1',message_id:id,accepted:!!text,duplicate,category,extracted,conflicts,evidence,services_mentioned:mentioned,service_needs_choice:comparing,date_partial:partial,locality_partial:vagueGeo,context:st,missing_required:missing,next_flow:next,ready_for_quote_checks:next==='FLOW_5_READY',suggested_reply:question?greet+question:null,effects:{database_write:false,whatsapp_reply:false,quote_calculation:false}}};