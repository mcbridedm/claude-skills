#!/usr/bin/env node
// icon-sheet: renders a site's icons at the sizes people see them, on one review sheet (PNG), and
// reports in text what's missing or likely to read badly. Part of the icon-check skill.
//
// Usage:
//   node icon-sheet.mjs [--root DIR] [--html FILE]... [--manifest FILE] [--webroot DIR]...
//                       [--icon ROLE=PATH]... [--title TEXT] [--out FILE] [--sharp DIR] [--json]
//
// Roles for --icon: favicon-16, favicon-32, favicon-svg, favicon-ico, any-192, any-512, maskable,
// apple-touch. Anything not given is discovered from the HTML <link> tags and the web manifest.
// The only dependency is sharp, loaded from --sharp DIR, the project, or the current folder.
// Exit codes: 0 sheet written, 2 bad arguments, 3 sharp not found.

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";

const ROLES = ["favicon-16", "favicon-32", "favicon-svg", "favicon-ico", "any-192", "any-512", "maskable", "apple-touch"];
const SKIP_DIRS = new Set(["node_modules", "dist", "build", "out", "coverage", "vendor", "target", "tmp"]);
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
// Tab bar colours close to common browsers' defaults. Each theme has two shades: the project's
// tab active (lighter in light mode, raised in dark) and inactive (the bar's own colour).
const THEMES = {
  light: { bar: "#dee1e6", active: "#ffffff", text: "#3c4043", muted: "#5f6368" },
  dark: { bar: "#202124", active: "#35363a", text: "#e8eaed", muted: "#9aa0a6" },
};
const SAFE_ZONE = 0.4; // Android's maskable safe zone: a circle of 80% of the width, so radius 0.4.

// ---------- arguments ----------

function usage(code) {
  const text = readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(3, 12);
  console.log(text.map((l) => l.replace(/^\/\/ ?/, "")).join("\n"));
  process.exit(code);
}

function parseArgs(argv) {
  const out = { html: [], webroot: [], icon: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const value = () => {
      if (i + 1 >= argv.length) usage(2);
      return argv[++i];
    };
    if (a === "--root") out.root = value();
    else if (a === "--html") out.html.push(value());
    else if (a === "--manifest") out.manifest = value();
    else if (a === "--webroot") out.webroot.push(value());
    else if (a === "--icon") {
      const [role, ...rest] = value().split("=");
      if (!ROLES.includes(role)) {
        console.error(`unknown icon role "${role}"; one of ${ROLES.join(", ")}`);
        process.exit(2);
      }
      out.icon[role] = rest.join("=");
    } else if (a === "--title") out.title = value();
    else if (a === "--out") out.out = value();
    else if (a === "--sharp") out.sharp = value();
    else if (a === "--json") out.json = true;
    else if (a === "-h" || a === "--help") usage(0);
    else {
      console.error(`unknown argument: ${a}`);
      usage(2);
    }
  }
  return out;
}

// ---------- discovery ----------

function walk(dir, depth, visit) {
  if (depth > 6) return;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(p, depth + 1, visit);
    } else visit(p, e.name);
  }
}

function parseLinks(html) {
  const links = [];
  for (const tag of html.matchAll(/<link\b[^>]*>/gi)) {
    const attrs = {};
    for (const a of tag[0].matchAll(/([a-zA-Z:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g))
      attrs[a[1].toLowerCase()] = a[2] ?? a[3] ?? a[4];
    if (attrs.rel) links.push({ ...attrs, rel: attrs.rel.toLowerCase().split(/\s+/) });
  }
  return links;
}

// Web roots: where "/favicon.png" is served from. static/ and public/ beside or above the file,
// the file's own folder, and anything given with --webroot.
function webrootsFor(file, root, extra) {
  const roots = [...extra.map((w) => resolve(w))];
  for (let d = dirname(file); ; d = dirname(d)) {
    for (const name of ["static", "public", "wwwroot", "assets"]) roots.push(join(d, name));
    roots.push(d);
    if (!relative(root, d) || dirname(d) === d || relative(root, d).startsWith("..")) break;
  }
  return [...new Set(roots)].filter((r) => existsSync(r));
}

function resolveHref(href, fromFile, webroots) {
  if (!href || /^(https?:)?\/\//i.test(href) || href.startsWith("data:")) return null;
  // Template placeholders such as %PUBLIC_URL% or {{ base }} stand for the web root.
  const clean = decodeURIComponent(href.replace(/%[A-Za-z_.]+%/g, "").replace(/\{\{[^}]*\}\}/g, "").replace(/[?#].*$/, ""));
  const path = clean.replace(/^\/+/, "");
  const candidates = clean.startsWith("/") ? [] : [resolve(dirname(fromFile), path)];
  for (const w of webroots) candidates.push(join(w, path));
  return candidates.find((c) => existsSync(c)) ?? { missing: href };
}

function discover(opts, root) {
  const found = { sources: [], notes: [], declared: [] };
  const set = (role, path, how) => {
    if (found[role] || !path) return;
    if (path.missing) found.notes.push(`${how} links ${path.missing}, which isn't in the repository`);
    else found[role] = path;
  };
  for (const [role, path] of Object.entries(opts.icon)) set(role, resolve(root, path), "the profile");

  let htmlFiles = opts.html.map((h) => resolve(root, h));
  const manifests = opts.manifest ? [resolve(root, opts.manifest)] : [];
  if (!htmlFiles.length || !manifests.length) {
    const html = [];
    walk(root, 0, (p, name) => {
      if (/^(app|index)\.html?$/i.test(name)) html.push(p);
      if (!opts.manifest && (/\.webmanifest$/i.test(name) || name === "manifest.json")) manifests.push(p);
    });
    if (!htmlFiles.length) {
      // Prefer the page that links the most icons; mention the others.
      const scored = html
        .map((p) => ({ p, n: parseLinks(readFileSync(p, "utf8")).filter((l) => l.rel.some((r) => r.includes("icon") || r === "manifest")).length }))
        .filter((s) => s.n > 0)
        .sort((a, b) => b.n - a.n);
      htmlFiles = scored.slice(0, 1).map((s) => s.p);
      if (scored.length > 1) found.notes.push(`also has icon links: ${scored.slice(1).map((s) => relative(root, s.p)).join(", ")} (pass --html to check one of those)`);
    }
  }

  let linkedManifest = null;
  for (const file of htmlFiles) {
    found.sources.push(relative(root, file));
    const webroots = webrootsFor(file, root, opts.webroot);
    for (const l of parseLinks(readFileSync(file, "utf8"))) {
      const where = `${relative(root, file)}`;
      const target = resolveHref(l.href, file, webroots);
      if (l.rel.includes("manifest")) {
        if (target && !target.missing) linkedManifest = target;
        continue;
      }
      const isIcon = l.rel.includes("icon");
      const isApple = l.rel.some((r) => r.startsWith("apple-touch-icon"));
      if (!isIcon && !isApple) continue;
      found.declared.push({ rel: l.rel.join(" "), href: l.href, sizes: l.sizes, type: l.type });
      const href = (l.href ?? "").toLowerCase();
      if (isApple) set("apple-touch", target, where);
      else if (href.endsWith(".svg") || l.type === "image/svg+xml") set("favicon-svg", target, where);
      else if (href.endsWith(".ico")) set("favicon-ico", target, where);
      else if (l.sizes === "16x16") set("favicon-16", target, where);
      else if (l.sizes === "32x32") set("favicon-32", target, where);
      else if (!found["favicon-32"] && !l.sizes) set("favicon-32", target, where);
    }
    // Browsers ask for /favicon.ico when nothing else is linked; look for one at the web root.
    if (!found["favicon-ico"]) {
      const ico = webroots.map((w) => join(w, "favicon.ico")).find((p) => existsSync(p));
      if (ico) {
        found["favicon-ico"] = ico;
        found.notes.push(`${relative(root, ico)} isn't linked, but browsers request /favicon.ico on their own`);
      }
    }
  }

  const manifest = opts.manifest ? manifests[0] : linkedManifest ?? manifests.find((m) => /"icons"/.test(readFileSync(m, "utf8")));
  if (manifest) {
    found.sources.push(relative(root, manifest));
    let json = {};
    try {
      json = JSON.parse(readFileSync(manifest, "utf8"));
    } catch (e) {
      found.notes.push(`${relative(root, manifest)} isn't valid JSON (${e.message})`);
    }
    found.name = json.short_name ?? json.name;
    const webroots = webrootsFor(manifest, root, opts.webroot);
    for (const icon of json.icons ?? []) {
      const purposes = (icon.purpose ?? "any").split(/\s+/);
      const sizes = (icon.sizes ?? "").split(/\s+/);
      const target = resolveHref(icon.src, manifest, webroots);
      found.declared.push({ rel: `manifest (${purposes.join(" ")})`, href: icon.src, sizes: icon.sizes, type: icon.type });
      if (purposes.includes("maskable")) set("maskable", target, relative(root, manifest));
      if (purposes.includes("any")) {
        if (sizes.includes("192x192")) set("any-192", target, relative(root, manifest));
        if (sizes.includes("512x512")) set("any-512", target, relative(root, manifest));
      }
    }
  }
  return found;
}

// ---------- images ----------

function parseIco(buf) {
  if (buf.length < 6 || buf.readUInt16LE(0) !== 0 || buf.readUInt16LE(2) !== 1) return [];
  const entries = [];
  for (let i = 0; i < buf.readUInt16LE(4); i++) {
    const o = 6 + 16 * i;
    const w = buf[o] || 256;
    const h = buf[o + 1] || 256;
    const data = buf.subarray(buf.readUInt32LE(o + 12), buf.readUInt32LE(o + 12) + buf.readUInt32LE(o + 8));
    if (data.subarray(0, 8).equals(PNG_SIG)) entries.push({ w, h, png: data });
    else if (data.readUInt16LE(14) === 32) {
      // A 32-bit BMP entry: BGRA rows, bottom up, after the header.
      const start = data.readUInt32LE(0);
      const rgba = Buffer.alloc(w * h * 4);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const s = start + ((h - 1 - y) * w + x) * 4;
          const t = (y * w + x) * 4;
          rgba[t] = data[s + 2];
          rgba[t + 1] = data[s + 1];
          rgba[t + 2] = data[s];
          rgba[t + 3] = data[s + 3];
        }
      entries.push({ w, h, rgba });
    } else entries.push({ w, h, unsupported: `${data.readUInt16LE(14)}-bit BMP` });
  }
  return entries;
}

async function loadImage(sharp, path) {
  const buf = readFileSync(path);
  if (path.toLowerCase().endsWith(".svg")) return { path, svg: buf };
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { path, width: info.width, height: info.height, rgba: data };
}

// The image at `size` px, as a browser would draw it: a matching raster as is, others resampled,
// an SVG rasterized at that size.
async function atSize(sharp, img, size) {
  if (img.svg) {
    const { data } = await sharp(img.svg, { density: 72 * Math.max(1, size / 8) })
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    return { width: size, height: size, rgba: data };
  }
  if (img.width === size && img.height === size) return img;
  const { data } = await sharp(img.rgba, { raw: { width: img.width, height: img.height, channels: 4 } })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { width: size, height: size, rgba: data };
}

const png = (sharp, img, size, kernel = "lanczos3") =>
  sharp(img.rgba, { raw: { width: img.width, height: img.height, channels: 4 } }).resize(size, size, { kernel }).png().toBuffer();

// ---------- pixel checks ----------

const px = (img, x, y) => img.rgba.subarray((y * img.width + x) * 4, (y * img.width + x) * 4 + 4);
const differs = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) > 60 || Math.abs(a[3] - b[3]) > 60;

// Share of the tile the drawing's bounding box covers (by alpha).
function fill(img) {
  let x0 = img.width, y0 = img.height, x1 = -1, y1 = -1;
  for (let y = 0; y < img.height; y++)
    for (let x = 0; x < img.width; x++)
      if (px(img, x, y)[3] > 32) {
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      }
  return x1 < 0 ? 0 : ((x1 - x0 + 1) * (y1 - y0 + 1)) / (img.width * img.height);
}

// The most common opaque colour, quantized: the tile's colour, or the glyph's when there's no tile.
function dominant(img) {
  const counts = new Map();
  for (let i = 0; i < img.rgba.length; i += 4) {
    if (img.rgba[i + 3] < 200) continue;
    const key = ((img.rgba[i] >> 4) << 8) | ((img.rgba[i + 1] >> 4) << 4) | (img.rgba[i + 2] >> 4);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!top) return null;
  return [((top[0] >> 8) & 15) * 17, ((top[0] >> 4) & 15) * 17, (top[0] & 15) * 17];
}

function luminance([r, g, b]) {
  const c = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
}
const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
const contrast = (a, b) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

// Pixels outside the safe circle that differ from the background (the corner pixel).
function maskableCheck(img) {
  const bg = px(img, 0, 0);
  const c = (img.width - 1) / 2;
  const r = SAFE_ZONE * img.width;
  let outside = 0, ring = 0, reach = 0;
  for (let y = 0; y < img.height; y++)
    for (let x = 0; x < img.width; x++) {
      const d = Math.hypot(x - c, y - c);
      const content = differs(px(img, x, y), bg);
      if (content) reach = Math.max(reach, d / img.width);
      if (d > r && d <= img.width / 2) {
        ring++;
        if (content) outside++;
      }
    }
  return { outside, share: outside / ring, reach, opaqueCorner: bg[3] === 255 };
}

// ---------- the sheet ----------

const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
const FONT = "system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";

class Sheet {
  constructor(width) {
    this.width = width;
    this.y = 0;
    this.base = []; // SVG drawn under the icons
    this.over = []; // SVG drawn over them (guides)
    this.images = []; // { input, left, top }
  }
  text(x, y, s, { size = 13, weight = 400, fill = "#202124", anchor = "start" } = {}) {
    this.base.push(`<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(s)}</text>`);
  }
  rect(x, y, w, h, fill, extra = "") {
    this.base.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`);
  }
  checker(x, y, w, h) {
    this.rect(x, y, w, h, "url(#checker)", 'stroke="#c4c7c5"');
  }
  image(input, left, top) {
    this.images.push({ input, left: Math.round(left), top: Math.round(top) });
  }
  heading(s, sub) {
    this.y += 36;
    this.text(24, this.y, s, { size: 18, weight: 600 });
    if (sub) this.text(24, this.y + 20, sub, { size: 12, fill: "#5f6368" });
    this.y += sub ? 36 : 16;
  }
  async render(sharp) {
    const h = Math.ceil(this.y + 24);
    const defs = `<defs><pattern id="checker" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#ffffff"/><rect width="8" height="8" fill="#e8eaed"/><rect x="8" y="8" width="8" height="8" fill="#e8eaed"/></pattern></defs>`;
    const svg = (body, bg) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${h}">${defs}${bg ? `<rect width="100%" height="100%" fill="${bg}"/>` : ""}${body.join("")}</svg>`);
    return sharp(svg(this.base, "#f8f9fa"))
      .composite([...this.images, { input: svg(this.over), left: 0, top: 0 }])
      .png()
      .toBuffer();
  }
}

// A placeholder site's icon: a plain grey globe.
function globe(cx, cy, s, colour) {
  return `<g fill="none" stroke="${colour}" stroke-width="${1.2 * s}"><circle cx="${cx}" cy="${cy}" r="${6.5 * s}"/><ellipse cx="${cx}" cy="${cy}" rx="${2.8 * s}" ry="${6.5 * s}"/><line x1="${cx - 6.5 * s}" y1="${cy}" x2="${cx + 6.5 * s}" y2="${cy}"/></g>`;
}

// One mocked tab bar: [example.com] [this site] [docs], at scale s (1 or 2).
function tabBar(sheet, x, y, s, theme, projectActive, favicon, title) {
  const t = THEMES[theme];
  const tabW = 190 * s, tabH = 30 * s, padTop = 6 * s, barH = tabH + padTop;
  sheet.rect(x, y, tabW * 3 + 24 * s, barH, t.bar);
  const tabs = [
    { name: "example.com", project: false },
    { name: title, project: true },
    { name: "docs", project: false },
  ];
  tabs.forEach((tab, i) => {
    const tx = x + 8 * s + i * tabW;
    const active = tab.project === projectActive && (tab.project || i === 0);
    if (active) sheet.rect(tx, y + padTop, tabW, tabH, t.active, `rx="${8 * s}"`);
    else if (i > 0) sheet.rect(tx, y + padTop + 8 * s, s, tabH - 16 * s, t.muted, 'opacity="0.5"');
    const iconX = tx + 12 * s, iconY = y + padTop + (tabH - 16 * s) / 2;
    if (tab.project) sheet.image(favicon, iconX, iconY);
    else sheet.base.push(globe(iconX + 8 * s, iconY + 8 * s, s, t.muted));
    sheet.text(iconX + 24 * s, iconY + 12 * s, tab.name, { size: 12 * s, fill: active ? t.text : t.muted });
  });
  return barH;
}

// ---------- main ----------

async function loadSharp(bases) {
  for (const base of bases.filter(Boolean)) {
    try {
      const req = createRequire(join(resolve(base), "noop.js"));
      return req(req.resolve("sharp"));
    } catch {}
  }
  try {
    return (await import("sharp")).default;
  } catch {}
  console.error(
    "sharp isn't installed where this script can find it. Either run from (or pass --sharp) a folder whose node_modules has sharp, or install it in a scratch folder:\n" +
      '  npm install --prefix "${TMPDIR:-/tmp}/icon-check" sharp\n' +
      '  node icon-sheet.mjs --sharp "${TMPDIR:-/tmp}/icon-check" ...',
  );
  process.exit(3);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const root = resolve(opts.root ?? process.cwd());
  const found = discover(opts, root);
  const sharp = await loadSharp([opts.sharp, ...found.sources.map((s) => dirname(join(root, s))), root, process.cwd()]);
  const title = opts.title ?? found.name ?? "This site";
  const checks = []; // { level: ok | warn | missing | info, text }
  const say = (level, text) => checks.push({ level, text });
  for (const n of found.notes) say("info", n);

  const img = {};
  // The ICO is read entry by entry below; sharp can't open it whole.
  for (const role of ROLES) if (found[role] && role !== "favicon-ico") img[role] = await loadImage(sharp, found[role]).catch((e) => say("warn", `${relative(root, found[role])} couldn't be read (${e.message})`));

  // Favicon sources: PNGs, the SVG at both sizes, and the ICO's 16 and 32 entries.
  const fav = [];
  const add = (label, image, size) => image && fav.push({ label, image, size });
  if (img["favicon-16"]) add(`${relative(root, found["favicon-16"])}`, img["favicon-16"], 16);
  if (img["favicon-32"]) add(`${relative(root, found["favicon-32"])}`, img["favicon-32"], 32);
  if (img["favicon-svg"]) for (const s of [16, 32]) add(`${relative(root, found["favicon-svg"])} at ${s} px`, await atSize(sharp, img["favicon-svg"], s), s);
  if (found["favicon-ico"]) {
    for (const e of parseIco(readFileSync(found["favicon-ico"]))) {
      if (e.unsupported) say("info", `${relative(root, found["favicon-ico"])} has a ${e.w}×${e.h} ${e.unsupported} entry this script can't draw`);
      else if (e.w === e.h && (e.w === 16 || e.w === 32)) {
        const image = e.png
          ? await sharp(e.png).ensureAlpha().raw().toBuffer({ resolveWithObject: true }).then(({ data, info }) => ({ width: info.width, height: info.height, rgba: data }))
          : { width: e.w, height: e.h, rgba: e.rgba };
        add(`${relative(root, found["favicon-ico"])} (${e.w}×${e.h} entry)`, image, e.w);
      }
    }
  }

  // What the tab shows: browsers that support SVG favicons use it at every size.
  const svgWins = !!img["favicon-svg"];
  const pick = (size) => {
    if (svgWins) return fav.find((f) => f.size === size && f.label.includes(" at "));
    return fav.find((f) => f.size === size && f.image.width === size) ?? fav[0];
  };
  const tab16 = pick(16), tab32 = pick(32);

  // Checks.
  if (svgWins && (img["favicon-16"] || img["favicon-32"]))
    say("warn", "An SVG favicon is linked beside size-specific PNGs. Browsers that support SVG favicons prefer it and scale it to every size, so a hand-tuned 16 px PNG is never shown there. Drop the SVG link, or make the SVG itself read at 16 px.");
  if (!img["favicon-16"] && !svgWins && !fav.some((f) => f.size === 16)) say("missing", "No 16 px favicon: browsers scale a larger one down, which blurs thin strokes. Add a 16×16 PNG (or a 16 px ICO entry).");
  if (!img["favicon-32"] && !svgWins && !fav.some((f) => f.size === 32)) say("missing", "No 32 px favicon: high-density screens draw the tab icon at 32 device pixels. Add a 32×32 PNG.");
  if (!found["favicon-ico"]) say("info", "No favicon.ico at the web root: some tools, feed readers and older browsers ask for /favicon.ico regardless of the links.");
  if (!img["apple-touch"]) say("missing", "No apple-touch-icon: iOS uses a screenshot of the page for home-screen shortcuts. Add a 180×180 PNG, opaque, no transparency.");
  if (!img["any-192"]) say("missing", 'No manifest icon of 192×192 with purpose "any": Android and installable-app checks expect one.');
  if (!img["any-512"]) say("missing", 'No manifest icon of 512×512 with purpose "any": used for splash screens and install dialogs.');
  if (!img.maskable) say("missing", 'No maskable icon: Android crops a purpose "any" icon into its shape and may shrink it onto a white plate. Add a 512×512 maskable icon with the mark inside the central 80% circle.');
  const expect = { "favicon-16": 16, "favicon-32": 32, "any-192": 192, "any-512": 512, maskable: 512, "apple-touch": 180 };
  for (const [role, size] of Object.entries(expect)) {
    const i = img[role];
    if (!i || i.svg) continue;
    // A maskable icon may come in several sizes; it only has to be square and big enough.
    const wrong = role === "maskable" ? i.width !== i.height || i.width < 192 : i.width !== size || i.height !== size;
    const want = role === "maskable" ? "a square of at least 192×192 (512×512 is usual)" : `${size}×${size}`;
    if (wrong) say("warn", `${relative(root, found[role])} is ${i.width}×${i.height}; ${role} should be ${want}.`);
  }
  if (img["apple-touch"] && !img["apple-touch"].svg && px(img["apple-touch"], 0, 0)[3] < 255)
    say("warn", "The apple-touch-icon has transparent corners: iOS fills them with black. Make it opaque; iOS rounds the corners itself.");
  if (tab16) {
    const f = fill(tab16.image);
    if (f < 0.75) say("warn", `At 16 px the drawing covers ${Math.round(f * 100)}% of the tile (by its bounding box). Padding wastes pixels at this size: fill the tile.`);
    else say("ok", `At 16 px the drawing covers ${Math.round(f * 100)}% of the tile.`);
    const colour = dominant(tab16.image);
    if (colour) {
      const shades = Object.entries(THEMES).flatMap(([name, t]) => [
        { name: `${name} bar`, ratio: contrast(colour, hex(t.bar)) },
        { name: `${name} active tab`, ratio: contrast(colour, hex(t.active)) },
      ]);
      const worst = shades.sort((a, b) => a.ratio - b.ratio)[0];
      const label = `rgb(${colour.join(", ")})`;
      const text = `The favicon's main colour (${label}) is ${worst.ratio.toFixed(2)}:1 against the ${worst.name}, its weakest shade`;
      if (worst.ratio < 1.25) say("warn", `${text}: it can disappear there. A tile colour that contrasts with both light and dark tab bars stands out most; look at that row on the sheet.`);
      else say("ok", `${text}.`);
    }
  }
  if (img.maskable && !img.maskable.svg) {
    const m = maskableCheck(img.maskable);
    if (!m.opaqueCorner) say("warn", "The maskable icon's corners are transparent: maskable icons should be full-bleed, with the background filling the whole square.");
    if (m.outside > 0)
      say("warn", `The maskable icon has content outside the safe circle: ${m.outside} pixels (${(m.share * 100).toFixed(1)}% of the ring), reaching a circle ${(m.reach * 200).toFixed(0)}% of the width across (the safe circle is 80%). Some launchers will crop it.`);
    else say("ok", `The maskable icon's content stays inside the safe circle (it reaches a circle ${(m.reach * 200).toFixed(0)}% of the width across; the safe circle is 80%).`);
  }

  // Draw.
  const sheet = new Sheet(1240);
  sheet.y = 16;
  sheet.text(24, sheet.y + 22, `Icon check: ${title}`, { size: 22, weight: 700 });
  sheet.text(24, sheet.y + 44, `From ${found.sources.join(", ") || "the profile"}. Each icon at the size people see it; zooms are nearest-neighbour, so every pixel shows.`, { size: 12, fill: "#5f6368" });
  sheet.y += 52;

  sheet.heading("Favicons", "True size on light and dark, then zoomed: 16 px at 8×, 32 px at 4×.");
  if (!fav.length) {
    sheet.text(24, sheet.y + 16, "No favicon found.", { fill: "#b3261e" });
    sheet.y += 28;
  }
  // A grid of three per row: label, true size on light and dark, the zoom on a checkerboard.
  for (const [i, f] of fav.entries()) {
    const x = 24 + (i % 3) * 400;
    const y = sheet.y;
    sheet.text(x, y + 16, f.label, { size: 12, weight: 600 });
    sheet.rect(x, y + 28, 48, 48, "#ffffff", 'stroke="#c4c7c5"');
    sheet.rect(x, y + 84, 48, 48, "#202124");
    const real = await png(sharp, f.image, f.size, "nearest");
    for (const top of [y + 28, y + 84]) sheet.image(real, x + (48 - f.size) / 2, top + (48 - f.size) / 2);
    sheet.checker(x + 64, y + 28, 128, 128);
    sheet.image(await png(sharp, f.image, 128, "nearest"), x + 64, y + 28);
    sheet.text(x + 204, y + 92, `${f.size} px, ${128 / f.size}×`, { size: 12, fill: "#5f6368" });
    if (f.image.width !== f.size) sheet.text(x + 204, y + 110, `(source ${f.image.width}×${f.image.height}, scaled)`, { size: 12, fill: "#5f6368" });
    if (i % 3 === 2 || i === fav.length - 1) sheet.y += 172;
  }

  sheet.heading("In a tab bar", `1× uses the 16 px image; Retina draws the 32 px image at 16 CSS px, shown here at 2×.${svgWins ? " The SVG is shown, since browsers that support it prefer it." : ""}`);
  if (tab16 || tab32) {
    const small = tab16 ? await png(sharp, tab16.image, 16) : await png(sharp, tab32.image, 16);
    const big = tab32 ? await png(sharp, tab32.image, 32) : await png(sharp, tab16.image, 32);
    for (const theme of ["light", "dark"])
      for (const active of [true, false]) {
        sheet.text(24, sheet.y + 14, `${theme}, ${active ? "active tab" : "inactive tab"}, 1×`, { size: 11, fill: "#5f6368" });
        sheet.y += 20 + tabBar(sheet, 24, sheet.y + 20, 1, theme, active, small, title) + 10;
      }
    for (const theme of ["light", "dark"])
      for (const active of [true, false]) {
        sheet.text(24, sheet.y + 14, `${theme}, ${active ? "active tab" : "inactive tab"}, Retina (2×)`, { size: 11, fill: "#5f6368" });
        sheet.y += 20 + tabBar(sheet, 24, sheet.y + 20, 2, theme, active, big, title) + 10;
      }
  }

  sheet.heading("App icons", "Manifest icons (purpose any), the maskable icon with Android's safe circle (80%), and the Apple touch icon.");
  const top = sheet.y;
  let x = 24;
  const tile = async (label, image, shown, decorate) => {
    sheet.text(x, top + 14, label, { size: 12, weight: 600 });
    if (!image || image.svg) {
      sheet.rect(x, top + 24, shown, shown, "none", 'stroke="#b3261e" stroke-dasharray="6 4"');
      sheet.text(x + shown / 2, top + 24 + shown / 2, image?.svg ? "SVG (not drawn)" : "missing", { size: 12, fill: "#b3261e", anchor: "middle" });
    } else {
      sheet.checker(x, top + 24, shown, shown);
      sheet.image(await png(sharp, image, shown), x, top + 24);
      if (decorate) await decorate(x, top + 24, shown, image);
    }
    x += shown + 32;
  };
  await tile("any 192 (true size)", img["any-192"], 192);
  await tile("any 512 (at half size)", img["any-512"], 256);
  await tile("maskable (at half size)", img.maskable, 256, async (left, y, s, image) => {
    const c = s / 2;
    sheet.over.push(`<circle cx="${left + c}" cy="${y + c}" r="${SAFE_ZONE * s}" fill="none" stroke="#d93025" stroke-width="2" stroke-dasharray="6 4"/>`);
    // Two common launcher shapes, cropped at 72 px.
    for (const [i, shape] of [`<circle cx="36" cy="36" r="36"/>`, `<rect width="72" height="72" rx="16"/>`].entries()) {
      const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72">${shape}</svg>`);
      const cropped = await sharp(await png(sharp, image, 72)).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
      sheet.image(cropped, left + s + 12, y + i * 84);
    }
  });
  x += 84;
  await tile("apple-touch (true size)", img["apple-touch"], 180, async (left, y, s, image) => {
    const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><rect width="60" height="60" rx="13.5"/></svg>`);
    const home = await sharp(await png(sharp, image, 60)).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
    sheet.image(home, left, y + s + 12);
    sheet.text(left + 70, y + s + 46, "home screen, 60 px", { size: 11, fill: "#5f6368" });
  });
  sheet.y = top + 24 + 256 + 90;

  const out = resolve(opts.out ?? join(process.env.TMPDIR ?? tmpdir(), "icon-check.png"));
  writeFileSync(out, await sheet.render(sharp));

  const report = { sheet: out, sources: found.sources, icons: Object.fromEntries(ROLES.filter((r) => found[r]).map((r) => [r, relative(root, found[r])])), declared: found.declared, checks };
  if (opts.json) console.log(JSON.stringify(report, null, 2));
  else {
    console.log(`Sheet: ${out}`);
    console.log(`Read: ${found.sources.join(", ") || "(profile only)"}`);
    for (const r of ROLES) console.log(`  ${r.padEnd(12)} ${found[r] ? relative(root, found[r]) : "-"}`);
    console.log("Checks:");
    for (const c of checks) console.log(`  [${c.level}] ${c.text}`);
  }
}

main().catch((e) => {
  console.error(e.stack ?? String(e));
  process.exit(1);
});
