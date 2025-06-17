# A Whittle Wandering: MCP and Tools Validation Troubleshooting Guide

This guide provides detailed troubleshooting steps for issues that may arise during the MCP and tools validation process.

## Table of Contents

- [Common Validation Errors](#common-validation-errors)
- [MCP Server Issues](#mcp-server-issues)
- [Edge Worker Issues](#edge-worker-issues)
- [AI Agents Issues](#ai-agents-issues)
- [GitHub MCP Issues](#github-mcp-issues)
- [API Endpoint Issues](#api-endpoint-issues)
- [Configuration Issues](#configuration-issues)

## Common Validation Errors

### Script Execution Permission Issues

**Error**: `Permission denied` when running validation script

**Solution**:

1. Make the script executable: `chmod +x scripts/validate-all-tools.sh`
2. Ensure you have the required permissions to execute files in the directory

### Node.js Version Issues

**Error**: Script fails with Node.js errors or incompatibility messages

**Solution**:
1. Check Node.js version: `node --version`
2. Ensure you're using at least Node.js 18.x: `nvm use 18` (if using NVM)
3. Update Node.js if necessary: `nvm install 18` (NVM) or download from nodejs.org

### JSON Parsing Errors

**Error**: `SyntaxError: Unexpected token` in JSON parsing

**Solution**:
1. Validate the specific JSON file: `node -e "JSON.parse(require('fs').readFileSync('path/to/file.json', 'utf8'))"`
2. Fix any syntax errors in the file (missing commas, brackets, etc.)

## MCP Server Issues

### Agent Validation Failures

**Error**: One or more agents report as unhealthy or offline

**Solution**:
1. Check agent logs: `cat mcp-server/logs/agent-*.log`
2. Ensure the MCP server is running: `ps aux | grep mcp-server`
3. Restart the MCP server: `./scripts/start-mcp-server.sh`
4. Verify network connectivity between MCP server and agents

### Database Connection Issues

**Error**: MCP server fails to connect to database

**Solution**:
1. Check database configuration in `.env`
2. Verify database is running: `docker ps` (if using Docker)
3. Check database logs: `docker logs <db-container-id>` (if using Docker)
4. Reset database connection: `./scripts/reset-db-connection.sh` (if available)

## Edge Worker Issues

### Wrangler Configuration Issues

**Error**: Invalid wrangler.toml or missing configuration

**Solution**:
1. Validate wrangler.toml syntax
2. Ensure all required fields are present (name, account_id, etc.)
3. Verify environment variables are correctly set
4. Check for outdated references or deprecated features

### Edge Worker MCP Component Issues

**Error**: Edge Worker MCP components failing validation tests

**Solution**:
1. Check for TypeScript errors: `npx tsc --noEmit`
2. Verify component interfaces match MCP protocol requirements
3. Check for outdated dependencies in package.json
4. Update MCP handlers to match current protocol specification

## AI Agents Issues

### Tool Definition Issues

**Error**: Invalid tool definition JSON files

**Solution**:
1. Validate each tool JSON file independently
2. Check for schema compliance with tool specifications
3. Ensure all required fields are present (name, description, parameters, etc.)
4. Update tools to match current API specifications

### Agent Connectivity Issues

**Error**: Agents cannot connect to MCP server

**Solution**:
1. Check network connectivity between agents and MCP
2. Verify authentication tokens are valid
3. Ensure MCP server is accepting connections
4. Check firewall or network policy restrictions
5. Verify correct URLs and endpoints are being used

## GitHub MCP Issues

### GitHub API Token Issues

**Error**: GitHub API requests failing with authentication errors

**Solution**:
1. Check GitHub token validity and permissions
2. Regenerate GitHub token if necessary
3. Ensure token has required scopes (repo, workflow, etc.)
4. Verify token is correctly configured in environment variables

### GitHub Workflow Status Issues

**Error**: Unable to retrieve GitHub workflow status

**Solution**:
1. Check GitHub API connectivity
2. Verify workflow exists in repository
3. Ensure GitHub Actions is enabled for the repository
4. Check for rate limiting or other GitHub API restrictions

## API Endpoint Issues

### API Endpoint Connectivity Issues

**Error**: Unable to connect to API endpoints

**Solution**:
1. Check API endpoint URLs
2. Verify network connectivity to endpoints
3. Check for DNS resolution issues
4. Test endpoints with curl or Postman
5. Verify API keys and authentication tokens

### API Response Validation Issues

**Error**: API responses not matching expected format

**Solution**:
1. Check API documentation for expected responses
2. Verify API version compatibility
3. Update validation schemas to match current API responses
4. Check for changes in API contracts or interfaces

## Configuration Issues

### Environment Variable Issues

**Error**: Missing or invalid environment variables

**Solution**:
1. Check .env file exists and is properly formatted
2. Verify all required variables are set
3. Check variable names and values match requirements
4. Source environment variables: `source .env`

### Path and Directory Issues

**Error**: Unable to find files or directories

**Solution**:
1. Check file paths in validation script
2. Verify directory structure matches expectations
3. Ensure repository is correctly cloned
4. Update paths if directory structure has changed

## Getting Additional Help

If you encounter persistent issues with validation, reach out to:

1. Check the [detailed validation documentation](./TOOLS_MCP_VALIDATION_PLAN.md)
2. File an issue in the GitHub repository
3. Contact the project maintainers

Remember to include:
- Exact error messages
- Steps to reproduce the issue
- Environment details (OS, Node.js version, etc.)
- Log files if available
