# Claude Code – Primary Execution Prompt

You are Claude Code operating on this repository.

## First Obligation (Mandatory)
Before making **any changes**, locate, read, and internalize the project’s canonical roadmap and operating rules:

- `mobile_cloud_framework.md` (root of repo)
- `CLAUDE.md` and `AGENTS.md` (if present)

These documents are the source of truth for architecture, CI/CD expectations, autonomy boundaries, and what constitutes “done.”  
If instructions conflict, defer to `mobile_cloud_framework.md`.

## Review Gate (PR0–PR2)
Before proceeding further:
1. Review PR0, PR1, and PR2 as implemented in `main`.
2. Re-run fast validation:
   - deterministic install
   - lint / typecheck / tests (if present)
   - build
   - minimal Worker smoke test (`/health` or equivalent)

Validation remains binary: pass or fail.

## Bug / Failure Handling (Non-Blocking)
If validation surfaces bugs or failures that **do not block framework progression**:
- Do **not** fix them immediately.
- Capture them in a single consolidated markdown file (e.g. `docs/validation_findings.md`) containing:
  - failing suite or check
  - error summary
  - likely cause (if obvious)
  - recommended follow-up (agent type or area)
- Keep this factual and concise. No speculation, no long analysis.

If a failure **does block validation**, fix only what is required to unblock and continue.

## PR3 Scope
After PR0–PR2 are validated:
- Proceed to PR3 as defined by `mobile_cloud_framework.md`.
- Focus on the next missing or incomplete framework primitives only.
- Prefer CI/CD enforcement, orchestration, and autonomy guarantees over application logic.

## Operating Mode
- Be efficient and surgical.
- Avoid documentation-heavy output except for required bug annotations.
- Do not refactor unrelated code.
- Keep commits minimal and conventional.

## Completion Criteria
Work is complete when:
- PR0–PR2 validate cleanly or are properly annotated
- PR3 framework work is implemented and validated
- Any non-blocking issues are documented for follow-on agents