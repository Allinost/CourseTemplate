# 03 · OpenClaw 接口

> 本文件是 CLI / HTTP 的契约。字段变更必须同步 `openclaw/manifest.json`、`openclaw/deck.schema.json` 与测试。

## 1. 集成方式

| 方式 | 适用 | 入口 |
|---|---|---|
| CLI + stdin | OpenClaw / CI / 本地 agent | `node scripts/openclaw.mjs` |
| HTTP | 工作台、远程编排、跨进程 | `npm run dev` + `POST /api/openclaw/render` |
| 直接渲染 | Web 前端复用 | `src/js/render.js` |
| 截图 | 发布 PNG | `node scripts/screenshot.mjs` |

OpenClaw 推荐流程：

1. 读 `openclaw/SKILL.md` 与 `openclaw/deck.schema.json`；
2. 生成 `deck.json`；
3. `validate`；
4. `render`；
5. 把返回的文件路径交给用户，或继续 `screenshot`。

## 2. CLI

### 2.1 `info`

```bash
node scripts/openclaw.mjs info
```

返回主题、比例、版式、默认值、schema 路径、CLI/HTTP 示例。

### 2.2 `validate`

```bash
node scripts/openclaw.mjs validate --input deck.json
# 或
cat deck.json | node scripts/openclaw.mjs validate --input -
```

返回：

```json
{
  "ok": true,
  "errors": [],
  "warnings": [],
  "stats": {
    "title": "...",
    "theme": "editorial",
    "contentSlides": 12,
    "totalSlides": 14,
    "layouts": { "statement": 1, "bullets": 2 },
    "ratios": ["16:9", "4:3", "3:4", "3:5"]
  },
  "slug": "course-design"
}
```

- `errors`：阻断导出；每条含 `path` / `message`。
- `warnings`：不阻断，但建议处理（长度、页数、未知动画等）。
- 退出码：`ok=true` → 0；否则 1。

### 2.3 `render`

```bash
node scripts/openclaw.mjs render \
  --input deck.json \
  --out exports/my-deck \
  --formats all \
  --theme editorial
```

| 参数 | 默认 | 说明 |
|---|---|---|
| `--input` | `-`（stdin） | 输入 JSON 文件；`-` 表示 stdin |
| `--out` | `exports/<slug>[-theme]` | 输出目录 |
| `--formats` | `all` | `all` 或逗号列表：`16:9,4:3,3:4,3:5`；也接受 `3x5` |
| `--theme` | `deck.meta.theme` | 覆盖主题 |

成功返回：

```json
{
  "ok": true,
  "outDir": "C:/.../exports/my-deck",
  "slug": "my-deck",
  "title": "...",
  "theme": "editorial",
  "themeName": "纸感杂志",
  "ratioSummary": "16:9 / 4:3 / 3:4 / 3:5",
  "slides": 14,
  "files": [
    {
      "ratio": "16:9",
      "label": "横版内容",
      "kind": "content",
      "width": 1600,
      "height": 900,
      "file": "deck-16x9.html",
      "path": "C:/.../deck-16x9.html",
      "url": "/exports/my-deck/deck-16x9.html",
      "slides": 14
    }
  ],
  "manifest": { "...": "..." },
  "warnings": []
}
```

失败时 stdout 仍是 JSON：

```json
{
  "ok": false,
  "stage": "validate",
  "errors": [{ "path": "$.slides[0].title", "message": "观点页需要 title。" }],
  "warnings": []
}
```

### 2.4 输出文件

| 文件 | 内容 |
|---|---|
| `deck-16x9.html` | 16:9 封面 + 内容 + 结尾 |
| `cover-4x3.html` | 4:3 封面 |
| `cover-3x4.html` | 3:4 封面 |
| `deck-3x5.html` | 3:5 封面 + 内容 + 结尾 |
| `deck.json` | 实际渲染的内容快照 |
| `manifest.json` | 格式、尺寸、页数、主题、warnings |
| `index.html` | 单 deck 的格式入口（构建 CLI 默认生成） |

`manifest.json` 关键字段：

```json
{
  "template": "html-ppt-template",
  "version": "1.0.0",
  "generatedAt": "...",
  "slug": "my-deck",
  "theme": "editorial",
  "stats": { "contentSlides": 12, "totalSlides": 14, "layouts": ["statement"] },
  "formats": {
    "16:9": { "file": "deck-16x9.html", "kind": "content", "width": 1600, "height": 900, "slides": 14 }
  },
  "files": [{ "ratio": "16:9", "url": "/exports/my-deck/deck-16x9.html" }],
  "warnings": []
}
```

## 3. HTTP

启动：

```bash
npm run dev
# 默认 127.0.0.1:4173
```

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/health` | 健康检查 |
| GET | `/api/template` | 主题/比例/版式元数据 |
| POST | `/api/validate` | 校验，body `{ deck }` |
| POST | `/api/render` | 返回单个 HTML 文本，body `{ deck, ratio, theme }` |
| POST | `/api/build` | 写入 `exports/`，返回 manifest 结果 |
| POST | `/api/openclaw/render` | 同 `/api/build`，OpenClaw 语义别名 |
| GET | `/src/` | Studio 工作台 |

### 3.1 构建请求

```bash
curl -X POST http://127.0.0.1:4173/api/openclaw/render \
  -H "Content-Type: application/json" \
  -d '{
    "deck": {
      "meta": { "title": "示例", "theme": "tech" },
      "slides": [{ "layout": "statement", "title": "一句话" }]
    },
    "formats": "all",
    "theme": "tech"
  }'
```

响应为 `render` 的同一 JSON 结构，`outDir` 为相对仓库根的 `exports/...`。

### 3.2 预览请求

```bash
curl -X POST http://127.0.0.1:4173/api/render \
  -H "Content-Type: application/json" \
  -d '{"deck": {...}, "ratio": "3:5"}' \
  --output preview.html
```

返回 `text/html`，`X-HTMLPPT-Ratio` 头标明比例。

### 3.3 状态码

| 状态 | 场景 |
|---|---|
| 200 | 成功 |
| 204 | CORS 预检 |
| 400 | JSON 解析失败 |
| 405 | 方法不允许 |
| 413 | 请求体 >4MB |
| 422 | 校验失败 / 未知比例 |
| 404 | 未知路由或静态文件 |
| 500 | 未捕获异常 |

错误响应统一为：

```json
{ "ok": false, "error": "...", "errors": [], "warnings": [] }
```

## 4. 截图

```bash
node scripts/screenshot.mjs --html exports/my-deck/deck-16x9.html --all
node scripts/screenshot.mjs --html exports/my-deck/cover-3x4.html --slide 1 --out preview/cover.png
```

| 参数 | 说明 |
|---|---|
| `--html` | 必填，构建后的 HTML |
| `--slide` | 单页序号，默认 1 |
| `--all` | 导出全部页面 |
| `--out` | 输出目录或单文件；默认 `preview/<name>-<ratio>` |
| `--width` / `--height` | 覆盖尺寸；默认按 `data-ratio` |
| `--chrome` | Chrome/Edge 可执行文件；也可用 `CHROME_PATH` |

截图 URL 自动附加 `?export=1&slide=N`，运行时冻结动画并填满视口。

## 5. 安全边界

- HTTP 服务默认只绑定 `127.0.0.1`；如需局域网访问，显式 `--host 0.0.0.0`，并自行承担风险。
- 请求体上限 4MB；输出目录固定为仓库 `exports/`，HTTP 请求不能指定任意 `outDir`。
- 所有文本转义；链接协议白名单；图片 URL 协议白名单。
- 生成物不包含远程脚本；内联 runtime 是固定源码。
- 不接受上传文件；调用方传入 JSON。

## 6. 与 developmentManager 的关系

本项目是 `type=template` 的前端模板项目，登记信息见 `project.manifest.json`。OpenClaw/automation 可以通过 developmentManager 的资产接口登记 `openclaw/SKILL.md`、`openclaw/deck.schema.json` 与生成产物索引；模板本身不调用 developmentManager API。
