# Cloudflare Workflows Integration for Codex CI/CD

## Overview

[Cloudflare Workflows](https://developers.cloudflare.com/workflows/) provides durable, 
multi-step execution that can significantly enhance the Codex CI/CD pipeline by moving 
complex orchestration logic from GitHub Actions (bash scripts) to a more robust, 
observable, and recoverable system running on Cloudflare's edge.

## Current Architecture Limitations

The current `ops/task-runner.sh` and GitHub Actions workflows have limitations:

| Limitation | Impact |
|------------|--------|
| **No durability** | If a GitHub runner crashes mid-task, state is lost |
| **Limited observability** | Logs are scattered across workflow runs |
| **Timeout constraints** | GitHub Actions has 6-hour max job timeout |
| **No automatic retry** | Failed steps require manual re-run |
| **Sequential execution** | Complex fan-out/fan-in patterns are difficult |

## Proposed Cloudflare Workflows Integration

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        GitHub Actions                                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │ CI Preflight│    │Task Runner  │    │ Branch      │             │
│  │ (quality)   │    │ (trigger)   │    │ Promotion   │             │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘             │
└─────────┼──────────────────┼──────────────────┼─────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Cloudflare Workflows                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   CodexTaskWorkflow                          │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │   │
│  │  │ Parse   │→ │ Execute │→ │ Verify  │→ │ Review  │→ ...   │   │
│  │  │ Task    │  │ Agent   │  │ Changes │  │ Subagent│        │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │   │
│  │       ↓ (durable state persisted at each step)              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                  DeploymentWorkflow                          │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │   │
│  │  │ Build   │→ │ Deploy  │→ │ Health  │→ │ Rollback│        │   │
│  │  │ Verify  │  │ Staging │  │ Check   │  │ (if fail)│       │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Benefits

1. **Durable Execution**: Workflows persist state between steps. If a step fails, 
   it can be retried without re-running previous steps.

2. **Long-Running Tasks**: Workflows can run for up to 24 hours (vs 6 hours for 
   GitHub Actions), ideal for complex AI agent tasks.

3. **Built-in Observability**: Cloudflare Dashboard provides workflow execution 
   visualization, step-by-step logs, and metrics.

4. **Automatic Retries**: Configure retry policies per step with exponential backoff.

5. **Fan-Out/Fan-In**: Run multiple subagent reviews in parallel, then aggregate results.

6. **Event-Driven**: Trigger workflows from GitHub webhooks, scheduled events, or API calls.

## Proposed Workflows

### 1. CodexTaskWorkflow

Handles AI-driven task execution with durability.

```typescript
// backend/edge-worker/src/workflows/codex-task.ts
import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';

interface TaskInput {
  issueNumber: number;
  issueTitle: string;
  taskGoal: string;
  targetBranch: string;
  riskLevel: 'low' | 'medium' | 'high';
  verifyTier: 'lite' | 'full';
}

interface TaskState {
  status: 'pending' | 'executing' | 'verifying' | 'reviewing' | 'complete' | 'failed';
  iteration: number;
  patches: string[];
  verificationResults: Record<string, boolean>;
  subagentReviews: Record<string, string>;
}

export class CodexTaskWorkflow extends WorkflowEntrypoint<Env, TaskInput> {
  async run(event: WorkflowEvent<TaskInput>, step: WorkflowStep) {
    const { issueNumber, taskGoal, riskLevel, verifyTier } = event.payload;
    const maxIterations = riskLevel === 'high' ? 3 : 5;

    // Step 1: Parse and validate task
    const taskContext = await step.do('parse-task', async () => {
      return this.parseTaskDefinition(event.payload);
    });

    // Step 2: Execute AI agent (with retry)
    const agentResult = await step.do('execute-agent', {
      retries: { limit: 3, delay: '10 seconds', backoff: 'exponential' }
    }, async () => {
      return this.invokeCodexAgent(taskContext);
    });

    // Step 3: Apply patches
    await step.do('apply-patches', async () => {
      return this.applyPatches(agentResult.patches);
    });

    // Step 4: Verification loop (durable iteration)
    let verified = false;
    let iteration = 0;
    
    while (!verified && iteration < maxIterations) {
      iteration++;
      
      // Run preflight checks
      const preflight = await step.do(`verify-preflight-${iteration}`, async () => {
        return this.runPreflight();
      });

      // Run security scan
      const security = await step.do(`verify-security-${iteration}`, async () => {
        return this.runSecurityScan();
      });

      if (preflight.passed && security.passed) {
        verified = true;
      } else {
        // Invoke fix agent
        await step.do(`fix-iteration-${iteration}`, async () => {
          return this.invokeFixAgent(preflight, security);
        });
      }
    }

    // Step 5: Parallel subagent reviews (fan-out)
    const reviews = await Promise.all([
      step.do('review-ci', () => this.invokeSubagent('ci-reviewer')),
      step.do('review-security', () => this.invokeSubagent('security-linter')),
      step.do('review-cloudflare', () => this.invokeSubagent('cloudflare-auditor')),
      step.do('review-routes', () => this.invokeSubagent('route-verifier')),
    ]);

    // Step 6: Create PR (if all reviews pass)
    const allReviewsPassed = reviews.every(r => r.approved);
    
    if (allReviewsPassed) {
      await step.do('create-pr', async () => {
        return this.createPullRequest(event.payload, reviews);
      });
    }

    // Step 7: Auto-merge for low-risk (with human gate for high-risk)
    if (riskLevel === 'low' && allReviewsPassed) {
      await step.do('auto-merge', async () => {
        return this.autoMergePR();
      });
    } else if (riskLevel === 'high') {
      // Wait for human approval (workflow pauses here)
      await step.do('await-approval', {
        timeout: '24 hours'
      }, async () => {
        return this.waitForHumanApproval(issueNumber);
      });
    }

    return { status: 'complete', verified, iteration };
  }
}
```

### 2. DeploymentWorkflow

Handles deployment with automatic rollback.

```typescript
// backend/edge-worker/src/workflows/deployment.ts
import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';

interface DeployInput {
  environment: 'staging' | 'production';
  commitSha: string;
  triggeredBy: string;
}

export class DeploymentWorkflow extends WorkflowEntrypoint<Env, DeployInput> {
  async run(event: WorkflowEvent<DeployInput>, step: WorkflowStep) {
    const { environment, commitSha } = event.payload;
    
    // Step 1: Pre-deployment verification
    const preCheck = await step.do('pre-deploy-check', async () => {
      return this.runPreDeploymentChecks();
    });

    if (!preCheck.passed) {
      return { status: 'blocked', reason: preCheck.failures };
    }

    // Step 2: Deploy backend
    const backendDeploy = await step.do('deploy-backend', {
      retries: { limit: 2, delay: '30 seconds' }
    }, async () => {
      return this.deployBackend(environment, commitSha);
    });

    // Step 3: Deploy frontend
    const frontendDeploy = await step.do('deploy-frontend', {
      retries: { limit: 2, delay: '30 seconds' }
    }, async () => {
      return this.deployFrontend(environment, commitSha);
    });

    // Step 4: Health checks (with retry)
    const healthCheck = await step.do('health-check', {
      retries: { limit: 5, delay: '10 seconds', backoff: 'linear' }
    }, async () => {
      return this.runHealthChecks(environment);
    });

    // Step 5: Rollback if health check fails
    if (!healthCheck.healthy) {
      await step.do('rollback', async () => {
        await this.rollbackBackend(backendDeploy.previousVersion);
        await this.notifyRollback(environment, healthCheck.failures);
        return { rolledBack: true };
      });
      
      return { status: 'rolled-back', reason: healthCheck.failures };
    }

    // Step 6: Post-deployment verification
    await step.do('post-deploy-verify', async () => {
      return this.runPostDeployVerification(environment);
    });

    // Step 7: Notify success
    await step.do('notify-success', async () => {
      return this.notifyDeploymentSuccess(environment, commitSha);
    });

    return { status: 'success', environment, commitSha };
  }
}
```

### 3. HealthMonitorWorkflow

Continuous health monitoring with incident management.

```typescript
// backend/edge-worker/src/workflows/health-monitor.ts
export class HealthMonitorWorkflow extends WorkflowEntrypoint<Env, {}> {
  async run(event: WorkflowEvent<{}>, step: WorkflowStep) {
    const endpoints = [
      { name: 'frontend', url: 'https://awhittlewandering.com' },
      { name: 'backend', url: 'https://api.awhittlewandering.com/api/v1/health' },
    ];

    // Parallel health checks
    const results = await Promise.all(
      endpoints.map(ep => 
        step.do(`check-${ep.name}`, {
          retries: { limit: 3, delay: '5 seconds' }
        }, () => this.checkEndpoint(ep))
      )
    );

    const unhealthy = results.filter(r => !r.healthy);

    if (unhealthy.length > 0) {
      // Create or update incident
      await step.do('manage-incident', async () => {
        return this.createOrUpdateIncident(unhealthy);
      });

      // Wait and recheck (workflow sleeps, doesn't consume resources)
      await step.sleep('5 minutes');
      
      // Trigger another health check iteration
      await step.do('schedule-recheck', async () => {
        return this.scheduleNextCheck();
      });
    }

    return { healthy: unhealthy.length === 0, results };
  }
}
```

## Implementation Plan

### Phase 1: Foundation
1. Add Workflows binding to `wrangler.toml`
2. Create base workflow classes with shared utilities
3. Implement `DeploymentWorkflow` (simplest, highest value)

### Phase 2: Task Orchestration
1. Migrate `task-runner.sh` logic to `CodexTaskWorkflow`
2. Implement subagent invocation via workflow steps
3. Add human approval gates with timeout

### Phase 3: Monitoring
1. Implement `HealthMonitorWorkflow`
2. Replace scheduled GitHub Action with Cloudflare Cron + Workflow
3. Add incident management integration

### Phase 4: Advanced Features
1. Implement workflow-to-workflow communication
2. Add custom metrics and alerting
3. Build workflow status dashboard

## Configuration

Add to `backend/edge-worker/wrangler.toml`:

```toml
# Cloudflare Workflows
[[workflows]]
name = "codex-task-workflow"
binding = "CODEX_TASK_WORKFLOW"
class_name = "CodexTaskWorkflow"

[[workflows]]
name = "deployment-workflow"
binding = "DEPLOYMENT_WORKFLOW"
class_name = "DeploymentWorkflow"

[[workflows]]
name = "health-monitor-workflow"
binding = "HEALTH_MONITOR_WORKFLOW"
class_name = "HealthMonitorWorkflow"
```

## Triggering Workflows

### From GitHub Actions (webhook)
```yaml
- name: Trigger Deployment Workflow
  run: |
    curl -X POST "https://api.awhittlewandering.com/api/v1/workflows/deployment" \
      -H "Authorization: Bearer ${{ secrets.WORKFLOW_TOKEN }}" \
      -H "Content-Type: application/json" \
      -d '{
        "environment": "production",
        "commitSha": "${{ github.sha }}",
        "triggeredBy": "${{ github.actor }}"
      }'
```

### From Worker (API endpoint)
```typescript
// backend/edge-worker/src/routers/workflows.ts
app.post('/api/v1/workflows/deployment', async (c) => {
  const input = await c.req.json();
  const instance = await c.env.DEPLOYMENT_WORKFLOW.create({ params: input });
  return c.json({ workflowId: instance.id, status: 'started' });
});

app.get('/api/v1/workflows/:id/status', async (c) => {
  const instance = await c.env.DEPLOYMENT_WORKFLOW.get(c.req.param('id'));
  return c.json({ status: instance.status, output: instance.output });
});
```

## Cost Considerations

Cloudflare Workflows pricing (as of 2024):
- **Free tier**: 10,000 workflow invocations/month
- **Paid**: $0.01 per 1,000 invocations beyond free tier
- **CPU time**: Included in Workers pricing

For a typical CI/CD pipeline with ~100 deployments/month and ~500 task executions, 
this would be well within the free tier.

## Next Steps

1. Review this proposal and confirm approach
2. Start with `DeploymentWorkflow` implementation
3. Create API endpoints to trigger workflows
4. Update GitHub Actions to use workflows for orchestration
