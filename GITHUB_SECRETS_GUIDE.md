# GitHub Secrets - Consolidated Secret Management
## A Whittle Wandering Platform

This guide explains how to use **GitHub Secrets** as the **single source of truth** for all API keys and authentication credentials.

---

## 🎯 Overview

**GitHub Secrets** → **Cloudflare Workers Secrets** → **Application**

All secrets are stored in GitHub Actions Secrets and automatically synced to Cloudflare Workers during deployment.

---

## 📍 Where Secrets Are Stored

### Primary Location: GitHub Actions Secrets

**Location:** Repository Settings → Secrets and variables → Actions

**URL Pattern:** `https://github.com/[OWNER]/[REPO]/settings/secrets/actions`

**Secrets Required:**
1. `TESSIE_API_KEY` - Tesla data integration
2. `MAPBOX_ACCESS_TOKEN` - Map services
3. `OPENWEATHER_API_KEY` - Weather data
4. `JWT_SECRET` - Authentication security (32+ chars)
5. `TESLA_VIN` - Vehicle Identification Number
6. `CLOUDFLARE_API_TOKEN` - For syncing secrets to Cloudflare

---

## 🔄 How It Works

### 1. **GitHub Secrets** (Source of Truth)
   - Stored in GitHub repository settings
   - Encrypted and secure
   - Accessible only to GitHub Actions workflows
   - Can have different values per environment

### 2. **GitHub Actions Workflow** (Sync Mechanism)
   - `sync-secrets.yml` - Syncs secrets to Cloudflare Workers
   - Runs automatically on push to main/production
   - Can be triggered manually
   - Validates all secrets are present

### 3. **Cloudflare Workers Secrets** (Runtime Storage)
   - Synced from GitHub Secrets
   - Used by the application at runtime
   - Environment-specific (dev/production)

---

## 🚀 Setup Instructions

### Step 1: Add Secrets to GitHub

1. Go to your repository on GitHub
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add each secret:

```
Name: TESSIE_API_KEY
Value: [your_tessie_api_key]

Name: MAPBOX_ACCESS_TOKEN
Value: pk.[your_mapbox_token]

Name: OPENWEATHER_API_KEY
Value: [your_openweather_key]

Name: JWT_SECRET
Value: [random_32+_character_string]

Name: TESLA_VIN
Value: [your_17_character_vin]

Name: CLOUDFLARE_API_TOKEN
Value: [your_cloudflare_api_token]
```

### Step 2: Configure Cloudflare API Token

1. Go to Cloudflare Dashboard → **My Profile** → **API Tokens**
2. Create a token with:
   - **Permissions:** Account → Cloudflare Workers → Edit
   - **Account Resources:** Include → All accounts
   - **Zone Resources:** Include → All zones
3. Copy the token and add it to GitHub Secrets as `CLOUDFLARE_API_TOKEN`

### Step 3: Run Sync Workflow

**Option A: Automatic (Recommended)**
- Push to `main` or `production` branch
- Workflow runs automatically

**Option B: Manual Trigger**
1. Go to **Actions** tab in GitHub
2. Select **"Sync Secrets to Cloudflare Workers"**
3. Click **"Run workflow"**
4. Select branch and environment

**Option C: Local Script**
```bash
# Install GitHub CLI if needed
brew install gh  # macOS
# or
# https://cli.github.com/

# Authenticate
gh auth login

# Run sync script
chmod +x scripts/sync-secrets-from-github.sh
./scripts/sync-secrets-from-github.sh [development|production]
```

---

## 🔍 Verification

### Check GitHub Secrets
```bash
# Using GitHub CLI
gh secret list

# Or check in GitHub UI:
# Settings → Secrets and variables → Actions
```

### Check Cloudflare Workers Secrets
```bash
cd backend/edge-worker
wrangler secret list
wrangler secret list --env production
```

### Validate Configuration
```bash
# Run validation workflow
gh workflow run validate-secrets.yml

# Or run locally
node config/api-management-system.js audit
```

---

## 📋 Workflow Files

### 1. `sync-secrets.yml`
- **Purpose:** Syncs GitHub Secrets to Cloudflare Workers
- **Triggers:**
  - Push to main/production
  - Manual dispatch
  - Daily at 2 AM UTC (verification)
- **Actions:**
  - Authenticates with Cloudflare
  - Syncs all 5 required secrets
  - Verifies sync success

### 2. `validate-secrets.yml`
- **Purpose:** Validates all secrets are configured
- **Triggers:**
  - Pull requests
  - Manual dispatch
  - Every 6 hours
- **Actions:**
  - Checks GitHub Secrets exist
  - Checks Cloudflare Workers secrets
  - Runs API audit

---

## 🔐 Security Best Practices

### ✅ DO:
- Store all secrets in GitHub Secrets (single source of truth)
- Use environment-specific secrets (dev/production)
- Rotate secrets regularly
- Use strong JWT secrets (32+ characters)
- Limit access to repository secrets
- Use Cloudflare API token with minimal permissions

### ❌ DON'T:
- Commit secrets to code
- Store secrets in `.env` files (commit them)
- Share secrets in chat/email
- Use same secrets for dev and production
- Give unnecessary access to repository

---

## 🌍 Environment Management

### Development Environment
- **GitHub Secret:** Stored in repository secrets
- **Cloudflare:** Synced to default environment
- **Access:** `c.env.SECRET_NAME` in code

### Production Environment
- **GitHub Secret:** Can use same or different values
- **Cloudflare:** Synced to `--env production`
- **Access:** `c.env.SECRET_NAME` in code (same, but different values)

### Setting Environment-Specific Secrets

**Option 1: Different GitHub Secrets**
- `TESSIE_API_KEY_DEV` and `TESSIE_API_KEY_PROD`
- Update workflow to use appropriate secret

**Option 2: GitHub Environments**
- Create "development" and "production" environments
- Add secrets to each environment
- Workflow automatically uses correct environment

---

## 🔄 Workflow Diagram

```
┌─────────────────┐
│  GitHub Secrets │  (Source of Truth)
│  - TESSIE_KEY   │
│  - MAPBOX_TOKEN │
│  - JWT_SECRET   │
└────────┬────────┘
         │
         │ GitHub Actions Workflow
         │ (sync-secrets.yml)
         │
         ▼
┌─────────────────┐
│ Cloudflare      │  (Runtime Storage)
│ Workers Secrets │
│ - TESSIE_KEY    │
│ - MAPBOX_TOKEN  │
│ - JWT_SECRET    │
└────────┬────────┘
         │
         │ Application Runtime
         │ (c.env.SECRET_NAME)
         │
         ▼
┌─────────────────┐
│   Application   │
│   (Backend API) │
└─────────────────┘
```

---

## 🛠️ Troubleshooting

### "Secret not found in GitHub"
- Verify secret exists: `gh secret list`
- Check secret name matches exactly (case-sensitive)
- Ensure you have access to repository secrets

### "Cloudflare authentication failed"
- Verify `CLOUDFLARE_API_TOKEN` is set in GitHub Secrets
- Check token has correct permissions
- Test token: `wrangler whoami`

### "Secret sync failed"
- Check Cloudflare API token permissions
- Verify Wrangler CLI is authenticated
- Check workflow logs for detailed error

### "Secrets not updating"
- Workflow may be cached
- Manually trigger workflow
- Check if secret was actually updated in GitHub

---

## 📝 Migration from Manual Setup

If you already have secrets configured manually:

### Step 1: Export Current Secrets
```bash
# Note: You can't read existing Cloudflare secrets
# You'll need to re-add them to GitHub Secrets
```

### Step 2: Add to GitHub Secrets
- Copy all secret values
- Add them to GitHub Secrets (see Step 1 above)

### Step 3: Run Sync
- Trigger `sync-secrets.yml` workflow
- Or run local sync script

### Step 4: Verify
- Check Cloudflare Workers secrets match
- Test application functionality

---

## 🎯 Benefits of GitHub Secrets

1. **Single Source of Truth** - All secrets in one place
2. **Automatic Sync** - No manual configuration needed
3. **Version Control** - Track when secrets change
4. **Access Control** - GitHub permissions manage access
5. **Environment Management** - Easy dev/prod separation
6. **Audit Trail** - See who accessed secrets
7. **CI/CD Integration** - Works seamlessly with deployments

---

## 📚 Related Files

- `.github/workflows/sync-secrets.yml` - Sync workflow
- `.github/workflows/validate-secrets.yml` - Validation workflow
- `scripts/sync-secrets-from-github.sh` - Local sync script
- `config/api-management-system.js` - Secret validation
- `AUTH_STORAGE_GUIDE.md` - Detailed storage guide

---

## ✅ Checklist

- [ ] All secrets added to GitHub Secrets
- [ ] Cloudflare API token configured
- [ ] Sync workflow runs successfully
- [ ] Validation workflow passes
- [ ] Secrets verified in Cloudflare Workers
- [ ] Application tested with synced secrets
- [ ] Team members have access (if needed)

---

*Last updated: 2025-12-21*
