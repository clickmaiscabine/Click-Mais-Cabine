// LAB orchestration/presentation only. Pricing remains in the existing F2 engine.
const normalizeSocial=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export function completeSocialExtraction(input, legacy, official) {
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

export function socialQualificationReply(result) {
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

export function socialDateAvailabilityReply({eventDate,activeReservations}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(eventDate ?? ''))) throw new Error('SOCIAL_EVENT_DATE_MISSING');
  const display = eventDate.split('-').reverse().join('/');
  if (activeReservations >= 2) {
    return `*Verifiquei a agenda.*\n\nA data ${display} está *lotada*.\n\nDigite o número correspondente à opção desejada\n\n2. Quero refazer.`;
  }
  return `*Que ótimo!*\n\nA data ${display} tem *disponibilidade preliminar!* 🙌\n\nConfirme se a data da sua festa está correta para continuarmos.\n\n*Digite o número correspondente à opção desejada*\n\n1. 💯 *SIM! Vamos continuar!*\n2. Quero refazer.`;
}

export function prepareSocialLabPresentation(input, services) {
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

export function composeSocialLabResponse(input) {
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
