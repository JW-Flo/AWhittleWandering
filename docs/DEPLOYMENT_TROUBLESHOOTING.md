# 48 Continental USA Deployment Troubleshooting

This document provides solutions for common deployment issues with the 48 Continental USA project.

## Table of Contents
- [Quick Fix Script](#quick-fix-script)
- [Common Issues](#common-issues)
- [Cloudflare Worker Issues](#cloudflare-worker-issues)
- [Custom Domain Issues](#custom-domain-issues)
- [KV Namespace Issues](#kv-namespace-issues)
- [API Endpoint Issues](#api-endpoint-issues)

## Quick Fix Script

The project includes an automated fix script that can resolve many common deployment issues:

```bash
# Run the deployment fix script
./scripts/fix-deployment.cjs
```

After running the fix script, verify the deployment:

```bash
# Verify all components are working
./scripts/verify-deployment.sh
```

## Common Issues

### All Components Show Offline

If the verification script shows all components offline:

1. Check your internet connection
2. Verify Cloudflare account credentials
3. Run the fix script to redeploy

```bash
./scripts/fix-deployment.cjs
```

### Some Components Working, Others Offline

This typically indicates a partial deployment issue:

1. Run the cloudflare diagnostic script:
   ```bash
   node scripts/cloudflare-diagnostic.js
   ```
2. Check the Cloudflare dashboard for any service interruptions
3. Verify the specific component's deployment status (see sections below)

## Cloudflare Worker Issues

### Worker Not Deploying

If the worker fails to deploy:

1. Make sure you're logged in to Cloudflare:
   ```bash
   npx wrangler login
   ```

2. Check your account ID in `wrangler.toml`

3. Validate your API token:
   ```bash
   npx wrangler whoami
   ```

### Worker Deploys But API Not Working

If the worker deploys but the API endpoints aren't working:

1. Check CORS configuration in `edge-worker/src/index.ts`
2. Verify environment variables are set correctly
3. Check for errors in the worker logs:
   ```bash
   cd edge-worker
   npx wrangler tail
   ```

## Custom Domain Issues

### Custom Domain Not Working

If the custom domain (trip.thewanderingwhittle.com) isn't working:

1. Verify DNS records in Cloudflare dashboard
2. Check the custom domain configuration in `wrangler.toml`
3. Ensure the domain is properly activated in Cloudflare
4. Verify SSL/TLS certificate status

Common `wrangler.toml` issues:
```toml
# Make sure you have this configuration
[[routes]]
pattern = "trip.thewanderingwhittle.com"
custom_domain = true
```

## KV Namespace Issues

### KV Access Errors

If you see KV access errors:

1. Verify KV namespace bindings in `wrangler.toml`:
   ```toml
   # Check these bindings
   kv_namespaces = [
     { binding = "APP_KV", id = "your-kv-id" }
   ]
   ```

2. Ensure you have proper permissions for the KV namespace
3. Try creating a test KV entry:
   ```bash
   cd edge-worker
   npx wrangler kv:key put --binding=APP_KV "test-key" "test-value"
   ```

## API Endpoint Issues

### Endpoint Returns 404

If an API endpoint returns 404:

1. Check the route handler in `edge-worker/src/index.ts`
2. Verify the URL path is correct
3. Check for typos in the URL

### Endpoint Returns 500

If an endpoint returns a 500 error:

1. Check the Cloudflare worker logs for errors:
   ```bash
   cd edge-worker
   npx wrangler tail
   ```
2. Verify that all required environment variables are set
3. Check that KV namespaces are properly configured

### CORS Errors in Browser

If you see CORS errors in the browser console:

1. Ensure CORS headers are properly set in all API responses
2. Add proper handling for OPTIONS requests (preflight)
3. Verify the allowed origins match your frontend domains

## Further Assistance

If you continue to experience issues after trying these solutions:

1. Check the [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/)
2. Review Cloudflare status page for service disruptions
3. Contact project maintainers for specific project issues
