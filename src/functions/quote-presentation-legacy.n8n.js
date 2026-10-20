
const input = $json;
const quote = input.quote_result ?? input.quoteResult ?? null;
const datePolicy = input.date_policy ?? input.datePolicy ?? null;
const humanLock = Boolean(input.human_lock ?? input.humanLock);

if (humanLock) {
  return { json:{
    contract_version:'1.0.0',
    status:'human_required',
    customer_event_id:input.customer_event_id ?? null,
    presentation:null,
    action_request:{action:'CREATE_HUMAN_TASK',reason_code:'HUMAN_LOCK_ACTIVE'},
    blockers:['HUMAN_LOCK_ACTIVE']
  }};
}

if (!quote || quote.status !== 'ready' || !quote.customerVisible) {
  return { json:{
    contract_version:'1.0.0',
    status:'blocked',
    customer_event_id:input.customer_event_id ?? null,
    presentation:null,
    action_request:null,
    blockers:['QUOTE_RESULT_NOT_READY']
  }};
}

const services = Array.isArray(quote.items)
  ? [...new Set(quote.items.filter((item) => item.lineType === 'main' || item.lineType === 'addon').map((item) => item.serviceCode).filter(Boolean))]
  : [];

const presentation = {
  customer_visible_prices:{
    pix:Number(quote.customerVisible.pix),
    card:Number(quote.customerVisible.card)
  },
  payment_terms:{
    pix:'pagamento integral ou 50% de sinal + 50% no evento',
    card:'até 10x sem juros'
  },
  availability_claim:'preliminary',
  reservation_policy:'data garantida somente após contrato e pagamento do sinal',
  services,
  combo_applied:Boolean(quote.comboApplied),
  promotion_applied:Boolean(quote.promotionApplied),
  promotion_window:datePolicy?.window ?? null,
  gift:datePolicy?.gift?.eligible === true ? {
    eligible:true,
    service_code:datePolicy.gift.serviceCode,
    commercial_value:datePolicy.gift.commercialValue
  } : {eligible:false}
};

return { json:{
  contract_version:'1.0.0',
  status:'ready',
  customer_event_id:input.customer_event_id ?? null,
  presentation,
  action_request:{
    action:'COMPOSE_QUOTE_PRESENTATION',
    requires_guard:true,
    apply_state_transition_on:'dispatch_success',
    proposed_transition:{
      from:input.commercial_stage ?? 'PRE_QUOTE',
      to:'ORCAMENTO'
    },
    success_event_type:'quote_sent',
    payload:presentation
  },
  blockers:[]
}};

