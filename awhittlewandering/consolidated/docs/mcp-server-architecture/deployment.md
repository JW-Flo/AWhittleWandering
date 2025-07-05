# Deployment Guide

This guide provides detailed information on deploying the Cloudflare-based MCP Server to production. It covers the deployment process, configuration, and monitoring.

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Prerequisites](#prerequisites)
3. [Deployment Process](#deployment-process)
4. [Environment Configuration](#environment-configuration)
5. [CI/CD Setup](#cicd-setup)
6. [Custom Domain Configuration](#custom-domain-configuration)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)

## Deployment Overview

The MCP Server is designed to be deployed on Cloudflare Workers, leveraging Cloudflare's global edge network for low latency and high availability. The deployment process involves:

1. Setting up the Cloudflare environment
2. Configuring environment variables
3. Building and deploying the code
4. Setting up CI/CD for automated deployments
5. Configuring a custom domain (optional)
6. Verifying the deployment
7. Setting up monitoring

## Prerequisites

Before deploying the MCP Server, ensure you have:

1. **Cloudflare Account**:
   - A Cloudflare account with Workers enabled
   - Access to the Cloudflare dashboard

2. **Worker Resources**:
   - Workers KV namespaces for configuration, user data, and plugin data
   - Durable Objects for stateful operations (if needed)
   - D1 database for relational data (if needed)
   - R2 storage for file storage (if needed)

3. **Development Environment**:
   - Node.js (v16 or higher)
   - Wrangler CLI installed and configured
   - Git for version control

4. **API Keys**:
   - API keys for external services (e.g., MapBox, Weather API)
   - Cloudflare API token with appropriate permissions

## Deployment Process

### 1. Prepare the Project

Ensure your project is properly structured and ready for deployment:

```
mcp-server/
├── src/                # Source code
├── wrangler.toml       # Wrangler configuration
├── package.json        # Project dependencies
└── README.md           # Project documentation
```

### 2. Configure Wrangler

Create or update the `wrangler.toml` file with the appropriate configuration:

```toml
name = "mcp-server"
main = "src/index.ts"
compatibility_date = "2023-10-30"

# Environment
[env.production]
workers_dev = false
route = "mcp-server.example.com/*"
zone_id = "your-zone-id"

# KV Namespaces
kv_namespaces = [
  { binding = "CONFIG_KV", id = "your-config-kv-id", preview_id = "your-preview-config-kv-id" },
  { binding = "USER_DATA_KV", id = "your-user-data-kv-id", preview_id = "your-preview-user-data-kv-id" },
  { binding = "PLUGIN_DATA_KV", id = "your-plugin-data-kv-id", preview_id = "your-preview-plugin-data-kv-id" }
]

# Durable Objects
[durable_objects]
bindings = [
  { name = "STATE_DO", class_name = "StateDurableObject" }
]

# D1 Database
[[d1_databases]]
binding = "DB"
database_name = "mcp-server-db"
database_id = "your-d1-database-id"

# Environment Variables
[vars]
AUTH_ENABLED = "true"
LOG_LEVEL = "info"
```

### 3. Create KV Namespaces

Create the necessary KV namespaces for your MCP Server:

```bash
# Create KV namespaces
wrangler kv:namespace create "CONFIG_KV"
wrangler kv:namespace create "USER_DATA_KV"
wrangler kv:namespace create "PLUGIN_DATA_KV"

# Create preview namespaces
wrangler kv:namespace create "CONFIG_KV" --preview
wrangler kv:namespace create "USER_DATA_KV" --preview
wrangler kv:namespace create "PLUGIN_DATA_KV" --preview
```

Update the `wrangler.toml` file with the IDs returned by these commands.

### 4. Create D1 Database (if needed)

If your MCP Server uses a D1 database, create it with:

```bash
wrangler d1 create mcp-server-db
```

Update the `wrangler.toml` file with the database ID returned by this command.

### 5. Deploy the MCP Server

Deploy the MCP Server to Cloudflare Workers:

```bash
# Deploy to development environment
wrangler deploy

# Deploy to production environment
wrangler deploy --env production
```

## Environment Configuration

### 1. Environment Variables

Configure environment variables in the `wrangler.toml` file:

```toml
[vars]
AUTH_ENABLED = "true"
LOG_LEVEL = "info"
API_TIMEOUT = "30000"
```

For sensitive information, use Cloudflare Workers Secrets:

```bash
wrangler secret put AUTH_TOKEN
wrangler secret put MAPBOX_API_KEY
wrangler secret put WEATHER_API_KEY
```

### 2. KV Configuration

Initialize KV with necessary configuration:

```bash
# Add initial configuration
wrangler kv:key put --binding=CONFIG_KV "auth" '{"tokenExpiration": 2592000000}' --env production
wrangler kv:key put --binding=CONFIG_KV "plugins" '{"allowDynamicLoading": true}' --env production
wrangler kv:key put --binding=CONFIG_KV "monitoring" '{"metrics": {"enabled": true, "retentionDays": 30}, "alerts": {"enabled": true}}' --env production
```

### 3. Initial User Setup

Create an initial admin user:

```bash
# Run a script to create an admin user
node scripts/create-admin-user.js
```

The script should:
1. Generate a secure token
2. Store the user details in the USER_DATA_KV namespace
3. Display the token for initial login

## CI/CD Setup

Set up CI/CD for automated deployments using GitHub Actions:

### 1. Create GitHub Workflow File

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy MCP Server

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          environment: production
```

### 2. Configure GitHub Secrets

Add the necessary secrets to your GitHub repository:

- `CF_API_TOKEN`: Cloudflare API token with Workers deployment permissions
- `CF_ACCOUNT_ID`: Your Cloudflare account ID
- Any other secrets needed for your deployment

## Custom Domain Configuration

To use a custom domain for your MCP Server:

### 1. Configure DNS

Add the domain to Cloudflare DNS:

1. Log in to the Cloudflare dashboard
2. Select your domain
3. Go to DNS settings
4. Add a CNAME record:
   - Name: `mcp-server` (or your subdomain)
   - Content: `your-worker-subdomain.workers.dev`
   - Proxy status: Proxied

### 2. Update Wrangler Configuration

Update the `wrangler.toml` file with your custom domain:

```toml
[env.production]
workers_dev = false
route = "mcp-server.example.com/*"
zone_id = "your-zone-id"
```

### 3. Deploy with Custom Domain

Deploy the MCP Server with the custom domain configuration:

```bash
wrangler deploy --env production
```

## Post-Deployment Verification

After deploying the MCP Server, verify that it's working correctly:

### 1. Check the Discovery Endpoint

```bash
curl https://mcp-server.example.com/discovery
```

The response should include information about the MCP Server and available tools.

### 2. Test Authentication

```bash
curl -H "Authorization: Bearer your-token" https://mcp-server.example.com/discovery
```

The response should include authenticated information.

### 3. Test Tool Execution

```bash
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer your-token" -d '{"server":"map-agent","tool":"optimizeRoute","parameters":{"waypoints":[{"latitude":37.7749,"longitude":-122.4194},{"latitude":34.0522,"longitude":-118.2437}]}}' https://mcp-server.example.com/execute
```

The response should include the result of the tool execution.

## Monitoring and Maintenance

### 1. Cloudflare Analytics

Use Cloudflare Analytics to monitor your MCP Server:

1. Log in to the Cloudflare dashboard
2. Select your worker
3. Go to Analytics
4. Monitor requests, errors, and performance

### 2. Custom Monitoring

Implement custom monitoring for your MCP Server:

1. **Logging**: Configure logging to capture important events
2. **Metrics**: Track key metrics like request count, response time, and error rate
3. **Alerts**: Set up alerts for critical issues

### 3. Regular Maintenance

Perform regular maintenance on your MCP Server:

1. **Updates**: Keep dependencies up to date
2. **Security**: Regularly rotate tokens and API keys
3. **Backup**: Backup configuration and data
4. **Performance**: Monitor and optimize performance

### 4. Scaling

If your MCP Server needs to scale:

1. **Workers**: Workers scale automatically based on traffic
2. **KV**: Monitor KV usage and consider splitting data across namespaces if approaching limits
3. **Rate Limiting**: Adjust rate limits based on usage patterns
4. **Caching**: Implement caching to reduce load on external services

## Conclusion

Deploying the MCP Server to Cloudflare Workers provides a scalable, reliable, and cost-effective solution. By following this guide, you can deploy your MCP Server to production and ensure it's properly configured, monitored, and maintained.

For more information, see:
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare KV Documentation](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [Cloudflare Durable Objects Documentation](https://developers.cloudflare.com/workers/runtime-apis/durable-objects/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
