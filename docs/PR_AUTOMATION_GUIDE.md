# PR Automation Guide

**Last Updated:** January 31, 2026

This guide explains how to automate PR management in the repository and grant appropriate access to automation tools.

---

## Table of Contents

1. [Overview](#overview)
2. [GitHub Permissions Model](#github-permissions-model)
3. [Existing Automation](#existing-automation)
4. [Manual PR Management Script](#manual-pr-management-script)
5. [Automated Workflows](#automated-workflows)
6. [Granting Access to Copilot](#granting-access-to-copilot)
7. [Best Practices](#best-practices)

---

## Overview

This repository has three levels of PR automation:

1. **Existing Auto-Merge** - Automatically merges low-risk PRs (docs/config only)
2. **Stale PR Management** - Automatically identifies and closes stale PRs
3. **Manual Management Script** - Script to batch process PRs based on recommendations

---

## GitHub Permissions Model

### Understanding GitHub Access Levels

GitHub has several permission levels for repositories:

| Role | Can Merge PRs | Can Close PRs | Can Modify Workflows |
|------|---------------|---------------|----------------------|
| Read | ❌ No | ❌ No | ❌ No |
| Triage | ❌ No | ✅ Yes | ❌ No |
| Write | ✅ Yes | ✅ Yes | ❌ No |
| Maintain | ✅ Yes | ✅ Yes | ⚠️ Limited |
| Admin | ✅ Yes | ✅ Yes | ✅ Yes |

### Why Copilot Agent Can't Merge/Close PRs

The Copilot coding agent operates with:
- **Read-only access** to repository content
- **Cannot** authenticate as a user with write permissions
- **Cannot** execute `gh` CLI commands that modify PRs
- **Can** create PRs, commit code, and read repository data

### Solutions for Automation

You have three options:

#### Option 1: Manual Execution (Recommended)
- Review automated recommendations
- Manually merge/close PRs through GitHub UI or CLI
- **Pros:** Full control, security
- **Cons:** Manual effort required

#### Option 2: GitHub Actions Automation
- Create workflows that automatically manage PRs based on rules
- Uses `GITHUB_TOKEN` with appropriate permissions
- **Pros:** Automated, secure, auditable
- **Cons:** Requires careful rule design

#### Option 3: Personal Access Token (PAT)
- Create a PAT with repo permissions
- Add as repository secret
- Use in manual scripts
- **Pros:** Full automation capability
- **Cons:** Security risk if token is compromised

---

## Existing Automation

### Auto-Merge Workflow

**File:** `.github/workflows/auto-merge.yml`

**What it does:**
- Automatically classifies PRs by risk (low/medium/high)
- Auto-merges **low-risk** PRs that only touch:
  - `docs/` directory
  - `.github/` configuration
  - README, QA, SECURITY, PRIVACY, DATA_POLICY files
- Adds risk labels to all PRs

**Triggers:**
- When PR is opened, reopened, synchronized
- When PR is marked ready for review
- When labels are added/removed

**How it works:**
```yaml
# Analyzes files changed
# If only docs/config → risk:low → auto-merge enabled
# If non-runtime code → risk:medium → manual review
# If runtime code → risk:high → manual review
```

**Current Status:** ✅ Active and working

---

## Manual PR Management Script

A new script has been created to help you batch-process PRs based on the review recommendations.

### Using the PR Management Script

**File:** `scripts/manage-prs.sh`

```bash
# Show PR status and recommendations
./scripts/manage-prs.sh status

# Close specific stale PRs
./scripts/manage-prs.sh close 37 38 40 41 42 43

# Merge ready PRs (requires confirmation)
./scripts/manage-prs.sh merge 95

# Dry run (see what would happen)
./scripts/manage-prs.sh --dry-run close 37 38 40 41
```

**Requirements:**
- GitHub CLI (`gh`) installed
- Authenticated with `gh auth login`
- Write permissions to the repository

**Features:**
- ✅ Validates permissions before making changes
- ✅ Shows PR details before actions
- ✅ Requires confirmation for destructive operations
- ✅ Dry-run mode for safety
- ✅ Batch operations support

---

## Automated Workflows

### 1. Stale PR Detection and Management

**File:** `.github/workflows/stale-pr-management.yml`

**What it does:**
- Runs daily at midnight UTC
- Identifies PRs that are:
  - Older than 30 days
  - Still in draft status OR no recent activity
  - Not labeled with "keep-open" or "in-progress"
- Adds "stale" label and comment warning
- Auto-closes PRs after 7 more days if still stale

**Configuration:**
```yaml
# Customize thresholds
DAYS_BEFORE_STALE: 30
DAYS_BEFORE_CLOSE: 7
EXEMPT_LABELS: keep-open,in-progress,dependencies
```

**Manual Trigger:**
```bash
# Trigger the workflow manually
gh workflow run stale-pr-management.yml
```

### 2. PR Triage Workflow

**File:** `.github/workflows/pr-triage.yml`

**What it does:**
- Runs when PRs are opened or updated
- Checks for:
  - ✅ PR description filled out
  - ✅ Tests added (if code changes)
  - ✅ Linked issue exists
  - ✅ No merge conflicts
- Adds appropriate labels:
  - `needs-review` - Ready for review
  - `needs-work` - Missing requirements
  - `needs-rebase` - Has conflicts

**Benefits:**
- Ensures PR quality before review
- Reduces back-and-forth
- Clear status indicators

### 3. PR Review Reminder

**File:** `.github/workflows/review-reminder.yml`

**What it does:**
- Runs weekly on Mondays
- Lists all PRs awaiting review
- Posts summary to Slack/Discord (if configured)
- Can be configured to notify specific reviewers

---

## Granting Access to Copilot

### Important: Copilot Agent Limitations

**Copilot coding agent fundamentally cannot:**
- Authenticate as a GitHub user
- Execute operations requiring write permissions
- Merge or close PRs directly
- Approve pull requests

**What Copilot CAN do:**
- ✅ Analyze code and PRs
- ✅ Create recommendations
- ✅ Write automation scripts
- ✅ Create PRs with changes
- ✅ Update documentation

### Recommended Workflow

Instead of granting Copilot direct access, use this workflow:

```
1. Copilot creates PR review document
   ↓
2. Copilot creates automation scripts/workflows
   ↓
3. You review recommendations
   ↓
4. You execute scripts OR automation runs automatically
   ↓
5. PRs are merged/closed with proper oversight
```

This approach provides:
- ✅ AI-powered analysis and recommendations
- ✅ Human oversight and control
- ✅ Audit trail of all actions
- ✅ Security (no AI with write access)

---

## Best Practices

### 1. Weekly PR Review Process

**Recommended Schedule:**

```
Monday:
- Review PR triage report
- Assign reviewers to new PRs

Wednesday:
- Review stale PR warnings
- Close or update stale PRs

Friday:
- Merge ready PRs
- Plan for next week
```

### 2. PR Labels Strategy

Use labels to manage automation:

| Label | Purpose | Effect |
|-------|---------|--------|
| `keep-open` | Prevent stale closure | Exempt from stale workflow |
| `in-progress` | Active development | Exempt from stale workflow |
| `needs-review` | Ready for review | Prioritize in reviews |
| `needs-work` | Requires changes | Don't auto-merge |
| `dependencies` | Dependency updates | May auto-merge if low-risk |
| `risk:low` | Safe to auto-merge | Auto-merge enabled |
| `risk:medium` | Needs review | Manual merge only |
| `risk:high` | Critical review needed | Manual merge with extra scrutiny |

### 3. PR Description Template

The repository's PR template includes:

```markdown
## Summary
- What problem does this solve?

## Changes
- List key changes

## How to validate
- Test steps

## Acceptance criteria
- [ ] CI green
- [ ] Tests added
- [ ] Documentation updated
```

**Enforce this template** to make automated triage more effective.

### 4. Branch Protection Rules

Configure branch protection for `main`:

```yaml
Required:
- ✅ Require pull request reviews (1 approval)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Require conversation resolution

Optional but Recommended:
- ⚠️ Restrict pushes to specific users/teams
- ⚠️ Require signed commits
```

---

## Quick Start Guide

### For First-Time Setup

1. **Install GitHub CLI:**
   ```bash
   # macOS
   brew install gh
   
   # Ubuntu/Debian
   sudo apt install gh
   
   # Windows
   winget install GitHub.cli
   ```

2. **Authenticate:**
   ```bash
   gh auth login
   # Follow prompts, select HTTPS, authenticate via browser
   ```

3. **Test Access:**
   ```bash
   gh pr list
   # Should show all open PRs
   ```

4. **Enable Workflows:**
   ```bash
   # Workflows are automatically enabled on merge
   # Check status:
   gh workflow list
   ```

5. **Run Management Script:**
   ```bash
   chmod +x scripts/manage-prs.sh
   ./scripts/manage-prs.sh status
   ```

### For Daily Use

**Check PR Status:**
```bash
./scripts/manage-prs.sh status
```

**Merge a Ready PR:**
```bash
./scripts/manage-prs.sh merge 95
```

**Close Stale PRs:**
```bash
./scripts/manage-prs.sh close 37 38 40 41 42 43
```

**View Workflow Results:**
```bash
gh run list --workflow=stale-pr-management.yml
gh run view [run-id]
```

---

## Troubleshooting

### "Insufficient permissions" Error

**Problem:** Script fails with permission error

**Solution:**
```bash
# Check your authentication
gh auth status

# Re-authenticate with correct scopes
gh auth refresh -s repo -s workflow
```

### Workflows Not Running

**Problem:** Automated workflows aren't triggering

**Solutions:**
1. Check if workflows are enabled:
   ```bash
   gh workflow list
   ```

2. Enable disabled workflows:
   ```bash
   gh workflow enable stale-pr-management.yml
   ```

3. Check workflow logs:
   ```bash
   gh run list --workflow=stale-pr-management.yml
   gh run view [run-id] --log
   ```

### Auto-Merge Not Working

**Problem:** Low-risk PRs aren't auto-merging

**Possible Causes:**
1. PR is in draft mode (auto-merge only works on ready PRs)
2. Required status checks not passing
3. Branch protection rules prevent auto-merge
4. Conflicts exist

**Solution:**
```bash
# Check PR status
gh pr view [PR-NUMBER]

# Mark PR as ready
gh pr ready [PR-NUMBER]

# Enable auto-merge manually
gh pr merge [PR-NUMBER] --auto --merge
```

---

## Security Considerations

### DO ✅

- Use GITHUB_TOKEN in workflows (automatically scoped)
- Review automation logs regularly
- Use dry-run mode before bulk operations
- Require PR reviews for high-risk changes
- Audit closed/merged PRs weekly

### DON'T ❌

- Store PATs in code or commit them
- Grant write access to external services unnecessarily
- Auto-merge high-risk PRs (runtime code changes)
- Disable required status checks
- Skip review for large PRs (>500 lines)

---

## Support and Questions

**Documentation:**
- GitHub Actions: https://docs.github.com/en/actions
- GitHub CLI: https://cli.github.com/manual/
- Auto-merge: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/automatically-merging-a-pull-request

**Repository-Specific:**
- See: `docs/PR_REVIEW_RECOMMENDATIONS.md` for current PR analysis
- See: `.github/workflows/` for workflow definitions
- See: `scripts/manage-prs.sh` for management script

---

## Summary: Your Options

| Approach | Effort | Control | Speed | Recommended For |
|----------|--------|---------|-------|-----------------|
| **Manual (GitHub UI)** | High | Full | Slow | Small teams, high-risk changes |
| **Manual Script** | Medium | Full | Medium | Batch operations, periodic cleanup |
| **Auto-Merge Workflow** | Low | Rule-based | Fast | Low-risk changes (docs/config) |
| **Stale PR Workflow** | Low | Rule-based | Automated | Keeping PR backlog clean |
| **Full Automation** | Very Low | Limited | Very Fast | ⚠️ Only for well-tested rules |

**Recommended Setup:**
1. Use **existing auto-merge** for low-risk PRs ✅
2. Use **stale PR workflow** for automated cleanup ✅
3. Use **manual script** for recommended actions 🔧
4. Use **GitHub UI** for complex/risky PRs 👤

This combination provides the right balance of automation and control.
