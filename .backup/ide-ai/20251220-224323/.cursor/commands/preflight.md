Run deterministic checks before/after changes:
1) Detect package manager.
2) Install deps deterministically.
3) Run format check (if present), lint, typecheck, tests.
4) Report failures + fix with minimal diff.
Always include exact commands and expected outputs.
