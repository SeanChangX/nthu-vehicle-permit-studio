import { FONT_IMPORT, FONT_STACK, PX_PER_CM } from "./constants.js";
import { paletteForTone, rgbaFromHex } from "./color.js";
import { extractYearDigits, yearEnglishLabel } from "./format.js";
import { geomMeshLayer } from "./mesh.js";
import { commitYearGridLayout, fitCellGap, makeCommitYearGraphic } from "./year-grid.js";
import { makeDefs, readabilityVignetteDefs } from "./svg-defs.js";
import { logoSlotMarkup, scaledLogoSize } from "./logo-slot.js";
import { state } from "./state.js";
import { escapeXml } from "./xml-svg.js";

export function makeSvg(spec, tone = state.tone) {
  const { widthPx: w, heightPx: h } = spec;
  const palette = paletteForTone(state.primaryHex, tone);
  const serialW = Math.round(spec.serialRectCm.w * PX_PER_CM);
  const serialH = Math.round(spec.serialRectCm.h * PX_PER_CM);
  const k = spec.key;

  const pad = Math.round(Math.min(w, h) * 0.065);
  const rxOuter = spec.isCircle ? w / 2 : Math.max(2, Math.round(h * 0.035));

  const serialX = Math.round(w / 2 - serialW / 2);
  const serialY = h - pad - serialH;
  const yearEn = yearEnglishLabel(state.yearText);

  const accentW = Math.max(3, Math.round(Math.min(w, h) * 0.012));
  const meshMarkup = geomMeshLayer(w, h, spec.key, palette.cBase, tone);
  const meshOpacity = tone === "dark" ? 0.92 : 0.88;

  const serialFs = Math.max(12, Math.round(serialH * 0.34));
  const serialMidX = serialX + serialW / 2;
  const serialMidY = serialY + serialH / 2;
  const serialPillW = Math.round(serialW * 1.24);
  const serialPillH = Math.round(serialH * 0.66);
  const serialPillX = Math.round(serialMidX - serialPillW / 2);
  const serialPillY = Math.round(serialMidY - serialPillH / 2);
  const serialFill =
    tone === "dark" ? "rgba(245,245,245,0.78)" : rgbaFromHex(palette.serialInk, 0.92);
  const serialStroke = tone === "dark" ? "rgba(0,0,0,0.42)" : "rgba(255,255,255,0.55)";

  let yearLayout = commitYearGridLayout(extractYearDigits(state.yearText));
  if (yearLayout.digits.length === 0) {
    yearLayout = commitYearGridLayout("115");
  }

  let contentMarkup;
  let vignetteDefs = "";
  let vignetteRect = "";

  if (spec.isCircle) {
    const logoSlotSize = Math.round(w * 0.165);
    const logoSize = scaledLogoSize(logoSlotSize, w * 0.06, w * 0.22);

    const fsEyebrow = Math.max(8, Math.round(h * 0.019));
    const fsEyebrowTop = Math.max(11, Math.round(h * 0.03));
    const fsZh1 = Math.max(20, Math.round(logoSlotSize * 0.28));
    const fsZh2 = Math.max(17, Math.round(logoSlotSize * 0.24));
    const fsEnPermit = Math.max(12, Math.round(logoSlotSize * 0.17));

    const gridTop = pad + Math.round(h * 0.038);
    const textReserve = Math.round(h * 0.26);
    const availH = Math.max(40, serialY - gridTop - textReserve - 10);
    const availW = Math.max(40, w * 0.84);
    let { cell, gap, gw, gh } = fitCellGap(availW, availH, yearLayout);
    const gridOx = Math.round(w / 2 - gw / 2);
    const yearDownShift = Math.round(h * 0.10);
    const gridOy = gridTop + Math.max(0, (availH - gh) / 2);
    const gridOyYear = gridOy + yearDownShift;
    const yearGraphic = makeCommitYearGraphic(yearLayout, gridOx, gridOyYear, cell, gap, palette.cBase, tone);

    const textGap = Math.round(w * 0.022);
    const textBlockW = Math.round(Math.max(fsZh1 * 6.8, w * 0.25));
    const rowW = logoSlotSize + textGap + textBlockW;
    const startX = Math.round(w / 2 - rowW / 2);
    const logoX = startX;
    const textX = startX + logoSlotSize + textGap;
    const motorGroupShiftY = Math.round(h * 0.142);
    const motorTitleShiftY = Math.round(h * 0.022);

    const textStackH = fsZh1 * 1.12 + fsZh2 * 1.14 + fsEnPermit * 1.32;
    let y = gridOy + gh + Math.round(h * 0.02) + motorGroupShiftY;
    const logoY = Math.round(y + textStackH / 2 - logoSlotSize / 2 - Math.round(h * 0.014));

    const logoMarkup = logoSlotMarkup(logoX, logoY, logoSlotSize, logoSize, palette, "motor");
    const topEyebrowX = Math.round(gridOx + gw / 2);
    const topEyebrowY = Math.max(pad + fsEyebrowTop, Math.round(gridOyYear - fsEyebrowTop * 0.7));

    const readGradId = `${k}_readVignette`;
    const textColMidX = (textX + w - pad) * 0.5;
    const textBlockMidY = y + textStackH * 0.44;
    const readCx = textColMidX * 0.9 + serialMidX * 0.1;
    const readCy = textBlockMidY * 0.38 + serialMidY * 0.62;
    const readR = Math.min(Math.hypot(w * 0.68, h * 0.62), Math.max(w, h) * 0.74);
    vignetteDefs = readabilityVignetteDefs(readGradId, readCx, readCy, readR, tone);
    vignetteRect = `<rect x="0" y="0" width="${w}" height="${h}" fill="url(#${readGradId})" pointer-events="none" />`;

    contentMarkup = `
  ${yearGraphic}
  ${logoMarkup}
  <text x="${topEyebrowX}" y="${topEyebrowY}" text-anchor="middle" fill="${palette.textDim}" font-size="${fsEyebrowTop}" font-weight="500" font-family="${FONT_STACK}" letter-spacing="0.1em">${escapeXml(spec.enUniversity.toUpperCase())}</text>
  <text x="${textX}" y="${(y += motorTitleShiftY)}" text-anchor="start" fill="${palette.text}" font-size="${fsZh1}" font-weight="700" font-family="${FONT_STACK}">${escapeXml(spec.titleLine1)}</text>
  <text x="${textX}" y="${(y += Math.round(fsZh1 * 1.14))}" text-anchor="start" fill="${palette.text}" font-size="${fsZh2}" font-weight="600" font-family="${FONT_STACK}">${escapeXml(spec.titleLine2)}</text>
  <text x="${textX}" y="${(y += Math.round(fsZh2 * 1.14))}" text-anchor="start" fill="${palette.textMuted}" font-size="${fsEnPermit}" font-weight="600" font-family="${FONT_STACK}">${escapeXml(spec.enPermit)}</text>`;
  } else {
    const logoSlotSize = Math.round(h * 0.52);
    const logoSize = scaledLogoSize(logoSlotSize, h * 0.22, h * 0.78);
    const logoX = pad;

    const bandTop = pad + 4;
    const bandBottom = h - pad - 4;
    const bandH = Math.max(40, bandBottom - bandTop);

    const barX = logoX + logoSlotSize + Math.round(h * 0.055);
    const barY = pad + 2;
    const barH = h - barY - pad - 2;

    const textColW = Math.min(300, Math.round(w * 0.3));
    const gridLeft = barX + accentW + Math.round(h * 0.055);
    const availW = Math.max(48, w - pad - gridLeft - textColW - 14);
    const availH = Math.max(48, bandH - 10);
    let { cell, gap, gw, gh } = fitCellGap(availW, availH, yearLayout);
    const gridOx = gridLeft;

    const textX = gridLeft + gw + Math.round(h * 0.055);
    const fsEyebrow = Math.max(8, Math.round(h * 0.026));
    const fsEyebrowTop = Math.max(11, Math.round(fsEyebrow * 1.36));
    const fsZh1 = Math.max(15, Math.round(h * 0.11));
    const fsZh2 = Math.max(14, Math.round(h * 0.095));
    const fsEnPermitBike = Math.max(12, Math.round(h * 0.065));
    const fsSerialCol = Math.max(20, Math.round(h * 0.088));
    const serialGapY = Math.max(14, Math.round(h * 0.06));
    const enGapY = Math.max(8, Math.round(h * 0.026));
    const rightBlockShiftY = Math.round(h * 0.06);

    const titleBlockH = Math.round(fsZh1 * 1.08 + fsZh2 * 1.18);
    const stackH = Math.round(titleBlockH + fsEnPermitBike * 1.35 + serialGapY + serialH);
    const rowH = Math.max(logoSlotSize, gh, stackH);
    const rowTop = bandTop + Math.max(0, (bandH - rowH) / 2);
    const logoY = Math.round(rowTop + (rowH - logoSlotSize) / 2);
    const gridOy = Math.round(rowTop + (rowH - gh) / 2);
    const titleCenterY = gridOy + gh / 2;
    let y = Math.round(titleCenterY - titleBlockH / 2 + fsZh1 * 0.92 - rightBlockShiftY);
    const bikeSerialW = Math.round(serialW * 1.24);
    const bottomEyebrowX = Math.round((gridLeft + (w - pad)) / 2);
    const bikeSerialX = Math.round(bottomEyebrowX - bikeSerialW / 2);
    const bikeSerialH = Math.round(serialH * 0.66);
    const bikeEnPermitY = Math.round(y + fsZh1 * 1.18 + fsZh2 * 1.16);
    const bikeSerialY = Math.min(h - pad - bikeSerialH - 6, Math.round(bikeEnPermitY + serialGapY));
    const bikeSerialMidX = bikeSerialX + bikeSerialW / 2;
    const bikeSerialMidY = bikeSerialY + bikeSerialH / 2;
    const bikeSerialFill = tone === "dark" ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.82)";
    const bikeSerialStroke = tone === "dark" ? "rgba(255,255,255,0.24)" : "rgba(255,255,255,0.95)";
    const bikeSerialText = tone === "dark" ? "rgba(245,245,245,0.96)" : "#1F2937";
    const topEyebrowX = Math.round(gridOx + gw / 2);
    const topEyebrowY = Math.max(pad + fsEyebrowTop, Math.round(gridOy - fsEyebrowTop * 0.75));

    const yearGraphic = makeCommitYearGraphic(yearLayout, gridOx, gridOy, cell, gap, palette.cBase, tone);

    const accentBar = `
  <rect x="${barX}" y="${barY}" width="${accentW}" height="${barH}" rx="0" fill="${palette.cBase}" clip-path="url(#${k}_clip)" />`;

    const logoMarkup = logoSlotMarkup(logoX, logoY, logoSlotSize, logoSize, palette, "bike");

    const readGradId = `${k}_readVignette`;
    const readCx = textX + (w - pad - textX) * 0.44;
    const readCy = rowTop + rowH * 0.5;
    const readR = Math.hypot(w - textX + pad * 1.2, h * 0.92) * 0.62;
    vignetteDefs = readabilityVignetteDefs(readGradId, readCx, readCy, readR, tone);
    vignetteRect = `<rect x="0" y="0" width="${w}" height="${h}" rx="${rxOuter}" ry="${rxOuter}" fill="url(#${readGradId})" pointer-events="none" />`;

    contentMarkup = `
  ${accentBar}
  ${logoMarkup}
  ${yearGraphic}
  <text x="${topEyebrowX}" y="${topEyebrowY}" text-anchor="middle" fill="${palette.textDim}" font-size="${fsEyebrowTop}" font-weight="500" font-family="${FONT_STACK}" letter-spacing="0.1em">${escapeXml(spec.enUniversity.toUpperCase())}</text>
  <text x="${textX}" y="${y}" text-anchor="start" fill="${palette.text}" font-size="${fsZh1}" font-weight="700" font-family="${FONT_STACK}">${escapeXml(spec.titleLine1)}</text>
  <text x="${textX}" y="${(y += Math.round(fsZh1 * 1.18))}" text-anchor="start" fill="${palette.text}" font-size="${fsZh2}" font-weight="600" font-family="${FONT_STACK}">${escapeXml(spec.titleLine2)}</text>
  <text x="${textX}" y="${bikeEnPermitY}" text-anchor="start" fill="${palette.textMuted}" font-size="${fsEnPermitBike}" font-weight="500" font-family="${FONT_STACK}">${escapeXml(spec.enPermit)}</text>
  <rect x="${bikeSerialX}" y="${bikeSerialY}" width="${bikeSerialW}" height="${bikeSerialH}" rx="${Math.round(bikeSerialH / 2)}" fill="${bikeSerialFill}" stroke="${bikeSerialStroke}" stroke-width="1" />
  <text x="${bikeSerialMidX}" y="${bikeSerialMidY}" text-anchor="middle" dominant-baseline="central" fill="${bikeSerialText}" font-size="${Math.round(fsSerialCol * 0.92)}" font-weight="700" font-family="${FONT_STACK}" letter-spacing="0.028em">${escapeXml(state.serialText)}</text>
  `;
  }

  const serialMarkup = spec.isCircle
    ? `
  <rect x="${serialPillX}" y="${serialPillY}" width="${serialPillW}" height="${serialPillH}" rx="${Math.round(serialPillH / 2)}" fill="${tone === "dark" ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.82)"}" stroke="${tone === "dark" ? "rgba(255,255,255,0.24)" : "rgba(255,255,255,0.95)"}" stroke-width="1" />
  <text x="${serialMidX}" y="${serialMidY}" text-anchor="middle" dominant-baseline="central" fill="${tone === "dark" ? "rgba(245,245,245,0.96)" : "#1F2937"}" font-size="${Math.round(serialFs * 0.92)}" font-weight="700" font-family="${FONT_STACK}" letter-spacing="0.028em">${escapeXml(state.serialText)}</text>`
    : "";

  const defs = makeDefs(spec, palette, { w, h, rxOuter }, tone, vignetteDefs);

  let bgMarkup;
  if (spec.isCircle) {
    const cx = w / 2;
    const cy = h / 2;
    const r = w / 2;
    bgMarkup = `
  <g clip-path="url(#${k}_clip)">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${k}_bg)" />
    <g opacity="${meshOpacity}">${meshMarkup}</g>
    ${vignetteRect}
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${palette.borderSubtle}" stroke-width="1" />
    <circle cx="${cx}" cy="${cy}" r="${r - accentW * 0.5}" fill="none" stroke="${rgbaFromHex(palette.cBase, tone === "dark" ? 0.55 : 0.45)}" stroke-width="${accentW * 0.45}" opacity="0.9" />
  </g>`;
  } else {
    bgMarkup = `
  <g clip-path="url(#${k}_clip)">
    <rect x="0" y="0" width="${w}" height="${h}" rx="${rxOuter}" fill="url(#${k}_bg)" />
    <g opacity="${meshOpacity}">${meshMarkup}</g>
    ${vignetteRect}
    <rect x="0" y="0" width="${w}" height="${h}" rx="${rxOuter}" fill="none" stroke="${palette.borderSubtle}" stroke-width="1" />
  </g>`;
  }

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <style type="text/css"><![CDATA[
${FONT_IMPORT}
text { font-family: ${FONT_STACK}; }
  ]]></style>
  ${defs}
  ${bgMarkup}
  ${contentMarkup}
  ${serialMarkup}
</svg>`.trim();
}
