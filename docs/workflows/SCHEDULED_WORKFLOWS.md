## Scheduled GitHub Actions workflows (inventory)

This repo has scheduled workflows. Keep this list current to prevent “zombie cron” jobs.

### `.github/workflows/1password-sync-github-env-secrets.yml`
- **Schedule**: daily (23:17 UTC)
- **Purpose**: mirror 1Password → GitHub Environment secrets; triggers Cloudflare sync after changes
- **Notes**: uses concurrency + timeout to prevent overruns

### `.github/workflows/sync-secrets.yml`
- **Schedule**: none (manual-only)
- **Purpose**: sync GitHub secrets → Cloudflare Workers (typically triggered by the 1Password sync workflow after updating GitHub secrets)
- **Notes**: intentionally not scheduled to avoid cron noise/redundancy

### `.github/workflows/validate-secrets.yml`
- **Schedule**: none (manual/PR-only)
- **Purpose**: validate required secrets exist in GitHub + Cloudflare
- **Notes**: intentionally not scheduled to avoid cron noise; run manually when debugging or on PRs



