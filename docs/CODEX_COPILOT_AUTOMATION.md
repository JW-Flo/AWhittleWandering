# Codex + Copilot Agent: Full Automation Guide

## Overview

This guide explains how to submit tasks to Codex that will be automatically processed by GitHub Copilot agent, resulting in PRs that are automatically committed, merged (for low-risk), and closed.

---

## 🎯 The Complete Flow

```
1. You submit issue with ai-task label
       ↓
2. Task-Runner workflow triggers
       ↓
3. Copilot agent processes task
       ↓
4. Changes committed to feature branch
       ↓
5. PR created automatically
       ↓
6. CI/CD runs (preflight, security, tests)
       ↓
7. Auto-merge (if low-risk) or review required
       ↓
8. Issue automatically closed when PR merges
```

---

## 📝 How to Submit a Task

### Method 1: Using Issue Template (Recommended)

1. Go to **Issues** → **New Issue**
2. Select **"AI Task"** template
3. Fill in the fields:

```yaml
Goal: Fix the off-by-one error in date range filter
Target Branch: dev
Risk Level: auto  # or: low, medium, high
Verify Tier: auto  # or: lite, full
Additional Context: |
  File: backend/edge-worker/src/utils/dates.ts
  Error occurs when filtering events by date range
```

4. Click **"Submit new issue"**
5. The workflow starts automatically!

### Method 2: Manual Issue Creation

Create an issue with:
- **Label:** `ai-task`
- **Body format:**

```markdown
goal: Implement user authentication rate limiting
branch: dev
risk_level: medium
verify_tier: full

## Context
We need to add rate limiting to prevent brute force attacks on the login endpoint.
Target: backend/edge-worker/src/routes/auth.ts
```

### Method 3: Comment Trigger

On any existing issue, comment:
```
@codex implement this
```

The bot will process the issue as a task.

---

## 🔄 Automated Lifecycle

### Phase 1: Task Processing

**Workflow:** `.github/workflows/task-runner.yml`

When task is submitted:
1. ✅ Validates task (no secrets, proper format)
2. ✅ Creates working branch: `task/ISSUE_NUMBER-timestamp`
3. ✅ Sets up environment (dependencies, tools)
4. ✅ Posts comment: "🤖 Task Runner Started"

### Phase 2: Agent Execution

**Script:** `ops/task-runner.sh`

The orchestrator:
1. ✅ Loads system prompts from `.ai/SYSTEM.md`
2. ✅ Invokes Copilot agent via GitHub API
3. ✅ Agent analyzes codebase
4. ✅ Agent makes changes
5. ✅ Changes validated and committed

**Key:** The agent has access to:
- Full repository context
- Task requirements
- Security/quality rules
- Previous context from issue

### Phase 3: Verification

**Scripts:** `scripts/preflight.sh`, `scripts/security-scan.sh`

Automated checks run:
1. ✅ **Linting** - Code style compliance
2. ✅ **Type checking** - TypeScript validation
3. ✅ **Security scan** - No secrets, vulnerabilities
4. ✅ **Tests** - Unit/integration tests pass
5. ✅ **Build** - Code compiles successfully

If checks fail:
- 🔄 **CI-Reviewer subagent** invoked to fix issues
- 🔄 Re-runs verification
- 🔄 Max 3 iterations

### Phase 4: PR Creation

**Workflow:** `.github/workflows/task-runner.yml` (lines 310-368)

Automatic PR is created with:
- ✅ Title: `task(#ISSUE_NUMBER): ISSUE_TITLE`
- ✅ Body: Contains task details, verification checklist, CI status
- ✅ Labels: Based on risk level
  - `codex:lite` - Low risk, auto-merge eligible
  - `codex:autonomous` - Medium risk
  - `codex:full` - High risk, requires approval
- ✅ Links to original issue (closes #ISSUE_NUMBER)

### Phase 5: Auto-Merge (Risk-Based)

**Workflows:** Multiple workflows handle merging

#### Low Risk (Docs/Config Only)
**Workflow:** `.github/workflows/auto-merge.yml`

```yaml
Conditions:
  - Only docs/ or config files changed
  - < 3 files modified
  - < 100 lines changed
  
Actions:
  ✅ Adds "risk:low" label
  ✅ Enables auto-merge
  ✅ Merges when CI passes
  ✅ Deletes branch automatically
```

#### Medium/High Risk
**Workflow:** `.github/workflows/task-runner.yml` (auto-merge job)

```yaml
Medium Risk:
  - Runtime code changed
  - < 10 files, < 500 lines
  - Requires 1 approval
  
High Risk:
  - Security/config files changed
  - > 10 files or > 500 lines
  - Requires 2 approvals + maintainer
```

### Phase 6: Issue Closure

**Automatic:** When PR merges, GitHub automatically closes the linked issue.

The workflow also posts final comment:
```
✅ Task Runner Complete
PR merged: #PR_NUMBER
Changes deployed to TARGET_BRANCH
```

---

## 🎛️ Risk Levels Explained

### Auto (Recommended)
System determines risk based on:
- Files changed (docs vs. runtime code)
- Number of files (< 10 vs. > 10)
- Lines changed (< 500 vs. > 500)
- Sensitive paths (security, auth, config)

### Low
- Documentation updates
- README changes
- Comment additions
- Whitespace fixes
- **Result:** Auto-merges after CI passes

### Medium
- Bug fixes in isolated modules
- New features in existing modules
- Refactoring with good test coverage
- **Result:** Requires 1 approval

### High
- Security changes
- Authentication/authorization
- Database migrations
- API contract changes
- Multi-module changes
- **Result:** Requires 2 approvals + maintainer

---

## 🛡️ Security Guardrails

**Automatic Protections:**

### 1. Secret Detection
```yaml
Patterns Blocked:
  - AWS keys (AKIA...)
  - API keys (AIzaSy...)
  - Private keys (-----BEGIN...)
  - GitHub tokens (ghp_...)
  - Slack tokens (xox...)
```

If secrets detected:
- ❌ Task rejected immediately
- 🚫 No code changes made
- 📧 Issue comment warns submitter

### 2. Path Restrictions

**Allowed:**
- `backend/` - Backend code
- `frontend/` - Frontend code
- `shared/` - Shared libraries
- `docs/` - Documentation
- `scripts/` - Utility scripts

**Restricted:**
- `.env*` - Environment files
- `ops/secrets/` - Secret storage
- `wrangler.toml` - CF config
- `*.pem`, `*.key` - Certificates

### 3. Command Allowlist

Only safe commands can be executed:
- `npm`, `pnpm`, `yarn` - Package managers
- `git` - Version control
- `node`, `npx` - Node.js
- `wrangler` - Cloudflare CLI
- `jq`, `rg` - Data tools

Disallowed:
- `rm -rf`
- `curl` to arbitrary URLs
- System modifications
- External API calls

### 4. Rate Limits

```yaml
Tasks: 20/hour, 100/day
Deployments: 5/hour, 20/day
API Calls: 30/minute, 500/hour
```

Prevents:
- Runaway automation
- API cost explosions
- Resource exhaustion

---

## 📊 Monitoring and Control

### View Active Tasks

```bash
# List all ai-task issues
gh issue list --label ai-task

# Check task status
gh run list --workflow=task-runner.yml

# View specific run
gh run view RUN_ID --log
```

### Manual Intervention

**Pause automation:**
```bash
# Disable task-runner workflow
gh workflow disable task-runner.yml
```

**Cancel running task:**
```bash
# Find run ID
gh run list --workflow=task-runner.yml

# Cancel it
gh run cancel RUN_ID
```

**Close task without completion:**
```bash
# Close the issue
gh issue close ISSUE_NUMBER --comment "Cancelled - will implement manually"
```

---

## 🔧 Customization

### Adjust Risk Thresholds

Edit `.github/codex/policy.yml`:

```yaml
risk_classification:
  low:
    conditions:
      file_count_max: 3      # Increase for more auto-merge
      lines_changed_max: 100  # Increase threshold
```

### Add Custom Verification

Edit `scripts/preflight.sh`:

```bash
# Add custom checks
echo "Running custom validation..."
npm run custom-lint
npm run api-contract-check
```

### Modify PR Template

Edit task-runner workflow (line 326):

```javascript
const prBody = `## 🤖 Automated PR

Custom template content here...

Closes #${issueNumber}
`;
```

---

## 💡 Best Practices

### 1. Clear Task Descriptions

**Good:**
```
Goal: Add pagination to /api/v1/users endpoint
Context: Currently returns all users, causing performance issues
Expected: Return 20 users per page with ?page=N query param
```

**Bad:**
```
Goal: Fix users
```

### 2. Appropriate Risk Levels

**Use Low When:**
- Fixing typos
- Updating documentation
- Adding comments

**Use Medium When:**
- Adding features
- Bug fixes
- Refactoring

**Use High When:**
- Changing authentication
- Modifying database schema
- Updating CI/CD

### 3. Incremental Tasks

**Good:**
```
Task 1: Add user model
Task 2: Add user API endpoints
Task 3: Add user UI components
```

**Bad:**
```
Task: Build complete user management system
```

### 4. Provide Context

Always include:
- Related files/paths
- Error messages (if fixing bugs)
- Expected behavior
- Links to documentation

---

## 🚨 Troubleshooting

### Task Not Starting

**Check:**
1. Issue has `ai-task` label?
2. Task format correct?
3. Workflow enabled? (`gh workflow list`)

**Fix:**
```bash
# Re-trigger manually
gh workflow run task-runner.yml -f issue_number=ISSUE_NUM
```

### Task Failed

**Check logs:**
```bash
gh run list --workflow=task-runner.yml
gh run view RUN_ID --log
```

**Common Issues:**
- Missing dependencies → Add to package.json
- Syntax errors → Agent will auto-fix with CI-Reviewer
- Test failures → Agent will fix or skip tests
- Secret detected → Remove from task description

### PR Not Auto-Merging

**Check:**
1. Is it labeled `risk:low` or `codex:lite`?
2. Did CI pass?
3. Are there conflicts?

**Fix:**
```bash
# Check PR status
gh pr view PR_NUMBER

# Manually merge if needed
gh pr merge PR_NUMBER --squash
```

### Too Many Tasks Running

**Rate limit hit:**
```bash
# Check current runs
gh run list --workflow=task-runner.yml --status in_progress

# Wait or cancel some
gh run cancel RUN_ID
```

---

## 📈 Metrics and Reporting

### Success Rate

```bash
# Count successful vs failed tasks
gh run list --workflow=task-runner.yml --json conclusion \
  | jq '[.[] | .conclusion] | group_by(.) | map({conclusion: .[0], count: length})'
```

### Average Time to Merge

```bash
# PRs created by task-runner
gh pr list --label ai-task --state merged --json createdAt,mergedAt
```

### Most Common Risk Levels

```bash
# Count PRs by risk label
gh pr list --label ai-task --json labels \
  | jq '[.[] | .labels[].name | select(startswith("risk:"))] | group_by(.) | map({risk: .[0], count: length})'
```

---

## 🎯 Example Workflows

### Workflow 1: Quick Doc Fix

**Submit:**
```markdown
Goal: Fix typo in API documentation
Branch: main
Risk: low
```

**What Happens:**
1. Task starts in < 30 seconds
2. Agent fixes typo
3. PR created automatically
4. CI passes in ~2 minutes
5. **Auto-merges immediately**
6. Issue closed
7. **Total time: ~3 minutes**

### Workflow 2: Bug Fix

**Submit:**
```markdown
Goal: Fix null pointer error in date formatter
Branch: dev
Risk: medium

Context:
File: shared/utils/dates.ts
Error: Cannot read property 'toISOString' of null
Line: 42
```

**What Happens:**
1. Task starts
2. Agent analyzes code
3. Agent fixes bug + adds null check
4. PR created
5. CI passes
6. **You review and approve (1 approval needed)**
7. Auto-merges after approval
8. Issue closed
9. **Total time: ~5 min + review time**

### Workflow 3: Feature Addition

**Submit:**
```markdown
Goal: Add rate limiting to authentication endpoint
Branch: dev
Risk: high

Context:
Implement rate limiting:
- 5 attempts per IP per minute
- 20 attempts per IP per hour
- Return 429 status code when exceeded
```

**What Happens:**
1. Task starts
2. Agent implements feature
3. PR created with label `codex:full`
4. CI passes
5. **Requires 2 approvals + maintainer**
6. You and team review code
7. Approve when ready
8. Manual merge (high-risk gate)
9. Issue closed
10. **Total time: ~10 min + review time**

---

## 🔗 Integration with Existing Tools

### With Your PR Automation

The task-runner integrates with:
- `auto-merge.yml` - Handles low-risk merges
- `stale-pr-management.yml` - Cleans up abandoned task PRs
- `pr-triage.yml` - Adds additional labels
- `scripts/manage-prs.sh` - Manual operations if needed

### With Branch Strategy

```yaml
Development:
  - Tasks target: dev branch
  - Auto-deploy: enabled
  - Environment: development

Staging:
  - Promoted from: dev (manual)
  - Auto-deploy: enabled
  - Environment: staging

Production:
  - Promoted from: staging (manual)
  - Requires: 2 approvals
  - Environment: production
```

### With Secrets Management

Tasks can reference secrets via:
```markdown
Goal: Add Stripe payment integration
Context: Use STRIPE_API_KEY from 1Password
```

The agent knows to use environment variables, never hardcode.

---

## 📚 Related Documentation

- **Full Workflow:** `.github/workflows/task-runner.yml`
- **Policy Config:** `.github/codex/policy.yml`
- **Task Template:** `.github/ISSUE_TEMPLATE/task.yml`
- **Orchestrator:** `ops/task-runner.sh`
- **PR Automation:** `docs/PR_AUTOMATION_GUIDE.md`

---

## ✅ Quick Start Checklist

To start using automated task processing:

- [ ] Ensure workflows are enabled (`gh workflow list`)
- [ ] Verify `ai-task` label exists
- [ ] Test with a low-risk task (doc update)
- [ ] Monitor the first few runs
- [ ] Adjust risk thresholds as needed
- [ ] Train team on task submission format

---

## 🎉 You're Ready!

**To submit your first automated task:**

1. Click **Issues** → **New Issue**
2. Select **"AI Task"** template
3. Fill in the goal and context
4. Submit
5. Watch the magic happen! ✨

The task will be processed automatically, code will be committed, PR created, and (if low-risk) automatically merged. You can focus on high-value work while automation handles the routine tasks.

**Questions?** Check the troubleshooting section or workflow logs.
