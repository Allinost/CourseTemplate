/**
 * Build pipeline: one deck JSON -> four standalone HTML artboards.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  THEMES,
  VERSION,
  escapeHtml,
  normalizeDeck,
  resolveRatio,
} from "../../src/js/render.js";
import { loadDeckCss, loadRuntime, renderHtmlDocument } from "./document.mjs";
import { validateDeck } from "./validate.mjs";

const ROOT = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
export const FORMAT_ORDER = ["16:9", "4:3", "3:4", "3:5"];
const FILE_NAMES = {
  "16:9": "deck-16x9.html",
  "4:3": "cover-4x3.html",
  "3:4": "cover-3x4.html",
  "3:5": "deck-3x5.html",
};

export class BuildError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "BuildError";
    this.details = details;
  }
}

export function slugify(value, fallback = "deck") {
  const result = String(value || "")
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 48);
  return result || fallback;
}

export function parseFormats(value) {
  if (!value || value === "all") return [...FORMAT_ORDER];
  const formats = String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/x/i, ":").replace(/\s/g, ""));
  const unique = [...new Set(formats)];
  const invalid = unique.filter((item) => !FORMAT_ORDER.includes(item));
  if (invalid.length) {
    throw new BuildError(`不支持的导出比例：${invalid.join(", ")}`, {
      valid: FORMAT_ORDER,
    });
  }
  return unique;
}

export function withTheme(input, theme) {
  const deck = JSON.parse(JSON.stringify(input));
  deck.meta = deck.meta && typeof deck.meta === "object" ? deck.meta : {};
  if (theme) deck.meta.theme = theme;
  return deck;
}

function fileUrl(filePath) {
  const relative = path.relative(ROOT, filePath).split(path.sep).join("/");
  return relative.startsWith("..") ? filePath : `/${relative}`;
}

function galleryPage(title, results, options = {}) {
  const cards = results
    .map((result) => {
      const links = result.files
        .map(
          (file) => `<a class="format" href="${escapeHtml(file.url)}">
            <span class="format__ratio">${file.ratio}</span>
            <span class="format__label">${escapeHtml(file.label)}</span>
            <span class="format__size">${file.width} × ${file.height}</span>
          </a>`,
        )
        .join("");
      return `<article class="card">
        <div class="card__head">
          <span class="card__theme">${escapeHtml(result.theme)}</span>
          <span class="card__count">${result.slides} slides</span>
        </div>
        <h2>${escapeHtml(result.title)}</h2>
        <p>${escapeHtml(result.themeName)} · ${escapeHtml(result.ratioSummary)}</p>
        <div class="formats">${links}</div>
      </article>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; padding: 48px; background: #0a0b0d; color: #f1f1f3;
    font-family: Inter, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; }
  .wrap { max-width: 1180px; margin: 0 auto; }
  header { margin-bottom: 36px; }
  .eyebrow { color: #7dd3c7; font: 11px/1.4 "Cascadia Code", Consolas, monospace; letter-spacing: .18em; text-transform: uppercase; }
  h1 { margin: 12px 0 8px; font-size: clamp(32px, 5vw, 56px); letter-spacing: -.04em; }
  .sub { margin: 0; color: #8f96a3; font-size: 15px; line-height: 1.6; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
  .card { padding: 22px; border: 1px solid #25272c; border-radius: 16px; background:
    radial-gradient(120% 100% at 0% 0%, rgba(94,234,212,.08), transparent 50%), #111216; }
  .card__head { display: flex; justify-content: space-between; color: #7dd3c7;
    font: 11px/1.4 "Cascadia Code", Consolas, monospace; letter-spacing: .12em; text-transform: uppercase; }
  .card__count { color: #6b7280; }
  .card h2 { margin: 18px 0 6px; font-size: 21px; letter-spacing: -.02em; }
  .card p { margin: 0; color: #8f96a3; font-size: 13px; }
  .formats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 20px; }
  .format { display: grid; gap: 2px; padding: 10px 12px; border: 1px solid #2a2d33; border-radius: 10px;
    color: inherit; text-decoration: none; transition: border-color .2s, background .2s; }
  .format:hover { border-color: #5eead4; background: rgba(94,234,212,.06); }
  .format__ratio { font-weight: 650; }
  .format__label, .format__size { color: #7d8491; font-size: 11px; }
  footer { margin-top: 40px; color: #5f6672; font: 11px/1.6 "Cascadia Code", Consolas, monospace; }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="eyebrow">HTML PPT TEMPLATE / ${VERSION}</div>
    <h1>${escapeHtml(title)}</h1>
    <p class="sub">同一份内容，四种画布。点击任意格式即可打开可演示、可截图的独立 HTML 文件。</p>
  </header>
  <div class="grid">${cards}</div>
  <footer>${escapeHtml(options.footer || "Generated by html-ppt-template · zero runtime dependencies")}</footer>
</div>
</body>
</html>
`;
}

async function writeIndex(outDir, result) {
  const html = galleryPage(result.title, [result], {
    footer: "同一份 deck.json 生成 · 可用 ?export=1&slide=N 截图",
  });
  await writeFile(path.join(outDir, "index.html"), html, "utf8");
}

export async function buildDeck({
  deck,
  outDir,
  theme,
  formats = FORMAT_ORDER,
  writeGallery = true,
  validated = false,
} = {}) {
  if (!deck || typeof deck !== "object") {
    throw new BuildError("缺少 deck 内容。");
  }
  const normalizedInput = withTheme(deck, theme);
  const validation = validated ? { ok: true, errors: [], warnings: [] } : validateDeck(normalizedInput);
  if (!validation.ok) {
    throw new BuildError("内容校验失败，未生成文件。", {
      errors: validation.errors,
      warnings: validation.warnings,
    });
  }

  const normalized = normalizeDeck(normalizedInput);
  const themeMeta = THEMES.find((item) => item.id === normalized.meta.theme) || THEMES[0];
  const slug = slugify(normalized.meta.slug || normalized.meta.title);
  const target = path.resolve(outDir || path.join(ROOT, "exports", slug));
  await mkdir(target, { recursive: true });

  const css = await loadDeckCss();
  const runtime = await loadRuntime();
  const files = [];

  for (const ratio of formats) {
    const ratioMeta = resolveRatio(ratio);
    if (!ratioMeta || !FORMAT_ORDER.includes(ratio)) continue;
    const kind = ratioMeta.kind;
    const html = renderHtmlDocument({
      deck: normalizedInput,
      ratio,
      kind,
      css,
      runtime,
    });
    const fileName = FILE_NAMES[ratio];
    const filePath = path.join(target, fileName);
    await writeFile(filePath, html, "utf8");
    files.push({
      ratio,
      label: ratioMeta.label,
      kind,
      width: ratioMeta.width,
      height: ratioMeta.height,
      file: fileName,
      path: filePath,
      url: fileUrl(filePath),
      /* cover documents contain one slide; deck documents contain cover + content */
      slides: kind === "cover" ? 1 : normalized.slides.length + 1 + (normalized.closing ? 1 : 0),
    });
  }

  files.sort((a, b) => FORMAT_ORDER.indexOf(a.ratio) - FORMAT_ORDER.indexOf(b.ratio));

  const manifest = {
    template: "html-ppt-template",
    version: VERSION,
    generatedAt: new Date().toISOString(),
    slug,
    title: normalized.meta.title,
    subtitle: normalized.meta.subtitle,
    theme: themeMeta.id,
    themeName: themeMeta.name,
    locale: normalized.meta.language,
    source: "deck.json",
    ratioSummary: files.map((file) => file.ratio).join(" / "),
    stats: {
      contentSlides: normalized.slides.length,
      totalSlides: normalized.slides.length + 1 + (normalized.closing ? 1 : 0),
      layouts: normalized.slides.map((slide) => slide.layout),
    },
    formats: Object.fromEntries(
      files.map((file) => [
        file.ratio,
        {
          file: file.file,
          kind: file.kind,
          width: file.width,
          height: file.height,
          slides: file.slides,
        },
      ]),
    ),
    files: files.map(({ path: _path, ...file }) => file),
    warnings: validation.warnings || [],
  };

  await writeFile(path.join(target, "deck.json"), `${JSON.stringify(normalizedInput, null, 2)}\n`, "utf8");
  await writeFile(path.join(target, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  if (writeGallery) await writeIndex(target, manifest);

  return {
    ok: true,
    outDir: target,
    slug,
    title: normalized.meta.title,
    theme: themeMeta.id,
    themeName: themeMeta.name,
    ratioSummary: files.map((file) => file.ratio).join(" / "),
    slides: manifest.stats.totalSlides,
    files,
    manifest,
    warnings: validation.warnings || [],
  };
}

export async function buildAllThemes({ deck, outRoot } = {}) {
  if (!deck || typeof deck !== "object") throw new BuildError("缺少 deck 内容。");
  const normalized = normalizeDeck(deck);
  const targetRoot = path.resolve(outRoot || path.join(ROOT, "dist"));
  const slug = slugify(normalized.meta.slug || normalized.meta.title);
  const results = [];
  for (const theme of THEMES) {
    const outDir = path.join(targetRoot, `${slug}-${theme.id}`);
    const result = await buildDeck({
      deck,
      outDir,
      theme: theme.id,
      formats: FORMAT_ORDER,
      writeGallery: false,
      validated: false,
    });
    results.push(result);
  }
  const gallery = galleryPage(normalized.meta.title, results, {
    footer: "npm run build -- --input your.deck.json",
  });
  await mkdir(targetRoot, { recursive: true });
  await writeFile(path.join(targetRoot, "index.html"), gallery, "utf8");
  return {
    ok: true,
    outDir: targetRoot,
    gallery: path.join(targetRoot, "index.html"),
    results,
  };
}

export { ROOT };
