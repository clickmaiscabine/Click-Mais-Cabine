// GENERATED ADAPTER FOR n8n CODE NODE.
// Canonical source: src/functions/f2/state-guard.mjs#guardPaymentVerification

function deny(reasonCode, nextAction = null) {
  return { decision: "deny", allowed: false, reasonCode, nextAction };
}
function allow() {
  return { decision: "allow", allowed: true, reasonCode: null, nextAction: null };
}
function guardPaymentVerification({ actorType }) {
  if (["llm", "jev"].includes(actorType)) {
    return deny("PAYMENT_VERIFICATION_FORBIDDEN_ACTOR");
  }
  if (actorType !== "human") {
    return deny("PAYMENT_VERIFICATION_REQUIRES_HUMAN");
  }
  return allow();
}
return {json:guardPaymentVerification({
  actorType:$json.actor_type ?? $json.actorType ?? null
})};
