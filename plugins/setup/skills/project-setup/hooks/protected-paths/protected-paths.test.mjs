// The protected-paths hook (protected-paths.mjs): what it blocks and what it lets through.
// Run: node --test .claude/hooks/protected-paths.test.mjs once copied into a project (or this file's path here).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { compile, reason } from "./protected-paths.mjs";

const config = {
  paths: ["deploy", ".github"],
  rewriters: [{ pattern: "\\b(tofu|terraform)\\s+fmt\\b", unless: "-check\\b", why: "tofu fmt rewrites files" }],
};
const m = compile(config);

const blocked = [
  ["sed -i '' 's/a/b/' deploy/scripts/release", ""],
  ["sed -i.bak -e 's/a/b/' .github/workflows/ci.yml", ""],
  [`python3 - <<'EOF'\np='deploy/modules/app/main.tf'\ns=open(p).read()\nopen(p,'w').write(s.replace('a','b'))\nEOF`, ""],
  [`python3 -c "open('deploy/x.tf','w').write('')"`, ""],
  [`node -e "require('fs').writeFileSync('.github/workflows/x.yml','')"`, ""],
  ["cat > deploy/new-script <<'EOF'\necho hi\nEOF", ""],
  ["echo x >> .github/CODEOWNERS", ""],
  ["printf 'a' > /home/me/project/deploy/main.tf", ""],
  ["echo x | tee deploy/x", ""],
  ["perl -pi -e 's/a/b/' deploy/install", ""],
  ["cp /tmp/x.tf deploy/envs/prod/x.tf", ""],
  ["mv deploy/old deploy/new", ""],
  ["mv deploy/old /tmp/old", ""],
  ["rm -f .github/workflows/old.yml", ""],
  ["chmod +x deploy/new-script", ""],
  ["git checkout origin/topic -- deploy/release", ""],
  ["git restore .github/workflows/ci.yml", ""],
  ["find deploy -name '*.bak' -delete", ""],
  ["tofu fmt -recursive", "/repo/deploy"],
  ["cd deploy && tofu fmt", ""],
  ["sed -i '' 's/a/b/' release", "/home/me/project/deploy/scripts"],
  ["echo x > release", "/home/me/project/deploy/scripts"],
  ["export PATH=/x:$PATH && sed -i '' 's/a/b/' deploy/release", ""],
  // A cd or pushd first: relative paths after it are judged from there.
  ["cd deploy/scripts && echo x > release", ""],
  ["cd .github/workflows && sed -i '' s/a/b/ ci.yml", ""],
  ["cd /home/me/project/deploy && rm envs/x.tf", ""],
  ["pushd deploy/scripts && cp /tmp/x release", ""],
  ["(cd deploy/scripts && chmod +x release)", ""],
  // A cd to ~ or $HOME is taken literally; one it can't resolve counts as protected.
  ["cd ~/project/deploy/scripts && echo x > release", ""],
  ["cd $HOME/project/.github/workflows && sed -i '' s/a/b/ ci.yml", ""],
  ["cd \"$REPO/deploy/scripts\" && cp /tmp/x release", ""],
  ["cd \"$dir\" && echo x > release", ""],
  ["cd - && rm release", ""],
  ["cd \"$dir\" && cd scripts && touch x", ""],
  // Downloads, archives, fixers and other writers.
  ["curl -fsSL -o deploy/scripts/x https://example.com/x", ""],
  ["curl -fsSL --output=.github/x.yml https://example.com/x", ""],
  ["cd deploy/scripts && curl -O https://example.com/x", ""],
  ["wget -O deploy/scripts/x https://example.com/x", ""],
  ["tar -xzf /tmp/x.tgz -C deploy/scripts", ""],
  ["tar xf /tmp/x.tar --directory=.github", ""],
  ["npx prettier --write .github/workflows/ci.yml", ""],
  ["npx eslint --fix deploy/functions/handler.mjs", ""],
  ["awk -i inplace '{print}' deploy/scripts/release", ""],
  // git -C and cp -t.
  ["git -C deploy/scripts checkout -- release", ""],
  ["git -C /repo/.github restore workflows/ci.yml", ""],
  ["git -C \"$dir\" checkout -- release", ""],
  ["cp -t deploy/scripts /tmp/x", ""],
  ["install --target-directory=.github/workflows /tmp/x.yml", ""],
];

const allowed = [
  ["cat deploy/release", ""],
  ["grep -rn foo deploy .github", ""],
  ["git diff origin/main -- deploy/main.tf", ""],
  ["git add deploy/release && git commit -m 'deploy: release'", ""],
  ["tofu fmt -check -recursive", "/repo/deploy"],
  ["cd deploy && tofu init -backend=false && tofu validate", ""],
  ["cp deploy/compose.yml /tmp/compose.yml", ""],
  ["sed -n 1,40p deploy/install", ""],
  ["ls deploy 2>/dev/null > /tmp/list.txt", ""],
  ["cat deploy/README.md > /dev/null 2>&1", ""],
  [`python3 -c "import json; print(json.load(open('deploy/x.json')))"`, ""],
  ["sed -i '' 's/a/b/' docs/guide.md", ""],
  ["echo hi > /tmp/out.txt", "/home/me/project/deploy"],
  ["rm -rf build", ""],
  ["rm -rf deployment-notes", ""],
  ["git merge --no-ff origin/topic", ""],
  ["node --test deploy/functions/", ""],
  ["pnpm lint && pnpm typecheck", "/home/me/project/deploy/scripts"],
  // A cd that reads, leaves the protected folder, or goes elsewhere.
  ["cd deploy/scripts && cat release", ""],
  ["cd deploy/scripts && cd ../.. && echo x > notes.txt", ""],
  ["cd apps/web && echo x > /tmp/y", ""],
  ["cd ~/project && echo x > notes.txt", ""],
  ["cd ~ && echo x > notes.txt", ""],
  ["cd ~/project/deploy && cd .. && echo x > notes.txt", ""],
  ["cd \"$dir\" && cat release", ""],
  // Writers pointed elsewhere, and readers given a protected folder.
  ["tar -czf /tmp/deploy.tgz -C deploy .", ""],
  ["curl -fsS -o /tmp/x https://example.com/deploy/x", ""],
  ["git -C deploy/scripts log --oneline -3", ""],
  ["npx prettier --write apps/web/src/x.ts", ""],
  ["docker run --rm -v /repo/deploy:/deploy -w /repo alpine:3 ls", ""],
  // Editing a doc whose text mentions the folders.
  [`python3 -I - <<'EOF'\np='README.md'; s=open(p).read()\nb="refuses shell writes under \`deploy/\` (hook)"\nopen(p,'w').write(s+b)\nEOF`, ""],
];

describe("protected-paths hook", () => {
  for (const [command, cwd] of blocked) it(`blocks: ${command.split("\n")[0]}`, () => assert.ok(reason(command, cwd, m), command));
  for (const [command, cwd] of allowed) it(`allows: ${command.split("\n")[0]}`, () => assert.equal(reason(command, cwd, m), null));

  it("allows everything with no config", () => assert.equal(reason("rm -rf deploy", "", compile(null)), null));

  it("exits 2 with the reason when run as the hook, 0 otherwise", () => {
    const project = mkdtempSync(join(tmpdir(), "protected-paths-"));
    mkdirSync(join(project, ".claude"));
    writeFileSync(join(project, ".claude", "protected-paths.json"), JSON.stringify(config));
    const hook = fileURLToPath(new URL("./protected-paths", import.meta.url));
    const run = (command) => {
      try {
        execFileSync(hook, {
          input: JSON.stringify({ tool_name: "Bash", tool_input: { command }, cwd: project }),
          env: { ...process.env, CLAUDE_PROJECT_DIR: project },
          stdio: ["pipe", "pipe", "pipe"],
        });
        return 0;
      } catch (e) {
        assert.match(String(e.stderr), /Edit and Write tools/);
        return e.status;
      }
    };
    assert.equal(run("sed -i '' 's/a/b/' deploy/release"), 2);
    assert.equal(run("cat deploy/release"), 0);
  });
});
