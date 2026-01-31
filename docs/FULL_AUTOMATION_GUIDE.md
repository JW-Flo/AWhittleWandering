# Full Infrastructure Automation Guide

## 🎯 Overview

This guide explains how the Codex system can now **fully automate** the management of:
- ✅ **Pull Requests** - Create, update, merge, and close automatically
- ✅ **GitHub Actions** - Generate, update, and fix workflows automatically
- ✅ **Cloudflare Configs** - Manage wrangler.toml and deployments automatically

**Result:** The system can modify itself, heal itself, and deploy itself—with appropriate safety guardrails.

---

## 🚀 What's New

### Previous Capabilities
- Create code changes
- Run tests and linting
- Generate reports
- Create PRs (manually)

### New Capabilities
- ✅ **Automated PR Management**
  - Create PRs with proper titles, descriptions, labels
  - Update existing PRs
  - Auto-merge low-risk PRs
  - Close stale PRs
  
- ✅ **Self-Modifying Workflows**
  - Generate new GitHub Actions workflows
  - Update existing workflows (dependencies, steps, actions)
  - Fix broken workflows automatically
  - Optimize workflow performance
  
- ✅ **Cloudflare Self-Management**
  - Update wrangler.toml configurations
  - Add KV namespaces and bindings
  - Configure multi-environment setups
  - Manage deployment settings

---

## 📝 How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Task Submission                           │
│  "Update the deployment workflow to use Node 20"            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              Task Type Classification                        │
│  Detects: infrastructure + workflow-update                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│           Infrastructure Agent Invoked                       │
│  - Analyzes current workflow                                 │
│  - Identifies needed changes                                 │
│  - Validates safety                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              Automation Scripts Execute                      │
│  - Creates feature branch                                    │
│  - Updates workflow file                                     │
│  - Validates changes                                         │
│  - Commits and pushes                                        │
│  - Creates PR automatically                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                 CI/CD Verification                           │
│  - Workflow syntax validated                                 │
│  - Tests run                                                 │
│  - Security scanned                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│            Auto-Merge (if approved)                          │
│  - Low-risk: merges immediately                              │
│  - High-risk: waits for approval                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Usage Examples

### Example 1: PR Management

**Task:** "Create a PR for the current changes with appropriate labels"

**What Happens:**
1. System detects infrastructure task type
2. Gathers current changes via `git diff`
3. Generates meaningful PR title and description
4. Analyzes changes for risk level
5. Adds appropriate labels (bug/feature/docs, risk level)
6. Creates PR via GitHub API
7. Links to source issue
8. Posts PR link to issue

**Result:** PR #456 created in <5 seconds

### Example 2: Workflow Update

**Task:** "Update all workflows to use actions/checkout@v4"

**What Happens:**
1. Infrastructure agent scans all workflow files
2. Identifies workflows using v3
3. Creates feature branch `auto/update-checkout-v4`
4. Updates each workflow file
5. Validates YAML syntax
6. Commits changes
7. Creates PR with detailed changelog
8. Auto-merge enabled (low risk)

**Result:** 18 workflows updated via single PR

### Example 3: Cloudflare Configuration

**Task:** "Add a KV namespace binding for session storage to production"

**What Happens:**
1. Agent reads `backend/edge-worker/wrangler.toml`
2. Identifies production environment section
3. Adds new KV namespace configuration:
   ```toml
   [[env.production.kv_namespaces]]
   binding = "SESSIONS"
   id = "placeholder-id"
   ```
4. Validates TOML syntax
5. Updates deployment documentation
6. Creates PR with instructions for setting actual namespace ID
7. Requires manual approval (production change)

**Result:** Config updated, ready for namespace creation in Cloudflare

### Example 4: Self-Healing

**Task:** "Fix the failing deployment workflow"

**What Happens:**
1. System detects workflow failure from CI
2. Infrastructure agent analyzes error logs
3. Identifies: deprecated Node.js version
4. Updates workflow to use Node 20
5. Re-validates workflow
6. Creates PR with fix
7. Auto-merges after CI passes
8. Workflow now succeeds

**Result:** Self-healed in <10 minutes

### Example 5: Complex Automation

**Task:** "Review deployment process, update workflows to be more efficient, and configure staging environment in Cloudflare"

**Multi-Phase Execution:**

**Phase 1: Analysis**
- Platform analyst reviews deployment workflows
- Identifies 3 bottlenecks
- Creates analysis report

**Phase 2: Workflow Updates**
- Infrastructure agent optimizes workflows:
  - Adds caching for dependencies
  - Parallelizes independent jobs
  - Updates to latest action versions
- Creates PR for workflow changes

**Phase 3: Cloudflare Config**
- Adds staging environment to wrangler.toml
- Configures separate KV namespaces
- Updates deployment scripts
- Creates PR for config changes

**Phase 4: Documentation**
- Updates DEPLOYMENT.md
- Adds new staging deployment guide
- Creates PR for docs

**Result:** 3 PRs created, all linked to original issue

---

## 🔧 Available Operations

### PR Operations

#### Create PR
```bash
# Via script
./ops/infrastructure-automation.sh pr-create \
  "Fix: Update dependency versions" \
  "Updates all dependencies to latest stable versions" \
  "main" \
  "dependencies,automated"

# Via task
"Create a PR for the current changes with title 'feat: Add caching'"
```

#### Update PR
```bash
# Add label
./ops/infrastructure-automation.sh pr-update 123 labels "high-priority"

# Update description
./ops/infrastructure-automation.sh pr-update 123 body "Updated description"

# Via task
"Update PR #123 to add reviewer @username"
```

#### Merge PR
```bash
# Squash merge
./ops/infrastructure-automation.sh pr-merge 123 squash

# Auto-merge when ready
./ops/infrastructure-automation.sh pr-auto-merge 123

# Via task
"Merge PR #123 when CI passes"
```

### Workflow Operations

#### Update Workflow
```bash
# Update action version
./ops/infrastructure-automation.sh workflow-update \
  deploy-backend.yml \
  update-action \
  "actions/checkout@v3" \
  "actions/checkout@v4"

# Via task
"Update all workflows to use actions/checkout@v4"
"Add caching to the CI workflow"
"Fix the deployment workflow error"
```

#### Validate Workflow
```bash
# Check syntax
./ops/infrastructure-automation.sh workflow-validate deploy-backend.yml

# Via task
"Validate all workflow files for syntax errors"
```

#### Generate Workflow
```
Task: "Create a new workflow to deploy to staging automatically on merge to staging branch"

Result:
- New file: .github/workflows/auto-deploy-staging.yml
- Proper triggers, jobs, steps
- Uses existing secrets
- Tested syntax
- PR created for review
```

### Wrangler Operations

#### Update Config
```bash
# Update worker name
./ops/infrastructure-automation.sh wrangler-update \
  backend/edge-worker/wrangler.toml \
  update-name \
  "my-worker-v2"

# Update compatibility date
./ops/infrastructure-automation.sh wrangler-update \
  backend/edge-worker/wrangler.toml \
  update-compat-date \
  "2024-01-01"

# Via task
"Update wrangler.toml to use compatibility_date 2024-01-01"
"Add a new environment variable to production config"
```

#### Add Bindings
```
Task: "Add a KV namespace for user sessions"

Steps:
1. Adds to wrangler.toml:
   [[kv_namespaces]]
   binding = "SESSIONS"
   id = "placeholder"

2. Updates docs with:
   - Create namespace: wrangler kv:namespace create SESSIONS
   - Get ID and replace placeholder
   - Deploy: wrangler deploy

3. Creates PR with instructions
```

#### Validate Config
```bash
# Check TOML syntax
./ops/infrastructure-automation.sh wrangler-validate \
  backend/edge-worker/wrangler.toml

# Via task
"Validate all wrangler.toml files for syntax and security issues"
```

---

## 🛡️ Safety Guardrails

### Automatic Protections

#### PR Safety
- ✅ Never force-push to protected branches (main, staging)
- ✅ Always link PRs to source issues
- ✅ Require CI passing before merge
- ✅ Respect approval requirements from policy
- ✅ Auto-merge only for low-risk changes

#### Workflow Safety
- ✅ Never commit secrets to workflow files
- ✅ Always use `${{ secrets.NAME }}` references
- ✅ Test workflows in feature branches first
- ✅ Validate YAML syntax before committing
- ✅ Preserve existing workflow logic unless explicitly updating

#### Cloudflare Safety
- ✅ Never commit actual secret values
- ✅ Use placeholders for secrets (manual setup required)
- ✅ Preserve existing bindings (don't delete unless asked)
- ✅ Test config changes in dev environment first
- ✅ Maintain compatibility_date to prevent breaking changes

### Approval Requirements

**Automatic (No Approval Needed):**
- Doc updates
- Dev/staging workflow changes
- Non-production Wrangler updates
- Dependency version updates
- Linting/formatting changes

**Requires 1 Approval:**
- Production workflow changes
- New workflow creation
- Workflow logic changes
- Staging Wrangler updates

**Requires 2 Approvals:**
- Production Wrangler changes
- Security-related workflow changes
- Branch protection changes
- Breaking changes to CI/CD

**Never Automatic:**
- Deleting workflows
- Removing security checks
- Changing branch protection rules
- Modifying CODEOWNERS
- Deleting Cloudflare resources

---

## 🎓 Advanced Scenarios

### Scenario 1: Continuous Improvement

**Task:** "Review all workflows monthly and optimize them"

**Implementation:**
```yaml
# .github/workflows/monthly-optimization.yml
name: Monthly Workflow Optimization

on:
  schedule:
    - cron: '0 0 1 * *'  # First day of month
  workflow_dispatch:

jobs:
  optimize:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Create optimization task
        run: |
          gh issue create \
            --title "Monthly workflow optimization" \
            --body "Review all workflows and identify optimization opportunities" \
            --label "ai-task,infrastructure,automated"
```

**Result:** System reviews and optimizes itself monthly

### Scenario 2: Self-Healing CI/CD

**Workflow Failure Detection:**
```yaml
# .github/workflows/ci-health-monitor.yml
on:
  workflow_run:
    workflows: ["*"]
    types: [completed]

jobs:
  check-failure:
    if: ${{ github.event.workflow_run.conclusion == 'failure' }}
    runs-on: ubuntu-latest
    steps:
      - name: Create fix task
        run: |
          gh issue create \
            --title "Fix failing workflow: ${{ github.event.workflow_run.name }}" \
            --body "Workflow failed. Please analyze and fix." \
            --label "ai-task,infrastructure,urgent"
```

**Result:** System detects and fixes its own failures

### Scenario 3: Infrastructure as Code

**Task:** "Audit all infrastructure configurations and create a report"

**Result:**
- Scans all workflows
- Reads all wrangler.toml files
- Analyzes dependencies
- Identifies outdated actions
- Lists security concerns
- Creates comprehensive report
- Generates issues for each problem
- Prioritizes by severity

### Scenario 4: Zero-Touch Deployments

**Setup:**
```yaml
# .github/workflows/auto-deploy-on-merge.yml
on:
  pull_request:
    types: [closed]
    branches: [main, staging, dev]

jobs:
  deploy:
    if: github.event.pull_request.merged == true
    steps:
      - name: Trigger deployment
        run: |
          gh workflow run deploy-backend.yml \
            --field environment=${{ github.event.pull_request.base.ref }}
```

**Result:** Merging PR automatically deploys to appropriate environment

---

## 📊 Monitoring Automation

### Track Automation Success

**Metrics to Monitor:**
```json
{
  "prs_created_automatically": 42,
  "prs_merged_automatically": 38,
  "workflows_fixed_automatically": 5,
  "configs_updated_automatically": 12,
  "time_saved_hours": 18,
  "manual_interventions_needed": 3,
  "success_rate": "95%"
}
```

### Automation Dashboard

Create issue to track:
```
Task: "Create monthly automation report"

Report includes:
- PRs created/merged automatically
- Workflows updated/fixed
- Configs modified
- Time saved estimate
- Issues requiring manual intervention
- Success rate trends
```

---

## ⚠️ Limitations & Considerations

### Current Limitations

1. **Complex YAML/TOML Edits**
   - Simple changes automated
   - Complex structural changes may need manual editing
   - Use YAML/TOML parsers when available

2. **Secret Management**
   - Can reference secrets in configs
   - Cannot create/rotate secrets automatically (requires Cloudflare/GitHub access)
   - Placeholders used for new secrets

3. **Cloudflare Resource Creation**
   - Can update configurations
   - Cannot create KV namespaces, Durable Objects, etc. automatically
   - Requires manual Cloudflare dashboard or wrangler CLI usage

4. **Approval Workflows**
   - High-risk changes still need human approval
   - Cannot override branch protection rules
   - Maintains safety over speed

### Best Practices

1. **Start with Non-Production**
   - Test automation on dev/staging first
   - Validate changes before production

2. **Review Auto-Generated PRs**
   - Spot-check automated PRs
   - Ensure quality remains high

3. **Monitor Automation**
   - Track success rates
   - Identify patterns in failures
   - Adjust automation rules

4. **Maintain Human Oversight**
   - Keep humans in critical decision loops
   - Use automation for routine tasks
   - Human judgment for strategic decisions

---

## 🎯 Summary

### What You Can Now Do

**Submit vague infrastructure tasks:**
```
"Make the deployment faster"
"Fix the broken CI"
"Add staging environment"
"Update everything to latest versions"
```

**System handles end-to-end:**
1. Analyzes current state
2. Identifies improvements
3. Updates files (workflows, configs)
4. Creates PRs automatically
5. Runs validation
6. Merges when safe
7. Deploys changes
8. Reports results

**All with appropriate safety guardrails and approval workflows.**

### Key Benefits

- ✅ **Self-Modifying** - System can update itself
- ✅ **Self-Healing** - Detects and fixes issues automatically
- ✅ **Self-Improving** - Continuously optimizes workflows
- ✅ **Fully Automated** - Manages PRs, workflows, and configs
- ✅ **Safe** - Multiple guardrails and approval requirements
- ✅ **Auditable** - All changes tracked in Git
- ✅ **Reversible** - Can rollback via Git history

---

## 🚀 Getting Started

**Your first automated infrastructure task:**

1. Submit issue: "Update all workflows to use latest actions"
2. System analyzes all workflows
3. Creates branch with updates
4. Creates PR with detailed changelog
5. Auto-merges after CI passes
6. Issue closes automatically

**Time from submit to done: ~5 minutes for simple changes, 10-30 minutes for complex changes!**

The system can now truly manage itself end-to-end! 🎉
