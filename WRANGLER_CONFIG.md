# Wrangler Configuration

This repository uses separate wrangler configurations for different deployment targets:

## Configuration Files

- **backend/edge-worker/wrangler.toml**: Cloudflare Workers configuration for the backend API
  - Worker name: `awhittlewandering-api`
  - Custom domain: `api.awhittlewandering.com`
  - Deployed via: `.github/workflows/deploy-backend.yml`

- **frontend/wrangler.toml**: Cloudflare Pages configuration for the frontend
  - Project name: `awhittlewandering`
  - Custom domain: `awhittlewandering.com`
  - Deployed via: `.github/workflows/deploy-frontend.yml`

## Why No Root wrangler.toml?

The root `wrangler.toml` was removed to prevent Cloudflare Workers Build from attempting automatic deployments that conflict with our GitHub Actions-based deployment workflows.

### Previous Issue

The root `wrangler.toml` had a Workers + Assets configuration that caused deployment errors:
- Cloudflare Workers Build would auto-deploy using the root config
- The `_redirects` file caused infinite loop errors in Workers + Assets context
- Worker name mismatch between config and expected deployment target

### Solution

All deployments are now handled exclusively through GitHub Actions workflows:
- Frontend deployments use `deploy-frontend.yml` with `frontend/wrangler.toml`
- Backend deployments use `deploy-backend.yml` with `backend/edge-worker/wrangler.toml`
- No automatic Cloudflare Workers Build deployments

## Manual Deployments

If you need to deploy manually:

```bash
# Frontend (from repo root)
cd frontend
npx wrangler pages deploy dist --project-name=awhittlewandering

# Backend (from repo root)
cd backend/edge-worker
npx wrangler deploy --env production
```
