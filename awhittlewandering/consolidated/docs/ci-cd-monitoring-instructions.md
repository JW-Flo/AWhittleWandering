# CI/CD Monitoring Instructions

This document provides instructions for monitoring Continuous Integration and Continuous Deployment (CI/CD) pipelines in the ContinentalUSA project.

## GitHub Workflow Status Monitoring

### Automatic Recursive Checks

The system includes automatic recursive checking for GitHub Actions workflow statuses after each commit. This helps in real-time monitoring of build, test, and deployment processes.

```typescript
// Example pattern for CI/CD monitoring integration
interface WorkflowStatusCheck {
  commitSha: string;
  timestamp: number;
  repositoryName: string;
  workflowResults: WorkflowResult[];
  overallStatus: 'success' | 'failure' | 'pending';
}

interface WorkflowResult {
  name: string;
  status: string;
  conclusion: string;
  url: string;
}

async function monitorWorkflowStatus(commitSha: string): Promise<WorkflowStatusCheck> {
  try {
    // Validation of parameters
    if (!commitSha) {
      throw new Error('Commit SHA must be provided');
    }
    
    // Execute the workflow check script
    const result = await executeWorkflowCheck(commitSha);
    
    // Parse and validate the results
    const workflowStatus = parseWorkflowResults(result);
    
    // Log the workflow status
    logger.info({
      message: 'Workflow status check completed',
      commitSha,
      overallStatus: workflowStatus.overallStatus,
      workflowCount: workflowStatus.workflowResults.length,
    });
    
    // Implement notification logic if needed
    if (workflowStatus.overallStatus === 'failure') {
      await notifyWorkflowFailure(workflowStatus);
    }
    
    return workflowStatus;
  } catch (error) {
    // Log error details
    logger.error({
      message: 'Workflow status check failed',
      operation: 'monitorWorkflowStatus',
      error: error.message,
      stack: error.stack,
      context: {
        commitSha,
      },
    });
    
    // Implement fallback mechanism
    await fallbackMechanism();
    
    // Notify monitoring systems
    await alertMonitoring(error);
    
    throw error;
  }
}
```

### Integration with MCP Server

The GitHub workflow status checker integrates with the MCP server for real-time monitoring:

```typescript
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

async function checkWorkflowStatus(commitSha: string): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync('./scripts/github-workflow-status.sh', [
      '--commits', '1',
      '--attempts', '10',
      '--interval', '30'
    ]);
    
    // Parse the output to determine success
    return stdout.includes('All workflows passed');
  } catch (error) {
    console.error('Workflow status check failed:', error);
    return false;
  }
}
```

### Tool Usage

The workflow status checker can be used in several ways:

1. **Standalone CLI tool**:

   ```bash
   ./scripts/github-workflow-status.sh --commits 5 --interval 30
   ```

2. **Integrated with project validation**:

   ```bash
   ./scripts/validate-rename.sh
   ```

3. **Programmatic API in TypeScript**:

   ```typescript
   const status = await checkWorkflowStatus('abc123def');
   if (status) {
     console.log('Workflows passed!');
   }
   ```

## Error Handling

The CI/CD monitoring implements comprehensive error handling:

- Validation of all input parameters
- Retry mechanisms for network operations
- Fallback procedures for failures
- Detailed logging for diagnostics
- Notification systems for critical failures

## Report Generation

The system generates detailed Markdown reports in the `docs/workflow-reports/` directory, including:

- Commit metadata (hash, author, timestamp, message)
- Workflow run statuses and conclusions
- Direct links to GitHub Actions UI
- Overall success/failure summary

## For More Information

See the following documentation resources:

- [GitHub Workflow Status Documentation](../docs/github-workflow-status.md)
- [GitHub Actions Workflow Monitoring](../ai-agents/docs/github-actions-workflow-monitoring.md)
