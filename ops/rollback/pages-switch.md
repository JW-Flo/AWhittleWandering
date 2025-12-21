# Pages Project Switch Rollback

## Overview

If the atlas-it Pages project (new name) fails to deploy or has issues, follow these steps to revert to the previous stable project name (atlasit-platform). The two names differ only by the hyphen; be consistent across wrangler.toml, workflows, and check scripts.

## Rollback Steps

### 1. Update wrangler.toml

Change the project name back to the original:

```toml
name = "atlasit-platform"
compatibility_date = "2023-10-30"
pages_build_output_dir = "dist"

[env.production]
name = "atlasit-platform"
```

### 2. Update GitHub Workflow

Revert the deploy command in `.github/workflows/frontend-pages-deploy.yml`:

```yaml
- name: Deploy to Cloudflare Pages
  env:
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
  working-directory: frontend
  run: wrangler pages deploy dist --project-name=atlasit-platform
```

### 3. Redeploy

Commit the changes and push to trigger a new deployment:

```bash
git add .
git commit -m "Rollback Pages project to atlasit-platform"
git push origin main
```

### 4. Verify

Run the binding check script:

```bash
./ops/checks/pages-binding-check.sh
```

Update the script URL if needed:

```bash
# In pages-binding-check.sh, change:
PROJECT_NAME="atlasit-platform"
HEALTH_URL="https://atlasit-platform.pages.dev/healthz"
GUARD_URL="https://atlasit-platform.pages.dev/guardz"
```

## Prevention

- Always test deployments in a staging environment first
- Keep backups of working wrangler.toml configurations
- Monitor deployment logs for binding errors

## Contact

If rollback fails, contact Cloudflare support or check the dashboard for project settings.
