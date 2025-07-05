# GitHub Workflow Status Checker

This tool provides recursive checking of GitHub Actions workflow status after each commit. It allows you to monitor the success or failure of your CI/CD pipelines and understand any issues that may have occurred.

## Features

- Recursively checks workflow status for multiple commits
- Generates detailed reports with workflow outcomes
- Configurable polling interval and attempt limits
- Integration with the project validation pipeline

## Usage

### Standalone Usage

You can run the workflow status checker directly:

```bash
./scripts/github-workflow-status.sh [options]
```

Available options:

- `--commits NUMBER`: Number of recent commits to check (default: 10)
- `--attempts NUMBER`: Maximum number of attempts to check workflow status (default: 30)
- `--interval NUMBER`: Interval between status checks in seconds (default: 60)

Example:

```bash
./scripts/github-workflow-status.sh --commits 5 --attempts 20 --interval 30
```

### As Part of Validation

The workflow status check is integrated into the project validation pipeline. When you run `./scripts/validate-rename.sh`, it will automatically check the workflow status for the 3 most recent commits with a shorter polling interval.

## Requirements

- GitHub CLI (`gh`) must be installed and authenticated
- Git repository must be connected to GitHub
- User must have access to view workflow runs in the GitHub repository

## Report Format

The tool generates a detailed Markdown report with:

- Commit details (SHA, author, date, message)
- Status of each workflow run associated with the commit
- Direct links to workflow runs in the GitHub UI
- Summary of overall success or failure

Reports are stored in `docs/workflow-reports/` with timestamped filenames.

## Integration with MCP Server

For real-time monitoring, you can connect this tool with the MCP server:

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

## Error Handling

The tool implements robust error handling:

- Checks if GitHub CLI is installed and authenticated
- Validates that the repository is properly connected to GitHub
- Handles timeouts gracefully if workflows take too long to complete
- Provides clear error messages for common issues
