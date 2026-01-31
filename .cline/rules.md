# Cline Rules — AWhittleWandering

## Purpose
Provide persistent guardrails for autonomous work in this repository.

## Non-negotiables
- Never commit secrets or credentials. Use environment variables + wrangler secrets.
- All public APIs must use privacy redaction (no raw GPS in public tier).
- Server-side aggregation only; clients consume `/api/v1/unified-data`.
- No Tesla-specific logic in shared UI or shared services (provider-agnostic).
- Prefer idempotent migrations and replayable ETL.
- Do not deploy manually; use CI/CD workflows only.

## Coding conventions
- Follow existing patterns in `backend/edge-worker` and `shared` packages.
- Use Zod for schema validation in shared/ and backend/.
- Keep changes minimal and targeted; avoid unrelated refactors.
- Add or update tests for contract changes.

## Risk tiers
- Low: docs-only or small isolated changes.
- Medium: changes to shared schemas, adapters, or API logic.
- High: auth, security, deploy config, or production workflows.

## Required verification
- Run or update contract/schema checks if touched.
- Keep migration idempotency checks passing.
