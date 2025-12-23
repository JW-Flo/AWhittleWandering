## Workflow ownership + autonomy (cost control)

Goal: keep autonomous Actions runs minimal and intentional.

### Autonomous workflows (run without a human clicking “Run workflow”)

| Workflow | Owner | Triggers | Cost risk | Notes |
|---|---|---|---|---|
| `1password-sync-github-env-secrets.yml` | Platform | `schedule` (daily) | Low | Single daily poll; cancels overlap; triggers Cloudflare sync only when 1Password changed |
| `backend-deploy.yml` | Platform | `push` main (backend paths) | Medium | Builds + deploys Worker; only runs on backend changes |
| `frontend-pages-deploy.yml` | Platform | `push` main (frontend paths) | Medium | Builds + deploys Pages; only runs on frontend changes |
| `api-shield-sync.yml` | Platform | `push` (OpenAPI + ops paths) | Medium | Runs tests + uploads schema; only runs on schema-related changes |
| `core-qa.yml` | Platform | `push` (backend paths), `pull_request` | Medium | Backend build/tests; scoped to backend |
| `ci-preflight.yml` | Platform | `push` main, `pull_request` | Low | Fast scans + preflight; broad trigger but lightweight |
| `pr-autolabel.yml` | Platform | `pull_request` | Low | Metadata-only |
| `agent-approval-gate.yml` | Platform | `pull_request` | Low | Metadata-only |

### Manual-only / label-gated workflows (preferred for expensive tasks)

| Workflow | Owner | Triggers | Notes |
|---|---|---|---|
| `sync-secrets.yml` | Platform | `workflow_dispatch` | Run when you want to force Cloudflare sync |
| `validate-secrets.yml` | Platform | `workflow_dispatch`, `pull_request` | No cron; use when debugging |
| `codex-run.yml` | Platform | label-gated + manual | Runs Codex; costs money; already label-gated |
| `codex-smoke.yml` | Platform | manual + push (workflow file changes only) | Keep minimal; proves wiring |

### Rules of thumb
- If it’s **expensive** (AI, deploys, long test suites), prefer **manual or label-gated** triggers.
- If it’s **scheduled**, it must have:
  - concurrency control (no overlap)
  - a clear owner + purpose
  - a doc entry in `docs/workflows/SCHEDULED_WORKFLOWS.md`


