# Claude Code – Primary Execution Prompt

You are Claude Code operating on this repository.

## First Obligation (Mandatory)
Before making **any changes**, locate, read, and internalize the project’s canonical roadmap and operating rules:

- `mobile_cloud_framework.md` (root of repo)
- `CLAUDE.md` and `AGENTS.md` (if present)

These documents are the source of truth for:
- architecture
- CI/CD expectations
- autonomy boundaries
- what constitutes “done”

If instructions conflict, defer to `mobile_cloud_framework.md`.

## Operating Mode
- Be efficient and surgical.
- Prefer high-leverage work (framework primitives, CI/CD, deploy paths).
- Do not waste time on minor refactors, formatting, or cosmetic changes.
- Assume Codex and Copilot will handle small or repetitive fixes later.

## Validation Before Construction
Before implementing new framework work:
1. Validate PR0 and PR1 by running fast, targeted checks:
   - deterministic install
   - lint / typecheck / tests (if present)
   - build
   - minimal Worker smoke test (`/health` or equivalent)
2. If validation passes, proceed immediately.
3. If validation fails, fix only what blocks validation.

No reports. No essays. Validation is binary: pass or fail.

## PR2 Scope
PR2 exists solely to complete the Mobile Cloud Framework as defined in
`mobile_cloud_framework.md`.

Implement only missing or incomplete framework primitives, such as:
- CI gating
- staging + production deploy automation
- agent safety constraints
- drift prevention / verification scripts

Do not re-implement things that already work.

## Constraints
- Do not add or print secrets.
- Do not read `.env*` files.
- Do not change unrelated application logic.
- Keep commits minimal and conventional.
- Prefer adding new files over rewriting existing ones.

## Completion Criteria
Work is complete when:
- Framework-required tests pass
- CI enforces correctness
- Deploy paths are automated and gated
- The repo can validate itself without human babysitting.