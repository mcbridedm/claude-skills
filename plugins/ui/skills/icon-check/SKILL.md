---
name: icon-check
description: Check a site's or app's icons at the sizes people actually see them, before a logo, favicon or app icon change ships. Renders one review sheet (PNG) with each favicon at 16 and 32 px and zoomed pixel by pixel, the favicon in mocked light and dark browser tab bars at 1× and Retina, and the app icons (manifest 192/512, maskable with Android's safe circle, Apple touch); reports missing sizes, an SVG favicon that overrides hand-tuned PNGs, and maskable content outside the safe zone, with guidance for small sizes. Use when a logo, favicon or app icon changes, or the user asks "is the favicon readable?", "check the icons", "how does the logo look small". Finds icons from the HTML link tags and the web manifest, or reads .claude/icon-check.md. Never edits the icons.
argument-hint: "[path to the web app or page, if not the repository root]"
---

# Icon check

You show a person how the project's icons look where people meet them: a browser tab at 16 px, a high-density tab, a home screen, an Android launcher. You render one review sheet, run the checks a script can make, look at the sheet yourself, and report. The person judges legibility; you make it easy to see and say what you notice.

**Never edit, regenerate or replace icons in this skill.** The outputs are a PNG sheet in a scratch folder and a short report. If the person then asks for changes, that's ordinary work after the skill.

It's cheap: one script run, no sub-agents, a few seconds. When you start it on your own (an icon changed in this session), say so in one line and go ahead.

Project specifics come from the project's profile at `.claude/icon-check.md` (Step P) or from discovery. This file stays general; never edit it during a run.

Supporting files, read them when a step points to them:
- `${CLAUDE_SKILL_DIR}/scripts/icon-sheet.mjs`: the renderer and checks (Node, needs `sharp`).
- `${CLAUDE_SKILL_DIR}/reference/profile-format.md`: the profile's settings, discovery and an example.
- `${CLAUDE_SKILL_DIR}/reference/guidance.md`: what makes an icon read at small sizes, for Step 3.

## Step C: Context check (first, before anything costly)

Before Step P, and before any command with side effects, run the check in `${CLAUDE_SKILL_DIR}/reference/context-check.md`. It decides whether this conversation is the right place to run the skill. On **fresh session** or **wait**, stop there and give the user what the check says. For this skill:
- **Authorship (2) and anchoring (4) don't move it:** checking an icon you just drew is the point, and the sheet is the evidence. Guard against them in Step 3: describe what the sheet shows before you judge it, and never call an icon readable without looking at the 16 px rows.
- **Readiness (6) weighs most:** Node and `sharp` (Step 1), and the icon files present (built or generated ones may need the build or generator to run first).
- **Moving target (5):** an icon generator or build still writing the files means wait.

## Step P: Load the profile

1. Read `.claude/icon-check.md` if it exists: paths to the HTML page(s), the manifest, web roots, icon files by role, where `sharp` is, where the sheet goes.
2. Otherwise rely on the script's discovery (the profile format's "Discovery"): it finds `app.html` or `index.html` pages with icon `<link>` tags, the manifest they link (or a `*.webmanifest` / `manifest.json`), and resolves `/…` paths against `static/`, `public/` and similar folders. If the argument names a folder (an app inside a monorepo), use it as `--root`.
3. Frameworks that generate the links (file-based icons such as `app/icon.png`, or a plugin that writes them at build time) may leave nothing to discover in source. Then point the script at the files with `--icon role=path`, or at the built HTML, and offer a profile at the end.

## Step 1: Find sharp

The script loads `sharp` from, in order: the profile's `sharp` folder, the project (beside the page it found, then the root), then the current folder. Check first: `node -e "require.resolve('sharp')"` from the project root or the app's folder.

If it isn't there, ask before installing anything (it downloads a native binary), then install it in a scratch folder, never into the project:

```
npm install --prefix "$TMPDIR/icon-check" sharp
node "${CLAUDE_SKILL_DIR}/scripts/icon-sheet.mjs" --sharp "$TMPDIR/icon-check" ...
```

If Node isn't available or the install fails, say so and stop with the commands for the person to run; don't hand-roll a sheet some other way.

## Step 2: Render the sheet

Run, from the repository root:

```
node "${CLAUDE_SKILL_DIR}/scripts/icon-sheet.mjs" --root <app folder> --out "$TMPDIR/icon-check.png" [profile options]
```

Profile settings map to options: `root` → `--root`, `html` → `--html` (repeatable), `manifest` → `--manifest`, `webroots` → `--webroot`, `icons.<role>` → `--icon <role>=<path>`, `title` → `--title`, `sharp` → `--sharp`, `out` → `--out`. `--json` prints the report as JSON. Exit code 3 means `sharp` wasn't found (Step 1).

The sheet holds:
- **Favicons:** each one (16 and 32 px PNGs, an SVG drawn at 16 and 32, the ICO's 16 and 32 entries) at true size on light and dark, and zoomed with nearest-neighbour (16 px at 8×, 32 px at 4×).
- **Tab bars:** the favicon beside two neutral placeholder tabs, light and dark, the project's tab active and inactive (two shades each), at 1× (the 16 px image) and Retina (the 32 px image at 16 CSS px, shown 2×). When an SVG favicon is linked, the tabs show the SVG, as supporting browsers would.
- **App icons:** manifest "any" 192 and 512, the maskable icon with the safe circle (80% of the width) dashed over it and cropped to two launcher shapes, and the Apple touch icon with a home-screen preview.

The text report lists what it read, the icon found for each role, and checks marked `ok`, `info`, `warn` or `missing`: an SVG favicon linked beside size-specific PNGs, missing sizes, wrong dimensions, transparent Apple touch or maskable corners, maskable content outside the safe circle, how much of the 16 px tile the drawing fills, and the favicon's weakest contrast against the tab bar shades.

## Step 3: Look, then judge

1. **Open the sheet** (read the PNG) and describe what each 16 px row shows before judging: what you can make out, what merges, what vanishes on which bar.
2. **Judge** with `${CLAUDE_SKILL_DIR}/reference/guidance.md`: fill the tile, stroke weight, the pixel grid, gaps between shapes, tile colour against both bars, and the maskable and Apple specifics. Tie each point to a row of the sheet.
3. **Check the script's warnings** against the sheet before repeating them; drop any the sheet shows don't matter, and say why.

## Hand off

Reply with:

```
Icon check: <sheet path>
Read: <page and manifest>  (or: profile)
Found: favicon 16 <path|->, 32 <path|->, SVG <path|->, ICO <path|->, any 192/512, maskable, apple-touch
Checks:
- [warn|missing] <what>, <why it matters>
What the sheet shows:
- <16 px, light bar>: <what reads, what doesn't>
- ...
Suggestions: <the few changes most likely to help, smallest first>
```

Show the sheet to the person (attach or link the PNG the way the session allows). Nothing is committed. If there was no profile and discovery needed help (`--icon`, `--html`), end with the starter profile you'd write and ask whether to save it.
