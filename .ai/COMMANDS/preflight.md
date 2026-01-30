---
name: Preflight Checks
description: "Run deterministic checks before and after applying changes."
---

**Preflight Steps:**

1. Detect the package manager in use (npm, pnpm, or yarn) and install
   dependencies deterministically (use lockfiles).
2. Run formatting checks (if any) – e.g. `npm run format:check` – and code
   linters.
3. Run the full type-checking (e.g. `npm run typecheck`) and test suite (e.g.
   `npm test`).
4. Report any failures (lint, types, or tests) and attempt to fix them with
   minimal changes.

Always provide the exact commands run and highlight any errors encountered.
After fixes, re-run the checks to ensure all pass.
