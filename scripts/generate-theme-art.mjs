#!/usr/bin/env node
/**
 * Generate local, dependency-free theme art examples (PNG) with the same
 * persistent Chrome session used by the screenshot pipeline.
 *
 *   node scripts/generate-theme-art.mjs
 *
 * Output: examples/generated/theme-<id>-art.png (gitignored)
 */

import { mkdir } from "node:fs/promises";
import path from "node:path";

import { createBrowser, findChrome } from "./lib/browser.mjs";

const WIDTH = 1600;
const HEIGHT = 900;

const base = `
  * { box-sizing: border-box; }
  html, body { margin: 0; width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
  body { position: relative; }
  .art { position: absolute; inset: 0; overflow: hidden; }
  .art > * { position: absolute; display: block; }
  .grain {
    inset: 0;
    opacity: .16;
    mix-blend-mode: soft-light;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.86' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.6'/%3E%3C/svg%3E");
  }
`;

function editorial() {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    ${base}
    body { background: #f2ecdf; }
    .art::before {
      content: ""; position: absolute; inset: 0;
      background:
        radial-gradient(62% 72% at 96% 6%, rgba(212,83,45,.16), transparent 66%),
        radial-gradient(50% 60% at 3% 96%, rgba(37,92,75,.10), transparent 72%);
    }
    .sun { width: 600px; height: 600px; border-radius: 50%; right: 130px; top: 150px;
      background: radial-gradient(circle at 30% 28%, rgba(255,255,255,.24), transparent 42%), #d4532d;
      box-shadow: inset -48px -32px 0 rgba(29,26,21,.08); }
    .ring { width: 760px; height: 760px; border-radius: 50%; border: 1px solid rgba(29,26,21,.28);
      right: 30px; top: 70px; }
    .rule { width: 1px; height: 660px; right: 490px; top: 120px; background: rgba(29,26,21,.28); }
    .slice { width: 46%; height: 1px; left: 90px; bottom: 120px; background: rgba(29,26,21,.18); }
    .grain { opacity: .1; }
  </style></head><body><div class="art">
    <span class="sun"></span><span class="ring"></span><span class="rule"></span><span class="slice"></span><span class="grain"></span>
  </div></body></html>`;
}

function tech() {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    ${base}
    body { background: #070d17; }
    .art::before {
      content: ""; position: absolute; inset: 0;
      background:
        radial-gradient(55% 55% at 82% 12%, rgba(94,234,212,.16), transparent 68%),
        radial-gradient(40% 50% at 8% 96%, rgba(163,230,53,.08), transparent 72%);
    }
    .grid { inset: -10% -5% -20%; opacity: .6;
      background-image:
        linear-gradient(to right, rgba(94,234,212,.28) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(94,234,212,.28) 1px, transparent 1px);
      background-size: 90px 90px;
      transform: perspective(900px) rotateX(58deg) rotateZ(-16deg);
      mask-image: radial-gradient(70% 70% at 50% 60%, #000 20%, transparent 76%);
    }
    .orb { width: 520px; height: 520px; border-radius: 50%; right: 120px; top: 100px;
      background: radial-gradient(circle at 34% 30%, #eaf2ff, #5eead4 12%, rgba(94,234,212,.12) 48%, transparent 70%);
      filter: blur(2px); }
    .scan { width: 1300px; height: 1px; right: -100px; top: 430px;
      background: linear-gradient(90deg, transparent, #5eead4, transparent);
      box-shadow: 0 0 38px #5eead4; opacity: .9; }
    .ring { width: 720px; height: 720px; border: 1px solid rgba(151,190,235,.22); border-radius: 50%;
      right: 20px; top: 30px; }
    .grain { opacity: .1; }
  </style></head><body><div class="art">
    <span class="grid"></span><span class="ring"></span><span class="orb"></span><span class="scan"></span><span class="grain"></span>
  </div></body></html>`;
}

function consulting() {
  const bars = [22, 40, 31, 58, 46, 74, 62, 92]
    .map((height, index) => `<i style="height:${height}%;background:${index % 2 ? "#f59e0b" : "#1d4ed8"};opacity:${index % 2 ? .92 : .88}"></i>`)
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    ${base}
    body { background: #f7f8fa; }
    .art::before {
      content: ""; position: absolute; inset: 0;
      background:
        linear-gradient(180deg, rgba(29,78,216,.06), transparent 22%),
        radial-gradient(42% 62% at 100% 100%, rgba(245,158,11,.09), transparent 72%);
    }
    .top { top: 0; left: 90px; right: 90px; height: 10px;
      background: linear-gradient(90deg, #1d4ed8 0 19%, rgba(16,24,39,.12) 19% 100%); }
    .ring { width: 560px; height: 560px; border: 1px solid rgba(16,24,39,.14); border-radius: 50%;
      right: 90px; top: 90px; }
    .bars { right: 100px; bottom: 100px; width: 620px; height: 470px; display: flex; align-items: flex-end; gap: 18px; }
    .bars i { flex: 1; border-radius: 5px 5px 0 0; display: block; }
    .rule { left: 90px; right: 90px; bottom: 100px; height: 1px; background: rgba(16,24,39,.14); }
    .grain { opacity: .02; }
  </style></head><body><div class="art">
    <span class="top"></span><span class="ring"></span><span class="rule"></span>
    <span class="bars">${bars}</span><span class="grain"></span>
  </div></body></html>`;
}

function ink() {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    ${base}
    body { background: #121110; }
    .art::before {
      content: ""; position: absolute; inset: 0;
      background:
        linear-gradient(90deg, transparent 0 74%, rgba(255,77,46,.08) 74% 74.12%, transparent 74.12%),
        radial-gradient(60% 60% at 100% 100%, rgba(255,77,46,.12), transparent 70%);
    }
    .disc { width: 620px; height: 620px; border-radius: 50%; background: #ff4d2e; right: -40px; top: 110px; }
    .ring { width: 800px; height: 800px; border-radius: 50%; border: 1px solid rgba(243,239,230,.16);
      right: -130px; top: 20px; }
    .rule { width: 1px; height: 700px; right: 250px; top: 60px; background: rgba(243,239,230,.28); }
    .bar { left: 90px; bottom: 150px; width: 420px; height: 2px; background: #f3efe6; opacity: .7; }
    .grain { opacity: .12; }
  </style></head><body><div class="art">
    <span class="disc"></span><span class="ring"></span><span class="rule"></span><span class="bar"></span><span class="grain"></span>
  </div></body></html>`;
}

const themes = [
  ["editorial", editorial()],
  ["tech", tech()],
  ["consulting", consulting()],
  ["ink", ink()],
];

const chrome = findChrome();
if (!chrome) {
  console.error("未找到 Chrome/Edge，无法生成本地主题示例图。");
  process.exitCode = 1;
} else {
  const outDir = path.resolve("examples", "generated");
  await mkdir(outDir, { recursive: true });
  const browser = await createBrowser({ chrome });
  try {
    const tasks = themes.map(([name, html]) => ({
      url: `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
      width: WIDTH,
      height: HEIGHT,
      output: path.join(outDir, `theme-${name}-art.png`),
    }));
    const results = await browser.captureMany(tasks, { concurrency: 4 });
    for (const result of results) {
      console.log(`  ${path.relative(process.cwd(), result.output)}`);
    }
  } finally {
    await browser.close();
  }
  console.log("Theme art examples generated (gitignored).");
}
