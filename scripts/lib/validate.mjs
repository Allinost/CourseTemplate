/**
 * Content validation. Hand-written so the template keeps zero dependencies.
 * Errors block export; warnings are reported to the caller (OpenClaw or CLI).
 */

import { BACKGROUND_EFFECTS, LAYOUTS, RATIOS, THEMES, normalizeDeck } from "../../src/js/render.js";

const LAYOUT_IDS = new Set(LAYOUTS.map((layout) => layout.id));
const THEME_IDS = new Set(THEMES.map((theme) => theme.id));
const RATIO_IDS = new Set(Object.keys(RATIOS));
const BG_IDS = new Set(BACKGROUND_EFFECTS.map((effect) => effect.id));

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function pushTextLengthWarning(warnings, path, value, limit) {
  if (typeof value === "string" && value.length > limit) {
    warnings.push({
      path,
      message: `文本长度 ${value.length} 超过建议值 ${limit}，导出时会自动缩小字号，但建议拆分页面。`,
    });
  }
}

export function validateDeck(input) {
  const errors = [];
  const warnings = [];

  if (!isObject(input)) {
    return {
      ok: false,
      errors: [{ path: "$", message: "内容必须是 JSON 对象。" }],
      warnings,
      stats: null,
    };
  }

  const meta = isObject(input.meta) ? input.meta : {};
  if (!hasText(meta.title) && !hasText(input.title)) {
    errors.push({ path: "$.meta.title", message: "缺少封面主标题 meta.title。" });
  }
  if (hasText(meta.title) && meta.title.length > 60) {
    warnings.push({ path: "$.meta.title", message: "主标题超过 60 个字符，封面可能显得拥挤。" });
  }
  if (meta.theme !== undefined && !THEME_IDS.has(meta.theme)) {
    warnings.push({
      path: "$.meta.theme",
      message: `未知主题 "${meta.theme}"，将回退为 editorial。可选：${[...THEME_IDS].join(", ")}。`,
    });
  }

  if (!Array.isArray(input.slides)) {
    errors.push({ path: "$.slides", message: "slides 必须是数组。" });
  } else if (input.slides.length === 0) {
    errors.push({ path: "$.slides", message: "至少需要一页内容。" });
  } else if (input.slides.length > 40) {
    warnings.push({ path: "$.slides", message: "页数超过 40，建议拆分为多个 deck。" });
  }

  if (Array.isArray(input.slides)) {
    input.slides.forEach((slide, index) => {
      const base = `$.slides[${index}]`;
      if (!isObject(slide)) {
        errors.push({ path: base, message: "每一页必须是对象。" });
        return;
      }
      if (!LAYOUT_IDS.has(slide.layout)) {
        errors.push({
          path: `${base}.layout`,
          message: `未知版式 "${slide.layout}"。可选：${[...LAYOUT_IDS].join(", ")}。`,
        });
        return;
      }
      if (slide.entrance !== undefined && !["rise", "blur", "clip", "scale", "left", "right"].includes(slide.entrance)) {
        warnings.push({ path: `${base}.entrance`, message: `未知动画 "${slide.entrance}"，将回退为 rise。` });
      }

      pushTextLengthWarning(warnings, `${base}.title`, slide.title, 70);
      pushTextLengthWarning(warnings, `${base}.body`, slide.body, 320);

      switch (slide.layout) {
        case "statement":
          if (!hasText(slide.title)) errors.push({ path: `${base}.title`, message: "观点页需要 title。" });
          break;
        case "agenda":
        case "bullets":
          if (!hasText(slide.title)) errors.push({ path: `${base}.title`, message: "该版式需要 title。" });
          if (!Array.isArray(slide.items) || slide.items.length === 0) {
            errors.push({ path: `${base}.items`, message: "该版式至少需要 1 个 item。" });
          } else if (slide.items.length > 8) {
            warnings.push({ path: `${base}.items`, message: "条目超过 8 个，建议拆分或改用表格。" });
          }
          break;
        case "split":
          if (!hasText(slide.title)) errors.push({ path: `${base}.title`, message: "图文页需要 title。" });
          if (slide.media && !isObject(slide.media)) {
            errors.push({ path: `${base}.media`, message: "media 必须是对象。" });
          }
          break;
        case "stats":
          if (!hasText(slide.title)) errors.push({ path: `${base}.title`, message: "数据页需要 title。" });
          if (!Array.isArray(slide.items) || slide.items.length < 2 || slide.items.length > 4) {
            errors.push({ path: `${base}.items`, message: "数据页需要 2-4 个数据项。" });
          }
          break;
        case "timeline":
          if (!hasText(slide.title)) errors.push({ path: `${base}.title`, message: "时间线需要 title。" });
          if (!Array.isArray(slide.items) || slide.items.length < 2) {
            errors.push({ path: `${base}.items`, message: "时间线至少需要 2 个阶段。" });
          } else if (slide.items.length > 6) {
            warnings.push({ path: `${base}.items`, message: "时间线超过 6 段，竖版会非常密集。" });
          }
          break;
        case "compare":
          if (!hasText(slide.title)) errors.push({ path: `${base}.title`, message: "对比页需要 title。" });
          if (!Array.isArray(slide.items) || slide.items.length < 2 || slide.items.length > 3) {
            errors.push({ path: `${base}.items`, message: "对比页需要 2-3 张卡片。" });
          }
          break;
        case "quote":
          if (!hasText(slide.quote) && !hasText(slide.title)) {
            errors.push({ path: `${base}.quote`, message: "引用页需要 quote 或 title。" });
          }
          break;
        case "section":
          if (!hasText(slide.title)) errors.push({ path: `${base}.title`, message: "章节页需要 title。" });
          break;
        case "code":
          if (!hasText(slide.title)) errors.push({ path: `${base}.title`, message: "代码页需要 title。" });
          if (!isObject(slide.code) || !hasText(slide.code.content)) {
            errors.push({ path: `${base}.code.content`, message: "代码页需要 code.content。" });
          }
          break;
        case "table":
          if (!hasText(slide.title)) errors.push({ path: `${base}.title`, message: "表格页需要 title。" });
          if (!Array.isArray(slide.headers) || slide.headers.length === 0) {
            errors.push({ path: `${base}.headers`, message: "表格页需要 headers。" });
          }
          if (!Array.isArray(slide.rows) || slide.rows.length === 0) {
            errors.push({ path: `${base}.rows`, message: "表格页需要 rows。" });
          } else if (slide.rows.length > 8) {
            warnings.push({ path: `${base}.rows`, message: "表格超过 8 行，建议拆分页面。" });
          }
          break;
        case "image":
          if (!hasText(slide.title)) errors.push({ path: `${base}.title`, message: "全图页需要 title。" });
          if (!hasText(slide.src) && !hasText(slide.image?.src)) {
            warnings.push({ path: `${base}.src`, message: "未提供图片地址，将显示主题色占位背景。" });
          }
          break;
        case "closing":
          if (!hasText(slide.title)) errors.push({ path: `${base}.title`, message: "结尾页需要 title。" });
          break;
        default:
          break;
      }
    });
  }

  if (input.cover !== undefined && !isObject(input.cover)) {
    errors.push({ path: "$.cover", message: "cover 必须是对象。" });
  }

  if (input.appearance !== undefined) {
    if (!isObject(input.appearance)) {
      errors.push({ path: "$.appearance", message: "appearance 必须是对象。" });
    } else {
      const bg = input.appearance.background;
      if (bg !== undefined) {
        if (!isObject(bg)) {
          errors.push({ path: "$.appearance.background", message: "background 必须是对象。" });
        } else if (bg.type !== undefined && !BG_IDS.has(bg.type)) {
          warnings.push({
            path: "$.appearance.background.type",
            message: `未知背景效果 "${bg.type}"，将回退为预设背景。可选：${[...BG_IDS].join(", ")}。`,
          });
        }
      }
      const typography = input.appearance.typography;
      if (typography !== undefined && !isObject(typography)) {
        errors.push({ path: "$.appearance.typography", message: "typography 必须是对象。" });
      }
      const colors = input.appearance.colors;
      if (colors !== undefined && !isObject(colors)) {
        errors.push({ path: "$.appearance.colors", message: "colors 必须是对象。" });
      }
    }
  }

  const normalized = normalizeDeck(input);
  const stats = {
    title: normalized.meta.title,
    theme: normalized.meta.theme,
    contentSlides: normalized.slides.length,
    totalSlides: normalized.slides.length + 1 + (normalized.closing ? 1 : 0),
    layouts: normalized.slides.reduce((counts, slide) => {
      counts[slide.layout] = (counts[slide.layout] || 0) + 1;
      return counts;
    }, {}),
    ratios: [...RATIO_IDS],
  };

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stats,
  };
}
