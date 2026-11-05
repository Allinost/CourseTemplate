import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  LAYOUTS,
  RATIOS,
  THEMES,
  escapeHtml,
  inline,
  normalizeDeck,
  renderCoverOnly,
  renderDeckSlides,
} from "../src/js/render.js";
import { renderHtmlDocument } from "../scripts/lib/document.mjs";

const root = path.resolve(import.meta.dirname, "..");
const demo = JSON.parse(await readFile(path.join(root, "examples", "demo.deck.json"), "utf8"));

test("demo deck normalizes to the expected structure", () => {
  const deck = normalizeDeck(demo);
  assert.equal(deck.meta.theme, "editorial");
  assert.equal(deck.meta.slug, "course-design");
  assert.equal(deck.slides.length, 12);
  assert.ok(deck.closing);
  assert.equal(deck.slides.some((slide) => slide.layout === "cover"), false);
});

test("cover-only documents contain exactly one cover slide", () => {
  for (const ratio of ["4:3", "3:4"]) {
    const result = renderCoverOnly(demo, ratio);
    assert.equal(result.total, 1);
    assert.equal(result.slides.length, 1);
    assert.match(result.slides[0], /slide--cover/);
    assert.match(result.slides[0], /is-active/);
    assert.match(result.slides[0], new RegExp(`data-ratio="${ratio}"`));
    assert.match(result.slides[0], new RegExp(`data-orientation="${RATIOS[ratio].orientation}"`));
  }
});

test("content documents contain cover + content + closing", () => {
  for (const ratio of ["16:9", "3:5"]) {
    const result = renderDeckSlides(demo, ratio);
    assert.equal(result.total, 14);
    assert.equal(result.slides.length, 14);
    assert.match(result.slides[0], /slide--cover/);
    assert.match(result.slides.at(-1), /data-layout="closing"/);
    assert.match(result.slides[0], new RegExp(`data-ratio="${ratio}"`));
    for (const slide of result.slides) {
      assert.doesNotMatch(slide, /undefined|\[object Object\]|NaN/);
      assert.match(slide, /slide__inner/);
    }
  }
});

test("every layout renders in every ratio without unresolved values", () => {
  const source = {
    meta: { title: "Layout coverage", theme: "tech", slug: "layout-coverage" },
    slides: [
      { layout: "statement", title: "主张", body: "解释" },
      {
        layout: "agenda",
        title: "议程",
        items: [
          { title: "一", text: "说明" },
          { title: "二", text: "说明" },
        ],
      },
      {
        layout: "bullets",
        title: "要点",
        items: [
          { title: "一", text: "说明", tag: "TAG" },
          { title: "二", text: "说明" },
        ],
      },
      { layout: "split", title: "图文", body: "说明", media: { type: "bars", caption: "FIG" } },
      {
        layout: "stats",
        title: "数据",
        items: [
          { value: 92, suffix: "%", label: "一" },
          { value: 3.5, suffix: "x", label: "二" },
        ],
      },
      {
        layout: "timeline",
        title: "时间线",
        items: [
          { date: "01", title: "一", text: "说明" },
          { date: "02", title: "二", text: "说明" },
        ],
      },
      {
        layout: "compare",
        title: "对比",
        items: [
          { title: "A", text: "说明", bullets: ["x"] },
          { title: "B", text: "说明", tone: "accent", bullets: ["y"] },
        ],
      },
      { layout: "quote", quote: "引用", cite: "作者" },
      { layout: "section", index: "01", title: "章节" },
      { layout: "code", title: "代码", code: { content: "const a = 1;", filename: "a.js" } },
      {
        layout: "table",
        title: "表格",
        headers: ["A", "B"],
        rows: [
          ["1", "2"],
          ["3", "4"],
        ],
      },
      { layout: "image", title: "全图", caption: "CAP" },
      { layout: "closing", title: "结束" },
    ],
  };

  assert.equal(source.slides.length, LAYOUTS.length);
  for (const ratio of Object.keys(RATIOS)) {
    const result = RATIOS[ratio].kind === "cover" ? renderCoverOnly(source, ratio) : renderDeckSlides(source, ratio);
    const html = result.slides.join("\n");
    assert.doesNotMatch(html, /undefined|\[object Object\]|NaN/);
    if (RATIOS[ratio].kind === "content") {
      for (const layout of LAYOUTS.map((item) => item.id)) {
        if (layout === "closing") continue;
        assert.match(html, new RegExp(`data-layout="${layout}"`));
      }
    }
  }
});

test("HTML is escaped and inline markdown is limited to safe constructs", () => {
  assert.equal(escapeHtml('<script>alert("x")</script>'), "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
  assert.match(inline("**bold** `code`"), /<strong>bold<\/strong> <code>code<\/code>/);
  assert.doesNotMatch(inline("[x](javascript:alert(1))"), /<a /);
  assert.match(inline("[x](https://example.com)"), /<a href="https:\/\/example.com"/);

  const result = renderCoverOnly(
    { meta: { title: "<img src=x onerror=alert(1)>" }, slides: [] },
    "4:3",
  );
  assert.doesNotMatch(result.slides[0], /<img src=x/);
  assert.match(result.slides[0], /&lt;img/);
});

test("standalone document embeds CSS, runtime and a print page size", async () => {
  const html = renderHtmlDocument({
    deck: demo,
    ratio: "3:5",
    kind: "content",
    css: ":root{--test:1}",
    runtime: "/* runtime */",
  });
  assert.match(html, /^<!doctype html>/);
  assert.match(html, /@page \{ size: 900px 1500px; margin: 0; \}/);
  assert.match(html, /data-ratio="3:5"/);
  assert.match(html, /\/\* runtime \*\//);
  assert.match(html, /deck__ui/);
  assert.doesNotMatch(html, /undefined|\[object Object\]/);
});

test("all themes are declared", () => {
  assert.equal(THEMES.length, 8);
  assert.deepEqual(
    THEMES.map((theme) => theme.id),
    ["editorial", "scholar", "beamer", "tech", "software", "consulting", "ink", "custom"],
  );
});

test("custom appearance produces safe inline tokens", () => {
  const result = renderDeckSlides(
    {
      meta: { title: "Custom", theme: "custom" },
      appearance: {
        colors: { bg: "#101820", bg2: "#1e293b", ink: "#f8fafc", muted: "#94a3b8", accent: "#f97316", accent2: "#22d3ee" },
        background: { type: "glass", angle: 160 },
        typography: {
          displayFont: '"Noto Serif SC", serif',
          bodyFont: '"Noto Sans SC", sans-serif',
          baseScale: 1.1,
          titleScale: 1.05,
          bodyScale: 1.2,
          kickerScale: 1.1,
        },
      },
      slides: [{ layout: "statement", title: "自定义主题" }],
    },
    "16:9",
  );
  assert.equal(result.bgEffect, "glass");
  assert.match(result.style, /--accent:#f97316/);
  assert.match(result.style, /--display:&quot;|--display:"Noto Serif SC"/);
  assert.match(result.style, /--type-scale:1.1/);
  assert.match(result.style, /--bg-angle:160deg/);
  assert.equal(result.deck.meta.theme, "custom");
});

test("invalid appearance values are dropped by normalization", () => {
  const result = renderCoverOnly(
    {
      meta: { title: "Unsafe" },
      appearance: {
        colors: { bg: "javascript:alert(1)", accent: "red; background:url(x)" },
        background: { type: "gradient", angle: 999 },
        typography: { displayFont: 'x; } body { background:red', baseScale: 99 },
      },
      slides: [],
    },
    "4:3",
  );
  assert.equal(result.bgEffect, "gradient");
  assert.doesNotMatch(result.style, /javascript|background:url|evil/);
  assert.match(result.style, /--bg-angle:360deg/);
  assert.match(result.style, /--type-scale:1.8/);
});
