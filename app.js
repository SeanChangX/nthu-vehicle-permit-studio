const DPI = 300;
const PX_PER_CM = DPI / 2.54;
const DEFAULT_PRIMARY = "#748E48";
const YEAR_MIN = 100;
const YEAR_MAX = 199;
const DEFAULT_YEAR = "115";
const FONT_STACK = "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif";
const FONT_IMPORT = `@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");`;

const bikeSpec = {
  key: "bike",
  filename: "nthu_bicycle_permit",
  widthPx: Math.round(7 * PX_PER_CM),
  heightPx: Math.round(3 * PX_PER_CM),
  titleLine1: "國立清華大學",
  titleLine2: "腳踏車識別證",
  enUniversity: "National Tsing Hua University",
  enPermit: "Bicycle Permit",
  serialRectCm: { w: 1.5, h: 0.8 },
  isCircle: false,
};

const motorSpec = {
  key: "motor",
  filename: "nthu_motorcycle_permit",
  widthPx: Math.round(6.2 * PX_PER_CM),
  heightPx: Math.round(6.2 * PX_PER_CM),
  titleLine1: "國立清華大學",
  titleLine2: "機車識別證",
  enUniversity: "National Tsing Hua University",
  enPermit: "Motorcycle Permit",
  serialRectCm: { w: 1.7, h: 0.8 },
  isCircle: true,
};

const state = {
  yearText: DEFAULT_YEAR,
  serialText: "X123456",
  logoDataUrl: "",
  logoSvgMarkup: "",
  logoSvgViewBox: "",
  logoScalePct: 100,
  logoTintHexBike: DEFAULT_PRIMARY,
  logoTintHexMotor: DEFAULT_PRIMARY,
  logoTintStrengthBike: 0,
  logoTintStrengthMotor: 0,
  primaryHex: DEFAULT_PRIMARY,
  tone: "dark",
};

const bikePreview = document.getElementById("bikePreview");
const motorPreview = document.getElementById("motorPreview");
const yearInput = document.getElementById("yearText");
const serialInput = document.getElementById("serialText");
const logoInput = document.getElementById("logoInput");
const refreshBtn = document.getElementById("refreshBtn");
const exportAllBtn = document.getElementById("exportAllBtn");
const primaryColorInput = document.getElementById("primaryColor");
const primaryHexInput = document.getElementById("primaryHex");
const toneRadios = document.querySelectorAll('input[name="tone"]');
const logoScaleInput = document.getElementById("logoScale");
const logoScaleOut = document.getElementById("logoScaleOut");
const logoTintColorBikeInput = document.getElementById("logoTintColorBike");
const logoTintHexBikeInput = document.getElementById("logoTintHexBike");
const logoTintColorMotorInput = document.getElementById("logoTintColorMotor");
const logoTintHexMotorInput = document.getElementById("logoTintHexMotor");
const logoTintStrengthBikeInput = document.getElementById("logoTintStrengthBike");
const logoTintStrengthBikeOut = document.getElementById("logoTintStrengthBikeOut");
const logoTintStrengthMotorInput = document.getElementById("logoTintStrengthMotor");
const logoTintStrengthMotorOut = document.getElementById("logoTintStrengthMotorOut");

function clampNum(n, lo, hi) {
  const x = Number(n);
  if (!Number.isFinite(x)) return lo;
  return Math.max(lo, Math.min(hi, x));
}

function normalizeYearInput(raw) {
  const digits = String(raw ?? "").replace(/\D+/g, "");
  const parsed = Number.parseInt(digits, 10);
  if (!Number.isFinite(parsed)) return DEFAULT_YEAR;
  const clamped = Math.max(YEAR_MIN, Math.min(YEAR_MAX, parsed));
  return String(clamped);
}

function scaledLogoSize(base, minV, maxV) {
  const f = clampNum(state.logoScalePct, 50, 150) / 100;
  return Math.round(clampNum(base * f, minV, maxV));
}

function logoSlotMarkup(logoX, logoY, slotSize, renderSize, palette, variant) {
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

function measureCjkTextWidthPx(text, fontWeight, fontSizePx) {
  if (typeof document === "undefined") return null;
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return null;
  ctx.font = `${fontWeight} ${fontSizePx}px ${FONT_STACK}, "Microsoft JhengHei", "PingFang TC", "Noto Sans TC", sans-serif`;
  return ctx.measureText(text).width;
}

function normalizeHex(hex) {
  let h = String(hex || "").trim();
  if (!h.startsWith("#")) h = `#${h}`;
  if (h.length === 4) {
    h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  }
  if (!/^#[0-9A-Fa-f]{6}$/.test(h)) return null;
  return h.toUpperCase();
}

function hexToRgb(hex) {
  const h = normalizeHex(hex);
  if (!h) return { r: 116, g: 142, b: 72 };
  return {
    r: parseInt(h.slice(1, 3), 16),
    g: parseInt(h.slice(3, 5), 16),
    b: parseInt(h.slice(5, 7), 16),
  };
}

function rgbToHex(r, g, b) {
  const c = (n) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

function mixRgb(a, b, t) {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

function mixHex(hexA, hexB, t) {
  const m = mixRgb(hexToRgb(hexA), hexToRgb(hexB), t);
  return rgbToHex(m.r, m.g, m.b);
}

function rgbaFromHex(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function edgeKeyMesh(a, b) {
  const s1 = `${a.x.toFixed(2)},${a.y.toFixed(2)}`;
  const s2 = `${b.x.toFixed(2)},${b.y.toFixed(2)}`;
  return s1 < s2 ? `${s1}|${s2}` : `${s2}|${s1}`;
}

function geomMeshLayer(w, h, seedKey, cBase, tone) {
  const seed =
    seedKey.split("").reduce((acc, ch, i) => acc + ch.charCodeAt(0) * (i + 3), 0) +
    Math.round(w) * 11 +
    Math.round(h) * 19 +
    seedKey.length * 997;

  const rnd = (ii, jj, salt = 0) => {
    const t = seed * 0.00023 + ii * 12.9898 + jj * 78.233 + salt * 31.415;
    const u = Math.sin(t) * 43758.5453;
    const v = Math.cos(t * 1.713 + salt * 9.17) * 28462.1543;
    const a = u - Math.floor(u);
    const b = v - Math.floor(v);
    return (a * 0.58 + b * 0.42 + 7.13) % 1;
  };

  const cellTarget = 54;
  const cols = Math.max(8, Math.min(22, Math.round(w / cellTarget)));
  const rows = Math.max(5, Math.min(16, Math.round(h / cellTarget)));

  const axisLens = (len, nCells, saltBase) => {
    const weights = [];
    for (let k = 0; k < nCells; k++) {
      weights.push(0.62 + rnd(k, saltBase, 40 + k) * 0.76);
    }
    const sum = weights.reduce((a, b) => a + b, 0);
    const pos = [0];
    for (let k = 0; k < nCells; k++) {
      pos.push(pos[k] + (weights[k] / sum) * len);
    }
    pos[nCells] = len;
    return pos;
  };

  const xPos = axisLens(w, cols, 101);
  const yPos = axisLens(h, rows, 203);

  const pts = [];
  for (let j = 0; j <= rows; j++) {
    const row = [];
    for (let i = 0; i <= cols; i++) {
      let x = xPos[i];
      let y = yPos[j];
      if (i > 0 && i < cols && j > 0 && j < rows) {
        const spanX = (xPos[i + 1] - xPos[i - 1]) * 0.5;
        const spanY = (yPos[j + 1] - yPos[j - 1]) * 0.5;
        const jx = 0.32 + rnd(i, j, 1) * 0.38;
        const jy = 0.32 + rnd(i, j, 2) * 0.38;
        x += (rnd(i, j, 3) - 0.5) * spanX * jx;
        y += (rnd(i, j, 4) - 0.5) * spanY * jy;
      }
      row.push({ x, y });
    }
    pts.push(row);
  }

  const seen = new Set();
  const edges = [];
  const pushEdge = (p, q) => {
    const k = edgeKeyMesh(p, q);
    if (seen.has(k)) return;
    seen.add(k);
    edges.push([p, q]);
  };

  let fills = "";
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const p00 = pts[j][i];
      const p10 = pts[j][i + 1];
      const p01 = pts[j + 1][i];
      const p11 = pts[j + 1][i + 1];
      const flip = rnd(i, j, 5) > 0.42 + rnd(i + 3, j + 7, 6) * 0.22;
      let triA;
      let triB;
      if (flip) {
        triA = [p00, p10, p01];
        triB = [p10, p11, p01];
        pushEdge(p00, p10);
        pushEdge(p00, p01);
        pushEdge(p10, p01);
        pushEdge(p10, p11);
        pushEdge(p01, p11);
        pushEdge(p10, p01);
      } else {
        triA = [p00, p10, p11];
        triB = [p00, p11, p01];
        pushEdge(p00, p10);
        pushEdge(p10, p11);
        pushEdge(p00, p11);
        pushEdge(p00, p01);
        pushEdge(p01, p11);
        pushEdge(p00, p11);
      }

      let triIdx = 0;
      for (const tri of [triA, triB]) {
        const n1 = rnd(i * 3 + triIdx, j * 5 + triIdx * 7, 11);
        const n2 = rnd(i + triIdx * 11, j + triIdx * 13, 12);
        const noise = (n1 * 0.62 + n2 * 0.38 + rnd(i, j, 13 + triIdx) * 0.15) % 1;
        const baseOp =
          tone === "dark"
            ? 0.028 + noise * 0.125 + rnd(i, j, 14 + triIdx) * 0.028
            : 0.042 + noise * 0.1 + rnd(i, j, 15 + triIdx) * 0.035;
        const fill = rgbaFromHex(cBase, baseOp);
        fills += `<path d="M ${tri[0].x} ${tri[0].y} L ${tri[1].x} ${tri[1].y} L ${tri[2].x} ${tri[2].y} Z" fill="${fill}" />`;
        triIdx++;
      }
    }
  }

  const strokeCol = tone === "dark" ? "rgba(255,255,255,0.085)" : rgbaFromHex(cBase, 0.16);
  const accentStroke = tone === "dark" ? rgbaFromHex(cBase, 0.22) : rgbaFromHex(cBase, 0.12);
  let lines = "";
  let ei = 0;
  for (const [p, q] of edges) {
    const midX = (p.x + q.x) / 2;
    const midY = (p.y + q.y) / 2;
    const pick =
      rnd(Math.floor(midX * 0.21 + ei * 0.03), Math.floor(midY * 0.17 + ei * 0.05), 21) * 0.55 +
      rnd(ei, ei >> 3, 22) * 0.45;
    const stroke = pick > 0.66 + rnd(Math.floor(midX), Math.floor(midY), 23) * 0.14 ? accentStroke : strokeCol;
    const sw = 0.38 + rnd(Math.floor(midX * 0.4), Math.floor(midY * 0.4), 24) * 0.55;
    lines += `<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke="${stroke}" stroke-width="${sw.toFixed(2)}" stroke-linecap="round" stroke-linejoin="round" />`;
    ei++;
  }

  return `<g>${fills}${lines}</g>`;
}

function applyUiBrandColor(hex) {
  const ok = normalizeHex(hex);
  if (!ok) return;
  document.documentElement.style.setProperty("--brand-green", ok);
}

function yearEnglishLabel(zh) {
  const m = String(zh || "").match(/(\d{2,3})/);
  const n = m ? m[1] : "115";
  return `AY ${n}`;
}

function extractYearDigits(zh) {
  const m = String(zh || "").match(/\d{2,4}/);
  return m ? m[0] : "115";
}

const DIGIT_5X7 = {
  "0": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "00001", "00001", "01110", "10000", "10000", "01110"],
  "3": ["01110", "00001", "00001", "00110", "00001", "00001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["01110", "10000", "10000", "01110", "00001", "00001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["01110", "00001", "00001", "00010", "00100", "00100", "00100"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
};

function commitYearGridLayout(digitsStr) {
  const digits = digitsStr.split("").filter((c) => DIGIT_5X7[c]);
  const rows = 7;
  const digitCols = 5;
  const gapCols = 1;
  const colMeta = [];
  for (let di = 0; di < digits.length; di++) {
    for (let c = 0; c < digitCols; c++) {
      colMeta.push({ type: "digit", di, lc: c });
    }
    if (di < digits.length - 1) {
      for (let g = 0; g < gapCols; g++) {
        colMeta.push({ type: "gap" });
      }
    }
  }
  return { digits, rows, totalCols: colMeta.length, colMeta };
}

function makeCommitYearGraphic(layout, ox, oy, cell, gap, cBase, tone) {
  const { digits, rows, colMeta } = layout;
  const rx = Math.max(0.8, cell * 0.14);
  const filledLo = tone === "dark" ? 0.52 : 0.42;
  const filledHi = tone === "dark" ? 1 : 0.88;
  const ghostFill = tone === "dark" ? 0.08 : 0.1;
  const ghostStroke = tone === "dark" ? 0.22 : 0.28;
  let out = `<g>`;
  const stride = cell + gap;
  for (let r = 0; r < rows; r++) {
    for (let cc = 0; cc < colMeta.length; cc++) {
      const meta = colMeta[cc];
      const x = ox + cc * stride;
      const y = oy + r * stride;
      if (meta.type === "gap") {
        out += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="${rx}" fill="${rgbaFromHex(cBase, ghostFill * 0.55)}" stroke="${rgbaFromHex(cBase, ghostStroke * 0.75)}" stroke-width="0.55" />`;
        continue;
      }
      const pat = DIGIT_5X7[digits[meta.di]];
      const ch = pat[r][meta.lc];
      const h = (r * 17 + cc * 11 + meta.di * 31) % 17;
      const t = h / 17;
      if (ch === "1") {
        const op = filledLo + (filledHi - filledLo) * (0.25 + t * 0.75);
        out += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="${rx}" fill="${rgbaFromHex(cBase, op)}" />`;
      } else {
        out += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="${rx}" fill="${rgbaFromHex(cBase, ghostFill)}" stroke="${rgbaFromHex(cBase, ghostStroke)}" stroke-width="0.65" />`;
      }
    }
  }
  out += `</g>`;
  return out;
}

function fitCellGap(availW, availH, layout) {
  const { rows, totalCols } = layout;
  const rowGaps = rows - 1;
  const colGaps = totalCols - 1;
  const maxStart = Math.min(48, Math.floor(availH / rows), Math.floor(availW / totalCols));
  for (let cell = maxStart; cell >= 4; cell--) {
    const gap = Math.max(1, Math.round(cell * 0.16));
    const gw = totalCols * cell + colGaps * gap;
    const gh = rows * cell + rowGaps * gap;
    if (gw <= availW && gh <= availH) {
      return { cell, gap, gw, gh };
    }
  }
  const gap = 1;
  const cell = 4;
  return {
    cell,
    gap,
    gw: totalCols * cell + colGaps * gap,
    gh: rows * cell + rowGaps * gap,
  };
}

function paletteForTone(primary, tone) {
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

function makeDefs(spec, palette, geom, tone, additionalDefs = "") {
  const k = spec.key;
  const { w, h, rxOuter } = geom;
  const clipShape = spec.isCircle
    ? `<clipPath id="${k}_clip"><circle cx="${w / 2}" cy="${h / 2}" r="${w / 2}" /></clipPath>`
    : `<clipPath id="${k}_clip"><rect x="0" y="0" width="${w}" height="${h}" rx="${rxOuter}" ry="${rxOuter}" /></clipPath>`;

  return `
  <defs>
    ${clipShape}
    <linearGradient id="${k}_bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${palette.bgTop}" />
      <stop offset="100%" stop-color="${palette.bgBottom}" />
    </linearGradient>
    ${additionalDefs}
  </defs>`;
}

function readabilityVignetteDefs(gradId, cx, cy, r, tone) {
  const a0 = tone === "dark" ? 0.52 : 0.22;
  const a1 = tone === "dark" ? 0.18 : 0.075;
  return `
    <radialGradient id="${gradId}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r}">
      <stop offset="0%" stop-color="#000000" stop-opacity="${a0}" />
      <stop offset="45%" stop-color="#000000" stop-opacity="${a1}" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>`;
}

function makeSvg(spec, tone = state.tone) {
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

function renderPreview() {
  bikePreview.innerHTML = makeSvg(bikeSpec);
  motorPreview.innerHTML = makeSvg(motorSpec);
}

function escapeXml(input) {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function parseViewBoxAttr(value) {
  const parts = String(value || "")
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;
  return parts;
}

function formatViewBox(box) {
  return box.map((n) => Number(n.toFixed(2))).join(" ");
}

function measureSvgContentBox(svgText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");
  const svgEl = doc.documentElement;
  if (!svgEl || svgEl.nodeName.toLowerCase() !== "svg") {
    return { markup: "", viewBox: "0 0 100 100" };
  }

  const mount = document.createElement("div");
  mount.style.position = "fixed";
  mount.style.left = "-10000px";
  mount.style.top = "-10000px";
  mount.style.width = "0";
  mount.style.height = "0";
  mount.style.opacity = "0";
  mount.style.pointerEvents = "none";

  const probe = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  probe.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  probe.setAttribute("width", "2048");
  probe.setAttribute("height", "2048");
  probe.setAttribute("viewBox", svgEl.getAttribute("viewBox") || "0 0 2048 2048");
  probe.innerHTML = svgEl.innerHTML;
  mount.appendChild(probe);
  document.body.appendChild(mount);

  let box = null;
  try {
    const b = probe.getBBox();
    if (Number.isFinite(b.width) && Number.isFinite(b.height) && b.width > 0 && b.height > 0) {
      const pad = Math.max(b.width, b.height) * 0.04;
      box = [b.x - pad, b.y - pad, b.width + pad * 2, b.height + pad * 2];
    }
  } catch {}

  document.body.removeChild(mount);

  if (!box) {
    const attr = parseViewBoxAttr(svgEl.getAttribute("viewBox"));
    if (attr) box = attr;
  }
  if (!box) {
    const w = Number.parseFloat(svgEl.getAttribute("width")) || 100;
    const h = Number.parseFloat(svgEl.getAttribute("height")) || 100;
    box = [0, 0, w, h];
  }

  return {
    markup: svgEl.innerHTML,
    viewBox: formatViewBox(box),
  };
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function svgToRasterBlob(svgString, format, width, height) {
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);
  const img = new Image();
  img.decoding = "sync";
  img.src = svgUrl;
  await img.decode();

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (format === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(svgUrl);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), format, 0.95);
  });
}

async function exportSpec(spec) {
  const svg = makeSvg(spec);
  downloadBlob(`${spec.filename}.svg`, new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  await sleep(150);

  const pngBlob = await svgToRasterBlob(svg, "image/png", spec.widthPx, spec.heightPx);
  downloadBlob(`${spec.filename}.png`, pngBlob);
  await sleep(150);

  const jpgBlob = await svgToRasterBlob(svg, "image/jpeg", spec.widthPx, spec.heightPx);
  downloadBlob(`${spec.filename}.jpg`, jpgBlob);
  await sleep(150);
}

async function handleExportAll() {
  syncStateFromInputs();
  renderPreview();

  const label = exportAllBtn.textContent;
  exportAllBtn.disabled = true;
  exportAllBtn.textContent = "Exporting...";
  const headerBtn = document.getElementById("headerExportBtn");
  if (headerBtn) headerBtn.disabled = true;
  try {
    await exportSpec(bikeSpec);
    await sleep(200);
    await exportSpec(motorSpec);
  } finally {
    exportAllBtn.disabled = false;
    exportAllBtn.textContent = label;
    if (headerBtn) headerBtn.disabled = false;
  }
}

function updateLogoControlLabels() {
  if (logoScaleOut) logoScaleOut.textContent = `${Math.round(state.logoScalePct)}%`;
  if (logoTintStrengthBikeOut) logoTintStrengthBikeOut.textContent = `${Math.round(state.logoTintStrengthBike)}%`;
  if (logoTintStrengthMotorOut) logoTintStrengthMotorOut.textContent = `${Math.round(state.logoTintStrengthMotor)}%`;
}

function syncStateFromInputs() {
  const normalizedYear = normalizeYearInput(yearInput?.value);
  state.yearText = normalizedYear;
  if (yearInput) yearInput.value = normalizedYear;
  state.serialText = serialInput.value.trim() || "X123456";
  const hex = normalizeHex(primaryHexInput.value) || normalizeHex(primaryColorInput.value) || DEFAULT_PRIMARY;
  state.primaryHex = hex;
  primaryColorInput.value = hex.toLowerCase();
  primaryHexInput.value = hex;
  applyUiBrandColor(hex);
  state.tone = document.querySelector('input[name="tone"]:checked')?.value === "light" ? "light" : "dark";
  state.logoScalePct = logoScaleInput ? clampNum(logoScaleInput.value, 50, 150) : state.logoScalePct;
  const bikeTint =
    normalizeHex(logoTintHexBikeInput?.value) ||
    normalizeHex(logoTintColorBikeInput?.value) ||
    state.logoTintHexBike ||
    DEFAULT_PRIMARY;
  const motorTint =
    normalizeHex(logoTintHexMotorInput?.value) ||
    normalizeHex(logoTintColorMotorInput?.value) ||
    state.logoTintHexMotor ||
    DEFAULT_PRIMARY;
  state.logoTintHexBike = bikeTint;
  state.logoTintHexMotor = motorTint;
  if (logoTintColorBikeInput) logoTintColorBikeInput.value = bikeTint.toLowerCase();
  if (logoTintHexBikeInput) logoTintHexBikeInput.value = bikeTint;
  if (logoTintColorMotorInput) logoTintColorMotorInput.value = motorTint.toLowerCase();
  if (logoTintHexMotorInput) logoTintHexMotorInput.value = motorTint;
  state.logoTintStrengthBike = logoTintStrengthBikeInput
    ? clampNum(logoTintStrengthBikeInput.value, 0, 100)
    : state.logoTintStrengthBike;
  state.logoTintStrengthMotor = logoTintStrengthMotorInput
    ? clampNum(logoTintStrengthMotorInput.value, 0, 100)
    : state.logoTintStrengthMotor;
  updateLogoControlLabels();
}

async function handleLogoChange(event) {
  const file = event.target.files?.[0];
  if (!file) {
    state.logoDataUrl = "";
    state.logoSvgMarkup = "";
    state.logoSvgViewBox = "";
    syncStateFromInputs();
    renderPreview();
    return;
  }

  const isSvg =
    file.type === "image/svg+xml" || /\.svg$/i.test(file.name || "");

  if (isSvg) {
    const svgText = await file.text();
    const parsed = measureSvgContentBox(svgText);
    state.logoDataUrl = "";
    state.logoSvgMarkup = parsed.markup;
    state.logoSvgViewBox = parsed.viewBox;
  } else {
    state.logoDataUrl = await fileToDataUrl(file);
    state.logoSvgMarkup = "";
    state.logoSvgViewBox = "";
  }

  syncStateFromInputs();
  renderPreview();
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function onPrimaryColorPick() {
  const hex = normalizeHex(primaryColorInput.value);
  if (hex) {
    primaryHexInput.value = hex;
    state.primaryHex = hex;
    applyUiBrandColor(hex);
    renderPreview();
  }
}

function onPrimaryHexInput() {
  const hex = normalizeHex(primaryHexInput.value);
  if (hex) {
    primaryColorInput.value = hex.toLowerCase();
    state.primaryHex = hex;
    applyUiBrandColor(hex);
    renderPreview();
  }
}

function onToneChange() {
  syncStateFromInputs();
  renderPreview();
}

function onLogoTintColorPick(which) {
  const colorInput = which === "motor" ? logoTintColorMotorInput : logoTintColorBikeInput;
  const hexInput = which === "motor" ? logoTintHexMotorInput : logoTintHexBikeInput;
  const h = normalizeHex(colorInput?.value);
  if (h) {
    if (hexInput) hexInput.value = h;
    if (which === "motor") {
      state.logoTintHexMotor = h;
    } else {
      state.logoTintHexBike = h;
    }
    renderPreview();
  }
}

function onLogoTintHexInput(which) {
  const colorInput = which === "motor" ? logoTintColorMotorInput : logoTintColorBikeInput;
  const hexInput = which === "motor" ? logoTintHexMotorInput : logoTintHexBikeInput;
  const h = normalizeHex(hexInput?.value);
  if (h) {
    if (colorInput) colorInput.value = h.toLowerCase();
    if (which === "motor") {
      state.logoTintHexMotor = h;
    } else {
      state.logoTintHexBike = h;
    }
    renderPreview();
  }
}

function onLogoControlsInput() {
  syncStateFromInputs();
  renderPreview();
}

refreshBtn.addEventListener("click", () => {
  syncStateFromInputs();
  renderPreview();
});

exportAllBtn.addEventListener("click", handleExportAll);
document.getElementById("headerExportBtn")?.addEventListener("click", () => {
  exportAllBtn.click();
});
logoInput.addEventListener("change", handleLogoChange);
logoScaleInput?.addEventListener("input", onLogoControlsInput);
logoTintStrengthBikeInput?.addEventListener("input", onLogoControlsInput);
logoTintStrengthMotorInput?.addEventListener("input", onLogoControlsInput);
logoTintColorBikeInput?.addEventListener("input", () => onLogoTintColorPick("bike"));
logoTintHexBikeInput?.addEventListener("change", () => onLogoTintHexInput("bike"));
logoTintHexBikeInput?.addEventListener("blur", () => onLogoTintHexInput("bike"));
logoTintColorMotorInput?.addEventListener("input", () => onLogoTintColorPick("motor"));
logoTintHexMotorInput?.addEventListener("change", () => onLogoTintHexInput("motor"));
logoTintHexMotorInput?.addEventListener("blur", () => onLogoTintHexInput("motor"));
primaryColorInput.addEventListener("input", onPrimaryColorPick);
primaryHexInput.addEventListener("change", onPrimaryHexInput);
primaryHexInput.addEventListener("blur", onPrimaryHexInput);
toneRadios.forEach((r) => r.addEventListener("change", onToneChange));

function buildCommitGrid() {
  const el = document.getElementById("commitBg");
  if (!el) return;
  const step = 12;
  const cols = Math.min(64, Math.max(28, Math.floor((window.innerWidth - 48) / step)));
  const rows = Math.min(42, Math.max(22, Math.floor((window.innerHeight - 100) / step)));
  el.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  el.replaceChildren();
  const n = cols * rows;
  for (let i = 0; i < n; i++) {
    const cell = document.createElement("div");
    cell.className = "commit-cell";
    const u = Math.abs(Math.sin(i * 12.9898 + cols * 78.233)) % 1;
    const level = u < 0.5 ? 0 : u < 0.68 ? 1 : u < 0.8 ? 2 : u < 0.9 ? 3 : 4;
    cell.dataset.level = String(level);
    el.appendChild(cell);
  }
}

let commitResizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(commitResizeTimer);
  commitResizeTimer = setTimeout(buildCommitGrid, 180);
});

syncStateFromInputs();
buildCommitGrid();
renderPreview();



