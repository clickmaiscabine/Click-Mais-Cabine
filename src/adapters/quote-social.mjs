import { resolveLocality, evaluateQuoteReadiness, evaluateDatePolicy, calculateQuote } from "../functions/f2/index.mjs";

export function runF2QuoteAdapter(input) {
  const facts = input.facts ?? {};
  const localities = input.localities ?? [];
  const aliases = input.locality_aliases ?? input.aliases ?? [];
  const services = input.services ?? [];
  const ruleSet = input.rule_set ?? input.ruleSet ?? null;
  const pricingTiers = input.pricing_tiers ?? [];
  const explicitTier = input.pricing_tier ?? input.tier ?? null;
  const referenceDate = input.reference_date ?? input.referenceDate ?? null;

  const localityResult = resolveLocality({
    input: facts.locality,
    localities,
    aliases,
  });

  const readiness = evaluateQuoteReadiness({
    facts,
    localityResult,
    services,
    ruleSetAvailable: Boolean(ruleSet),
  });

  if (!readiness.ready) {
    return {
      contract_version: "1.0.0",
      source_component: "F2",
      source_commit: "4d4673c94ef9d382f7a01cdc87f36266d572cd29",
      status: readiness.status,
      locality_result: localityResult,
      readiness,
      date_policy: null,
      quote_result: null,
      requested_actions: readiness.humanRequired
        ? [{ action: "CREATE_HUMAN_TASK", reason_codes: readiness.blockers }]
        : [],
      blockers: readiness.blockers,
    };
  }

  const datePolicy = evaluateDatePolicy({
    eventDate: facts.event_date,
    referenceDate,
    eventType: facts.event_type,
  });

  if (datePolicy.status !== "ok") {
    return {
      contract_version: "1.0.0",
      source_component: "F2",
      source_commit: "4d4673c94ef9d382f7a01cdc87f36266d572cd29",
      status: "blocked",
      locality_result: localityResult,
      readiness,
      date_policy: datePolicy,
      quote_result: null,
      requested_actions: [],
      blockers: datePolicy.blockers ?? ["DATE_POLICY_BLOCKED"],
    };
  }

  const tierId = localityResult.locality?.pricingTierId ?? null;
  const tier = explicitTier ?? pricingTiers.find((item) =>
    String(item.id ?? item.code ?? item.pricing_tier_id ?? "") === String(tierId)
  ) ?? null;

  const quoteResult = calculateQuote({
    tier,
    services,
    ruleSet,
    datePolicy,
    sameEventDateTime: input.same_event_date_time ?? input.sameEventDateTime ?? true,
  });

  const status = quoteResult.status;
  const blockers = quoteResult.blockers ?? [];

  return {
    contract_version: "1.0.0",
    source_component: "F2",
    source_commit: "4d4673c94ef9d382f7a01cdc87f36266d572cd29",
    status,
    locality_result: localityResult,
    readiness,
    date_policy: datePolicy,
    quote_result: quoteResult,
    requested_actions: status === "ready"
      ? [
          { action: "RECORD_QUOTE" },
          { action: "EMIT_EVENT", event_type: "quote_generated" },
        ]
      : quoteResult.humanRequired
        ? [{ action: "CREATE_HUMAN_TASK", reason_codes: blockers }]
        : [],
    blockers,
  };
}
