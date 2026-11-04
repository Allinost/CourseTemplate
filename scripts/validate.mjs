#!/usr/bin/env node
/**
 * CLI: node scripts/validate.mjs --input examples/demo.deck.json
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

import { validateDeck } from "./lib/validate.mjs";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith("--")) continue;
    const key = argv[i].slice(2);
    if (key === "json" || key === "quiet") {
      args[key] = true;
      continue;
    }
    args[key] = argv[i + 1];
    i += 1;
  }
  return args;
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const input = args.input || "examples/demo.deck.json";
  const source = input === "-" ? await readStdin() : await readFile(path.resolve(input), "utf8");
  let deck;
  try {
    deck = JSON.parse(source);
  } catch (error) {
    const result = { ok: false, errors: [{ path: "$", message: `JSON 解析失败：${error.message}` }], warnings: [] };
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = 1;
    return;
  }
  const result = validateDeck(deck);
  if (args.json || !process.stdout.isTTY) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(result.ok ? "OK" : "FAILED");
    if (result.stats) {
      console.log(`  title:   ${result.stats.title}`);
      console.log(`  theme:   ${result.stats.theme}`);
      console.log(`  slides:  ${result.stats.totalSlides}`);
      console.log(`  layouts: ${Object.entries(result.stats.layouts).map(([key, count]) => `${key}×${count}`).join(", ")}`);
    }
    for (const item of result.errors) console.log(`  error ${item.path}: ${item.message}`);
    for (const item of result.warnings) console.log(`  warning ${item.path}: ${item.message}`);
  }
  process.exitCode = result.ok ? 0 : 1;
}

main().catch((error) => {
  console.log(JSON.stringify({ ok: false, errors: [{ path: "$", message: error.message }], warnings: [] }, null, 2));
  process.exitCode = 1;
});
