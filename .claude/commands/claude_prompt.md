# PR6 Prompt — “Grand Finale” Deployable AWhittleWandering

## Role + Constraints
You are acting as the release engineer for AWhittleWandering. Your mission is to ship a **resolvable, functional website** (UI can be ugly) with a **working frontend ↔ backend** path by end of day.

Hard constraints:
- **Do NOT open new PRs.** All work lands in **this PR6 branch only**.
- You **may inspect other branches/PRs**, but you must **not** commit to them. If needed, **cherry-pick** into PR6.
- Do **not** weaken security posture (no hard-coded secrets, no “temporary” tokens in code).
- Any unresolved blockers must be documented in `docs/validation_findings.md` with clear next actions.

Selected architecture: **Option A**
- Frontend: **Cloudflare Pages** (Git-connected) builds `frontend/` and serves static site.
- Backend: **Cloudflare Worker** at `api.awhittlewandering.com/*` (prod) and `api-staging.awhittlewandering.com/*` (staging).
- Frontend talks to backend via `VITE_API_BASE_URL` (or equivalent) pointing to the canonical API host.

## Context You Must Respect
- Canonical hostnames are now enforced:
  - Production API: `api.awhittlewandering.com`
  - Staging API: `api-staging.awhittlewandering.com`
  - Do **NOT** use dot-staging (`api.staging...`). Standardize to hyphen.
- PR4 already:
  - re-enabled prod D1 with `database_id = 889d864a-...`
  - added staging env with bindings
  - created `docs/RUNTIME_BINDINGS_MATRIX.md` and `docs/validation_findings.md` with some blockers

## Primary Goal (Non-Negotiable)
A user can load the Pages site (prod) and it can successfully call at least one backend endpoint (prod) without CORS/URL/DNS breaking.

Minimum demo path:
- GET `/health` (or `/api/health`) returns 200 from Worker
- Frontend page loads and shows “backend ok” (can be raw text)

## Work Plan — Execute in This Order

### 1) Stop the PR/branch chaos (containment)
- Add a short doc: `docs/PR_TRIAGE_RULES.md`
  - Rule: “One active PR at a time for platform wiring.”
  - Rule: “Agents may not spawn new PRs; must append commits to current PR.”
  - Rule: “If you hit an issue: open/append an Issue, not a PR.”

### 2) Pages build correctness (Git-connected Pages)
Ensure Cloudflare Pages can build and deploy from this repo deterministically.

Repo facts (verify in code):
- Frontend exists at `frontend/`
- Determine lockfile usage:
  - If `package-lock.json` exists in `frontend/` → use `npm ci`
  - If `pnpm-lock.yaml` exists → use `pnpm install --frozen-lockfile`
- Ensure Pages settings align with repo structure:
  - Root directory: `frontend`
  - Build command: `npm ci && npm run build` (or pnpm equivalent)
  - Output directory: **match the actual build output** (commonly `dist`)

Implementation requirements:
- Add a repo-owned config helper doc: `docs/PAGES_BUILD_SETTINGS.md` with exact values:
  - Framework preset: “None” (unless you can prove a better choice from package.json)
  - Root: `frontend`
  - Build: (exact command)
  - Output: (exact dir)
- If the frontend build output is not `dist`, fix it in `frontend` tooling so it is consistent.

### 3) Fix the Pages redirects problem (infinite loop)
There is an existing log warning about invalid redirect rules and an infinite loop (likely `_redirects` or similar).

Tasks:
- Find the source of redirect rules in `frontend/public/_redirects` or similar.
- Remove or correct the problematic rule (example pattern: `/* /index.html 200` can loop depending on other rules).
- Ensure SPA fallback works without loops:
  - Use a safe SPA fallback approach for Pages.
  - Document the final rules in `docs/PAGES_REDIRECTS.md`.

Acceptance:
- Pages deploy logs show **no infinite loop warning**.
- Site loads without redirect thrash.

### 4) Frontend ↔ API wiring (canonical + environment-safe)
Goal: one “known good” request from frontend to backend.

Tasks:
- Confirm the frontend uses a single API base variable:
  - Prefer: `VITE_API_BASE_URL`
- Ensure `.env.example` exists at `frontend/.env.example` and includes:
  - `VITE_API_BASE_URL=https://api.awhittlewandering.com`
- Update frontend code to call `${VITE_API_BASE_URL}/health` (or the real route) and render result.
- Add CORS support on the Worker side if needed:
  - Allow origin: `https://awhittlewandering.com` and Pages preview domains.
  - Handle OPTIONS preflight cleanly.
- Add a minimal backend endpoint if not present:
  - `GET /health` returning JSON `{ ok: true, env: "production" }` (and staging variant)

Acceptance:
- Build passes.
- A minimal page renders and indicates the health check succeeded.

### 5) Cloudflare bindings sanity (KV + D1 + secrets)
Bindings must be consistent, and secrets must not be manual-only.

Tasks:
- Confirm Worker `wrangler.toml` (or jsonc) has:
  - production + staging env blocks
  - D1 binding(s) for each env
  - KV binding(s) for each env (do not share prod/staging namespaces)
- Produce a **single bindings matrix source of truth**:
  - Update `docs/RUNTIME_BINDINGS_MATRIX.md` if needed
- Secrets strategy (CI-defined):
  - Add `docs/SECRETS_STRATEGY.md` describing:
    - which secrets are required
    - where they are stored (GitHub Secrets, CF secrets)
    - how they are injected (CI)
  - Add/adjust GitHub Actions workflow so deploys don’t require “click-ops” secret injection.

Important:
- Do NOT put actual secret values in repo.
- If a secret can’t be automated today (Cloudflare limitation), document it as a blocker with exact manual step.

### 6) Production verification check (single point of failure hunt)
Add a “release gate” checklist and implement automated smoke tests.

Tasks:
- Create `docs/RELEASE_GATE_PR6.md` including:
  - DNS prerequisites
  - Pages build settings
  - Worker routes
  - Required env vars
  - One-click verification steps
- Add a CI smoke test job that:
  - hits `https://api.awhittlewandering.com/health`
  - hits Pages URL and checks it returns 200
  - (optional) verifies CORS headers exist on API responses
- If DNS is not manageable in-code, make the smoke test tolerant:
  - run on staging URLs or configurable env

Acceptance:
- CI shows a clear “PASS/FAIL” for release readiness.

## De-Duping Existing PRs / Issues
There are many older PRs and many “verification failed” issues.

Rules for PR6:
- Do not attempt to merge everything.
- Only pull in changes that are required to ship:
  - Pages build correctness
  - redirect loop fix
  - frontend↔backend health wiring
  - worker route/CORS correctness
  - minimal CI release gates

Create `docs/PR6_SCOPE.md`:
- “Included now”
- “Deferred (with reason)”
- “Unsafe/needs review”

## Deliverables (must all be in this PR)
- `docs/PAGES_BUILD_SETTINGS.md`
- `docs/PAGES_REDIRECTS.md`
- `docs/SECRETS_STRATEGY.md`
- `docs/RELEASE_GATE_PR6.md`
- `docs/PR_TRIAGE_RULES.md`
- `docs/PR6_SCOPE.md`
- Frontend change that visibly confirms backend connectivity
- Backend health endpoint + CORS if needed
- CI smoke tests

## Final Acceptance Criteria
- Pages build/deploy succeeds without redirect loop warnings.
- Visiting Pages site returns 200 and displays a simple “API OK” (or equivalent).
- API health endpoint returns 200 at canonical host.
- CI has a single smoke test signal for release readiness.
- Any unresolved blockers are documented with exact next actions in `docs/validation_findings.md`.

## Output Format
At the end, provide:
- A concise summary of changes
- Exact verification URLs
- Any remaining blockers (if any) with owner + next action