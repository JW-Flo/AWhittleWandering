# DevSecOps Super Agent (VS Code + GPT‑5)

## Quick Start
1. Copy this folder’s files into your repo (or merge as needed).
2. In VS Code, ensure Copilot Agent loads `prompt_files.md`.
3. Use the **DevSecOps Super Agent** toolset and rely on **auto‑mode** selection.
4. Run tasks via `Terminal → Run Task`:
   - Lint & Test (Python/Node)
   - Security Scan
   - Terraform Validate & Plan
   - Build & Deploy Cloudflare Worker

## CI/CD
- `.github/workflows/ci.yml`: build, tests, scans on PR/push.
- `.github/workflows/deploy.yml`: wrangler deploy + Terraform apply (uses secrets).

## Secrets
- `CF_ACCOUNT_ID`, `CF_API_TOKEN` in GitHub Secrets for Workers deploy.
- Terraform uses `cloudflare_api_token` var; never commit secrets.

## Infra
- `infra/terraform`: Cloudflare provider and KV example. Expand with Workers/D1/KV/R2 as needed.

## Security
- Semgrep, Bandit, Trivy wired via script and CI. SonarQube optional.
- Block deploy on critical findings; use PR to discuss residual risk.

## Modes
- See `modes.jsonc`. The agent infers & runs the right mode automatically per request.

## Notes
- This is a scaffold: safe defaults, pinned actions, and audit‑friendly flows.
- Extend tests, scanners, and Terraform modules per project.
