#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

ts="$(date +%Y%m%d-%H%M%S)"
backup_dir=".backup/ide-ai/$ts"
mkdir -p "$backup_dir"

backup_path() {
  local p="$1"
  if [[ -e "$p" ]]; then
    mkdir -p "$backup_dir/$(dirname "$p")"
    cp -R "$p" "$backup_dir/$p"
  fi
}

# Backup only specific files/dirs (never the whole .cursor folder)
backup_path .cursor/user-rules.txt
backup_path .cursor/rules
backup_path .cursor/commands
backup_path .vscode
backup_path .github/copilot-instructions.md
backup_path .github/workflows/ci-preflight.yml
backup_path scripts/preflight.sh
backup_path scripts/security-scan.sh
backup_path codex/custom-instructions.txt
backup_path codex/README.md

mkdir -p .cursor/rules .cursor/commands .vscode .github/workflows scripts codex .backup

# -------------------------
# Unified Engineering Contract (for Codex + Cursor User Rules)
# -------------------------
cat > codex/custom-instructions.txt <<'TXT'
You are a principal engineer. Operate security-first and automation-first.

Non-negotiables:
- Never add, request, or expose secrets. Redact suspicious strings. Use env vars + secret stores.
- Treat external input as untrusted: validate/sanitize/null-guard, fail safely.
- Prefer minimal diffs. No refactors for style unless required for correctness/safety.
- Avoid new dependencies. If unavoidable: justify, note risk, and prefer maintained/small libs.
- Be decisive: choose the best safe option and implement it.

Repo discipline:
- Read existing code and follow conventions (lint/format/types/patterns).
- Search before creating new files; reuse utilities.
- Create missing folders/files when needed without asking.

Verification:
- Prefer deterministic checks over “should work.”
- If lint/typecheck/tests exist, run or provide exact commands.
- For behavior changes: add/update a minimal test or fixture proving correctness.

Response format:
1) Intent (1–3 lines)
2) Plan (3–6 bullets)
3) Patch (file paths + minimal diff blocks)
4) Risks + rollback
5cation commands
TXT

cp -f codex/custom-instructions.txt .cursor/user-rules.txt

# -------------------------
# Cursor Rules (workspace-scoped)
# -------------------------
cat > .cursor/rules/00-core.mdc <<'RULE'
---
description: Core engineering contract (generic)
globs: ["**/*"]
alwaysApply: true
---

- No secrets in repo or outputs. Use env + secret stores.
- External input is untrusted: validate/sanitize/null-guard.
- Minimal diffs. No style refactors unless required.
- Default output: Intent + Plan + Patch + Risks/Rollback + Verification.
- Create missing folders/files when needed; only ask if risk of data loss/secret exposure.
RULE

cat > .cursor/rules/10-security.mdc <<'RULE'
---
description: Security & supply chain (generic)
globs: ["**/*"]
alwaysApply: true
---

- Redact tokens/keys. Never log credentials.
- Explicit auth/CORS; no wildcard production defaults.
- Prefer timeouts + retry-with-jitter for upstream calls where relevant.
- Avoid deps; if adding deps: justify and note risk/alternatives.
RULE

cat > .cursor/rules/20-quality.mdc <<'RULE'
---
description: Quality gates (generic)
globs: ["**/*"]
alwaysApply: true
---

- No “it should work.” Provide deterministic verification commands.
- For behavior changes: add/update a minimal test or fixture.
- Handle errors explicitly; avoid silent failures.
RULE

# -------------------------
# Cursor Commands
# -------------------------
cat > .cursor/commands/preflight.md <<'CMD'
Run deterministic checks before/after changes:
1) Detect package manager.
2) Install deps deterministically.
3) Run format check (if present), lint, typecheck, tests.
4) Report failures + fix with minimal diff.
Always include exact commands and expected outputs.
CMD

cat > .cursor/commands/security-audit.md <<'CMD'
Fast security audit:
- Scan for secret patterns (report file paths only; do not print secret contents)
- Dependency audit (npm/pnpm/yarn if available)
- Flag risky auth/CORS patterns
Return: findings ranked, file locations, concrete remediations.
CMD

cat > .cursor/commands/create-pr.md <<'CMD'
Prepare PR-ready output:
- Summary + intent
- Risks + rollback plan
- Verification evidence
- Checklist: secrets, input validation, tests, logging (if backend)
CMD

# -------------------------
# Local scripts: preflight + secret scan (cheap/free)
# -------------------------
cat > scripts/preflight.sh <<'SH'
#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

PM="npm"
[[ -f pnpm-lock.yaml ]] && PM="pnpm"
[[ -f yarn.lock ]] && PM="yarn"

echo "[preflight] pm=$PM"

run_script_if_exists() {
  local name="$1"
  if $PM run -s 2>/dev/null | grep -qE "^[[:space:]]*$name(:)?$"; then
    echo "[preflight] $PM run $name"
    $PM run "$name"
  else
    echo "[preflight] skip: $name"
  fi
}

if [[ "$PM" == "pnpm" ]]; then
  command -v pnpm >/dev/null || { echo "pnpm missing"; exit 1; }
  pnpm install --frozen-lockfile || pnpm install
elif [[ "$PM" == "yarn" ]]; then
  yarn install --frozen-lockfile || yarn install
else
  npm ci || npm install
fi

run_script_if_exists format:check
run_script_if_exists lint
run_script_if_exists typecheck
run_script_if_exists test

echo "[preflight] ✅ done"
SH
chmod +x scripts/preflight.sh

cat > scripts/security-scan.sh <<'SH'
#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

scan_paths() {
  local pattern="$1"
  rg --hidden --no-ignore-vcs --files-with-matches "$pattern" . \
    -g '!.git/**' -g '!node_modules/**' -g '!dist/**' -g '!build/**' -g '!.wrangler/**' -g '!.backup/**' || true
}

hits=0
echo "[secscan] scanning for common secret patterns (paths only)..."

patterns=(
  'AKIA[0-9A-Z]{16}'
  'AIzaSy[0-9A-Za-z\-_]{35}'
  'xox[baprs]-[0-9A-Za-z-]{10,}'
  '-----BEGIN (RSA|EC|OPENSSH|PGP) PRIVATE KEY-----'
  'sk-[A-Za-z0-9]{20,}'
  'Bearer [A-Za-z0-9\-_\.]{20,}'
  'password\s*[:=]\s*["'\''][^"'\'']+["'\'']'
  'api[_-]?key\s*[:=]'
  'secret\s*[:=]'
)

for pat in "${patterns[@]}"; do
  files="$(scan_paths "$pat")"
  if [[ -n "$files" ]]; then
    echo "[secscan] possible secret pattern: $pat"
    echo "$files"
    hits=1
  fi
done

if [[ -f package-lock.json || -fnpm-lock.yaml || -f yarn.lock ]]; then
  echo "[secscan] dependency audit (best-effort)..."
  if [[ -f pnpm-lock.yaml ]] && command -v pnpm >/dev/null; then pnpm audit || true; fi
  if [[ -f yarn.lock ]] && command -v yarn >/dev/null; then yarn audit || true; fi
  if [[ -f package-lock.json ]] && command -v npm >/dev/null; then npm audit || true; fi
fi

if [[ "$hits" -eq 1 ]]; then
  echo "[secscan] ❌ possible secrets detected (paths listed). Remediate + rotate if real."
  exit 1
fi

echo "[secscan] ✅ no obvious secrets found"
SH
chmod +x scripts/security-scan.sh

# -------------------------
# VSCode/Cursor tasks
# -------------------------
cat > .vscode/tasks.json <<'JSON'
{
  "version": "2.0.0",
  "tasks": [
    { "label": "Preflight", "type": "shell", "command": "bash scripts/preflight.sh", "problemMatcher": [], "group": "build" },
    { "label": "Security Scan", "type": "shell", "command": "bash scripts/security-scan.sh", "problemMatcher": [], "group": "test" }
  ]
}
JSON

# ------------------------Copilot instructions
# -------------------------
cat > .github/copilot-instructions.md <<'MD'
# Copilot Instructions (generic)

You are a principal engineer.

Rules:
- Never add/request/expose secrets. Use env + secret stores.
- Validate external input at boundaries; fail safely.
- Prefer minimal diffs; no style refactors unless necessary.
- Prefer deterministic checks (lint/typecheck/tests) over guessing.
- For behavior changes: add/update a minimal test or fixture.

Output format:
1) Intent
2) Plan
3) Patch (paths + diffs)
4) Risks + rollback
5) Verification commands
MD

# -------------------------
# CI preflight workflow
# -------------------------
cat > .github/workflows/ci-preflight.yml <<'YML'
name: ci-preflight
on:
  pull_request:
  push:
    branches: [ main ]
permissions:
  contents: read

jobs:
  preflight:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install ripgrep
        run: sudo apt-get update && sudo apt-get install -y ripgrep
      - name: Security scan (paths only)
        run: bash scripts/security-scan.sh
      - name: Preflight (if JS project)
        run: |
          if [[ -f package.json ]]; then
            bash scripts/preflight.sh
          else
            echo "skip: no package.json"
          fi
YML

cat > codex/README.md <<'MD'
# Codex setup (manual step)

Paste contents of `codex/custom-instructions.txt` into Codex Settings → Custom instructions.

This repo keeps the instructions in source control so you can reuse them across machines.
MD

echo "✅ Configured Cursor + Copilot + Codex instructions + local scripts + CI preflight."
echo "Manual (one-time):"
echo "  1) Cursor → Settings → Rules → User Rules: paste .cursor/user-rules.txt"
echo "  2) Codex Settings → Custom instructions: paste codex/custom-instructions.txt"
echo "Suggested: reload Cursor window."
