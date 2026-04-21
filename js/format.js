import { DEFAULT_YEAR, YEAR_MAX, YEAR_MIN } from "./constants.js";

export function clampNum(n, lo, hi) {
  const x = Number(n);
  if (!Number.isFinite(x)) return lo;
  return Math.max(lo, Math.min(hi, x));
}

export function normalizeYearInput(raw) {
  const digits = String(raw ?? "").replace(/\D+/g, "");
  const parsed = Number.parseInt(digits, 10);
  if (!Number.isFinite(parsed)) return DEFAULT_YEAR;
  const clamped = Math.max(YEAR_MIN, Math.min(YEAR_MAX, parsed));
  return String(clamped);
}

export function yearEnglishLabel(zh) {
  const m = String(zh || "").match(/(\d{2,3})/);
  const n = m ? m[1] : "115";
  return `AY ${n}`;
}

export function extractYearDigits(zh) {
  const m = String(zh || "").match(/\d{2,4}/);
  return m ? m[0] : "115";
}
