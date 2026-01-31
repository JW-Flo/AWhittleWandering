# Codex Integration Architecture

## System Overview

This document explains how GitHub Copilot agent integrates with the Codex autonomous CI/CD pipeline to provide end-to-end task automation.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Creates issue with
                              │ ai-task label
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    TASK-RUNNER WORKFLOW                          │
│                  (.github/workflows/task-runner.yml)             │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ↓             ↓             ↓
         ┌──────────┐  ┌──────────┐  ┌──────────┐
         │ Validate │  │  Parse   │  │  Setup   │
         │   Task   │  │   Task   │  │   Env    │
         └──────────┘  └──────────┘  └──────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   TASK ORCHESTRATOR                              │
│                   (ops/task-runner.sh)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              COPILOT AGENT INTEGRATION                           │
│           (ops/copilot-agent-integration.sh)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Posts @copilot mention
                              │ to issue with task context
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    GITHUB COPILOT AGENT                          │
│              (GitHub's AI Coding Assistant)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Analyzes codebase
                              │ Implements changes
                              │ Creates PR
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        PULL REQUEST                              │
│                    (Automated PR Created)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ↓             ↓             ↓
         ┌──────────┐  ┌──────────┐  ┌──────────┐
         │ Preflight│  │ Security │  │  Tests   │
         │  Checks  │  │   Scan   │  │          │
         └──────────┘  └──────────┘  └──────────┘
                              │
                              ↓ All checks pass
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ↓ risk:low                  ↓ risk:medium/high
┌─────────────────────────┐   ┌─────────────────────────┐
│   AUTO-MERGE WORKFLOW   │   │    MANUAL REVIEW        │
│  (auto-merge.yml)       │   │   (Requires approval)   │
└─────────────────────────┘   └─────────────────────────┘
                │                           │
                │ Merges automatically      │ Waits for approval
                │ when CI passes            │ then merges
                │                           │
                └─────────────┬─────────────┘
                              ↓
                    ┌──────────────────┐
                    │  BRANCH MERGED   │
                    │  ISSUE CLOSED    │
                    └──────────────────┘
                              │
                              ↓
                    ┌──────────────────┐
                    │    DEPLOYED      │
                    │  (if configured) │
                    └──────────────────┘
```

---

## Component Details

### 1. Task-Runner Workflow
**File:** `.github/workflows/task-runner.yml`

**Responsibilities:**
- Validates task format and security
- Parses task goals and configuration
- Sets up working environment
- Orchestrates the entire process
- Creates PR when changes are ready
- Handles auto-merge for low-risk tasks

**Triggers:**
- Issue opened with `ai-task` label
- Comment with `@codex` mention
- Manual dispatch via workflow_dispatch

### 2. Task Orchestrator
**File:** `ops/task-runner.sh`

**Responsibilities:**
- Validates environment variables
- Loads AI system prompts
- Invokes Copilot agent integration
- Manages verification loops
- Handles git operations (commit, push)
- Triggers subagents on failures

**Key Functions:**
- `validate_environment()` - Ensures all required vars set
- `invoke_codex_agent()` - Calls Copilot integration
- `verification_loop()` - Runs checks with retry logic
- `commit_changes()` - Commits with proper attribution

### 3. Copilot Agent Integration
**File:** `ops/copilot-agent-integration.sh`

**Responsibilities:**
- Posts @copilot mention to issue
- Formats comprehensive task prompt
- Waits for agent acknowledgment
- Detects agent-created PRs
- Provides fallback mechanisms

**Integration Method:**
The script uses GitHub's native @copilot mention system, which:
1. Triggers the Copilot agent within GitHub
2. Agent has full repo context
3. Agent creates PR directly
4. Maintains GitHub's security model

### 4. GitHub Copilot Agent
**Provider:** GitHub (Built-in)

**Capabilities:**
- Analyzes entire codebase
- Understands task requirements
- Implements changes following best practices
- Creates well-formatted PRs
- Responds to feedback and iterations

**Access:** Enabled via GitHub Copilot subscription

### 5. Auto-Merge System
**Files:** 
- `.github/workflows/auto-merge.yml`
- `.github/workflows/task-runner.yml` (auto-merge job)

**Responsibilities:**
- Classifies PRs by risk level
- Enables auto-merge for low-risk
- Enforces review requirements
- Merges when CI passes

**Risk Classification:**
```yaml
Low Risk (auto-merge):
  - Only docs/config changed
  - < 3 files modified
  - < 100 lines changed

Medium Risk (1 approval):
  - Runtime code changed
  - < 10 files modified
  - < 500 lines changed

High Risk (2 approvals):
  - Security/auth changes
  - > 10 files or > 500 lines
  - Multiple modules affected
```

---

## Data Flow

### 1. Task Submission
```
User creates issue
    ↓
Issue has ai-task label
    ↓
Task-Runner workflow triggered
    ↓
Workflow validates format
    ↓
Task parsed into structured data
```

### 2. Agent Invocation
```
Orchestrator calls copilot-agent-integration.sh
    ↓
Script posts @copilot mention to issue
    ↓
Mention includes:
  - Task goal
  - Implementation instructions
  - Security requirements
  - Verification steps
    ↓
GitHub Copilot agent receives notification
```

### 3. Agent Processing
```
Agent analyzes:
  - Issue description
  - Codebase structure
  - Related files
  - Test patterns
  - Documentation
    ↓
Agent implements:
  - Required code changes
  - Tests (if applicable)
  - Documentation updates
    ↓
Agent creates PR:
  - Descriptive title
  - Detailed body
  - Links to issue
```

### 4. Verification Pipeline
```
PR created
    ↓
CI/CD triggers:
  - Preflight checks (lint, typecheck)
  - Security scan (secrets, vulnerabilities)
  - Test suite (unit, integration)
  - Build verification
    ↓
Results reported to PR
    ↓
If failures: CI-Reviewer subagent invoked
    ↓
Iterate until success or max attempts
```

### 5. Merge Decision
```
All checks pass
    ↓
Risk level determined:
  - File paths analyzed
  - Change magnitude assessed
  - Security impact evaluated
    ↓
If low risk:
  → Auto-merge enabled
  → Merges immediately
  → Branch deleted
    ↓
If medium/high risk:
  → Requires approval(s)
  → Notifies reviewers
  → Waits for approval
  → Merges after approval
```

### 6. Cleanup
```
PR merged
    ↓
Issue automatically closed (via "Closes #N")
    ↓
Working branch deleted
    ↓
Deployment triggered (if configured)
    ↓
Task complete
```

---

## Security Model

### 1. Input Validation
```yaml
Checks:
  - No secret patterns in task description
  - No malicious commands in context
  - Task format is valid
  - Branch exists and is accessible
```

### 2. Path Restrictions
```yaml
Allowed:
  - backend/* (runtime code)
  - frontend/* (UI code)
  - shared/* (libraries)
  - docs/* (documentation)

Restricted:
  - .env* (environment files)
  - ops/secrets/* (secrets)
  - *.pem, *.key (certificates)
  - wrangler.toml (CF config - has secrets)
```

### 3. Command Allowlist
Only these commands can be executed:
- Package managers: npm, pnpm, yarn
- Development: node, npx
- Version control: git
- Deployment: wrangler (Cloudflare)
- Utilities: jq, rg (ripgrep)

All other commands are blocked.

### 4. Rate Limiting
```yaml
Tasks: 20/hour, 100/day
Deployments: 5/hour, 20/day
API Calls: 30/minute, 500/hour
```

### 5. Review Requirements
```yaml
By Risk Level:
  Low: No review (auto-merge)
  Medium: 1 approval required
  High: 2 approvals + maintainer required
  
By Path:
  API routes: Always requires review
  Auth middleware: Always requires review
  Schema changes: Always requires review
  CI/CD changes: Always requires review
```

---

## Integration Points

### 1. With Existing PR Automation
```
Task-Runner creates PR
    ↓
PR Triage workflow labels it
    ↓
Auto-Merge workflow assesses risk
    ↓
Stale PR Management monitors it
    ↓
Weekly Review includes it in summary
```

All existing PR automation works seamlessly with task-generated PRs.

### 2. With Branch Strategy
```
Tasks can target:
  - dev (development environment)
  - staging (staging environment)
  - main (production - requires extra approval)

Each has appropriate deployment automation.
```

### 3. With Secret Management
```
Tasks reference secrets abstractly:
  "Use STRIPE_API_KEY from 1Password"

Never:
  "Use sk_live_abc123xyz"

Agent knows to use environment variables.
```

---

## Monitoring and Observability

### View Task Status
```bash
# All active tasks
gh issue list --label ai-task --state open

# Task workflow runs
gh run list --workflow=task-runner.yml

# Specific task logs
gh run view RUN_ID --log
```

### View Agent Activity
```bash
# PRs created by agent
gh pr list --author copilot

# Agent comments on issues
gh issue view ISSUE_NUM
```

### Metrics
```bash
# Success rate
gh run list --workflow=task-runner.yml --json conclusion

# Average time to merge
gh pr list --label ai-task --state merged --json createdAt,mergedAt

# Risk distribution
gh pr list --label ai-task --json labels
```

---

## Failure Modes and Recovery

### 1. Agent Doesn't Respond
**Symptoms:** No @copilot acknowledgment
**Recovery:** 
- Wait 5 minutes (may be processing)
- Check if Copilot enabled for repo
- Manually trigger: Re-mention @copilot
- Fallback: Implement manually

### 2. CI Checks Fail
**Symptoms:** Red X on PR checks
**Recovery:**
- CI-Reviewer subagent auto-invoked
- Max 3 fix iterations
- If still failing: Manual intervention needed
- Review logs: `gh run view --log`

### 3. Auto-Merge Doesn't Trigger
**Symptoms:** Low-risk PR not merging
**Recovery:**
- Check CI status: `gh pr checks PR_NUM`
- Verify risk:low label exists
- Check for merge conflicts
- Manually enable: `gh pr merge --auto`

### 4. High Resource Usage
**Symptoms:** Rate limit errors
**Recovery:**
- Rate limits auto-enforce
- Wait for reset (hourly)
- Prioritize critical tasks
- Consider increasing limits in policy.yml

---

## Future Enhancements

### Planned Improvements
1. **Direct API Integration** - Call Copilot API directly (when available)
2. **Enhanced Context** - Provide agent with more codebase context
3. **Multi-Iteration Tasks** - Handle complex tasks requiring multiple PRs
4. **A/B Testing** - Compare agent implementations
5. **Learning Feedback** - Train on successful patterns

### Experimental Features
1. **Parallel Task Processing** - Multiple tasks simultaneously
2. **Dependent Tasks** - Chain tasks with dependencies
3. **Approval Workflows** - Custom approval routing
4. **Cost Optimization** - Smart agent invocation
5. **Performance Metrics** - Detailed analytics dashboard

---

## Configuration Reference

### Environment Variables
```bash
ISSUE_NUMBER      # GitHub issue number
TASK_GOAL         # Parsed goal from issue
TARGET_BRANCH     # Branch to target (dev/staging/main)
RISK_LEVEL        # low/medium/high
VERIFY_TIER       # lite/full
WORK_BRANCH       # Working branch name
GH_TOKEN          # GitHub token (auto-provided)
OPENAI_API_KEY    # Optional, for direct API calls
```

### Policy File
**Location:** `.github/codex/policy.yml`
**Configures:**
- Risk classification rules
- Auto-merge thresholds
- Path permissions
- Rate limits
- Branch strategy
- Subagent configuration

### Task Template
**Location:** `.github/ISSUE_TEMPLATE/task.yml`
**Defines:**
- Required fields
- Field validation
- Help text
- Default values

---

## Summary

This architecture provides:
- ✅ **Fully Automated** - From task to merged PR
- ✅ **Secure** - Multiple security layers
- ✅ **Auditable** - All actions logged
- ✅ **Flexible** - Risk-based automation
- ✅ **Recoverable** - Subagent error correction
- ✅ **Scalable** - Handles concurrent tasks
- ✅ **Maintainable** - Clear separation of concerns

**Result:** Submit tasks via issues, get merged PRs automatically!
