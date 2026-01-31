# Cline Hooks — AWhittleWandering

## Pre-change hook
- Validate scope against roadmap rules (privacy, provider-agnostic requirements).
- Identify any secrets or credentials that should remain in env vars.

## Pre-commit hook
- Ensure Zod schemas updated where relevant.
- Update golden tests for adapters if canonical schemas changed.

## Post-change hook
- Summarize verification steps and expected CI checks.
