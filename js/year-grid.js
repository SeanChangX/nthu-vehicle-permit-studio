import { rgbaFromHex } from "./color.js";

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

export function commitYearGridLayout(digitsStr) {
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

export function makeCommitYearGraphic(layout, ox, oy, cell, gap, cBase, tone) {
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

export function fitCellGap(availW, availH, layout) {
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
