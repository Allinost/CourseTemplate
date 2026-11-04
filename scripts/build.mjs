#!/usr/bin/env node
/**
 * CLI: node scripts/build.mjs --input examples/demo.deck.json --out exports/my-deck
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

import { BuildError, FORMAT_ORDER, buildAllThemes, buildDeck, parseFormats, slugify } from "./lib/build.mjs";
import { validateDeck } from "./lib/validate.mjs";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    if (key === "all-themes" || key === "json" || key === "quiet") {
      args[key] = true;
      continue;
    }
    const value = argv[i + 1];
    if (value === undefined || value.startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = value;
    i += 1;
  }
  return args;
}

async function readJson(input) {
  const source = input && input !== "-" ? await readFile(path.resolve(input), "utf8") : await readStdin();
  try {
    return JSON.parse(source);
  } catch (error) {
    throw new BuildError(`JSON 解析失败：${error.message}`, { input });
  }
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
  const deck = await readJson(input);

  if (args["all-themes"]) {
    const outRoot = args.out || "dist";
    const result = await buildAllThemes({ deck, outRoot });
    if (args.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    console.log(`Built ${result.results.length} themes -> ${path.relative(process.cwd(), result.outDir)}`);
    console.log(`Gallery: ${path.relative(process.cwd(), result.gallery)}`);
    for (const item of result.results) {
      console.log(`  ${item.theme.padEnd(10)} ${item.files.length} files  ${path.relative(process.cwd(), item.outDir)}`);
    }
    return;
  }

  const formats = parseFormats(args.formats || "all");
  const validation = validateDeck(deck);
  if (!validation.ok) {
    throw new BuildError("内容校验失败，未生成文件。", validation);
  }
  if (validation.warnings.length) {
    for (const warning of validation.warnings) {
      console.warn(`warning ${warning.path}: ${warning.message}`);
    }
  }

  const theme = args.theme || deck.meta?.theme;
  const outDir = args.out || path.join("exports", `${slugify(deck.meta?.slug || deck.meta?.title || "deck")}${theme ? `-${theme}` : ""}`);
  const result = await buildDeck({ deck, outDir, theme, formats });
  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`Built "${result.title}" (${result.theme}) -> ${path.relative(process.cwd(), result.outDir)}`);
  for (const file of result.files) {
    console.log(`  ${file.ratio.padEnd(5)} ${file.kind.padEnd(7)} ${String(file.width).padStart(4)}x${String(file.height).padEnd(4)}  ${path.relative(process.cwd(), file.path)}`);
  }
  console.log(`Formats: ${FORMAT_ORDER.join(", ")}`);
}

main().catch((error) => {
  if (error instanceof BuildError) {
    console.error(error.message);
    if (error.details?.errors?.length) {
      for (const item of error.details.errors) console.error(`  ${item.path}: ${item.message}`);
    }
    if (error.details?.warnings?.length) {
      for (const item of error.details.warnings) console.error(`  warning ${item.path}: ${item.message}`);
    }
    process.exitCode = 1;
    return;
  }
  console.error(error);
  process.exitCode = 1;
});
