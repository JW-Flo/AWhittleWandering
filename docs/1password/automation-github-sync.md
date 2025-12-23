## 1Password → GitHub Environment secrets (automated sync)

This repo supports a fully automated sync (Option C):
- 1Password is the **source of truth**
- GitHub **repo secrets** are a **mirror** for workflows
- Cloudflare secrets are updated by the existing `sync-secrets.yml` workflow

### How it works
- GitHub Actions workflow: `.github/workflows/1password-sync-github-env-secrets.yml`
  - runs daily (polling) and on manual dispatch
  - reads the `AWW` vault item `prod` by default (fields become secret names)
  - writes those values into GitHub **repo secrets**
  - triggers the Cloudflare sync workflow (`sync-secrets.yml`) after applying changes, passing `target={development|production}`
  - workflow dispatch uses REST with an explicit ref (defaults to `main`)

### Required 1Password structure
Create a dedicated vault named `AWW` with:
 - item `prod` containing fields like `TESSIE_API_TOKEN`, `MAPBOX_API_TOKEN`, etc.

Field labels become GitHub secret names (only labels matching `^[A-Z][A-Z0-9_]{1,127}$`).

### Required GitHub setup (one-time)
1. Create GitHub environments:
   - `development`
   - `production`
2. Add `OP_SERVICE_ACCOUNT_TOKEN` as a **repository secret**.
   - This is the only secret GitHub must hold to read from 1Password.
3. Create a GitHub App installed on this repo with permissions to:
   - write environment secrets
   - trigger workflows
4. Store the GitHub App credentials in 1Password:
   - `op://AWW/automation/1PASS_SYNC_APP_ID`
   - `op://AWW/automation/1PASS_SYNC_PRIVATE_KEY`

### Config
See `ops/secrets/github-sync-config.json`.
- Denylist prevents syncing high-value automation credentials.
- Note: we intentionally do **not** store a “last synced” marker in GitHub Actions Variables because GitHub App tokens may not have access to that API. This workflow runs daily and re-applies secrets idempotently.



