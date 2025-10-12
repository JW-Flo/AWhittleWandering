# Roadmap Context Index (Canonical)

Core Files

- README.md (roadmap index + invariants)
- AGENTS_PROTOCOL.md (operational append rules)
- agent-context-resolution.md (precedence + acquisition algorithm)
- live-change-log.ndjson (append-only feed)
- live-change-feed.schema.json (feed entry validation)
- agents-manifest.json (roles & permissions)
- multi-repo-manifest.json (cross-repo mapping)
- strategic_acquisition_path.md (STRAT handle lifecycle)

Supplementary

- ../restructure/REPO_RESTRUCTURE_PLAN.md
- ../restructure/file-normalization-rules.md

Usage Order (For Agents)

1. Hash Sections 0–13 of canonical instructions (drift detection).
2. Read tail (≤25) of live-change-log.ndjson; capture highest seq.
3. Load agents-manifest.json; confirm acting role.
4. Load multi-repo-manifest.json; map repo purpose.
5. Reference strategic_acquisition_path.md if citing STRAT handles.

Change Feed Inclusion Criteria

- Add entry when introducing new file above or modifying semantics.
- File additions must include at least one domain tag and one governance/strategy tag if applicable.

Maintenance

- Update this index only when adding/removing canonical roadmap doc files (rare). Append feed entry referencing this file when changed.
