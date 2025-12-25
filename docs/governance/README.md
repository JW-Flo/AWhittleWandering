# Governance & Supporting Context (Non‑Roadmap)

This directory contains **supporting governance artifacts** used by agents and maintainers (change feed, manifests, resolution spec).

**Canonical product roadmap**: `ROADMAP.md` at the repo root.  
This file is **not** a roadmap and must not redefine stages or acceptance criteria.

## What belongs here

- **Coordination**: multi-agent protocol, context resolution precedence, and manifests.
- **Change feed**: append-only log used for shared state between agents.
- **Cross-repo mapping**: how this repo relates to other repos (if applicable).

## Invariants (do not break)

- Health responses are **additive** (append-only keys; never remove existing keys).
- D1 operations are **parameterized** (no user-input interpolation).
- Heavy aggregates must be **cached** before exposing new analytics endpoints.
- Logging is structured and uses correlation IDs when available.

## Files

- `AGENTS_PROTOCOL.md`: append rules + coordination contract.
- `agent-context-resolution.md`: deterministic precedence + acquisition algorithm.
- `context-index.md`: index of governance artifacts and usage order.
- `live-change-log.ndjson`: append-only feed (monotonic `seq` for new entries).
- `live-change-feed.schema.json`: JSON schema for feed entries.
- `agents-manifest.json`: roles and permissions.
- `multi-repo-manifest.json`: cross-repo mapping (if used).
- `strategic_acquisition_path.md`: stable STRAT handle lifecycle (abstract signals only).









