# Quick Start: PR Automation

This is a **quick start guide** for automating PR management. For full details, see [PR_AUTOMATION_GUIDE.md](PR_AUTOMATION_GUIDE.md).

---

## 🎯 TL;DR: What You Can Do

Three ways to manage PRs automatically:

1. **Auto-Merge** (✅ Already Active) - Low-risk PRs merge automatically
2. **Stale Management** (🆕 Added) - Old PRs get closed automatically
3. **Manual Script** (🆕 Added) - You batch-process PRs with one command

---

## 🚀 Quick Commands

### Check PR Status
```bash
./scripts/manage-prs.sh status
```

### Merge a Ready PR
```bash
./scripts/manage-prs.sh merge 95
```

### Close Stale PRs (as recommended)
```bash
./scripts/manage-prs.sh close 37 38 40 41 42 43
```

### Test Before Running (Dry Run)
```bash
./scripts/manage-prs.sh --dry-run close 37 38 40 41
```

---

## ⚙️ One-Time Setup (2 minutes)

### 1. Install GitHub CLI
```bash
# macOS
brew install gh

# Ubuntu/Debian
sudo apt install gh

# Windows
winget install GitHub.cli
```

### 2. Login
```bash
gh auth login
# Choose: HTTPS → Login with browser → Authorize
```

### 3. Test
```bash
gh pr list
# Should show your PRs ✅
```

That's it! Now you can use the script.

---

## 📊 What's Automated

### ✅ Already Working

**Auto-Merge Workflow**
- Automatically merges PRs that only change docs/config
- Runs on every PR update
- No setup needed - already active

### 🆕 New Automations

**1. Stale PR Management** (`.github/workflows/stale-pr-management.yml`)
- Runs: Daily at midnight UTC
- Marks PRs stale after 30 days
- Closes PRs after 7 more days (37 days total)
- Exempt labels: `keep-open`, `in-progress`

**2. PR Triage** (`.github/workflows/pr-triage.yml`)
- Runs: On every PR open/update
- Checks: Description, tests, conflicts
- Adds labels: `ready-for-review`, `needs-work`, `needs-rebase`
- Adds helpful comments automatically

**3. Weekly Review Reminder** (`.github/workflows/pr-review-reminder.yml`)
- Runs: Every Monday 9 AM UTC
- Posts: Summary of PRs needing attention
- Shows: Ready for review, approved, stale counts

---

## 🤔 Why Can't Copilot Do This?

**Short Answer:** GitHub security model prevents it.

**Longer Answer:**
- Copilot has **read-only** access to your repo
- It **cannot** authenticate as you
- It **cannot** execute merge/close operations
- It **can** analyze and recommend (which it did!)

**Solution:** Copilot creates automation for YOU to run.

---

## 📋 Next Steps Based on Review

From the PR review document, here's what to do:

### This Week (High Priority)

```bash
# 1. Merge the trivial fix (safe)
./scripts/manage-prs.sh merge 95

# 2. Close duplicate/stale PRs (37, 38, 40, 41 are duplicates)
./scripts/manage-prs.sh close 37 38 40 41 42 43

# 3. Check status of remaining PRs
./scripts/manage-prs.sh status
```

### Review Carefully Before Merge

These need testing first (don't use script yet):
- PR #97 - Migration fix (test migrations first)
- PR #96 - OpenAPI changes (run CI first)
- PR #94 - Build changes (verify build works)
- PR #93 - Big migration refactor (address review comments)

**Use GitHub UI** for these - they need careful review.

---

## 🛡️ Safety Features

All automation includes safety:

- ✅ **Dry run mode** - Test before executing
- ✅ **Confirmation prompts** - No accidental deletions
- ✅ **Exempt labels** - Prevent auto-close with `keep-open`
- ✅ **Detailed logs** - See exactly what happened
- ✅ **Reversible** - Can reopen closed PRs

---

## 🔧 Customization

### Prevent a PR from Auto-Closing

Add label `keep-open` or `in-progress`:
```bash
gh pr edit 89 --add-label "keep-open"
```

### Change Stale Thresholds

Edit `.github/workflows/stale-pr-management.yml`:
```yaml
days-before-pr-stale: 30  # Change to 60 for longer
days-before-pr-close: 7   # Change to 14 for more warning time
```

### Disable Automation

```bash
# Disable stale PR automation
gh workflow disable stale-pr-management.yml

# Re-enable later
gh workflow enable stale-pr-management.yml
```

---

## 📚 More Information

- **Full Guide:** [PR_AUTOMATION_GUIDE.md](PR_AUTOMATION_GUIDE.md)
- **PR Analysis:** [PR_REVIEW_RECOMMENDATIONS.md](PR_REVIEW_RECOMMENDATIONS.md)
- **Script Help:** `./scripts/manage-prs.sh --help`

---

## ❓ Common Questions

**Q: Will this delete important work?**
A: No. Automation only closes after 37 days + warning + you can prevent with labels.

**Q: Can I undo a close?**
A: Yes! Just reopen the PR. Comments and history are preserved.

**Q: What if CI is failing?**
A: Auto-merge won't work. Manual merge is required (as it should be).

**Q: How do I merge the important PRs?**
A: Use the script for safe ones, use GitHub UI for critical ones. See review doc for recommendations.

**Q: Can I trust the recommendations?**
A: They're based on PR age, activity, and content analysis. Always review before closing recent/important PRs.

---

## 🎉 You're Ready!

You now have:
- ✅ Automated stale PR cleanup
- ✅ Automated PR triage and labeling
- ✅ Weekly review summaries
- ✅ Manual script for batch operations
- ✅ Existing auto-merge for docs/config

**Start here:**
```bash
./scripts/manage-prs.sh status
```

Then follow the recommendations in [PR_REVIEW_RECOMMENDATIONS.md](PR_REVIEW_RECOMMENDATIONS.md)!
