import { addCalendarMonths, daysBetweenDateOnly, normalizeText, parseDateOnly } from "./utils.mjs";

const GIFT_EVENT_TYPES = new Set(["casamento", "debutante", "aniversario"]);

export function evaluateDatePolicy({
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
