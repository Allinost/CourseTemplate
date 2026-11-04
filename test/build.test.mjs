import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { FORMAT_ORDER, buildDeck, parseFormats } from "../scripts/lib/build.mjs";
import { validateDeck } from "../scripts/lib/validate.mjs";

const root = path.resolve(import.meta.dirname, "..");
const demo = JSON.parse(await readFile(path.join(root, "examples", "demo.deck.json"), "utf8"));

test("demo deck validates without errors", () => {
  const result = validateDeck(demo);
  assert.equal(result.ok, true);
  assert.equal(result.errors.length, 0);
  assert.equal(result.stats.totalSlides, 14);
});

test("validation catches broken content", () => {
  const result = validateDeck({
    meta: {},
    slides: [
      { layout: "stats", title: "x", items: [] },
      { layout: "unknown", title: "y" },
      { layout: "code", title: "z" },
    ],
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((item) => item.path === "$.meta.title"));
  assert.ok(result.errors.some((item) => item.path.includes("items")));
  assert.ok(result.errors.some((item) => item.path.includes("layout")));
  assert.ok(result.errors.some((item) => item.path.includes("code.content")));
});

test("formats parse and reject unknown ratios", () => {
  assert.deepEqual(parseFormats("all"), FORMAT_ORDER);
  assert.deepEqual(parseFormats("16:9,3x5"), ["16:9", "3:5"]);
  assert.throws(() => parseFormats("16:9,1:1"), /不支持的导出比例/);
});

test("build writes four standalone HTML files and a manifest", async () => {
  const workDir = await mkdtemp(path.join(tmpdir(), "htmlppt-build-"));
  try {
    const result = await buildDeck({
      deck: demo,
      outDir: path.join(workDir, "deck"),
      formats: FORMAT_ORDER,
      writeGallery: true,
    });
    assert.equal(result.ok, true);
    assert.equal(result.files.length, 4);
    assert.deepEqual(
      result.files.map((file) => file.ratio),
      ["16:9", "4:3", "3:4", "3:5"],
    );

    for (const file of result.files) {
      const info = await stat(file.path);
      assert.ok(info.size > 1000);
      const html = await readFile(file.path, "utf8");
      assert.match(html, /^<!doctype html>/);
      assert.match(html, /data-deck/);
      assert.match(html, new RegExp(`data-ratio="${file.ratio}"`));
      assert.doesNotMatch(html, /undefined|\[object Object\]|NaN/);
      if (file.kind === "cover") {
        assert.equal((html.match(/<section class="slide/g) || []).length, 1);
      } else {
        assert.ok((html.match(/<section class="slide/g) || []).length > 2);
      }
    }

    const manifest = JSON.parse(await readFile(path.join(result.outDir, "manifest.json"), "utf8"));
    assert.equal(manifest.theme, "editorial");
    assert.equal(manifest.formats["16:9"].width, 1600);
    assert.equal(manifest.formats["3:5"].height, 1500);

    const deckJson = JSON.parse(await readFile(path.join(result.outDir, "deck.json"), "utf8"));
    assert.equal(deckJson.meta.slug, "course-design");

    const gallery = await readFile(path.join(result.outDir, "index.html"), "utf8");
    assert.match(gallery, /deck-16x9\.html/);
    assert.match(gallery, /cover-3x4\.html/);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
});

test("build can override the theme", async () => {
  const workDir = await mkdtemp(path.join(tmpdir(), "htmlppt-theme-"));
  try {
    const result = await buildDeck({
      deck: demo,
      outDir: path.join(workDir, "deck"),
      theme: "tech",
      formats: ["16:9"],
      writeGallery: false,
    });
    assert.equal(result.theme, "tech");
    const html = await readFile(result.files[0].path, "utf8");
    assert.match(html, /data-theme="tech"/);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
});
