# 项目文档

本目录按 Go-Backend-Core `developmentManager` 的项目管理规范组织：项目元数据在根目录 `project.manifest.json`，项目文档统一收在 `docs/projects/<project_key>/`。

## 入口

- 仓库说明：[`../README.md`](../README.md)
- 维护说明：[`../AGENTS.md`](../AGENTS.md)
- 项目登记：[`../project.manifest.json`](../project.manifest.json)
- 变更记录：[`../CHANGELOG.md`](../CHANGELOG.md)
- 规范参考：`Go-Backend-Core/docs/module-sop.md`、`Go-Backend-Core/docs/plans/feature-V2-project-dev-management.md`

## 项目文档

| 文档 | 内容 |
|---|---|
| [`projects/html-ppt-template/index.md`](projects/html-ppt-template/index.md) | 项目总览、决策表、验收标准 |
| [`projects/html-ppt-template/01-architecture-overview.md`](projects/html-ppt-template/01-architecture-overview.md) | 定位、分层、数据流、比例与动效架构 |
| [`projects/html-ppt-template/02-content-model.md`](projects/html-ppt-template/02-content-model.md) | 内容模型、字段字典、版式约束 |
| [`projects/html-ppt-template/03-openclaw-interface.md`](projects/html-ppt-template/03-openclaw-interface.md) | OpenClaw CLI / HTTP 契约与错误码 |
| [`projects/html-ppt-template/04-module-structure.md`](projects/html-ppt-template/04-module-structure.md) | 文件组织、生命周期、扩展点、已知限制 |
| [`projects/html-ppt-template/05-licensing.md`](projects/html-ppt-template/05-licensing.md) | 商用字体、图片、代码与发布检查清单 |
| [`projects/html-ppt-template/requirements/RQM-0001.md`](projects/html-ppt-template/requirements/RQM-0001.md) | 需求原文、验收、决策追溯 |
| [`projects/html-ppt-template/requirements/RQM-0002.md`](projects/html-ppt-template/requirements/RQM-0002.md) | 商用合规、移动端字号、自定义主题需求 |

## 项目状态

- 类型：`template`（前端模板）
- 状态：`active`
- 版本：`1.1.0`
- 关联：Go-Backend-Core `developmentManager`（登记）；Go-Frontend-Core（可选消费方）
- 自检：`npm run check`

## 四段式 SOP 执行记录

| 阶段 | 产出 | 状态 |
|---|---|---|
| 1. 用户描述 | `requirements/RQM-0001.md` 原文留档 | ✅ |
| 2. 规划 | `index.md` 决策表 + 四件套 | ✅ |
| 3. 开发 | 渲染器、运行时、构建、CLI、HTTP、Studio、测试 | ✅ |
| 4. 文档 | 本目录 + README + AGENTS + CHANGELOG + manifest | ✅ |

> 本项目无后端表结构，因此不产生 `migrations/`、Swagger、数据字典；`02-content-model.md` 替代项目数据字典，记录内容 JSON 的字段含义与约束。
