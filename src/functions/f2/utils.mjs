import { createHash } from "node:crypto";

export function normalizeText(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function ceilToMultiple(value, multiple) {
  if (!(multiple > 0)) throw new Error("round_up_multiple_must_be_positive");
  return roundMoney(Math.ceil((Number(value) - 1e-9) / multiple) * multiple);
}

export function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  const keys = Object.keys(value).sort();
  return "{" + keys.map((key) => JSON.stringify(key) + ":" + stableStringify(value[key])).join(",") + "}";
}

export function sha256(value) {
  return createHash("sha256").update(String(value), "utf8").digest("hex");
}

export function parseDateOnly(value) {
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

export function formatDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

export function daysBetweenDateOnly(from, to) {
  const a = parseDateOnly(from);
  const b = parseDateOnly(to);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function addCalendarMonths(dateOnly, months) {
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

export function containsWholePhrase(normalizedText, normalizedPhrase) {
  if (!normalizedText || !normalizedPhrase) return false;
  return (" " + normalizedText + " ").includes(" " + normalizedPhrase + " ");
}
