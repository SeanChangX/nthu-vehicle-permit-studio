import { bikeSpec, DEFAULT_PRIMARY, motorSpec } from "./constants.js";
import { applyUiBrandColor, normalizeHex } from "./color.js";
import { clampNum, normalizeYearInput } from "./format.js";
import { exportSpec, sleep } from "./export.js";
import { makeSvg } from "./permit-svg.js";
import { state } from "./state.js";
import { fileToDataUrl, measureSvgContentBox } from "./xml-svg.js";

const bikePreview = document.getElementById("bikePreview");
const motorPreview = document.getElementById("motorPreview");
const yearInput = document.getElementById("yearText");
const serialInput = document.getElementById("serialText");
const logoInput = document.getElementById("logoInput");
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

function renderPreview() {
  bikePreview.innerHTML = makeSvg(bikeSpec);
  motorPreview.innerHTML = makeSvg(motorSpec);
}

async function handleExportAll() {
  syncStateFromInputs();
  renderPreview();

  const label = exportAllBtn.textContent;
  exportAllBtn.disabled = true;
  exportAllBtn.textContent = "Exporting...";
  try {
    await exportSpec(bikeSpec);
    await sleep(200);
    await exportSpec(motorSpec);
  } finally {
    exportAllBtn.disabled = false;
    exportAllBtn.textContent = label;
  }
}

function updateLogoControlLabels() {
  if (logoScaleOut) logoScaleOut.textContent = `${Math.round(state.logoScalePct)}%`;
  if (logoTintStrengthBikeOut) logoTintStrengthBikeOut.textContent = `${Math.round(state.logoTintStrengthBike)}%`;
  if (logoTintStrengthMotorOut) logoTintStrengthMotorOut.textContent = `${Math.round(state.logoTintStrengthMotor)}%`;
}

function syncStateFromInputs() {
  state.yearText = normalizeYearInput(yearInput?.value);
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

function refreshFromInputs() {
  syncStateFromInputs();
  renderPreview();
}

function commitYearField() {
  if (!yearInput) return;
  yearInput.value = normalizeYearInput(yearInput.value);
  refreshFromInputs();
}

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

exportAllBtn.addEventListener("click", handleExportAll);
logoInput.addEventListener("change", handleLogoChange);
logoScaleInput?.addEventListener("input", refreshFromInputs);
logoTintStrengthBikeInput?.addEventListener("input", refreshFromInputs);
logoTintStrengthMotorInput?.addEventListener("input", refreshFromInputs);
logoTintColorBikeInput?.addEventListener("input", refreshFromInputs);
logoTintHexBikeInput?.addEventListener("input", refreshFromInputs);
logoTintColorMotorInput?.addEventListener("input", refreshFromInputs);
logoTintHexMotorInput?.addEventListener("input", refreshFromInputs);
primaryColorInput.addEventListener("input", refreshFromInputs);
primaryHexInput.addEventListener("input", refreshFromInputs);
yearInput?.addEventListener("input", refreshFromInputs);
yearInput?.addEventListener("blur", commitYearField);
yearInput?.addEventListener("change", commitYearField);
serialInput?.addEventListener("input", refreshFromInputs);
toneRadios.forEach((r) => r.addEventListener("change", refreshFromInputs));

let commitResizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(commitResizeTimer);
  commitResizeTimer = setTimeout(buildCommitGrid, 180);
});

syncStateFromInputs();
buildCommitGrid();
renderPreview();
