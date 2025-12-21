# Security Incident: Exposed Credentials in Git History

## Issue Summary
**Date Identified:** 2025-12-21  
**Severity:** CRITICAL  
**Status:** REQUIRES IMMEDIATE ACTION

Real credentials were committed to git history in `backend/edge-worker/.dev.vars` and remain accessible in the repository history even though the file has been deleted and added to `.gitignore`.

## Exposed Credentials

The following **REAL** credentials were exposed in commit history:

- **TESSIE_API_KEY**: `64rbSGkMgblAZ5TaivBzokOGKTy72fYw` ⚠️ **REAL KEY**
- **TESLA_VIN**: `5YJYGDEE5LF027324` ⚠️ **REAL VIN**

The following appear to be placeholders but should still be verified:
- JWT_SECRET: `your-jwt-secret-key-here-minimum-32-characters`
- MAPBOX_ACCESS_TOKEN: `pk.your.mapbox.token`
- OPENWEATHER_API_KEY: `your-openweather-api-key`

## Commits Affected

The file was present in git history and deleted in commit `2453e63`:
```
commit 2453e63203b5529d7c61ef50eb3f724435b27cd8
Author: Cursor Agent <cursoragent@cursor.com>
Date:   Sun Dec 21 06:39:31 2025 +0000
    chore(security): remove committed local secrets and Lovable tagger artifacts
```

The file can still be accessed via:
```bash
git show 2453e63^:backend/edge-worker/.dev.vars
```

## Immediate Actions Required

### 1. ROTATE ALL EXPOSED CREDENTIALS (URGENT)

**TESSIE_API_KEY:**
- Log into Tessie account
- Revoke the exposed API key: `64rbSGkMgblAZ5TaivBzokOGKTy72fYw`
- Generate a new API key
- Update in Cloudflare Workers secrets: `wrangler secret put TESSIE_API_KEY`

**TESLA_VIN:**
- While VINs are not secret, they are PII (Personally Identifiable Information)
- Consider if any additional security measures are needed
- Update in Cloudflare Workers secrets: `wrangler secret put TESLA_VIN`

**JWT_SECRET:**
- Generate a new secure random secret (minimum 32 characters)
- Update in Cloudflare Workers secrets: `wrangler secret put JWT_SECRET`

**MAPBOX_ACCESS_TOKEN:**
- Verify if the exposed token was real or placeholder
- If real, regenerate in Mapbox account
- Update in Cloudflare Workers secrets: `wrangler secret put MAPBOX_ACCESS_TOKEN`

**OPENWEATHER_API_KEY:**
- Verify if the exposed key was real or placeholder
- If real, regenerate in OpenWeather account
- Update in Cloudflare Workers secrets: `wrangler secret put OPENWEATHER_API_KEY`

### 2. Remove from Git History (Optional but Recommended)

**WARNING:** This requires force-pushing and will rewrite history. Coordinate with team.

Option A: Use git-filter-repo (Recommended)
```bash
# Install git-filter-repo if needed
pip install git-filter-repo

# Remove file from all history
git filter-repo --path backend/edge-worker/.dev.vars --invert-paths

# Force push (WARNING: This rewrites history)
git push origin --force --all
```

Option B: Use BFG Repo-Cleaner
```bash
# Download BFG from https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-files .dev.vars
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin --force --all
```

**Note:** If the repository is shared or has open pull requests, coordinate the history rewrite with all contributors.

### 3. Verify .gitignore Protection

✅ Verified: `.dev.vars` is in `.gitignore` (line 18)  
✅ Verified: `.dev.vars.example` exists with placeholder values

### 4. Prevent Future Incidents

- ✅ `.dev.vars` is in `.gitignore`
- ✅ `.dev.vars.example` template exists
- ✅ Pre-commit hook installation script created (`scripts/install-pre-commit-hook.sh`)
- ✅ Credential rotation script created (`scripts/rotate-exposed-credentials.sh`)
- ⚠️ **All developers should run:** `./scripts/install-pre-commit-hook.sh` to install the hook locally
- ⚠️ Consider using git-secrets or similar tools for additional protection
- ⚠️ Add CI/CD checks to scan for exposed secrets (e.g., GitHub Secret Scanning)

## Current Status

- [x] Issue identified and documented
- [x] `.gitignore` verified
- [x] `.dev.vars.example` template verified
- [x] Pre-commit hook installed to prevent future incidents
- [x] Credential rotation script created
- [ ] **CREDENTIALS ROTATED** ⚠️ **ACTION REQUIRED** - Run `./scripts/rotate-exposed-credentials.sh`
- [ ] Git history cleaned (optional)
- [ ] Team notified

## References

- Commit that removed file: `2453e63`
- File location in history: `backend/edge-worker/.dev.vars`
- Example template: `backend/edge-worker/.dev.vars.example`

---

**CRITICAL:** Do not delay credential rotation. The exposed API key can be used to access Tesla vehicle data until rotated.
