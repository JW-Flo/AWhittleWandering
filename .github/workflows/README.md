# GitHub Actions Workflows

## 1Password Connect Workflow (Disabled)

This GitHub Actions workflow was disabled on June 15, 2025 because:

1. It was causing commit failures due to misconfigured secrets
2. The credentials referenced did not align with the actual Git Secrets or 1Password/Cloudflare secrets
3. It appeared to be an experimental integration that was never fully implemented
4. No other workflows were dependent on it

### Future Integration

If 1Password integration is needed in the future:

1. Review the MCP server code in `mcp-server/src/servers/1password-connect/`
2. Update the environment variables in `shared/credential-manager/.env.example`
3. Create the proper secrets in GitHub Actions
4. Re-enable and update this workflow file

### Related Files

- `/shared/credential-manager/.env.example`
- `/mcp-server/src/servers/1password-connect/index.js`
