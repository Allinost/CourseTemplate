#!/usr/bin/env node
/**
 * Optional PNG export through a locally installed Chrome/Edge (no npm deps).
 *
 *   node scripts/screenshot.mjs --html exports/demo/deck-16x9.html --all
 *   node scripts/screenshot.mjs --html exports/demo/cover-3x4.html --slide 1 --out preview/cover.png
 */

import { mkdir, mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

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
    if (key === "all") {
      args[key] = true;
      continue;
    }
    args[key] = argv[i + 1];
    i += 1;
  }
  return args;
}

function findChrome(explicit) {
  const candidates = [
    explicit,
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    path.join(process.env.LOCALAPPDATA || "", "Google\\Chrome\\Application\\chrome.exe"),
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/microsoft-edge",
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      if (spawnSync(candidate, ["--version"], { windowsHide: true }).status === 0) return candidate;
    } catch (_error) {
      /* keep looking */
    }
  }
  return null;
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
  if (!isSingleFile) await mkdir(outBase, { recursive: true });

  const slides = args.all ? Array.from({ length: total }, (_, index) => index + 1) : [Number(args.slide || 1)];
  const profile = await mkdtemp(path.join(tmpdir(), "htmlppt-chrome-"));
  const results = [];

  try {
    for (const slide of slides) {
      const output = isSingleFile
        ? outBase.endsWith(".png")
          ? outBase
          : `${outBase}.png`
        : path.join(outBase, `slide-${String(slide).padStart(2, "0")}.png`);
      await mkdir(path.dirname(output), { recursive: true });
      const url = `${pathToFileURL(htmlPath).href}?export=1&slide=${slide}`;
      const slideProfile = path.join(profile, `run-${slide}`);
      await mkdir(slideProfile, { recursive: true });
      const run = spawnSync(
        chrome,
        [
          "--headless=new",
          "--disable-gpu",
          "--no-sandbox",
          "--disable-dev-shm-usage",
          "--hide-scrollbars",
          "--force-device-scale-factor=1",
          `--user-data-dir=${slideProfile}`,
          `--window-size=${width},${height}`,
          `--screenshot=${output}`,
          "--virtual-time-budget=2500",
          url,
        ],
        { windowsHide: true, encoding: "utf8" },
      );
      let ready = false;
      for (let attempt = 0; attempt < 40; attempt += 1) {
        try {
          const info = await stat(output);
          if (info.size > 0) {
            ready = true;
            break;
          }
        } catch (_error) {
          /* Chrome may fork and write the screenshot after the launcher exits */
        }
        await delay(250);
      }
      if (!ready) {
        throw new Error(`截图失败（slide ${slide}）：${run.stderr || run.stdout || "Chrome 未生成文件"}`);
      }
      results.push({ slide, file: output, width, height });
      if (!args.quiet) console.log(`  slide ${String(slide).padStart(2, "0")} -> ${path.relative(process.cwd(), output)}`);
    }
  } finally {
    await rm(profile, { recursive: true, force: true }).catch(() => {});
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
