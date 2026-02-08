# PR Action Checklist

## Context
As an automated agent, I've reviewed all 13 open PRs but cannot directly close or merge them (requires repository owner permissions). This checklist provides concrete actions for you to take.

## Quick Actions (Can Do Now)

### 1. Merge Security Update ✅
```bash
# PR #160 - Dependency security updates
gh pr review 160 --approve
gh pr merge 160 --squash
```
**Why**: Dependabot updates for hono and wrangler. Keeps dependencies secure.

### 2. Close Stale PRs ❌  
```bash
# PR #152 - Has merge conflicts with non-existent base branch
gh pr close 152 --comment "Closing due to merge conflicts with stale base branch. Change is minimal (1 line .gitignore). Re-open against main if still needed."

# PR #153 - Has merge conflicts with non-existent base branch  
gh pr close 153 --comment "Closing due to merge conflicts with stale base branch. Documentation fix is minor. Re-open against main if still needed."
```
**Why**: Both PRs target `claude/framework-compliance-snapshot-ntb63` which is stale, and both have merge conflicts.

## Review Required (Before Merging)

### 3. Review Documentation PR
```bash
# PR #166 - Copilot Custom Agents documentation
gh pr view 166
gh pr diff 166
# If looks good:
gh pr review 166 --approve
gh pr merge 166 --squash
```
**Why**: Documentation-only, low-risk, could be useful.

### 4. Consolidate Claude Settings PRs  
There are multiple PRs (#162, #163, #164, #165) all related to Claude settings:
```bash
# Review each one
gh pr view 162
gh pr view 163
gh pr view 164
gh pr view 165

# Pick the best one or consolidate manually, then close the others
```
**Why**: Avoid conflicting configurations. Need to pick one "winning" approach.

### 5. Review Feature PRs (Test First!)
```bash
# PR #170 - Framework primitives (CI changes)
gh pr checkout 170
npm install
npm test
npm run build
# If all pass:
gh pr review 170 --approve

# PR #172 - Health check feature
gh pr checkout 172  
npm install
npm test
npm run build
# Test the health check functionality
# If all pass:
gh pr review 172 --approve

# PR #173 - Deploy diagnostics + E2E tests
gh pr checkout 173
npm install
npm test
npm run build
# Run the new E2E tests if possible
# If all pass:
gh pr review 173 --approve
```
**Why**: These PRs make substantial changes. Should validate they work before merging.

### 6. Fix Then Review PR #171
```bash
# PR #171 - Infrastructure provisioning (BUILD FAILED)
gh pr view 171
```
**Note**: This PR has build failures and Cloudflare deployment failures. 
- Base branch is `claude/read-claude-prompt-DuPp3` (not main)
- It's a stacked PR that depends on #170
- Recommendation: Either fix the build issues OR close and re-create against main

## Automated Commands (All at Once)

If you trust the analysis, you can run these commands sequentially:

```bash
#!/bin/bash
# Save this as close-prs.sh and run: bash close-prs.sh

echo "Merging security updates..."
gh pr review 160 --approve --body "LGTM - security updates"
# Note: Don't delete Dependabot branches with --delete-branch
gh pr merge 160 --squash

echo "Closing stale PRs..."
gh pr close 152 --comment "Closing: merge conflicts with stale base branch"
gh pr close 153 --comment "Closing: merge conflicts with stale base branch"

echo "Done! Review remaining PRs manually."
echo "Remaining PRs to review: #166, #170, #171, #172, #173, #162-165"
```

## Summary

- **Merge immediately**: PR #160 (security)
- **Close immediately**: PRs #152, #153 (stale/conflicts)
- **Review then decide**: PRs #166, #170, #172, #173
- **Needs fix first**: PR #171 (build failures)
- **Consolidate**: PRs #162-165 (pick one)

## Commands Reference

```bash
# List all open PRs
gh pr list

# View a specific PR
gh pr view NUMBER

# Check out a PR locally to test
gh pr checkout NUMBER

# Approve a PR
gh pr review NUMBER --approve

# Merge a PR
gh pr merge NUMBER --squash

# Close a PR
gh pr close NUMBER --comment "reason"
```

---

**Next Steps**: Start with the "Quick Actions" section above. Those are safe and straightforward. Then review the feature PRs one by one.
