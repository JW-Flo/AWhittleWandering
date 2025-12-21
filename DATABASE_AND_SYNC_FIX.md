# Database & Secret Sync Fix Guide
## Step-by-Step Instructions

---

## 🔧 Part 1: Fix D1 Database Connectivity

### Issue
- D1 database not reachable
- Causes `/api/v1/unified-data` to return 500 error
- Database binding may not be configured correctly

### Solution Steps

#### Step 1: Verify Database Exists in Cloudflare

```bash
cd backend/edge-worker

# List all D1 databases
npx wrangler d1 list
```

**Expected Output:** Should show `tesla-journey-tracker` database

**If database doesn't exist:**
```bash
# Create the database
npx wrangler d1 create tesla-journey-tracker
```

**Note the database ID from the output** - it should match `wrangler.toml`:
```
database_id = "09a6ba85-bd36-4ad3-b5a8-92e230943dcb"
```

#### Step 2: Verify Database Binding

**Check `wrangler.toml`:**
```toml
[[d1_databases]]
binding = "TESLA_DB"
database_name = "tesla-journey-tracker"
database_id = "09a6ba85-bd36-4ad3-b5a8-92e230943dcb"
```

**Verify binding matches code:**
- Code uses: `c.env.TESLA_DB`
- Wrangler binding: `TESLA_DB`
- ✅ Should match

#### Step 3: Apply Database Migrations

```bash
cd backend/edge-worker

# Apply all migrations
npx wrangler d1 migrations apply tesla-journey-tracker

# Or for production
npx wrangler d1 migrations apply tesla-journey-tracker --env production
```

**Migrations to apply:**
- `0001_comprehensive_schema.sql` - Main schema
- `0002_rate_limits.sql` - Rate limiting tables

#### Step 4: Test Database Connection

```bash
# Test query
npx wrangler d1 execute tesla-journey-tracker --command="SELECT 1"

# Check tables exist
npx wrangler d1 execute tesla-journey-tracker --command="SELECT name FROM sqlite_master WHERE type='table'"
```

**Expected:** Should return table names without errors

#### Step 5: Verify in Cloudflare Dashboard

1. Go to: https://dash.cloudflare.com
2. Navigate to: **Workers & Pages** → **D1** → **Databases**
3. Find: `tesla-journey-tracker`
4. Verify:
   - Database exists ✅
   - Tables are created ✅
   - Binding is correct ✅

---

## 🔄 Part 2: Sync Secrets to Cloudflare Workers

### Option A: GitHub Actions Workflow (Recommended)

#### Step 1: Go to GitHub Actions

```
https://github.com/[OWNER]/[REPO]/actions
```

#### Step 2: Find Sync Workflow

- Look for: **"Sync Secrets to Cloudflare Workers"**
- Click on it

#### Step 3: Run Workflow

1. Click **"Run workflow"** button (top right)
2. Select branch: `main` (for production) or your dev branch
3. Click **"Run workflow"** green button

#### Step 4: Monitor Execution

- Watch the workflow run
- Check each step:
  - ✅ Sync TESSIE_API_KEY
  - ✅ Sync TESLA_VIN
  - ✅ Sync MAPBOX_ACCESS_TOKEN
  - ✅ Sync OPENWEATHER_API_KEY
  - ✅ Sync JWT_SECRET

#### Step 5: Verify Success

Workflow should complete with:
- ✅ All secrets synced
- ✅ Verification step passed

---

### Option B: Manual Sync (If GitHub Actions Not Available)

#### Step 1: Authenticate with Cloudflare

```bash
cd backend/edge-worker
npx wrangler login
```

#### Step 2: Get Secrets from GitHub

**Using GitHub CLI:**
```bash
# Get each secret value
gh secret get TESSIE_API_KEY
gh secret get TESLA_VIN
gh secret get MAPBOX_ACCESS_TOKEN
gh secret get OPENWEATHER_API_KEY
gh secret get JWT_SECRET
```

**Or manually:**
- Go to: `https://github.com/[OWNER]/[REPO]/settings/secrets/actions`
- View each secret value (you'll need to add it again to see it)

#### Step 3: Sync Each Secret

```bash
cd backend/edge-worker

# Development environment
echo "your_tessie_key" | npx wrangler secret put TESSIE_API_KEY
echo "your_vin" | npx wrangler secret put TESLA_VIN
echo "pk.your_mapbox_token" | npx wrangler secret put MAPBOX_ACCESS_TOKEN
echo "your_openweather_key" | npx wrangler secret put OPENWEATHER_API_KEY
echo "your_jwt_secret" | npx wrangler secret put JWT_SECRET

# Production environment (add --env production)
echo "your_tessie_key" | npx wrangler secret put TESSIE_API_KEY --env production
echo "your_vin" | npx wrangler secret put TESLA_VIN --env production
echo "pk.your_mapbox_token" | npx wrangler secret put MAPBOX_ACCESS_TOKEN --env production
echo "your_openweather_key" | npx wrangler secret put OPENWEATHER_API_KEY --env production
echo "your_jwt_secret" | npx wrangler secret put JWT_SECRET --env production
```

#### Step 4: Verify Secrets

```bash
# List all secrets
npx wrangler secret list

# Should show:
# - TESSIE_API_KEY
# - TESLA_VIN
# - MAPBOX_ACCESS_TOKEN
# - OPENWEATHER_API_KEY
# - JWT_SECRET
```

---

## ✅ Verification Steps

### 1. Verify Database

```bash
cd backend/edge-worker

# Test database connection
npx wrangler d1 execute tesla-journey-tracker --command="SELECT COUNT(*) FROM sqlite_master WHERE type='table'"

# Should return a number > 0
```

### 2. Verify Secrets

```bash
# List secrets
npx wrangler secret list

# Should show all 5 secrets
```

### 3. Test Backend API

```bash
# Health check
curl https://awhittlewandering-api.kd8jc7v8cd.workers.dev/api/v1/health

# Unified data (should return 200, not 500)
curl https://awhittlewandering-api.kd8jc7v8cd.workers.dev/api/v1/unified-data

# Config
curl https://awhittlewandering-api.kd8jc7v8cd.workers.dev/api/v1/config
```

### 4. Run Full Validation

```bash
cd /workspace
node validate-api-connections.js
node validate-api-functionality.js
```

---

## 🚨 Troubleshooting

### Database Issues

**Problem:** "D1 database not reachable"

**Solutions:**
1. Verify database exists: `npx wrangler d1 list`
2. Check database ID matches wrangler.toml
3. Verify binding name: `TESLA_DB`
4. Apply migrations: `npx wrangler d1 migrations apply tesla-journey-tracker`
5. Check Cloudflare dashboard for database status

**Problem:** "Database binding not found"

**Solutions:**
1. Verify `[[d1_databases]]` section in wrangler.toml
2. Check binding name matches code: `c.env.TESLA_DB`
3. Redeploy worker after fixing binding

### Secret Sync Issues

**Problem:** "Secret not found in Cloudflare"

**Solutions:**
1. Verify secret exists in GitHub Secrets
2. Check GitHub Actions workflow logs
3. Manually sync using wrangler CLI
4. Verify Cloudflare authentication: `npx wrangler whoami`

**Problem:** "Workflow fails to sync"

**Solutions:**
1. Check CLOUDFLARE_API_TOKEN is in GitHub Secrets
2. Verify token has correct permissions
3. Check workflow logs for specific errors
4. Try manual sync as fallback

---

## 📋 Quick Checklist

### Database Fix:
- [ ] Database exists in Cloudflare
- [ ] Database ID matches wrangler.toml
- [ ] Binding name is `TESLA_DB`
- [ ] Migrations applied
- [ ] Database connection test passes

### Secret Sync:
- [ ] All 5 secrets in GitHub Secrets
- [ ] GitHub Actions workflow run
- [ ] All secrets synced to Cloudflare
- [ ] Secrets verified: `npx wrangler secret list`
- [ ] Backend API tested

---

## 🎯 Expected Results

After completing both steps:

1. **Database:**
   - ✅ `/api/v1/unified-data` returns 200 (not 500)
   - ✅ Health endpoint shows database operational
   - ✅ No database warnings

2. **Secrets:**
   - ✅ All 5 secrets in Cloudflare Workers
   - ✅ Backend can access credentials
   - ✅ External APIs work with credentials

3. **Overall:**
   - ✅ All endpoints return 200
   - ✅ No credential errors
   - ✅ Platform fully operational

---

**Run the automated script:** `./fix-database-and-sync.sh`  
**Or follow manual steps above**
