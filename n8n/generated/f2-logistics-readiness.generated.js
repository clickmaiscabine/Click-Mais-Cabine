// GENERATED ADAPTER FOR n8n CODE NODE.
// Canonical source: src/functions/f2/readiness.mjs#evaluateModuleReadiness

function result(status, ready, blockers = []) {
  return { status, ready, blockers };
}
function evaluateModuleReadiness(moduleCode, context = {}) {
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
return {json:evaluateModuleReadiness("logistics",{
  criticalChecklistReady:Boolean($json.critical_checklist_ready ?? $json.criticalChecklistReady),
  blockers:$json.blockers ?? []
})};
