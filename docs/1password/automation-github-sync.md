## 1Password → GitHub Environment secrets (automated sync)

This repo supports a fully automated sync (Option C):
- 1Password is the **source of truth**
- GitHub Environment secrets are a **mirror** for workflows
- Cloudflare secrets are updated by the existing `sync-secrets.yml` workflow

### How it works
- GitHub Actions workflow: `.github/workflows/1password-sync-github-env-secrets.yml`
  - runs daily (polling) and on manual dispatch
  - reads the `AWW` vault items `dev` and `prod` (fields become secret names)
  - writes those values into GitHub Environment secrets (`development` / `production`)
  - triggers the Cloudflare sync workflow (`sync-secrets.yml`) after applying changes, passing `target={development|production}`

### Required 1Password structure
Create a dedicated vault named `AWW` with:
- item `dev` containing fields like `TESSIE_API_KEY`, `MAPBOX_API_TOKEN`, etc.
- item `prod` containing production versions of the same fields

Field labels become GitHub secret names (only labels matching `^[A-Z][A-Z0-9_]{1,127}$`).

### Required GitHub setup (one-time)
1. Create GitHub environments:
   - `development`
   - `production`
2. Add `OP_SERVICE_ACCOUNT_TOKEN` as an environment secret in BOTH environments.
   - This is the only secret GitHub must hold to read from 1Password.
   - Recommended: store it as a **repository secret** (single copy) to avoid environment duplication.
3. Create a GitHub App installed on this repo with permissions to:
   - write environment secrets
   - trigger workflows
4. Store the GitHub App credentials in 1Password:
   - `op://AWW/automation/1PASS_SYNC_APP_ID`
   - `op://AWW/automation/1PASS_SYNC_PRIVATE_KEY`

### Config
See `ops/secrets/github-sync-config.json`.
- Denylist prevents syncing high-value automation credentials.
- A “last synced” timestamp is stored as a **repo-level Actions variable** (`AWW_1P_LAST_SYNCED_ITEM_UPDATED_AT_<ENV>`) to avoid unnecessary writes.



