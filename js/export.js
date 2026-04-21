import { makeSvg } from "./permit-svg.js";

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function sleep(ms) {
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

export async function exportSpec(spec) {
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
