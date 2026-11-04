---
name: html-ppt-template
description: Generate animated HTML presentations from one JSON model; exports 16:9 content, 4:3 cover, 3:4 cover and 3:5 portrait content.
version: 1.0.0
---

# HTML PPT Template

This repository is an OpenClaw skill and a standalone template set. Start with:

1. `openclaw/SKILL.md` — workflow, layout cheat sheet and quality rules.
2. `openclaw/deck.schema.json` — machine-readable content contract.
3. `openclaw/manifest.json` — CLI/HTTP tool entrypoints.

Quick render:

```bash
node scripts/openclaw.mjs render --input examples/demo.deck.json --out exports/demo --formats all
```

Local studio:

```bash
npm run dev
# http://127.0.0.1:4173/src/
```

Humans should read `README.md`; agents should read `AGENTS.md` before changing the renderer or layouts.
