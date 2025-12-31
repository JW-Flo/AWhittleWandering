# Governance Context Index

Purpose  
Single entry point to locate **governance + coordination** artifacts (not the product roadmap).

## Canonical roadmap (single source of truth)

- `ROADMAP.md`

## Core governance files

- `README.md` (this directory overview + invariants)
- `AGENTS_PROTOCOL.md` (append-only feed rules)
- `agent-context-resolution.md` (precedence + acquisition algorithm)
- `live-change-log.ndjson` (append-only feed)
- `live-change-feed.schema.json` (feed entry validation)
- `agents-manifest.json` (roles & permissions)
- `multi-repo-manifest.json` (cross-repo mapping)
- `strategic_acquisition_path.md` (STRAT handle lifecycle)

## Usage order (for agents)

1. Read canonical roadmap: `ROADMAP.md`.
2. Load `agents-manifest.json`; confirm acting role.
3. Read tail (≤25) of `live-change-log.ndjson`; capture highest seq.
4. Follow `agent-context-resolution.md` for deterministic precedence.

Maintenance  
Update this index only when adding/removing governance artifacts (rare).











