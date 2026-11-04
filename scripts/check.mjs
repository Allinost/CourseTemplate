#!/usr/bin/env node
/**
 * Repository gate: mirrors the small, checkable part of Go-Backend-Core SOP.
 * - required project docs exist
 * - project manifest is a frontend template
 * - demo deck validates
 * - all four ratios render without unresolved values
 * - a real four-format build succeeds in a temp directory
 */

import { access, mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { FORMAT_ORDER, buildDeck } from "./lib/build.mjs";
import { validateDeck } from "./lib/validate.mjs";
import { RATIOS, renderCoverOnly, renderDeckSlides } from "../src/js/render.js";

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const REQUIRED_FILES = [
  "README.md",
  "AGENTS.md",
  "CHANGELOG.md",
  "SKILL.md",
  "project.manifest.json",
  "openclaw/SKILL.md",
  "openclaw/README.md",
  "openclaw/manifest.json",
  "openclaw/deck.schema.json",
  "examples/demo.deck.json",
  "src/index.html",
  "src/js/render.js",
  "src/js/runtime.js",
  "src/js/studio.js",
  "src/css/tokens.css",
  "src/css/layout.css",
  "src/css/animations.css",
  "src/css/print.css",
  "src/css/studio.css",
  "scripts/openclaw.mjs",
  "scripts/build.mjs",
  "scripts/serve.mjs",
  "scripts/screenshot.mjs",
  "scripts/lib/browser.mjs",
  "docs/README.md",
  "docs/projects/html-ppt-template/index.md",
  "docs/projects/html-ppt-template/01-architecture-overview.md",
  "docs/projects/html-ppt-template/02-content-model.md",
  "docs/projects/html-ppt-template/03-openclaw-interface.md",
  "docs/projects/html-ppt-template/04-module-structure.md",
  "docs/projects/html-ppt-template/05-licensing.md",
  "docs/projects/html-ppt-template/requirements/RQM-0001.md",
  "docs/projects/html-ppt-template/requirements/RQM-0002.md",
];

const problems = [];
const notes = [];

async function exists(file) {
  try {
    await access(path.join(ROOT, file));
    return true;
  } catch (_error) {
    return false;
  }
}

function checkHtml(label, html, ratio) {
  if (!html.includes(`data-ratio="${ratio}"`)) problems.push(`${label}: 缺少 data-ratio="${ratio}"`);
  if (html.includes("undefined")) problems.push(`${label}: 输出包含 undefined`);
  if (html.includes("[object Object]")) problems.push(`${label}: 输出包含 [object Object]`);
  if (html.includes("NaN")) problems.push(`${label}: 输出包含 NaN`);
  if (!html.includes("slide__inner")) problems.push(`${label}: 缺少 slide__inner`);
}

async function main() {
  for (const file of REQUIRED_FILES) {
    if (!(await exists(file))) problems.push(`缺少文件：${file}`);
  }

  const manifest = JSON.parse(await readFile(path.join(ROOT, "project.manifest.json"), "utf8"));
  if (manifest.type !== "template") problems.push(`project.manifest.json type 必须是 template，当前为 ${manifest.type}`);
  if (manifest.project_key !== "html-ppt-template") problems.push("project_key 必须是 html-ppt-template");
  if (!manifest.docs_root?.startsWith("docs/projects/")) problems.push("docs_root 必须位于 docs/projects/ 下");

  const deck = JSON.parse(await readFile(path.join(ROOT, "examples/demo.deck.json"), "utf8"));
  const validation = validateDeck(deck);
  if (!validation.ok) {
    for (const item of validation.errors) problems.push(`demo 校验失败 ${item.path}: ${item.message}`);
  }
  notes.push(`demo: ${validation.stats?.totalSlides || 0} 页 / ${validation.warnings.length} 条提醒`);

  for (const ratio of Object.keys(RATIOS)) {
    const meta = RATIOS[ratio];
    const result = meta.kind === "cover" ? renderCoverOnly(deck, ratio) : renderDeckSlides(deck, ratio);
    if (meta.kind === "cover" && result.total !== 1) problems.push(`${ratio}: 封面文档应只有 1 页`);
    if (meta.kind === "content" && result.total < 2) problems.push(`${ratio}: 内容文档应包含封面 + 内容页`);
    checkHtml(`${ratio} ${meta.kind}`, result.slides.join("\n"), ratio);
  }
  notes.push("ratios: 16:9 / 4:3 / 3:4 / 3:5 渲染通过");

  const workDir = await mkdtemp(path.join(tmpdir(), "htmlppt-check-"));
  try {
    const build = await buildDeck({
      deck,
      outDir: path.join(workDir, "deck"),
      formats: FORMAT_ORDER,
      writeGallery: true,
    });
    for (const file of build.files) {
      const info = await stat(file.path);
      if (!info.size) problems.push(`${file.ratio}: 生成文件为空`);
    }
    const buildManifest = JSON.parse(await readFile(path.join(build.outDir, "manifest.json"), "utf8"));
    for (const ratio of FORMAT_ORDER) {
      if (!buildManifest.formats?.[ratio]) problems.push(`manifest 缺少 ${ratio}`);
    }
    notes.push(`build: ${build.files.length} 个 HTML + manifest`);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }

  if (problems.length) {
    console.error(`SOP check failed (${problems.length})`);
    for (const problem of problems) console.error(`  ✗ ${problem}`);
    process.exitCode = 1;
    return;
  }
  console.log("SOP check passed");
  for (const note of notes) console.log(`  ✓ ${note}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
