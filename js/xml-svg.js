export function escapeXml(input) {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function parseViewBoxAttr(value) {
  const parts = String(value || "")
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;
  return parts;
}

export function formatViewBox(box) {
  return box.map((n) => Number(n.toFixed(2))).join(" ");
}

export function measureSvgContentBox(svgText) {
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

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
