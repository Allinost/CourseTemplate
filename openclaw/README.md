# OpenClaw 集成包

这个目录是 OpenClaw 的 skill 入口：

| 文件 | 作用 |
|---|---|
| `SKILL.md` | 工作流、版式手册、质量规则、失败处理 |
| `deck.schema.json` | 内容 JSON 的机器可读契约（JSON Schema 2020-12） |
| `manifest.json` | 工具名、命令、HTTP 端点、产物清单 |

## 安装方式

将整个仓库（或本目录 + `scripts/` + `src/`）放到 OpenClaw 可访问的工作目录，然后让 agent 读取：

```text
openclaw/SKILL.md
openclaw/deck.schema.json
```

如果 OpenClaw 通过 skill 目录加载，可把仓库根目录映射为一个 skill；根目录的 `SKILL.md` 会指向本目录。

## 最短调用

```bash
# 1. 生成 deck.json 后校验
node scripts/openclaw.mjs validate --input deck.json

# 2. 导出四种画布
node scripts/openclaw.mjs render --input deck.json --out exports/my-deck --formats all
```

## HTTP 模式

```bash
npm run dev
# POST http://127.0.0.1:4173/api/openclaw/render
# body: { "deck": {...}, "formats": "all", "theme": "editorial" }
```

## 约定

- 只输出 JSON 到 stdout；日志/错误也结构化，便于 agent 解析。
- 不修改 `exports/` 里的 HTML；改 `deck.json` 后重新 render。
- 内容文本会转义；不要尝试在标题/正文中注入 HTML 或脚本。
- 每个比例的输出文件固定命名，见 `manifest.json` 的 `artifacts`。
