#!/usr/bin/env node
// fingerprint: a cheap guard for a scheduled os-release-check. Lists the platform versions this
// machine can see (Android platforms and system images offered by sdkmanager, installed Xcode
// versions, simulator runtimes), plus optional lines extracted from official pages, and hashes
// them. Starts no model, boots nothing and installs nothing. Part of the os-release-check skill.
//
// Usage:
//   node fingerprint.mjs [--state FILE] [--page URL=REGEX]... [--repo DIR] [--print]
//
// --state FILE   compare with the hash in FILE; on a change write the new hash to FILE.pending
//                (the job keeps it only after a successful run) and exit 0; unchanged: exit 1.
//                Without --state: print the hash and exit 0.
// --page URL=RE  fetch an official page and keep the lines matching RE (e.g. the store's dated
//                requirement sentences), so a new deadline also counts as a change.
// --repo DIR     also include the repository's discovered targets (discover.mjs), so a change to
//                the project's own targets counts as well.
// --print        print the inventory the hash is made from.
// A tool that isn't installed adds a line saying so; it never fails the guard.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const args = { pages: [], print: false };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--state" && argv[i + 1]) args.state = argv[++i];
  else if (a === "--page" && argv[i + 1]) args.pages.push(argv[++i]);
  else if (a === "--repo" && argv[i + 1]) args.repo = argv[++i];
  else if (a === "--print") args.print = true;
  else {
    console.error("usage: node fingerprint.mjs [--state FILE] [--page URL=REGEX]... [--repo DIR] [--print]");
    process.exit(2);
  }
}

function run(cmd, cmdArgs, timeout = 120000) {
  try {
    return execFileSync(cmd, cmdArgs, { encoding: "utf8", timeout, stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return null;
  }
}

function sdkmanagerPath() {
  // The SDK's usual homes when ANDROID_HOME isn't set (a scheduled job often has a bare environment).
  const homes = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT, join(homedir(), "Library", "Android", "sdk"), join(homedir(), "Android", "Sdk")];
  const candidates = homes.filter(Boolean).flatMap((h) => [join(h, "cmdline-tools", "latest", "bin", "sdkmanager"), join(h, "tools", "bin", "sdkmanager")]);
  for (const c of candidates) if (existsSync(c)) return c;
  return "sdkmanager";
}

const inventory = [];

// Android: what the SDK repository offers (needs the network), stable and preview channels.
const sdk = run(sdkmanagerPath(), ["--list", "--channel=3"], 180000);
if (sdk === null) inventory.push("android: sdkmanager unavailable");
else {
  // Older sdkmanager prints "platforms;android-36 | 1 | ..."; the newer one (a wrapper around the
  // Android CLI) prints "platforms/android-37.0   2.0.0   ...". Both are read, installed and
  // available apart.
  const pkgs = new Set();
  let where = "available";
  for (const line of sdk.split("\n")) {
    if (/^Installed packages/i.test(line.trim())) where = "installed";
    else if (/^Available (packages|Updates)/i.test(line.trim())) where = "available";
    const m = line.trim().match(/^((?:platforms[;/]android-[\w.-]+)|(?:system-images[;/]android-[\w.-]+[;/][\w.-]+[;/][\w.-]+)|(?:build-tools[;/][\w.-]+))(?:\s|\||$)/);
    if (m) pkgs.add(`android ${where}: ${m[1].replace(/;/g, "/")}`);
  }
  inventory.push(...[...pkgs].sort());
}

// Apple: installed Xcode (the selected one, and others in /Applications), simulator runtimes.
const xv = run("xcodebuild", ["-version"]);
if (xv === null) inventory.push("apple: xcodebuild unavailable");
else inventory.push(`apple: selected ${xv.trim().replace(/\s+/g, " ")}`);
const apps = run("/bin/sh", ["-c", "ls -d /Applications/Xcode*.app 2>/dev/null"]);
if (apps)
  for (const app of apps.trim().split("\n").filter(Boolean)) {
    const v = run("/usr/libexec/PlistBuddy", ["-c", "Print :CFBundleShortVersionString", join(app, "Contents", "Info.plist")]);
    if (v) inventory.push(`apple: installed Xcode ${v.trim()}`);
  }
const rt = run("xcrun", ["simctl", "list", "runtimes"]);
if (rt === null) inventory.push("apple: simctl unavailable");
else
  for (const line of rt.split("\n"))
    if (/^(iOS|watchOS|tvOS|visionOS|xrOS)\b/.test(line.trim())) inventory.push(`apple: runtime ${line.trim().replace(/\s+/g, " ")}`);

// Official pages: only the matching lines, so cosmetic page changes don't count.
for (const spec of args.pages) {
  const eq = spec.indexOf("=");
  const url = eq > 0 ? spec.slice(0, eq) : spec;
  const re = new RegExp(eq > 0 ? spec.slice(eq + 1) : ".", "i");
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    // Inline tags (links, emphasis) are dropped so a sentence stays on one line; block tags end lines.
    const text = (await res.text())
      .replace(/<\/?(?:a|strong|em|b|i|span|code|sup|sub)\b[^>]*>/gi, "")
      .replace(/<[^>]+>/g, "\n")
      .replace(/&nbsp;/g, " ")
      .replace(/[ \t]+/g, " ");
    const hits = [...new Set(text.split("\n").map((l) => l.trim()).filter((l) => l && re.test(l)))];
    inventory.push(...hits.map((h) => `page ${url}: ${h}`));
    if (!hits.length) inventory.push(`page ${url}: no line matched`);
  } catch {
    inventory.push(`page ${url}: unreachable`);
  }
}

// The project's own targets.
if (args.repo) {
  const here = dirname(fileURLToPath(import.meta.url));
  const out = run(process.execPath, [join(here, "discover.mjs"), "--root", args.repo]);
  if (out) inventory.push(...out.split("\n").filter((l) => l.startsWith("- ") || l.startsWith("Toolchain") || l.startsWith("Xcode")).map((l) => `repo: ${l}`));
}

const hash = createHash("sha256").update(inventory.join("\n")).digest("hex");
if (args.print) console.log(inventory.join("\n"));

if (!args.state) {
  console.log(hash);
  process.exit(0);
}
const previous = existsSync(args.state) ? readFileSync(args.state, "utf8").trim() : "";
if (previous === hash) {
  console.log("unchanged");
  process.exit(1);
}
writeFileSync(`${args.state}.pending`, `${hash}\n`);
console.log(previous ? "changed" : "first run");
process.exit(0);
