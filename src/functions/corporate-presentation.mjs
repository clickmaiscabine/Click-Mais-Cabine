export function assessAvailability(dates, reservations, cards, checkedAt, listId) {
  const unknown=reason=>({status:'unknown',claim_authorized:false,reservation_prompt_authorized:false,reason,checked_at:checkedAt,
    dates:dates.map(date=>({date,active_reservations:reservations.filter(r=>r.data_evento===date&&r.status==='ativa').length}))});
  if(!Array.isArray(cards)||cards.length<5||cards.some(c=>c.error))return unknown('AGENDA_SOURCE_READ_FAILED');
  const source=[];
  for(const c of cards){
    if(!c.id||c.closed||c.idList!==listId)return unknown('AGENDA_SOURCE_INCOMPLETE');
    const date=String(c.name??'').slice(0,10);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){
      if(/^(etiquetas utilizadas|teste)$/i.test(String(c.name??'').trim()))continue;
      return unknown('AGENDA_SOURCE_INVALID_DATE');
    }
    const d=new Date(date+'T12:00:00Z');
    if(isNaN(d)||d.toISOString().slice(0,10)!==date)return unknown('AGENDA_SOURCE_INVALID_DATE');
    if(dates.includes(date))source.push({date,id:c.id});
  }
  const db=reservations.filter(r=>r.status==='ativa'&&dates.includes(r.data_evento)).map(r=>({date:r.data_evento,id:r.trello_card_id}));
  const key=rows=>rows.map(r=>r.date+':'+r.id).sort().join('|');
  if(key(source)!==key(db))return unknown('AGENDA_MIRROR_OUT_OF_SYNC');
  const perDate=dates.map(date=>({date,active_reservations:db.filter(r=>r.date===date).length}));
  const busy=perDate.some(d=>d.active_reservations>=2);
  return {status:busy?'fully_booked':'preliminary_available',claim_authorized:!busy,reservation_prompt_authorized:!busy,
    checked_at:checkedAt,freshness_evidence:'live_trello_read_matches_supabase_for_all_event_dates',dates:perDate};
}

export function prepareCorporatePresentation(input, services) {
  const q=input.quote_result,locked=input.human_lock===true;
  if(locked||input.status!=='ready'||q?.status!=='ready'||!q.corporate)return {...input,status:input.status==='human_required'?'human_required':'blocked',presentation:null,blockers:input.blockers?.length?input.blockers:[locked?'HUMAN_LOCK_ACTIVE':'QUOTE_RESULT_NOT_READY']};
  const code=q.items[0].serviceCode;
  const availability=input.availability??{status:'unknown',reservation_prompt_authorized:false};
  return {...input,status:'ready',action_authorized:true,action:'COMPOSE_QUOTE_PRESENTATION',presentation:{
    service:services.names[code],customer_visible_prices:q.customerVisible,corporate:q.corporate,
    locality:input.locality_result.locality.canonicalName,
    includes:services.includes[code]??services.general,proof_social:services.proof_social,
    availability,gift:{eligible:false},reservation_policy:'A data só é garantida após contrato e pagamento do sinal.'}};
}

export function composeCorporateResponse(input) {
  const p=input.presentation,c=p?.corporate;
  if(input.action_authorized!==true||input.human_lock===true||!c)return {...input,status:input.status==='human_required'?'human_required':'blocked',candidate_text:null,blockers:input.blockers?.length?input.blockers:['CORPORATE_PRESENTATION_NOT_AUTHORIZED']};
  const money=value=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
  const date=value=>value.split('-').reverse().join('/');
  const schedule=c.schedule;
  const dates=schedule.event_dates?schedule.event_dates.map(date).join(', '):schedule.data_inicio===schedule.data_fim?date(schedule.data_inicio):date(schedule.data_inicio)+' a '+date(schedule.data_fim);
  const lines=[`*ORÇAMENTO CORPORATIVO — ${p.service}*`,
    `📍 ${p.locality}`,`📅 ${dates}`,`${c.dias_evento} dia(s) · ${c.periodos_por_dia} período(s) de 4h por dia · ${c.horas_por_dia}h por dia`,'',
    `💳 Cartão: *${money(c.valor_parcelado)}*, em até 10x sem juros.`,
    `💰 À vista: *${money(c.valor_avista)}*.`,
    `50% de sinal: *${money(c.sinal_50)}*.`,`Saldo no evento: *${money(c.saldo_no_evento)}*.`,'','*Inclusos:*',
    ...p.includes.map(x=>'• '+x),'',`Confira nossas avaliações no Google: ${p.proof_social}`,''];
  if(p.availability.status==='fully_booked')lines.push('Uma ou mais datas desse período estão lotadas. Este orçamento não confirma disponibilidade. Nossa equipe pode verificar outras datas.');
  else if(p.availability.status==='preliminary_available')lines.push('A disponibilidade é preliminar para as datas consultadas.');
  else lines.push('A disponibilidade ainda precisa ser confirmada pela equipe.');
  lines.push(p.reservation_policy);
  if(p.availability.reservation_prompt_authorized)lines.push('','Gostaria de seguir com a tentativa de reserva para essa data?');
  const text=lines.join('\n');
  if(text.length>4096||text.includes('\\n'))return {status:'blocked',candidate_text:null,blockers:['MESSAGE_FORMAT_INVALID']};
  return {...input,status:'ready',candidate_text:text,claimed_prices:{pix:c.valor_avista,card:c.valor_parcelado},availability_claim:p.availability.status,blockers:[]};
}
