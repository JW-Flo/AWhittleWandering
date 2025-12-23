## Codex Skills (repo-local)

This folder is intentionally small and practical. Use these as "skills" (repeatable playbooks) when working in CI/PRs.

### Quality gates

- Run: `bash scripts/security-scan.sh`
- Run: `bash scripts/preflight.sh`

### Principles

- Make minimal diffs.
- Don’t add dependencies unless required.
- Never print secrets or tokens.


