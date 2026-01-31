# Cline Workflows — AWhittleWandering

## Autonomous workflow summary
1. **Understand task + scope**
2. **Inspect relevant files**
3. **Implement minimal changes**
4. **Update tests/fixtures**
5. **Run checks (lint/typecheck/tests if available)**
6. **Summarize changes + verification**

## CI/CD alignment
- Use `.github/workflows/ci-preflight.yml` and `.github/workflows/ci-swarm.yml` as gates.
- For schema changes, update contract/golden fixtures.
- For migrations, ensure idempotency check passes.

## Deployment rules
- Never run production deploy locally.
- Use GitHub Actions workflows for deploys.
