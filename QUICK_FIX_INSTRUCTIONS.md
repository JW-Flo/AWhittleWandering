# Quick Fix Instructions
## Database & Secret Sync - Step by Step

---

## ✅ Part 1: Fix D1 Database (5 minutes)

### Step 1: Remove Deprecated Config
**Status:** ✅ **FIXED** - Removed `experimental_remote` from wrangler.toml

### Step 2: Verify Database in Cloudflare Dashboard

1. Go to: https://dash.cloudflare.com
2. Navigate to: **Workers & Pages** → **D1** → **Databases**
3. Look for: `tesla-journey-tracker`
4. **If database exists:**
   - ✅ Note the Database ID
   - ✅ Verify it matches: `09a6ba85-bd36-4ad3-b5a8-92e230943dcb`
   - ✅ Check tables are created

5. **If database doesn't exist:**
   ```bash
   cd backend/edge-worker
   npx wrangler login
   npx wrangler d1 create tesla-journey-tracker
   ```
   - Copy the new database ID
   - Update `wrangler.toml` with the new ID

### Step 3: Apply Migrations

```bash
cd backend/edge-worker

# Apply migrations
npx wrangler d1 migrations apply tesla-journey-tracker

# Verify tables created
npx wrangler d1 execute tesla-journey-tracker --command="SELECT name FROM sqlite_master WHERE type='table'"
```

**Expected:** Should list tables like `vehicles`, `journeys`, `telemetry_data`, etc.

### Step 4: Test Database Connection

```bash
# Simple test
npx wrangler d1 execute tesla-journey-tracker --command="SELECT 1"

# Check table count
npx wrangler d1 execute tesla-journey-tracker --command="SELECT COUNT(*) as table_count FROM sqlite_master WHERE type='table'"
```

**Expected:** Should return `1` and a table count > 0

---

## ✅ Part 2: Sync Secrets to Cloudflare (2 minutes)

### Option A: GitHub Actions (Recommended - Automated)

#### Method 1: Via GitHub Web UI

1. **Go to GitHub Actions:**
   ```
   https://github.com/[YOUR-OWNER]/[YOUR-REPO]/actions
   ```

2. **Find workflow:**
   - Look for: **"Sync Secrets to Cloudflare Workers"**
   - Click on it

3. **Run workflow:**
   - Click **"Run workflow"** button (top right)
   - Select branch: `main` (or your production branch)
   - Click **"Run workflow"** green button

4. **Monitor:**
   - Watch the workflow execute
   - All steps should show ✅
   - Check for any errors

#### Method 2: Via Script (If GitHub CLI Available)

```bash
cd /workspace
./trigger-sync-workflow.sh
```

This will:
- ✅ Check GitHub CLI authentication
- ✅ Trigger the workflow automatically
- ✅ Show you the run status

---

### Option B: Manual Sync (If GitHub Actions Not Available)

#### Prerequisites:
- Cloudflare authenticated: `npx wrangler login`
- GitHub Secrets accessible

#### Steps:

```bash
cd backend/edge-worker

# Get secrets from GitHub (if using gh CLI)
TESSIE_KEY=$(gh secret get TESSIE_API_KEY)
VIN=$(gh secret get TESLA_VIN)
MAPBOX=$(gh secret get MAPBOX_ACCESS_TOKEN)
WEATHER=$(gh secret get OPENWEATHER_API_KEY)
JWT=$(gh secret get JWT_SECRET)

# Sync each secret
echo "$TESSIE_KEY" | npx wrangler secret put TESSIE_API_KEY
echo "$VIN" | npx wrangler secret put TESLA_VIN
echo "$MAPBOX" | npx wrangler secret put MAPBOX_ACCESS_TOKEN
echo "$WEATHER" | npx wrangler secret put OPENWEATHER_API_KEY
echo "$JWT" | npx wrangler secret put JWT_SECRET

# Verify
npx wrangler secret list
```

**Expected:** Should show all 5 secrets listed

---

## ✅ Part 3: Verify Everything Works

### 1. Test Database Connection

```bash
cd backend/edge-worker
npx wrangler d1 execute tesla-journey-tracker --command="SELECT COUNT(*) FROM vehicles"
```

**Expected:** Returns a number (even if 0)

### 2. Test Backend API

```bash
# Health check
curl https://awhittlewandering-api.kd8jc7v8cd.workers.dev/api/v1/health

# Unified data (should return 200, not 500)
curl https://awhittlewandering-api.kd8jc7v8cd.workers.dev/api/v1/unified-data

# Config (should show credentials available)
curl https://awhittlewandering-api.kd8jc7v8cd.workers.dev/api/v1/config
```

**Expected:**
- `/health` → 200 OK
- `/unified-data` → 200 OK (not 500)
- `/config` → 200 OK with credentials listed

### 3. Run Full Validation

```bash
cd /workspace
node validate-api-connections.js
```

**Expected:** All checks should pass ✅

---

## 🚨 Troubleshooting

### Database Issues

**Problem:** "Database not found"
- **Solution:** Create it: `npx wrangler d1 create tesla-journey-tracker`
- Update `wrangler.toml` with new database ID

**Problem:** "Database binding not found"
- **Solution:** Verify `[[d1_databases]]` section in `wrangler.toml`
- Check binding name: `TESLA_DB`
- Redeploy worker after fixing

**Problem:** "Migrations fail"
- **Solution:** Check migration files exist in `migrations/` directory
- Verify SQL syntax is correct
- Try applying one migration at a time

### Secret Sync Issues

**Problem:** "Workflow fails"
- **Solution:** 
  1. Check `CLOUDFLARE_API_TOKEN` is in GitHub Secrets
  2. Verify token has correct permissions
  3. Check workflow logs for specific errors

**Problem:** "Secret not found in Cloudflare"
- **Solution:**
  1. Verify secret exists in GitHub Secrets
  2. Manually sync using wrangler CLI
  3. Check Cloudflare authentication

**Problem:** "GitHub CLI not authenticated"
- **Solution:** Run `gh auth login`
- Or use GitHub Web UI instead

---

## 📋 Quick Checklist

### Database:
- [ ] `experimental_remote` removed from wrangler.toml ✅
- [ ] Database exists in Cloudflare
- [ ] Database ID matches wrangler.toml
- [ ] Migrations applied
- [ ] Database connection test passes
- [ ] `/api/v1/unified-data` returns 200 (not 500)

### Secrets:
- [ ] All 5 secrets in GitHub Secrets
- [ ] GitHub Actions workflow run
- [ ] All secrets synced to Cloudflare
- [ ] Secrets verified: `npx wrangler secret list`
- [ ] Backend API shows credentials available

---

## 🎯 Expected Final State

After completing both parts:

1. **Database:**
   - ✅ D1 database accessible
   - ✅ Tables created
   - ✅ `/api/v1/unified-data` returns 200

2. **Secrets:**
   - ✅ All 5 secrets in Cloudflare Workers
   - ✅ Backend can access credentials
   - ✅ External APIs work

3. **Overall:**
   - ✅ All endpoints return 200
   - ✅ No database errors
   - ✅ No credential errors
   - ✅ Platform fully operational

---

**Next Steps:**
1. Run GitHub Actions workflow for secrets
2. Verify database in Cloudflare dashboard
3. Apply migrations
4. Test endpoints

**Time Estimate:** 5-10 minutes total
