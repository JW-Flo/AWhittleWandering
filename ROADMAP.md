# AWhittleWandering — Canonical Roadmap (Single Source of Truth)

This is the **only normative roadmap** for platform development. If any other document conflicts with this file, **this file wins**.

## North Star (mission)

Take the current single-journey prototype to a production-grade, **private-by-default** platform that onboards self-serve creators and invited followers—while making the default experience **narrative (shape/presence/memory)**, not telemetry.

## Product + safety invariants (do not violate)

- **Anonymous viewing**: only the **flagship journey** is viewable without an account.
- **All other journeys**: invite + account required; enforce ACL server-side.
- **No client-side Tessie secrets**: Tessie keys never exist in browser state in production.
- **Privacy defaults**: conservative location fidelity for public/anonymous views.
- **Admin fail-closed**: if secrets/config missing in prod, admin endpoints are disabled (401/403/503); never fail-open.
- **External data is untrusted**: validate inputs/outputs, null-guard, soft-fail with degraded UX.

## Current state (truth, not aspiration)

- Cloudflare Worker + D1 backend serving **one hard-coded flagship journey** via `/api/v1/unified-data`.
- React frontend rendering a dashboard-style view from that endpoint.
- AI endpoints exist (route optimization, journal generation).
- Gaps: no accounts/invites/ACLs; client-side Tessie-key flows exist; contract drift can crash UI; privacy posture inconsistent.

---

## Staged delivery plan (build in order)

### Stage 0 — Flagship safe + coherent (public, 1 journey)

**Goal**: safe to share publicly; no embarrassment, no surveillance optics, no crash paths.

**Deliverables + acceptance criteria**

- **0.1 Unified-data contract locked**
  - Backend contract matches what frontend renders; homepage never throws on empty/partial timelines.
  - CI has contract checks that fail on regression.
- **0.2 Fail-closed admin + remove/gate demo endpoints**
  - Admin endpoints unreachable unless correctly configured.
- **0.3 Privacy alignment (public view)**
  - Anonymous viewers never see raw coordinates; default to coarse orientation (city/state).
- **0.4 Observability minimization**
  - Do not persist raw IP/UA by default; keep only aggregate metrics needed for uptime/abuse.
- **0.5 Quarantine client-side Tessie-key flows**
  - Production UI has no Tessie-key entry.
  - Build/grep guard ensures `api.tessie.com` is not referenced in shipped frontend code paths.
- **0.6 Legal/DSAR surfaces live**
  - `/terms`, `/privacy`, `/data-request` reachable and linked from global footer.

**Rollback strategy**

- Feature-flag sensitive presentation if needed, but the default remains conservative.

---

### Stage 1 — Accounts + invites + ACL + encrypted secrets (platform core)

**Goal**: invited followers can safely access private journeys; creators can store Tessie keys server-side only.

**Deliverables + acceptance criteria**

- **1.1 D1 schema + migrations**
  - Tables for users/sessions/journeys/memberships/invites/data sources + encrypted secrets.
- **1.2 Auth endpoints + secure sessions**
  - Register/login/logout; secure cookies or signed sessions; rate limits on auth endpoints.
- **1.3 Legal acceptance capture**
  - Registration requires explicit ToS + Privacy acceptance; store version + timestamp with minimal metadata.
- **1.4 Invite flow**
  - Owner creates invite; invitee accepts; membership created.
- **1.5 ACL enforcement for journey APIs**
  - Anonymous can access flagship only.
  - Journey-scoped endpoints enforce membership.
- **1.6 Encrypted Tessie secret storage**
  - AES-GCM encryption at rest using app-level `MASTER_KEY` (Worker secret).
  - Keys are never returned to clients.

**Rollback strategy**

- Keep creator onboarding UI feature-flagged until Stage 2 UI is ready.

---

### Stage 2 — Self-serve creator onboarding (connect data, invite followers)

**Goal**: creators onboard without operator help; ingestion scales beyond a single journey.

**Deliverables + acceptance criteria**

- **2.1 Creator onboarding UI**
  - Create account → create journey → connect Tessie server-side → select vehicle → set privacy defaults → invite followers.
- **2.2 Multi-journey ingestion**
  - Cron iterates active journeys safely with per-journey backoff + concurrency limits; no stampede.
- **2.3 Follower experience (invited)**
  - Invite acceptance → view journey (story-first surface, even if minimal in Stage 2).

**Rollback strategy**

- Beta cap on number of creator journeys to protect ingestion runtime.

---

### Stage 3 — Narrative default + instrument panel (mission UX)

**Goal**: default UI becomes story-first (orientation + meaning); dashboards become opt-in.

**Deliverables + acceptance criteria**

- **3.1 Information architecture rewrite**
  - Default surfaces: `Now`, `Today`, `Journey` (arc); “Instrument Panel” is opt-in.
- **3.2 Story beats generation**
  - Convert drives/charges into “beats” per day; deterministic outputs and tests.
- **3.3 AI Navigator + Journal alignment**
  - Route optimization framed as AI Navigator; journal supports memory (structured + editable).

**Rollback strategy**

- Keep instrument panel accessible but non-default.

---

### Stage 4 — Launch ops (production onboarding readiness)

**Goal**: staging/prod separation; deterministic CI; retention/abuse controls; go-live/rollback playbook.

**Deliverables + acceptance criteria**

- Environment separation for bindings (D1/R2/KV); no cross-contamination.
- CI gates: contract tests + auth/ACL integration tests + smoke checks.
- Rate limiting durability + schema alignment.
- Retention + deletion + DSAR export/delete flows (D1 + R2).
- Go-live checklist + rollback: “disable onboarding, keep flagship stable”.

---

## Working agreements (prevent drift)

- Any PR that changes stages, acceptance criteria, or the mission must update **this file**.
- Supporting docs may exist, but must not redefine stages/acceptance criteria.

## Supporting material (non-normative)

- Sprint log: `SPRINT_PROGRESS_SUMMARY.md`
- Governance + supporting references (non-roadmap): `docs/governance/README.md`
