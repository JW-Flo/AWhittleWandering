# File Normalization Rules

Patterns

- /^README.*\\.md$/ → root or docs/ (if ancillary → docs/notes/).
- /^.*\\.sql$/ → backend/edge-worker/src/sql/ (if migration → backend/edge-worker/src/migrations/).
- /^.*schema\\.(ts|json)$/ → shared/schemas/.
- /^.*\\.(png|jpg|jpeg|gif|svg)$/ → frontend/public/assets/ or R2 ingestion path (not versioned if large).
- /^.*test\\.(ts|tsx)$/ → colocated with source OR tests/<mirror-path>/.

Directives

- Never commit build artifacts (dist/, .wrangler/, node_modules/).
- Large binary >5MB → store externally (R2) and reference.
- Experimental scratch files → docs/adr/scratch/ (auto-pruned monthly).

Extension

- Add new pattern + rationale; do not edit existing lines (append-only).
