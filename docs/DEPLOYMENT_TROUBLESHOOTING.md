# Deployment Troubleshooting Guide

This guide helps diagnose and fix common deployment issues for AWhittleWandering.

## Post-Deploy Verification Failures

### Symptom
Post-deploy verification fails with:
- ❌ Frontend returning HTTP 000
- ❌ Backend returning HTTP 000  
- ❌ All API routes failing

### Root Causes

#### 1. Deployments Never Succeeded

**Check the deployment logs:**
1. Go to Actions → Deploy Frontend / Deploy Backend
2. Look at the "Deploy" step output
3. The error message will now be visible (after workflow fixes)

**Common deployment errors:**

##### Cloudflare Project/Worker Not Created
```
Error: Project "awhittlewandering" not found
```

**Solution:** Create the Cloudflare Pages project first:
```bash
# For frontend
cd frontend
wrangler pages project create awhittlewandering

# For backend - the worker will be created on first deploy
cd backend/edge-worker
wrangler deploy --env production
```

##### Missing Cloudflare Credentials
```
Error: You need to authenticate with Cloudflare
```

**Solution:** Add GitHub secrets:
1. Go to Repository → Settings → Secrets and variables → Actions
2. Add `CLOUDFLARE_API_TOKEN` (create at https://dash.cloudflare.com/profile/api-tokens)
3. Add `CLOUDFLARE_ACCOUNT_ID` (find in Cloudflare Dashboard → Workers → Overview)

##### Custom Domain Not Configured
The production backend uses `api.awhittlewandering.com`. This requires:

1. **Domain registered and added to Cloudflare**
   - Go to Cloudflare Dashboard → Add a Site
   - Add `awhittlewandering.com`

2. **DNS records configured**
   ```
   # For frontend (Pages)
   awhittlewandering.com     CNAME    awhittlewandering.pages.dev
   
   # For backend (Worker)
   api.awhittlewandering.com CNAME    awhittlewandering-api.workers.dev
   ```

3. **Worker route configured**
   - The route in `backend/edge-worker/wrangler.toml` should match:
   ```toml
   [[env.production.routes]]
   pattern = "api.awhittlewandering.com/*"
   zone_name = "awhittlewandering.com"
   ```

#### 2. Deployment Succeeded But Services Not Responding

**Check Cloudflare Dashboard:**
1. Go to Workers & Pages
2. Verify both `awhittlewandering` (Pages) and `awhittlewandering-api` (Worker) are active
3. Click on each to see their status and logs

**Test manually:**
```bash
# Test frontend
curl -I https://awhittlewandering.com

# Test backend
curl https://api.awhittlewandering.com/api/v1/health
```

**Common issues:**
- **DNS propagation delay:** Wait 5-15 minutes after configuring DNS
- **SSL certificate provisioning:** Cloudflare needs time to provision certificates
- **Worker not deployed to custom domain:** Check that the route is configured correctly

#### 3. Services Running But Health Checks Failing

**Check if the issue is with the verification workflow:**

Run the health checks manually:
```bash
# Frontend
curl -v https://awhittlewandering.com

# Backend
curl -v https://api.awhittlewandering.com/api/v1/health
```

If these work, the issue might be:
- GitHub Actions runner IP being blocked/rate-limited
- Network connectivity issues from Actions runners

## Initial Setup Checklist

Before first deployment, ensure:

- [ ] Cloudflare account created
- [ ] Domain registered and added to Cloudflare
- [ ] DNS records configured (CNAME for both frontend and api subdomain)
- [ ] GitHub secrets configured:
  - [ ] `CLOUDFLARE_API_TOKEN`
  - [ ] `CLOUDFLARE_ACCOUNT_ID`
  - [ ] `TESSIE_API_TOKEN` (backend)
  - [ ] `MAPBOX_API_TOKEN` (backend)
  - [ ] `OPENWEATHER_API_KEY` (backend)
  - [ ] `JWT_SECRET` (backend)
  - [ ] `TESLA_VIN` (backend)
- [ ] Cloudflare Pages project created (`awhittlewandering`)
- [ ] Cloudflare Worker deployed at least once manually to create the worker

## Manual Deployment for Initial Setup

If automated deployments are failing, try deploying manually first:

### Frontend
```bash
cd frontend
npm install
npm run build

# Authenticate with Cloudflare
wrangler login

# Deploy
wrangler pages deploy dist --project-name=awhittlewandering --branch=main
```

### Backend
```bash
cd backend/edge-worker
npm install
npm run build

# Authenticate with Cloudflare
wrangler login

# Set secrets
echo "your-tessie-token" | wrangler secret put TESSIE_API_TOKEN --env production
echo "your-mapbox-token" | wrangler secret put MAPBOX_API_TOKEN --env production
echo "your-weather-key" | wrangler secret put OPENWEATHER_API_KEY --env production
echo "your-jwt-secret" | wrangler secret put JWT_SECRET --env production
echo "your-tesla-vin" | wrangler secret put TESLA_VIN --env production

# Deploy
wrangler deploy --env production
```

After manual deployment succeeds, GitHub Actions should work for subsequent deployments.

## Getting Help

If you're still stuck:

1. **Check deployment logs:** Actions → Workflow runs → Click on failed run
2. **Check Cloudflare logs:** Dashboard → Workers → awhittlewandering-api → Logs
3. **Create an issue** with:
   - Full deployment log output
   - Error messages from Cloudflare dashboard
   - Results of manual curl tests
   - Whether manual deployment works

## Recent Fixes

### 2026-01-31: Error Output Now Visible
Before this fix, deployment errors were silently captured and not displayed. Now when a deployment fails, you'll see the actual error message in the workflow logs, making it much easier to diagnose the issue.
