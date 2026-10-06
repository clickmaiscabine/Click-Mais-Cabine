// GENERATED ADAPTER FOR n8n CODE NODE.
// Canonical source: src/functions/f2/state-guard.mjs
// Scope: commercial Trello human moves only.

const COMMERCIAL_NEXT = {
  PRE_QUOTE: new Set(["ORCAMENTO"]),
  ORCAMENTO: new Set(["RESPOSTA", "FAC_DUVIDAS", "NEGOCIACAO", "FECHAMENTO", "PERDIDO"]),
  RESPOSTA: new Set(["FAC_DUVIDAS", "NEGOCIACAO", "FECHAMENTO", "PERDIDO", "ORCAMENTO"]),
  FAC_DUVIDAS: new Set(["RESPOSTA", "NEGOCIACAO", "FECHAMENTO", "PERDIDO"]),
  NEGOCIACAO: new Set(["FECHAMENTO", "FAC_DUVIDAS", "PERDIDO"]),
  FECHAMENTO: new Set(["GANHO", "PERDIDO"]),
  GANHO: new Set(),
  PERDIDO: new Set(),
};

function allow() {
  return { decision: "allow", allowed: true, reasonCode: null, nextAction: null };
}

function deny(reasonCode, nextAction = null) {
  return { decision: "deny", allowed: false, reasonCode, nextAction };
}

function guardCommercialTransition({
  from,
  to,
  actorType = "system",
  expectedVersion = null,
  actualVersion = null,
  humanLock = false,
  quoteSent = false,
  contractStatus = null,
  paymentVerified = false,
  paymentKind = null,
  lossReasonType = null,
  source = "system",
  trelloProjectionValid = false,
}) {
  if (expectedVersion !== null && actualVersion !== null && expectedVersion !== actualVersion) {
    return deny("STATE_VERSION_CONFLICT", "reload_reevaluate");
  }
  if (!(from in COMMERCIAL_NEXT) || !(to in COMMERCIAL_NEXT)) {
    return deny("UNKNOWN_COMMERCIAL_STAGE");
  }
  if (humanLock && actorType !== "human") {
    return deny("HUMAN_LOCK_ACTIVE", "human_required");
  }
  if (source === "trello" && !(actorType === "human" && trelloProjectionValid)) {
    return deny("TRELLO_COMMAND_NOT_GUARDED");
  }
  if (!COMMERCIAL_NEXT[from].has(to)) {
    return deny("COMMERCIAL_TRANSITION_NOT_ALLOWED");
  }
  if (to === "ORCAMENTO" && !quoteSent) {
    return deny("ORCAMENTO_REQUIRES_QUOTE_SENT");
  }
  if (to === "PERDIDO" && !["explicit", "human"].includes(lossReasonType)) {
    return deny("LOSS_REQUIRES_EXPLICIT_OR_HUMAN_EVIDENCE");
  }
  if (to === "GANHO") {
    if (from !== "FECHAMENTO") return deny("GANHO_REQUIRES_FECHAMENTO");
    if (contractStatus !== "signed") return deny("GANHO_REQUIRES_SIGNED_CONTRACT");
    if (!(paymentVerified && ["signal", "full"].includes(paymentKind))) {
      return deny("GANHO_REQUIRES_VERIFIED_SIGNAL_OR_FULL_PAYMENT");
    }
  }
  return allow();
}

const LIST_TO_STAGE = {
  "ORÇAMENTO":"ORCAMENTO",
  "RESPOSTA":"RESPOSTA",
  "FAC / DÚVIDAS":"FAC_DUVIDAS",
  "NEGOCIAÇÃO — BOT / HUMANO":"NEGOCIACAO",
  "FECHAMENTO":"FECHAMENTO",
  "GANHO":"GANHO",
  "PERDIDO":"PERDIDO",
};

const input=$json;
const targetStage=LIST_TO_STAGE[input.target_list_name] ?? null;
const canonicalStage=String(input.commercial_stage ?? "");
const expectedVersion=input.projection_stage_version ?? null;
const actualVersion=input.stage_version ?? null;

if(input.actor_authorized !== true){
  return {json:{
    status:"denied",
    guard:{decision:"deny",allowed:false,reasonCode:"TRELLO_ACTOR_NOT_AUTHORIZED",nextAction:null},
    target_stage:targetStage,
    transition_request:null,
    reprojection_required:true,
    blockers:["TRELLO_ACTOR_NOT_AUTHORIZED"]
  }};
}

if(!input.customer_event_id || !input.card_event_id || input.customer_event_id !== input.card_event_id){
  return {json:{
    status:"denied",
    guard:{decision:"deny",allowed:false,reasonCode:"TRELLO_CARD_MAPPING_INVALID",nextAction:null},
    target_stage:targetStage,
    transition_request:null,
    reprojection_required:true,
    blockers:["TRELLO_CARD_MAPPING_INVALID"]
  }};
}

if(!targetStage){
  return {json:{
    status:"denied",
    guard:{decision:"deny",allowed:false,reasonCode:"TRELLO_TARGET_LIST_NOT_CANONICAL",nextAction:null},
    target_stage:null,
    transition_request:null,
    reprojection_required:true,
    blockers:["TRELLO_TARGET_LIST_NOT_CANONICAL"]
  }};
}

const guard=guardCommercialTransition({
  from:canonicalStage,
  to:targetStage,
  actorType:"human",
  expectedVersion,
  actualVersion,
  humanLock:Boolean(input.human_lock),
  quoteSent:Boolean(input.quote_sent),
  contractStatus:input.contract_status ?? null,
  paymentVerified:Boolean(input.payment_verified),
  paymentKind:input.payment_kind ?? null,
  lossReasonType:targetStage==="PERDIDO" ? "human" : null,
  source:"trello",
  trelloProjectionValid:true,
});

return {json:{
  status:guard.allowed ? "authorized" : "denied",
  guard,
  target_stage:targetStage,
  transition_request:guard.allowed ? {
    action:"TRANSITION_CUSTOMER_EVENT",
    customer_event_id:input.customer_event_id,
    from_stage:canonicalStage,
    to_stage:targetStage,
    expected_version:actualVersion,
    actor_type:"human",
    source:"trello",
    source_action_id:input.trello_action_id ?? null
  } : null,
  reprojection_required:!guard.allowed,
  blockers:guard.allowed ? [] : [guard.reasonCode]
}};
