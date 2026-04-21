import { DEFAULT_PRIMARY, FONT_STACK } from "./constants.js";
import { normalizeHex } from "./color.js";
import { state } from "./state.js";
import { clampNum } from "./format.js";

export function scaledLogoSize(base, minV, maxV) {
  const f = clampNum(state.logoScalePct, 50, 150) / 100;
  return Math.round(clampNum(base * f, minV, maxV));
}

export function logoSlotMarkup(logoX, logoY, slotSize, renderSize, palette, variant) {
  const isMotor = variant === "motor";
  const textYFrac = isMotor ? 0.55 : 0.54;
  const textFsMul = isMotor ? 0.18 : 0.1;
  const renderX = logoX + (slotSize - renderSize) / 2;
  const renderY = logoY + (slotSize - renderSize) / 2;
  const maskId = `logo_mask_${variant}_${Math.round(logoX)}_${Math.round(logoY)}_${Math.round(renderSize)}`;
  const tintClass = `logo_tint_${variant}_${Math.round(logoX)}_${Math.round(logoY)}_${Math.round(renderSize)}`;

  if (!state.logoDataUrl && !state.logoSvgMarkup) {
    return `<rect x="${logoX}" y="${logoY}" width="${slotSize}" height="${slotSize}" rx="2" fill="${palette.logoFill}" stroke="${palette.logoBorder}" stroke-width="1" />
         <text x="${logoX + slotSize / 2}" y="${logoY + slotSize * textYFrac}" text-anchor="middle" fill="${palette.textDim}" font-size="${Math.round(slotSize * textFsMul)}" font-weight="500" font-family="${FONT_STACK}">Logo</text>`;
  }

  const tintHex =
    normalizeHex(variant === "motor" ? state.logoTintHexMotor : state.logoTintHexBike) ||
    DEFAULT_PRIMARY;
  const tintStrength =
    variant === "motor" ? state.logoTintStrengthMotor : state.logoTintStrengthBike;
  const tintOp = clampNum(tintStrength, 0, 100) / 100;

  if (state.logoSvgMarkup && state.logoSvgViewBox) {
    const originalOpacity = (1 - tintOp).toFixed(3);
    const tintedOpacity = tintOp.toFixed(3);
    return `<svg x="${renderX}" y="${renderY}" width="${renderSize}" height="${renderSize}" viewBox="${state.logoSvgViewBox}" preserveAspectRatio="xMidYMid meet" overflow="visible" aria-hidden="true">
  <defs>
    <style>
      .${tintClass} * {
        fill: ${tintHex} !important;
        stroke: ${tintHex} !important;
      }
      .${tintClass} [fill="none"] { fill: none !important; }
      .${tintClass} [stroke="none"] { stroke: none !important; }
    </style>
  </defs>
  <g opacity="${originalOpacity}">${state.logoSvgMarkup}</g>
  <g class="${tintClass}" opacity="${tintedOpacity}">${state.logoSvgMarkup}</g>
</svg>`;
  }

  const img = `<image href="${state.logoDataUrl}" x="${renderX}" y="${renderY}" width="${renderSize}" height="${renderSize}" preserveAspectRatio="xMidYMid meet" />`;

  if (tintOp <= 0) {
    return img;
  }

  return `<g>
  <g opacity="${(1 - tintOp).toFixed(3)}">${img}</g>
  <mask id="${maskId}" maskUnits="userSpaceOnUse">
    ${img}
  </mask>
  <rect x="${renderX}" y="${renderY}" width="${renderSize}" height="${renderSize}" fill="${tintHex}" opacity="${tintOp}" mask="url(#${maskId})" />
</g>`;
}

export function measureCjkTextWidthPx(text, fontWeight, fontSizePx) {
  if (typeof document === "undefined") return null;
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return null;
  ctx.font = `${fontWeight} ${fontSizePx}px ${FONT_STACK}, "Microsoft JhengHei", "PingFang TC", "Noto Sans TC", sans-serif`;
  return ctx.measureText(text).width;
}
