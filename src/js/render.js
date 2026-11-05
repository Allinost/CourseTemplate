/**
 * Pure, environment-agnostic renderer.
 *
 * Used by:
 *  - scripts/lib/document.mjs (Node, standalone HTML export)
 *  - src/js/studio.js (browser, live preview)
 *
 * It never touches the DOM. All user content is escaped before interpolation.
 */

export const VERSION = "1.1.0";

export const THEMES = [
  {
    id: "editorial",
    name: "纸感杂志",
    en: "Editorial",
    description: "暖纸底色、衬线大标题、陶土红与墨绿。适合课程、文化、品牌叙事。",
    accent: "#d4532d",
    bg: "#f2ecdf",
    palette: { bg: "#f2ecdf", bg2: "#e7dcc8", ink: "#1d1a15", muted: "#6d6457", accent: "#d4532d", accent2: "#255c4b" },
  },
  {
    id: "academic",
    name: "学术讲义",
    en: "Academic",
    description: "冷纸底、深海军蓝、酒红索引、衬线标题与双线框。适合论文汇报、课程讲义、研究综述。",
    accent: "#1f4e79",
    bg: "#f6f3ea",
    palette: { bg: "#f6f3ea", bg2: "#e7e0d1", ink: "#172033", muted: "#5f6b7c", accent: "#1f4e79", accent2: "#7a2e3b" },
  },
  {
    id: "tech",
    name: "深空极客",
    en: "Tech",
    description: "深空蓝、青色辉光、网格与扫描线。适合技术分享、产品发布、B 站科普。",
    accent: "#5eead4",
    bg: "#070d17",
    palette: { bg: "#070d17", bg2: "#040811", ink: "#eaf2ff", muted: "#8ca1bb", accent: "#5eead4", accent2: "#a3e635" },
  },
  {
    id: "software",
    name: "开发文档",
    en: "Software",
    description: "冷灰蓝底、IDE 窗口、等宽标题、蓝紫强调。适合开发者大会、API 文档、产品技术方案。",
    accent: "#2563eb",
    bg: "#eef2f8",
    palette: { bg: "#eef2f8", bg2: "#dbe3ef", ink: "#0b1220", muted: "#52617a", accent: "#2563eb", accent2: "#7c3aed" },
  },
  {
    id: "consulting",
    name: "咨询报告",
    en: "Consulting",
    description: "冷白底、结构线、蓝色主色与琥珀强调。适合研究报告、商业提案、数据复盘。",
    accent: "#1d4ed8",
    bg: "#f7f8fa",
    palette: { bg: "#f7f8fa", bg2: "#e8edf4", ink: "#101827", muted: "#64748b", accent: "#1d4ed8", accent2: "#f59e0b" },
  },
  {
    id: "ink",
    name: "黑白宣言",
    en: "Ink",
    description: "高对比黑底、巨型描边字、朱红强调。适合观点输出、发布会、极简演讲。",
    accent: "#ff4d2e",
    bg: "#121110",
    palette: { bg: "#121110", bg2: "#090808", ink: "#f3efe6", muted: "#a29b8e", accent: "#ff4d2e", accent2: "#d8c9a7" },
  },
  {
    id: "custom",
    name: "自定义",
    en: "Custom",
    description: "从任意配色、背景效果与字体组合开始，适合品牌 VI 与商业项目。",
    accent: "#2563eb",
    bg: "#f4f4f5",
    palette: { bg: "#f4f4f5", bg2: "#e4e4e7", ink: "#18181b", muted: "#52525b", accent: "#2563eb", accent2: "#f59e0b" },
  },
];

export const BACKGROUND_EFFECTS = [
  { id: "none", label: "纯色" },
  { id: "gradient", label: "渐变" },
  { id: "mesh", label: "柔光" },
  { id: "grid", label: "网格" },
  { id: "dots", label: "点阵" },
  { id: "glass", label: "磨砂玻璃" },
];

export const FONT_OPTIONS = [
  { id: "sans", label: "无衬线 / Noto Sans SC", value: '"Inter", "Noto Sans SC", "Source Han Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif' },
  { id: "serif", label: "衬线 / Noto Serif SC", value: '"Noto Serif SC", "Source Han Serif SC", "LXGW WenKai", "Songti SC", "STSong", serif' },
  { id: "source-sans", label: "思源黑体 / Source Han Sans SC", value: '"Source Han Sans SC", "Noto Sans SC", "PingFang SC", sans-serif' },
  { id: "source-serif", label: "思源宋体 / Source Han Serif SC", value: '"Source Han Serif SC", "Noto Serif SC", "Songti SC", serif' },
  { id: "inter", label: "Inter / 西文", value: '"Inter", "Segoe UI", sans-serif' },
  { id: "mono", label: "等宽 / JetBrains Mono", value: '"JetBrains Mono", "Cascadia Code", "Consolas", monospace' },
  { id: "wenkai", label: "霞鹜文楷 / LXGW WenKai", value: '"LXGW WenKai", "KaiTi", "STKaiti", serif' },
];

export const RATIOS = {
  "16:9": {
    id: "16:9",
    label: "横版内容",
    short: "16:9",
    width: 1600,
    height: 900,
    orientation: "landscape",
    kind: "content",
    ar: 1.777778,
  },
  "4:3": {
    id: "4:3",
    label: "横版封面",
    short: "4:3",
    width: 1200,
    height: 900,
    orientation: "landscape",
    kind: "cover",
    ar: 1.333333,
  },
  "3:4": {
    id: "3:4",
    label: "竖版封面",
    short: "3:4",
    width: 900,
    height: 1200,
    orientation: "portrait",
    kind: "cover",
    ar: 0.75,
  },
  "3:5": {
    id: "3:5",
    label: "竖版内容",
    short: "3:5",
    width: 900,
    height: 1500,
    orientation: "portrait",
    kind: "content",
    ar: 0.6,
  },
};

export const LAYOUTS = [
  { id: "statement", label: "观点页", description: "一句主张 + 一段解释，适合开场立论。" },
  { id: "agenda", label: "议程页", description: "2-8 个章节，横版双栏、竖版单栏。" },
  { id: "bullets", label: "要点页", description: "左侧标题、右侧编号列表，适合方法论拆解。" },
  { id: "split", label: "图文页", description: "左文右图或左图右文，支持抽象视觉与真实图片。" },
  { id: "stats", label: "数据页", description: "2-4 组关键数字，自动数字滚动。" },
  { id: "timeline", label: "时间线", description: "3-6 个阶段，横版横向、竖版纵向。" },
  { id: "compare", label: "对比页", description: "2-3 张对照卡片，支持强调/弱化语气。" },
  { id: "quote", label: "引用页", description: "大字引文 + 出处，适合章节转折。" },
  { id: "section", label: "章节页", description: "巨型序号 + 章节标题，做内容分区。" },
  { id: "code", label: "代码页", description: "带终端窗口的代码/配置展示，适合技术内容。" },
  { id: "table", label: "表格页", description: "结构化信息对照，自动适配字号。" },
  { id: "image", label: "全图页", description: "全出血图片 + 标题叠层，适合视觉叙事。" },
  { id: "closing", label: "结尾页", description: "收束观点、联系方式、二维码。" },
];

const ENTRANCES = {
  rise: "animRise",
  blur: "animBlur",
  clip: "animClip",
  scale: "animScale",
  left: "animLeft",
  right: "animRight",
};

const VISUALS = new Set(["grid", "orbit", "bars", "rings", "type"]);

const LAYOUT_IDS = new Set(LAYOUTS.map((item) => item.id));
const THEME_IDS = new Set(THEMES.map((item) => item.id));
const BG_IDS = new Set(BACKGROUND_EFFECTS.map((item) => item.id));
const COLOR_KEYS = ["bg", "bg2", "ink", "muted", "accent", "accent2", "panel", "panelStrong", "line", "lineStrong", "faint", "titleColor", "bodyColor"];
const TYPO_KEYS = ["displayFont", "bodyFont", "monoFont", "baseScale", "titleScale", "bodyScale", "kickerScale"];

function safeColor(value) {
  const color = String(value ?? "").trim();
  if (/^#[0-9a-f]{3,8}$/i.test(color)) return color;
  if (/^(rgb|rgba|hsl|hsla)\(\s*[\d.,%\s/+-]+\)$/i.test(color)) return color;
  return "";
}

function safeFont(value) {
  const font = String(value ?? "").trim();
  if (!font || font.length > 160) return "";
  if (/[;{}<>]/.test(font)) return "";
  if (!/^[\w\s,'"\-.\u4e00-\u9fa5]+$/u.test(font)) return "";
  return font;
}

function clampNumber(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function contrastInk(value) {
  const color = safeColor(value);
  if (!/^#[0-9a-f]{6}$/i.test(color)) return "";
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#111827" : "#ffffff";
}

export function normalizeAppearance(input = {}) {
  const source = input && typeof input === "object" ? input : {};
  const colorInput = source.colors && typeof source.colors === "object" ? source.colors : {};
  const colors = {};
  for (const key of COLOR_KEYS) {
    const value = safeColor(colorInput[key] ?? source[key]);
    if (value) colors[key] = value;
  }
  if (colors.accent && !colors.accentInk) colors.accentInk = contrastInk(colors.accent);
  if (colors.accent2 && !colors.accent2Ink) colors.accent2Ink = contrastInk(colors.accent2);

  const bgInput = source.background && typeof source.background === "object" ? source.background : {};
  const background = {
    type: BG_IDS.has(bgInput.type) ? bgInput.type : "",
    angle: clampNumber(bgInput.angle, 135, 0, 360),
  };

  const typeInput = source.typography && typeof source.typography === "object" ? source.typography : {};
  const typography = {
    displayFont: safeFont(typeInput.displayFont),
    bodyFont: safeFont(typeInput.bodyFont),
    monoFont: safeFont(typeInput.monoFont),
    baseScale: clampNumber(typeInput.baseScale, 1, 0.7, 1.8),
    titleScale: clampNumber(typeInput.titleScale, 1, 0.7, 1.6),
    bodyScale: clampNumber(typeInput.bodyScale, 1, 0.7, 1.8),
    kickerScale: clampNumber(typeInput.kickerScale, 1, 0.7, 1.8),
  };

  return { colors, background, typography };
}

export function appearanceStyle(input = {}) {
  const appearance = normalizeAppearance(input);
  const declarations = [];
  const colorMap = {
    bg: "--bg",
    bg2: "--bg-2",
    ink: "--ink",
    muted: "--muted",
    accent: "--accent",
    accent2: "--accent-2",
    panel: "--panel",
    panelStrong: "--panel-strong",
    line: "--line",
    lineStrong: "--line-strong",
    faint: "--faint",
    titleColor: "--title-color",
    bodyColor: "--body-color",
    accentInk: "--accent-ink",
    accent2Ink: "--accent-2-ink",
  };
  for (const [key, variable] of Object.entries(colorMap)) {
    if (appearance.colors[key]) declarations.push(`${variable}:${appearance.colors[key]}`);
  }
  if (appearance.colors.ink) {
    if (!appearance.colors.line) declarations.push("--line:color-mix(in srgb, var(--ink) 15%, transparent)");
    if (!appearance.colors.lineStrong) declarations.push("--line-strong:color-mix(in srgb, var(--ink) 30%, transparent)");
    if (!appearance.colors.panel) declarations.push("--panel:color-mix(in srgb, var(--ink) 5%, transparent)");
    if (!appearance.colors.panelStrong) declarations.push("--panel-strong:color-mix(in srgb, var(--ink) 9%, transparent)");
    declarations.push("--chip:color-mix(in srgb, var(--ink) 7%, transparent)");
    declarations.push("--faint:color-mix(in srgb, var(--ink) 48%, transparent)");
    declarations.push("--ink-soft:color-mix(in srgb, var(--ink) 88%, var(--bg))");
  }
  if (appearance.colors.bg && !appearance.colors.bg2) declarations.push("--bg-2:var(--bg)");
  if (appearance.background.type) declarations.push(`--bg-angle:${appearance.background.angle}deg`);
  if (appearance.typography.displayFont) declarations.push(`--display:${appearance.typography.displayFont}`);
  if (appearance.typography.bodyFont) declarations.push(`--body:${appearance.typography.bodyFont}`);
  if (appearance.typography.monoFont) declarations.push(`--mono:${appearance.typography.monoFont}`);
  if (appearance.typography.baseScale !== 1) declarations.push(`--type-scale:${appearance.typography.baseScale}`);
  if (appearance.typography.titleScale !== 1) declarations.push(`--title-scale:${appearance.typography.titleScale}`);
  if (appearance.typography.bodyScale !== 1) declarations.push(`--body-scale:${appearance.typography.bodyScale}`);
  if (appearance.typography.kickerScale !== 1) declarations.push(`--kicker-scale:${appearance.typography.kickerScale}`);
  return declarations.join(";");
}

export function backgroundEffect(input = {}) {
  return normalizeAppearance(input).background.type;
}

/* --------------------------------------------------------------------------
   Text helpers
   -------------------------------------------------------------------------- */

export function escapeHtml(value) {
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

export function inline(value) {
  let text = escapeHtml(value);
  text = text.replace(/`([^`\n]+)`/g, "<code>$1</code>");
  text = text.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
  text = text.replace(
    /\[([^\]\n]+)\]\((https?:\/\/[^)\s]+|mailto:[^)\s]+|\/[^)\s]*)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  return text.replace(/\n/g, "<br>");
}

function attr(value) {
  return escapeHtml(value);
}

function text(value, fallback = "") {
  const resolved = value === undefined || value === null || value === "" ? fallback : value;
  return escapeHtml(resolved);
}

function safeUrl(value) {
  const url = String(value ?? "").trim();
  if (!url) return "";
  if (/^(https?:|mailto:|\/|\.\/|\.\.\/|data:image\/)/i.test(url)) return url;
  return "";
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function num(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asArray(value) {
  return Array.isArray(value) ? value.filter((item) => item !== null && item !== undefined) : [];
}

// Returns the tail of a class attribute plus an inline custom property.
// Call sites close the attribute themselves: class="thing ${anim(1)}"
function anim(index, extra = "") {
  return `anim${extra ? ` ${extra}` : ""}" style="--i:${Math.max(0, Math.floor(num(index)))}`;
}

function amount(value, fallback) {
  return Math.max(0, Math.floor(num(value, fallback)));
}

/* --------------------------------------------------------------------------
   Normalisation
   -------------------------------------------------------------------------- */

export function normalizeDeck(input = {}) {
  const source = input && typeof input === "object" ? input : {};
  const metaInput = source.meta && typeof source.meta === "object" ? source.meta : {};
  const theme = THEME_IDS.has(metaInput.theme) ? metaInput.theme : THEME_IDS.has(source.theme) ? source.theme : "editorial";

  const meta = {
    title: metaInput.title || source.title || "未命名演示",
    subtitle: metaInput.subtitle || source.subtitle || "",
    author: metaInput.author || "",
    organization: metaInput.organization || "",
    date: metaInput.date || "",
    kicker: metaInput.kicker || "HTML PPT TEMPLATE",
    footer: metaInput.footer || "",
    language: metaInput.language || "zh-CN",
    theme,
    slug: metaInput.slug || source.slug || "",
    mark: metaInput.mark || "01",
  };

  const coverInput = source.cover && typeof source.cover === "object" ? source.cover : {};
  const cover = {
    title: coverInput.title || meta.title,
    subtitle: coverInput.subtitle || meta.subtitle,
    kicker: coverInput.kicker || meta.kicker,
    badge: coverInput.badge || "HTML DECK",
    note: coverInput.note || meta.footer || "",
    date: coverInput.date || meta.date,
    meta: asArray(coverInput.meta).length
      ? asArray(coverInput.meta).map(String)
      : [meta.author, meta.organization, meta.date].filter(Boolean),
    background: coverInput.background || "",
  };

  const slides = asArray(source.slides)
    .filter((slide) => slide && typeof slide === "object" && slide.layout !== "cover")
    .map((slide, index) => ({
      ...slide,
      id: String(slide.id || `slide-${index + 1}`),
      layout: LAYOUT_IDS.has(slide.layout) ? slide.layout : "bullets",
      entrance: ENTRANCES[slide.entrance] ? slide.entrance : "rise",
    }));

  const closingInput = source.closing && typeof source.closing === "object" ? source.closing : null;
  const appearance = normalizeAppearance(source.appearance ?? metaInput.appearance ?? {});

  return {
    schemaVersion: source.schemaVersion || "1.0",
    meta,
    cover,
    slides,
    closing: closingInput,
    appearance,
  };
}

export function resolveRatio(value) {
  return RATIOS[value] || RATIOS["16:9"];
}

/* --------------------------------------------------------------------------
   Shared fragments
   -------------------------------------------------------------------------- */

function renderKicker(value, options = {}) {
  if (!value) return "";
  return `<p class="kicker${options.plain ? " kicker--plain" : ""} ${anim(options.animIndex ?? 0)}"><span class="kicker__dot" aria-hidden="true"></span>${inline(value)}</p>`;
}

function renderFoot(deck, index, total) {
  const label = deck.meta.footer || [deck.meta.organization, deck.meta.title].filter(Boolean).join(" · ");
  return `<footer class="slide__foot">
    <span class="slide__foot-title">${text(label, deck.meta.title)}</span>
    <span class="slide__foot-page"><b>${pad(index + 1)}</b> / ${pad(total)}</span>
  </footer>`;
}

function renderCoverArt(theme, mark) {
  const safeMark = escapeHtml(mark || "01");
  switch (theme) {
    case "academic":
      return `<span class="art-sheet" aria-hidden="true"></span>
        <span class="art-margin" aria-hidden="true"></span>
        <span class="art-tab" aria-hidden="true"></span>
        <span class="art-word" aria-hidden="true">${safeMark}</span>`;
    case "software":
      return `<span class="art-window" aria-hidden="true"></span>
        <span class="art-brackets" aria-hidden="true">{ }</span>
        <span class="art-tab" aria-hidden="true"></span>`;
    case "tech":
      return `<span class="art-grid" aria-hidden="true"></span>
        <span class="art-orb" aria-hidden="true"></span>
        <span class="art-scan" aria-hidden="true"></span>
        <span class="art-code" aria-hidden="true">&lt;/&gt;</span>`;
    case "consulting":
      return `<span class="art-ring" aria-hidden="true"></span>
        <span class="art-label" aria-hidden="true">Q4 / ${new Date().getFullYear()}</span>
        <span class="art-bars" aria-hidden="true">
          <i style="--h:26%"></i><i style="--h:42%"></i><i style="--h:34%"></i>
          <i style="--h:61%"></i><i style="--h:52%"></i><i style="--h:84%"></i>
          <i style="--h:72%"></i><i style="--h:100%"></i>
        </span>`;
    case "ink":
      return `<span class="art-disc" aria-hidden="true"></span>
        <span class="art-rule" aria-hidden="true"></span>
        <span class="art-outline" aria-hidden="true">${safeMark}</span>`;
    default:
      return `<span class="art-sun" aria-hidden="true"></span>
        <span class="art-ring" aria-hidden="true"></span>
        <span class="art-rule" aria-hidden="true"></span>
        <span class="art-word" aria-hidden="true">${safeMark}</span>`;
  }
}

function renderCoverSlide(deck, ratio, total) {
  const cover = deck.cover;
  const ratioMeta = resolveRatio(ratio);
  const metaChips = cover.meta
    .map((item, index) => `<span class="chip${index === 0 ? " chip--accent" : ""}">${inline(item)}</span>`)
    .join("");

  const inner = `<div class="cover">
    <div class="cover__mast ${anim(0)}">
      <span class="cover__org">${text(deck.meta.organization, "HTML PPT")}</span>
      <span class="cover__badge">${text(cover.badge, "HTML DECK")}</span>
    </div>

    <div class="cover__body">
      ${cover.kicker ? `<p class="cover__kicker ${anim(0)}">${inline(cover.kicker)}</p>` : ""}
      <h1 class="cover__title ${anim(1)}">${inline(cover.title)}</h1>
      ${cover.subtitle ? `<p class="cover__subtitle ${anim(2)}">${inline(cover.subtitle)}</p>` : ""}
      ${metaChips ? `<div class="cover__meta ${anim(3)}">${metaChips}</div>` : ""}
    </div>

    <div class="cover__art ${anim(1, "anim--scale")}" aria-hidden="true">
      ${renderCoverArt(deck.meta.theme, deck.meta.mark)}
    </div>

    <span class="cover__mark" aria-hidden="true">${escapeHtml(deck.meta.mark || "01")}</span>

    <div class="cover__foot ${anim(4)}">
      <p class="cover__note">${inline(cover.note || deck.meta.footer || deck.meta.title)}</p>
      <span class="cover__date">${text(cover.date, deck.meta.date)}</span>
    </div>
  </div>`;

  return `<section class="slide slide--cover" data-ratio="${ratioMeta.id}" data-orientation="${ratioMeta.orientation}" data-layout="cover" data-index="0" data-entrance="rise" aria-roledescription="slide" aria-label="封面 1 / ${total}">
    <div class="slide__bg" aria-hidden="true"></div>
    <div class="slide__inner">${inner}</div>
  </section>`;
}

/* --------------------------------------------------------------------------
   Layouts
   -------------------------------------------------------------------------- */

function renderStatement(slide, ctx) {
  return `<div class="l-statement">
    <div class="statement__main">
      ${renderKicker(slide.kicker, { animIndex: 0 })}
      <h2 class="statement__title ${anim(1)}">${inline(slide.title)}</h2>
      ${slide.body ? `<p class="lead statement__lead ${anim(2)}">${inline(slide.body)}</p>` : ""}
    </div>
    <span class="statement__stamp ${anim(0, "anim--scale")}" aria-hidden="true">${pad(ctx.page)}</span>
  </div>`;
}

function renderAgenda(slide, ctx) {
  const items = asArray(slide.items);
  return `<div class="l-agenda">
    <div class="agenda__intro">
      ${renderKicker(slide.kicker, { animIndex: 0 })}
      <h2 class="${anim(1)}">${inline(slide.title)}</h2>
      ${slide.body ? `<p class="lead ${anim(2)}">${inline(slide.body)}</p>` : ""}
    </div>
    <ol class="agenda__list">
      ${items
        .map(
          (item, index) => `<li class="agenda__item ${anim(index + 1)}" data-index="${pad(index + 1)}">
            <span class="agenda__num">${pad(index + 1)}</span>
            <div>
              <h3 class="agenda__title">${inline(item.title || item.label || "")}</h3>
              ${item.text ? `<p class="agenda__text">${inline(item.text)}</p>` : ""}
            </div>
          </li>`,
        )
        .join("")}
    </ol>
  </div>`;
}

function renderBullets(slide, ctx) {
  const items = asArray(slide.items);
  const aside = slide.aside && typeof slide.aside === "object" ? slide.aside : null;
  return `<div class="l-bullets">
    <div class="bullets__aside">
      ${renderKicker(slide.kicker, { animIndex: 0 })}
      <h2 class="${anim(1)}">${inline(slide.title)}</h2>
      ${slide.body ? `<p class="lead ${anim(2)}">${inline(slide.body)}</p>` : ""}
      <div class="bullets__aside-meta ${anim(3)}">
        <strong>${text(aside?.value ?? pad(items.length))}</strong>
        <span>${text(aside?.label ?? "key moves")}</span>
      </div>
    </div>
    <ul class="bullet-list">
      ${items
        .map(
          (item, index) => `<li class="${anim(index + 1)}" data-index="${pad(index + 1)}">
            <span class="bullet__num">${pad(index + 1)}</span>
            <div class="bullet__content">
              <h3>${inline(item.title || item.label || "")}</h3>
              ${item.text ? `<p>${inline(item.text)}</p>` : ""}
              ${item.tag ? `<span class="bullet__tag">${inline(item.tag)}</span>` : ""}
            </div>
          </li>`,
        )
        .join("")}
    </ul>
  </div>`;
}

function renderVisual(media = {}) {
  const kind = VISUALS.has(media.type) ? media.type : "grid";
  let inner = "";
  if (kind === "orbit") inner = `<span class="visual__core" aria-hidden="true"></span>`;
  if (kind === "bars") {
    const values = [34, 56, 43, 72, 61, 88];
    inner = values.map((value) => `<i style="--h:${value}%"></i>`).join("");
  }
  if (kind === "type") inner = `<span aria-hidden="true">${escapeHtml(media.text || "Aa")}</span>`;
  return `<div class="visual visual--${kind}" aria-hidden="true">${inner}</div>`;
}

function renderMedia(media = {}) {
  const src = safeUrl(media.src);
  const caption = media.caption ? `<figcaption class="visual__caption">${inline(media.caption)}</figcaption>` : "";
  if (src) {
    return `<figure class="split__media ${media.caption ? "has-caption" : ""}">
      <img src="${attr(src)}" alt="${attr(media.alt || "")}" loading="lazy" decoding="async">
      ${caption}
    </figure>`;
  }
  return `<figure class="split__media">
    ${renderVisual(media)}
    ${caption}
  </figure>`;
}

function renderSplit(slide) {
  const media = slide.media && typeof slide.media === "object" ? slide.media : {};
  const reverse = slide.reverse === true;
  return `<div class="l-split${reverse ? " l-split--reverse" : ""}">
    <div class="split__text">
      ${renderKicker(slide.kicker, { animIndex: 0 })}
      <h2 class="${anim(1)}">${inline(slide.title)}</h2>
      ${slide.body ? `<p class="lead ${anim(2)}">${inline(slide.body)}</p>` : ""}
      ${asArray(slide.bullets).length
        ? `<ul class="split__points ${anim(3)}">${asArray(slide.bullets)
            .map((item) => `<li>${inline(item)}</li>`)
            .join("")}</ul>`
        : ""}
    </div>
    <div class="split__media-wrap ${anim(2, "anim--scale")}">${renderMedia(media)}</div>
  </div>`;
}

function renderStatValue(item) {
  const raw = item.value ?? "";
  const prefix = String(item.prefix ?? "");
  const suffix = String(item.suffix ?? (typeof raw === "string" ? raw.replace(/^[\d.,+\-\s]+/, "") : ""));
  const numeric = typeof raw === "number" ? raw : Number(String(raw).replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(numeric)) {
    return `<span class="stat__value">${text(raw)}</span>`;
  }
  const decimals = Number.isInteger(item.decimals)
    ? Math.max(0, item.decimals)
    : Math.max(0, (String(raw).split(".")[1] || "").replace(/\D/g, "").length);
  const final = `${prefix}${numeric.toFixed(decimals)}${suffix}`;
  return `<span class="stat__value" data-count-to="${numeric}" data-prefix="${attr(prefix)}" data-suffix="${attr(suffix)}" data-decimals="${decimals}">${text(final)}</span>`;
}

function renderStats(slide) {
  const items = asArray(slide.items);
  return `<div class="l-stats">
    <div class="stats__head">
      <div>
        ${renderKicker(slide.kicker, { animIndex: 0 })}
        <h2 class="${anim(1)}">${inline(slide.title)}</h2>
      </div>
      ${slide.body ? `<p class="lead ${anim(2)}">${inline(slide.body)}</p>` : ""}
    </div>
    <div class="stats" style="--count:${Math.max(1, items.length)}">
      ${items
        .map(
          (item, index) => `<div class="stat ${index === 0 ? "stat--accent" : ""} ${anim(index + 1)}">
            ${renderStatValue(item)}
            <div>
              <p class="stat__label">${inline(item.label || "")}</p>
              ${item.note ? `<p class="stat__note">${inline(item.note)}</p>` : ""}
            </div>
          </div>`,
        )
        .join("")}
    </div>
    ${slide.source ? `<p class="stats__source">${inline(slide.source)}</p>` : ""}
  </div>`;
}

function renderTimeline(slide) {
  const items = asArray(slide.items);
  return `<div class="l-timeline">
    <div class="timeline__head">
      <div>
        ${renderKicker(slide.kicker, { animIndex: 0 })}
        <h2 class="${anim(1)}">${inline(slide.title)}</h2>
      </div>
      ${slide.body ? `<p class="lead ${anim(2)}">${inline(slide.body)}</p>` : ""}
    </div>
    <div class="timeline" style="--count:${Math.max(1, items.length)}">
      ${items
        .map(
          (item, index) => `<div class="timeline__item ${anim(index + 1)}">
            <span class="timeline__dot" aria-hidden="true"></span>
            ${item.date ? `<span class="timeline__date">${inline(item.date)}</span>` : ""}
            <h3 class="timeline__title">${inline(item.title || "")}</h3>
            ${item.text ? `<p class="timeline__text">${inline(item.text)}</p>` : ""}
            <span class="timeline__index" aria-hidden="true">${pad(index + 1)}</span>
          </div>`,
        )
        .join("")}
    </div>
  </div>`;
}

function renderCompare(slide) {
  const items = asArray(slide.items);
  return `<div class="l-compare">
    ${renderKicker(slide.kicker, { animIndex: 0 })}
    <h2 class="${anim(1)}">${inline(slide.title)}</h2>
    ${slide.body ? `<p class="lead ${anim(2)}">${inline(slide.body)}</p>` : ""}
    <div class="compare" style="--count:${Math.max(1, items.length)}">
      ${items
        .map((item, index) => {
          const tone = item.tone === "accent" ? " compare__card--accent" : item.tone === "muted" ? " compare__card--muted" : "";
          return `<article class="compare__card${tone} ${anim(index + 1)}">
            ${item.label ? `<span class="compare__label">${inline(item.label)}</span>` : ""}
            <h3 class="compare__title">${inline(item.title || "")}</h3>
            ${item.text ? `<p class="compare__text">${inline(item.text)}</p>` : ""}
            ${asArray(item.bullets).length
              ? `<ul class="compare__list">${asArray(item.bullets)
                  .map((bullet) => `<li>${inline(bullet)}</li>`)
                  .join("")}</ul>`
              : ""}
          </article>`;
        })
        .join("")}
    </div>
  </div>`;
}

function renderQuote(slide, ctx) {
  return `<div class="l-quote">
    ${renderKicker(slide.kicker, { animIndex: 0 })}
    <span class="quote__mark ${anim(1, "anim--scale")}" aria-hidden="true">“</span>
    <blockquote class="quote__text ${anim(2)}">${inline(slide.quote || slide.title || "")}</blockquote>
    ${slide.cite ? `<p class="quote__by ${anim(3)}">${inline(slide.cite)}${slide.role ? ` · ${inline(slide.role)}` : ""}</p>` : ""}
    ${slide.body ? `<p class="quote__context ${anim(4)}">${inline(slide.body)}</p>` : ""}
    <span class="quote__stamp" aria-hidden="true">${pad(ctx.page)}</span>
  </div>`;
}

function renderSection(slide, ctx) {
  return `<div class="l-section">
    ${renderKicker(slide.kicker, { animIndex: 0 })}
    <span class="section__index ${anim(1, "anim--scale")}" aria-hidden="true">${text(slide.index, pad(ctx.page))}</span>
    <h2 class="section__title ${anim(2)}">${inline(slide.title)}</h2>
    ${slide.body ? `<p class="section__body ${anim(3)}">${inline(slide.body)}</p>` : ""}
    <hr class="section__rule ${anim(4, "anim--line")}">
  </div>`;
}

function highlightCode(source) {
  const escaped = escapeHtml(source);
  const tokens = [];
  let output = escaped.replace(/(\/\/[^\n]*|#[^\n]*)/g, (match) => {
    tokens.push(`<span class="tok-com">${match}</span>`);
    return `\u0000${tokens.length - 1}\u0000`;
  });
  output = output.replace(/(&quot;[^\n]*?&quot;|&#39;[^\n]*?&#39;|`[^`\n]*`)/g, (match) => {
    tokens.push(`<span class="tok-str">${match}</span>`);
    return `\u0000${tokens.length - 1}\u0000`;
  });
  output = output.replace(
    /\b(const|let|var|function|return|if|else|for|of|in|new|class|import|from|export|async|await|true|false|null|undefined|type|interface)\b/g,
    '<span class="tok-key">$1</span>',
  );
  return output.replace(/\u0000(\d+)\u0000/g, (_, index) => tokens[Number(index)] || "");
}

function renderCode(slide) {
  const code = slide.code && typeof slide.code === "object" ? slide.code : {};
  const source = String(code.content || "").replace(/\r\n/g, "\n").replace(/\s+$/, "");
  return `<div class="l-code">
    <div class="code__intro">
      ${renderKicker(slide.kicker, { animIndex: 0 })}
      <h2 class="${anim(1)}">${inline(slide.title)}</h2>
      ${slide.body ? `<p class="lead ${anim(2)}">${inline(slide.body)}</p>` : ""}
      ${asArray(slide.bullets).length
        ? `<ul class="code__points ${anim(3)}">${asArray(slide.bullets)
            .map((item) => `<li>${inline(item)}</li>`)
            .join("")}</ul>`
        : ""}
    </div>
    <div class="code-panel ${anim(2)}">
      <div class="code-panel__bar">
        <i aria-hidden="true"></i><i aria-hidden="true"></i><i aria-hidden="true"></i>
        <span>${text(code.filename, "deck.json")}</span>
      </div>
      <pre><code>${highlightCode(source)}</code></pre>
    </div>
  </div>`;
}

function renderTable(slide) {
  const headers = asArray(slide.headers);
  const rows = asArray(slide.rows);
  return `<div class="l-table">
    ${renderKicker(slide.kicker, { animIndex: 0 })}
    <h2 class="${anim(1)}">${inline(slide.title)}</h2>
    ${slide.body ? `<p class="lead ${anim(2)}">${inline(slide.body)}</p>` : ""}
    <div class="table-wrap ${anim(2)}">
      <table>
        ${headers.length ? `<thead><tr>${headers.map((header) => `<th>${inline(header)}</th>`).join("")}</tr></thead>` : ""}
        <tbody>
          ${rows
            .map(
              (row) => `<tr>${asArray(row)
                .map((cell, cellIndex) => `<td data-label="${attr(headers[cellIndex] || "")}">${inline(cell)}</td>`)
                .join("")}</tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>
    ${slide.note ? `<p class="table__note">${inline(slide.note)}</p>` : ""}
  </div>`;
}

function renderImage(slide) {
  const src = safeUrl(slide.src || slide.image?.src);
  const overlay = src
    ? `<div class="image__bg" style="background-image:url(&quot;${attr(src)}&quot;)" role="img" aria-label="${attr(slide.alt || slide.title || "")}"></div>
       <div class="image__overlay" aria-hidden="true"></div>`
    : `<div class="image__bg" aria-hidden="true"></div>
       <div class="image__overlay" aria-hidden="true"></div>`;
  return `<div class="l-image">
    ${overlay}
    ${slide.caption ? `<span class="image__caption">${inline(slide.caption)}</span>` : ""}
    <div class="image__content">
      ${renderKicker(slide.kicker, { animIndex: 0 })}
      <h2 class="${anim(1)}">${inline(slide.title)}</h2>
      ${slide.body ? `<p class="lead ${anim(2)}">${inline(slide.body)}</p>` : ""}
    </div>
  </div>`;
}

function renderClosing(slide) {
  const items = asArray(slide.items);
  const qr = slide.qr && typeof slide.qr === "object" ? slide.qr : null;
  const qrSrc = safeUrl(qr?.src);
  return `<div class="l-closing">
    <div class="closing__text">
      ${renderKicker(slide.kicker, { animIndex: 0 })}
      <h2 class="closing__title ${anim(1)}">${inline(slide.title || "谢谢")}</h2>
      ${slide.body ? `<p class="closing__body ${anim(2)}">${inline(slide.body)}</p>` : ""}
    </div>
    <aside class="closing__panel ${anim(2)}">
      ${items.length
        ? `<ul class="closing__items">${items
            .map(
              (item) => `<li>
                <span class="closing__label">${inline(item.label || "")}</span>
                <span class="closing__value">${inline(item.value || "")}</span>
              </li>`,
            )
            .join("")}</ul>`
        : ""}
      ${qr && qrSrc ? `<div class="closing__qr">
        <img src="${attr(qrSrc)}" alt="${attr(qr.alt || "二维码")}" loading="lazy">
        <span>${inline(qr.label || "扫码继续阅读")}</span>
      </div>` : ""}
    </aside>
  </div>`;
}

const RENDERERS = {
  statement: renderStatement,
  agenda: renderAgenda,
  bullets: renderBullets,
  split: renderSplit,
  stats: renderStats,
  timeline: renderTimeline,
  compare: renderCompare,
  quote: renderQuote,
  section: renderSection,
  code: renderCode,
  table: renderTable,
  image: renderImage,
  closing: renderClosing,
};

function renderContentSlide(slide, deck, ratio, page, total) {
  const ratioMeta = resolveRatio(ratio);
  const entrance = ENTRANCES[slide.entrance] || ENTRANCES.rise;
  const renderer = RENDERERS[slide.layout] || renderBullets;
  const body = renderer(slide, { page, total, deck });
  return `<section class="slide" data-ratio="${ratioMeta.id}" data-orientation="${ratioMeta.orientation}" data-layout="${attr(slide.layout)}" data-index="${page}" data-entrance="${attr(slide.entrance)}" style="--anim-name:${entrance}" aria-roledescription="slide" aria-label="${page + 1} / ${total}">
    <div class="slide__bg" aria-hidden="true"></div>
    <div class="slide__inner">${body}</div>
    ${renderFoot(deck, page, total)}
  </section>`;
}

/* --------------------------------------------------------------------------
   Public composition
   -------------------------------------------------------------------------- */

export function renderCoverOnly(input, ratio = "4:3") {
  const deck = normalizeDeck(input);
  const ratioMeta = resolveRatio(ratio);
  const slides = [renderCoverSlide(deck, ratioMeta.id, 1)];
  slides[0] = slides[0].replace('class="slide', 'class="slide is-active');
  return {
    deck,
    ratio: ratioMeta,
    slides,
    total: 1,
    style: appearanceStyle(deck.appearance),
    bgEffect: backgroundEffect(deck.appearance),
  };
}

export function renderDeckSlides(input, ratio = "16:9") {
  const deck = normalizeDeck(input);
  const ratioMeta = resolveRatio(ratio);
  const content = deck.slides.slice();
  const hasClosing = content.some((slide) => slide.layout === "closing");
  if (!hasClosing && deck.closing) {
    content.push({
      ...deck.closing,
      id: deck.closing.id || "closing",
      layout: "closing",
      entrance: ENTRANCES[deck.closing.entrance] ? deck.closing.entrance : "rise",
    });
  }
  const total = content.length + 1;
  const slides = [renderCoverSlide(deck, ratioMeta.id, total)];
  content.forEach((slide, index) => {
    slides.push(renderContentSlide(slide, deck, ratioMeta.id, index + 1, total));
  });
  slides[0] = slides[0].replace('class="slide', 'class="slide is-active');
  return {
    deck,
    ratio: ratioMeta,
    slides,
    total,
    style: appearanceStyle(deck.appearance),
    bgEffect: backgroundEffect(deck.appearance),
  };
}

export function renderChrome(deckInput, total, options = {}) {
  const deck = normalizeDeck(deckInput);
  const label = deck.meta.organization || deck.meta.title;
  return `<div class="deck__ui">
    <div class="deck__progress" aria-hidden="true"><span></span></div>
    <div class="deck__bar">
      <span class="deck__label">${text(label)}</span>
      <div class="deck__actions">
        <button class="deck__btn" type="button" data-nav="prev" aria-label="上一页" title="上一页 (←)">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span class="deck__count" aria-live="polite"><b>01</b> / ${pad(total)}</span>
        <button class="deck__btn" type="button" data-nav="next" aria-label="下一页" title="下一页 (→)">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
        </button>
        <button class="deck__btn" type="button" data-action="overview" aria-label="幻灯片总览" title="总览 (O)">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg>
        </button>
        <button class="deck__btn" type="button" data-action="fullscreen" aria-label="全屏演示" title="全屏 (F)">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
        </button>
      </div>
    </div>
  </div>`;
}

export function deckStats(input) {
  const deck = normalizeDeck(input);
  return {
    title: deck.meta.title,
    theme: deck.meta.theme,
    slides: deck.slides.length + 1 + (deck.closing ? 1 : 0),
    layouts: deck.slides.map((slide) => slide.layout),
  };
}
