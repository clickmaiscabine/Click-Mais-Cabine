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

const OPERATIONAL_NEXT = {
  NOT_STARTED: new Set(["PRE_EVENT"]),
  PRE_EVENT: new Set(["EVENT_READY", "SUSPENDED", "CANCELLED"]),
  EVENT_READY: new Set(["EVENT_DAY"]),
  EVENT_DAY: new Set(["POST_EVENT"]),
  POST_EVENT: new Set(["COMPLETED"]),
  COMPLETED: new Set(),
  SUSPENDED: new Set(),
  CANCELLED: new Set(),
};

export function guardCommercialTransition({
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

export function guardOperationalTransition({
  from,
  to,
  commercialStage,
  hasContract = false,
  humanAuthorized = false,
}) {
  if (!(from in OPERATIONAL_NEXT) || !(to in OPERATIONAL_NEXT)) {
    return deny("UNKNOWN_OPERATIONAL_STAGE");
  }

  if (!OPERATIONAL_NEXT[from].has(to)) {
    return deny("OPERATIONAL_TRANSITION_NOT_ALLOWED");
  }

  if (from === "NOT_STARTED" && to === "PRE_EVENT" && commercialStage !== "GANHO") {
    return deny("PRE_EVENT_REQUIRES_GANHO");
  }

  if (to === "CANCELLED" && hasContract && !humanAuthorized) {
    return deny("CONTRACTED_CANCEL_REQUIRES_HUMAN");
  }

  return allow();
}

export function guardPaymentVerification({ actorType }) {
  if (["llm", "jev"].includes(actorType)) {
    return deny("PAYMENT_VERIFICATION_FORBIDDEN_ACTOR");
  }
  if (actorType !== "human") {
    return deny("PAYMENT_VERIFICATION_REQUIRES_HUMAN");
  }
  return allow();
}

export function guardEventDateChange({ commercialStage, humanAuthorized = false }) {
  if (commercialStage === "GANHO" && !humanAuthorized) {
    return {
      decision: "human",
      allowed: false,
      reasonCode: "POST_WIN_DATE_CHANGE_REQUIRES_HUMAN_REVIEW",
      nextAction: "human_required",
    };
  }
  return allow();
}

function allow() {
  return { decision: "allow", allowed: true, reasonCode: null, nextAction: null };
}

function deny(reasonCode, nextAction = null) {
  return { decision: "deny", allowed: false, reasonCode, nextAction };
}
