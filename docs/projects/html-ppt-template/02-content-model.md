# 02 · 内容模型

> 本文件是本项目的“数据字典”：所有字段的含义、必填性、约束与版式映射。
> 机器可读版本：[`openclaw/deck.schema.json`](../../../openclaw/deck.schema.json)

## 1. 顶层结构

```json
{
  "schemaVersion": "1.0",
  "meta": {},
  "cover": {},
  "appearance": {},
  "slides": [],
  "closing": {}
}
```

| 字段 | 类型 | 必填 | 含义 |
|---|---|---|---|
| `schemaVersion` | string | 否 | 内容模型版本，默认 `1.0` |
| `meta` | object | 是 | 全局元数据与默认主题 |
| `cover` | object | 否 | 封面覆盖字段；缺省时继承 `meta` |
| `appearance` | object | 否 | 自定义主题：配色、背景效果、字体字号 |
| `slides` | array | 是 | 内容页，1–40 页 |
| `closing` | object | 否 | 自动结尾页；若 `slides` 已有 `layout=closing` 则不追加 |

## 2. `meta`

| 字段 | 类型 | 必填 | 默认 | 含义 |
|---|---|---|---|---|
| `title` | string | 是 | — | 主标题，也是文档标题；建议 ≤60 字 |
| `subtitle` | string | 否 | `""` | 副标题 |
| `organization` | string | 否 | `""` | 组织/品牌，显示在封面顶部与导航栏 |
| `author` | string | 否 | `""` | 作者/讲师 |
| `date` | string | 否 | `""` | 日期文本 |
| `kicker` | string | 否 | `HTML PPT TEMPLATE` | 封面眉题 |
| `footer` | string | 否 | 组织名 + 标题 | 页脚文本 |
| `language` | string | 否 | `zh-CN` | `<html lang>` |
| `theme` | enum | 否 | `editorial` | `editorial` / `scholar` / `lecture` / `beamer` / `tech` / `software` / `consulting` / `ink` / `custom` |
| `slug` | string | 否 | 由标题生成 | 导出目录名；建议英文短横线 |
| `mark` | string | 否 | `01` | 封面视觉编号/符号 |

## 3. `cover`

未提供的字段继承 `meta`：

| 字段 | 类型 | 必填 | 默认 | 含义 |
|---|---|---|---|---|
| `title` | string | 否 | `meta.title` | 封面标题 |
| `subtitle` | string | 否 | `meta.subtitle` | 封面副标题 |
| `kicker` | string | 否 | `meta.kicker` | 眉题 |
| `badge` | string | 否 | `HTML DECK` | 右上角胶囊标签 |
| `note` | string | 否 | `meta.footer` | 底部说明 |
| `date` | string | 否 | `meta.date` | 日期 |
| `meta` | string[] | 否 | 作者/组织/日期 | 信息胶囊，建议 2–4 个 |

## 4. `appearance` 自定义外观

`appearance` 是可选的顶层对象。设置 `meta.theme = "custom"` 后，它会覆盖预设主题的配色、背景与字体字号。

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
      "displayFont": "\"Noto Serif SC\", serif",
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

### 4.1 `colors`

| 字段 | 含义 | 缺省 |
|---|---|---|
| `bg` | 背景色 | 主题 `--bg` |
| `bg2` | 次背景色，渐变/柔光使用 | `bg` 或主题 `--bg-deep` |
| `ink` | 主文字色 | 主题 `--ink` |
| `muted` | 辅助文字色 | 主题 `--muted` |
| `accent` | 主题色（强调、序号、按钮） | 主题 `--accent` |
| `accent2` | 第二强调色 | 主题 `--accent-2` |
| `panel` | 卡片/面板底色 | 由 `ink` 推导的半透明色 |
| `panelStrong` | 强调面板底色 | 由 `ink` 推导 |
| `line` | 分隔线 | 由 `ink` 推导 |
| `lineStrong` | 强分隔线 | 由 `ink` 推导 |
| `faint` | 弱化文字 | 由 `ink` 推导 |
| `titleColor` | 标题颜色 | `ink` |
| `bodyColor` | 正文颜色 | `muted` |

颜色只接受 `#hex`、`rgb()`、`rgba()`、`hsl()`、`hsla()`；非法值会被丢弃，不会进入 HTML/CSS。

### 4.2 `background`

| 字段 | 类型 | 说明 |
|---|---|---|
| `type` | enum | `none` 纯色 / `gradient` 渐变 / `mesh` 柔光 / `grid` 网格 / `dots` 点阵 / `glass` 磨砂玻璃 |
| `angle` | number | 渐变角度，0–360，默认 135 |

`glass` 会给数据卡、对比卡、列表卡、面板加 `backdrop-filter: blur()`，适合发布会与品牌视觉。

### 4.3 `typography`

| 字段 | 类型 | 范围 | 说明 |
|---|---|---|---|
| `displayFont` | string | — | 标题字体族 |
| `bodyFont` | string | — | 正文字体族 |
| `monoFont` | string | — | 标签/页脚/代码字体族 |
| `baseScale` | number | 0.7–1.8 | 全局字号倍率 |
| `titleScale` | number | 0.7–1.6 | 标题额外倍率 |
| `bodyScale` | number | 0.7–1.8 | 正文额外倍率 |
| `kickerScale` | number | 0.7–1.8 | 标签/页脚额外倍率 |

字体只写 `font-family` 名称，不打包字体文件。推荐使用 Noto / 思源 / Inter / JetBrains Mono / 霞鹜文楷等 OFL 字体；未安装时回退系统字体。详见 [`05-licensing.md`](05-licensing.md)。

## 5. 内容页通用字段

| 字段 | 类型 | 必填 | 含义 |
|---|---|---|---|
| `id` | string | 否 | 页标识，默认 `slide-N` |
| `layout` | enum | 是 | 版式 id，见 §5 |
| `kicker` | string | 否 | 页眉小标签 |
| `title` | string | 视版式 | 页标题 |
| `body` | string | 否 | 说明文本；支持轻量 Markdown |
| `entrance` | enum | 否 | `rise`（默认）/`blur`/`clip`/`scale`/`left`/`right` |
| `notes` | string | 否 | 演讲备注，不渲染到画面 |

## 6. 版式与字段

### 5.1 `statement` · 观点页

| 字段 | 必填 | 说明 |
|---|---|---|
| `title` | 是 | 一句主张，建议 12–30 字 |
| `body` | 否 | 1–3 句解释 |

横版：左侧大字 + 右侧巨型页码；竖版：页码在上，主张垂直居中。

### 5.2 `agenda` · 议程页

| 字段 | 必填 | 说明 |
|---|---|---|
| `title` | 是 | 议程标题 |
| `body` | 否 | 一句话说明 |
| `items[]` | 是 | 1–8 项 |

`items[]`：

| 字段 | 必填 | 说明 |
|---|---|---|
| `title` | 是 | 章节名 |
| `text` | 否 | 一句话说明 |

横版双栏；竖版每项一张卡片，自动填满高度。

### 5.3 `bullets` · 要点页

| 字段 | 必填 | 说明 |
|---|---|---|
| `title` | 是 | 方法/要点标题 |
| `body` | 否 | 总述 |
| `items[]` | 是 | 1–8 项 |
| `aside` | 否 | 左侧统计块 `{ value, label }` |

`items[]`：`title` / `text` / `tag`（可选小标签）。

横版左标题右列表；竖版标题在上，列表转为大卡片，右侧巨型序号。

### 5.4 `split` · 图文页

| 字段 | 必填 | 说明 |
|---|---|---|
| `title` | 是 | 标题 |
| `body` | 否 | 说明 |
| `bullets[]` | 否 | 1–3 条补充 |
| `reverse` | 否 | `true` 时媒体在左 |
| `media` | 否 | 媒体对象 |

`media`：

| 字段 | 类型 | 说明 |
|---|---|---|
| `type` | enum | `grid` / `orbit` / `bars` / `rings` / `type` |
| `text` | string | `type` 视觉中心字符 |
| `src` | string | 图片 URL；优先于抽象视觉 |
| `alt` | string | 图片替代文本 |
| `caption` | string | 右下角图注 |

### 5.5 `stats` · 数据页

| 字段 | 必填 | 说明 |
|---|---|---|
| `title` | 是 | 标题 |
| `body` | 否 | 一句结论 |
| `source` | 否 | 数据来源 |
| `items[]` | 是 | 2–4 项 |

`items[]`：

| 字段 | 类型 | 说明 |
|---|---|---|
| `value` | number/string | `92`、`3.5`、`18 min`；模板自动推断后缀 |
| `prefix` | string | 前缀，如 `$` |
| `suffix` | string | 后缀，如 `%` / `x` / ` min` |
| `decimals` | integer | 小数位；默认从 `value` 推断 |
| `label` | string | 指标名 |
| `note` | string | 一句解释 |

横版横向排列；竖版 2×2。数值在演示时滚动。

### 5.6 `timeline` · 时间线

| 字段 | 必填 | 说明 |
|---|---|---|
| `title` | 是 | 标题 |
| `body` | 否 | 说明 |
| `items[]` | 是 | 2–6 段 |

`items[]`：`date` / `title` / `text`。

横版横向时间线 + 垂直分隔与巨型序号；竖版纵向时间线。

### 5.7 `compare` · 对比页

| 字段 | 必填 | 说明 |
|---|---|---|
| `title` | 是 | 标题 |
| `body` | 否 | 说明 |
| `items[]` | 是 | 2–3 张卡片 |

`items[]`：`label` / `title` / `text` / `tone`（`accent` / `muted` / `default`）/ `bullets[]`。

横版并排；竖版纵向堆叠。

### 5.8 `quote` · 引用页

| 字段 | 必填 | 说明 |
|---|---|---|
| `quote` | 是* | 引文正文；也可用 `title` |
| `cite` | 否 | 作者 |
| `role` | 否 | 身份 |
| `body` | 否 | 上下文说明 |

### 5.9 `section` · 章节页

| 字段 | 必填 | 说明 |
|---|---|---|
| `title` | 是 | 章节标题 |
| `index` | 否 | 章节序号，如 `01` |
| `body` | 否 | 章节导语 |

### 5.10 `code` · 代码页

| 字段 | 必填 | 说明 |
|---|---|---|
| `title` | 是 | 标题 |
| `body` | 否 | 说明 |
| `bullets[]` | 否 | 补充点 |
| `code` | 是 | `{ filename, language, content }` |

`code.content` 会转义并做轻量高亮（注释/字符串/关键字），不会执行。

### 5.11 `table` · 表格页

| 字段 | 必填 | 说明 |
|---|---|---|
| `title` | 是 | 标题 |
| `headers[]` | 是 | 表头 |
| `rows[][]` | 是 | 二维数组，每行单元格数建议与表头一致 |
| `note` | 否 | 表注 |

横版为表格；竖版每条记录转为 2×2 卡片（`td::before` 显示表头）。

### 5.12 `image` · 全图页

| 字段 | 必填 | 说明 |
|---|---|---|
| `title` | 是 | 标题 |
| `src` / `image.src` | 否 | 图片 URL；缺省为主题色占位 |
| `alt` | 否 | 替代文本 |
| `caption` | 否 | 右上角图注 |

### 5.13 `closing` · 结尾页

| 字段 | 必填 | 说明 |
|---|---|---|
| `title` | 是 | 结尾标题，如“谢谢”“现在开始” |
| `body` | 否 | 收束语 |
| `items[]` | 否 | `{ label, value }` 清单 |
| `qr` | 否 | `{ src, alt, label }`；仅有 `src` 时渲染二维码 |

## 7. 文本格式

`title` / `body` / `text` / `label` 等文本字段支持：

| 语法 | 输出 |
|---|---|
| `**粗体**` | `<strong>` |
| `*斜体*` | `<em>` |
| `` `代码` `` | `<code>` |
| `[文字](https://...)` | `<a>`，仅允许 http(s)/mailto/站内路径 |
| 换行 | `<br>` |

原始 HTML 不被信任；`<script>` 会显示为文本。

## 8. 长度与密度预算

| 内容 | 建议 | 自动警告阈值 |
|---|---|---|
| 主标题 | ≤20 字 | >60 |
| 页标题 | 12–24 字 | >30 |
| `body` | ≤100 字 | >160 |
| `bullets.items` | 3–5 项 | >5 |
| `agenda.items` | 3–5 项 | >5 |
| `stats.items` | 2–4 项 | 越界为错误 |
| `timeline.items` | 3–5 段 | >5 |
| `compare.items` | 2–3 张 | 越界为错误 |
| `table.rows` / 列 | 3–6 行 / ≤4 列 | >6 行 / >4 列 |
| `code.content` | ≤18 行、单行 ≤100 字符 | 超出警告 |
| 单条 item 标题 | ≤18 字 | >26 |
| 单条 item 正文 | ≤60 字 | >90 |

### 8.1 四层防线

1. **内容预算**：`validateDeck` 在构建前检查标题、正文、条目、表格、代码长度和数量，超出即返回 warning；OpenClaw 应先修到 warning 为 0 再导出。
2. **结构上限**：`stats` 2–4 项、`compare` 2–3 张、`timeline`/`agenda`/`bullets` ≤5 项；超出直接拆页，不要依赖缩放。
3. **运行时 autofit**：`--density` 从 1 逐步降到 0.64；有 32px 容差，且“字体缩小但溢出没有改善”时立即停止，避免为装饰元素无限缩小正文。
4. **视觉验收**：构建后跑 `screenshot.mjs --all` 看竖版与横版；重点看 3:5 的列表、表格、对比、代码页。

**经验阈值**：`--density` ≥0.9 表示内容健康；0.8–0.9 偏紧，建议精简；<0.8 应拆页，而不是继续压缩字号。当前没有把 density 暴露到导出 UI，但可用浏览器 DevTools 查看 `getComputedStyle(slide).getPropertyValue('--density')`。

## 9. 比例与内容策略

| 比例 | 内容策略 |
|---|---|
| 16:9 | 双栏、宽时间线、横向对比；一页可承载 3–4 个要点 |
| 4:3 | 封面只放标题/副标题/信息胶囊；标题可两行 |
| 3:4 | 封面标题上移，视觉下沉；标题建议 ≤14 字 |
| 3:5 | 单栏优先；列表转卡片；表格转 2×2；避免 >4 列 |

## 10. 示例

完整示例：[`examples/demo.deck.json`](../../../examples/demo.deck.json)
