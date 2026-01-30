---
name: Deploy to Production
description: "Safely promote code from staging to production."
---

**Deploy-Prod Command Steps:**

⚠️ **This is a HIGH-RISK operation requiring human approval.**

1. **Pre-deployment Verification:**
   - Confirm staging branch is up-to-date with all intended changes
   - Verify all CI checks have passed on staging
   - Ensure no pending security issues or critical bugs
   - Check that staging environment has been tested

2. **Staging Health Check:**
   ```bash
   # Verify staging is healthy
   curl -sf https://staging-api.awhittlewandering.com/api/v1/health
   ```

3. **Create Promotion PR:**
   - Create a PR from `staging` to `main`
   - Include deployment checklist in PR body
   - Add `deploy:production` label to trigger deployment workflow

4. **Deployment Checklist:**
   ```markdown
   - [ ] All staging tests passed
   - [ ] Security scan clean
   - [ ] No critical issues in error monitoring
   - [ ] Database migrations reviewed (if any)
   - [ ] Rollback plan documented
   - [ ] On-call engineer notified
   ```

5. **Approval Gate:**
   - Requires at least 2 approvers for production deployment
   - One approver must be a maintainer
   - CI must pass on the PR

6. **Deployment Execution:**
   Once approved, the deployment workflow will:
   - Merge staging → main
   - Trigger Cloudflare Workers deployment
   - Trigger Cloudflare Pages deployment
   - Run post-deployment health checks

7. **Post-Deployment Verification:**
   ```bash
   # Verify production is healthy
   curl -sf https://api.awhittlewandering.com/api/v1/health
   
   # Check frontend
   curl -sf https://awhittlewandering.com
   ```

8. **Rollback Procedure:**
   If issues are detected post-deployment:
   ```bash
   # Backend rollback
   cd backend/edge-worker
   wrangler rollback --env production
   
   # Frontend rollback via Cloudflare Dashboard
   # Pages → awhittlewandering → Deployments → Rollback
   ```

**Automation Notes:**
- The agent should NOT directly execute production deployments
- This command documents the process for human operators
- The actual deployment is triggered by GitHub Actions when the PR is merged
- Secrets are never exposed to the agent; they're injected by CI

**Risk Level:** HIGH
**Requires:** Manual approval, maintainer sign-off
