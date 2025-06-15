# GitHub Actions Workflow Monitoring

## GitHub Workflow Status Checker

The project includes a built-in GitHub Workflow Status Checker that monitors CI/CD pipeline status after commits. The tool recursively checks workflow status for multiple commits and generates detailed reports.

### How to Use

#### Standalone Usage

Run the workflow status checker directly:

```bash
./scripts/github-workflow-status.sh [options]
```

Options:

- `--commits NUMBER`: Number of recent commits to check (default: 10)
- `--attempts NUMBER`: Maximum number of attempts to check status (default: 30)
- `--interval NUMBER`: Interval between checks in seconds (default: 60)

Example:

```bash
./scripts/github-workflow-status.sh --commits 5 --interval 30
```

#### Integration with Validation

The workflow status check is already integrated into:

- Project validation pipeline (`./scripts/validate-rename.sh`)
- Pre-deployment checks

#### Requirements

- GitHub CLI (`gh`) must be installed and authenticated
- Git repository must be connected to GitHub
- User must have access to view workflow runs

### Error Handling

The tool implements robust error handling:

- Checks if GitHub CLI is installed
- Validates repository connection
- Handles timeouts gracefully
- Provides clear error messages

### Report Format

Generates detailed Markdown reports in `docs/workflow-reports/` with:

- Commit details (SHA, author, date, message)
- Status of each workflow run
- Links to workflow runs in GitHub UI
- Success/failure summary

For more information, see [GitHub Workflow Status Documentation](../docs/github-workflow-status.md).
