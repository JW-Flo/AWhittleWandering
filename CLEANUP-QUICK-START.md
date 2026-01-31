# PR and Branch Cleanup - Quick Start Guide

## Overview

This PR provides an automated solution to close all open PRs and delete unnecessary branches in the repository.

## Quick Start

### Prerequisites
1. Install GitHub CLI: https://cli.github.com/
2. Authenticate: `gh auth login`
3. Ensure you have appropriate repository permissions

### Run the Cleanup Script

```bash
# Make sure you're in the repository root
cd /path/to/AWhittleWandering

# Run the cleanup script
./scripts/cleanup-prs-and-branches.sh
```

The script will:
1. Automatically detect the current PR (to avoid closing it)
2. Close all other open PRs with a cleanup message
3. List all branches that can be deleted
4. Ask for confirmation before deleting branches
5. Delete approved branches
6. Provide a complete summary

## What Will Be Cleaned Up

### PRs to Close (6 open PRs):
- PR #105: Fix verification workflow
- PR #94: Build QA contract check scripts
- PR #89: Staging environment configuration
- PR #88: Charging recommendation setter
- PR #87: EnhancedTeslaApp component issues
- PR #85: Agent framework audit

### Branches to Delete (30+ branches):
- All copilot/* branches (except current)
- All cursor/* branches
- All claude/* branches
- All codex/* branches
- Other feature branches

**Protected**: main/master and the current cleanup branch

## After Running the Script

1. Verify PRs are closed:
   ```bash
   gh pr list --repo JW-Flo/AWhittleWandering --state open
   ```

2. Verify branches are deleted:
   ```bash
   gh api /repos/JW-Flo/AWhittleWandering/branches --jq '.[].name'
   ```

3. Close this cleanup PR (#128) after verification

4. Delete the cleanup branch:
   ```bash
   gh api -X DELETE /repos/JW-Flo/AWhittleWandering/git/refs/heads/copilot/close-prs-and-branches
   ```

## Safety Features

- ✅ Automatically detects and excludes current PR
- ✅ Automatically detects and excludes current branch
- ✅ Requires confirmation before deleting branches
- ✅ Protected branches (main/master) are never deleted
- ✅ Provides detailed logging and error messages
- ✅ Continues on errors (won't abort entire cleanup if one item fails)

## Full Documentation

See `docs/PR-BRANCH-CLEANUP.md` for:
- Complete list of PRs and branches
- Manual cleanup instructions
- Troubleshooting guide
- Alternative approaches

## Support

If you encounter issues:
1. Check the troubleshooting section in `docs/PR-BRANCH-CLEANUP.md`
2. Ensure GitHub CLI is properly authenticated
3. Verify you have appropriate repository permissions
4. Try manual cleanup commands if the script fails

---

**Note**: This is a maintenance operation. All closed PRs can be reopened if needed, and commits remain accessible via their SHA even after branch deletion.
