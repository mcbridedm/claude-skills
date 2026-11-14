#!/usr/bin/env node
// discover: reads a repository's mobile platform targets from its build files, without building
// or changing anything. Part of the os-release-check skill.
//
// Usage:
//   node discover.mjs [--root DIR] [--json]
//
// Android: compileSdk, targetSdk and minSdk per Gradle module (literals, version-catalog refs and
// simple `val x = 36` constants), whether the module is an app, a library or a Wear OS app, and
// AGP, Kotlin, Compose BOM and Gradle wrapper versions. Apple: deployment targets per platform
// from Xcode projects, XcodeGen project.yml and Package.swift, the Swift tools version, and a
// pinned Xcode version (.xcode-version, XcodeGen xcodeVersion). A value it can't resolve is
// reported as the expression it found, never guessed. Exit codes: 0 done, 2 bad arguments.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, basename, dirname } from "node:path";

const SKIP_DIRS = new Set([
  ".git", ".gradle", ".idea", "build", "DerivedData", "Pods", "Carthage", "node_modules", ".build",
  "dist", "out", "vendor", "tmp", ".swiftpm",
]);
const MAX_DEPTH = 6;

function usage(code) {
  const text = readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(3, 7);
  console.log(text.map((l) => l.replace(/^\/\/ ?/, "")).join("\n"));
  process.exit(code);
}

const args = { root: ".", json: false };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--root" && argv[i + 1]) args.root = argv[++i];
  else if (argv[i] === "--json") args.json = true;
  else if (argv[i] === "--help" || argv[i] === "-h") usage(0);
  else usage(2);
}
const root = resolve(args.root);
if (!existsSync(root)) {
  console.error(`no such folder: ${root}`);
  process.exit(2);
}

// ---------- walk ----------

const files = [];
const dirsSeen = [];
(function walk(dir, depth) {
  if (depth > MAX_DEPTH) return;
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    const p = join(dir, name);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      if (name.endsWith(".xcodeproj")) dirsSeen.push(p);
      walk(p, depth + 1);
    } else files.push(p);
  }
})(root, 0);

const read = (p) => {
  try {
    return readFileSync(p, "utf8");
  } catch {
    return "";
  }
};
const rel = (p) => relative(root, p) || ".";
const uniq = (xs) => [...new Set(xs.filter((x) => x !== undefined && x !== null && x !== ""))];

// ---------- Android ----------

function parseToml(text) {
  // Just enough of TOML for a Gradle version catalog: [section] and key = "value" or { ... }.
  const out = {};
  let section = "";
  for (const raw of text.split("\n")) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const sec = line.match(/^\[([^\]]+)\]$/);
    if (sec) {
      section = sec[1].trim();
      out[section] ??= {};
      continue;
    }
    const kv = line.match(/^([A-Za-z0-9_.-]+)\s*=\s*(.+)$/);
    if (!kv || !section) continue;
    out[section][kv[1]] = kv[2].trim();
  }
  return out;
}

const catalogs = files.filter((f) => /\/gradle\/[^/]+\.versions\.toml$/.test(f));
const versions = {}; // catalog version key -> value
const libraries = {}; // catalog alias -> raw entry
const plugins = {};
for (const c of catalogs) {
  const t = parseToml(read(c));
  for (const [k, v] of Object.entries(t.versions ?? {})) versions[k] = v.replace(/^"|"$/g, "");
  Object.assign(libraries, t.libraries ?? {});
  Object.assign(plugins, t.plugins ?? {});
}
const catalogKey = (k) => k.replace(/[._-]/g, "").toLowerCase();
const versionByAccessor = Object.fromEntries(Object.entries(versions).map(([k, v]) => [catalogKey(k), v]));

function catalogVersionOf(entry) {
  if (!entry) return undefined;
  const ref = entry.match(/version\.ref\s*=\s*"([^"]+)"/);
  if (ref) return versions[ref[1]];
  const lit = entry.match(/version\s*=\s*"([^"]+)"/) ?? entry.match(/^"[^"]*:([^:"]+)"$/);
  return lit?.[1];
}
function findCatalog(table, test) {
  for (const [alias, entry] of Object.entries(table)) if (test(alias, entry)) return catalogVersionOf(entry);
  return undefined;
}

const gradleFiles = files.filter((f) => /(^|\/)build\.gradle(\.kts)?$/.test(f));
const settingsFiles = files.filter((f) => /(^|\/)settings\.gradle(\.kts)?$/.test(f));
// Simple constants anywhere in the build logic (buildSrc, build-logic, root build files).
const constants = {};
for (const f of files.filter((f) => /\.(gradle|kts)$/.test(f))) {
  for (const m of read(f).matchAll(/\b(?:const\s+)?val\s+([A-Za-z_]\w*)\s*(?::\s*Int\s*)?=\s*(\d{2})\b/g))
    constants[m[1]] = m[2];
  for (const m of read(f).matchAll(/\bext\.([A-Za-z_]\w*)\s*=\s*(\d{2})\b/g)) constants[m[1]] = m[2];
}

function resolveSdk(expr) {
  if (!expr) return undefined;
  const e = expr.trim();
  if (/^\d+$/.test(e)) return { value: Number(e) };
  const cat = e.match(/libs\.versions\.([\w.]+)\.get\(\)/);
  if (cat) {
    const v = versionByAccessor[catalogKey(cat[1])];
    if (v && /^\d+$/.test(v)) return { value: Number(v), via: `catalog ${cat[1]}` };
  }
  const name = e.replace(/^(rootProject\.ext\.|project\.ext\.|ext\.)/, "").replace(/\.toInt\(\)$/, "");
  if (constants[name]) return { value: Number(constants[name]), via: `constant ${name}` };
  // Preview platforms: compileSdkPreview = "Baklava" and the like.
  const preview = e.match(/^"([A-Za-z][\w]*)"$/);
  if (preview) return { value: preview[1], via: "preview" };
  return { unresolved: e };
}

function sdkSetting(text, key) {
  // compileSdk = 36, compileSdk 36, compileSdkVersion(34), targetSdk = libs.versions.x.get().toInt(),
  // compileSdkPreview = "Baklava"
  const re = new RegExp(`\\b${key}(?:Version)?(?:Preview)?[ \\t]*(?:=[ \\t]*|\\([ \\t]*|[ \\t]+)("[^"\\n]*"|[\\w.]+(?:\\(\\))?(?:\\.\\w+(?:\\(\\))?)*)`);
  const m = text.match(re);
  return m ? resolveSdk(m[1].replace(/\.toInt\(\)$/, "")) : undefined;
}
// compileSdk { version = release(36) } (newer AGP DSL).
function sdkBlock(text, key) {
  const m = text.match(new RegExp(`\\b${key}\\s*\\{[^}]*?release\\((\\d+)\\)`, "s"));
  return m ? { value: Number(m[1]) } : undefined;
}

const modules = [];
for (const f of gradleFiles) {
  const t = read(f);
  const isApp = /com\.android\.application|alias\(libs\.plugins\.android\.application\)|android\.application/.test(t);
  const isLib = /com\.android\.library|alias\(libs\.plugins\.android\.library\)|android\.library/.test(t);
  if (!isApp && !isLib && !/\bandroid\s*\{/.test(t)) continue;
  const dir = dirname(f);
  const manifest = join(dir, "src", "main", "AndroidManifest.xml");
  const manifestText = read(manifest);
  const wear =
    /androidx\.wear|com\.google\.android\.wearable|play-services-wearable|wear\.compose/.test(t) ||
    /android\.hardware\.type\.watch/.test(manifestText);
  const tv = /android\.software\.leanback/.test(manifestText);
  const auto = /android\.hardware\.type\.automotive/.test(manifestText);
  const appId = t.match(/applicationId\s*=?\s*"([^"]+)"/)?.[1];
  modules.push({
    module: rel(dir),
    build_file: rel(f),
    kind: isApp ? "app" : isLib ? "library" : "android",
    form_factor: wear ? "wear" : tv ? "tv" : auto ? "automotive" : "phone",
    application_id: appId,
    compileSdk: sdkBlock(t, "compileSdk") ?? sdkSetting(t, "compileSdk"),
    targetSdk: sdkBlock(t, "targetSdk") ?? sdkSetting(t, "targetSdk"),
    minSdk: sdkBlock(t, "minSdk") ?? sdkSetting(t, "minSdk"),
  });
}

const allBuildText = [...gradleFiles, ...settingsFiles].map(read).join("\n");
const agp =
  findCatalog(plugins, (a, e) => /com\.android\.(application|library)/.test(e)) ??
  versions.agp ?? versions.androidGradlePlugin ??
  allBuildText.match(/com\.android\.tools\.build:gradle:([\d.]+[\w-]*)/)?.[1] ??
  allBuildText.match(/id\s*\(?\s*["']com\.android\.application["']\s*\)?\s*version\s*["']([^"']+)/)?.[1];
const kotlin =
  findCatalog(plugins, (a, e) => /org\.jetbrains\.kotlin\.(android|jvm|multiplatform)/.test(e)) ??
  versions.kotlin ??
  allBuildText.match(/org\.jetbrains\.kotlin(?:\.android|:kotlin-gradle-plugin)[^\n]*?["':]([\d.]+(?:-[\w.]+)?)["']/)?.[1];
const composeBom =
  findCatalog(libraries, (a, e) => /androidx\.compose:compose-bom|compose-bom/.test(e)) ??
  allBuildText.match(/androidx\.compose:compose-bom:([\w.-]+)/)?.[1];
const wrappers = files.filter((f) => /gradle\/wrapper\/gradle-wrapper\.properties$/.test(f));
const gradle = uniq(wrappers.map((w) => read(w).match(/gradle-([\d.]+(?:-[\w.]+)?)-(?:bin|all)\.zip/)?.[1]));

// ---------- Apple ----------

const PLATFORM_KEYS = {
  IPHONEOS_DEPLOYMENT_TARGET: "iOS",
  WATCHOS_DEPLOYMENT_TARGET: "watchOS",
  MACOSX_DEPLOYMENT_TARGET: "macOS",
  TVOS_DEPLOYMENT_TARGET: "tvOS",
  XROS_DEPLOYMENT_TARGET: "visionOS",
};
const apple = [];

for (const proj of dirsSeen) {
  const pbx = read(join(proj, "project.pbxproj"));
  if (!pbx) continue;
  const targets = {};
  for (const [key, plat] of Object.entries(PLATFORM_KEYS)) {
    const vals = uniq([...pbx.matchAll(new RegExp(`${key} = "?([\\d.]+)"?;`, "g"))].map((m) => m[1]));
    if (vals.length) targets[plat] = vals.sort(cmpVersion);
  }
  apple.push({
    source: rel(proj),
    kind: "xcodeproj",
    deployment_targets: targets,
    last_upgrade_check: pbx.match(/LastUpgradeCheck = (\d+);/)?.[1],
    swift_version: uniq([...pbx.matchAll(/SWIFT_VERSION = "?([\d.]+)"?;/g)].map((m) => m[1])),
  });
}

for (const f of files.filter((f) => /(^|\/)project\.ya?ml$/.test(f))) {
  const t = read(f);
  if (!/^targets:/m.test(t)) continue; // not an XcodeGen spec
  const targets = {};
  const add = (plat, v) => {
    if (!plat || !v) return;
    const name = { iOS: "iOS", watchOS: "watchOS", macOS: "macOS", tvOS: "tvOS", visionOS: "visionOS" }[plat] ?? plat;
    targets[name] = uniq([...(targets[name] ?? []), String(v)]).sort(cmpVersion);
  };
  // options: deploymentTarget: { iOS: "17.0", watchOS: "10.0" }
  const block = t.match(/^[ \t]*deploymentTarget:[ \t]*\n((?:[ \t]{4,}\w+:[ \t]*"?[\d.]+"?[ \t]*(?:\n|$))+)/m);
  if (block) for (const m of block[1].matchAll(/(\w+):\s*"?([\d.]+)"?/g)) add(m[1], m[2]);
  // per target: platform: iOS ... deploymentTarget: "17.0"
  for (const m of t.matchAll(/platform:\s*(\w+)[\s\S]*?deploymentTarget:\s*"?([\d.]+)"?/g)) add(m[1], m[2]);
  for (const m of t.matchAll(/\b(IPHONEOS|WATCHOS|MACOSX|TVOS|XROS)_DEPLOYMENT_TARGET:\s*"?([\d.]+)"?/g))
    add(PLATFORM_KEYS[`${m[1]}_DEPLOYMENT_TARGET`], m[2]);
  apple.push({
    source: rel(f),
    kind: "xcodegen",
    deployment_targets: targets,
    xcode_version: t.match(/^\s*xcodeVersion:\s*"?([\d.]+)"?/m)?.[1],
    platforms: uniq([...t.matchAll(/platform:\s*(\w+)/g)].map((m) => m[1])),
  });
}

for (const f of files.filter((f) => basename(f) === "Package.swift")) {
  const t = read(f);
  const targets = {};
  for (const m of t.matchAll(/\.(iOS|watchOS|macOS|tvOS|visionOS)\(\s*(?:\.v([\d_]+)|"([\d.]+)")\s*\)/g))
    targets[m[1]] = [(m[2] ?? "").replace(/_/g, ".") || m[3]];
  apple.push({
    source: rel(f),
    kind: "swiftpm",
    deployment_targets: targets,
    swift_tools_version: t.match(/swift-tools-version:\s*([\d.]+)/)?.[1],
  });
}

const xcodePins = uniq([
  ...files.filter((f) => basename(f) === ".xcode-version").map((f) => read(f).trim()),
  ...apple.map((a) => a.xcode_version),
]);

function cmpVersion(a, b) {
  const pa = String(a).split(".").map(Number);
  const pb = String(b).split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d;
  }
  return 0;
}

// ---------- report ----------

const result = {
  root,
  android: {
    modules,
    agp,
    kotlin,
    compose_bom: composeBom,
    gradle_wrapper: gradle,
    catalogs: catalogs.map(rel),
  },
  apple: { projects: apple, xcode_pinned: xcodePins },
};

if (args.json) {
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

const show = (s) => (s === undefined ? "-" : s.unresolved ? `? (${s.unresolved})` : `${s.value}${s.via ? ` [${s.via}]` : ""}`);
const lines = [`Root: ${root}`];
if (modules.length) {
  lines.push("", "Android modules:");
  for (const m of modules)
    lines.push(
      `- ${m.module} (${m.kind}, ${m.form_factor}${m.application_id ? `, ${m.application_id}` : ""}): ` +
        `compileSdk ${show(m.compileSdk)}, targetSdk ${show(m.targetSdk)}, minSdk ${show(m.minSdk)}`,
    );
  lines.push(
    `Toolchain: AGP ${agp ?? "-"}, Kotlin ${kotlin ?? "-"}, Compose BOM ${composeBom ?? "-"}, Gradle ${gradle.join(", ") || "-"}`,
  );
} else lines.push("", "Android: no Gradle Android modules found.");
if (apple.length) {
  lines.push("", "Apple:");
  for (const a of apple) {
    const t = Object.entries(a.deployment_targets).map(([p, v]) => `${p} ${v.join("/")}`).join(", ") || "no deployment targets found";
    const extra = [
      a.xcode_version && `xcodeVersion ${a.xcode_version}`,
      a.last_upgrade_check && `LastUpgradeCheck ${a.last_upgrade_check}`,
      a.swift_tools_version && `swift-tools ${a.swift_tools_version}`,
    ].filter(Boolean);
    lines.push(`- ${a.source} (${a.kind}): ${t}${extra.length ? `; ${extra.join(", ")}` : ""}`);
  }
  lines.push(`Xcode pinned: ${xcodePins.join(", ") || "-"}`);
} else lines.push("", "Apple: no Xcode project, XcodeGen spec or Package.swift found.");
console.log(lines.join("\n"));
