// GENERATED ADAPTER FOR n8n CODE NODE.
// Canonical source: src/functions/f2/*
// F2 source branch head at generation: 4d4673c94ef9d382f7a01cdc87f36266d572cd29
// Do not hand-edit business rules here. CI parity tests compare this adapter with F2.

function normalizeText(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function ceilToMultiple(value, multiple) {
  if (!(multiple > 0)) throw new Error("round_up_multiple_must_be_positive");
  return roundMoney(Math.ceil((Number(value) - 1e-9) / multiple) * multiple);
}

function parseDateOnly(value) {
  const text = String(value ?? "");
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) throw new Error("invalid_date_only");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) throw new Error("invalid_date_only");
  return date;
}

function formatDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function daysBetweenDateOnly(from, to) {
  const a = parseDateOnly(from);
  const b = parseDateOnly(to);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function addCalendarMonths(dateOnly, months) {
  const source = parseDateOnly(dateOnly);
  const year = source.getUTCFullYear();
  const month = source.getUTCMonth();
  const day = source.getUTCDate();
  const target = new Date(Date.UTC(year, month + months, 1));
  const lastDay = new Date(Date.UTC(
    target.getUTCFullYear(),
    target.getUTCMonth() + 1,
    0
  )).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return formatDateOnly(target);
}

function containsWholePhrase(normalizedText, normalizedPhrase) {
  if (!normalizedText || !normalizedPhrase) return false;
  return (" " + normalizedText + " ").includes(" " + normalizedPhrase + " ");
}

const GENERIC_SAO_PAULO = new Set(["sao paulo", "sp", "capital"]);

function localityView(locality) {
  return {
    localityId: locality.id ?? null,
    canonicalName: locality.canonical_name ?? locality.canonicalName ?? null,
    normalizedName: locality.normalized_name ?? normalizeText(locality.canonical_name ?? locality.canonicalName),
    pricingTierId: locality.pricing_tier_id ?? locality.pricingTierId ?? null,
    status: locality.status ?? "active",
  };
}

function resolveLocality({ input, localities = [], aliases = [] }) {
  const normalizedInput = normalizeText(input);

  if (!normalizedInput) {
    return {
      status: "missing",
      humanLock: false,
      reasonCode: "LOCALITY_MISSING",
      normalizedInput,
      locality: null,
    };
  }

  if (GENERIC_SAO_PAULO.has(normalizedInput)) {
    return {
      status: "needs_region",
      humanLock: false,
      reasonCode: "SAO_PAULO_GENERIC",
      normalizedInput,
      locality: null,
    };
  }

  const normalizedLocalities = localities.map((raw) => ({ raw, view: localityView(raw) }));
  const byId = new Map(normalizedLocalities.map((entry) => [String(entry.view.localityId), entry]));
  const exact = normalizedLocalities.filter((entry) => entry.view.normalizedName === normalizedInput);

  if (exact.length === 1) return finalize(exact[0].view, normalizedInput, "canonical");
  if (exact.length > 1) return ambiguous(normalizedInput, exact.map((entry) => entry.view));

  const exactAliases = aliases.filter(
    (alias) => (alias.normalized_alias ?? normalizeText(alias.alias)) === normalizedInput
  );
  const exactAliasTargets = uniqueTargets(exactAliases, byId);
  if (exactAliasTargets.length === 1) return finalize(exactAliasTargets[0], normalizedInput, "alias");
  if (exactAliasTargets.length > 1) return ambiguous(normalizedInput, exactAliasTargets);

  const candidateMap = new Map();
  for (const entry of normalizedLocalities) {
    if (containsWholePhrase(normalizedInput, entry.view.normalizedName)) {
      candidateMap.set(String(entry.view.localityId ?? entry.view.normalizedName), entry.view);
    }
  }

  for (const alias of aliases) {
    const phrase = alias.normalized_alias ?? normalizeText(alias.alias);
    if (!containsWholePhrase(normalizedInput, phrase)) continue;
    const entry = byId.get(String(alias.locality_id ?? alias.localityId));
    if (entry) candidateMap.set(String(entry.view.localityId ?? entry.view.normalizedName), entry.view);
  }

  const candidates = [...candidateMap.values()];
  if (candidates.length === 1) return finalize(candidates[0], normalizedInput, "phrase");
  if (candidates.length > 1) return ambiguous(normalizedInput, candidates);

  return {
    status: "human_required",
    humanLock: true,
    reasonCode: "LOCALITY_UNKNOWN",
    normalizedInput,
    locality: null,
  };
}

function uniqueTargets(aliasRows, byId) {
  const result = new Map();
  for (const alias of aliasRows) {
    const entry = byId.get(String(alias.locality_id ?? alias.localityId));
    if (entry) result.set(String(entry.view.localityId ?? entry.view.normalizedName), entry.view);
  }
  return [...result.values()];
}

function ambiguous(normalizedInput, candidates) {
  return {
    status: "human_required",
    humanLock: true,
    reasonCode: "LOCALITY_AMBIGUOUS",
    normalizedInput,
    locality: null,
    candidates: candidates.map((item) => item.canonicalName),
  };
}

function finalize(locality, normalizedInput, matchType) {
  if (locality.status === "human_required" || locality.status === "disabled") {
    return {
      status: "human_required",
      humanLock: true,
      reasonCode: locality.status === "disabled" ? "LOCALITY_DISABLED" : "LOCALITY_POLICY_HUMAN",
      normalizedInput,
      matchType,
      locality,
    };
  }

  if (!locality.pricingTierId) {
    return {
      status: "human_required",
      humanLock: true,
      reasonCode: "LOCALITY_WITHOUT_PRICING_TIER",
      normalizedInput,
      matchType,
      locality,
    };
  }

  return {
    status: "resolved",
    humanLock: false,
    reasonCode: null,
    normalizedInput,
    matchType,
    locality,
  };
}

const GIFT_EVENT_TYPES = new Set(["casamento", "debutante", "aniversario"]);

function evaluateDatePolicy({
  eventDate,
  referenceDate,
  eventType = null,
  shortTermDiscountPix = 190,
  followupDelayHours = 23,
  giftCommercialValue = 300,
}) {
  if (!eventDate || !referenceDate) {
    return {
      status: "missing",
      blockers: ["EVENT_DATE_OR_REFERENCE_DATE_MISSING"],
      daysUntilEvent: null,
      automaticPixDiscountPerMain: 0,
      followupDelayHours: null,
      gift: { eligible: false, serviceCode: null, commercialValue: null },
    };
  }

  parseDateOnly(eventDate);
  parseDateOnly(referenceDate);
  const daysUntilEvent = daysBetweenDateOnly(referenceDate, eventDate);

  if (daysUntilEvent < 0) {
    return {
      status: "invalid",
      blockers: ["EVENT_DATE_IN_PAST"],
      daysUntilEvent,
      automaticPixDiscountPerMain: 0,
      followupDelayHours: null,
      gift: { eligible: false, serviceCode: null, commercialValue: null },
    };
  }

  let window = "NORMAL";
  let automaticPixDiscountPerMain = 0;
  let automaticFollowupDelayHours = null;

  if (daysUntilEvent <= 30) {
    window = "SHORT_TERM_PROMO";
    automaticPixDiscountPerMain = shortTermDiscountPix;
  } else if (daysUntilEvent <= 60) {
    window = "D31_60";
    automaticFollowupDelayHours = followupDelayHours;
  }

  const threshold = addCalendarMonths(referenceDate, 4);
  const normalizedEventType = normalizeText(eventType);
  const giftEligible =
    GIFT_EVENT_TYPES.has(normalizedEventType) &&
    daysBetweenDateOnly(threshold, eventDate) > 0;

  return {
    status: "ok",
    blockers: [],
    window,
    daysUntilEvent,
    automaticPixDiscountPerMain,
    followupDelayHours: automaticFollowupDelayHours,
    gift: giftEligible
      ? {
          eligible: true,
          serviceCode: "album_assinaturas",
          commercialValue: giftCommercialValue,
          reasonCode: "EVENT_GT_4_MONTHS_ELIGIBLE_TYPE",
        }
      : {
          eligible: false,
          serviceCode: null,
          commercialValue: null,
          reasonCode: "GIFT_CRITERIA_NOT_MET",
        },
  };
}

function evaluateQuoteReadiness({
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

function calculateQuote({
  tier,
  services,
  ruleSet,
  datePolicy = null,
  sameEventDateTime = true,
}) {
  const validation = validateInputs({ tier, services, ruleSet });
  if (!validation.ok) {
    return {
      status: "blocked",
      humanRequired: validation.humanRequired,
      blockers: validation.blockers,
      items: [],
      totals: null,
    };
  }

  const expanded = expandServices(services);
  const mainUnits = expanded.filter((item) => item.category === "main");

  if (mainUnits.length > 2) {
    return {
      status: "human_required",
      humanRequired: true,
      blockers: ["MAIN_SERVICE_COMBINATION_OVER_TWO_UNDEFINED"],
      items: [],
      totals: null,
    };
  }

  const promotionDiscount = datePolicy?.automaticPixDiscountPerMain ?? 0;
  const comboApplies = sameEventDateTime && mainUnits.length === 2;
  let mainSeen = 0;
  const items = [];

  for (const service of expanded) {
    if (service.category === "main") {
      mainSeen += 1;
      const basePix = Number(tier.pix_base ?? tier.pixBase);
      const promoDiscount = Math.min(basePix, Number(promotionDiscount || 0));
      const afterPromotion = roundMoney(basePix - promoDiscount);
      const comboDiscount =
        comboApplies && mainSeen === 2
          ? roundMoney(afterPromotion * Number(ruleSet.comboSecondMainDiscountRate))
          : 0;
      const finalPix = roundMoney(afterPromotion - comboDiscount);
      items.push({
        lineType: "main",
        serviceCode: service.code,
        basePix,
        promotionDiscount: promoDiscount,
        comboDiscount,
        finalPix,
        cardBeforeRoundUp: roundMoney(finalPix * (1 + Number(ruleSet.cardSurchargeRate))),
        ruleRefs: [
          ...(promoDiscount > 0 ? ["short_term_promotion"] : []),
          ...(comboDiscount > 0 ? ["combo_second_main_discount"] : []),
          "card_surcharge_rate",
        ],
      });
      continue;
    }

    const fixedPix = Number(service.fixedPix);
    items.push({
      lineType: "addon",
      serviceCode: service.code,
      basePix: fixedPix,
      promotionDiscount: 0,
      comboDiscount: 0,
      finalPix: roundMoney(fixedPix),
      cardBeforeRoundUp: roundMoney(fixedPix * (1 + Number(ruleSet.cardSurchargeRate))),
      ruleRefs: ["card_surcharge_rate"],
    });
  }

  const totalPix = roundMoney(items.reduce((sum, item) => sum + item.finalPix, 0));
  const cardBeforeRoundUp = roundMoney(totalPix * (1 + Number(ruleSet.cardSurchargeRate)));
  const totalCard = ceilToMultiple(cardBeforeRoundUp, Number(ruleSet.cardRoundUpMultiple));
  const cardRoundUpAdjustment = roundMoney(totalCard - cardBeforeRoundUp);

  if (cardRoundUpAdjustment > 0) {
    items.push({
      lineType: "adjustment",
      serviceCode: null,
      basePix: 0,
      promotionDiscount: 0,
      comboDiscount: 0,
      finalPix: 0,
      cardBeforeRoundUp: cardRoundUpAdjustment,
      ruleRefs: ["card_round_up"],
    });
  }

  return {
    status: "ready",
    humanRequired: false,
    blockers: [],
    pricingRuleVersion: ruleSet.version,
    comboApplied: comboApplies,
    promotionApplied: promotionDiscount > 0 && mainUnits.length > 0,
    items,
    totals: {
      pix: totalPix,
      cardBeforeRoundUp,
      cardRoundUpAdjustment,
      card: totalCard,
    },
    customerVisible: {
      pix: totalPix,
      card: totalCard,
    },
  };
}

function validateInputs({ tier, services, ruleSet }) {
  const blockers = [];
  let humanRequired = false;

  if (!tier || !Number.isFinite(Number(tier.pix_base ?? tier.pixBase))) {
    blockers.push("PRICING_TIER_MISSING");
    humanRequired = true;
  }

  if (!Array.isArray(services) || services.length === 0) blockers.push("SERVICES_MISSING");

  const requiredRules = [
    "version",
    "cardSurchargeRate",
    "cardRoundUpMultiple",
    "comboSecondMainDiscountRate",
  ];
  for (const key of requiredRules) {
    if (ruleSet?.[key] === null || ruleSet?.[key] === undefined) {
      blockers.push("RULE_MISSING:" + key);
      humanRequired = true;
    }
  }

  for (const service of services ?? []) {
    if (!service?.code) blockers.push("SERVICE_CODE_MISSING");
    if (!["main", "addon"].includes(service?.category)) blockers.push("SERVICE_CATEGORY_INVALID:" + (service?.code ?? "unknown"));
    if (service?.quoteableAutomatically === false) {
      blockers.push("SERVICE_PRICE_REQUIRES_HUMAN:" + service.code);
      humanRequired = true;
    }
    if (
      service?.category === "addon" &&
      service?.quoteableAutomatically !== false &&
      !Number.isFinite(Number(service.fixedPix))
    ) {
      blockers.push("ADDON_FIXED_PRICE_MISSING:" + service.code);
      humanRequired = true;
    }
    const quantity = Number(service?.quantity ?? 1);
    if (!Number.isInteger(quantity) || quantity <= 0) blockers.push("SERVICE_QUANTITY_INVALID:" + (service?.code ?? "unknown"));
  }

  return { ok: blockers.length === 0, blockers, humanRequired };
}

function expandServices(services) {
  const expanded = [];
  for (const service of services) {
    const quantity = Number(service.quantity ?? 1);
    for (let index = 0; index < quantity; index += 1) {
      expanded.push({
        code: service.code,
        category: service.category,
        fixedPix: service.fixedPix,
      });
    }
  }
  return expanded;
}

function runF2QuoteAdapter(input) {
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

return { json: runF2QuoteAdapter($json) };
