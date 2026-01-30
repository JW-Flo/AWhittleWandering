# Fully Autonomous Codex CI/CD Pipeline Implementation

> Implementation strategy based on the Codex CI/CD Pipeline guide, mapped to the AWhittleWandering infrastructure.

## Executive Summary

This document provides the complete implementation strategy for integrating OpenAI Codex agents into our CI/CD pipeline, enabling fully autonomous code generation, testing, and deployment with appropriate guardrails and human-in-the-loop controls.

---

## Phase 1: Foundation & Policy Configuration

### 1.1 Current State Assessment

| Component | Status | Location |
|-----------|--------|----------|
| CI Preflight | ✅ Active | `.github/workflows/ci-preflight.yml` |
| Security Scanning | ✅ Active | `scripts/security-scan.sh` |
| Secret Sync | ✅ Active | `.github/workflows/sync-secrets.yml` |
| Codex Policy | ⚠️ Basic | `.github/codex/policy.yml` |
| QA Pipeline | ✅ Active | `qa/` directory |
| Deployment Scripts | ✅ Active | `scripts/deploy.sh` |

### 1.2 Policy Configuration Enhancement

**Current `policy.yml`:**
```json
{
  "runtime_code_paths": ["backend/", "frontend/", "shared/"],
  "docs_only_paths": ["docs/", ".github/", "README.md", ...],
  "labels": {
    "default": ["codex:autonomous"],
    "runtime": ["codex:run"]
  }
}
```

**Enhanced Policy Schema:**

```yaml
# .github/codex/policy.yml (YAML format for better readability)
version: "1.0"

# Agent identity and permissions
agent:
  name: "codex-autonomous"
  model: "gpt-4-turbo"
  max_tokens_per_request: 8192
  rate_limit:
    requests_per_minute: 30
    requests_per_hour: 500

# Path-based permissions
paths:
  runtime_code:
    - "backend/"
    - "frontend/"
    - "shared/"
  docs_only:
    - "docs/"
    - ".github/"
    - "*.md"
  restricted:
    - ".env*"
    - "ops/secrets/"
    - "wrangler.toml"
    - "**/credentials*"

# Label-based workflow triggers
labels:
  autonomous:
    name: "codex:autonomous"
    permissions:
      - create_pr
      - modify_code
      - run_tests
    restrictions:
      - no_direct_main_push
      - require_ci_pass
  
  runtime:
    name: "codex:run"
    permissions:
      - execute_scripts
      - deploy_preview
    restrictions:
      - no_production_deploy
      - require_approval

  docs:
    name: "codex:docs-only"
    permissions:
      - modify_docs
      - create_pr
    restrictions:
      - docs_paths_only

# Guardrails
guardrails:
  # Security
  security:
    block_secret_patterns: true
    require_security_scan: true
    scan_dependencies: true
  
  # Code quality
  quality:
    require_lint_pass: true
    require_typecheck: true
    require_tests: true
    min_test_coverage: 80
  
  # Deployment
  deployment:
    require_approval_for_production: true
    auto_rollback_on_failure: true
    health_check_timeout_seconds: 300
    canary_percentage: 10

# Human-in-the-loop triggers
human_review_required:
  - path_matches: "backend/edge-worker/src/routes/**"
  - path_matches: "shared/schemas/**"
  - file_count_exceeds: 10
  - lines_changed_exceeds: 500
  - modifies_security_config: true
  - modifies_deployment_config: true
```

---

## Phase 2: Workflow Architecture

### 2.1 Workflow Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     CODEX CI/CD PIPELINE ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │  codex-trigger   │───►│  codex-validate  │───►│  codex-execute   │  │
│  │  (Issue/PR)      │    │  (Policy Check)  │    │  (Code Gen)      │  │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘  │
│           │                       │                       │             │
│           ▼                       ▼                       ▼             │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │  ci-preflight    │◄───│  security-scan   │◄───│  codex-pr        │  │
│  │  (Existing)      │    │  (Existing)      │    │  (Auto PR)       │  │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘  │
│           │                       │                       │             │
│           ▼                       ▼                       ▼             │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │  qa-pipeline     │───►│  deploy-preview  │───►│  deploy-prod     │  │
│  │  (Existing)      │    │  (New)           │    │  (Gated)         │  │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    ROLLBACK & MONITORING                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │   │
│  │  │ Health Check│  │ Auto Rollback│  │ Alerting   │               │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 New Workflow Files Required

| Workflow | Purpose | Trigger |
|----------|---------|---------|
| `codex-autonomous.yml` | Main Codex orchestration | Issue labeled `codex:autonomous` |
| `codex-pr-review.yml` | Auto-review Codex PRs | PR from `codex/*` branches |
| `deploy-preview.yml` | Preview deployments | PR to `main` |
| `deploy-production.yml` | Production with gates | Push to `main` + approval |
| `rollback-monitor.yml` | Health monitoring | Scheduled + on-demand |

---

## Phase 3: Implementation Details

### 3.1 Codex Autonomous Workflow

```yaml
# .github/workflows/codex-autonomous.yml
name: Codex Autonomous Pipeline

on:
  issues:
    types: [labeled]
  issue_comment:
    types: [created]

permissions:
  contents: write
  pull-requests: write
  issues: write

env:
  CODEX_BRANCH_PREFIX: "codex/"
  MAX_ITERATIONS: 5

jobs:
  validate-trigger:
    if: |
      github.event.label.name == 'codex:autonomous' ||
      (github.event_name == 'issue_comment' && 
       contains(github.event.comment.body, '@codex'))
    runs-on: ubuntu-latest
    outputs:
      should_proceed: ${{ steps.check.outputs.proceed }}
      task_type: ${{ steps.check.outputs.task_type }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Load Policy
        id: policy
        run: |
          POLICY=$(cat .github/codex/policy.yml)
          echo "policy<<EOF" >> $GITHUB_OUTPUT
          echo "$POLICY" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT
      
      - name: Validate Request
        id: check
        run: |
          # Check if issue body contains restricted paths
          ISSUE_BODY="${{ github.event.issue.body }}"
          
          # Block if mentions secrets or credentials
          if echo "$ISSUE_BODY" | grep -qiE "(secret|credential|password|api.?key|token)"; then
            echo "proceed=false" >> $GITHUB_OUTPUT
            echo "::error::Request mentions sensitive content - requires manual review"
            exit 1
          fi
          
          echo "proceed=true" >> $GITHUB_OUTPUT
          echo "task_type=code_change" >> $GITHUB_OUTPUT

  execute-codex:
    needs: validate-trigger
    if: needs.validate-trigger.outputs.should_proceed == 'true'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Create Codex Branch
        id: branch
        run: |
          BRANCH_NAME="${{ env.CODEX_BRANCH_PREFIX }}issue-${{ github.event.issue.number }}-$(date +%s)"
          git checkout -b "$BRANCH_NAME"
          echo "branch_name=$BRANCH_NAME" >> $GITHUB_OUTPUT
      
      - name: Execute Codex Task
        id: codex
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          ISSUE_TITLE: ${{ github.event.issue.title }}
          ISSUE_BODY: ${{ github.event.issue.body }}
        run: |
          # Codex execution logic here
          # This would integrate with OpenAI API
          echo "Codex task execution placeholder"
          echo "changes_made=true" >> $GITHUB_OUTPUT
      
      - name: Run Preflight Checks
        if: steps.codex.outputs.changes_made == 'true'
        run: bash scripts/preflight.sh
      
      - name: Security Scan
        if: steps.codex.outputs.changes_made == 'true'
        run: bash scripts/security-scan.sh
      
      - name: Commit Changes
        if: steps.codex.outputs.changes_made == 'true'
        run: |
          git config user.name "Codex Bot"
          git config user.email "codex-bot@awhittlewandering.com"
          git add -A
          git commit -m "codex: implement #${{ github.event.issue.number }}"
          git push -u origin ${{ steps.branch.outputs.branch_name }}
      
      - name: Create Pull Request
        if: steps.codex.outputs.changes_made == 'true'
        uses: peter-evans/create-pull-request@v6
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          branch: ${{ steps.branch.outputs.branch_name }}
          base: main
          title: "codex: ${{ github.event.issue.title }}"
          body: |
            ## Automated PR from Codex
            
            Closes #${{ github.event.issue.number }}
            
            ### Changes Made
            - Implemented requested changes via Codex autonomous pipeline
            
            ### Verification
            - [ ] CI Preflight passed
            - [ ] Security scan passed
            - [ ] Tests passed
            
            ---
            *This PR was automatically generated by the Codex CI/CD pipeline.*
          labels: |
            codex:autonomous
            automated
          draft: false
```

### 3.2 Deploy Preview Workflow

```yaml
# .github/workflows/deploy-preview.yml
name: Deploy Preview

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write
  deployments: write

jobs:
  preview:
    runs-on: ubuntu-latest
    environment:
      name: preview
      url: ${{ steps.deploy.outputs.preview_url }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy Preview (Frontend)
        id: deploy-frontend
        run: |
          cd frontend
          PREVIEW_URL=$(npx wrangler pages deploy dist \
            --project-name=awhittlewandering \
            --branch=pr-${{ github.event.pull_request.number }} \
            --commit-hash=${{ github.sha }} \
            2>&1 | grep -oP 'https://[^\s]+\.pages\.dev')
          echo "preview_url=$PREVIEW_URL" >> $GITHUB_OUTPUT
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      
      - name: Deploy Preview (Backend)
        id: deploy-backend
        run: |
          cd backend/edge-worker
          npx wrangler deploy --env preview
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      
      - name: Comment Preview URL
        uses: peter-evans/create-or-update-comment@v4
        with:
          issue-number: ${{ github.event.pull_request.number }}
          body: |
            ## 🚀 Preview Deployment Ready
            
            | Environment | URL |
            |-------------|-----|
            | Frontend | ${{ steps.deploy-frontend.outputs.preview_url }} |
            | Backend | Preview worker deployed |
            
            ---
            *Preview will be automatically cleaned up when PR is closed.*
```

### 3.3 Production Deploy with Gates

```yaml
# .github/workflows/deploy-production.yml
name: Deploy Production

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      skip_approval:
        description: 'Skip approval (emergency only)'
        required: false
        default: 'false'

permissions:
  contents: read
  deployments: write

jobs:
  pre-deploy-checks:
    runs-on: ubuntu-latest
    outputs:
      should_deploy: ${{ steps.check.outputs.deploy }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Pre-deployment Checks
        id: check
        run: |
          bash scripts/pre-deployment-check.sh
          echo "deploy=true" >> $GITHUB_OUTPUT

  deploy-canary:
    needs: pre-deploy-checks
    if: needs.pre-deploy-checks.outputs.should_deploy == 'true'
    runs-on: ubuntu-latest
    environment:
      name: canary
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install & Build
        run: |
          npm ci
          npm run build
      
      - name: Deploy Canary (10%)
        run: |
          cd backend/edge-worker
          npx wrangler deploy --env canary
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      
      - name: Health Check (Canary)
        run: |
          sleep 30
          HEALTH=$(curl -sf https://canary-api.awhittlewandering.com/api/v1/health || echo "failed")
          if [ "$HEALTH" == "failed" ]; then
            echo "::error::Canary health check failed"
            exit 1
          fi

  deploy-production:
    needs: deploy-canary
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://awhittlewandering.com
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install & Build
        run: |
          npm ci
          npm run build
      
      - name: Sync Secrets
        run: |
          cd backend/edge-worker
          echo "${{ secrets.TESSIE_API_KEY }}" | npx wrangler secret put TESSIE_API_KEY --env production
          echo "${{ secrets.MAPBOX_ACCESS_TOKEN }}" | npx wrangler secret put MAPBOX_ACCESS_TOKEN --env production
          echo "${{ secrets.OPENWEATHER_API_KEY }}" | npx wrangler secret put OPENWEATHER_API_KEY --env production
          echo "${{ secrets.JWT_SECRET }}" | npx wrangler secret put JWT_SECRET --env production
          echo "${{ secrets.TESLA_VIN }}" | npx wrangler secret put TESLA_VIN --env production
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      
      - name: Deploy Frontend
        run: |
          cd frontend
          npx wrangler pages deploy dist --project-name=awhittlewandering --branch=main
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      
      - name: Deploy Backend
        run: |
          cd backend/edge-worker
          npx wrangler deploy --env production
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      
      - name: Production Health Check
        id: health
        run: |
          sleep 30
          for i in {1..5}; do
            HEALTH=$(curl -sf https://api.awhittlewandering.com/api/v1/health || echo "failed")
            if [ "$HEALTH" != "failed" ]; then
              echo "Health check passed on attempt $i"
              echo "status=healthy" >> $GITHUB_OUTPUT
              exit 0
            fi
            echo "Health check attempt $i failed, retrying..."
            sleep 10
          done
          echo "status=unhealthy" >> $GITHUB_OUTPUT
          exit 1
      
      - name: Trigger Rollback on Failure
        if: failure()
        run: |
          echo "::error::Production deployment failed - initiating rollback"
          cd backend/edge-worker
          npx wrangler rollback --env production
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### 3.4 Rollback & Monitoring Workflow

```yaml
# .github/workflows/rollback-monitor.yml
name: Rollback & Health Monitor

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:
    inputs:
      force_rollback:
        description: 'Force immediate rollback'
        required: false
        default: 'false'

permissions:
  contents: read
  issues: write

jobs:
  health-check:
    runs-on: ubuntu-latest
    outputs:
      frontend_healthy: ${{ steps.check.outputs.frontend }}
      backend_healthy: ${{ steps.check.outputs.backend }}
    steps:
      - name: Check Frontend Health
        id: frontend
        run: |
          STATUS=$(curl -sf -o /dev/null -w "%{http_code}" https://awhittlewandering.com || echo "000")
          if [ "$STATUS" == "200" ]; then
            echo "healthy=true" >> $GITHUB_OUTPUT
          else
            echo "healthy=false" >> $GITHUB_OUTPUT
          fi
      
      - name: Check Backend Health
        id: backend
        run: |
          RESPONSE=$(curl -sf https://api.awhittlewandering.com/api/v1/health || echo '{"status":"error"}')
          if echo "$RESPONSE" | grep -q '"status":"ok"'; then
            echo "healthy=true" >> $GITHUB_OUTPUT
          else
            echo "healthy=false" >> $GITHUB_OUTPUT
          fi
      
      - name: Aggregate Results
        id: check
        run: |
          echo "frontend=${{ steps.frontend.outputs.healthy }}" >> $GITHUB_OUTPUT
          echo "backend=${{ steps.backend.outputs.healthy }}" >> $GITHUB_OUTPUT

  auto-rollback:
    needs: health-check
    if: |
      needs.health-check.outputs.frontend_healthy == 'false' ||
      needs.health-check.outputs.backend_healthy == 'false' ||
      github.event.inputs.force_rollback == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Rollback Backend
        if: needs.health-check.outputs.backend_healthy == 'false'
        run: |
          cd backend/edge-worker
          npx wrangler rollback --env production
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      
      - name: Rollback Frontend
        if: needs.health-check.outputs.frontend_healthy == 'false'
        run: |
          echo "Frontend rollback via Cloudflare Dashboard required"
          # Pages rollback is manual via dashboard
      
      - name: Create Incident Issue
        uses: peter-evans/create-issue-from-file@v5
        with:
          title: "🚨 Auto-Rollback Triggered - $(date -u +%Y-%m-%d_%H:%M:%S)"
          content-filepath: .github/ISSUE_TEMPLATE/incident.md
          labels: |
            incident
            auto-rollback
            priority:high
```

---

## Phase 4: Secret Management Integration

### 4.1 Enhanced Secret Sync

The existing `sync-secrets.yml` workflow handles GitHub → Cloudflare sync. Enhance it for Codex:

```yaml
# Addition to .github/workflows/sync-secrets.yml
  codex-secrets:
    runs-on: ubuntu-latest
    needs: sync-to-cloudflare
    steps:
      - name: Validate Codex API Key
        run: |
          if [ -z "${{ secrets.OPENAI_API_KEY }}" ]; then
            echo "::error::OPENAI_API_KEY not configured"
            exit 1
          fi
          echo "Codex API key validated"
```

### 4.2 Secret Rotation Schedule

| Secret | Rotation Frequency | Automation |
|--------|-------------------|------------|
| `CLOUDFLARE_API_TOKEN` | 90 days | `ops/secrets/rotate-cloudflare-token.mjs` |
| `JWT_SECRET` | 180 days | `ops/secrets/rotate-auth-secrets.mjs` |
| `OPENAI_API_KEY` | On-demand | Manual |
| `TESSIE_API_KEY` | On-demand | Manual |

---

## Phase 5: Observability & Alerting

### 5.1 Structured Logging

Add to all workflows:

```yaml
- name: Log Deployment Event
  run: |
    echo '{"event":"deployment","status":"${{ job.status }}","sha":"${{ github.sha }}","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' >> deployment.log
```

### 5.2 Alert Channels

| Event | Channel | Priority |
|-------|---------|----------|
| Deployment failure | GitHub Issue + Email | High |
| Health check failure | GitHub Issue | Critical |
| Codex task failure | GitHub Comment | Medium |
| Secret rotation due | GitHub Issue | Low |

---

## Phase 6: Cost Controls

### 6.1 Rate Limiting

```yaml
# In policy.yml
rate_limits:
  codex_api:
    requests_per_minute: 30
    requests_per_hour: 500
    max_tokens_per_request: 8192
  
  deployments:
    max_per_hour: 10
    max_per_day: 50
  
  preview_environments:
    max_concurrent: 5
    auto_cleanup_hours: 24
```

### 6.2 Budget Alerts

- OpenAI API: Set spending limit in OpenAI dashboard
- Cloudflare Workers: Monitor via CF analytics
- GitHub Actions: Monitor minutes usage

---

## Implementation Checklist

### Week 1: Foundation
- [ ] Convert `policy.yml` to YAML format with enhanced schema
- [ ] Create `codex-autonomous.yml` workflow
- [ ] Add `OPENAI_API_KEY` to GitHub secrets
- [ ] Test policy validation logic

### Week 2: Deployment Pipeline
- [ ] Create `deploy-preview.yml` workflow
- [ ] Create `deploy-production.yml` workflow
- [ ] Add canary environment to Cloudflare
- [ ] Test preview deployments

### Week 3: Monitoring & Rollback
- [ ] Create `rollback-monitor.yml` workflow
- [ ] Add health check endpoints
- [ ] Configure alerting
- [ ] Test auto-rollback

### Week 4: Integration Testing
- [ ] End-to-end Codex → PR → Deploy test
- [ ] Failure scenario testing
- [ ] Documentation update
- [ ] Team training

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Codex generates insecure code | Medium | High | Security scan gate, human review for sensitive paths |
| Runaway deployments | Low | High | Rate limiting, approval gates |
| Secret exposure | Low | Critical | No secrets in code, scan enforcement |
| Cost overrun | Medium | Medium | Rate limits, budget alerts |
| Service outage from bad deploy | Medium | High | Canary deployments, auto-rollback |

---

## Rollback Procedures

### Immediate Rollback (< 5 min)
```bash
# Backend
cd backend/edge-worker
npx wrangler rollback --env production

# Frontend (via Cloudflare Dashboard)
# Pages → awhittlewandering → Deployments → Rollback
```

### Full Recovery (< 30 min)
1. Identify failing commit via `git log`
2. Create revert PR: `git revert <sha>`
3. Fast-track through CI (skip canary if critical)
4. Deploy via `workflow_dispatch`

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Codex task success rate | > 80% | PRs merged / tasks created |
| Deployment success rate | > 99% | Successful deploys / total |
| Mean time to recovery | < 15 min | Incident duration |
| Security scan pass rate | 100% | Scans passed / total |

---

## Next Steps

1. **Review this document** with stakeholders
2. **Approve policy changes** in `policy.yml`
3. **Create workflows** in order: autonomous → preview → production → monitor
4. **Test in staging** before production rollout
5. **Monitor and iterate** based on metrics

---

*Document Version: 1.0*  
*Last Updated: 2026-01-28*  
*Author: Codex CI/CD Implementation Team*
