import { rgbaFromHex } from "./color.js";

function edgeKeyMesh(a, b) {
  const s1 = `${a.x.toFixed(2)},${a.y.toFixed(2)}`;
  const s2 = `${b.x.toFixed(2)},${b.y.toFixed(2)}`;
  return s1 < s2 ? `${s1}|${s2}` : `${s2}|${s1}`;
}

export function geomMeshLayer(w, h, seedKey, cBase, tone) {
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
