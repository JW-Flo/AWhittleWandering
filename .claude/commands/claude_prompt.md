# PR6 — “Grand Finale” Deployable Website Contract (Option A: remove SPA redirect rule)

## Mission
Ship a **deployable, resolvable, end-to-end functional** AWhittleWandering site today:
- **Pages (frontend)** builds cleanly from GitHub and serves content at `awhittlewandering.com`
- **Worker API (backend)** responds at `https://api.awhittlewandering.com`
- Frontend **successfully calls** backend (no placeholder “future wiring”)
- Document every miss/failure/assumption in a consolidated artifact for follow-on agents

## Hard constraints (do not violate)
- Do **not** add secrets to the repo
- Do **not** require manual local steps beyond Cloudflare UI setup already underway
- Fix only what blocks “deployable functional” delivery
- Prefer deterministic installs (`npm ci`) and CI-aligned scripts
- Keep changes minimal, scoped, and auditable

---

## Gate 0 — Review prerequisites
Before coding, review PR0–PR5 history and confirm:
- Canonical hostnames enforced (prod `api.awhittlewandering.com`, staging `api-staging.awhittlewandering.com`)
- `docs/RUNTIME_BINDINGS_MATRIX.md` and `docs/validation_findings.md` exist and are current
- CI preflight/test jobs pass (install/lint/typecheck/build/tests)

If anything is unclear, add notes to PR6 findings doc rather than guessing.

---

## Task A — Pages deploy reliability (Option A)
We are choosing **Option A**: remove SPA redirect rule that triggers loop.

### A1. Remove problematic redirect config
Search repo for:
- `frontend/public/_redirects`
- `_redirects`
- `redirects`
- `_headers`
- any Pages config files that define redirects (including `wrangler.toml` Pages redirect rules)

If a rule exists like: /* /index.html 200

or any “strip .html” / “index.html rewrite” rule that can loop:
- **Remove it entirely** (Option A)
- Replace only if absolutely required for routing, and if replaced, ensure no loop is possible

### A2. Add a short doc note explaining the removal
Add/update `docs/validation_findings.md` (or a PR6-specific findings doc) noting:
- what rule was removed
- why it looped / was invalid
- expected Pages SPA behavior without it

---

## Task B — Frontend ↔ Backend wiring verification (must be real)
### B1. Confirm frontend uses `VITE_API_BASE_URL`
In `frontend/`:
- Identify the code path that calls the API
- Ensure it reads from `import.meta.env.VITE_API_BASE_URL` (or equivalent)
- Ensure default fallback does **not** hardcode a workers.dev URL

### B2. Add a minimal “health” call path (only if missing)
If the UI currently does not hit the backend anywhere:
- Add a tiny, non-invasive call on app load:
  - `GET ${VITE_API_BASE_URL}/health` (or `/api/health`, depending on backend routes)
- Render a simple “API: OK / API: ERROR” status somewhere basic (no UI work beyond a line of text)
- Do not add heavy state management or UI frameworks

### B3. Ensure backend exposes a stable health endpoint
In Worker backend:
- Confirm there is a `GET /health` (or similar) route
- Response should be small JSON:
  - `{ "ok": true, "env": "production|staging", "ts": "<iso>" }`
- Must not require auth
- Must not reveal secrets

If it exists already, do not change it—just document route + expected response.

---

## Task C — Configuration guardrails (prevent recurring breakage)
### C1. Add “single source of truth” doc for Pages config (tiny)
Create or update: `docs/PAGES_DEPLOYMENT.md` with exact field values:

- Framework preset: None
- Root directory: `frontend`
- Build command: `npm ci && npm run build`
- Output directory: `dist`
- Required env var: `VITE_API_BASE_URL=https://api.awhittlewandering.com`

Keep it short and copy/pasteable.

### C2. Add repo-level “no drift” notes (only if necessary)
If you find multiple conflicting docs/instructions, update **one** canonical doc and:
- add a timestamped entry under a “Change Log” section
- do not rewrite the entire framework doc unless required

---

## Task D — Validation (must run)
Run:
- install
- lint
- typecheck
- build
- tests

If any step fails:
- Fix only what blocks validation AND deployability
- Otherwise document clearly in the findings artifact

---

## Task E — Consolidated PR6 Findings Artifact (required)
Create: `docs/PR6_DEPLOYABILITY_REPORT.md`

Include:
- What was changed (bullet list)
- Pages config requirements (copy/paste values)
- API route(s) used by frontend
- Known limitations / unresolved items
- Any Cloudflare UI-only steps still required (explicitly marked as “manual CF UI”)
- Any mismatch discovered between docs and reality

This document is the handoff contract for future agents.

---

## Output requirements
1. Open PR6 against `main`
2. Include PR description with:
   - summary
   - validation results
   - links to the new/updated docs
3. Ensure CI is green

---

## Notes for Claude behavior
- If you need extra work from other agents, tag them explicitly in comments using:
  - `@copilot` for review/suggestions
  - `@codex` for code generation proposals
- Do not offload core PR6 tasks; PR6 must be self-contained

Proceed now.