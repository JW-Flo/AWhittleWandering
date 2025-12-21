# 🚀 Quick Sync Instructions

## All Credentials Are in GitHub Secrets ✅

Now you need to **sync them to Cloudflare Workers**.

---

## Step 1: Run GitHub Actions Workflow

1. **Go to:** `https://github.com/[OWNER]/[REPO]/actions`

2. **Find:** "Sync Secrets to Cloudflare Workers" workflow

3. **Click:** "Run workflow" button

4. **Select:** Branch (main for production, or your dev branch)

5. **Click:** "Run workflow" green button

6. **Wait:** ~2-3 minutes for sync to complete

7. **Check:** Workflow logs to verify all secrets synced successfully

---

## Step 2: Verify Sync

After workflow completes, verify secrets are in Cloudflare:

```bash
cd backend/edge-worker
npx wrangler secret list
```

Should show:
- TESSIE_API_KEY
- TESLA_VIN
- MAPBOX_ACCESS_TOKEN
- OPENWEATHER_API_KEY
- JWT_SECRET

---

## Step 3: Test APIs

```bash
# Test backend
curl https://awhittlewandering-api.kd8jc7v8cd.workers.dev/api/v1/health

# Run validation
node validate-api-connections.js
```

---

## ✅ That's It!

Once the workflow completes, all credentials will be synced and APIs will be ready to use.

**Estimated time:** 3-5 minutes
