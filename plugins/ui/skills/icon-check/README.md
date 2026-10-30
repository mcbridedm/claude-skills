# icon-check

Renders a project's icons at the sizes people actually see them, on one review sheet, so a person can judge legibility before a logo or icon change ships.

- **Invoke:** `/ui:icon-check [app folder]` when installed as a plugin, or `/icon-check` when copied into a skills folder.
- **Produces:** one PNG sheet in a scratch folder (default `$TMPDIR/icon-check.png`) and a short report: what was found, the checks, what the sheet shows, and suggestions. Changes nothing in the repository.
- **Cost:** low. One Node script run (seconds), no sub-agents. Needs Node and [`sharp`](https://sharp.pixelplumbing.com/): the project's own if it has it, otherwise installed in a scratch folder after asking.
- **When to run it:** a logo, favicon or app icon changes; someone asks "is the favicon readable?", "check the icons", "how does the logo look small". Not a general accessibility or design review.

## What the sheet shows

- **Favicons:** each at 16 and 32 px at true size on light and dark, plus nearest-neighbour zooms (16 px at 8×, 32 px at 4×), so every pixel shows. PNGs, an SVG drawn at both sizes, and the ICO's 16 and 32 entries.
- **Tab bars:** the favicon in mocked browser tab bars, light and dark, its tab active and inactive, beside two neutral placeholder tabs ("example.com", "docs"), at 1× (the 16 px image) and Retina (the 32 px image drawn at 16 CSS px, shown 2×).
- **App icons:** the manifest's "any" 192 and 512, the maskable icon with Android's safe circle (80% of the width) dashed over it and cropped to a circle and a rounded square, and the Apple touch icon (180) with a home-screen preview.

## What it checks

- An SVG favicon linked alongside size-specific PNGs: browsers that support SVG favicons prefer it and scale it to every size, so a hand-tuned 16 px PNG is never used there.
- Missing sizes (16, 32, ICO, Apple touch, manifest 192 and 512, maskable) and wrong dimensions.
- Maskable content outside the safe circle (pixels outside it that differ from the background), and transparent corners on maskable and Apple touch icons.
- How much of the 16 px tile the drawing fills, and the favicon's weakest contrast against the light and dark tab bar shades.

Then Claude looks at the sheet and judges it against [reference/guidance.md](reference/guidance.md): fill the tile, thicken strokes at small sizes, draw 16 px by hand on the pixel grid when outlines blur, keep a pixel's gap between shapes, and pick a tile colour that contrasts with both light and dark tab bars.

## How it finds the icons

From the HTML `<link rel="icon">` and `apple-touch-icon` tags and the web manifest, searching `app.html` and `index.html` pages and `*.webmanifest` / `manifest.json` files, and resolving `/…` paths against `static/`, `public/` and similar folders. Or from a profile (below). The script runs on its own too:

```
node scripts/icon-sheet.mjs --root path/to/app --out /tmp/icons.png
node scripts/icon-sheet.mjs --icon favicon-16=design/fav16.png --icon maskable=public/m.png --json
```

## Context check

Checking an icon you just drew is the point, so authorship doesn't send it to a fresh session; readiness (Node, `sharp`, the icon files built) weighs most.

## Model invocation

The repository's rule is to set `disable-model-invocation: true` for skills that spawn agents, commit, push or cost a lot. This one is left model-invocable on purpose: its value is being run right after an icon changes, in the session that changed it; it's cheap (one script, seconds), writes only a scratch PNG, and never edits icons or commits. When Claude starts it on its own, it says so in one line.

## Project profile

Optional. Put project specifics in `.claude/icon-check.md`: the page, manifest, web roots, icon files by role, where `sharp` is. See [reference/profile-format.md](reference/profile-format.md) for the settings, discovery and an example. Needed mainly when icons or their links are generated at build time.

## Sample output

```
Icon check: /tmp/icon-check.png
Read: web/index.html, web/public/site.webmanifest
Found: favicon 16 public/favicon-16.png, 32 public/favicon-32.png, SVG public/icon.svg, ICO -, any 192/512, maskable, apple-touch
Checks:
- [warn] An SVG favicon is linked beside size-specific PNGs: supporting browsers show the SVG, so the hand-drawn 16 px PNG is never used there.
- [info] No favicon.ico at the web root.
- [ok] The maskable icon's content stays inside the safe circle (it reaches a circle 71% of the width across).
What the sheet shows:
- 16 px (the SVG), light bar: the two letters touch and read as one blob; the hand-drawn PNG keeps a pixel between them.
- 16 px, dark bar: the white tile stands out; on the light bar its edge disappears.
Suggestions: drop the SVG link so the 16 px PNG is used; give the tile a mid-tone colour.
```
