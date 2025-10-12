# Restructure Plan (AWhittleWandering)

Objective
Eliminate unclassified top-level files; enforce predictable placement.

Phases

1. Inventory (script) → list non-compliant paths.
2. Classify → map to rule set (see file-normalization-rules.md).
3. Stage moves in PR (no inline git moves by automated agents without review).
4. Update imports / build scripts.
5. Append change feed entry (type: refactor).

Planned Adjustments

- Root stray Markdown → docs/ or docs/notes/.
- Any analytics logic under backend/edge-worker/src/analytics/.
- Shared types → shared/src/types/ (create subfolders by domain).
- One-off QA scripts → qa/scripts/ (index from main orchestrator).

Guardrails

- No deletion; moves only.
- Validate builds after each phase.
- Keep diff atomic per domain (avoid multi-domain large PR).

Next Actions

- Implement inventory script (qa/) to emit JSON report for phase 1.
