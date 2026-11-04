# Changelog

本项目遵循语义化版本；每次变更同步更新本文件与 `docs/projects/html-ppt-template/`。

## [1.1.0] — 2026-11-04

### Added

- **自定义主题 `custom`**：`appearance` 支持自定义背景色、次背景色、主文字、辅助文字、主题色、强调色、面板/分隔线/标题/正文颜色。
- **背景效果**：纯色、渐变、柔光、网格、点阵、磨砂玻璃。
- **字体与字号**：标题/正文/等宽字体族；全局、标题、正文、标签字号倍率。
- **Studio 外观面板**：预设主题 + 自定义主题、颜色选择器、背景效果、字体下拉、字号滑杆，实时预览。
- **移动端优先的工作台布局**：窄屏下预览置顶、控制区自适应；默认比例改为「跟随窗口」（横屏 16:9 / 竖屏 3:5）。
- **字号放大**：提升 16:9 正文、3:4 / 3:5 标题与正文的基础倍率，竖版列表与表格更易读。
- **商用合规文档**：`05-licensing.md`，记录 OFL 字体策略、图片/代码来源与商用发布清单。
- **单浏览器截图**：`scripts/screenshot.mjs` 复用同一个 Chrome page target，不再每页新开窗口。
- **本地示例图**：`scripts/generate-theme-art.mjs` 用同一浏览器会话生成 4 张原创主题视觉；`examples/generated/` 已 gitignore，不提交图片。

### Changed

- 字体栈优先使用 OFL 开源字体名称：Noto / 思源 / Inter / JetBrains Mono / 霞鹜文楷；不打包字体文件，未安装时回退系统字体。
- 主题数量从 4 套预设扩展为 4 套预设 + 1 套自定义。
- `openclaw/deck.schema.json` 增加 `appearance`、`custom` 主题与颜色/字号约束。
- 文档、README、SKILL、manifest 同步到 1.1.0。

## [1.0.0] — 2026-11-04

### Added

- 零依赖 HTML PPT 渲染器：`src/js/render.js`，同一份 `deck.json` 渲染四种画布。
- 四种导出比例：16:9（1600×900 内容）、4:3（1200×900 封面）、3:4（900×1200 封面）、3:5（900×1500 内容）。
- 五套主题：`editorial` 纸感杂志、`tech` 深空极客、`consulting` 咨询报告、`ink` 黑白宣言、`custom` 自定义。
- 十三种版式：statement / agenda / bullets / split / stats / timeline / compare / quote / section / code / table / image / closing。
- 浏览器运行时：键盘 / 触摸翻页、全屏、总览、进度条、URL 定位、数字滚动、autofit、`prefers-reduced-motion`。
- 独立 HTML 构建：内联 CSS 与 runtime，输出 `deck-16x9.html`、`cover-4x3.html`、`cover-3x4.html`、`deck-3x5.html`、`manifest.json`、`deck.json`。
- OpenClaw 接口：`openclaw/deck.schema.json`、`openclaw/SKILL.md`、`openclaw/manifest.json`、`scripts/openclaw.mjs`。
- 本地 HTTP 桥：`/api/health`、`/api/template`、`/api/validate`、`/api/render`、`/api/build`、`/api/openclaw/render`。
- Studio 工作台：主题切换、比例切换、页面导航、JSON 编辑 / 校验 / 导入 / 下载、一键导出。
- 无头 Chrome 截图脚本：`scripts/screenshot.mjs`，支持 `?export=1&slide=N` 精确尺寸。
- 项目管理资料：`project.manifest.json`、`docs/projects/html-ppt-template/01`–`04`、需求 `RQM-0001`、`AGENTS.md`、`npm run check` 自检门禁。
- 测试：`node:test` 覆盖四比例、全部版式、XSS 转义、构建产物与 OpenClaw CLI。

### Fixed

- 修正 3:4 / 3:5 封面艺术作为绝对定位网格子项的包含块问题。
- 修正图文页媒体容器高度塌陷。
- 修正中文标题在 16:9 代码页中的断词。
- 修正竖版表格、要点、时间线的空间分配与卡片化。
- 修正 Cover mast 被跨行艺术元素挤到页脚的问题。

### Known limitations

- 不内置图片资源，图片页需要可访问 URL 或 data URI。
- 自动字号收缩最低 64%，超长内容应拆页。
- 截图依赖本机 Chrome / Edge。
