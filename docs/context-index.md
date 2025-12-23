# Context Index

Purpose
Single entry point to locate active architecture, roadmap, and operational context docs.

Core Docs

- Copilot / Contribution Guidance: `.github/copilot-instructions.md`
- Canonical product roadmap: `ROADMAP.md`
- Governance & coordination (non-roadmap): `docs/governance/README.md`

Operational References

- Backend Worker Entrypoint: `backend/edge-worker/src/index.ts`
- Logging Utility: `backend/edge-worker/src/utils/log.ts`
- Rate Limiting & Auth Tokens: `backend/edge-worker/src/utils/rateLimit.ts`
- QA Automation Scripts: `qa/`

Conventions Quick Reminders

- Append-only health metrics.
- Parametrized D1 queries only.
- Cache heavy aggregates (TTL ~30s) before exposing new analytics endpoints.
- Journey filter constant: `continental-usa-2025`.

Update Workflow

1. Add / adjust section in roadmap doc.
2. Insert change log entry there (not here).
3. Keep this index lean; remove nothing, only append new links.

Last Initialized: 2025-10-03

Cross-Repo

- Multi-Repo Manifest: docs/governance/multi-repo-manifest.json
- Project-AtlasIT wrapper: ../Project-AtlasIT/.github/copilot-instructions.md
- JW-Site wrapper: ../JW-Site/.github/copilot-instructions.md
