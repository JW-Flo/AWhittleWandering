# MCP Server Deployment Workflow

This document describes the MCP Server Deployment workflow in n8n, which automates the build, validation, and deployment process for the Model Context Protocol (MCP) server.

## Overview

The MCP Server Deployment workflow is a standalone n8n workflow that manages updates to the MCP server documentation and code. It is triggered via a webhook and orchestrates the entire process from code/documentation updates to deployment and validation.

## Workflow Components

1. **MCP Update Webhook**: Entry point for initiating MCP server updates
2. **Process MCP Update**: Processes the update request and determines required validations
3. **GitHub Integration**: Creates issues and manages code repositories
4. **Build Process**: Builds documentation or server code based on update type
5. **Deployment**: Deploys the MCP server to Cloudflare Workers
6. **Validation**: Creates and assigns validation tasks to appropriate agents
7. **Notification**: Sends notifications about the deployment status

## Update Types

The workflow supports different update types, each requiring specific validations:

| Update Type | Required Validations |
|-------------|---------------------|
| documentation | cline, copilot |
| core | cline, cloudflare |
| plugins | cline, cloudflare |
| authentication | cline, security |
| deployment | cloudflare, copilot |

## Setup and Configuration

### Prerequisites

- n8n server running
- GitHub repository access
- Cloudflare Workers account
- Required API tokens

### Installation

1. The workflow JSON file is located at `n8n/workflows/mcp-server-deployment.json`
2. Environment variables are configured in `n8n/env/mcp-server-deployment.env`
3. Use the setup script to register the workflow:

```bash
cd /path/to/your/project
./n8n/scripts/setup-mcp-workflow.sh
```

### Required Environment Variables

The workflow requires the following environment variables:

- `GITHUB_OWNER`: GitHub repository owner
- `GITHUB_REPO`: GitHub repository name
- `GITHUB_TOKEN`: GitHub personal access token
- `MCP_SERVER_URL`: URL of the MCP server
- `MCP_API_TOKEN`: API token for the MCP server
- `MCP_SERVER_PATH`: Local path to the MCP server code
- `MCP_SERVER_DOCS_PATH`: Local path to the MCP server documentation
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare account ID
- `CLOUDFLARE_API_TOKEN`: Cloudflare API token
- `AGENT_*_URL`: URLs for validation agents
- `AGENT_*_TOKEN`: API tokens for validation agents

See `n8n/env/mcp-server-deployment.env.example` for a complete list.

## Usage

### Triggering a Deployment

To trigger a deployment, send a POST request to the webhook endpoint:

```bash
curl -X POST \
  http://localhost:5678/webhook/mcp-server/update \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Update MCP Documentation",
    "type": "documentation",
    "description": "Updated core components diagram and request flow documentation"
  }'
```

### Webhook Payload Structure

The webhook accepts the following JSON structure:

```json
{
  "title": "Title of the update",
  "type": "documentation|core|plugins|authentication|deployment",
  "description": "Detailed description of the update",
  "additional_params": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

### Workflow Execution

When triggered, the workflow:

1. Processes the update request
2. Creates a GitHub issue to track the update
3. Determines the update type and builds the appropriate components
4. Updates the MCP server state
5. Deploys to Cloudflare Workers
6. Creates validation tasks for the required agents
7. Sends notifications about the deployment

## Validation Process

After deployment, the workflow creates validation tasks for the specified agents. These agents validate the deployment and report back their findings. The MCP server tracks the validation status and updates the deployment status accordingly.

## Troubleshooting

Common issues and their solutions:

1. **Webhook not triggering**: Ensure n8n is running and the webhook is activated
2. **Build failures**: Check the logs for build errors and fix them
3. **Deployment failures**: Verify Cloudflare credentials and settings
4. **Validation failures**: Check agent logs for validation issues

## Integration with Other Workflows

The MCP Server Deployment workflow integrates with:

1. **Agent Coordination**: Assigns validation tasks to agents
2. **Copilot Communication**: Updates the copilot on deployment status
3. **Task Monitoring**: Monitors task status and completion

## Extending the Workflow

To extend the workflow:

1. Add new nodes to the workflow JSON
2. Update the environment variables as needed
3. Add new validation agents if required
4. Update the setup script to include new components

## Related Documentation

- [MCP Server Architecture](../docs/mcp-server-architecture/index.md)
- [Plugin Development Guide](../docs/mcp-server-architecture/implementation/plugin-development.md)
- [Deployment Guide](../docs/mcp-server-architecture/deployment.md)
- [ChatGPT Integration](../docs/mcp-server-architecture/chatgpt-integration.md)
