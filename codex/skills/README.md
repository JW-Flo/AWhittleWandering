## Codex Skills (repo-local)

This folder is intentionally small and practical. Use these as "skills" (repeatable playbooks) when working in CI/PRs.

### Quality gates

These are tools, not mandatory steps for every assignment.

- **codex:lite (default)**: No required gates. Prioritize speed/cost; run targeted checks only when risk warrants (deps/auth/secrets/external APIs).
- **codex:full**: Required gates:
  - `bash scripts/security-scan.sh`
  - `bash scripts/preflight.sh`

### Principles

- Make minimal diffs.
- Don’t add dependencies unless required.
- Never print secrets or tokens.


