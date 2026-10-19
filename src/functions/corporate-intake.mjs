import { classifyPurposeV1 } from './classify-event-purpose-v1.js';

const normCorp=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
function corporateDate(d,m,y) {
  const iso=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const v=new Date(iso+'T12:00:00Z');
  return Number(y)>=2020 && Number(y)<=2100 && !isNaN(v) && v.toISOString().slice(0,10)===iso ? iso : null;
}
export function qualifyCorporate(input, legacy, taxonomy, official) {
  const text=String(input.text??legacy.text??''),t=normCorp(text);
  const previous=input.state??{},old=previous.facts??{};
  const classified=classifyPurposeV1({text,context:previous},taxonomy);
  const isCorporate=old.purpose==='empresarial'||classified.operational==='empresarial'||classified.matches.some(m=>m.group==='empresarial_institucional')||legacy.extracted?.purpose==='empresarial';
  if(!isCorporate || legacy.category!=='commercial' || legacy.duplicate || input.human_lock) return legacy;
  const extracted={...legacy.extracted},evidence={...legacy.evidence};
  if(/\b(?:quero|preciso|gostaria|posso).{0,25}(?:falar|conversar).{0,25}(?:atendente|responsavel|humano|pessoa)|\batendimento humano\b/.test(t)) evidence._handoff_reason='HND-EXPLICIT-HUMAN';
  for(const [key,conflict] of Object.entries(legacy.conflicts??{})) extracted[key]=conflict.incoming;
  if(classified.operational==='empresarial') {extracted.purpose='empresarial';if(old.purpose_ambiguous==='true')extracted.purpose_ambiguous='false';}
  if(classified.status==='conflict') {extracted.purpose='empresarial';extracted.purpose_ambiguous='true';}
  if(/^(sim|confirmo|correto|isso|pode corrigir)[.!\s]*$/.test(t)) {
    for(const [key,c] of Object.entries(previous.pending_conflicts??{})) extracted[key]=c.incoming;
  }
  const words={um:1,uma:1,dois:2,duas:2,tres:3,quatro:4,cinco:5,seis:6,sete:7};
  const number=s=>words[s]??Number(s);
  const day=t.match(/\b(\d+|um|uma|dois|duas|tres|quatro|cinco|seis|sete)\s+dias?\b/);
  if(day) extracted.dias_evento=number(day[1]);
  else if(previous.pending_question==='corporate_days' && /^(\d+|um|uma|dois|duas|tres|quatro|cinco|seis|sete)$/.test(t)) extracted.dias_evento=number(t);
  const periods=t.match(/\b(\d+|um|uma|dois|duas|tres|quatro)\s+periodos?\b/);
  const hours=t.match(/\b(\d+)\s*(?:h|horas?)(?:\s+por\s+dia|\s+diarias?|\s+em cada dia)?\b/);
  if(periods) extracted.periodos_por_dia=number(periods[1]);
  else if(hours) extracted.periodos_por_dia=Number(hours[1])/4;
  else if(previous.pending_question==='corporate_periods' && /^(\d+|um|dois|tres|quatro)$/.test(t)) extracted.periodos_por_dia=number(t);

  let dates=[];
  const compact=t.match(/\b(?:de\s+)?(\d{1,2})\s*(?:a|ate)\s*(\d{1,2})[/.](\d{1,2})[/.](20\d{2})\b/);
  const hits=[...t.matchAll(/\b(\d{1,2})[/.](\d{1,2})[/.](20\d{2})\b/g)];
  if(compact) dates=[corporateDate(compact[1],compact[3],compact[4]),corporateDate(compact[2],compact[3],compact[4])];
  else if(hits.length) dates=hits.map(m=>corporateDate(m[1],m[2],m[3]));
  else if(extracted.event_date) dates=[extracted.event_date];
  else if(old.event_date && !old.event_dates) dates=[old.event_date];
  const range=!!compact || /\d{1,2}[/.]\d{1,2}[/.]20\d{2}\s*(?:a|ate|-)\s*\d{1,2}[/.]\d{1,2}[/.]20\d{2}/.test(t);
  if(dates.length && dates.every(Boolean)) {
    if(range && dates.length===2 && dates[0]<=dates[1]) {
      const list=[];
      for(let d=new Date(dates[0]+'T12:00:00Z');d.toISOString().slice(0,10)<=dates[1];d.setUTCDate(d.getUTCDate()+1)) list.push(d.toISOString().slice(0,10));
      dates=list;
    }
    const days=extracted.dias_evento??old.dias_evento;
    if(old.event_dates?.length<days && !/\b(corrigir|trocar|mudar|altere|na verdade)\b/.test(t)) dates=[...new Set([...old.event_dates,...dates])].sort();
    if(dates.length) {
      extracted.event_dates=dates;extracted.data_inicio=[...dates].sort()[0];
      extracted.data_fim=[...dates].sort().at(-1);extracted.event_date=extracted.data_inicio;
    }
  }
  const terms=official.localities.map(l=>({phrase:normCorp(l.canonical_name),name:l.canonical_name}));
  for(const a of official.aliases) terms.push({phrase:normCorp(a.alias),name:official.localities.find(l=>l.id===a.locality_id)?.canonical_name});
  const found=terms.filter(x=>x.name && (' '+t.replace(/[,.!?;:]/g,' ')+' ').includes(' '+x.phrase+' '));
  const longest=found.filter(x=>!found.some(y=>y.phrase!==x.phrase && (' '+y.phrase+' ').includes(' '+x.phrase+' ')));
  const names=[...new Set(longest.map(x=>x.name))];
  if(names.length===1) {extracted.city=normCorp(names[0]);if(old.locality_ambiguous==='true')extracted.locality_ambiguous='false';}
  else if(names.length>1) {delete extracted.city;extracted.locality_ambiguous='true';}
  // SQL commits proposals and resolves conflicts; never trust predicted local state.
  for(const key of Object.keys(extracted)) evidence[key]=evidence[key]??'customer_corporate_deterministic';
  evidence._transport=input.transport_origin==='meta_webhook'?'meta_webhook':'lab_replay';
  return {...legacy,extracted,evidence,corporate_intake:true,requires_jev:!evidence._handoff_reason&&legacy.requires_jev&&legacy.semantic_target==='service',
    semantic_target:legacy.semantic_target==='service'?'service':null,taxonomy_version:taxonomy.version};
}

export function corporateNext(facts) {
  if(!facts.services?.length)return 'FLOW_1_SERVICE';
  if(!facts.purpose)return 'FLOW_2_PURPOSE';
  if(!Number.isSafeInteger(facts.dias_evento)||facts.dias_evento<1)return 'FLOW_CORPORATE_DAYS';
  if(facts.periodos_por_dia===undefined)return 'FLOW_CORPORATE_PERIODS';
  if(![1,2,3].includes(facts.periodos_por_dia)||facts.services.length!==1||facts.purpose_ambiguous==='true')return 'ROUTE_HUMAN';
  if(!facts.event_dates?.length || new Set(facts.event_dates).size!==facts.dias_evento || facts.event_dates.length!==facts.dias_evento)return 'CLARIFY_CORPORATE_DATES';
  if(!facts.city || facts.locality_ambiguous==='true' || (facts.city==='sao paulo'&&!facts.district))return 'FLOW_4_LOCALITY';
  return 'FLOW_5_READY';
}

export function qualificationReply(result) {
  if(!result.accepted||result.duplicate||['DUPLICATE_NOOP','HUMAN_LOCK_NO_REPLY','ROUTE_OPERATIONS'].includes(result.next_flow))return null;
  const f=result.context?.facts??{},flow=result.next_flow;
  const questions={FLOW_1_SERVICE:'Qual serviço você deseja para o evento?',FLOW_2_PURPOSE:'Qual é o tipo de evento?',
    FLOW_CORPORATE_DAYS:'Quantos dias terá o evento?',FLOW_CORPORATE_PERIODS:'Quantos períodos de 4 horas serão necessários por dia: 1 (4h), 2 (8h) ou 3 (12h)?',
    CLARIFY_CORPORATE_DATES:f.event_dates?.length && f.event_dates.length<f.dias_evento?'Já anotei a(s) data(s) informada(s). Quais são as datas restantes (dia, mês e ano)?':'Quais são as datas completas de todos os dias do evento (dia, mês e ano)?',
    FLOW_4_LOCALITY:f.city==='sao paulo'?'Em qual bairro ou região de São Paulo será o evento?':'Em qual cidade ou região será o evento?',
    CLARIFY_CONFLICT:'Recebi informações diferentes. Você confirma os novos dados?',
    ROUTE_HUMAN:'Essa configuração precisa da confirmação da nossa equipe. Vou encaminhar seu pedido ao responsável.'};
  if(flow==='FLOW_5_READY')return null;
  const last=result.changed_keys??[];
  let ack='';
  if(last.includes('periodos_por_dia'))ack=`${f.periodos_por_dia} período(s) de 4 horas por dia, certo. `;
  else if(last.includes('dias_evento'))ack=`${f.dias_evento} dia(s) de evento, certo. `;
  else if(last.includes('purpose'))ack='É um evento empresarial, certo. ';
  else if(last.includes('services'))ack='Entendi o serviço desejado. ';
  else if(last.includes('event_dates'))ack='Entendi as datas do evento. ';
  return questions[flow]?ack+questions[flow]:null;
}
