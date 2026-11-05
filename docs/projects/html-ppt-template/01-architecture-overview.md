# 01 · 架构总览

## 1. 目标与约束

| 目标 | 约束 |
|---|---|
| 一份内容适配四种画布 | 不重复写横竖版文案；不为比例维护四份模板 |
| 产物可直接演示 | 无网络、无构建工具、无 npm 依赖；`file://` 可打开 |
| 动画可控 | 演示时入场/环境动效；导出/截图时冻结 |
| OpenClaw 可生成 | JSON Schema 明确、CLI 输出机器可读、失败可诊断 |
| 易维护 | 渲染器纯函数、主题 Token 化、版式注册表、测试覆盖 |

## 2. 分层

```text
┌──────────────────────────────────────────────────────────────┐
│ 内容层  deck.json                                            │
│ meta / cover / slides[] / closing                            │
└───────────────────────────┬──────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│ 渲染层  src/js/render.js（纯字符串，无 DOM / Node 依赖）      │
│ normalizeDeck → 版式分派 → escape / inline → slide HTML      │
└───────────────────────────┬──────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│ 文档层  scripts/lib/document.mjs                             │
│ 内联 tokens/layout/animations/print CSS + runtime.js + @page │
└───────────────────────────┬──────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│ 运行时  src/js/runtime.js（浏览器 IIFE）                      │
│ 翻页 / 动画 / 数字滚动 / autofit / 全屏 / 总览 / 导出冻结     │
└───────────────────────────┬──────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│ 产物  4 个独立 HTML + deck.json + manifest.json + index.html │
└──────────────────────────────────────────────────────────────┘
```

### 2.1 渲染器

`render.js` 是唯一的内容到 HTML 入口，同时被 Node 构建与浏览器 Studio 使用：

- `normalizeDeck(input)`：补默认值、过滤非法版式、合并 `meta` 与 `cover`。
- `renderCoverOnly(input, ratio)`：仅封面，用于 4:3 / 3:4。
- `renderDeckSlides(input, ratio)`：封面 + 内容 + 可选结尾，用于 16:9 / 3:5。
- `LAYOUTS` / `RATIOS` / `THEMES`：对外元数据，供 Studio、CLI、schema 文档复用。

渲染器不读取文件、不操作 DOM、不依赖时间或随机数，因此同一输入在 Node 与浏览器中得到一致 HTML。

### 2.2 文档构建

`scripts/lib/document.mjs` 负责把“片段”变成“可分发文件”：

1. 读取 `tokens.css` / `layout.css` / `animations.css` / `print.css` 并拼接；
2. 读取 `runtime.js`；
3. 调用渲染器生成 slides；
4. 注入 `<style>`、`@page`、`window` 运行时、`meta` 信息；
5. 输出 UTF-8 HTML。

构建产物不包含任何外链 CSS/JS/字体；图片字段除外。

### 2.3 运行时

`runtime.js` 是普通 IIFE，通过 `<script>` 内联，原因：

- 独立 HTML 用 `file://` 打开时，ESM import 会被浏览器 CORS 限制；
- 内联脚本不需要额外请求，单文件即可演示；
- Studio 通过 `window.HTMLPPT.mount()` 复用同一运行时。

职责：

- 激活/隐藏 slide，维护 `aria-hidden` 与 `inert`；
- 键盘、触摸、按钮、URL hash；
- 数字滚动；
- `--density` 自动字号收缩；
- 全屏、总览、自动播放；
- 导出模式冻结动画并隐藏控制条。

## 3. 比例架构

### 3.1 四种画布

| 比例 | 尺寸 | 文档类型 | 渲染入口 |
|---|---|---|---|
| 16:9 | 1600×900 | 内容（封面+内容+结尾） | `renderDeckSlides` |
| 4:3 | 1200×900 | 封面 | `renderCoverOnly` |
| 3:4 | 900×1200 | 封面 | `renderCoverOnly` |
| 3:5 | 900×1500 | 内容（封面+内容+结尾） | `renderDeckSlides` |

`RATIOS` 中的 `kind` 决定构建时走封面还是内容；`FORMAT_ORDER` 固定输出顺序。

### 3.2 自适应机制

1. **画布**：`.deck__stage` 用 `aspect-ratio: var(--ar)` 保持比例；演示时按视口等比缩放，导出时填满视口。
2. **字号**：`.slide` 设置 `container-type: size`；`--fs: calc(1cqw * var(--density))`，所有字号用 `calc(var(--fs) * N)`。
3. **版式**：`[data-orientation="portrait"]` 覆盖 grid 方向、列数、媒体顺序、表格形态。
4. **溢出**：运行时比较 `.slide__inner.scrollHeight` 与 `clientHeight`，逐步降低 `--density` 至 0.64。
5. **封面**：封面艺术在 3:4 / 3:5 改为绝对定位网格子项，显式 `grid-column: 1 / -1; grid-row: 1 / -1;`，相对整个封面定位。

### 3.3 为什么不按设备宽度做断点

内容画布是固定比例的“画板”，不是普通网页。用视口断点会把“画板内的排版”与“画板外的窗口”混在一起；Container Queries 直接以画板宽度为基准，横版演示、竖版截图、Studio 预览都能得到一致结果。

## 4. 主题架构

主题是一组 CSS Token：

```css
[data-theme="editorial"] {
  --bg: #f2ecdf;
  --ink: #1d1a15;
  --accent: #d4532d;
  --display: var(--font-serif);
  --line: rgba(29, 26, 21, 0.15);
  /* ... */
}
```

版式只使用语义 Token（`--bg` / `--ink` / `--accent` / `--panel` / `--line` / `--display`），不硬编码颜色。封面艺术按主题选择不同的装饰 DOM：

### 4.1 主题清单

- `editorial`：暖纸、陶土圆、细描边圆环、竖排编号；
- `scholar`：冷纸、深海军蓝、酒红索引、论文双线框、纸张叠层；
- `lecture`：柔和纸绿、深绿板书、琥珀强调、圆角教学卡片；
- `beamer`：白底、Beamer 蓝顶部色条、块状卡片、红色 alert 块；
- `tech`：透视网格、青色辉光球、扫描线、`</>` 描边字；
- `software`：IDE 窗口、代码行、花括号、等宽标题、蓝紫强调；
- `consulting`：柱状图、细圆环、报告标签；
- `ink`：朱红圆盘、巨型描边编号、竖线；
- `custom`：基于任意配色与背景效果的自定义视觉。

### 4.2 自定义外观

`appearance` 在主题 Token 之上叠加：

- `colors`：背景、主文字、辅助文字、主题色、强调色、面板/分隔线，以及标题/正文独立颜色；
- `background`：纯色、渐变、柔光、网格、点阵、磨砂玻璃；
- `typography`：标题/正文/等宽字体族、全局/标题/正文/标签字号倍率。

渲染器把 `appearance` 转成内联 CSS 变量（`--bg`、`--accent`、`--display`、`--type-scale`、`--bg-angle` 等），不生成新的 HTML 结构；Studio 只负责编辑这些变量。实现见 `appearanceStyle()`。

## 5. 动效架构

| 层级 | 实现 | 导出行为 |
|---|---|---|
| 页面切换 | `.slide.is-active` 的 opacity / transform 过渡 | 冻结 |
| 内容入场 | `.anim` + `--i` 错峰 + `--anim-name` | `animation:none` + 最终态 |
| 环境动效 | 封面圆浮动、网格漂移、扫描线、柱状生长 | 冻结 |
| 数字滚动 | `[data-count-to]` + `requestAnimationFrame` | 直接写终值 |
| 降级 | `prefers-reduced-motion` | 直接显示终态 |

`html.is-export` 是统一的冻结开关；新增动画必须在 `animations.css` 的导出区块补规则，否则截图可能捕获中间帧。

## 6. 安全

- 所有文本经 `escapeHtml`；`inline` 只允许 `strong/em/code/a`，链接只允许 `http(s)` / `mailto` / 站内路径。
- 图片 URL 经 `safeUrl`，拒绝 `javascript:` 等协议。
- HTTP 桥默认绑定 `127.0.0.1`，请求体上限 4MB，静态文件做路径穿越校验。
- 生成物不执行用户脚本；代码页内容仅转义后高亮。

## 7. 失败与降级

| 场景 | 行为 |
|---|---|
| 未知主题 | 回退 `editorial`，返回 warning |
| 未知版式 | 校验错误，构建中止 |
| 内容溢出 | `--density` 收缩，最低 0.64 |
| 无 Chrome | 截图脚本报错并提示 `--chrome` / `CHROME_PATH` |
| 无网络 | 产物仍可打开；外部图片不可用 |
| OpenClaw AI 不可用 | 不适用：本项目只负责渲染，内容生成由调用方决定 |
