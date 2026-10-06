export function evaluateQuoteReadiness({
  facts = {},
  localityResult,
  services = [],
  ruleSetAvailable = true,
}) {
  const blockers = [];
  const requiredFacts = {
    service_interest: facts.service_interest,
    event_date: facts.event_date,
    locality: facts.locality,
    event_type: facts.event_type,
  };

  for (const [key, value] of Object.entries(requiredFacts)) {
    if (
      value === null ||
      value === undefined ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) blockers.push("FACT_MISSING:" + key);
  }

  if (!ruleSetAvailable) blockers.push("RULE_SET_UNAVAILABLE");

  if (!localityResult || localityResult.status === "missing") {
    if (!blockers.includes("FACT_MISSING:locality")) blockers.push("FACT_MISSING:locality");
  } else if (localityResult.status === "needs_region") {
    blockers.push("LOCALITY_NEEDS_REGION");
  } else if (localityResult.status === "human_required") {
    blockers.push(localityResult.reasonCode ?? "LOCALITY_HUMAN_REQUIRED");
  } else if (localityResult.status !== "resolved") {
    blockers.push("LOCALITY_NOT_RESOLVED");
  }

  for (const service of services) {
    if (service.quoteableAutomatically === false) {
      blockers.push("SERVICE_PRICE_REQUIRES_HUMAN:" + service.code);
    }
  }

  const humanRequired = blockers.some((code) =>
    code.startsWith("LOCALITY_") && !code.includes("NEEDS_REGION")
  ) || blockers.some((code) => code.startsWith("SERVICE_PRICE_REQUIRES_HUMAN"));

  return {
    ready: blockers.length === 0,
    status: blockers.length === 0 ? "ready" : humanRequired ? "human_required" : "blocked",
    humanRequired,
    blockers,
  };
}

export function evaluateModuleReadiness(moduleCode, context = {}) {
  switch (moduleCode) {
    case "quote":
      return context.quoteReady
        ? result("ready", true)
        : result("blocked", false, ["QUOTE_NOT_READY"]);
    case "contract":
      return context.contractStatus === "signed"
        ? result("completed", true)
        : result("in_progress", false, ["CONTRACT_NOT_SIGNED"]);
    case "payment":
      return context.paymentVerified === true &&
        ["signal", "full"].includes(context.paymentKind)
        ? result("completed", true)
        : result("in_progress", false, ["SIGNAL_OR_FULL_PAYMENT_NOT_VERIFIED"]);
    case "art":
      return context.artFinalApproved === true
        ? result("completed", true)
        : result("in_progress", false, ["ART_NOT_FINAL"]);
    case "logistics":
      return context.criticalChecklistReady === true && !(context.blockers?.length)
        ? result("ready", true)
        : result("blocked", false, context.blockers?.length ? context.blockers : ["LOGISTICS_NOT_READY"]);
    case "delivery":
      return context.linkSent === true && context.confirmationPolicySatisfied === true
        ? result("completed", true)
        : result("in_progress", false, ["DELIVERY_POLICY_INCOMPLETE"]);
    case "post_sale":
      return context.actionsCompletedOrSkipped === true
        ? result("completed", true)
        : result("in_progress", false, ["POST_SALE_INCOMPLETE"]);
    case "reservation":
      return context.reservationStatus === "confirmed"
        ? result("completed", true)
        : result("in_progress", false, ["RESERVATION_NOT_CONFIRMED"]);
    default:
      return result("blocked", false, ["UNKNOWN_MODULE_CODE:" + moduleCode]);
  }
}

function result(status, ready, blockers = []) {
  return { status, ready, blockers };
}
