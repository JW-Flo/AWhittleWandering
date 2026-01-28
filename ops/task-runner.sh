#!/usr/bin/env bash
# Autonomous Task Runner Script
# This script is executed by the GitHub Actions workflow to handle a Task issue:
# it fetches the issue details, invokes Codex to implement the task, runs
# verification, and opens a PR.

set -euo pipefail
IFS=$'\n\t'

echo "[task-runner] Starting autonomous task runner..."

# Load issue details from GitHub Actions environment variables or event payload
ISSUE_NUMBER=${ISSUE_NUMBER:-${GITHUB_EVENT_NUMBER:-}}
ISSUE_TITLE=${ISSUE_TITLE:-${GITHUB_EVENT_TITLE:-}}
ISSUE_BODY=${ISSUE_BODY:-}

# If ISSUE_BODY is not provided directly, try to extract from event JSON
if [[ -z "$ISSUE_BODY" && -n "${GITHUB_EVENT_PATH:-}" ]]; then
  ISSUE_BODY=$(jq -r '.issue.body' "$GITHUB_EVENT_PATH")
fi

# Basic logging of the task
echo "[task-runner] Task Issue #${ISSUE_NUMBER}: ${ISSUE_TITLE}"
echo "---------- Issue Description ----------"
echo "$ISSUE_BODY"
echo "---------------------------------------"

# Determine risk tier from issue body (default to Medium if not found)
RISK_TIER="Medium"
if echo "$ISSUE_BODY" | grep -qi "Risk Tier: High"; then
  RISK_TIER="High"
elif echo "$ISSUE_BODY" | grep -qi "Risk Tier: Low"; then
  RISK_TIER="Low"
fi
echo "[task-runner] Detected Risk Tier: $RISK_TIER"

# Decide target branch based on risk tier
BASE_BRANCH="dev"
if [[ "$RISK_TIER" == "Low" ]]; then
  BASE_BRANCH="staging"
fi
WORK_BRANCH="task-${ISSUE_NUMBER:-$(date +%s)}"

# Ensure base branches are fetched
git fetch origin "$BASE_BRANCH" || true
git fetch origin main || true

# Create and switch to a new working branch for this task
if git rev-parse --verify origin/"$BASE_BRANCH" >/dev/null 2>&1; then
  git checkout -b "$WORK_BRANCH" origin/"$BASE_BRANCH"
else
  echo "[task-runner] Warning: base branch '$BASE_BRANCH' not found on origin. Using 'main' as base."
  git checkout -b "$WORK_BRANCH" origin/main
fi

echo "[task-runner] Created and switched to branch $WORK_BRANCH (base $BASE_BRANCH)."

# Set up environment (install dependencies, etc.) for Codex
# Ensure Node and Wrangler (for CF) are available if needed
if [[ -f "package.json" ]]; then
  echo "[task-runner] Installing dependencies..."
  if [[ -f "pnpm-lock.yaml" ]]; then
    pnpm install --frozen-lockfile || pnpm install
  elif [[ -f "yarn.lock" ]]; then
    yarn install --frozen-lockfile || yarn install
  else
    npm ci || npm install
  fi
fi

# (Optional) Install Wrangler CLI if Cloudflare Workers present
if [[ -f "backend/edge-worker/wrangler.toml" ]]; then
  echo "[task-runner] Detected Cloudflare Worker config. Installing Wrangler CLI..."
  npm install -g wrangler@3 >/dev/null 2>&1 || echo "Wrangler install skipped (already installed)."
fi

# Prepare the Codex prompt
read -r -d '' CODEX_PROMPT <<EOF || true
You are an autonomous AI developer integrated with a CI/CD pipeline. You have
been assigned the following task:

"""
Issue #${ISSUE_NUMBER}: ${ISSUE_TITLE}

${ISSUE_BODY}
"""

Follow the established project instructions and constraints to:
1. **Plan** the changes needed to complete the task.
2. **Implement** the changes with minimal, auditable diffs, following all
   security and quality rules.
3. **Verify** by running lint, type checks, tests, and any Cloudflare build
   checks, iterating if failures occur.
4. **Review** the final changes using subagent roles (CI Reviewer, Security
   Linter, Cloudflare Auditor, Route Verifier) to ensure compliance.
5. **Prepare** a Pull Request with a description (using the template in .ai/
   COMMANDS/create-pr.md) and appropriate labeling.

Rules, context, and subagent instructions are available in the repository (.ai/
and docs/ directories). Adhere strictly to the risk tier policies (this task is
marked "${RISK_TIER}" risk).

Begin by formulating a plan, then carry out the implementation and verification
automatically. End by outputting a final message indicating success and
summarizing the changes.
EOF

echo "[task-runner] Codex prompt prepared."
echo "---------- Codex Prompt ----------"
echo "$CODEX_PROMPT"
echo "----------------------------------"

# Run preflight checks before Codex execution
echo "[task-runner] Running preflight checks..."
if [[ -f "scripts/preflight.sh" ]]; then
  bash scripts/preflight.sh || {
    echo "[task-runner] Preflight checks failed. Aborting."
    exit 1
  }
fi

# Run security scan
echo "[task-runner] Running security scan..."
if [[ -f "scripts/security-scan.sh" ]]; then
  bash scripts/security-scan.sh || {
    echo "[task-runner] Security scan found issues. Review required."
    # Don't exit - let human review handle it
  }
fi

# At this point, the actual Codex API call would be made
# This is a placeholder for the integration point
echo "[task-runner] Codex execution point (API integration required)"

# Post-implementation verification
echo "[task-runner] Running post-implementation verification..."
if [[ -f "scripts/preflight.sh" ]]; then
  bash scripts/preflight.sh || {
    echo "[task-runner] Post-implementation checks failed."
    exit 1
  }
fi

# Prepare commit and PR
echo "[task-runner] Preparing commit..."
git config user.name "${GIT_USER_NAME:-Codex Bot}"
git config user.email "${GIT_USER_EMAIL:-codex-bot@awhittlewandering.com}"

# Check if there are changes to commit
if git diff --quiet && git diff --cached --quiet; then
  echo "[task-runner] No changes to commit."
else
  git add -A
  git commit -m "codex: implement #${ISSUE_NUMBER} - ${ISSUE_TITLE}"
  git push -u origin "$WORK_BRANCH"
  echo "[task-runner] Changes committed and pushed to $WORK_BRANCH"
fi

# Output PR creation instructions
echo "[task-runner] Task runner complete."
echo "---------- Next Steps ----------"
echo "1. Review changes on branch: $WORK_BRANCH"
echo "2. Create PR to merge into: $BASE_BRANCH"
echo "3. Risk Tier: $RISK_TIER"
if [[ "$RISK_TIER" == "High" ]]; then
  echo "   ⚠️  HIGH RISK: Manual review required before merge"
elif [[ "$RISK_TIER" == "Medium" ]]; then
  echo "   ⚡ MEDIUM RISK: Standard review process"
else
  echo "   ✅ LOW RISK: Auto-merge eligible if CI passes"
fi
echo "--------------------------------"
