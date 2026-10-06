import { ceilToMultiple, roundMoney } from "./utils.mjs";

export function calculateQuote({
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
  const cardBeforeRoundUp = roundMoney(
    totalPix * (1 + Number(ruleSet.cardSurchargeRate))
  );
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
