# Configuration Update Guide: Post-Rename

This document provides a comprehensive guide for updating configurations after renaming the project from "48 Continental" to "AWhittleWandering".

## GitHub Workflow Files

Update the following workflow files in `.github/workflows/`:

1. **deploy-all-final.yml**:
   ```yaml
   # Update path references
   - name: Build public site
     run: |
       cd AWhittleWandering_Website/public-site  # Previously 48Continental_Starter/public-site
   ```

2. **test-edge-worker.yml**:
   ```yaml
   # Update any default values or environment variables
   echo "EDGE_HMAC_KEY=${{ secrets.EDGE_HMAC_KEY || 'awhittlewandering_secure_key' }}" >> .dev.vars
   ```

## Package.json Scripts

Update path references in all package.json files:

1. **Root package.json**:
   ```json
   "scripts": {
     "build:site": "cd AWhittleWandering_Website/public-site && bun run build",
     "start:site": "cd AWhittleWandering_Website/public-site && npm start"
   }
   ```

## VS Code Tasks

Update all tasks in `.vscode/tasks.json`:

```json
{
  "tasks": [
    {
      "label": "Build Edge Worker",
      "type": "shell",
      "command": "cd ${workspaceFolder}/edge-worker && bun run build",
      "group": "build"
    },
    {
      "label": "Deploy: Edge Worker",
      "type": "shell",
      "command": "bun run deploy:edge",
      "group": "none"
    }
  ]
}
```

## Environment Variables

1. **Review all .env files** for references to old names.
2. **Update environment variable names** that include "48continental" or similar.

## API Endpoints

Search for and update all hardcoded API endpoints:

1. **Edge Worker API**:
   - Update `https://edge.48continental.com/api` → `https://edge.awhittlewandering.com/api`

2. **MCP Server API**:
   - Update `https://mcp.48continental.com/api` → `https://mcp.awhittlewandering.com/api`

## Storage Keys & IDs

Update any localStorage keys, cookie names, or unique identifiers:

```javascript
// Before
const STORAGE_KEY = '48continental-statistics';

// After
const STORAGE_KEY = 'awhittlewandering-statistics';
```

## Build & Deployment Configurations

1. **Cloudflare Workers**:
   - Update worker names and environment variables in `wrangler.toml`

2. **Vite Configuration**:
   - Check for project-specific configurations in `vite.config.js`

## Domain References

1. **Update any references to domains**:
   - `48continental.com` → `awhittlewandering.com`
   - Related subdomains

## Testing Strategy

After making all configuration updates:

1. **Run local builds** to verify everything builds correctly
2. **Run the test suite** to ensure functionality is maintained
3. **Deploy to staging** to verify deployment configurations
4. **Check integration points** to ensure all systems communicate properly

## Verification Checklist

- [ ] All path references updated
- [ ] Build processes working
- [ ] API endpoints updated and functioning
- [ ] Storage keys and IDs updated
- [ ] Domain references updated
- [ ] CI/CD pipelines updated and functioning
- [ ] Documentation updated

## Additional Areas to Check

- Custom styles and CSS classes
- Database table names or fields (if applicable)
- Cache keys and invalidation strategies
- Authentication tokens and refresh mechanisms
- SEO metadata and site titles
