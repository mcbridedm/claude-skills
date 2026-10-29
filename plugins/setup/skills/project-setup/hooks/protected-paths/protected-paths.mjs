// Blocks shell commands that write under protected paths (a PreToolUse hook on Bash, wired in
// .claude/settings.json through ./protected-paths). Permission rules such as
// `"ask": ["Edit(**/deploy/**)"]` cover the Edit and Write tools only, so a sed, a heredoc or a short
// script through the shell can go around them. This closes the common routes.
//
// The paths come from .claude/protected-paths.json (see protected-paths.example.json).
//
// It's a guard, not a sandbox: a script file that writes there without naming the path on the
// command line still gets through, so read agents' diffs for shell edits before merging.
// It follows `cd` and `pushd` within one command, so relative paths after them are judged from
// there, and knows curl -o, wget -O, tar -x -C, --write and --fix, awk -i inplace, git -C and
// cp -t. A cd it can't resolve (`cd "$dir"`, `cd -`) counts as a protected folder; one to ~ or
// $HOME is taken literally (`cd ~/project/deploy` is protected, `cd ~` isn't).
// It reads the hook's JSON on stdin and exits 2 with the reason on stderr to block (Claude Code
// shows the reason to the agent), 0 to allow.

import { existsSync, readFileSync } from "node:fs";
import path, { join } from "node:path";

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const INTERPRETERS = /^(python3?(\.\d+)?|node|perl|ruby|bash|sh|zsh|deno|bun)$/;
const WRITE_WORDS = /write|['"][wa]\+?['"]|replace\(|unlink|rename|remove\(|rmtree|truncate|appendFile|\.dump\(|copyFile|cpSync|rmSync|mkdir/;
const MUTATING = new Set(["rm", "rmdir", "touch", "truncate", "chmod", "chown", "mkdir", "unlink", "shred", "dd"]);
const COPYING = new Set(["cp", "mv", "install", "ln", "rsync"]);
const REDIRECT = /(?<![<>&\d])\d*>{1,2}\|?\s*(?!&)(["']?)([^\s;&|"'<>]+)\1/g;
// A folder a string can't pin down (`cd "$dir"`, `cd -`): it may be a protected one, so it's
// judged as one.
const UNKNOWN = "\0unknown folder";
const HOME = /^(~|\$HOME|\$\{HOME\})(\/|$)/;

/**
 * The matchers for a config: { paths: ["infra", ".github"], rewriters?: [{ pattern, unless?, why }] }.
 * Paths are folder names relative to the repository root, without slashes at either end.
 */
export function compile(config) {
  const paths = (config?.paths ?? []).map((p) => String(p).replace(/^\.?\/+|\/+$/g, "")).filter(Boolean);
  if (paths.length === 0) return null;
  const alt = paths.map(escape).join("|");
  return {
    paths,
    // A path under a protected folder, anywhere in a word (also absolute paths into the repo).
    protectedPath: new RegExp(`(^|[^\\w.-])(${alt})(\\/|$)`),
    // A bare folder name in a command line (`find infra -delete`) counts too.
    mention: new RegExp(`(^|[^\\w.-])(${alt})(\\/|[\\s'"]|$)`),
    // In inline code, a protected path written as a path: a quoted string with no spaces that
    // names one ('infra/home/deploy'), not prose that mentions the folder. Backticks don't count:
    // in Markdown they mark `infra/` as code, not a path being written.
    pathLiteral: new RegExp(`(['"])([^'"\\s]*\\/)?(${alt})\\/[^'"\\s]*\\1`),
    rewriters: (config?.rewriters ?? []).map((r) => ({
      pattern: new RegExp(r.pattern),
      unless: r.unless ? new RegExp(r.unless) : null,
      why: r.why ?? "this command rewrites files in place",
    })),
  };
}

/** Reads .claude/protected-paths.json from the project directory, or null if there's none. */
export function loadConfig(projectDir) {
  const file = join(projectDir, ".claude", "protected-paths.json");
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8"));
}

// Splits a command line into simple commands, roughly as a shell would: on ; && || | & and new
// lines, outside quotes. Heredoc bodies stay with the command that reads them.
export function segments(command) {
  const out = [];
  let cur = "";
  let quote = null;
  for (let i = 0; i < command.length; i++) {
    const c = command[i];
    if (quote) {
      if (c === quote) quote = null;
      else if (c === "\\" && quote === '"') cur += c + (command[++i] ?? "");
      if (c !== "\\" || quote !== '"') cur += c;
      continue;
    }
    if (c === "'" || c === '"') {
      quote = c;
      cur += c;
    } else if (c === ";" || c === "\n" || c === "|" || (c === "&" && command[i - 1] !== ">" && command[i + 1] !== ">")) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim()).filter(Boolean);
}

// The value of an option given as `-o value`, `-ovalue`, `--output value` or `--output=value`.
function optionValue(args, short, long) {
  for (let j = 0; j < args.length; j++) {
    const a = args[j];
    if ((short && a === short) || (long && a === long)) return args[j + 1];
    if (long && a.startsWith(`${long}=`)) return a.slice(long.length + 1);
    if (short && a.startsWith(short) && a.length > short.length && !a.startsWith("--")) return a.slice(short.length);
  }
  return undefined;
}

// The words of a simple command, quotes removed (good enough to see the program and its paths).
export function words(segment) {
  return [...segment.matchAll(/'([^']*)'|"((?:\\.|[^"])*)"|(\S+)/g)].map((m) => m[1] ?? m[2] ?? m[3]);
}

/** Why the command would write under a protected path, or null. `m` is compile(config). */
export function reason(command, cwd, m) {
  if (!m) return null;
  cwd = cwd ?? "";
  const protectedDir = (dir) => dir === UNKNOWN || m.protectedPath.test(dir);
  const isProtected = (p, cwdProtected) =>
    m.protectedPath.test(p) || (cwdProtected && !p.startsWith("/") && !p.startsWith("~") && !p.startsWith("$") && !p.startsWith("-"));

  // Where a `cd` or `pushd` leaves the shell, as far as a string can tell. A target that starts
  // with ~ or $HOME is taken literally: `cd ~/project/deploy` lands in a protected folder, `cd ~`
  // doesn't; any other `$` target (`cd "$dir"`) lands somewhere unknown unless it names one.
  const moveTo = (here, target) => {
    if (target === undefined) return "~";
    if (target === "-") return UNKNOWN;
    if (target.startsWith("$") && !HOME.test(target)) return m.protectedPath.test(target) ? target : UNKNOWN;
    if (target.startsWith("/") || target.startsWith("~") || target.startsWith("$")) return path.posix.normalize(target);
    if (here === UNKNOWN) return UNKNOWN;
    return path.posix.normalize(path.posix.join(here || ".", target));
  };

  // Commands the config says rewrite files (e.g. a formatter without its check flag).
  for (const r of m.rewriters) if (r.pattern.test(command) && !(r.unless && r.unless.test(command))) return r.why;

  const startProtected = m.protectedPath.test(cwd);
  if (!m.mention.test(command) && !startProtected && !/(^|[\s;&|(])(cd|pushd)\s|\bgit\s+-C\s/.test(command)) return null;

  // Redirection into a protected path (not >&1, not /dev/null).
  for (const x of command.matchAll(REDIRECT)) {
    const target = x[2];
    if (target !== "/dev/null" && isProtected(target, startProtected)) return `redirects output into ${target}`;
  }

  let here = cwd;
  for (const seg of segments(command)) {
    const cwdProtected = protectedDir(here);
    const w = words(seg);
    let i = 0;
    while (i < w.length && (/^\w+=/.test(w[i]) || ["sudo", "env", "command", "exec", "xargs", "time", "nice"].includes(w[i]))) i++;
    // A subshell's opening parenthesis sticks to the program: `(cd deploy && ...)`.
    const prog = (w[i] ?? "").replace(/^\(+/, "").split("/").pop();
    const args = w.slice(i + 1);
    const paths = args.filter((a) => !a.startsWith("-"));
    const anyProtected = paths.some((p) => isProtected(p, cwdProtected));

    if (prog === "cd" || prog === "pushd") {
      here = moveTo(here, args.includes("-") ? "-" : paths[0]);
      continue;
    }
    if (cwdProtected) {
      for (const x of seg.matchAll(REDIRECT)) if (x[2] !== "/dev/null" && isProtected(x[2], true)) return `redirects output into ${x[2]} (after a cd into a protected path)`;
    }

    if (prog === "sed" && args.some((a) => /^-[a-zA-Z]*i/.test(a) || a.startsWith("--in-place")) && (anyProtected || m.protectedPath.test(seg))) return "sed -i edits files in place";
    if ((prog === "perl" || prog === "ruby") && args.some((a) => /^-[a-zA-Z]*i/.test(a)) && (anyProtected || m.protectedPath.test(seg))) return `${prog} -i edits files in place`;
    if ((prog === "awk" || prog === "gawk") && args.some((a, j) => (a === "-i" && args[j + 1] === "inplace") || a === "-iinplace" || a === "--include=inplace") && (anyProtected || m.protectedPath.test(seg)))
      return `${prog} -i inplace edits files in place`;
    if (prog === "tee" && anyProtected) return "tee writes into a protected path";
    if (MUTATING.has(prog) && anyProtected) return `${prog} changes a protected path`;
    if (COPYING.has(prog)) {
      const target = optionValue(args, "-t", "--target-directory");
      if (target !== undefined && isProtected(target, cwdProtected)) return `${prog} writes into ${target}`;
    }
    if (COPYING.has(prog) && paths.length >= 2) {
      const dest = paths[paths.length - 1];
      if (isProtected(dest, cwdProtected)) return `${prog} writes into ${dest}`;
      if ((prog === "mv" || prog === "rsync") && paths.slice(0, -1).some((p) => isProtected(p, cwdProtected))) return `${prog} moves files out of a protected path`;
    }
    // Downloads written to a file: curl -o/--output (or -O into the current folder), wget -O/-P.
    if (prog === "curl") {
      const out = optionValue(args, "-o", "--output") ?? optionValue(args, null, "--output-dir");
      if (out !== undefined && isProtected(out, cwdProtected)) return `curl writes into ${out}`;
      if (cwdProtected && args.some((a) => a === "-O" || a === "--remote-name" || /^-[a-zA-Z]*O/.test(a))) return "curl -O writes into a protected folder";
    }
    if (prog === "wget") {
      const out = optionValue(args, "-O", "--output-document") ?? optionValue(args, "-P", "--directory-prefix");
      if (out !== undefined ? isProtected(out, cwdProtected) : cwdProtected) return "wget writes into a protected path";
    }
    // tar extracting into a protected folder (-C/--directory), or into the current one.
    if (prog === "tar" && args.some((a, j) => a === "--extract" || a === "--get" || /^-[a-zA-Z]*x[a-zA-Z]*$/.test(a) || (j === 0 && /^[a-zA-Z]*x[a-zA-Z]*$/.test(a)))) {
      const into = optionValue(args, "-C", "--directory");
      if (into !== undefined ? isProtected(into, cwdProtected) : cwdProtected) return "tar extracts into a protected path";
    }
    // Formatters and fixers that rewrite the files they're given (prettier --write, eslint --fix).
    const formatter = /^(prettier|eslint|biome|dprint|shfmt|black|ruff)$/.test(prog);
    if (args.some((a) => a === "--write" || a === "--fix" || (formatter && a === "-w")) && (anyProtected || (cwdProtected && formatter))) return `${prog} rewrites files under a protected path`;
    if (prog === "git") {
      // Global options before the subcommand: `git -C <dir>` works in that folder.
      let j = 0;
      let gitHere = here;
      while (j < args.length && args[j].startsWith("-")) {
        if (args[j] === "-C") {
          gitHere = moveTo(gitHere, args[j + 1]);
          j += 2;
        } else if (args[j] === "-c") j += 2;
        else j++;
      }
      const sub = args[j] ?? "";
      const gitProtected = protectedDir(gitHere);
      const subPaths = args.slice(j + 1).filter((a) => !a.startsWith("-"));
      if (/^(checkout|restore|rm|mv|apply)$/.test(sub) && (gitProtected || subPaths.some((p) => isProtected(p, gitProtected)))) return `git ${sub} changes files under a protected path`;
    }
    if (prog === "find" && anyProtected && args.some((a) => a === "-delete" || a === "-exec" || a === "-execdir")) return "find -delete or -exec under a protected path";
    if (prog === "patch" && anyProtected) return "patch edits a protected path";
    // Inline code (-c, -e, a heredoc or a pipe into the interpreter) that names a protected path and writes.
    if (INTERPRETERS.test(prog) && (args.some((a) => /^-[a-zA-Z]*[ce]$/.test(a)) || seg.includes("<<") || args.length === 0) && m.pathLiteral.test(seg) && WRITE_WORDS.test(seg))
      return `${prog} runs inline code that writes under a protected path`;
  }
  // A heredoc or pipe can carry the code on another line than the interpreter's: judge the whole command.
  if (/(^|[\s;&|(])(python3?|node|perl|ruby)\b[^\n]*(<<|\s-[ce]\s)/.test(command) && m.pathLiteral.test(command.slice(command.search(/<<|\s-[ce]\s/))) && WRITE_WORDS.test(command))
    return "inline code that writes under a protected path";
  return null;
}

async function main() {
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  let event;
  try {
    event = JSON.parse(input);
  } catch {
    process.exit(0);
  }
  const projectDir = process.env.CLAUDE_PROJECT_DIR || event?.cwd || process.cwd();
  let config;
  try {
    config = loadConfig(projectDir);
  } catch (e) {
    process.stderr.write(`Blocked by the protected-paths hook: .claude/protected-paths.json can't be read (${e.message}). Fix it, then retry.\n`);
    process.exit(2);
  }
  const m = compile(config);
  const why = reason(event?.tool_input?.command ?? "", event?.cwd ?? "", m);
  if (!why) process.exit(0);
  const list = m.paths.map((p) => `${p}/`).join(", ");
  process.stderr.write(
    `Blocked by the protected-paths hook: this command looks like it writes under ${list} (${why}). ` +
      "Those files are edited only with the Edit and Write tools, which ask first. " +
      (config.message ? `${config.message} ` : "") +
      "Make the change with Edit or Write. If the command only reads, rephrase it so it doesn't look like a write; if the user wants it run as is, they can run it themselves.\n",
  );
  process.exit(2);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
