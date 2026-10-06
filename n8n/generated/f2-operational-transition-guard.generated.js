// GENERATED ADAPTER FOR n8n CODE NODE.
// Canonical source: src/functions/f2/state-guard.mjs#guardOperationalTransition

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

function allow() {
  return { decision: "allow", allowed: true, reasonCode: null, nextAction: null };
}
function deny(reasonCode, nextAction = null) {
  return { decision: "deny", allowed: false, reasonCode, nextAction };
}
function guardOperationalTransition({
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
return {json:guardOperationalTransition({
  from:$json.from_stage ?? $json.from ?? null,
  to:$json.to_stage ?? $json.to ?? null,
  commercialStage:$json.commercial_stage ?? $json.commercialStage ?? null,
  hasContract:Boolean($json.has_contract ?? $json.hasContract),
  humanAuthorized:Boolean($json.human_authorized ?? $json.humanAuthorized)
})};
