# Sync Secrets from GitHub to Cloudflare Workers
## Quick Guide

**Status:** 4 of 6 credentials configured in GitHub Secrets ✅

---

## ✅ Credentials Already in GitHub Secrets

1. ✅ **TESSIE_API_KEY**
2. ✅ **MAPBOX_ACCESS_TOKEN**
3. ✅ **OPENWEATHER_API_KEY**
4. ✅ **CLOUDFLARE_API_TOKEN**

---

## ❌ Still Missing in GitHub Secrets

1. ❌ **TESLA_VIN** - **CRITICAL - ADD THIS**
2. ❌ **JWT_SECRET** - **CRITICAL - ADD THIS**

---

## 🔄 How to Sync Secrets to Cloudflare Workers

### Option 1: GitHub Actions Workflow (Recommended)

1. **Go to GitHub Actions:**
   - Navigate to: `https://github.com/[OWNER]/[REPO]/actions`
   - Find workflow: **"Sync Secrets to Cloudflare Workers"**

2. **Run the workflow:**
   - Click "Run workflow"
   - Select branch: `main` (for production) or your dev branch
   - Click "Run workflow"

3. **Monitor the run:**
   - The workflow will sync all configured secrets
   - It will skip TESLA_VIN and JWT_SECRET if not set (with warnings)

### Option 2: Manual Sync (Local)

```bash
cd backend/edge-worker

# Sync TESSIE_API_KEY
echo "your_tessie_key" | npx wrangler secret put TESSIE_API_KEY

# Sync MAPBOX_ACCESS_TOKEN
echo "pk.your_mapbox_token" | npx wrangler secret put MAPBOX_ACCESS_TOKEN

# Sync OPENWEATHER_API_KEY
echo "your_openweather_key" | npx wrangler secret put OPENWEATHER_API_KEY

# Sync JWT_SECRET (if you have it)
echo "your_jwt_secret" | npx wrangler secret put JWT_SECRET

# Sync TESLA_VIN (if you have it)
echo "your_vin" | npx wrangler secret put TESLA_VIN

# For production, add --env production to each command
```

### Option 3: Using GitHub CLI (If Authenticated)

```bash
# Get secret from GitHub and sync to Cloudflare
cd backend/edge-worker

gh secret get TESSIE_API_KEY | npx wrangler secret put TESSIE_API_KEY
gh secret get MAPBOX_ACCESS_TOKEN | npx wrangler secret put MAPBOX_ACCESS_TOKEN
gh secret get OPENWEATHER_API_KEY | npx wrangler secret put OPENWEATHER_API_KEY
gh secret get CLOUDFLARE_API_TOKEN | npx wrangler secret put CLOUDFLARE_API_TOKEN
```

---

## 🚨 Critical: Add Missing Credentials

Before syncing, **add these 2 missing credentials to GitHub Secrets:**

### 1. TESLA_VIN

**Go to:** `https://github.com/[OWNER]/[REPO]/settings/secrets/actions`

- Click "New repository secret"
- Name: `TESLA_VIN`
- Value: Your 17-character Tesla VIN (e.g., `5YJ3E1EA5LF027324`)
- Click "Add secret"

**Why it's critical:** Backend uses this to identify which vehicle to fetch data for.

### 2. JWT_SECRET

**Generate a secure secret:**
```bash
# Option 1: Using OpenSSL
openssl rand -hex 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 3: Using Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

**Add to GitHub Secrets:**
- Name: `JWT_SECRET`
- Value: The generated 64-character hex string
- Click "Add secret"

**Why it's critical:** Used for admin authentication security.

---

## ✅ Verification Steps

After syncing, verify:

```bash
cd backend/edge-worker

# Check secrets are configured
npx wrangler secret list

# Should show:
# - TESSIE_API_KEY
# - MAPBOX_ACCESS_TOKEN
# - OPENWEATHER_API_KEY
# - JWT_SECRET (if added)
# - TESLA_VIN (if added)

# Test backend API
curl https://awhittlewandering-api.kd8jc7v8cd.workers.dev/api/v1/health

# Run validation
node ../../validate-api-functionality.js
```

---

## 📋 Current Status

| Credential | GitHub | Cloudflare | Status |
|------------|--------|------------|--------|
| TESSIE_API_KEY | ✅ | ⏳ Pending Sync | Ready to sync |
| MAPBOX_ACCESS_TOKEN | ✅ | ⏳ Pending Sync | Ready to sync |
| OPENWEATHER_API_KEY | ✅ | ⏳ Pending Sync | Ready to sync |
| CLOUDFLARE_API_TOKEN | ✅ | ⏳ Pending Sync | Ready to sync |
| TESLA_VIN | ❌ | ❌ | **ADD TO GITHUB FIRST** |
| JWT_SECRET | ❌ | ❌ | **ADD TO GITHUB FIRST** |

---

## 🎯 Action Plan

### Immediate (Now):
1. ✅ **Add TESLA_VIN to GitHub Secrets**
2. ✅ **Add JWT_SECRET to GitHub Secrets**
3. ✅ **Run sync-secrets workflow** (or sync manually)

### After Sync:
1. Verify secrets in Cloudflare: `npx wrangler secret list`
2. Test API endpoints
3. Deploy backend if needed

---

## 🔧 Quick Commands Reference

### Generate JWT_SECRET
```bash
openssl rand -hex 32
```

### Sync All Secrets (Manual)
```bash
cd backend/edge-worker

# Get values from GitHub (requires gh CLI auth)
gh secret get TESSIE_API_KEY | npx wrangler secret put TESSIE_API_KEY
gh secret get MAPBOX_ACCESS_TOKEN | npx wrangler secret put MAPBOX_ACCESS_TOKEN
gh secret get OPENWEATHER_API_KEY | npx wrangler secret put OPENWEATHER_API_KEY
gh secret get TESLA_VIN | npx wrangler secret put TESLA_VIN
gh secret get JWT_SECRET | npx wrangler secret put JWT_SECRET
```

### Verify Configuration
```bash
cd backend/edge-worker
npx wrangler secret list
```

---

**Next Step:** Add TESLA_VIN and JWT_SECRET to GitHub Secrets, then run the sync workflow!
