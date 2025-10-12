# Agent Context Resolution Spec

Goal
Guarantee deterministic shared state for heterogeneous agent frameworks.

Precedence Stack (Highest → Lowest)

1. Invariants (instructions: Invariants + Sections 10–13)
2. Live Change Feed (latest seq)
3. Agents Manifest roles
4. Multi-Repo Manifest (framework support)
5. Repo Wrapper Overrides (if any)

Acquisition Algorithm

1. Fetch instructions hash (sections 0–13).
2. Read last N (≤25) feed lines; capture max seq.
3. If local cached seq < remote seq → invalidate previous assumptions.
4. Load agents-manifest; verify role presence for acting framework.
5. Enforce invariants (fail fast if violation risk flagged).

Write Gate (Before Append)

- Re-fetch feed tail; ensure seq unchanged.
- Validate schema; compute next seq.
- Log (planned) diff summary (future QA hook).
- Append single NDJSON line.

Failure Modes

- Feed unavailable: operate in read-only; mark action as deferred.
- Manifest missing role: abort; escalate via docs-curator entry.

Security & Integrity

- No rewriting historical lines (immutability).
- Sequence collisions resolved by rebase re-append.

Extensibility

- Add new framework: append role + add to supportedFrameworks list + feed entry.
- Schema evolution: additive only (optional fields).
