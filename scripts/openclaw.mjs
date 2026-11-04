#!/usr/bin/env node
/**
 * OpenClaw-facing CLI. Every command prints one JSON document on stdout.
 *
 *   node scripts/openclaw.mjs info
 *   node scripts/openclaw.mjs validate --input - < deck.json
 *   node scripts/openclaw.mjs render --input deck.json --out exports/my-deck --formats all
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  BuildError,
  FORMAT_ORDER,
  buildDeck,
  parseFormats,
  slugify,
} from "./lib/build.mjs";
import { validateDeck } from "./lib/validate.mjs";
import {
  LAYOUTS,
  RATIOS,
  THEMES,
  VERSION,
  normalizeDeck,
} from "../src/js/render.js";

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      args._.push(token);
      continue;
    }
    const key = token.slice(2);
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

async function readDeck(args) {
  const input = args.input || "-";
  let source;
  if (input === "-") source = await readStdin();
  else source = await readFile(path.resolve(input), "utf8");
  if (!source.trim()) {
    throw new BuildError("没有读取到 deck JSON。请通过 --input 文件或 stdin 传入。");
  }
  try {
    return JSON.parse(source);
  } catch (error) {
    throw new BuildError(`JSON 解析失败：${error.message}`);
  }
}

function info() {
  return {
    ok: true,
    name: "html-ppt-template",
    version: VERSION,
    description:
      "Zero-dependency animated HTML presentation templates. One deck JSON exports 16:9 content, 4:3 cover, 3:4 cover and 3:5 portrait content.",
    commands: {
      info: "node scripts/openclaw.mjs info",
      validate: "node scripts/openclaw.mjs validate --input deck.json",
      render: "node scripts/openclaw.mjs render --input deck.json --out exports/my-deck --formats all",
    },
    http: {
      server: "npm run dev",
      render: "POST http://127.0.0.1:4173/api/openclaw/render",
      validate: "POST http://127.0.0.1:4173/api/validate",
    },
    themes: THEMES,
    ratios: Object.values(RATIOS),
    layouts: LAYOUTS,
    defaults: {
      theme: "editorial",
      formats: FORMAT_ORDER,
      input: "examples/demo.deck.json",
    },
    schema: "openclaw/deck.schema.json",
    skill: "openclaw/SKILL.md",
    docs: "docs/projects/html-ppt-template/index.md",
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0] || "info";

  if (command === "info" || command === "template") {
    console.log(JSON.stringify(info(), null, 2));
    return;
  }

  if (command === "validate") {
    const deck = await readDeck(args);
    const result = validateDeck(deck);
    const normalized = normalizeDeck(deck);
    console.log(
      JSON.stringify(
        {
          ...result,
          slug: slugify(normalized.meta.slug || normalized.meta.title),
          title: normalized.meta.title,
          theme: normalized.meta.theme,
        },
        null,
        2,
      ),
    );
    if (!result.ok) process.exitCode = 1;
    return;
  }

  if (command === "render") {
    const deck = await readDeck(args);
    const validation = validateDeck(deck);
    if (!validation.ok) {
      console.log(JSON.stringify({ ok: false, stage: "validate", ...validation }, null, 2));
      process.exitCode = 1;
      return;
    }
    const formats = parseFormats(args.formats || "all");
    const theme = args.theme || deck.meta?.theme;
    const normalized = normalizeDeck(deck);
    const outDir = args.out || path.join("exports", `${slugify(normalized.meta.slug || normalized.meta.title)}${theme ? `-${theme}` : ""}`);
    const result = await buildDeck({ deck, outDir, theme, formats });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "demo") {
    console.log(
      JSON.stringify(
        {
          ok: true,
          file: "examples/demo.deck.json",
          hint: "cat examples/demo.deck.json | node scripts/openclaw.mjs render --input - --out exports/demo",
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log(
    JSON.stringify(
      { ok: false, error: `未知命令 "${command}"。可用命令：info / validate / render / demo。` },
      null,
      2,
    ),
  );
  process.exitCode = 1;
}

main().catch((error) => {
  const payload =
    error instanceof BuildError
      ? { ok: false, error: error.message, ...error.details }
      : { ok: false, error: error.message };
  console.log(JSON.stringify(payload, null, 2));
  process.exitCode = 1;
});
