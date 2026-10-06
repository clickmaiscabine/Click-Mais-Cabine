// GENERATED ADAPTER FOR n8n CODE NODE.
// Canonical source: src/functions/f2/date-promotion.mjs#evaluateFollowupPolicy

function evaluateFollowupPolicy({
  automaticSentCount = 0,
  customerResponded = false,
  humanLock = false,
  commercialStage = null,
  quoteChanged = false,
  delayHours = 23,
}) {
  if (customerResponded) return { action: "cancel", reasonCode: "CUSTOMER_RESPONDED", discountAllowed: false };
  if (humanLock) return { action: "skip", reasonCode: "HUMAN_LOCK_ACTIVE", discountAllowed: false };
  if (["GANHO", "PERDIDO"].includes(commercialStage)) {
    return { action: "cancel", reasonCode: "TERMINAL_COMMERCIAL_STAGE", discountAllowed: false };
  }
  if (quoteChanged) return { action: "cancel", reasonCode: "QUOTE_CHANGED", discountAllowed: false };
  if (automaticSentCount >= 1) {
    return { action: "none", reasonCode: "AUTO_FOLLOWUP_LIMIT_REACHED", discountAllowed: false };
  }
  return {
    action: "schedule",
    reasonCode: "FIRST_AUTOMATIC_FOLLOWUP",
    delayHours,
    discountAllowed: false,
  };
}

return {json:evaluateFollowupPolicy({
  automaticSentCount:Number($json.automatic_sent_count ?? $json.automaticSentCount ?? 0),
  customerResponded:Boolean($json.customer_responded ?? $json.customerResponded),
  humanLock:Boolean($json.human_lock ?? $json.humanLock),
  commercialStage:$json.commercial_stage ?? $json.commercialStage ?? null,
  quoteChanged:Boolean($json.quote_changed ?? $json.quoteChanged),
  delayHours:Number($json.delay_hours ?? $json.delayHours ?? 23),
})};
