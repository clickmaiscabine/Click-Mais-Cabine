// Existing F6 planner, recovered from LAB qr2WiKWr00oZMKbh / ffcdc7d9.
// Business policy retained; monetary display now preserves cents.
export function planTrelloProjection(input) {

const STAGE_TO_LIST={
  ORCAMENTO:'ORÇAMENTO',
  RESPOSTA:'RESPOSTA',
  FAC_DUVIDAS:'FAC / DÚVIDAS',
  NEGOCIACAO:'NEGOCIAÇÃO — BOT / HUMANO',
  FECHAMENTO:'FECHAMENTO',
  GANHO:'GANHO',
  PERDIDO:'PERDIDO'
};

function fmtDate(value){
  if(!value) return 'SEM-DATA';
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
  return m ? m[3]+'/'+m[2]+'/'+m[1] : 'SEM-DATA';
}
function money(value){
  return Number.isFinite(Number(value))
    ? new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(value))
    : '—';
}
function clean(value){
  return value===null || value===undefined || value==='' ? '—' : String(value);
}
function fingerprint(text){
  let hash=2166136261;
  for(let i=0;i<text.length;i++){
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash,16777619);
  }
  return 'fnv1a32:'+((hash>>>0).toString(16).padStart(8,'0'));
}

const targetListName=STAGE_TO_LIST[input.commercial_stage] ?? null;
if(!targetListName){
  return {json:{
    status:'blocked',operations:[],projection:null,
    blockers:['COMMERCIAL_STAGE_NOT_PROJECTABLE']
  }};
}

const listDirectory=Array.isArray(input.list_directory)?input.list_directory:[];
const targetList=listDirectory.find((list)=>list.name===targetListName) ?? null;
if(!targetList){
  return {json:{
    status:'migration_required',
    operations:[],
    projection:null,
    missing_list:targetListName,
    blockers:['TRELLO_CANONICAL_LIST_MISSING:'+targetListName]
  }};
}

const quote=input.quote ?? {};
const canCreate =
  input.source_event_type==='quote_sent' &&
  quote.status==='presented' &&
  Boolean(input.qualified_at);

const existing=input.existing_projection ?? null;
if(!existing && !canCreate){
  return {json:{
    status:'no_projection',
    operations:[],
    projection:null,
    blockers:['CARD_CREATION_REQUIRES_QUOTE_SENT_PRESENTED_QUALIFIED']
  }};
}

const services=Array.isArray(input.services)?input.services.filter(Boolean):[];
const mainService=services[0] ?? 'Serviço';
const title=fmtDate(input.event_date)+' | '+clean(input.customer_name)+' | '+clean(input.city)+' | '+clean(mainService);
const projectionVersion=String(input.stage_version ?? 0)+':'+String(quote.version ?? 0);

const lines=[
  'CLICK MAIS OS — PROJEÇÃO COMERCIAL',
  'EVENT_ID='+clean(input.customer_event_id),
  'PROJECTION_VERSION='+projectionVersion,
  'QUOTE_VERSION='+clean(quote.version),
  '',
  'Nome: '+clean(input.customer_name),
  'Data: '+clean(input.event_date),
  ...(quote.corporate ? [
    'Datas: '+(quote.corporate.schedule?.event_dates??[]).join(', '),
    'Dias: '+quote.corporate.dias_evento+'; períodos/dia: '+quote.corporate.periodos_por_dia+'; horas/dia: '+quote.corporate.horas_por_dia,
    'Sinal: '+money(quote.corporate.sinal_50)+'; saldo: '+money(quote.corporate.saldo_no_evento)
  ] : []),
  'Cidade: '+clean(input.city),
  'Tipo de evento: '+clean(input.event_type),
  'Serviços: '+(services.length?services.join(', '):'—'),
  'PIX atual: '+money(quote.pix),
  'Cartão atual: '+money(quote.card),
  'Stage: '+clean(input.commercial_stage),
  'Origem: '+clean(input.origin_summary),
  'Última interação: '+clean(input.last_interaction_at),
  'Próxima ação: '+clean(input.next_action??input.next_action_at),
  'HUMAN_LOCK: '+(input.human_lock?'SIM':'NÃO')
];
const description=lines.join(String.fromCharCode(10));
const projectionHash=fingerprint(JSON.stringify({
  title,
  description,
  targetListName,
  projectionVersion
}));

const projection={
  board_role:'commercial',
  customer_event_id:input.customer_event_id,
  target_list_name:targetListName,
  target_list_id:targetList.id,
  title,
  description,
  projection_version:projectionVersion,
  projection_hash:projectionHash,
  quote_version:quote.version ?? null,
  stage_version:input.stage_version ?? null
};

const operations=[];
if(!existing){
  operations.push({
    action:'CREATE_CARD',
    idempotency_key:'trello:commercial:create:'+input.customer_event_id,
    list_id:targetList.id,
    name:title,
    desc:description
  });
}else{
  if(existing.list_name!==targetListName || existing.list_id!==targetList.id){
    operations.push({
      action:'MOVE_CARD',
      card_id:existing.card_id,
      list_id:targetList.id,
      reason_code:'CANONICAL_STAGE_PROJECTION'
    });
  }
  if(
    existing.projection_hash!==projectionHash ||
    String(existing.projection_version ?? '')!==projectionVersion
  ){
    operations.push({
      action:'UPDATE_CARD',
      card_id:existing.card_id,
      name:title,
      desc:description,
      reason_code:'PROJECTION_CONTENT_CHANGED'
    });
  }
}

if(operations.length>0){
  operations.push({
    action:'RECORD_PROJECTION_AFTER_TRELLO_SUCCESS',
    customer_event_id:input.customer_event_id,
    projection_version:projectionVersion,
    projection_hash:projectionHash,
    target_list_name:targetListName
  });
}

return {json:{
  status:operations.length>0 ? 'planned' : 'in_sync',
  projection,
  operations,
  blockers:[]
}};

}
