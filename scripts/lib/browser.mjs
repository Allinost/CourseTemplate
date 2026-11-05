/**
 * One persistent Chrome/Edge session for screenshots and visual checks.
 * A single browser process hosts multiple page targets (tabs), so batch
 * screenshots can run in parallel without opening a new browser per image.
 */

import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export function findChrome(explicit) {
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
      if (existsSync(candidate)) return candidate;
    } catch (_error) {
      /* keep looking */
    }
  }
  return null;
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.waiters = new Map();
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result);
        return;
      }
      if (message.method && this.waiters.has(message.method)) {
        const list = this.waiters.get(message.method);
        this.waiters.delete(message.method);
        list.forEach(({ resolve, timer }) => {
          clearTimeout(timer);
          resolve(message.params);
        });
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      this.id += 1;
      this.pending.set(this.id, { resolve, reject });
      this.ws.send(JSON.stringify({ id: this.id, method, params }));
    });
  }

  once(method, timeout = 15000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const list = this.waiters.get(method) || [];
        this.waiters.set(method, list.filter((item) => item.resolve !== resolve));
        reject(new Error(`Timed out waiting for ${method}`));
      }, timeout);
      const list = this.waiters.get(method) || [];
      list.push({ resolve, reject, timer });
      this.waiters.set(method, list);
    });
  }
}

async function fetchJson(url, attempts = 60, init = {}) {
  for (let index = 0; index < attempts; index += 1) {
    try {
      const response = await fetch(url, init);
      if (response.ok) return response.json();
    } catch (_error) {
      /* browser is still starting */
    }
    await delay(200);
  }
  throw new Error(`无法连接浏览器调试端口：${url}`);
}

async function connectPage(target) {
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  const cdp = new Cdp(ws);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1600,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  return {
    ws,
    cdp,
    async navigate({ url, width = 1600, height = 900 }) {
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: false,
      });
      const loaded = cdp.once("Page.loadEventFired").catch(() => null);
      await cdp.send("Page.navigate", { url });
      await loaded;
      await cdp.send("Runtime.evaluate", {
        expression: "document.fonts && document.fonts.ready ? document.fonts.ready.then(() => true) : true",
        awaitPromise: true,
      });
      await cdp.send("Runtime.evaluate", { expression: "window.scrollTo(0, 0)" });
      await delay(80);
    },
    async capture({ url, width = 1600, height = 900, output }) {
      await this.navigate({ url, width, height });
      await delay(1120);
      const shot = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true });
      await mkdir(path.dirname(output), { recursive: true });
      await writeFile(output, Buffer.from(shot.data, "base64"));
      const info = await stat(output);
      if (!info.size) throw new Error(`截图文件为空：${output}`);
      return { output, width, height };
    },
    async evaluate(expression) {
      const result = await cdp.send("Runtime.evaluate", {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });
      return result.result?.value;
    },
    async screenshot(output) {
      const shot = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true });
      await mkdir(path.dirname(output), { recursive: true });
      await writeFile(output, Buffer.from(shot.data, "base64"));
      return output;
    },
    close() {
      try {
        ws.close();
      } catch (_error) {
        /* ignore */
      }
    },
  };
}

export async function createBrowser(options = {}) {
  const chrome = findChrome(options.chrome);
  if (!chrome) {
    throw new Error("未找到 Chrome/Edge。请用 --chrome 指定可执行文件，或设置 CHROME_PATH。");
  }
  const port = options.port || 9300 + Math.floor(Math.random() * 500);
  const profile = await mkdtemp(path.join(tmpdir(), "htmlppt-browser-"));
  const child = spawn(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      "about:blank",
    ],
    { windowsHide: true, stdio: "ignore" },
  );

  await fetchJson(`http://127.0.0.1:${port}/json/version`);
  const targets = await fetchJson(`http://127.0.0.1:${port}/json`);
  const target = targets.find((item) => item.type === "page");
  if (!target) throw new Error("浏览器没有可用的 page target。");

  const pages = [await connectPage(target)];
  const initialPage = pages[0];

  async function createPage() {
    let newTarget;
    try {
      newTarget = await fetchJson(`http://127.0.0.1:${port}/json/new?about:blank`, 10, { method: "PUT" });
    } catch (_error) {
      newTarget = await fetchJson(`http://127.0.0.1:${port}/json/new?about:blank`, 10);
    }
    const page = await connectPage(newTarget);
    pages.push(page);
    return page;
  }

  return {
    chrome,
    port,
    createPage,
    navigate: (task) => initialPage.navigate(task),
    capture: (task) => initialPage.capture(task),
    evaluate: (expression) => initialPage.evaluate(expression),
    screenshot: (output) => initialPage.screenshot(output),
    async captureMany(tasks, options = {}) {
      const concurrency = Math.max(1, Math.min(options.concurrency || 4, tasks.length || 1));
      while (pages.length < concurrency) await createPage();
      const pool = pages.slice(0, concurrency);
      const results = new Array(tasks.length);
      let cursor = 0;
      await Promise.all(
        pool.map(async (page) => {
          while (true) {
            const index = cursor;
            cursor += 1;
            if (index >= tasks.length) return;
            results[index] = await page.capture(tasks[index]);
          }
        }),
      );
      return results;
    },
    async close() {
      pages.forEach((page) => page.close());
      if (process.platform === "win32") {
        spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
          windowsHide: true,
          stdio: "ignore",
        });
        const script = [
          "$profile = '" + profile.replace(/'/g, "''") + "';",
          "Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" |",
          "Where-Object { $_.CommandLine -and $_.CommandLine.Contains($profile) } |",
          "ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }",
        ].join(" ");
        spawnSync("powershell.exe", ["-NoProfile", "-Command", script], {
          windowsHide: true,
          stdio: "ignore",
        });
      } else {
        child.kill();
      }
      await delay(250);
      await rm(profile, { recursive: true, force: true }).catch(() => {});
    },
  };
}
