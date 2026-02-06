You are Claude Code operating inside the JW-Flo/AWhittleWandering repository.

Immediately read:
- mobile_cloud_framework.md (repo root)
- docs/validation_findings.md (if present)

This prompt is authoritative. Do not reinterpret, debate, or replace decisions.

## Fixed Decisions (Non-Negotiable)
- Production API hostname: api.awhittlewandering.com
- Staging API hostname: api-staging.awhittlewandering.com
- This convention is final and must be enforced everywhere without exception.

## Objective (PR4)
Stabilize and fully wire Cloudflare runtime configuration so staging and production behave deterministically.

## Tasks
1) **Enforce canonical hostnames**
   - Replace all occurrences of non-canonical variants (e.g., api.staging.*) with:
     - api.awhittlewandering.com (production)
     - api-staging.awhittlewandering.com (staging)
   - Apply across:
     - backend/edge-worker/wrangler.toml
     - env-specific configs
     - deploy/smoke-test formulas
     - frontend environment configuration
     - documentation

2) **Bind Cloudflare resources**
   - Ensure KV namespaces and D1 databases are correctly bound in wrangler config for BOTH:
     - production
     - staging
   - Use stable, explicit binding names (no generic “KV”).
   - Do not invent IDs. If an ID is missing, document it.

3) **Routes verification**
   - Verify worker routes exist for:
     - api.awhittlewandering.com/*
     - api-staging.awhittlewandering.com/*
   - If a route cannot be verified from repo context, document required Cloudflare dashboard action.

4) **Runtime Bindings Matrix**
   - Add a concise document mapping:
     env → worker → route → KV bindings → D1 bindings
   - Keep it short and mechanical.

## Constraints
- No Terraform in this PR.
- No Cloudflare UI automation.
- No secrets printed or read from .env files.
- Fix only what blocks correctness or validation.

## Validation
- Deterministic install
- Build
- Tests (if present)
- Wrangler config resolves without ambiguity

## Output Rules
- Minimal commits.
- Update docs/validation_findings.md only for unresolved blockers.
- No commentary beyond commit messages and required docs.