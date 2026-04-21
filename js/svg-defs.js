export function makeDefs(spec, palette, geom, tone, additionalDefs = "") {
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

export function readabilityVignetteDefs(gradId, cx, cy, r, tone) {
  const a0 = tone === "dark" ? 0.52 : 0.22;
  const a1 = tone === "dark" ? 0.18 : 0.075;
  return `
    <radialGradient id="${gradId}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r}">
      <stop offset="0%" stop-color="#000000" stop-opacity="${a0}" />
      <stop offset="45%" stop-color="#000000" stop-opacity="${a1}" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>`;
}
