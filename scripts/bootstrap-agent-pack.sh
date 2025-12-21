#!/usr/bin/env bash
set -euo pipefail
umask 077

FORCE=0
if [[ "${1:-}" == "--force" ]]; then FORCE=1; fi

write_file() {
  local path="$1"
  local content="$2"
  mkdir -p "$(dirname "$path")"

  if [[ -f "$path" && "$FORCE" -ne 1 ]]; then
    echo "skip: $path (exists). Use --force to overwrite."
    return 0
  fi

  printf "%s" "$content" > "$path"
  echo "wrote: $path"
}

copy_pack() {
  local src="$1"
  local dst="$2"
  mkdir -p "$(dirname "$dst")"
  if [[ ! -f "$src" ]]; then
    echo "missing: $src"
    exit 1
  fi
  cp -f "$src" "$dst"
  echo "sync: $src -> $dst"
}

# ----------------------------
# Canonical Agent Pack sources
# ----------------------------
mkdir -p ai/pack/rules ai/pack/commands ai/context .cursor/rules .cursor/commands .claude/commands .github/workflows

# --- Shared context docs (agents read these; humans benefit too) ---
write_file "ai/context/README.md" \
"# AI Context (Repo-Local)\n\nPut *project truth* here so agents stop hallucinating:\n- architecture.md\n- data-contracts.md\n- env-manifest.md\n- runbook.md\n- fixtures/ (sample responses)\n"

write_file "ai/context/architecture.md" \
"# Architecture\n\n- Describe runtime components (frontend, worker/api, analytics, storage)\n- List key routes + data flows\n- Note where secrets live (never in repo)\n"

write_file "ai/context/data-contracts.md" \
"# Data Contracts\n\n## Principles\n- All external data is untrusted.\n- Validate at boundaries (runtime schema + types).\n- Version schemas; never silently rename fields.\n\n## Telemetry\n- Define canonical fields the UI consumes.\n- Define transform rules from upstream -> canonical.\n\n## Error/Degraded Modes\n- live | cached | archived | error\n- Always return a reason + lastUpdated when degraded.\n"

write_file "ai/context/env-manifest.md" \
"# Environment Manifest\n\nList env vars *by component* (frontend/worker/analytics):\n\n| Var | Component | Required | Secret | Purpose |\n|---|---|---:|---:|---|\n\nRules:\n- No secrets committed.\n- Provide .env.example with placeholders.\n"

write_file "ai/context/runbook.md" \
"# Runbook\n\n## Local dev\n- install\n- run\n- test\n\n## Deploy\n- CI steps\n- required secrets\n- rollback plan\n\n## Triage\n- where logs live\n- common failure modes\n"

# ----------------------------
# Tool-specific instruction files
# ----------------------------

# Copilot (VS Code / GitHub Copilot Chat consumes this)
write_file ".github/copilot-instructions.md" \
"# Copilot Instructions\n\nYou are a principal engineer.\n\n## Output contract\n- Prefer minimal diffs.\n- Provide file paths + patch-style blocks.\n- Add tests when changing behavior.\n- Never output or request secrets.\n\n## Reliability rules\n- Validate external API data at boundaries.\n- No blank-screen UI states; always render loading/error/degraded.\n- Observability required for backend changes (structured logs + requestId).\n\n## Repo-first\n- Search repo before writing new modules.\n- Reuse existing patterns; match lint/format/types.\n"

# Claude Code (if you use it) – Cursor can optionally import CLAUDE.md too
write_file "CLAUDE.md" \
"# Claude / Agent Instructions\n\nRead: ai/context/* before making changes.\n\nNon-negotiables:\n- No secrets in repo.\n- Validate external data.\n- Degrade gracefully.\n- Add tests for contract boundaries.\n"

# ----------------------------
# Canonical rules + commands (single source of truth)
# ----------------------------

# Project rules (Cursor .mdc)
write_file "ai/pack/rules/00-core.mdc" \
"---\ndescription: Core engineering contract (stability > vibes)\nalwaysApply: true\n---\n\n## Always\n- No secrets in repo. Use env + secret stores.\n- External data is untrusted: validate + sanitize + null-guard.\n- Prefer idempotent processing for event/telemetry flows.\n- Output: plan (short) + diff + risks + test plan.\n\n## Performance/cost\n- Prefer local checks (tests/lint/typecheck) before usg model guesses.\n- Avoid rewrites. Make smallest safe change that fixes root cause.\n"

write_file "ai/pack/rules/10-data-contracts.mdc" \
"---\ndescription: Data contract discipline\nalwaysApply: true\n---\n\n## Contract rules\n- Schema versioning: never silently rename or drop fields.\n- Boundary validation: runtime schemas at API edges.\n- If upstream shape changes: map -> canonical; add fixture + contract test.\n\n## UI rules\n- No blank screens. Always render loading/error/degraded state.\n- Degraded payload must include reason + lastUpdated.\n"

write_file "ai/pack/rules/20-security.mdc" \
"---\ndescription: DevSecOps guardrails\nalwaysApply: true\n---\n\n## Security\n- Least privilege env vars; do not leak tokens client-side.\n- CORS must be explicit (no '*' in prod unless justified).\n- Rate limit/backoff for upstream calls.\n- Log safely: include requestId/latency/status; never log secrets.\n\n## Supply chain\n- Prefer pinned versions.\n- If adding deps: justify + check license + avoid heavy transitive bloat.\n"

# Commands (Cursor + Claude share these as plain .md)
write_file "ai/pack/commands/fix-contract.md" \
"Goal: Fix a data-contract mismatch without breaking UI.\n\nSteps:\n1) Find producer shape (API/worker) + consumer shape (UI/types).\n2) Add runtime schema validation at boundary.\n3) Map upstream -> canonical (do not spread upstream fields into UI).\n4) Add/extend fixture + contract test.\n5) Ensure UI shows explicit state: live|cached|archived|error.\n\nDeliver:\n- root cause\n- minimal diff blocks with paths\n- tests added/updated\n- risk + rollback\n"

write_file "ai/pack/commands/preflight.md" \
"Goal: Make repo green locally before any refactor.\n\nDo:\n- detect package manager + scripts\n- run: format check, lint, typecheck, tests\n- fix failures with minimal diffs\n\nDeliver:\n- commands run\n- failures\n- patch blocks\n- verification steps\n"

write_file "ai/pack/commands/security-audit.md" \
"Audit for:\n- secrets exposure\n- client-side token leakage\n- CORS/auth issues\n- rate limiting/abuse\n- risky deps\n\nDeliver:\n- findings ranked by severity\n- exact file locations\n- concrete fixes\n- secret rotation checklist (if needed)\n"

write_file "ai/pack/commands/add-observability.md" \
"Add:\n- structured logs (route/status/latency/requestId)\n- safe error capture hooks\n- frontend error boundary + network failure capture\n\nDeliver:\n- minimal diffs\n- where to view logs\n- alerting hooks (optional)\n"

write_file "ai/pack/commands/create-pr.md" \
"Create PR-ready change:\n- summary\n- risks + rollback\n- test evidence\n- checklist: secrets/schema/degraded/logging\n\nDeliver:\n- branch name\n- commits\n- PR description\n"

# ----------------------------
# Sync canon -> tool locations
# ----------------------------
# Cursor rules
copy_pack "ai/pack/rules/00-core.mdc" ".cursor/rules/00-core.mdc"
copy_pack "ai/pack/rules/10-data-contracts.mdc" ".cursor/rules/10-data-contracts.mdc"
copy_pack "ai/pack/rules/20-security.mdc" ".cursor/rules/20-security.mdc"

# Cursor commands (names become /fix-contract, /preflight, etc.)
copy_pack "ai/pack/commands/fix-contract.md" ".cursor/commands/fix-contract.md"
copy_pack "ai/pack/commands/preflight.md" ".cursor/commands/preflight.md"
copy_pack "ai/pack/commands/security-audit.md" ".cursor/commands/security-audit.md"
copy_pack "ai/pack/commands/add-observability.md" ".cursor/commands/add-observability.md"
copy_pack "ai/pack/commands/create-pr.md" ".cursor/commands/create-pr.md"

# Claude commands (optional, but cheap: same prompts reused)
copy_pack "ai/pack/commands/fix-contract.md" ".claude/commands/fix-contract.md"
copy_pack "ai/pack/commands/preflight.md" ".claude/commands/preflight.md"
copy_pack "ai/pack/commands/security-audit.md" ".claude/commands/security-audit.md"
copy_pack "ai/pack/commands/add-observability.md" ".claude/commands/add-observability.md"
copy_pack "ai/pack/commands/create-pr.md" ".claude/commands/create-pr.md"

# ----------------------------
# CI drift check (free)
# ----------------------------
write_file ".github/workflows/agent-pack.yml" \
"name: agent-pack\non:\n  pull_request:\n  push:\n    branches: [ main ]\n\njobs:\n  verify:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: bash scripts/bootstrap-agent-pack.sh\n      - run: |\n          git diff --exit-code || (echo \"Agent pack drift. Run scripts/bootstrap-agent-pack.sh and commit results.\" && exit 1)\n"

# Helper text file for Cursor UI “User Rules” (cannot be set repo-wide reliably)
write_file ".cursor/user-rules.txt" \
"You are my principal DevSecOps + full-stack architect.\n- Be decisive: plan + minimal diff + tests.\n- Assume missing folders/files should be created.\n- Never leak secrets.\n- Validate external data.\n- Add observability.\n"

echo
echo "✅ Agent Pack installed."
echo "Next:"
echo "  1) Commit: ai/, .cursor/, .claude/, .github/"
echo "  2) In Cursor UI, paste .cursor/user-rules.txt into User Rules once."
