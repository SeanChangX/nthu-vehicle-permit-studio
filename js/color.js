import { DEFAULT_PRIMARY } from "./constants.js";

export function normalizeHex(hex) {
  let h = String(hex || "").trim();
  if (!h.startsWith("#")) h = `#${h}`;
  if (h.length === 4) {
    h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  }
  if (!/^#[0-9A-Fa-f]{6}$/.test(h)) return null;
  return h.toUpperCase();
}

export function hexToRgb(hex) {
  const h = normalizeHex(hex);
  if (!h) return { r: 116, g: 142, b: 72 };
  return {
    r: parseInt(h.slice(1, 3), 16),
    g: parseInt(h.slice(3, 5), 16),
    b: parseInt(h.slice(5, 7), 16),
  };
}

export function rgbToHex(r, g, b) {
  const c = (n) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

export function mixRgb(a, b, t) {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

export function mixHex(hexA, hexB, t) {
  const m = mixRgb(hexToRgb(hexA), hexToRgb(hexB), t);
  return rgbToHex(m.r, m.g, m.b);
}

export function rgbaFromHex(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function paletteForTone(primary, tone) {
  const cBase = normalizeHex(primary) || DEFAULT_PRIMARY;
  if (tone === "dark") {
    const bgTop = mixHex("#161616", cBase, 0.11);
    const bgBottom = mixHex("#0b0b0b", cBase, 0.09);
    return {
      cBase,
      bgTop,
      bgBottom,
      borderSubtle: "rgba(255,255,255,0.08)",
      text: "#F5F5F5",
      textMuted: "#A3A3A3",
      textDim: "#737373",
      logoBorder: "rgba(255,255,255,0.14)",
      logoFill: "rgba(255,255,255,0.04)",
      serialFill: "#FFFFFF",
      serialBorder: "rgba(0,0,0,0.12)",
      serialInk: "#171717",
    };
  }
  const bgTop = mixHex("#FAFAFA", cBase, 0.04);
  const bgBottom = mixHex("#F4F4F5", cBase, 0.07);
  return {
    cBase,
    bgTop,
    bgBottom,
    borderSubtle: rgbaFromHex(cBase, 0.2),
    text: "#171717",
    textMuted: "#525252",
    textDim: "#737373",
    logoBorder: rgbaFromHex(cBase, 0.22),
    logoFill: rgbaFromHex(cBase, 0.06),
    serialFill: "#FFFFFF",
    serialBorder: "rgba(0,0,0,0.08)",
    serialInk: "#262626",
  };
}

export function applyUiBrandColor(hex) {
  const ok = normalizeHex(hex);
  if (!ok) return;
  document.documentElement.style.setProperty("--brand-green", ok);
}
