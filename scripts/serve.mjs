#!/usr/bin/env node
/**
 * Zero-dependency local studio + OpenClaw HTTP bridge.
 *
 *   npm run dev
 *   http://127.0.0.1:4173/src/
 *   POST /api/openclaw/render
 */

import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { LAYOUTS, RATIOS, THEMES, VERSION, normalizeDeck } from "../src/js/render.js";
import { buildDeck, parseFormats, slugify } from "./lib/build.mjs";
import { loadDeckCss, loadRuntime, renderHtmlDocument } from "./lib/document.mjs";
import { validateDeck } from "./lib/validate.mjs";

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const BODY_LIMIT = 4 * 1024 * 1024;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function sendJson(response, status, payload) {
  const body = JSON.stringify(payload, null, 2);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
  });
  response.end(body);
}

function sendText(response, status, body, type = "text/plain; charset=utf-8") {
  response.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
  });
  response.end(body);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > BODY_LIMIT) {
        reject(Object.assign(new Error("请求体超过 4MB 限制。"), { status: 413 }));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw.trim()) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(Object.assign(new Error(`JSON 解析失败：${error.message}`), { status: 400 }));
      }
    });
    request.on("error", reject);
  });
}

function extractDeck(body) {
  if (body && typeof body === "object" && body.deck && typeof body.deck === "object") return body.deck;
  return body;
}

function safeFilePath(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch (_error) {
    return null;
  }
  const resolved = path.resolve(ROOT, `.${decoded}`);
  if (resolved !== ROOT && !resolved.startsWith(`${ROOT}${path.sep}`)) return null;
  return resolved;
}

async function serveStatic(request, response, urlPath) {
  let requested = urlPath;
  if (requested === "/" || requested === "") {
    response.writeHead(302, { Location: "/src/" });
    response.end();
    return;
  }
  if (requested === "/src" || requested === "/src/") requested = "/src/index.html";

  const filePath = safeFilePath(requested);
  if (!filePath) {
    sendText(response, 403, "Forbidden");
    return;
  }
  try {
    const info = await stat(filePath);
    if (info.isDirectory()) {
      const index = path.join(filePath, "index.html");
      const file = await readFile(index);
      sendText(response, 200, file, MIME[".html"]);
      return;
    }
    const file = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    sendText(
      response,
      200,
      file,
      MIME[ext] || "application/octet-stream",
    );
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EISDIR") {
      sendText(response, 404, "Not Found");
      return;
    }
    sendText(response, 500, "Internal Server Error");
  }
}

async function handleApi(request, response, urlPath) {
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Max-Age": "86400",
    });
    response.end();
    return;
  }

  if (request.method === "GET" && urlPath === "/api/health") {
    sendJson(response, 200, { ok: true, name: "html-ppt-template", version: VERSION });
    return;
  }

  if (request.method === "GET" && urlPath === "/api/template") {
    sendJson(response, 200, {
      ok: true,
      name: "html-ppt-template",
      version: VERSION,
      themes: THEMES,
      ratios: Object.values(RATIOS),
      layouts: LAYOUTS,
      defaults: { theme: "editorial", formats: ["16:9", "4:3", "3:4", "3:5"] },
    });
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { ok: false, error: "Method Not Allowed" });
    return;
  }

  const body = await readBody(request);
  const deck = extractDeck(body);

  if (urlPath === "/api/validate") {
    const result = validateDeck(deck);
    sendJson(response, result.ok ? 200 : 422, result);
    return;
  }

  if (urlPath === "/api/render") {
    const ratio = body.ratio || "16:9";
    const ratioMeta = RATIOS[ratio];
    if (!ratioMeta) {
      sendJson(response, 422, { ok: false, error: `不支持的 ratio：${ratio}`, valid: Object.keys(RATIOS) });
      return;
    }
    const sourceDeck = deck && typeof deck === "object" ? deck : {};
    const renderDeck = body.theme
      ? { ...sourceDeck, meta: { ...(sourceDeck.meta && typeof sourceDeck.meta === "object" ? sourceDeck.meta : {}), theme: body.theme } }
      : sourceDeck;
    const validation = validateDeck(renderDeck);
    if (!validation.ok) {
      sendJson(response, 422, { ok: false, stage: "validate", ...validation });
      return;
    }
    const css = await loadDeckCss();
    const runtime = await loadRuntime();
    const html = renderHtmlDocument({
      deck: renderDeck,
      ratio,
      kind: ratioMeta.kind,
      css,
      runtime,
    });
    response.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "X-HTMLPPT-Ratio": ratio,
    });
    response.end(html);
    return;
  }

  if (urlPath === "/api/build" || urlPath === "/api/openclaw/render") {
    const validation = validateDeck(deck);
    if (!validation.ok) {
      sendJson(response, 422, { ok: false, stage: "validate", ...validation });
      return;
    }
    let formats;
    try {
      formats = parseFormats(body.formats || "all");
    } catch (error) {
      sendJson(response, 422, { ok: false, error: error.message, details: error.details });
      return;
    }
    const normalized = normalizeDeck(deck);
    const theme = body.theme || normalized.meta.theme;
    const slug = slugify(normalized.meta.slug || normalized.meta.title);
    const outDir = path.join(ROOT, "exports", `${slug}${theme ? `-${theme}` : ""}`);
    const result = await buildDeck({ deck, outDir, theme, formats });
    sendJson(response, 200, { ...result, outDir: path.relative(ROOT, result.outDir).split(path.sep).join("/") });
    return;
  }

  sendJson(response, 404, { ok: false, error: "Unknown API route" });
}

export function createServer() {
  return http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    try {
      if (requestUrl.pathname.startsWith("/api/")) {
        await handleApi(request, response, requestUrl.pathname);
        return;
      }
      await serveStatic(request, response, requestUrl.pathname);
    } catch (error) {
      if (!response.headersSent) {
        sendJson(response, error.status || 500, {
          ok: false,
          error: error.message || "Internal Server Error",
        });
      }
    }
  });
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith("--")) continue;
    args[argv[i].slice(2)] = argv[i + 1];
    i += 1;
  }
  return args;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  const port = Number(args.port || process.env.PORT || 4173);
  const host = args.host || "127.0.0.1";
  const server = createServer();
  server.listen(port, host, () => {
    console.log("");
    console.log("  HTML PPT Studio");
    console.log(`  Studio   http://${host}:${port}/src/`);
    console.log(`  API      http://${host}:${port}/api/health`);
    console.log(`  OpenClaw http://${host}:${port}/api/openclaw/render`);
    console.log("");
  });
}
