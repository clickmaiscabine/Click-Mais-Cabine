
const input=$json;
if(input.action_authorized !== true){
  return {json:{
    contract_version:'1.0.0',status:'blocked',candidate_text:null,
    claimed_prices:null,availability_claim:'none',asked_fact_keys:[],
    blockers:['ACTION_NOT_AUTHORIZED']
  }};
}

const action=String(input.action ?? '').toUpperCase();
const facts=input.facts ?? {};
const presentation=input.presentation ?? {};
const nl=String.fromCharCode(10);
const money=(value)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:0,maximumFractionDigits:0}).format(Number(value));

if(action==='RESPONDER_AGUARDAR_DECISAO'){
  return {json:{
    contract_version:'1.0.0',status:'ready',
    candidate_text:'Claro, sem problema 😊 Se quiser, posso te ajudar a comparar os serviços ou esclarecer qualquer item do orçamento. A reserva da data acontece somente após contrato e sinal.',
    claimed_prices:null,availability_claim:'none',asked_fact_keys:[],blockers:[]
  }};
}

if(action==='COMPOSE_HANDOFF_ACK'){
  return {json:{
    contract_version:'1.0.0',status:'ready',
    candidate_text:'Essa situação precisa de uma confirmação da nossa equipe para eu não te passar uma informação incorreta. Já vou encaminhar para o responsável 😊',
    claimed_prices:null,availability_claim:'none',asked_fact_keys:[],blockers:[]
  }};
}

if(action==='REQUEST_CLOSING'){
  return {json:{
    contract_version:'1.0.0',status:'ready',
    candidate_text:'Que ótimo! 😊 Para iniciarmos o fechamento, preencha este formulário: https://clickmais-microsite.lia-regis.chatgpt.site'+nl+nl+'Depois nossa equipe confirma o contrato e o pagamento do sinal.',
    claimed_prices:null,availability_claim:'none',asked_fact_keys:[],blockers:[]
  }};
}

if(action==='COMPOSE_QUOTE_PRESENTATION'){
  const prices=presentation.customer_visible_prices ?? {};
  if(!Number.isFinite(Number(prices.pix)) || !Number.isFinite(Number(prices.card))){
    return {json:{contract_version:'1.0.0',status:'blocked',candidate_text:null,claimed_prices:null,availability_claim:'none',asked_fact_keys:[],blockers:['PRESENTATION_PRICE_MISSING']}};
  }
  const intro=presentation.promotion_applied
    ? 'Conseguimos uma condição especial para sua data 🔥'
    : 'Segue seu orçamento 😊';
  const text=intro+nl+nl+'✅ PIX: '+money(prices.pix)+nl+'✅ CARTÃO: '+money(prices.card)+' em até 10x sem juros.'+nl+nl+'A disponibilidade é preliminar. A data fica garantida somente após contrato e pagamento do sinal.';
  return {json:{
    contract_version:'1.0.0',status:'ready',candidate_text:text,
    claimed_prices:{pix:Number(prices.pix),card:Number(prices.card)},
    availability_claim:'preliminary',asked_fact_keys:[],blockers:[]
  }};
}

if(action==='ASK_ONE_CLARIFYING_QUESTION'){
  const missing=String(input.missing_fact_key ?? '');
  const questions={
    'service_interest':'Qual serviço você deseja para o evento?',
    'event_date':'Qual é a data do evento?',
    'locality':'Em qual cidade ou região será o evento?',
    'event_type':'Qual é o tipo de evento?'
  };
  const question=questions[missing] ?? null;
  if(!question){
    return {json:{contract_version:'1.0.0',status:'model_required',candidate_text:null,model_input:{action,facts},claimed_prices:null,availability_claim:'none',asked_fact_keys:[],blockers:['NO_FIXED_TEMPLATE']}};
  }
  return {json:{
    contract_version:'1.0.0',status:'ready',candidate_text:question,
    claimed_prices:null,availability_claim:'none',asked_fact_keys:[missing],blockers:[]
  }};
}

return {json:{
  contract_version:'1.0.0',status:'model_required',candidate_text:null,
  model_input:{
    action,
    facts,
    constraints:{
      tone:'simpática, objetiva, comercial, acolhedora e segura',
      one_question_at_a_time:true,
      do_not_repeat_known_facts:true,
      do_not_invent_price_availability_service:true
    }
  },
  claimed_prices:null,availability_claim:'none',asked_fact_keys:[],
  blockers:['LLM_CREDENTIAL_NOT_CONNECTED']
}};

