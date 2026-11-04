# AGENTS.md — 维护说明

> 本文件面向后续 AI/人类维护者。修改前先读 `README.md` 与本文件；涉及项目管理流程时读 `../Go-Backend-Core/docs/module-sop.md`。

## 项目定位

`html-ppt-template` 是 Go-Backend-Core `developmentManager` 下的**前端模板项目**（`type=template`）。它不依赖后端、不建数据库，产物是独立 HTML 演示文件。

## 命令

```bash
npm run dev       # Studio + HTTP API, http://127.0.0.1:4173/src/
npm run build     # 示例 × 4 主题 -> dist/
npm test          # node:test
npm run check     # 项目文档 + 校验 + 全比例渲染 + 临时构建
npm run validate  # 示例内容校验
```

Windows 下统一使用 PowerShell / Git Bash；不要引入 `npm install` 依赖。

## 架构边界

```text
deck.json
  -> src/js/render.js       纯字符串渲染，无 DOM / Node 依赖
  -> scripts/lib/document.mjs  内联 CSS + runtime，生成独立 HTML
  -> src/js/runtime.js     浏览器交互、autofit、数字滚动、导出冻结
  -> scripts/lib/build.mjs 写 4 个 HTML + manifest
```

- **渲染器必须保持纯函数**：`render.js` 同时被 Node 和浏览器 Studio 使用，不能引入 `fs`、`path` 或 DOM。
- **运行时必须是普通 IIFE**：`runtime.js` 通过 `<script>` 内联进独立 HTML，不能用 ESM import，不能在 `file://` 下失败。
- **内容安全**：所有用户文本必须经过 `escapeHtml` / `inline`；图片 URL 必须经过 `safeUrl`。不要新增 `innerHTML` 拼接用户内容。
- **比例契约**：四种比例由 `RATIOS` + `src/css/tokens.css` 的 `data-ratio` 区块定义；新增比例必须同时更新 schema、manifest、构建文件名、文档与测试。
- **主题契约**：主题只允许改 CSS Token（颜色、字体、阴影、grain）；不要在 layout 中硬编码主题色。
- **版式契约**：版式在 `render.js` 的 `RENDERERS` 注册，在 `LAYOUTS` 暴露元数据，并在 `layout.css` 提供横竖版规则。

## 新增版式的检查清单

1. 在 `src/js/render.js` 添加 `renderXxx`，并注册到 `RENDERERS`、`LAYOUTS`。
2. 在 `src/css/layout.css` 添加 `.l-xxx`，同时处理 `[data-orientation="portrait"]`。
3. 更新 `openclaw/deck.schema.json`（`$defs` + `slides.items.oneOf`）。
4. 更新 `scripts/lib/validate.mjs` 的必填字段校验。
5. 更新 `docs/projects/html-ppt-template/02-content-model.md` 与 `03-openclaw-interface.md` 的版式表。
6. 在 `test/render.test.mjs` 的 layout coverage 中补一页，确保四种比例都能渲染。
7. 运行 `npm test` 与 `npm run check`。

## 新增主题的检查清单

1. 在 `src/js/render.js` 的 `THEMES` 增加元数据（id / name / en / description / accent / bg）。
2. 在 `src/css/tokens.css` 增加 `[data-theme="..."]` Token 契约。
3. 在 `src/css/layout.css` 增加该主题的封面艺术与背景装饰（可选）。
4. 更新 `openclaw/deck.schema.json` 的 theme enum、`openclaw/manifest.json`、README 主题表。
5. 构建 4 个比例并截图检查 `cover-4x3` / `cover-3x4` / `deck-16x9` / `deck-3x5`。

## 版式与内容的硬约束

- 一页只一个中心动作；标题 12–30 个中文字符为宜。
- 竖版内容不要放 >4 列的表格；`table` 在 3:5 会转成 2×2 卡片。
- `stats` 只允许 2–4 项；`timeline` 2–6 段；`compare` 2–3 张卡片。
- 代码页的代码内容会经过转义与轻量高亮，不要写原始 HTML。
- 自动字号收缩（`--density`）最低 0.64；不要依赖它容纳超长内容，应该在内容层拆页。

## 导出与测试

- 4 个输出文件名固定：`deck-16x9.html`、`cover-4x3.html`、`cover-3x4.html`、`deck-3x5.html`。
- `manifest.json` 是下游/OpenClaw 的契约，字段变更需同步 `docs/projects/html-ppt-template/03-openclaw-interface.md`。
- 测试必须覆盖：四种比例、全部版式、XSS 转义、构建产物、OpenClaw CLI。
- 视觉改动后至少截图检查 16:9 与 3:5 各 2 页；封面改动用 4:3 / 3:4。

## 文档与提交

按 Go-Backend-Core 四段式 SOP：需求原文 → 规划/决策 → 开发 → 文档。文档与代码同一次提交：

- 需求：`docs/projects/html-ppt-template/requirements/`
- 四件套：`docs/projects/html-ppt-template/01`–`04`
- 变更：`CHANGELOG.md`
- 项目登记：`project.manifest.json`

提交信息建议：`feat(template): ...`、`fix(render): ...`、`docs(project): ...`。

## 已知技术点

- `.cover__art` 在 3:4 / 3:5 是绝对定位网格子项，必须显式 `grid-column: 1 / -1; grid-row: 1 / -1;` 才能相对整个封面定位。
- `.slide` 是 `container-type: size`；所有字号使用 `calc(var(--fs) * N)`，`--fs` 由 `--density` 控制。
- `runtime.js` 的 autofit 通过比较 `.slide__inner` 的 `scrollHeight` 与 `clientHeight` 实现；装饰性绝对定位元素会造成少量 scroll overflow，因此代码有 32px 容差与“收缩不再改善即停止”的保护。新增滚动容器时需同步调整。
- 导出模式使用 `html.is-export` 冻结动画；新增动画必须加对应的冻结规则。
- Studio 通过 `window.HTMLPPT.mount()` 重挂载，重渲染前必须 `state.api.destroy()`，否则窗口级键盘监听会泄漏。
