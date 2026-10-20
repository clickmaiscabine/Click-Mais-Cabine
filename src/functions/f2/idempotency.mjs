import { sha256, stableStringify } from "./utils.mjs";

export function buildMetaIdempotencyKey({ phoneNumberId, wamid }) {
  if (!phoneNumberId || !wamid) throw new Error("meta_idempotency_fields_required");
  return `meta:${phoneNumberId}:${wamid}`;
}

export function buildQuoteFingerprint({
  customerEventId,
  relevantFacts,
  ruleSetVersion,
}) {
  if (!customerEventId || !ruleSetVersion) throw new Error("quote_fingerprint_fields_required");
  const canonical = stableStringify({
    customerEventId,
    relevantFacts: relevantFacts ?? {},
    ruleSetVersion,
  });
  return sha256(canonical);
}

export function buildActionId({
  customerEventId,
  actionType,
  stateVersion,
  sourceEventId = null,
}) {
  if (!customerEventId || !actionType || stateVersion === null || stateVersion === undefined) {
    throw new Error("action_id_fields_required");
  }
  return sha256(stableStringify({
    customerEventId,
    actionType,
    stateVersion,
    sourceEventId,
  }));
}

export function isIdempotentReplay(previousKey, candidateKey) {
  return Boolean(previousKey) && previousKey === candidateKey;
}
