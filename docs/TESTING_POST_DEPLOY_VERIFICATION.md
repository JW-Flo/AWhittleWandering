# Testing Post-Deploy Verification Workflow

This document describes how to test the post-deployment verification workflow.

## Overview

The post-deploy verification workflow has been updated to handle scenarios where custom domains are not configured. It will:

1. Try custom domains first (awhittlewandering.com, api.awhittlewandering.com)
2. Fall back to workers.dev domains if custom domains fail
3. Report warnings when custom domains need configuration
4. Only fail if actual deployments are broken

## Manual Testing

### Test Case 1: Custom Domains Not Configured (Current State)

**Expected Behavior:**
- Verification tries custom domains, gets HTTP 000 errors
- Falls back to workers.dev domains
- All checks pass ✅
- Warning shown about custom domain configuration
- Issue created with warning, not as failure

**To Test:**
```bash
# Trigger the workflow manually
gh workflow run post-deploy-verify.yml \
  --field environment=production
```

**Expected Output:**
- ✅ Frontend: Passes (using fallback URL)
- ✅ Backend Health: Passes (using fallback URL)
- ✅ API Routes: Passes (using fallback URL)
- ⚠️ Warning: Custom domains not configured
- No rollback triggered
- Issue created with guidance for domain setup

### Test Case 2: Custom Domains Configured Correctly

**Expected Behavior:**
- Verification tries custom domains, gets HTTP 200
- All checks pass ✅
- No warnings shown
- No issue created

**To Test:**
1. Configure custom domains in Cloudflare:
   - Frontend: Add `awhittlewandering.com` to Pages project
   - Backend: Ensure Worker route is active for `api.awhittlewandering.com/*`
2. Trigger the workflow:
   ```bash
   gh workflow run post-deploy-verify.yml \
     --field environment=production
   ```

**Expected Output:**
- ✅ Frontend: Passes (using custom domain)
- ✅ Backend Health: Passes (using custom domain)
- ✅ API Routes: Passes (using custom domain)
- No warnings
- No issue created

### Test Case 3: Actual Deployment Failure

**Expected Behavior:**
- Verification tries custom domains, gets HTTP 000
- Falls back to workers.dev domains
- Workers.dev domains also fail
- All checks fail ❌
- Issue created as deployment failure
- Rollback triggered (if production)

**To Test:**
This is harder to test without breaking production. Can be simulated by:
1. Temporarily breaking the Worker deployment
2. Triggering verification
3. Should see actual failure, not just warning

**Expected Output:**
- ❌ All checks fail
- Issue created as critical failure
- Auto-rollback step runs (production only)

## Automated Testing

### Check Workflow Syntax

```bash
# Validate YAML syntax
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/post-deploy-verify.yml'))"

# Remove trailing spaces
sed -i 's/[[:space:]]*$//' .github/workflows/post-deploy-verify.yml
```

### Verify URL Fallback Logic

The workflow includes these key features:

1. **Fallback URLs**: Set in env vars
   ```yaml
   PROD_FRONTEND_FALLBACK: https://awhittlewandering.pages.dev
   PROD_BACKEND_FALLBACK: https://awhittlewandering-api.workers.dev
   ```

2. **Warning Tracking**: Outputs set when fallback is used
   ```yaml
   echo "warning=custom-domain-not-configured" >> $GITHUB_OUTPUT
   ```

3. **URL Propagation**: Working URLs passed to subsequent steps
   ```yaml
   echo "url=$FALLBACK_URL" >> $GITHUB_OUTPUT
   ```

## Verification Checklist

- [ ] Workflow syntax is valid (YAML validates)
- [ ] No trailing spaces in workflow file
- [ ] Fallback URLs are correct
- [ ] Warning messages are clear
- [ ] Documentation links work (absolute GitHub URLs)
- [ ] CORS check uses working URLs
- [ ] Integration check uses working URLs
- [ ] Report includes warnings when appropriate
- [ ] Issue creation only happens on real failures

## Expected Improvements

After this fix:

1. **No False Positives**: Verification won't fail just because custom domains aren't configured
2. **Clear Guidance**: Users get clear instructions for domain setup
3. **Actual Deployment Status**: Can verify deployments work even without custom domains
4. **Progressive Enhancement**: Custom domains are optional, not required

## Rollout Plan

1. Merge PR to main
2. Monitor next production deployment
3. Verify workflow passes with warnings (not failures)
4. Configure custom domains when ready
5. Re-run verification to confirm warnings clear

## Related Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md#custom-domain-setup) - Custom domain setup guide
- [DEPLOYMENT_TROUBLESHOOTING.md](./DEPLOYMENT_TROUBLESHOOTING.md) - Troubleshooting guide
- [Post-Deploy Workflow](./.github/workflows/post-deploy-verify.yml) - Workflow source
