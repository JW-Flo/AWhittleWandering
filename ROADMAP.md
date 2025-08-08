## Project Roadmap

Status legend: ✅ Done · 🚧 In Progress · 🔜 Planned · 🧪 Experimental · 🛑 Blocked / Needs Decision

### 0. Immediate Priorities (Next 1–2 Weeks)
| Item | Status | Priority | Notes / Acceptance |
|------|--------|----------|--------------------|
| Stabilize `/api/v1/unified-data` (eliminate 500s) | 🚧 | P0 | Implement resilient fallback queries, cache validation, add contract test (validator already present). |
| Restrict/remove diagnostic admin endpoints | 🚧 | P0 | Gate under auth or remove temporary troubleshooting routes before major public announcement. |
| Add backend Worker GitHub Action workflow | 🔜 | P0 | Mirror Pages workflow; build, run QA scripts, deploy on `main` or tagged release. |
| Document D1 schema & align prod vs repo | 🔜 | P0 | Export prod schema, diff with migration file, add missing columns or code guards. |
| Secrets audit & rotation plan | 🔜 | P1 | Inventory in README/ROADMAP; schedule rotation cadence (quarterly). |
| Performance profiling unified-data build path | 🔜 | P1 | Measure cold vs warm latency; set target (<300ms p95). |

### 1. Backend & Data Layer
| Task | Status | Priority | Detail |
|------|--------|----------|--------|
| D1 schema migrations versioning (incremental scripts) | 🔜 | P1 | Introduce numbered migrations + idempotency checks. |
| Add drive/charge aggregation materialized table (TTL refresh) | 🔜 | P1 | Reduce per-request heavy queries; use short cron job or on-demand rebuild. |
| Implement state visit history & ageSeconds in health | 🔜 | P2 | Enhance observability for ingestion freshness. |
| Geocoding robustness (retry + logging) | 🔜 | P2 | Wrap reverse geocode helper with backoff + structured log. |
| Journey replay endpoint | 🧪 | P3 | Provide sequence of drive segments for playback. |
| Data export API (JSON/CSV) | 🔜 | P3 | Rate limited; aligns with open data goals. |

### 2. Ingestion & Analytics
| Task | Status | Priority | Detail |
|------|--------|----------|--------|
| Normalize Tessie vs internal telemetry schema | 🚧 | P1 | Ensure field naming parity; map missing fields explicitly. |
| Charging efficiency analytics (kWh vs ambient) | 🔜 | P2 | Extend analytics module; batch compute & cache. |
| Weather enrichment batching | 🔜 | P2 | Avoid per-point API calls; group by time window. |
| Anomaly detection (sudden SOC drop) | 🧪 | P3 | Simple z-score heuristic; log anomalies. |

### 3. Frontend Enhancements
| Task | Status | Priority | Detail |
|------|--------|----------|--------|
| Map vendor bundle further code splitting | 🔜 | P1 | Additional dynamic imports for layers/controls to reduce initial payload. |
| Unified-data query client fallback handling | 🔜 | P1 | Graceful UI state if partial aggregates missing. |
| Media gallery (Phase 4 items) | 🚧 | P2 | Photo/video upload integration once backend endpoints exist. |
| Offline/low-connectivity mode (basic cache) | 🧪 | P3 | Service worker caching for last-known status & timeline. |
| Accessibility audit (WCAG quick pass) | 🔜 | P2 | Landmarks, color contrast, focus order. |

### 4. DevOps & CI/CD
| Task | Status | Priority | Detail |
|------|--------|----------|--------|
| Backend deploy workflow (`worker-deploy.yml`) | 🔜 | P0 | Build, QA (schema + smoke), deploy via Wrangler. |
| Add contract/schema QA to CI (fail on mismatch) | 🔜 | P1 | Run `validate-unified.ts` against deployed preview or local worker. |
| Security scan consolidation (single job matrix) | 🔜 | P2 | Combine Semgrep/Bandit/Trivy into one workflow with SARIF upload. |
| Release tagging & changelog automation | 🔜 | P2 | Conventional commits → auto release notes. |
| Canary / staged rollout for Worker | 🧪 | P3 | Deploy to staging route; smoke test; promote. |

### 5. Security & Compliance
| Task | Status | Priority | Detail |
|------|--------|----------|--------|
| Auth strategy for admin endpoints (token/KV or JWT) | 🔜 | P0 | Implement consistent middleware; rate limit + audit log. |
| Secrets inventory & rotation doc | 🔜 | P1 | Add `SECURITY.md` snapshot & rotation dates. |
| Input validation audit (all APIs) | 🔜 | P1 | Confirm Zod/guards everywhere; add fallback sanitization. |
| Rate limit tuning & burst simulation | 🔜 | P2 | Load test typical vs abusive patterns; adjust thresholds. |
| Add minimal CSP / security headers section (frontend) | 🔜 | P2 | Document + implement meta/http headers. |

### 6. Observability & Performance
| Task | Status | Priority | Detail |
|------|--------|----------|--------|
| Structured log normalization (levels, event names) | 🔜 | P1 | Ensure consistent shape for log aggregation. |
| Latency metrics for unified-data (p50/p95) | 🔜 | P1 | Emit simple timing fields; store in Analytics Engine / D1 rollup. |
| Cache hit/miss instrumentation | 🔜 | P1 | Log cache decision for unified-data key. |
| Lightweight error budget doc | 🔜 | P2 | Define SLO (availability / latency). |

### 7. Testing & Quality
| Task | Status | Priority | Detail |
|------|--------|----------|--------|
| Add unified-data contract test (backend QA) | 🔜 | P0 | Integrate `validate-unified.ts` into build or CI script. |
| Frontend integration tests (React Query flows) | 🔜 | P1 | Minimal happy path + degraded data scenario. |
| Worker smoke test workflow step (curl endpoints) | 🔜 | P1 | After deploy, run script; gate on success. |
| Synthetic journey simulation script | 🧪 | P2 | Feed mock telemetry for dev / load tests. |

### 8. Documentation & Community
| Task | Status | Priority | Detail |
|------|--------|----------|--------|
| SECURITY.md (threat model lite) | 🔜 | P1 | Outline trust boundaries & mitigations. |
| ARCHITECTURE.md (diagram + flows) | 🔜 | P1 | Sequence: ingestion → cache → API → frontend. |
| CONTRIBUTING.md refinement | 🔜 | P2 | Add branch naming, commit conventions, test expectations. |
| Public API reference (OpenAPI or MD) | 🔜 | P2 | Document available endpoints & response shapes. |

### 9. Stretch / Future Ideas
| Idea | Category | Notes |
|------|----------|-------|
| AI narrative generator (trip journal) | Content | Summarize segments + highlights. |
| Predictive charging stop recommender | Analytics | Use historical efficiency + elevation & weather. |
| Mobile PWA optimization | Frontend | Installability + offline timeline. |
| Multi-vehicle support abstraction | Backend | Parameterize journey id; isolation guardrails. |

### Milestone Aggregation
| Milestone | Target (Tentative) | Goal |
|-----------|-------------------|------|
| M1 Stability | Month 1 | No 500s on core endpoints; CI green baseline. |
| M2 Automation | Month 2 | Full backend deploy pipeline + contract QA gating. |
| M3 Performance | Month 3 | p95 unified-data < 300ms; cache hit rate >70%. |
| M4 Media & UX | Month 4 | Media gallery + code-split improvements. |
| M5 Advanced Analytics | Month 5 | Weather & efficiency predictive insights. |

### Risk Register (Snapshot)
| Risk | Impact | Mitigation |
|------|--------|------------|
| Schema drift (prod vs migration) | Data inconsistency | Formal migrations + schema diff check in CI. |
| Unbounded queries (future aggregations) | Latency / cost | Enforce cached aggregations & TTL guard. |
| Diagnostic endpoints exposed | Security | Remove / auth-gate before major release. |
| Large map bundle initial load | UX performance | Incremental code splitting + skeleton UI. |

### How to Contribute to Roadmap
Open an issue with `[roadmap]` prefix proposing: problem, value, scope, acceptance. Maintainer triages into table above with priority.

---
Last updated: <!-- ROADMAP_LAST_UPDATED -->2025-08-08<!-- /ROADMAP_LAST_UPDATED -->
