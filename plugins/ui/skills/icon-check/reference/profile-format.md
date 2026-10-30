# Profile format: icon-check

A project's profile lives at `.claude/icon-check.md`: YAML front matter for settings, then optional Markdown notes. Every setting is optional; without a profile the script discovers the icons. Add one when discovery can't see them (icons generated at build time, several apps in one repository) or to fix where `sharp` comes from.

```yaml
---
profile_version: 1
root: "web"                           # the app's folder, relative to the repository root; default: the root
html:                                 # pages whose <link rel="icon"> tags to read; default: discovered
  - "web/src/index.html"
manifest: "web/public/site.webmanifest"   # default: the one the page links, else discovered
webroots:                             # folders that "/…" paths are served from; default: static/, public/,
  - "web/public"                      # wwwroot/ and assets/ beside or above the page, and the page's folder
icons:                                # explicit files by role; these win over discovery
  favicon-16: "web/public/favicon-16.png"
  favicon-32: "web/public/favicon-32.png"
  favicon-svg: "web/public/icon.svg"
  favicon-ico: "web/public/favicon.ico"
  any-192: "web/public/icon-192.png"
  any-512: "web/public/icon-512.png"
  maskable: "web/public/icon-maskable.png"
  apple-touch: "web/public/apple-touch-icon.png"
title: "Example App"                  # the tab title on the sheet; default: the manifest's short_name or name
sharp: "tools/images"                 # a folder whose node_modules has sharp; default: the project, then cwd
out: "$TMPDIR/icon-check.png"         # where the sheet goes; default: $TMPDIR/icon-check.png
---

Notes for the person reviewing, e.g. "the 16 px favicon is drawn by hand in design/favicon-16.png;
don't regenerate it from the SVG".
```

Paths are relative to the repository root. Each setting maps to a script option: `root` → `--root`, `html` → `--html`, `manifest` → `--manifest`, `webroots` → `--webroot`, `icons.<role>` → `--icon <role>=<path>`, `title` → `--title`, `sharp` → `--sharp`, `out` → `--out`.

## Discovery (no profile)

| What | How the script finds it |
|---|---|
| The page | `app.html` or `index.html` under the root (skipping `node_modules`, build output and hidden folders, up to 6 levels), the one with the most icon `<link>` tags; others are listed in the report |
| Favicons | `<link rel="icon">` by `sizes` (16x16, 32x32), `.svg` or `type="image/svg+xml"`, `.ico`; a link without `sizes` counts as the 32 px one |
| ICO | a linked `.ico`, else `favicon.ico` at a web root (browsers ask for it on their own) |
| Apple touch | `<link rel="apple-touch-icon">` (or `-precomposed`) |
| Manifest | `<link rel="manifest">`, else a `*.webmanifest` or `manifest.json` with `icons` |
| Manifest icons | `purpose` containing `any` (or none) at 192x192 and 512x512; `purpose` containing `maskable` |
| Paths | `/…` against the web roots; relative paths against the page's or manifest's folder; template placeholders such as `%PUBLIC_URL%` or `{{ base }}` are dropped; remote URLs are skipped |

A link to a file that isn't in the repository is reported, not guessed. Tell the user what was found, and offer a starter profile when anything had to be passed by hand.

## Example

A single-page app with its icons in `public/`, and a hand-drawn 16 px favicon:

```yaml
---
profile_version: 1
html: ["index.html"]
webroots: ["public"]
icons:
  favicon-16: "design/favicon-16.png"
---

The 16 px favicon is drawn by hand on the pixel grid; check it against the 32 px one at 8×.
```
