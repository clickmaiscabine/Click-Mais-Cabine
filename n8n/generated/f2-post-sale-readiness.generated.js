// GENERATED ADAPTER FOR n8n CODE NODE.
// Canonical source: src/functions/f2/readiness.mjs#evaluateModuleReadiness
function result(status, ready, blockers = []) { return { status, ready, blockers }; }
function evaluateModuleReadiness(moduleCode, context = {}) {
  switch (moduleCode) {
    case "delivery":
      return context.linkSent === true && context.confirmationPolicySatisfied === true
        ? result("completed", true)
        : result("in_progress", false, ["DELIVERY_POLICY_INCOMPLETE"]);
    case "post_sale":
      return context.actionsCompletedOrSkipped === true
        ? result("completed", true)
        : result("in_progress", false, ["POST_SALE_INCOMPLETE"]);
    default:
      return result("blocked", false, ["UNKNOWN_MODULE_CODE:" + moduleCode]);
  }
}
return {json:evaluateModuleReadiness("post_sale",{
  actionsCompletedOrSkipped:Boolean($json.actions_completed_or_skipped ?? $json.actionsCompletedOrSkipped)
})};
