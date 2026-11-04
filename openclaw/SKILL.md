---
name: html-ppt-template
description: Generate animated HTML presentations from one JSON content model. Exports 16:9 landscape content, 4:3 landscape cover, 3:4 portrait cover, and 3:5 portrait content. Use for course decks, Xiaohongshu carousels, Bilibili tech talks, product launches, and report-style presentations.
version: 1.1.0
license: Apache-2.0
---

# HTML PPT Template — OpenClaw Skill

Use this skill when the user asks for a **presentation**, **course slides**, **HTML PPT**, **Xiaohongshu image-text**, **Bilibili talk deck**, **product launch deck**, or wants **one content source exported in both landscape and portrait**.

The template owns layout, animation, typography, ratio adaptation, and export. Your job is to produce a valid `deck.json` and call the renderer.

## 1. Non-negotiable workflow

1. **Read `openclaw/deck.schema.json`** before writing content.
2. **Write one `deck.json`** with `meta`, optional `cover`, and 3–14 content `slides`.
3. **Validate** before rendering:
   ```bash
   node scripts/openclaw.mjs validate --input deck.json
   ```
   If `ok` is false, fix every error. Warnings are advisory; do not remove useful content only to silence a warning.
4. **Render** all four formats:
   ```bash
   node scripts/openclaw.mjs render --input deck.json --out exports/my-deck --formats all
   ```
5. **Report the returned file paths** to the user. Optionally screenshot:
   ```bash
   node scripts/screenshot.mjs --html exports/my-deck/deck-16x9.html --all
   ```

Never hand-write the final presentation HTML. The renderer guarantees ratio adaptation, autofit, animation, keyboard navigation, and print styles.

## 2. Output contract

`render` prints one JSON document on stdout:

```json
{
  "ok": true,
  "outDir": "C:/.../exports/my-deck",
  "files": [
    { "ratio": "16:9", "kind": "content", "file": "deck-16x9.html", "width": 1600, "height": 900 },
    { "ratio": "4:3", "kind": "cover", "file": "cover-4x3.html", "width": 1200, "height": 900 },
    { "ratio": "3:4", "kind": "cover", "file": "cover-3x4.html", "width": 900, "height": 1200 },
    { "ratio": "3:5", "kind": "content", "file": "deck-3x5.html", "width": 900, "height": 1500 }
  ],
  "warnings": []
}
```

Every file is standalone: inline CSS, inline runtime, no network dependency. Open it directly or screenshot it.

## 3. Minimal deck

```json
{
  "meta": {
    "slug": "my-deck",
    "title": "把知识做成一场演出",
    "subtitle": "课程设计与视觉节奏",
    "organization": "ALLINOST ACADEMY",
    "date": "2026.11",
    "theme": "editorial"
  },
  "cover": {
    "kicker": "COURSE DESIGN / 2026",
    "badge": "TEACHING DECK",
    "title": "把知识做成一场演出",
    "subtitle": "一门好课的设计、节奏与视觉表达。",
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
    "body": "把下一次分享交给一份可复用的内容结构。",
    "items": [{ "label": "Template", "value": "html-ppt-template" }]
  }
}
```

## 4. Layout selection

| Layout | Use it for | Required fields |
|---|---|---|
| `statement` | opening thesis, one big claim | `title` |
| `agenda` | 2–8 section preview | `title`, `items[]` |
| `bullets` | methodology, numbered points | `title`, `items[]` |
| `split` | text + visual/image | `title` |
| `stats` | 2–4 proof numbers | `title`, `items[2-4]` |
| `timeline` | 2–6 phases | `title`, `items[]` |
| `compare` | before/after, A/B | `title`, `items[2-3]` |
| `quote` | chapter turn, big statement | `quote` or `title` |
| `section` | part divider | `title`, optional `index` |
| `code` | code/config display | `title`, `code.content` |
| `table` | structured comparison | `title`, `headers[]`, `rows[]` |
| `image` | full-bleed visual | `title`, optional `src` |
| `closing` | CTA / contact | `title` |

Do not stack more than **3 consecutive content slides of the same layout**. Use `section` or `quote` between heavy layouts.

## 5. Ratio strategy

The renderer does the adaptation, but content should still respect the canvas:

- **16:9 (1600×900)** — horizontal two-column layouts, wide timelines, side-by-side comparisons. This is the primary content canvas.
- **4:3 (1200×900)** — cover only. Keep title short; the visual anchor sits on the right.
- **3:4 (900×1200)** — portrait cover only. Title moves up; art sits low.
- **3:5 (900×1500)** — portrait content. Prefer one column, vertical timelines, 2×2 stat grids. Avoid very wide tables; if a table is necessary, keep it to 4 columns and ≤6 rows.

Use **one deck for all four outputs**. Do not write separate copy for portrait unless the user explicitly asks.

## 6. Content quality rules

- One slide = one cognitive action. If a slide has two headlines, split it.
- Titles: 12–30 Chinese characters; body: ≤120 characters; bullets: 1–3 lines each.
- Prefer concrete nouns and numbers over adjectives.
- `kicker` is a short English label in most decks (`THE THESIS`, `AGENDA`, `PART ONE`), but Chinese is allowed.
- `body` supports `**bold**`, `*italic*`, `` `code` ``, `[link](https://...)`, and newlines.
- Use `theme`: `editorial` (warm magazine), `tech` (dark geek), `consulting` (clean report), `ink` (high-contrast manifesto), or `custom` with `appearance` for brand palettes.
- Custom appearance: `appearance.colors` (bg / bg2 / ink / muted / accent / accent2 / line / panel), `appearance.background` (`none|gradient|mesh|grid|dots|glass`), `appearance.typography` (font families + base/title/body/kicker scale). See `docs/projects/html-ppt-template/02-content-model.md`.
- Prefer OFL fonts (Noto / Source Han / Inter / JetBrains Mono / LXGW WenKai); never bundle a proprietary font file.
- Use `entrance`: `rise` (default), `blur`, `clip`, `scale`, `left`, `right` for variety — but keep at most one special entrance per 3 slides.

## 7. HTTP mode

If the local bridge is running (`npm run dev`):

```bash
curl -X POST http://127.0.0.1:4173/api/openclaw/render \
  -H "Content-Type: application/json" \
  --data-binary @request.json
```

`request.json`:

```json
{
  "deck": { "meta": { "title": "..." }, "slides": [] },
  "formats": "all",
  "theme": "editorial"
}
```

Validation endpoint: `POST /api/validate` with `{ "deck": ... }`.
Health endpoint: `GET /api/health`.

## 8. Failure handling

- Invalid JSON → `{ "ok": false, "error": "JSON 解析失败..." }`
- Schema errors → `{ "ok": false, "stage": "validate", "errors": [...] }`
- Unknown theme → falls back to `editorial` and returns a warning.
- Content overflow → the runtime reduces the type scale automatically (`--density`), but the right fix is shorter copy or more slides.

## 9. Do not

- Do not add external CSS/JS/fonts to the exported deck.
- Do not edit generated HTML in `exports/`; edit `deck.json` and re-render.
- Do not use `javascript:` URLs or raw HTML in text fields.
- Do not delete `manifest.json`; it is the machine-readable contract for downstream tools.
