# MCP Server Deployment Automation

This guide explains how to use the fully automated MCP server deployment system that integrates with n8n workflows for continuous deployment.

## Overview

The MCP deployment automation system provides a zero-touch way to manage the deployment of your MCP (Model Context Protocol) server and documentation. Once set up, it provides:

1. **Automatic Deployment**: Changes to MCP server code or documentation automatically trigger deployments
2. **Validation**: Automated validation of deployments by multiple validation agents
3. **Multiple Triggers**: Deploy via GitHub commits, file changes, or manual triggers
4. **Status Monitoring**: Easy way to check deployment status

## Quick Start

To set up the automation system:

```bash
# Run the simple setup script
./scripts/setup-mcp-automation.sh
```

This single command will:
- Auto-detect your repository and file paths
- Configure all needed environment variables
- Register the n8n workflow
- Set up file watchers for auto-deployment
- Create GitHub workflow files
- Add Makefile targets for easy management

## Available Commands

After setup, you can use these commands:

```bash
# Manually trigger a deployment
make mcp-deploy

# Start file watcher for auto-deployment
make mcp-watch

# Check MCP server status
make mcp-status

# Re-run setup if needed
make mcp-setup
```

## Automatic Triggers

The system supports multiple ways to trigger deployments:

1. **File Changes**: A file watcher monitors MCP server and documentation files, automatically triggering deployments when changes are detected
2. **GitHub Integration**: Changes pushed to GitHub automatically trigger deployments via GitHub Actions
3. **Manual Trigger**: Deployments can be manually triggered via Makefile command or webhook

## Workflow Components

The automation system consists of:

1. **n8n Workflows**:
   - `mcp-server-deployment.json`: Main workflow for deployments
   - `mcp-server-status.json`: Status endpoint workflow

2. **Scripts**:
   - `scripts/setup-mcp-automation.sh`: Main entry point
   - `n8n/scripts/auto-setup-mcp.sh`: Automated setup script
   - `n8n/scripts/setup-mcp-workflow.sh`: n8n workflow registration
   - `services/mcp-file-watcher/watch-mcp-changes.sh`: File watcher service

3. **Configuration**:
   - `n8n/env/mcp-server-deployment.env`: Environment variables
   - `.github/workflows/mcp-server-deployment.yml`: GitHub workflow

## File Watcher Service

The file watcher service monitors the MCP server and documentation directories for changes. When changes are detected:

1. The service determines the type of update (documentation, core, plugins, authentication)
2. It triggers the appropriate webhook
3. The deployment workflow is executed

To start the file watcher:
```bash
make mcp-watch
```

## GitHub Integration

For GitHub integration:

1. Add the `MCP_WEBHOOK_URL` secret to your repository settings with the value:
   ```
   http://your-n8n-server:5678/webhook/mcp-server/update
   ```

2. Push changes to your repository to trigger deployments

## Validation

After deployment, the system creates validation tasks for the appropriate validation agents:

- `cline`: Validates code quality and documentation
- `cloudflare`: Validates Cloudflare Workers deployment
- `copilot`: Validates user experience and overall functionality
- `security`: Validates authentication and security aspects

## Customization

If you need to customize the automation:

1. Edit the environment variables in `n8n/env/mcp-server-deployment.env`
2. Modify the workflow in n8n's UI
3. Update the file watcher service configuration if needed

## Troubleshooting

If you encounter issues:

1. Check n8n logs for workflow execution errors
2. Verify that environment variables are correctly set
3. Check that the file watcher service is running
4. Ensure n8n is running and accessible

For more details, see:
- [MCP Server Workflow Documentation](n8n/docs/MCP_SERVER_WORKFLOW.md)
- [MCP Server Architecture Documentation](docs/mcp-server-architecture/index.md)

## Zero-Touch Operation

Once set up, the system requires minimal intervention:

1. Make changes to MCP server code or documentation
2. The changes are automatically detected and deployed
3. Validation agents verify the deployment
4. Status and notifications are provided

This hands-off approach ensures that your MCP server is always up-to-date without requiring manual deployment steps.
