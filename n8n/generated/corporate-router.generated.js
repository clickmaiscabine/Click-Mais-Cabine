
const normCorp=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
function corporateDate(d,m,y) {
  const iso=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const v=new Date(iso+'T12:00:00Z');
  return Number(y)>=2020 && Number(y)<=2100 && !isNaN(v) && v.toISOString().slice(0,10)===iso ? iso : null;
}
function consecutiveCorporateDates(start, days) {
  const dates=[],cursor=new Date(start+'T12:00:00Z');
  for(let index=0;index<days;index++) {
    dates.push(cursor.toISOString().slice(0,10));
    cursor.setUTCDate(cursor.getUTCDate()+1);
  }
  return dates;
}
function qualifyCorporate(input, legacy, taxonomy, official) {
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
    // A single start date means consecutive calendar days by default.  The
    // customer may explicitly opt out by saying that dates are not consecutive.
    const nonConsecutive=/\b(?:nao\s+(?:sao|serao)\s+(?:dias?\s+)?seguidos|dias?\s+alternados?|nao\s+consecutiv[oa]s?|intercalados?)\b/.test(t);
    if(!range && dates.length===1 && Number.isSafeInteger(days) && days>0 && !nonConsecutive) dates=consecutiveCorporateDates(dates[0],days);
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

function corporateNext(facts) {
  if(!facts.services?.length)return 'FLOW_1_SERVICE';
  if(!facts.purpose)return 'FLOW_2_PURPOSE';
  if(!Number.isSafeInteger(facts.dias_evento)||facts.dias_evento<1)return 'FLOW_CORPORATE_DAYS';
  if(facts.periodos_por_dia===undefined)return 'FLOW_CORPORATE_PERIODS';
  if(![1,2,3].includes(facts.periodos_por_dia)||facts.services.length!==1||facts.purpose_ambiguous==='true')return 'ROUTE_HUMAN';
  if(!facts.event_dates?.length || new Set(facts.event_dates).size!==facts.dias_evento || facts.event_dates.length!==facts.dias_evento)return 'CLARIFY_CORPORATE_DATES';
  if(!facts.city || facts.locality_ambiguous==='true' || (facts.city==='sao paulo'&&!facts.district))return 'FLOW_4_LOCALITY';
  return 'FLOW_5_READY';
}

function qualificationReply(result) {
  if(!result.accepted||result.duplicate||['DUPLICATE_NOOP','HUMAN_LOCK_NO_REPLY','ROUTE_OPERATIONS'].includes(result.next_flow))return null;
  const f=result.context?.facts??{},flow=result.next_flow;
  const questions={FLOW_1_SERVICE:'Qual serviço você deseja para o evento?',FLOW_2_PURPOSE:'Qual é o tipo de evento?',
    FLOW_CORPORATE_DAYS:'Quantos dias terá o evento?',FLOW_CORPORATE_PERIODS:'Quantos períodos de 4 horas serão necessários por dia: 1 (4h), 2 (8h) ou 3 (12h)?',
    CLARIFY_CORPORATE_DATES:'Para um evento em dias não consecutivos, informe todas as datas completas (dia, mês e ano).',
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
  else if(last.includes('event_dates')) {
    const dates=(f.event_dates??[]).map(date=>date.split('-').reverse().join('/'));
    ack=dates.length?`Anotei ${dates.join(' e ')} para o evento. `:'Entendi as datas do evento. ';
  }
  return questions[flow]?ack+questions[flow]:null;
}

// LAB orchestration/presentation only. Pricing remains in the existing F2 engine.
const normalizeSocial=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
function completeSocialExtraction(input, legacy, official) {
  if(input.sender_id!=='5511956390586'||legacy.category!=='commercial'||legacy.duplicate||input.human_lock)return legacy;
  const t=normalizeSocial(input.text),previous=input.state??{};
  const extracted={...legacy.extracted},evidence={...legacy.evidence};
  for(const [key,c]of Object.entries(legacy.conflicts??{}))extracted[key]=c.incoming;
  if(/^(sim|confirmo|correto|isso|pode corrigir)[.!\s]*$/.test(t))for(const [key,c]of Object.entries(previous.pending_conflicts??{}))extracted[key]=c.incoming;
  if(/\b(?:quero|preciso|gostaria|posso).{0,25}(?:falar|conversar).{0,25}(?:atendente|responsavel|humano|pessoa)|\batendimento humano\b/.test(t))evidence._handoff_reason='HND-EXPLICIT-HUMAN';
  // Resolve aliases from the same official source used by the corporate intake.
  const terms=official.localities.map(l=>({term:normalizeSocial(l.canonical_name),name:l.canonical_name}));
  for(const a of official.aliases)terms.push({term:normalizeSocial(a.alias),name:official.localities.find(l=>l.id===a.locality_id)?.canonical_name});
  const found=terms.filter(x=>x.name&&(' '+t.replace(/[,.!?;:]/g,' ')+' ').includes(' '+x.term+' '));
  const longest=found.filter(x=>!found.some(y=>y.term!==x.term&&(' '+y.term+' ').includes(' '+x.term+' ')));
  const names=[...new Set(longest.map(x=>x.name))];
  if(names.length===1)extracted.city=normalizeSocial(names[0]);
  // Multiple locations must not silently replace the persisted locality.
  if(names.length>1){delete extracted.city; evidence._handoff_reason='HND-LOCALITY-REVIEW';}
  for(const k of Object.keys(extracted))evidence[k]??='customer_social_deterministic';
  evidence._transport=input.transport_origin==='meta_webhook'?'meta_webhook':'lab_replay';
  return {...legacy,extracted,evidence,requires_jev:!evidence._handoff_reason&&legacy.requires_jev};
}

function socialQualificationReply(result) {
  if(!result.accepted||result.duplicate||['DUPLICATE_NOOP','HUMAN_LOCK_NO_REPLY','ROUTE_OPERATIONS','ROUTE_HUMAN','FLOW_5_READY'].includes(result.next_flow))return null;
  const f=result.context?.facts??{},changed=result.changed_keys??[];
  const serviceNames={cabine_fotos:'Cabine de Fotos',totem_fotos:'Totem de Fotos',plataforma_360:'Plataforma 360',set_fotografico:'Set Fotográfico',fotografo:'Fotógrafo'};
  const questions={
    FLOW_1_SERVICE:'Olá!!\n\nSomos a *Click Mais Photo Cabine.*\nSeja bem vinda(o)!\n*Meu nome é Click*, sou a assistente virtual daqui da empresa e vou fazer agora mesmo o *seu orçamento!*\n\nPara qual serviço você precisa do orçamento?',
    FLOW_2_PURPOSE:'Legal!\n\n*Qual é o tipo ou finalidade da festa?*',
    FLOW_3_DATE:'Legal!\n\nQual a data de início da sua festa?',
    FLOW_4_LOCALITY:f.city==='sao paulo'?'Em qual bairro ou região de São Paulo será a festa?':'Em qual cidade será a festa?',CLARIFY_CONFLICT:'Recebi informações diferentes. Você confirma os novos dados?'};
  let ack='';
  if(changed.includes('event_date'))ack='Anotei a data '+f.event_date.split('-').reverse().join('/')+'. ';
  else if(changed.includes('purpose'))ack='Entendi, '+(f.purpose==='debutante'?'uma festa de 15 anos':f.purpose)+'. ';
  else if(changed.includes('services'))ack=(f.services??[]).map(s=>serviceNames[s]??s).join(' e ')+', certo. ';
  else if(changed.includes('city'))ack='Anotei a localidade. ';
  const hello='';
  if(result.next_flow==='FLOW_4_LOCALITY'&&changed.includes('event_date')&&f.event_date){
    return hello+'Anotei a data '+f.event_date.split('-').reverse().join('/')+'. Confirma que é essa data para eu seguir com a consulta?';
  }
  const standardized=['FLOW_1_SERVICE','FLOW_2_PURPOSE','FLOW_3_DATE'];
  return questions[result.next_flow]?(standardized.includes(result.next_flow)?questions[result.next_flow]:hello+ack+questions[result.next_flow]):null;
}

function socialDateAvailabilityReply({eventDate,activeReservations}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(eventDate ?? ''))) throw new Error('SOCIAL_EVENT_DATE_MISSING');
  const display = eventDate.split('-').reverse().join('/');
  if (activeReservations >= 2) {
    return `*Verifiquei a agenda.*\n\nA data ${display} está *lotada*.\n\nDigite o número correspondente à opção desejada\n\n2. Quero refazer.`;
  }
  return `*Que ótimo!*\n\nA data ${display} tem *disponibilidade preliminar!* 🙌\n\nConfirme se a data da sua festa está correta para continuarmos.\n\n*Digite o número correspondente à opção desejada*\n\n1. 💯 *SIM! Vamos continuar!*\n2. Quero refazer.`;
}

function prepareSocialLabPresentation(input, services) {
  const q=input.quote_result;
  if(input.human_lock===true||input.status!=='ready'||q?.status!=='ready'||!q.customerVisible)return {...input,status:input.status==='human_required'?'human_required':'blocked',presentation:null,blockers:input.blockers?.length?input.blockers:[input.human_lock?'HUMAN_LOCK_ACTIVE':'QUOTE_RESULT_NOT_READY']};
  const codes=[...new Set(q.items.filter(x=>['main','addon'].includes(x.lineType)).map(x=>x.serviceCode))];
  const pixCents=Math.round(q.customerVisible.pix*100),signalCents=Math.round(pixCents/2);
  return {...input,action_authorized:true,action:'COMPOSE_QUOTE_PRESENTATION',presentation:{social_lab:true,
    services:codes.map(c=>services.names[c]??c),customer_visible_prices:q.customerVisible,
    signal:signalCents/100,balance:(pixCents-signalCents)/100,
    locality:input.locality_result.locality.canonicalName,event_date:input.facts.event_date,
    items:q.items.filter(x=>['main','addon'].includes(x.lineType)),
    includes:[...new Set(codes.flatMap(c=>services.includes[c]??services.general))],general:services.general,
    proof_social:services.proof_social,gift:input.date_policy?.gift??{eligible:false},
    media:services.media??{},availability:input.availability??{status:'unknown',reservation_prompt_authorized:false}}};
}

function composeSocialLabResponse(input) {
  const p=input.presentation;
  if(input.human_lock===true||input.action_authorized!==true||!p?.social_lab)return {...input,status:'blocked',candidate_text:null,blockers:['SOCIAL_PRESENTATION_NOT_AUTHORIZED']};
  const money=x=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:2,maximumFractionDigits:2}).format(x);
  const prices=p.customer_visible_prices;
  const lines=['*ORÇAMENTO — '+p.services.join(' + ')+'*','📍 '+p.locality,'📅 '+p.event_date.split('-').reverse().join('/'),''];
  if(p.items.length>1){lines.push('*Composição do orçamento:*',...p.items.map((x,i)=>'• '+(p.services[i]??x.serviceCode)+': '+money(x.finalPix)), '');}
  lines.push('💳 Cartão: *'+money(prices.card)+'*, em até 10x sem juros.','💰 À vista: *'+money(prices.pix)+'*.','50% de sinal: *'+money(p.signal)+'*.','Saldo no evento: *'+money(p.balance)+'*.','','*Inclusos:*',...p.includes.map(x=>'• '+x));
  if(p.gift.eligible===true)lines.push('','🎁 Álbum de Assinaturas de brinde (valor comercial '+money(p.gift.commercialValue)+'), conforme a condição homologada para sua data.');
  if(p.media.catalogue)lines.push('','Conheça nossos serviços: '+p.media.catalogue);
  lines.push('','Confira nossas avaliações no Google: '+p.proof_social,'');
  if(p.availability.status==='fully_booked')lines.push('A data está lotada. Este orçamento não confirma disponibilidade. Nossa equipe pode verificar outras datas.');
  else if(p.availability.status==='preliminary_available')lines.push('A disponibilidade é preliminar para a data consultada.');
  else lines.push('A disponibilidade ainda precisa ser confirmada pela equipe.');
  lines.push('A data só é garantida após contrato e pagamento do sinal.');
  if(p.availability.reservation_prompt_authorized===true)lines.push('','Gostaria de seguir com a tentativa de reserva para essa data?');
  const candidate_text=lines.join('\n');
  if(candidate_text.length>4096||candidate_text.includes('\\n'))return {...input,status:'blocked',candidate_text:null,blockers:['MESSAGE_FORMAT_INVALID']};
  return {...input,status:'ready',candidate_text,claimed_prices:prices,availability_claim:p.availability.status,blockers:[]};
}

const x=$json;
if(x.context?.facts?.purpose!=='empresarial'){
return {json:{...x,social_route:true,draft_response:socialQualificationReply(x),ready_for_price:x.next_flow==='FLOW_5_READY'}};
}
return {json:{...x,corporate_route:true,draft_response:qualificationReply(x),ready_for_price:x.next_flow==='FLOW_5_READY'}};
