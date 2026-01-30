# Agent Framework Reconciliation

Date: 2026-01-30

## Inventory (agent setup artifacts)

Present (agent-related files in repo):
- .github/copilot-instructions.md (assistant rules + output format)
- .github/codex/policy.yml (runtime/docs paths + labels)
- .github/workflows/ci-preflight.yml (PR + main push checks)
- scripts/preflight.sh (install + format/lint/typecheck/test)
- scripts/security-scan.sh (secret pattern scan + audit)

Not found (confirmed absent):
- .cursor/**, .backup/**, codex/** at repo root
- scripts/setup-ide-ai.sh

## Current workflows + triggers

- ci-preflight: pull_request, push main
- sync-secrets: schedule daily 02:00 UTC + workflow_dispatch
- compound-nightly: schedule daily 02:30 UTC + workflow_dispatch
- auto-merge: pull_request_target events (opened, reopened, synchronize, ready_for_review, labeled, unlabeled)

## Scripts

- scripts/security-scan.sh: scans for common leaked-secret patterns + best-effort audit
- scripts/preflight.sh: installs deps; runs format/lint/typecheck/test if available
- scripts/compound-nightly.sh: retries security-scan + preflight with backoff

## Requirements comparison

| Requirement | Status | Notes |
| --- | --- | --- |
| CI-native execution | Keep | ci-preflight already runs on PRs + main |
| Nightly compound + auto-compound loop | Change | added compound-nightly workflow + retry loop |
| Risk-tier auto-merge rules | Change | added auto-merge workflow + risk labels |
| Security rules (no secrets) | Keep | security-scan + sync-secrets; no secrets stored |

## Keep / Change / Delete plan (short)

Keep:
- ci-preflight workflow
- security-scan + preflight scripts
- copilot instructions + codex policy
- sync-secrets workflow

Change:
- add compound-nightly workflow + script (retry/backoff + logs)
- add auto-merge workflow (risk-tier rules + labels)
- add risk labels to policy

Delete:
- none (no leftover agent-pack artifacts found)
