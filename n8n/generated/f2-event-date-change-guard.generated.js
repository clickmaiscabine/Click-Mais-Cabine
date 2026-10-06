// GENERATED ADAPTER FOR n8n CODE NODE.
// Canonical source: src/functions/f2/state-guard.mjs#guardEventDateChange
function allow() {
  return { decision: "allow", allowed: true, reasonCode: null, nextAction: null };
}
function guardEventDateChange({ commercialStage, humanAuthorized = false }) {
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
return {json:guardEventDateChange({
  commercialStage:$json.commercial_stage ?? $json.commercialStage ?? null,
  humanAuthorized:Boolean($json.human_authorized ?? $json.humanAuthorized)
})};
