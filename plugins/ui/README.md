# ui plugin

Skills that check what users see, the way they see it.

| Skill | Invoke | What it does |
|---|---|---|
| [icon-check](skills/icon-check/README.md) | `/ui:icon-check [app folder]` | Renders the project's icons at the sizes people see them on one review sheet (PNG): favicons at 16 and 32 px with pixel zooms, in mocked light and dark browser tab bars at 1× and Retina, and the manifest, maskable (with Android's safe circle) and Apple touch icons. Reports missing sizes, an SVG favicon that overrides hand-tuned PNGs, maskable content outside the safe zone, and how the small sizes read. Finds icons from the HTML and the web manifest, or `.claude/icon-check.md`. Never edits icons. |

The skill carries a small Node script (`skills/icon-check/scripts/icon-sheet.mjs`) whose only dependency is `sharp`.

Install: see the [repository README](../../README.md#install).
