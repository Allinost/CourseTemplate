/**
 * Studio controller. Live preview + JSON editing + HTTP export bridge.
 */

import {
  BACKGROUND_EFFECTS,
  FONT_OPTIONS,
  LAYOUTS,
  RATIOS,
  THEMES,
  appearanceStyle,
  normalizeAppearance,
  normalizeDeck,
  renderChrome,
  renderCoverOnly,
  renderDeckSlides,
} from "./render.js";
import { validateDeck } from "../../scripts/lib/validate.mjs";

const LAYOUT_NAMES = Object.fromEntries(LAYOUTS.map((layout) => [layout.id, layout.label]));
const INK = {
  editorial: "#1d1a15",
  tech: "#eaf2ff",
  consulting: "#101827",
  ink: "#f3efe6",
  custom: "#18181b",
};

const FALLBACK_DECK = {
  meta: {
    title: "HTML PPT Template",
    subtitle: "一份内容，四种画布",
    organization: "HTML PPT",
    theme: "editorial",
    slug: "html-ppt-template",
  },
  cover: {
    title: "HTML PPT Template",
    subtitle: "在浏览器中打开工作台，或导入 deck.json 开始。",
    kicker: "OPENCLAW READY",
    badge: "STUDIO FALLBACK",
  },
  slides: [
    {
      layout: "statement",
      kicker: "START HERE",
      title: "请通过 npm run dev 打开工作台",
      body: "直接双击 HTML 时浏览器会阻止读取示例 JSON。运行本地服务器后即可载入完整示例。",
    },
  ],
  closing: {
    title: "开始构建",
    body: "node scripts/openclaw.mjs render --input deck.json",
  },
};

const state = {
  deck: null,
  theme: "editorial",
  baseTheme: "editorial",
  ratio: "auto",
  api: null,
  lastExport: null,
};

const dom = {};

function cacheDom() {
  const ids = [
    "theme-list",
    "ratio-list",
    "appearance-status",
    "appearance-grid",
    "bg-effect",
    "bg-angle",
    "bg-angle-value",
    "color-bg",
    "color-bg2",
    "color-ink",
    "color-muted",
    "color-accent",
    "color-accent2",
    "font-display",
    "font-body",
    "font-mono",
    "scale-base",
    "scale-base-value",
    "scale-title",
    "scale-title-value",
    "scale-body",
    "scale-body-value",
    "scale-kicker",
    "scale-kicker-value",
    "btn-apply-appearance",
    "btn-reset-appearance",
    "slide-list",
    "slide-count",
    "ratio-status",
    "stage",
    "canvas-ratio",
    "canvas-note",
    "canvas-count",
    "btn-prev",
    "btn-next",
    "btn-demo",
    "btn-import",
    "btn-download",
    "btn-export",
    "btn-apply",
    "btn-format",
    "btn-validate",
    "btn-copy-cmd",
    "deck-json",
    "json-status",
    "json-message",
    "export-list",
    "export-status",
    "openclaw-command",
    "file-input",
    "toast",
  ];
  ids.forEach((id) => {
    dom[id] = document.getElementById(id);
  });
}

function toast(message, isError = false) {
  if (!dom.toast) return;
  dom.toast.textContent = message;
  dom.toast.classList.toggle("is-error", isError);
  dom.toast.classList.add("is-visible");
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => {
    dom.toast.classList.remove("is-visible");
  }, 2600);
}

function slugify(value, fallback = "deck") {
  const result = String(value || "")
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 48);
  return result || fallback;
}

function activeRatio() {
  if (state.ratio !== "auto") return state.ratio;
  return window.matchMedia("(orientation: portrait)").matches ? "3:5" : "16:9";
}

function themeMeta(id) {
  return THEMES.find((theme) => theme.id === id) || THEMES[0];
}

function paletteFor(id) {
  return { ...themeMeta(id).palette };
}

function populateAppearanceOptions() {
  dom["bg-effect"].innerHTML = BACKGROUND_EFFECTS.map(
    (effect) => `<option value="${effect.id}">${effect.label}</option>`,
  ).join("");
  const fontOptions = FONT_OPTIONS.map(
    (font) => `<option value="${escapeText(font.value)}">${font.label}</option>`,
  ).join("");
  for (const id of ["font-display", "font-body", "font-mono"]) {
    dom[id].innerHTML = `<option value="">跟随主题</option>${fontOptions}`;
  }
}

function colorValue(value, fallback) {
  return /^#[0-9a-f]{6}$/i.test(String(value || "")) ? value : fallback;
}

function setFontSelect(id, value) {
  const select = dom[id];
  if (value && ![...select.options].some((option) => option.value === value)) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = "自定义字体";
    select.appendChild(option);
  }
  select.value = value || "";
}

function syncAppearanceControls() {
  if (!state.deck) return;
  const appearance = normalizeAppearance(state.deck.appearance);
  const palette = paletteFor(state.baseTheme || state.theme);
  const colors = { ...palette, ...appearance.colors };
  dom["appearance-status"].textContent = state.theme === "custom" ? "custom" : "preset";
  dom["bg-effect"].value = appearance.background.type || "none";
  dom["bg-angle"].value = String(appearance.background.angle);
  dom["bg-angle-value"].textContent = `${appearance.background.angle}°`;
  const colorMap = {
    "color-bg": "bg",
    "color-bg2": "bg2",
    "color-ink": "ink",
    "color-muted": "muted",
    "color-accent": "accent",
    "color-accent2": "accent2",
  };
  for (const [id, key] of Object.entries(colorMap)) {
    dom[id].value = colorValue(colors[key], palette[key] || "#ffffff");
  }
  setFontSelect("font-display", appearance.typography.displayFont);
  setFontSelect("font-body", appearance.typography.bodyFont);
  setFontSelect("font-mono", appearance.typography.monoFont);
  const scaleMap = {
    "scale-base": "baseScale",
    "scale-title": "titleScale",
    "scale-body": "bodyScale",
    "scale-kicker": "kickerScale",
  };
  for (const [id, key] of Object.entries(scaleMap)) {
    const value = appearance.typography[key];
    dom[id].value = String(value);
    dom[`${id}-value`].textContent = Number(value).toFixed(2);
  }
}

function applyAppearance() {
  if (!state.deck) return;
  const previous = normalizeAppearance(state.deck.appearance);
  const colors = {
    ...previous.colors,
    bg: dom["color-bg"].value,
    bg2: dom["color-bg2"].value,
    ink: dom["color-ink"].value,
    muted: dom["color-muted"].value,
    accent: dom["color-accent"].value,
    accent2: dom["color-accent2"].value,
  };
  state.deck.meta = state.deck.meta && typeof state.deck.meta === "object" ? state.deck.meta : {};
  if (state.theme !== "custom") state.baseTheme = state.theme;
  state.deck.appearance = {
    colors,
    background: {
      type: dom["bg-effect"].value,
      angle: Number(dom["bg-angle"].value),
    },
    typography: {
      displayFont: dom["font-display"].value,
      bodyFont: dom["font-body"].value,
      monoFont: dom["font-mono"].value,
      baseScale: Number(dom["scale-base"].value),
      titleScale: Number(dom["scale-title"].value),
      bodyScale: Number(dom["scale-body"].value),
      kickerScale: Number(dom["scale-kicker"].value),
    },
  };
  state.deck.meta.theme = "custom";
  state.theme = "custom";
  renderThemeList();
  renderPreview();
  syncJson();
  toast("已应用自定义外观");
}

function resetAppearance() {
  if (!state.deck) return;
  delete state.deck.appearance;
  state.deck.meta = state.deck.meta && typeof state.deck.meta === "object" ? state.deck.meta : {};
  state.deck.meta.theme = state.baseTheme || "editorial";
  state.theme = state.deck.meta.theme;
  renderThemeList();
  renderPreview();
  syncJson();
  toast("已恢复预设主题");
}

function renderThemeList() {
  dom["theme-list"].innerHTML = THEMES.map((theme) => {
    const palette = theme.palette || { bg: theme.bg, ink: INK[theme.id] || "#fff", accent: theme.accent };
    return `<button class="theme-card" type="button" data-theme="${theme.id}" aria-pressed="${theme.id === state.theme}">
      <span class="theme-swatch" style="--theme-bg:${palette.bg};--theme-accent:${palette.accent};--theme-ink:${palette.ink}" aria-hidden="true"></span>
      <span class="theme-card__text">
        <span class="theme-card__name">${theme.name}</span>
        <span class="theme-card__en">${theme.en}</span>
      </span>
    </button>`;
  }).join("");
  dom["theme-list"].querySelectorAll("[data-theme]").forEach((button) => {
    button.addEventListener("click", () => {
      const theme = button.dataset.theme;
      if (!THEMES.some((item) => item.id === theme)) return;
      if (!state.deck) return;
      state.deck.meta = state.deck.meta && typeof state.deck.meta === "object" ? state.deck.meta : {};
      if (theme === "custom") {
        if (state.theme !== "custom") state.baseTheme = state.theme;
        if (!state.deck.appearance?.colors || !Object.keys(state.deck.appearance.colors).length) {
          state.deck.appearance = {
            colors: paletteFor(state.baseTheme),
            background: { type: "gradient", angle: 135 },
            typography: {},
          };
        }
      } else {
        state.baseTheme = theme;
        delete state.deck.appearance;
      }
      state.deck.meta.theme = theme;
      state.theme = theme;
      renderThemeList();
      renderPreview();
      syncJson();
    });
  });
}

function updateRatioButtons() {
  dom["ratio-list"].querySelectorAll("[data-ratio]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.ratio === state.ratio));
  });
  const meta = RATIOS[activeRatio()];
  dom["ratio-status"].textContent = state.ratio === "auto" ? `auto → ${meta.id}` : meta.id;
}

function updateSlideList(result) {
  const content = result.deck.slides.slice();
  const hasClosing = content.some((slide) => slide.layout === "closing");
  if (!hasClosing && result.deck.closing) {
    content.push({ ...result.deck.closing, layout: "closing" });
  }
  const items = [{ title: "封面", layout: "cover" }, ...content];
  dom["slide-count"].textContent = String(items.length);
  dom["slide-list"].innerHTML = items
    .map((slide, index) => {
      const title =
        slide.title ||
        slide.quote ||
        (slide.layout === "cover" ? "封面 / Cover" : LAYOUT_NAMES[slide.layout] || "内容页");
      return `<button class="slide-item${index === 0 ? " is-active" : ""}" type="button" data-slide-index="${index}">
        <span class="slide-item__num">${String(index + 1).padStart(2, "0")}</span>
        <span class="slide-item__title">${escapeText(title)}</span>
        <span class="slide-item__layout">${slide.layout}</span>
      </button>`;
    })
    .join("");
  dom["slide-list"].querySelectorAll("[data-slide-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = Number(button.dataset.slideIndex);
      if (state.api) state.api.go(target);
      highlightSlide(target);
    });
  });
}

function escapeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function highlightSlide(index) {
  dom["slide-list"].querySelectorAll("[data-slide-index]").forEach((button) => {
    button.classList.toggle("is-active", Number(button.dataset.slideIndex) === index);
  });
  if (state.api) {
    dom["canvas-count"].textContent = `${String(state.api.index + 1).padStart(2, "0")} / ${String(state.api.total).padStart(2, "0")}`;
    dom["btn-prev"].disabled = state.api.index === 0;
    dom["btn-next"].disabled = state.api.index === state.api.total - 1;
  }
}

function renderPreview() {
  if (!state.deck) return;
  const ratio = activeRatio();
  const meta = RATIOS[ratio];
  const isCover = meta.kind === "cover";
  const oldIndex = state.api ? state.api.index : 0;
  state.theme = normalizeDeck(state.deck).meta.theme;

  if (state.api) {
    state.api.destroy();
    state.api = null;
  }

  const result = isCover ? renderCoverOnly(state.deck, ratio) : renderDeckSlides(state.deck, ratio);
  const styleAttribute = result.style ? ` style="${escapeText(result.style)}"` : "";
  const backgroundAttribute = result.bgEffect ? ` data-bg-effect="${escapeText(result.bgEffect)}"` : "";
  dom.stage.innerHTML = `<div class="deck deck--studio" data-deck data-ratio="${ratio}" data-theme="${state.theme}" data-kind="${meta.kind}" data-deck-auto="false"${styleAttribute}${backgroundAttribute}>
    <div class="deck__stage">
      ${result.slides.join("\n")}
    </div>
    ${isCover ? "" : renderChrome(result.deck, result.total)}
  </div>`;

  const deckElement = dom.stage.querySelector(".deck");
  state.api = window.HTMLPPT.mount(deckElement, { studio: true });
  const target = Math.min(oldIndex, result.total - 1);
  if (target > 0 && state.api) state.api.go(target);

  dom["canvas-ratio"].textContent = `${meta.id} · ${meta.kind === "cover" ? "COVER" : "CONTENT"}`;
  dom["canvas-note"].textContent = `${meta.label} · ${meta.width} × ${meta.height}`;
  updateSlideList(result);
  updateRatioButtons();
  if (state.api) {
    deckElement.addEventListener("slidechange", (event) => {
      highlightSlide(event.detail.index);
    });
    highlightSlide(state.api.index);
  }
  if (isCover) {
    dom["canvas-count"].textContent = "01 / 01";
    dom["btn-prev"].disabled = true;
    dom["btn-next"].disabled = true;
  }
  syncAppearanceControls();
}

function syncJson() {
  if (!state.deck) return;
  dom["deck-json"].value = JSON.stringify(state.deck, null, 2);
  dom["json-status"].textContent = "synced";
  const slug = slugify(state.deck.meta?.slug || state.deck.meta?.title || "deck");
  dom["openclaw-command"].textContent = `node scripts/openclaw.mjs render --input deck.json --out exports/${slug} --formats all`;
}

function showStatus(message, type = "info") {
  dom["json-message"].textContent = message;
  dom["json-message"].className = `status${type === "ok" ? " status--ok" : type === "error" ? " status--error" : ""}`;
}

function applyDeck(deck, options = {}) {
  const validation = validateDeck(deck);
  if (!validation.ok) {
    showStatus(
      validation.errors.map((item) => `${item.path}: ${item.message}`).join("\n"),
      "error",
    );
    return false;
  }
  state.deck = deck;
  state.theme = normalizeDeck(deck).meta.theme;
  if (state.theme !== "custom") state.baseTheme = state.theme;
  renderThemeList();
  renderPreview();
  if (options.syncJson !== false) syncJson();
  const warningText = validation.warnings.length ? ` · ${validation.warnings.length} 条提醒` : "";
  showStatus(`OK · ${validation.stats.totalSlides} 页${warningText}`, "ok");
  return true;
}

function parseEditor() {
  try {
    return JSON.parse(dom["deck-json"].value);
  } catch (error) {
    showStatus(`JSON 解析失败：${error.message}`, "error");
    return null;
  }
}

async function loadDemo() {
  try {
    const response = await fetch("../examples/demo.deck.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const deck = await response.json();
    applyDeck(deck);
    toast("已载入示例内容");
  } catch (error) {
    applyDeck(FALLBACK_DECK);
    showStatus(`示例载入失败（${error.message}），已使用内置最小示例。请用 npm run dev 打开工作台。`, "error");
  }
}

function downloadJson() {
  if (!state.deck) return;
  const blob = new Blob([JSON.stringify(state.deck, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${slugify(state.deck.meta?.slug || state.deck.meta?.title || "deck")}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  toast("deck.json 已下载");
}

function renderExportList(result) {
  const files = result.files || [];
  dom["export-status"].textContent = `${files.length} files`;
  dom["export-list"].innerHTML = files
    .map(
      (file) => `<a class="export-link" href="${escapeText(file.url)}" target="_blank" rel="noopener">
        <span>${escapeText(file.ratio)} · ${escapeText(file.label)}</span>
        <span>${file.width}×${file.height}</span>
      </a>`,
    )
    .join("");
  const warningText = result.warnings?.length ? ` · ${result.warnings.length} 条提醒` : "";
  showStatus(`导出完成 · ${result.outDir || "exports"}${warningText}`, "ok");
}

async function exportDeck() {
  if (!state.deck) return;
  const button = dom["btn-export"];
  const original = button.innerHTML;
  button.disabled = true;
  button.textContent = "正在生成…";
  try {
    const response = await fetch("/api/build", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deck: state.deck, theme: state.theme, formats: "all" }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || payload.errors?.map((item) => `${item.path}: ${item.message}`).join("; ") || `HTTP ${response.status}`);
    }
    state.lastExport = payload;
    renderExportList(payload);
    toast("四种格式已生成到 exports/");
  } catch (error) {
    showStatus(`导出失败：${error.message}。请确认已运行 npm run dev。`, "error");
    toast("导出失败，请检查本地服务", true);
  } finally {
    button.disabled = false;
    button.innerHTML = original;
  }
}

async function validateEditor() {
  const deck = parseEditor();
  if (!deck) return;
  const result = validateDeck(deck);
  dom["json-status"].textContent = result.ok ? "valid" : "invalid";
  if (result.ok) {
    const warnings = result.warnings.map((item) => `${item.path}: ${item.message}`).join("\n");
    showStatus(`校验通过 · ${result.stats.totalSlides} 页${warnings ? `\n${warnings}` : ""}`, "ok");
  } else {
    showStatus(result.errors.map((item) => `${item.path}: ${item.message}`).join("\n"), "error");
  }
}

function formatEditor() {
  const deck = parseEditor();
  if (!deck) return;
  dom["deck-json"].value = JSON.stringify(deck, null, 2);
  dom["json-status"].textContent = "formatted";
  showStatus("JSON 已格式化", "ok");
}

async function copyCommand() {
  const text = dom["openclaw-command"].textContent;
  try {
    await navigator.clipboard.writeText(text);
    toast("命令已复制");
  } catch (_error) {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    toast("命令已复制");
  }
}

function bindEvents() {
  dom["ratio-list"].querySelectorAll("[data-ratio]").forEach((button) => {
    button.addEventListener("click", () => {
      state.ratio = button.dataset.ratio;
      renderPreview();
      updateRatioButtons();
    });
  });

  dom["btn-prev"].addEventListener("click", () => state.api && state.api.prev());
  dom["btn-next"].addEventListener("click", () => state.api && state.api.next());
  dom["btn-demo"].addEventListener("click", loadDemo);
  dom["btn-download"].addEventListener("click", downloadJson);
  dom["btn-apply-appearance"].addEventListener("click", applyAppearance);
  dom["btn-reset-appearance"].addEventListener("click", resetAppearance);
  dom["btn-export"].addEventListener("click", exportDeck);
  dom["btn-copy-cmd"].addEventListener("click", copyCommand);

  dom["btn-import"].addEventListener("click", () => dom["file-input"].click());
  dom["file-input"].addEventListener("change", async () => {
    const file = dom["file-input"].files?.[0];
    if (!file) return;
    try {
      const deck = JSON.parse(await file.text());
      if (applyDeck(deck)) toast(`已导入 ${file.name}`);
    } catch (error) {
      showStatus(`导入失败：${error.message}`, "error");
    }
    dom["file-input"].value = "";
  });

  dom["btn-apply"].addEventListener("click", () => {
    const deck = parseEditor();
    if (deck && applyDeck(deck, { syncJson: false })) toast("已应用并预览");
  });
  dom["btn-format"].addEventListener("click", formatEditor);
  dom["btn-validate"].addEventListener("click", validateEditor);
  dom["deck-json"].addEventListener("input", () => {
    dom["json-status"].textContent = "dirty";
  });

  const rangeOutputs = {
    "bg-angle": "bg-angle-value",
    "scale-base": "scale-base-value",
    "scale-title": "scale-title-value",
    "scale-body": "scale-body-value",
    "scale-kicker": "scale-kicker-value",
  };
  for (const [inputId, outputId] of Object.entries(rangeOutputs)) {
    const input = dom[inputId];
    const output = dom[outputId];
    input.addEventListener("input", () => {
      output.textContent = inputId === "bg-angle" ? `${input.value}°` : Number(input.value).toFixed(2);
    });
  }

  window.matchMedia("(orientation: portrait)").addEventListener("change", () => {
    if (state.ratio === "auto") {
      renderPreview();
      updateRatioButtons();
    }
  });
}

async function init() {
  cacheDom();
  populateAppearanceOptions();
  renderThemeList();
  bindEvents();
  updateRatioButtons();
  await loadDemo();
}

init().catch((error) => {
  const message = document.getElementById("json-message");
  if (message) {
    message.className = "status status--error";
    message.textContent = `工作台初始化失败：${error.message}`;
  }
});
