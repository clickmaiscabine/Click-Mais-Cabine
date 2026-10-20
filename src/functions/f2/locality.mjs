import { containsWholePhrase, normalizeText } from "./utils.mjs";

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

export function resolveLocality({ input, localities = [], aliases = [] }) {
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
