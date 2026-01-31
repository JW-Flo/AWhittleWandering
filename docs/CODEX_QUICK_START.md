# Quick Start: Submit Automated Tasks to Codex

## 🚀 TL;DR - Submit a Task in 60 Seconds

### Step 1: Create Issue
Go to **Issues** → **New Issue** → Select **"AI Task"**

### Step 2: Fill the Form
```yaml
Goal: Fix the typo in README.md line 42
Target Branch: main
Risk Level: low
```

### Step 3: Submit
Click **"Submit new issue"**

### Step 4: Watch It Work ✨
- Bot comments "Task Runner Started"
- Code changes committed automatically
- PR created automatically
- CI/CD runs automatically
- **Low-risk tasks auto-merge!**
- Issue closes automatically

**Total time: 3-5 minutes from submit to merge!**

---

## 📝 Task Format

### Minimal Example
```markdown
Goal: Add null check to user validator
Branch: dev
Risk: medium
```

### With Context (Better)
```markdown
Goal: Add null check to user validator

Context:
File: shared/validators/user.ts
Error: TypeError at line 23
Expected: Return false instead of throwing
```

---

## 🎯 Risk Levels

| Level | Auto-Merge | Review Required | Examples |
|-------|------------|-----------------|----------|
| **low** | ✅ Yes | No | Docs, typos, comments |
| **medium** | ❌ No | 1 approval | Bug fixes, refactoring |
| **high** | ❌ No | 2 approvals | Security, auth, migrations |
| **auto** | 🤖 Decides | Based on files | Let system choose |

---

## 💡 Common Tasks

### Fix a Typo (Auto-Merges!)
```yaml
Goal: Fix typo in API documentation
Branch: main
Risk: low
```
✅ Merges in 3 minutes

### Fix a Bug
```yaml
Goal: Fix null pointer in date formatter

Context:
File: shared/utils/dates.ts
Line: 42
Error: Cannot read property 'toISOString' of null
```
⏰ Merges after 1 approval (~5-10 min)

### Add a Feature
```yaml
Goal: Add pagination to users API

Context:
Endpoint: GET /api/v1/users
Requirements:
- Accept ?page=N query param
- Return 20 users per page
- Include total count in response
```
⏰ Merges after 2 approvals (~15-30 min)

---

## 🔍 Track Progress

### Check Status
```bash
# View task status
gh issue view ISSUE_NUMBER

# View workflow runs
gh run list --workflow=task-runner.yml

# View specific run
gh run view RUN_ID --log
```

### Check PR
```bash
# List PRs from task
gh pr list --label ai-task

# View specific PR
gh pr view PR_NUMBER
```

---

## 🛑 Cancel or Pause

### Cancel Running Task
```bash
# Find the run
gh run list --workflow=task-runner.yml --status in_progress

# Cancel it
gh run cancel RUN_ID
```

### Close Without Completion
```bash
# Close the issue
gh issue close ISSUE_NUMBER --comment "Cancelling - will handle manually"
```

### Disable Automation
```bash
# Disable task runner
gh workflow disable task-runner.yml

# Re-enable later
gh workflow enable task-runner.yml
```

---

## ⚠️ Important Rules

### ✅ DO:
- Be specific in goal description
- Include file paths and context
- Use appropriate risk level
- Test with low-risk tasks first

### ❌ DON'T:
- Include secrets or passwords
- Make tasks too broad ("rebuild entire system")
- Use for breaking changes without review
- Skip testing phase

---

## 🎯 Success Patterns

### Pattern 1: Incremental Tasks
```
Task 1: Add user model schema
Task 2: Add user API endpoints  
Task 3: Add user UI components
```

### Pattern 2: Fix + Test
```
Goal: Fix date calculation bug and add tests

Context:
Bug: Off-by-one error in dateRange function
Add: Unit tests to prevent regression
```

### Pattern 3: Documentation
```
Goal: Document the new authentication flow

Context:
Update: docs/API_REFERENCE.md
Add: Sequence diagrams
Include: Example requests/responses
```

---

## 📊 What Happens Behind the Scenes

```
You submit task
    ↓
Task-Runner workflow starts (task-runner.yml)
    ↓
Validates task (no secrets, proper format)
    ↓
Creates working branch (task/ISSUE_NUM-timestamp)
    ↓
Invokes Copilot agent via @copilot mention
    ↓
Agent analyzes code and implements changes
    ↓
Changes committed to branch
    ↓
Runs preflight checks (lint, typecheck, tests)
    ↓
Runs security scan (no secrets, vulnerabilities)
    ↓
PR created with risk label
    ↓
CI/CD pipeline runs
    ↓
LOW RISK:           MEDIUM/HIGH RISK:
Auto-merge enabled  Review required
↓                   ↓
Merges when CI ✅   Waits for approval
↓                   ↓
Issue closed        Merges after approval
                    ↓
                    Issue closed
```

---

## 🔧 Customization

### Change Auto-Merge Thresholds

Edit `.github/codex/policy.yml`:
```yaml
risk_classification:
  low:
    conditions:
      file_count_max: 5      # Was 3
      lines_changed_max: 200  # Was 100
```

### Add Custom Checks

Edit `scripts/preflight.sh`:
```bash
# Add your checks
npm run custom-validation
npm run api-contract-check
```

---

## 🎓 Learning Path

### Week 1: Start Simple
```
Day 1-2: Submit doc updates (risk:low)
Day 3-4: Submit typo fixes (risk:low)
Day 5:   Review how auto-merge works
```

### Week 2: Add Complexity
```
Day 1-2: Submit bug fixes (risk:medium)
Day 3-4: Watch review/approval process
Day 5:   Submit your first feature (risk:medium)
```

### Week 3: Advanced
```
Day 1-2: Multi-file changes
Day 3-4: High-risk tasks with approvals
Day 5:   Optimize based on learnings
```

---

## 📞 Get Help

### Task Not Starting?
1. Check issue has `ai-task` label
2. Verify workflow enabled: `gh workflow list`
3. Check workflow logs: `gh run view --log`

### Task Failed?
1. View logs: `gh run view RUN_ID --log`
2. Check error in issue comments
3. Resubmit with more context

### PR Not Auto-Merging?
1. Verify risk:low label
2. Check CI status: `gh pr checks PR_NUM`
3. Look for merge conflicts
4. Manually merge if needed: `gh pr merge PR_NUM`

---

## 📚 More Info

- **Full Guide:** `docs/CODEX_COPILOT_AUTOMATION.md`
- **Policy Config:** `.github/codex/policy.yml`
- **Task Template:** `.github/ISSUE_TEMPLATE/task.yml`
- **PR Automation:** `docs/PR_AUTOMATION_GUIDE.md`

---

## ✅ Ready to Start?

**Your first task:**

1. Go to Issues → New Issue
2. Select "AI Task"
3. Try this:
   ```
   Goal: Add your name to CONTRIBUTORS.md
   Branch: main
   Risk: low
   ```
4. Submit and watch the magic! ✨

**Questions?** Check the full guide: `docs/CODEX_COPILOT_AUTOMATION.md`
