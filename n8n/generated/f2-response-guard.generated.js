// GENERATED ADAPTER FOR n8n CODE NODE.
// Canonical source: src/functions/f2/response-guard.mjs
// LAB policy: sendEnabled is forced to false here.
// Do not hand-edit guard semantics without updating F2 and parity tests.

const INTERNAL_TIER_PATTERN = /\bT\d{3,5}\b/i;
const MONEY_PATTERN = /R\$\s*\d/i;

function pricesMatch(claimedPrices, customerVisible) {
  if (!claimedPrices || !customerVisible) return false;
  const normalize = (value) => Math.round(Number(value) * 100);
  if (!Number.isFinite(Number(claimedPrices.pix)) || !Number.isFinite(Number(claimedPrices.card))) {
    return false;
  }
  return (
    normalize(claimedPrices.pix) === normalize(customerVisible.pix) &&
    normalize(claimedPrices.card) === normalize(customerVisible.card)
  );
}

function extractLinks(text) {
  return String(text ?? "").match(/https?:\/\/[^\s<>()]+/g) ?? [];
}

function isAllowedLink(link, allowedLinks) {
  return allowedLinks.some((allowed) => {
    if (allowed.endsWith("*")) return link.startsWith(allowed.slice(0, -1));
    return link === allowed;
  });
}

function evaluateResponseGuard({
  humanLock = false,
  actionAuthorized = false,
  candidateText = "",
  claimedPrices = null,
  quoteResult = null,
  availabilityClaim = "none",
  reservationConfirmed = false,
  askedFactKeys = [],
  currentFacts = {},
  containsPii = false,
  containsSecret = false,
  allowedLinks = [],
  whatsappWindowOpen = false,
  isCampaign = false,
  campaignApproved = false,
  sendEnabled = false,
}) {
  const blockers = [];

  if (humanLock) blockers.push("HUMAN_LOCK_ACTIVE");
  if (!actionAuthorized) blockers.push("ACTION_NOT_AUTHORIZED");

  if (INTERNAL_TIER_PATTERN.test(candidateText)) blockers.push("INTERNAL_TIER_EXPOSED");

  if (quoteResult) {
    if (MONEY_PATTERN.test(candidateText) && !claimedPrices) {
      blockers.push("UNSTRUCTURED_PRICE_CLAIM");
    } else if (claimedPrices && !pricesMatch(claimedPrices, quoteResult.customerVisible ?? quoteResult.customer_visible)) {
      blockers.push("PRICE_MISMATCH");
    }
  }

  if (availabilityClaim === "definitive" && !reservationConfirmed) {
    blockers.push("DEFINITIVE_AVAILABILITY_NOT_ALLOWED");
  }

  for (const key of askedFactKeys) {
    const value = currentFacts?.[key];
    if (value !== null && value !== undefined && value !== "") {
      blockers.push("REPEATED_KNOWN_FACT:" + key);
    }
  }

  if (containsPii) blockers.push("PII_EXPOSURE");
  if (containsSecret) blockers.push("SECRET_EXPOSURE");

  for (const link of extractLinks(candidateText)) {
    if (!isAllowedLink(link, allowedLinks)) blockers.push("LINK_NOT_ALLOWED:" + link);
  }

  if (!whatsappWindowOpen) blockers.push("WHATSAPP_WINDOW_CLOSED");
  if (isCampaign && !campaignApproved) blockers.push("CAMPAIGN_NOT_APPROVED");

  if (blockers.length > 0) {
    return {
      decision: blockers.includes("HUMAN_LOCK_ACTIVE") ? "human" : "deny",
      dispatchAllowed: false,
      blockers,
      shadow: !sendEnabled,
    };
  }

  if (!sendEnabled) {
    return {
      decision: "shadow",
      dispatchAllowed: false,
      blockers: ["SEND_DISABLED"],
      shadow: true,
      eventType: "shadow_candidate_generated",
    };
  }

  return {
    decision: "allow",
    dispatchAllowed: true,
    blockers: [],
    shadow: false,
  };
}

return {
  json: evaluateResponseGuard({
    humanLock: Boolean($json.humanLock ?? $json.human_lock),
    actionAuthorized: Boolean($json.actionAuthorized ?? $json.action_authorized),
    candidateText: $json.candidateText ?? $json.candidate_text ?? "",
    claimedPrices: $json.claimedPrices ?? $json.claimed_prices ?? null,
    quoteResult: $json.quoteResult ?? $json.quote_result ?? null,
    availabilityClaim: $json.availabilityClaim ?? $json.availability_claim ?? "none",
    reservationConfirmed: Boolean($json.reservationConfirmed ?? $json.reservation_confirmed),
    askedFactKeys: $json.askedFactKeys ?? $json.asked_fact_keys ?? [],
    currentFacts: $json.currentFacts ?? $json.current_facts ?? {},
    containsPii: Boolean($json.containsPii ?? $json.contains_pii),
    containsSecret: Boolean($json.containsSecret ?? $json.contains_secret),
    allowedLinks: $json.allowedLinks ?? $json.allowed_links ?? [],
    whatsappWindowOpen: Boolean($json.whatsappWindowOpen ?? $json.whatsapp_window_open),
    isCampaign: Boolean($json.isCampaign ?? $json.is_campaign),
    campaignApproved: Boolean($json.campaignApproved ?? $json.campaign_approved),
    sendEnabled: false,
  })
};
