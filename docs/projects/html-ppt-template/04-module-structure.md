# 04 · 文件结构与维护

## 1. 目录

```text
.
├── package.json                 # scripts，无 dependencies
├── project.manifest.json        # developmentManager 登记元数据（type=template）
├── README.md                    # 人读入口
├── AGENTS.md                    # 维护者/AI 约束与检查清单
├── CHANGELOG.md
├── SKILL.md                     # OpenClaw 根入口（指向 openclaw/SKILL.md）
├── index.html                   # 重定向到 /src/
│
├── src/
│   ├── index.html               # Studio 工作台
│   ├── css/
│   │   ├── tokens.css           # reset + 主题 Token + 比例 Token
│   │   ├── layout.css           # deck / slide / 封面 / 13 版式 / 控制条
│   │   ├── animations.css       # 入场、环境动效、导出冻结、reduced-motion
│   │   ├── print.css            # 打印/PDF
│   │   └── studio.css           # 工作台 UI
│   └── js/
│       ├── render.js            # 纯渲染器（Node + 浏览器共用）
│       ├── runtime.js           # 演示运行时（IIFE，内联）
│       └── studio.js            # 工作台控制
│
├── scripts/
│   ├── build.mjs                # 构建 CLI
│   ├── validate.mjs             # 校验 CLI
│   ├── openclaw.mjs             # OpenClaw CLI
│   ├── serve.mjs                # Studio + HTTP API
│   ├── screenshot.mjs           # 可选 Chrome 截图
│   ├── check.mjs                # 项目自检门禁
│   └── lib/
│       ├── build.mjs            # buildDeck / buildAllThemes / gallery
│       ├── document.mjs         # 独立 HTML 文档装配
│       └── validate.mjs         # 内容校验规则
│
├── openclaw/
│   ├── SKILL.md                 # OpenClaw 工作流与版式手册
│   ├── deck.schema.json         # JSON Schema 2020-12
│   └── manifest.json            # 工具/命令/HTTP 元数据
│
├── examples/demo.deck.json      # 14 页示例，覆盖 11 种版式
├── test/                        # node:test
└── docs/projects/html-ppt-template/  # 本四件套 + 需求
```

## 2. 生命周期

### 2.1 构建

```text
build.mjs
  -> read input JSON
  -> validateDeck
  -> for each ratio:
       renderHtmlDocument
         -> loadDeckCss (cache)
         -> loadRuntime (cache)
         -> renderCoverOnly / renderDeckSlides
         -> inline <style> + <script>
       write HTML
  -> write deck.json
  -> write manifest.json
  -> write index.html (single deck)
```

### 2.2 演示

```text
browser loads standalone HTML
  -> CSS applies ratio tokens
  -> runtime DOMContentLoaded
     -> mount([data-deck])
     -> setSlide(start from ?slide / #hash)
     -> fitAll()
     -> fonts.ready -> fitAll()
  -> keyboard / touch / buttons
  -> slide.is-active triggers .anim
  -> counter / progress / hash update
```

### 2.3 导出截图

```text
screenshot.mjs
  -> read HTML count slides + data-ratio
  -> for each slide:
       chrome --headless=new --screenshot ...
       URL + ?export=1&slide=N
  -> runtime sees export=1
     -> html.is-export
     -> freeze animations, show final state
     -> hide chrome
     -> fill viewport
```

## 3. 扩展点

### 3.1 新增版式

按 `AGENTS.md` 的 7 步清单执行。核心文件：

1. `src/js/render.js`：`renderXxx` + `RENDERERS` + `LAYOUTS`
2. `src/css/layout.css`：`.l-xxx` + portrait 覆盖
3. `openclaw/deck.schema.json`：`$defs` + `oneOf`
4. `scripts/lib/validate.mjs`：必填字段
5. `docs/projects/html-ppt-template/02-content-model.md`：字段表
6. `test/render.test.mjs`：layout coverage
7. `npm test && npm run check`

### 3.2 新增主题

1. `THEMES` 元数据；
2. `tokens.css` 的 `[data-theme]` Token 契约；
3. `layout.css` 的封面艺术/背景（可选）；
4. schema theme enum + manifest + README；
5. 四比例截图验收。

### 3.3 新增比例

需要同时改：

- `RATIOS`（width/height/orientation/kind/ar）
- `tokens.css` 的 `[data-ratio]`（`--ar` / `--export-*` / `--pad-*` / `--fs` / `--cover-title` / `--display-title`）
- `FORMAT_ORDER` 与 `FILE_NAMES`
- `document.mjs` 的 `@page`
- `screenshot.mjs` 的 `RATIO_SIZE`
- schema/manifest/docs/tests

## 4. 测试矩阵

| 测试 | 覆盖 |
|---|---|
| `test/render.test.mjs` | 归一化、封面/内容页数、四比例、13 版式、XSS、文档装配、主题声明 |
| `test/build.test.mjs` | 校验、比例解析、四文件构建、manifest、gallery、主题覆盖 |
| `test/openclaw.test.mjs` | info、validate（文件/stdin）、render 输出 |
| `npm run check` | 必需文件、manifest type、demo 校验、四比例渲染、真实临时构建 |

## 5. 浏览器支持

- Chrome / Edge 111+（Container Queries、`cqw`、`aspect-ratio`、`inert`）。
- Safari 16.4+、Firefox 110+ 基本可用；`inert` 有降级。
- 导出 HTML 不依赖网络；字体使用系统字体栈。
- 打印/PDF 依赖 `@page` 与 `print.css`；不同浏览器分页可能略有差异。

## 6. 已知限制

| 限制 | 说明 | 建议 |
|---|---|---|
| 图片不内联 | `src` 为远程 URL 时离线不可用 | 使用 data URI 或部署图片 |
| 字号下限 0.64 | 超长内容仍可能裁切 | 内容层拆页 |
| 表格竖版转卡片 | 依赖表头数量，>4 列会拥挤 | 控制列数 |
| 代码高亮轻量 | 仅注释/字符串/关键字 | 复杂代码用图片或拆页 |
| 截图依赖 Chrome | 不安装浏览器 | `--chrome` / `CHROME_PATH` |
| 单页 40 上限 | 防止超大 deck | 拆分多个 deck |
| 动画非时间轴 | 不支持逐元素时间轴编辑 | 用 `entrance` + 顺序控制 |

## 7. 产物清理

- `dist/`、`exports/`、`preview/` 已加入 `.gitignore`。
- 重新构建会覆盖同名目录；`build:all-themes` 会覆盖 `dist/<slug>-<theme>`。
- 不要手工编辑 `exports/` 内的 HTML；修改 `deck.json` 后重新渲染。
