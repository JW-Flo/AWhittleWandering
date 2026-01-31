# PR and Branch Cleanup Guide

This document explains the repository cleanup process for closing all PRs and deleting unnecessary branches.

## Current State

As of the cleanup task:
- **Total PRs**: 30 (7 open, 23 closed)
- **Open PRs to close**: 6 (excluding PR #128 which is the cleanup PR itself)
- **Branches**: 30+ branches identified for potential cleanup

### Open PRs to Close

| PR # | Title | Branch |
|------|-------|--------|
| 105 | Fix verification workflow: normalize curl's 000000 connection failure code to 000 | copilot/fix-production-verification-issue |
| 94 | Build QA contract check scripts before execution | copilot/fix-build-step-for-unified-contract-check |
| 89 | Staging environment configuration | cursor/staging-environment-configuration-33eb |
| 88 | Charging recommendation setter | cursor/charging-recommendation-setter-3bc4 |
| 87 | EnhancedTeslaApp component issues | cursor/enhancedteslaapp-component-issues-dd9d |
| 85 | Agent framework audit | cursor/agent-framework-audit-b820 |

## Cleanup Process

### Automated Cleanup (Recommended)

We've provided a script that automates the entire cleanup process.

**Prerequisites:**
- GitHub CLI (`gh`) installed: https://cli.github.com/
- Authenticated with GitHub: `gh auth login`
- Appropriate repository permissions

**To run the cleanup:**

```bash
./scripts/cleanup-prs-and-branches.sh
```

The script will:
1. Close all open PRs except #128 (the current cleanup PR)
2. List all branches that can be deleted
3. Ask for confirmation before deleting branches
4. Delete approved branches
5. Provide a summary of all actions taken

### Manual Cleanup

If you prefer to clean up manually:

#### Step 1: Close PRs

```bash
# Close each PR individually
gh pr close 105 --repo JW-Flo/AWhittleWandering --comment "Closing as part of repository cleanup"
gh pr close 94 --repo JW-Flo/AWhittleWandering --comment "Closing as part of repository cleanup"
gh pr close 89 --repo JW-Flo/AWhittleWandering --comment "Closing as part of repository cleanup"
gh pr close 88 --repo JW-Flo/AWhittleWandering --comment "Closing as part of repository cleanup"
gh pr close 87 --repo JW-Flo/AWhittleWandering --comment "Closing as part of repository cleanup"
gh pr close 85 --repo JW-Flo/AWhittleWandering --comment "Closing as part of repository cleanup"
```

#### Step 2: Delete Branches

After closing PRs, delete their associated branches:

```bash
# List all branches
gh api /repos/JW-Flo/AWhittleWandering/branches --jq '.[].name'

# Delete specific branches (example)
gh api -X DELETE /repos/JW-Flo/AWhittleWandering/git/refs/heads/copilot/fix-production-verification-issue
gh api -X DELETE /repos/JW-Flo/AWhittleWandering/git/refs/heads/copilot/fix-build-step-for-unified-contract-check
# ... continue for other branches
```

## Branches Identified for Cleanup

The following branches are candidates for deletion (non-protected, not main/master):

### Copilot-generated branches:
- copilot/fix-production-verification-issue
- copilot/fix-build-step-for-unified-contract-check
- copilot/debug-failure-issue
- copilot/fix-action-run-issue
- copilot/fix-deployment-failures
- copilot/fix-migration-issue-api-rate-limits
- copilot/fix-missing-vitejs-plugin
- copilot/fix-openapi-drift-tests-dependency
- copilot/fix-post-deploy-verification
- copilot/fix-schema-checks-and-migrations
- copilot/sub-pr-58-another-one
- copilot/sub-pr-85
- copilot/sub-pr-89-again
- copilot/sub-pr-89
- copilot/sub-pr-101

### Cursor-generated branches:
- cursor/staging-environment-configuration-33eb (has open PR #89)
- cursor/charging-recommendation-setter-3bc4 (has open PR #88)
- cursor/enhancedteslaapp-component-issues-dd9d (has open PR #87)
- cursor/agent-framework-audit-b820 (has open PR #85)
- cursor/ci-fixes-secrets-secscan
- cursor/cloud-agent-1769755393564-l18pm
- cursor/codex-ci-cd-pipeline-strategy-df1f
- cursor/reconciliation-plan-finalization-d261

### Claude-generated branches:
- claude/analyze-test-coverage-izNdh
- claude/awhittle-backend-api-GHN5B

### Codex-generated branches:
- codex/add-pages_build_output_dir-to-wrangler.toml
- codex/build-and-deploy-frontend-to-cloudflare-pages

### Other branches:
- chore/vite7-upgrade
- ci/codex-lite-full-gates
- ci/codex-optional-security-scan

## Protected Branches

The following branches should NOT be deleted:
- `main` or `master` (if exists)
- `copilot/close-prs-and-branches` (current cleanup branch, until PR #128 is merged)

## Post-Cleanup

After running the cleanup:

1. Verify all PRs are closed: `gh pr list --repo JW-Flo/AWhittleWandering --state open`
2. Verify branches are deleted: `gh api /repos/JW-Flo/AWhittleWandering/branches --jq '.[].name'`
3. Close PR #128 (this cleanup PR) after verifying everything
4. Optionally delete the `copilot/close-prs-and-branches` branch

## Troubleshooting

**Error: "GitHub CLI (gh) is not installed"**
- Install from: https://cli.github.com/

**Error: "Not authenticated with GitHub CLI"**
- Run: `gh auth login`

**Error: "Failed to close PR"**
- Check if you have appropriate permissions
- The PR might already be closed
- Try manually via GitHub web interface

**Error: "Failed to delete branch"**
- The branch might be protected
- The branch might not exist
- You might not have delete permissions

## Notes

- This cleanup removes work-in-progress PRs. Ensure no important work is lost.
- Consider downloading/backing up any important code from PRs before closing
- Branch deletion is permanent but commits remain accessible via SHA
- Closed PRs can be reopened if needed
