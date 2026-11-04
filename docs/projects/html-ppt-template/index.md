# HTML PPT Template — 项目总览

> 项目类型：`template`（前端模板） · 状态：`active` · 版本：`1.0.0`
> 项目键：`html-ppt-template` · 文档根：`docs/projects/html-ppt-template/`

## 1. 定位

一套**零依赖、带动画、可由 OpenClaw 生成内容**的 HTML PPT 模板组。核心目标不是再做一个静态模板，而是建立一条稳定管线：

```text
一份 deck.json
  ├─ 16:9 横版内容（1600×900）
  ├─ 4:3  横版封面（1200×900）
  ├─ 3:4  竖版封面（900×1200）
  └─ 3:5  竖版内容（900×1500）
```

同一份语义内容通过 CSS Container Queries、比例 Token、竖版重排与自动字号收缩，适配横屏演示与竖屏图文；不为不同比例重复写文案。

本项目在 Go-Backend-Core `developmentManager` 中以**前端模板**登记，供其他前端工程通过 `uses_template` 关系引用。它本身不建表、不启动后端、不依赖 Go-Frontend-Core 运行。

## 2. 关键决策

| # | 决策 | 理由 | 落点 |
|---|---|---|---|
| Q1 | 项目类型登记为 `template` | 与 developmentManager 的 `base/template/backend_module/frontend_base/frontend_module/container_project` 分类一致；本项目是模板而非业务模块 | `project.manifest.json` |
| Q2 | 零 npm 依赖、无构建工具 | 产物可直接双击打开；OpenClaw/CI 不需要 `npm install`；降低长期维护成本 | `package.json`、`scripts/*.mjs` |
| Q3 | 一份内容 JSON，四个独立 HTML | 满足“一份内容自适应导出”且每种画布都能单独分发/截图 | `src/js/render.js`、`scripts/lib/build.mjs` |
| Q4 | 封面与内容分开产物 | 4:3 / 3:4 只导出封面；16:9 / 3:5 导出“封面 + 内容 + 结尾”，避免封面资产混入内容流 | `RATIOS.kind`、`FORMAT_ORDER` |
| Q5 | 比例适配用 Container Queries + `cqw` 字号 | 同一 DOM 在固定画布内按宽度缩放，无需 JS 计算尺寸；导出与预览一致 | `tokens.css`、`layout.css` |
| Q6 | 内容溢出用 `--density` 自动收缩 | OpenClaw 生成内容长度不可控；在 64% 下限内自动收缩，避免溢出裁切 | `runtime.js` |
| Q7 | 动画运行时独立于渲染器 | 服务端只输出静态 HTML，浏览器端负责入场、翻页、数字滚动；导出模式冻结动画 | `runtime.js`、`animations.css` |
| Q8 | OpenClaw 接口同时提供 CLI 与 HTTP | CLI 适合 agent 直接执行；HTTP 适合工作台/远程编排；两者共用同一构建函数 | `scripts/openclaw.mjs`、`scripts/serve.mjs` |
| Q9 | 4 主题 × 13 版式 | 覆盖课程、技术分享、咨询报告、观点输出；版式与主题解耦，可组合 | `THEMES`、`LAYOUTS` |
| Q10 | 可选 Chrome 无头截图 | 参考小红书/封面导出场景，但不在 npm 安装浏览器；找不到 Chrome 时明确报错 | `scripts/screenshot.mjs` |
| Q11 | 文档按四段式 SOP 归档 | 需求原文、决策、开发、文档可追溯；新增模块/版式有清单 | `docs/projects/html-ppt-template/`、`AGENTS.md` |
| Q12 | 不引入数据库/迁移/Swagger | 本项目是纯前端模板，无服务端接口与表结构；`02-content-model.md` 充当数据字典 | 本目录 |

## 3. 交付物

| 类别 | 路径 |
|---|---|
| 内容渲染器 | `src/js/render.js` |
| 演示运行时 | `src/js/runtime.js` |
| Studio 工作台 | `src/index.html`、`src/js/studio.js`、`src/css/studio.css` |
| 设计系统 | `src/css/tokens.css`、`layout.css`、`animations.css`、`print.css` |
| 构建 / 校验 | `scripts/build.mjs`、`scripts/lib/*`、`scripts/validate.mjs` |
| OpenClaw | `openclaw/SKILL.md`、`openclaw/deck.schema.json`、`openclaw/manifest.json`、`scripts/openclaw.mjs` |
| HTTP 桥 | `scripts/serve.mjs` |
| 截图 | `scripts/screenshot.mjs` |
| 示例 | `examples/demo.deck.json` |
| 测试 | `test/render.test.mjs`、`test/build.test.mjs`、`test/openclaw.test.mjs` |

## 4. 验收标准

- [x] 一份 `deck.json` 可导出 16:9 / 4:3 / 3:4 / 3:5 四种独立 HTML。
- [x] 16:9 与 3:5 包含封面 + 全部内容页 + 结尾；4:3 与 3:4 仅封面。
- [x] 四种比例都能通过键盘 / 触摸翻页，具备入场动画与进度条。
- [x] 长内容不溢出：自动字号收缩至 64% 下限。
- [x] 主题切换不改变内容结构；四套主题均可构建四比例。
- [x] OpenClaw 可通过 schema 生成内容，CLI 输出机器可读 JSON。
- [x] HTTP 桥可校验、预览、构建，且只绑定本机默认地址。
- [x] 生成 HTML 内联 CSS/JS，无网络依赖。
- [x] 可选 PNG 截图，尺寸与画布一致。
- [x] `npm test`、`npm run check` 通过。
- [x] 文档四件套、需求原文、变更记录、项目 manifest 齐全。

## 5. 关联

- 需求原文：[`requirements/RQM-0001.md`](requirements/RQM-0001.md)
- 架构：[`01-architecture-overview.md`](01-architecture-overview.md)
- 内容模型：[`02-content-model.md`](02-content-model.md)
- OpenClaw 接口：[`03-openclaw-interface.md`](03-openclaw-interface.md)
- 文件结构：[`04-module-structure.md`](04-module-structure.md)
- 维护说明：[`../../AGENTS.md`](../../AGENTS.md)

## 6. 登记到 developmentManager

`project.manifest.json` 与 `zzz_development_manager_project` 的字段可直接映射。示例（需 Bearer JWT）：

```bash
curl -X POST http://localhost:29090/api/v1/developmentmanager/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_key": "html-ppt-template",
    "name": "HTML PPT Template",
    "type": "template",
    "description": "零依赖、带动画的 HTML PPT 模板组，一份内容自适应导出 16:9 / 4:3 / 3:4 / 3:5。",
    "repo_url": "https://github.com/Allinost/CourseTemplate",
    "repo_path": ".",
    "default_branch": "main",
    "tech_stack": {
      "runtime": "Node.js >= 20",
      "frontend": "Vanilla HTML / CSS / JavaScript",
      "dependencies": "none"
    }
  }'
```

项目文档根为 `docs/projects/html-ppt-template/`；`openclaw/SKILL.md`、`openclaw/deck.schema.json` 可作为资产索引登记。
