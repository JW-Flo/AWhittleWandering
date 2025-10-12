# Roadmap & Patentability Context (Working Index)

Purpose
Track forward-looking capability evolution, related technical invariants, and areas with potential patentable novelty without exposing confidential filing detail.

Scope (High-Level Domains)

1. Data Ingestion & Normalization
2. Unified Analytics & Caching Layer
3. Journey-Constrained Telemetry (id: continental-usa-2025)
4. AI Journal / Narrative Generation
5. Geospatial Enrichment (reverse geocoding safety wrappers)
6. Performance & Health Observability
7. Deployment Gating & QA Automation
8. Media & Binary Asset Flow (R2 + edge delivery)
9. Security, Rate Limiting, Auth Token Lifecycle (KV + middleware)
10. Admin / Maintenance & Backfill Jobs

Invariants (Do Not Break)

- Health response: append-only fields; never remove existing keys.
- D1 operations: always parameterized; no user input interpolation.
- Caching: heavy aggregates require short TTL entry in `api_cache`.
- Journey isolation: always filter by constant journey id to prevent cross-leakage.
- Structured logging with correlation id propagation.

Patentability Awareness (Abstract Signals Only)
List conceptual improvements (no confidential specifics):

- Adaptive TTL selection for mixed-frequency aggregates.
- Streaming enrichment pipeline that defers geocode resolution via async retry queue (planned).
- Deterministic narrative synthesis seeded by journey-bounded temporal clustering.

Planned Near-Term (Tactical)

- Add freshness metrics for any upcoming ingestion tables (D1) → extend health `resources` section.
- Introduce aggregated p95/p99 once storage model finalized (defer writes until batching design complete).
- Journal AI improvement: split narrative generation into retrieval + synthesis modules (module files under `src/ai/` when created).

Auth / Identity Note

- OIDC federation intentionally deferred; current focus is deterministic, patent-relevant foundations (Compliance Digital Twin, Orchestration Graph, AI Policy Codex specification layer). Cloudflare Access bootstrap retained only for super-admin until post-foundation stabilization.

Medium-Term (Strategic)

- Introduce configurable component parallel endpoints auto-registering with a manifest.
- Implement R2 object lifecycle policies with size-class logging for cost telemetry.

Risk & Watchlist

- Potential cache stampede on unified aggregates (mitigate with single-writer pattern & fast-path stale serve).
- Geocode latency spikes: consider fallback coarse localization bucket pre-cached.

Change Log (Append New Entries Only)
Template:

- YYYY-MM-DD | Area | Summary | Related Files | Follow-up
Example:
- 2025-10-03 | Docs | Initialized roadmap index + maintenance policy | docs/roadmap/*, .github/copilot-instructions.md | Review quarterly

How To Add A New Capability

1. Create or extend a section above (keep ≤ 8 lines).
2. If code-impacting: add helper module (e.g. `src/analytics/<feature>.ts`).
3. Register endpoint minimally in `src/index.ts`.
4. Add cache (if heavy) using existing `api_cache` pattern.
5. Append health metrics (non-breaking).
6. Log start/end for batch/cron jobs.
7. Add change log entry.

File Taxonomy (Growing)

- This file: index + invariants + change log.
- Future deep dives: `docs/roadmap/{analytics,ai,ingestion,geospatial}.md` (only when needed).

Maintenance Cadence

- Light review each sprint retro.
- Broader validation pre-major deployment (`bun run deploy:major` path).

Meta
Keep this document concise; move verbose rationale into dedicated topic files only when persistent ambiguity emerges.
