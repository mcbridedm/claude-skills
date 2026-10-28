#!/usr/bin/env node
// Light checks for this skills repository. Plain Node (18+), no dependencies.
// Run from anywhere: node scripts/validate.mjs
// For the full Claude Code checks, also run: claude plugin validate . (and on each plugin).

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const warnings = [];
const rel = (p) => relative(root, p) || ".";
const fail = (msg) => errors.push(msg);

function readJson(path) {
  if (!existsSync(path)) return fail(`${rel(path)}: missing`);
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    return fail(`${rel(path)}: invalid JSON (${e.message})`);
  }
}

// Minimal front-matter reader: top-level "key: value" pairs, quoted or plain,
// plus folded (>) or literal (|) blocks. Enough for SKILL.md headers.
function frontMatter(path) {
  const text = readFileSync(path, "utf8");
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!m) return null;
  const out = {};
  const lines = m[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const kv = lines[i].match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;
    let [, key, value] = kv;
    if (value === ">" || value === "|" || value === ">-" || value === "|-") {
      const block = [];
      while (i + 1 < lines.length && /^\s+/.test(lines[i + 1])) block.push(lines[++i].trim());
      value = block.join(value.startsWith(">") ? " " : "\n");
    }
    out[key] = value.replace(/^["'](.*)["']$/, "$1").trim();
  }
  return out;
}

const dirs = (path) =>
  existsSync(path) ? readdirSync(path).filter((d) => statSync(join(path, d)).isDirectory()) : [];

const readme = existsSync(join(root, "README.md")) ? readFileSync(join(root, "README.md"), "utf8") : "";
const changelog = existsSync(join(root, "CHANGELOG.md")) ? readFileSync(join(root, "CHANGELOG.md"), "utf8") : "";
const contextCheckPath = join(root, "templates", "skill", "reference", "context-check.md");
const contextCheck = existsSync(contextCheckPath) ? readFileSync(contextCheckPath, "utf8") : null;
if (!contextCheck) fail("templates/skill/reference/context-check.md: missing");
if (!readme) fail("README.md: missing");
if (!changelog) fail("CHANGELOG.md: missing");

const market = readJson(join(root, ".claude-plugin", "marketplace.json"));
if (market) {
  for (const key of ["name", "owner", "plugins"]) if (!market[key]) fail(`marketplace.json: missing "${key}"`);
  const listed = new Set();
  for (const entry of market.plugins ?? []) {
    if (!entry.name || !entry.source) {
      fail(`marketplace.json: an entry lacks "name" or "source"`);
      continue;
    }
    listed.add(entry.name);
    if (entry.version) warnings.push(`marketplace.json: "${entry.name}" sets version; keep it in plugin.json only`);
    if (typeof entry.source !== "string") continue;
    const pdir = join(root, entry.source);
    if (!existsSync(pdir)) {
      fail(`marketplace.json: "${entry.name}" source ${entry.source} does not exist`);
      continue;
    }
    const manifest = readJson(join(pdir, ".claude-plugin", "plugin.json"));
    if (manifest) {
      if (manifest.name !== entry.name) fail(`${rel(pdir)}: plugin.json name "${manifest.name}" differs from marketplace entry "${entry.name}"`);
      if (!manifest.version) fail(`${rel(pdir)}: plugin.json has no version (users would not receive updates predictably)`);
      if (!manifest.description) fail(`${rel(pdir)}: plugin.json has no description`);
      if (manifest.version && !changelog.includes(manifest.version))
        fail(`CHANGELOG.md: no entry mentions ${entry.name}'s version ${manifest.version}`);
    }
    if (!existsSync(join(pdir, "README.md"))) fail(`${rel(pdir)}: README.md missing`);
    const skills = dirs(join(pdir, "skills"));
    if (skills.length === 0) warnings.push(`${rel(pdir)}: no skills/ folders`);
    for (const skill of skills) {
      const sdir = join(pdir, "skills", skill);
      const skillMd = join(sdir, "SKILL.md");
      if (!existsSync(skillMd)) {
        fail(`${rel(sdir)}: SKILL.md missing`);
        continue;
      }
      const fm = frontMatter(skillMd);
      if (!fm) {
        fail(`${rel(skillMd)}: no YAML front matter`);
        continue;
      }
      if (!fm.name) fail(`${rel(skillMd)}: front matter has no name`);
      else {
        if (fm.name !== skill) fail(`${rel(skillMd)}: name "${fm.name}" differs from folder "${skill}"`);
        if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(fm.name) || fm.name.length > 64)
          fail(`${rel(skillMd)}: name must be kebab-case, at most 64 characters`);
      }
      if (!fm.description) fail(`${rel(skillMd)}: front matter has no description`);
      else if (fm.description.length > 1536)
        warnings.push(`${rel(skillMd)}: description is ${fm.description.length} characters; the skill listing caps it at 1,536`);
      if (!existsSync(join(sdir, "README.md"))) fail(`${rel(sdir)}: README.md missing`);
      if (!changelog.includes(skill)) fail(`CHANGELOG.md: no mention of skill "${skill}"`);
      if (!readme.includes(skill)) fail(`README.md: skill "${skill}" is not in the catalogue`);
      const body = readFileSync(skillMd, "utf8");
      const lines = body.split("\n").length;
      if (lines > 500) warnings.push(`${rel(skillMd)}: ${lines} lines; move detail into reference/ files`);
      // Every skill starts with the shared context check (CONTRIBUTING, section 4b), and carries the
      // template's copy unchanged, so a fix to the check reaches every skill.
      const stepC = body.indexOf("## Step C: Context check");
      if (stepC < 0) fail(`${rel(skillMd)}: no "## Step C: Context check" step`);
      else if (body.indexOf("\n## Step ") + 1 !== stepC) fail(`${rel(skillMd)}: Step C must be the first step`);
      const check = join(sdir, "reference", "context-check.md");
      if (!existsSync(check)) fail(`${rel(check)}: missing (copy templates/skill/reference/context-check.md)`);
      else if (contextCheck && readFileSync(check, "utf8") !== contextCheck)
        fail(`${rel(check)}: differs from templates/skill/reference/context-check.md (change the template, then copy it to every skill)`);
    }
  }
  for (const d of dirs(join(root, "plugins")))
    if (!listed.has(d)) fail(`plugins/${d}: not listed in marketplace.json`);
}

if (!existsSync(join(root, "templates", "skill", "SKILL.md"))) fail("templates/skill/SKILL.md: missing");

for (const w of warnings) console.log(`warning: ${w}`);
for (const e of errors) console.log(`error: ${e}`);
if (errors.length) {
  console.log(`\n${errors.length} error(s).`);
  process.exit(1);
}
console.log(`OK${warnings.length ? ` with ${warnings.length} warning(s)` : ""}.`);
