# Multi-Agent Protocol (Operational Contract)

Purpose  
Provide deterministic coordination for concurrently running AI agents contributing to code + docs.

Core Artifacts

- Live Change Feed: `live-change-log.ndjson` (append-only, monotonic seq).
- Schema: `live-change-feed.schema.json`.
- Roles Manifest: `agents-manifest.json`.

Append Rules

1. Read last line; let last_seq = line.seq (if absent, treat as 0).
2. New entry seq = last_seq + 1.
3. Validate JSON against schema before write.
4. Append single line without trailing comma or edits to previous lines.
5. If push/merge conflict: re-fetch, recompute seq, re-append.

Entry Content Guidelines

- summary ≤ 140 chars, action-oriented.
- details: include rationale + mitigation if breaking=true.
- breaking=true only when external contract consumers must adapt.
- tags include at least one role domain (e.g. analytics, agents, docs).

Invariants Verification (Pre-Append Checklist)

- Health shape unchanged except appended fields.
- DB writes remain parameterized.
- Journey id constant usage preserved (until Stage 2 makes it multi-journey).
- No unbounded scans introduced without cache/batch plan.

Rollback Procedure

- Never delete/rewrite prior seq.
- Add new line type: "fix" referencing prior seq in details.

Automation Recommendations (Future)

- QA script: verify seq strict monotonicity and uniqueness.
- Lint: ensure new entries include required fields + role tag.
- Drift check: flag if >3 entries modify same invariant area within 1 hour.

Minimal Example Entry
{"timestamp":"2025-10-03T12:00:00Z","seq":42,"version":"0.2.1","area":"analytics","type":"feature","summary":"Add cached p95 latency endpoint","details":"Implements /api/v1/latency/p95 with 30s cache; no existing responses changed.","files":["backend/edge-worker/src/index.ts","backend/edge-worker/src/analytics/latency.ts"],"invariantsDelta":["health.append.latencyP95"],"followUp":"Add p99 after storage decision","tags":["analytics"]}

Maintenance Cadence

- Review manifest quarterly.
- Prune nothing; archive only if repo size pressure emerges (rotate to dated directory preserving original).











