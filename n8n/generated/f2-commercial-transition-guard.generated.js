// GENERATED ADAPTER FOR n8n CODE NODE.
// Canonical source: src/functions/f2/state-guard.mjs#guardCommercialTransition

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

return {json:guardCommercialTransition({
  from:$json.from_stage ?? $json.from ?? null,
  to:$json.to_stage ?? $json.to ?? null,
  actorType:$json.actor_type ?? $json.actorType ?? "system",
  expectedVersion:$json.expected_version ?? $json.expectedVersion ?? null,
  actualVersion:$json.actual_version ?? $json.actualVersion ?? null,
  humanLock:Boolean($json.human_lock ?? $json.humanLock),
  quoteSent:Boolean($json.quote_sent ?? $json.quoteSent),
  contractStatus:$json.contract_status ?? $json.contractStatus ?? null,
  paymentVerified:Boolean($json.payment_verified ?? $json.paymentVerified),
  paymentKind:$json.payment_kind ?? $json.paymentKind ?? null,
  lossReasonType:$json.loss_reason_type ?? $json.lossReasonType ?? null,
  source:$json.source ?? "system",
  trelloProjectionValid:Boolean($json.trello_projection_valid ?? $json.trelloProjectionValid),
})};
