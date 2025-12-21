# Next Steps - Quick Action Checklist

## 🔴 CRITICAL - Do First (30 minutes)

### 1. Install Dependencies
```bash
# Root workspace
cd /workspace
npm install

# Backend
cd backend/edge-worker
npm install

# Frontend  
cd ../../frontend
npm install

# Shared
cd ../../shared
npm install
```

**Why:** Tests and builds cannot run without dependencies.

---

### 2. Fix Frontend Auth Endpoint
**File:** `frontend/src/pages/Index.tsx`  
**Line:** 92  
**Change:** 
```typescript
// OLD:
const response = await fetch(`${api.baseUrl}/drop`, {

// NEW:
const response = await fetch(`${api.baseUrl}/api/v1/auth`, {
```

**Why:** `/drop` is deprecated, should use `/api/v1/auth`.

---

### 3. Verify Tests Pass
```bash
cd backend/edge-worker
npm test
```

**Expected:** All unit and contract tests pass.

---

## 🟡 HIGH PRIORITY - This Week

### 4. Clean Up Backup Files
Remove or archive:
- `backend/edge-worker/src/index.ts.backup`
- `backend/edge-worker/src/index.old.ts`
- `frontend/src/pages/Index.tsx.backup`
- `frontend/src/pages/Index.tsx.bak`
- `frontend/src/pages/Index.tsx.tmp`

**Why:** Clutters repository, potential confusion.

---

### 5. Consolidate Duplicate Hooks
**Files to review:**
- `frontend/src/hooks/useTeslaData.ts`
- `frontend/src/hooks/useTeslaData.tsx`
- `frontend/src/hooks/useTeslaData.temp.ts`

**Action:** Keep one, remove others, update imports.

---

### 6. Add Input Validation
Add Zod schemas to all API endpoints:
- `POST /api/v1/telemetry` - validate telemetry payload
- `POST /api/v1/admin/*` - validate admin requests
- `GET /api/v1/unified-data` - validate query params

**Why:** Security best practice, prevent invalid data.

---

## 🟢 MEDIUM PRIORITY - Next 2 Weeks

### 7. Improve Rate Limiting
- Implement per-IP tracking
- Add rate limit headers (`X-RateLimit-*`)
- Configure endpoint-specific limits

### 8. Remove AWS SAM Template
**File:** `package.json` lines 59-116  
**Action:** Remove or document why it exists (project uses Cloudflare, not AWS).

### 9. Structured Logging
Replace `console.error`/`console.warn` with structured logging service.

---

## 📋 Verification Commands

After fixes, verify:

```bash
# 1. Dependencies installed
cd /workspace && npm list --depth=0

# 2. Backend builds
cd backend/edge-worker && npm run build

# 3. Tests pass
cd backend/edge-worker && npm test

# 4. Frontend builds
cd frontend && npm run build

# 5. Health check
curl https://awhittlewandering-api.kd8jc7v8cd.workers.dev/api/v1/health
```

---

## 🎯 Success Criteria

- [ ] All dependencies installed
- [ ] All tests pass
- [ ] Frontend uses `/api/v1/auth` (not `/drop`)
- [ ] No backup files in repo
- [ ] Build succeeds for both frontend and backend
- [ ] Health endpoint returns 200

---

**Estimated Time:** 
- Critical fixes: 30-60 minutes
- High priority: 2-4 hours
- Medium priority: 1-2 days
