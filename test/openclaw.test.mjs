import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const cli = path.join(root, "scripts", "openclaw.mjs");
const demoPath = path.join(root, "examples", "demo.deck.json");

function run(args, input) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    encoding: "utf8",
    input,
    env: { ...process.env, NO_COLOR: "1" },
  });
}

test("openclaw info returns a machine-readable contract", () => {
  const result = run(["info"]);
  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.name, "html-ppt-template");
  assert.equal(payload.ratios.length, 4);
  assert.equal(payload.themes.length, 8);
  assert.equal(payload.layouts.length, 13);
});

test("openclaw validate accepts demo from a file", () => {
  const result = run(["validate", "--input", demoPath]);
  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.errors.length, 0);
});

test("openclaw validate rejects invalid JSON through stdin", () => {
  const result = run(["validate", "--input", "-"], "{ not json");
  assert.equal(result.status, 1);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, false);
});

test("openclaw render writes the requested formats", async () => {
  const workDir = await mkdtemp(path.join(tmpdir(), "htmlppt-openclaw-"));
  try {
    const deck = await readFile(demoPath, "utf8");
    const result = run(["render", "--input", "-", "--out", path.join(workDir, "deck"), "--formats", "16:9,4:3"], deck);
    assert.equal(result.status, 0, result.stderr);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.ok, true);
    assert.equal(payload.files.length, 2);
    const html = await readFile(payload.files[0].path, "utf8");
    assert.match(html, /data-ratio="16:9"/);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
});
