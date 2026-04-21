export const DPI = 300;
export const PX_PER_CM = DPI / 2.54;
export const DEFAULT_PRIMARY = "#748E48";
export const YEAR_MIN = 100;
export const YEAR_MAX = 199;
export const DEFAULT_YEAR = "115";
export const FONT_STACK = "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif";
export const FONT_IMPORT = `@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");`;

export const bikeSpec = {
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

export const motorSpec = {
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
