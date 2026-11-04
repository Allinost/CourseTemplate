# HTML PPT Template

> 一份内容，四种画布。零依赖、带动画、可由 OpenClaw 直接生成。

一套面向课程、知识分享、产品发布与小红书图文场景的 HTML PPT 模板组。内容只写一次 `deck.json`，渲染器自动编排为：

| 比例 | 用途 | 像素 | 典型版式 |
|---|---|---|---|
| **16 : 9** | 横版内容 | 1600 × 900 | 双栏、宽时间线、横向对比 |
| **4 : 3** | 横版封面 | 1200 × 900 | 标题优先，视觉锚点靠右 |
| **3 : 4** | 竖版封面 | 900 × 1200 | 标题上移，视觉元素下沉 |
| **3 : 5** | 竖版内容 | 900 × 1500 | 单栏堆叠、纵向时间线、2×2 数据 |

所有产物都是**独立 HTML**：CSS、运行时与内容全部内联，双击即可演示，也可用本地 Chrome 无头模式批量截图 PNG。

> 移动端 / 桌面端：Studio 默认「跟随窗口」，横屏自动 16:9、竖屏自动 3:5；正文与标题字号已按画布放大，并可按用户外观倍率继续调整。16:9 适合电脑/投影，3:5 适合手机图文与竖屏浏览。

## 特性

- **一份内容，四种画布**：内容与版式解耦，横版 / 竖版共享同一份语义。
- **动态自适应**：CSS Container Queries + 字号密度自动收缩（autofit），长内容不会溢出画布。
- **4 套预设主题 + 自定义主题**：纸感杂志 `editorial`、深空极客 `tech`、咨询报告 `consulting`、黑白宣言 `ink`，以及可自由配色的 `custom`。
- **13 种内容版式**：观点、议程、要点、图文、数据、时间线、对比、引用、章节、代码、表格、全图、结尾。
- **动画系统**：入场、错峰、数字滚动、环境动效、卡片生长；支持 `prefers-reduced-motion`。
- **演示交互**：键盘翻页、触摸滑动、全屏、总览、进度条、URL 定位。
- **零依赖**：不需要 npm install，不需要构建工具，不需要联网字体。
- **OpenClaw 原生接口**：JSON Schema + `SKILL.md` + CLI + 本地 HTTP 桥。
- **可截图**：`?export=1&slide=N` 冻结动画，输出精确尺寸 PNG。
- **可打印**：每页一张，页面尺寸由导出格式注入。

## 快速开始

环境：Node.js ≥ 20（仅用于本地工作台、构建与截图，产物本身不需要 Node）。

```bash
# 1. 打开工作台（零依赖）
npm run dev
# http://127.0.0.1:4173/src/

# 2. 构建示例的五套主题
npm run build
# dist/index.html 是主题画廊

# 3. 构建单个 deck
node scripts/build.mjs --input examples/demo.deck.json --out exports/course-design --theme editorial

# 4. 校验内容
node scripts/validate.mjs --input examples/demo.deck.json

# 5. 全量自检
npm run check
```

构建产物：

```text
exports/course-design/
├── deck-16x9.html      # 16:9 横版内容（封面 + 内容 + 结尾）
├── cover-4x3.html      # 4:3 横版封面
├── cover-3x4.html      # 3:4 竖版封面
├── deck-3x5.html       # 3:5 竖版内容（封面 + 内容 + 结尾）
├── deck.json           # 实际渲染的内容快照
├── manifest.json       # 机器可读的产物清单
└── index.html          # 本 deck 的格式入口
```

## 使用 Studio

Studio 是 `src/index.html`，必须通过本地 HTTP 服务打开：

1. 在项目根目录运行：
   ```bash
   npm run dev
   ```
2. 打开：
   ```text
   http://127.0.0.1:4173/src/
   ```
   也可以先打开根目录 `index.html`，按页面提示启动服务后点「进入 Studio」。
3. 界面分区：
   - **左侧**：主题、画布比例（默认跟随窗口）、外观/自定义配色、页面列表
   - **中间**：实时预览；点「专注预览」可隐藏两侧栏，把画布放大到接近全屏（字号也随之放大）
   - **右侧**：OpenClaw 命令、内容 JSON、校验/格式化、导出结果
4. 编辑 JSON 后点「应用并预览」；点「导出四种格式」会在 `exports/<slug>-<theme>/` 生成独立 HTML。
5. 直接双击 `index.html` 属于 `file://` 打开，浏览器会拦截 ES Module 和示例 JSON 请求，所以必须用 `npm run dev`。

> 提示：觉得预览字小，优先点顶部的「专注预览」；导出 HTML 本身已使用放大后的字号。

## 内容模型

最小结构：

```json
{
  "meta": {
    "title": "把知识做成一场演出",
    "subtitle": "课程设计与视觉节奏",
    "organization": "ALLINOST ACADEMY",
    "date": "2026.11",
    "theme": "editorial",
    "slug": "course-design"
  },
  "cover": {
    "kicker": "COURSE DESIGN / 2026",
    "badge": "TEACHING DECK",
    "meta": ["COURSE DESIGN", "12 LESSONS", "2026.11"],
    "note": "ADAPTIVE DECK · 16:9 / 3:5"
  },
  "slides": [
    {
      "layout": "statement",
      "kicker": "THE THESIS",
      "title": "好课程不是信息的搬运，而是**注意力的编排**。",
      "body": "学习发生在注意力被接住的那几秒。"
    },
    {
      "layout": "bullets",
      "title": "一条好内容的三次呼吸",
      "items": [
        { "title": "接住", "text": "用一个反常识开场。", "tag": "HOOK" },
        { "title": "展开", "text": "用结构降低理解成本。", "tag": "BODY" },
        { "title": "收束", "text": "留下一个可带走的句子。", "tag": "PAYOFF" }
      ]
    }
  ],
  "closing": {
    "title": "现在，开始构建",
    "items": [{ "label": "Template", "value": "html-ppt-template" }]
  }
}
```

字段、约束与每种版式的必填项见 [`docs/projects/html-ppt-template/02-content-model.md`](docs/projects/html-ppt-template/02-content-model.md) 与 [`openclaw/deck.schema.json`](openclaw/deck.schema.json)。

`title` / `body` 支持轻量 Markdown：`**粗体**`、`*斜体*`、`` `代码` ``、`[链接](https://...)` 与换行。所有内容在进入 HTML 前都会被转义。

## OpenClaw 调用

OpenClaw 先读 schema，再生成 JSON，最后调用 CLI：

```bash
node scripts/openclaw.mjs info
node scripts/openclaw.mjs validate --input deck.json
node scripts/openclaw.mjs render --input deck.json --out exports/my-deck --formats all
```

`render` 只向 stdout 输出一个 JSON 文档，包含 `ok`、`outDir`、四个 `files` 与 `warnings`。失败时输出 `{ "ok": false, ... }` 并以非零状态退出。

HTTP 模式：

```bash
npm run dev
curl -X POST http://127.0.0.1:4173/api/openclaw/render \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

```json
{
  "deck": { "meta": { "title": "..." }, "slides": [] },
  "formats": "all",
  "theme": "editorial"
}
```

接口清单：`GET /api/health`、`GET /api/template`、`POST /api/validate`、`POST /api/render`、`POST /api/build`、`POST /api/openclaw/render`。完整说明见 [`docs/projects/html-ppt-template/03-openclaw-interface.md`](docs/projects/html-ppt-template/03-openclaw-interface.md)。

## 主题

| id | 名称 | 气质 | 适用 |
|---|---|---|---|
| `editorial` | 纸感杂志 | 暖纸、衬线大标题、陶土红 / 墨绿 | 课程、文化、品牌叙事 |
| `tech` | 深空极客 | 深空蓝、青色辉光、网格与扫描线 | 技术分享、产品发布、B 站科普 |
| `consulting` | 咨询报告 | 冷白、结构线、蓝色 + 琥珀强调 | 研究报告、商业提案、数据复盘 |
| `ink` | 黑白宣言 | 高对比黑底、巨型描边字、朱红 | 观点输出、极简演讲 |
| `custom` | 自定义 | 任意背景、配色、字体与字号 | 品牌 VI、商业项目、客户定制 |

主题只通过 CSS Token 契约影响颜色、字体与装饰；版式不硬编码配色。

## 自定义主题与配色

`meta.theme` 设为 `custom`，并传入 `appearance`：

```json
{
  "meta": { "title": "品牌发布", "theme": "custom" },
  "appearance": {
    "colors": {
      "bg": "#0f172a",
      "bg2": "#1e293b",
      "ink": "#f8fafc",
      "muted": "#94a3b8",
      "accent": "#f97316",
      "accent2": "#22d3ee"
    },
    "background": { "type": "mesh", "angle": 135 },
    "typography": {
      "displayFont": "\"Noto Serif SC\", \"Source Han Serif SC\", serif",
      "bodyFont": "\"Inter\", \"Noto Sans SC\", sans-serif",
      "baseScale": 1.08,
      "titleScale": 1.0,
      "bodyScale": 1.1,
      "kickerScale": 1.05
    }
  },
  "slides": []
}
```

背景效果：`none` 纯色、`gradient` 渐变、`mesh` 柔光、`grid` 网格、`dots` 点阵、`glass` 磨砂玻璃。Studio 左侧「外观 / 自定义」可直接选色、选字体、拖字号并实时预览。

## 商用与素材

- 不打包字体文件，只引用 **OFL 开源字体名称**（Noto / 思源 / Inter / JetBrains Mono / 霞鹜文楷），未安装时回退系统字体。
- 示例视觉全部由 CSS 绘制，不内置第三方图片、Logo、图标库或 CDN。
- `image` / `media.src` 的图片版权由调用方负责；发布前按 [`05-licensing.md`](docs/projects/html-ppt-template/05-licensing.md) 的清单核对。
- 详细许可证与商用检查清单：[`docs/projects/html-ppt-template/05-licensing.md`](docs/projects/html-ppt-template/05-licensing.md)。

## 版式

`statement` · `agenda` · `bullets` · `split` · `stats` · `timeline` · `compare` · `quote` · `section` · `code` · `table` · `image` · `closing`

选择建议：一页只完成一个认知动作；不要连续三页使用同一重版式；横版优先双栏，竖版优先单栏。

## 目录

```text
.
├── src/                      # 工作台与渲染运行时
│   ├── index.html            # Studio
│   ├── css/                  # tokens / layout / animations / print / studio
│   └── js/                   # render（纯渲染） / runtime（演示） / studio（工作台）
├── scripts/                  # 构建、校验、OpenClaw CLI、HTTP、截图
├── openclaw/                 # SKILL.md / deck.schema.json / manifest.json
├── examples/                 # 示例内容
├── docs/projects/            # 按 Go-Backend-Core 项目管理规范归档
└── test/                     # node:test 测试
```

## 截图 PNG

本地安装 Chrome / Edge 后：

```bash
# 整个 deck 逐页截图（默认 4 路并行，同一浏览器多标签）
node scripts/screenshot.mjs --html exports/course-design/deck-16x9.html --all --concurrency 6

# 单页导出
node scripts/screenshot.mjs --html exports/course-design/cover-3x4.html --slide 1 --out preview/cover.png

# 生成本地原创主题示例图（examples/generated/ 已被 gitignore）
npm run examples:art
```

`preview/` 会保留每次本地预览，已被 gitignore；直接打开 `preview/index.html` 查看最终效果图与入口。

`?export=1&slide=N` 会关闭动画、隐藏控制条并把画布填满视口；配合 `--force-device-scale-factor=1` 得到精确尺寸。

## 命令

| 命令 | 说明 |
|---|---|
| `npm run dev` | 启动 Studio + HTTP API（默认 4173） |
| `npm run build` | 示例 × 5 主题 → `dist/` |
| `npm run build:one` | 示例 × 当前主题 → `exports/` |
| `npm run validate` | 校验示例内容 |
| `npm test` | 渲染、构建、CLI 测试 |
| `npm run check` | 项目管理自检 + 全比例渲染 + 临时构建 |
| `npm run openclaw -- info` | OpenClaw 工具信息 |
| `npm run screenshot -- --html ... --all` | 无头 Chrome 截图 |

## 项目管理规范

本项目作为 **Go-Backend-Core `developmentManager` 的前端模板项目**（`project.type = template`）登记：

- 项目元数据：[`project.manifest.json`](project.manifest.json)
- 项目文档：[`docs/projects/html-ppt-template/`](docs/projects/html-ppt-template/)
- 需求原文与验收：[`docs/projects/html-ppt-template/requirements/RQM-0001.md`](docs/projects/html-ppt-template/requirements/RQM-0001.md)
- 架构 / 内容模型 / 接口 / 结构四件套：`01`–`04`
- 自检门禁：`npm run check`（等价于轻量 `sop-check`）
- 变更记录：[`CHANGELOG.md`](CHANGELOG.md)

登记字段可直接使用 `project.manifest.json` 的 `project_key / name / type / description / tech_stack / docs_root / entrypoints` 映射到 `POST /api/v1/developmentmanager/projects`。

## 已知限制

- 生成物不依赖网络，但也不内置图片资源；`image` / `media.src` 需要可访问的 URL 或 data URI。
- 竖版内容为单栏优先，极宽表格（>4 列）或超长代码建议拆页。
- 自动字号收缩最低 64%；再长的内容会裁切，应在内容层拆页。
- 截图脚本依赖本机 Chrome / Edge，不随项目安装浏览器。

## License

[Apache License 2.0](LICENSE)
