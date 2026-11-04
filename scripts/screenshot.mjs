#!/usr/bin/env node
/**
 * PNG export through one persistent headless Chrome session.
 * All slides reuse the same page target, so no new window per slide.
 *
 *   node scripts/screenshot.mjs --html exports/demo/deck-16x9.html --all
 *   node scripts/screenshot.mjs --html exports/demo/cover-3x4.html --slide 1 --out preview/cover.png
 */

import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";

import { createBrowser, findChrome } from "./lib/browser.mjs";

const RATIO_SIZE = {
  "16:9": [1600, 900],
  "4:3": [1200, 900],
  "3:4": [900, 1200],
  "3:5": [900, 1500],
};

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith("--")) continue;
    const key = argv[i].slice(2);
    if (key === "all" || key === "quiet") {
      args[key] = true;
      continue;
    }
    args[key] = argv[i + 1];
    i += 1;
  }
  return args;
}

function countSlides(html) {
  return (html.match(/<section class="slide/g) || []).length;
}

function detectRatio(html) {
  const match = html.match(/data-ratio="([^"]+)"/);
  return match ? match[1] : "16:9";
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.html) {
    throw new Error("缺少 --html。示例：node scripts/screenshot.mjs --html exports/demo/deck-16x9.html --all");
  }
  const htmlPath = path.resolve(args.html);
  const html = await readFile(htmlPath, "utf8");
  const ratio = args.ratio || detectRatio(html);
  const [detectedWidth, detectedHeight] = RATIO_SIZE[ratio] || RATIO_SIZE["16:9"];
  const width = Number(args.width || detectedWidth);
  const height = Number(args.height || detectedHeight);
  const total = countSlides(html);
  const chrome = findChrome(args.chrome);
  if (!chrome) {
    throw new Error("未找到 Chrome/Edge。请用 --chrome 指定可执行文件，或设置 CHROME_PATH。");
  }

  const outBase = args.out
    ? path.resolve(args.out)
    : path.resolve("preview", `${path.basename(htmlPath, ".html")}-${ratio.replace(":", "x")}`);
  const isSingleFile = !args.all;
  const slides = args.all ? Array.from({ length: total }, (_, index) => index + 1) : [Number(args.slide || 1)];
  const browser = await createBrowser({ chrome });
  const results = [];

  try {
    for (const slide of slides) {
      const output = isSingleFile
        ? outBase.endsWith(".png")
          ? outBase
          : `${outBase}.png`
        : path.join(outBase, `slide-${String(slide).padStart(2, "0")}.png`);
      const url = `${pathToFileURL(htmlPath).href}?export=1&slide=${slide}`;
      const result = await browser.capture({ url, width, height, output });
      results.push({ slide, ...result });
      if (!args.quiet) {
        console.log(`  slide ${String(slide).padStart(2, "0")} -> ${path.relative(process.cwd(), output)}`);
      }
    }
  } finally {
    await browser.close();
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        html: htmlPath,
        ratio,
        width,
        height,
        slides: results,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
