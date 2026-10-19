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
let purpose=null;
if(/\b(casamento|casar|noiva|noivo)\b/.test(t))purpose='casamento';
else if(/\b(debutante|15 anos|quinze anos)\b/.test(t))purpose='debutante';
else if(/\b(aniversario|aniversariante|faz \d+ anos|festa surpresa)\b/.test(t))purpose='aniversario';
else if(/\b(confraternizacao|corporativ|empresa|empresarial|firma|eventos internos|sou do rh)\b/.test(t))purpose='empresarial';
else if(/\bformatura\b/.test(t))purpose='formatura';
// Numeric choices are interpreted ONLY when the last prompt asked the event purpose.
if(!purpose&&st.pending_question==='purpose'&&/^[1-4]$/.test(t))purpose={1:'casamento',2:'aniversario',3:'debutante',4:'empresarial'}[Number(t)];
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
else if(safeSemantic&&facts.services?.length&&!facts.purpose&&!purpose&&i.state?.pending_question==='purpose')semanticTarget='purpose';
const greet=!i.state?.introduced&&category==='commercial'&&question?'Olá! Eu sou a Click, assistente virtual da Click Mais Cabine 😊\n\n':'';
return {json:{sender_id:i.sender_id??m.from??null,text,requires_jev:semanticTarget!==null,semantic_target:semanticTarget,flow:'FLOW_1',version:'0.2.1-no-redundant-jev',message_id:id,accepted:!!text,duplicate,category,extracted,conflicts,evidence,services_mentioned:mentioned,service_needs_choice:comparing,date_partial:partial,locality_partial:vagueGeo,context:st,missing_required:missing,next_flow:next,ready_for_quote_checks:next==='FLOW_5_READY',suggested_reply:question?greet+question:null,effects:{database_write:false,whatsapp_reply:false,quote_calculation:false}}};
