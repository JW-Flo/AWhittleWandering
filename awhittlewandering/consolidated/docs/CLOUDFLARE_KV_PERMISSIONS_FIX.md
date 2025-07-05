# Cloudflare KV Permissions Fix

## Current Issue
The deployment is failing with:
```
✘ [ERROR] A request to the Cloudflare API failed.
You do not have access to this feature. Please ensure it is enabled. If you are an Enterprise user, reach out to your account team.: kv bindings require kv write perms [code: 10023]
```

## Required Permissions
The Cloudflare API token needs the following permissions:

1. **Workers KV Storage**:
   - Edit permission for KV Namespace bindings
   - Write permission for KV operations

2. **Workers Scripts**:
   - Edit permission for deploying Workers

3. **Account Settings**:
   - Read permission for account information

## Steps to Fix

1. Go to the Cloudflare Dashboard:
   ```
   https://dash.cloudflare.com/profile/api-tokens
   ```

2. Either:
   - Edit the existing token (`CF_API_TOKEN`) to add KV write permissions
   - Create a new API token with the required permissions

3. Required Permission Settings:
   ```
   Account Resources:
   - Workers KV Storage: Edit
   - Workers Scripts: Edit
   - Account Settings: Read
   
   Zone Resources (if needed):
   - Workers Routes: Edit
   ```

4. Update GitHub Secrets:
   - If you created a new token, update the `CF_API_TOKEN` secret in GitHub repository settings
   - Ensure the token has access to the correct account ID (`CF_ACCOUNT_ID`)

## Testing the Fix

1. Verify token permissions locally:
   ```bash
   wrangler whoami --api-token <your-token>
   ```

2. Test KV operations:
   ```bash
   wrangler kv:namespace list
   ```

3. Update workflow if needed:
   ```yaml
   - name: Deploy Edge Worker
     uses: cloudflare/wrangler-action@v3.13.0
     with:
       apiToken: ${{ secrets.CF_API_TOKEN }}
       accountId: ${{ secrets.CF_ACCOUNT_ID }}
       workingDirectory: edge-worker
       command: deploy
     env:
       CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}  # Add if needed
   ```

## Notes
- The KV write permission is specifically required because the Worker uses KV namespaces
- The error occurs during deployment because the Worker attempts to bind to KV namespaces
- All KV operations (read/write) require the appropriate permissions on the API token
