/**
 * Standalone HTML document assembly.
 */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  THEMES,
  VERSION,
  escapeHtml,
  normalizeDeck,
  renderChrome,
  renderCoverOnly,
  renderDeckSlides,
  resolveRatio,
} from "../../src/js/render.js";

const ROOT = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const DECK_CSS_FILES = ["tokens.css", "layout.css", "animations.css", "print.css"];
let cssCache = null;
let runtimeCache = null;

export async function loadDeckCss() {
  if (!cssCache) {
    const chunks = await Promise.all(
      DECK_CSS_FILES.map((file) => readFile(path.join(ROOT, "src", "css", file), "utf8")),
    );
    cssCache = chunks.join("\n\n");
  }
  return cssCache;
}

export async function loadRuntime() {
  if (!runtimeCache) {
    runtimeCache = await readFile(path.join(ROOT, "src", "js", "runtime.js"), "utf8");
  }
  return runtimeCache;
}

export function renderHtmlDocument({ deck, ratio = "16:9", kind = "deck", css, runtime }) {
  const ratioMeta = resolveRatio(ratio);
  const normalized = normalizeDeck(deck);
  const theme = THEMES.find((item) => item.id === normalized.meta.theme) || THEMES[0];
  const result = kind === "cover" ? renderCoverOnly(normalized, ratioMeta.id) : renderDeckSlides(normalized, ratioMeta.id);
  const title = normalized.meta.title;
  const chrome = kind === "deck" && result.total > 1 ? renderChrome(normalized, result.total) : "";
  const metaDescription = normalized.meta.subtitle || normalized.cover.note || title;

  return `<!doctype html>
<html lang="${escapeHtml(normalized.meta.language || "zh-CN")}" data-ratio="${ratioMeta.id}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="generator" content="html-ppt-template ${escapeHtml(VERSION)}">
  <meta name="description" content="${escapeHtml(metaDescription)}">
  <meta name="theme-color" content="${escapeHtml(theme.bg)}">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%235eead4'/%3E%3C/svg%3E">
  <title>${escapeHtml(title)} · ${ratioMeta.id} ${ratioMeta.label}</title>
  <style>
${css || ""}
  </style>
  <style>@page { size: ${ratioMeta.width}px ${ratioMeta.height}px; margin: 0; }</style>
</head>
<body class="is-standalone" data-theme="${escapeHtml(theme.id)}" data-ratio="${ratioMeta.id}" data-kind="${kind}" data-export-width="${ratioMeta.width}" data-export-height="${ratioMeta.height}">
  <main class="deck${kind === "cover" ? " deck--single" : ""}" data-deck data-ratio="${ratioMeta.id}" data-theme="${escapeHtml(theme.id)}" data-kind="${kind}" data-start="1">
    <div class="deck__stage">
${result.slides.join("\n")}
    </div>
    ${chrome}
  </main>
  <noscript>
    <style>.slide{opacity:1!important;visibility:visible!important;position:relative!important;inset:auto!important;margin-bottom:20px} .deck__ui{display:none!important}</style>
  </noscript>
  <script>${runtime || ""}</script>
</body>
</html>
`;
}
