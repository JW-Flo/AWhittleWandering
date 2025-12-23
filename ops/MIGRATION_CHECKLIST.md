# Migration Checklist: atlas-it → awhittlewandering

This checklist covers migrating the frontend deployment from the `atlas-it` Cloudflare Pages project to `awhittlewandering`.

## Pre-Migration Status

- **Current state**: Frontend deployed to `atlas-it` Pages project
- **Target state**: Frontend deployed to `awhittlewandering` Pages project
- **Reason**: Free up `atlas-it` for the actual AtlasIT platform

## ✅ Code Changes (COMPLETED)

These changes have been made in this branch:

- [x] `frontend/wrangler.toml` → project name changed to `awhittlewandering`
- [x] `.github/workflows/frontend-pages-deploy.yml` → deploy target updated
- [x] `package.json` → deploy scripts updated
- [x] `qa/continuous-deployment-qa.sh` → deploy target updated
- [x] `docs/CF_PAGES_ENV.md` → references updated
- [x] `docs/DEPLOY_PAGES.md` → rewritten
- [x] `ops/checks/pages-binding-check.sh` → default project updated
- [x] `ops/rollback/pages-switch.md` → rewritten
- [x] Removed AtlasIT cross-project references from README, CONTEXT, ROADMAP
- [x] Deleted obsolete AtlasIT docs

## 🔲 Cloudflare Setup (MANUAL - Required Before Merge)

### Step 1: Create the new Pages project

```bash
wrangler pages project create awhittlewandering
```

Or via Cloudflare Dashboard:
1. Go to Workers & Pages → Create → Pages
2. Connect to Git (optional) or create empty project
3. Name: `awhittlewandering`

### Step 2: Copy secrets from atlas-it to awhittlewandering

If you have secrets set on the old project, copy them:

```bash
# List current secrets on atlas-it (for reference)
wrangler pages secret list --project-name atlas-it

# Set secrets on new project
wrangler secret put TESSIE_API_KEY --project-name awhittlewandering
wrangler secret put MAPBOX_ACCESS_TOKEN --project-name awhittlewandering
wrangler secret put JWT_SECRET --project-name awhittlewandering
# Add any others as needed
```

### Step 3: Initial deployment test

```bash
cd frontend
bun install
bun run build
wrangler pages deploy dist --project-name=awhittlewandering
```

Verify at: `https://awhittlewandering.pages.dev`

### Step 4: Move custom domain

**Option A: Via Dashboard (Recommended)**
1. Cloudflare Dashboard → Pages → `atlas-it`
2. Custom domains → Remove `awhittlewandering.com`
3. Cloudflare Dashboard → Pages → `awhittlewandering`
4. Custom domains → Add `awhittlewandering.com`

**Option B: DNS Swap**
If the domain is managed separately, update the CNAME:
```
awhittlewandering.com → awhittlewandering.pages.dev
```

### Step 5: Verify production

```bash
curl -I https://awhittlewandering.com
curl -I https://awhittlewandering.pages.dev
```

Both should return 200.

## 🔲 Post-Migration Cleanup (Optional)

After confirming everything works:

### Clean up old atlas-it project

If `atlas-it` will be reused for actual AtlasIT platform:
- Remove old deployments
- Remove old secrets
- Update project settings as needed

If `atlas-it` should be deleted entirely:
```bash
# Via dashboard: Workers & Pages → atlas-it → Settings → Delete project
```

## Required GitHub Secrets

Ensure these are set in GitHub → Settings → Secrets:

| Secret | Description | Status |
|--------|-------------|--------|
| `Cloudflare_Account_ID` | Cloudflare account ID | Required |
| `Cloudflare_API_token` | API token with Pages/Workers edit | Required |
| `TESSIE_API_KEY` | Tessie API key | Required |
| `MAPBOX_API_TOKEN` | Mapbox access token | Required |
| `OPENWEATHER_API_KEY` | OpenWeather API key | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `TESLA_VIN` | Tesla VIN | Required |

## Rollback Plan

If migration fails:

1. Revert this branch's changes
2. Keep using `atlas-it` project
3. Move custom domain back to `atlas-it` if moved

## Timeline

1. **Merge this branch** → Code ready but deploys will fail until Cloudflare setup
2. **Create `awhittlewandering` project** → ~5 minutes
3. **Copy secrets** → ~5 minutes
4. **Test deployment** → ~5 minutes
5. **Move custom domain** → ~5-15 minutes (DNS propagation)
6. **Verify** → ~5 minutes

**Total estimated time: 30 minutes**

## Questions?

If anything is unclear, check:
- `DEPLOYMENT.md` — Full architecture overview
- `docs/DEPLOY_PAGES.md` — Frontend-specific deployment
- `docs/CF_PAGES_ENV.md` — Environment variables reference
