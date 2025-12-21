# Custom Domain Setup - api.awhittlewandering.com

## Status

✅ **Route Configured** in Cloudflare Workers dashboard
- Pattern: `api.awhittlewandering.com/*`
- Zone: `awhittlewandering.com`
- Failure Mode: Fail closed (block)

## Configuration

The route is configured in `backend/edge-worker/wrangler.toml`:

```toml
[[env.production.routes]]
pattern = "api.awhittlewandering.com/*"
zone_name = "awhittlewandering.com"
```

## Activation Time

After configuring a route in Cloudflare, it may take:
- **DNS Propagation**: 5-15 minutes
- **SSL Certificate**: 5-10 minutes (automatic via Cloudflare)
- **Route Activation**: Usually immediate, but can take a few minutes

## Verification

Test the custom domain:
```bash
curl https://api.awhittlewandering.com/api/v1/health
```

Expected response: JSON health check data with status 200

## Troubleshooting

### Domain Not Responding

If the domain returns connection errors:

1. **Check DNS Records**
   ```bash
   dig api.awhittlewandering.com
   nslookup api.awhittlewandering.com
   ```
   Should resolve to Cloudflare IPs

2. **Verify Route in Dashboard**
   - Cloudflare Dashboard → Workers & Pages → Routes
   - Confirm route is listed and active
   - Check for any error messages

3. **Check SSL Certificate**
   - Cloudflare Dashboard → SSL/TLS
   - Verify certificate is issued (usually automatic)
   - May take a few minutes after route creation

4. **Wait for Propagation**
   - DNS changes can take up to 15 minutes
   - SSL certificate provisioning can take 5-10 minutes
   - Try again after waiting

### Route Not Working

If route is configured but not working:

1. **Verify Worker Deployment**
   - Ensure worker is deployed to production environment
   - Check worker logs for errors

2. **Check Route Pattern**
   - Pattern should match: `api.awhittlewandering.com/*`
   - Wildcard `/*` is required to match all paths

3. **Verify Zone**
   - Zone name must match: `awhittlewandering.com`
   - Zone must be in your Cloudflare account

## Current Status

- ✅ Route configured in Cloudflare dashboard
- ✅ Route configured in wrangler.toml
- ⏳ Waiting for DNS/SSL propagation (if not responding yet)

## Next Steps

1. Wait 5-15 minutes for DNS/SSL propagation
2. Test the endpoint: `curl https://api.awhittlewandering.com/api/v1/health`
3. If still not working, check Cloudflare dashboard for route status
4. Verify DNS records are correct

## Workaround

Until the custom domain is fully active, use the worker URL:
- `https://awhittlewandering-api.kd8jc7v8cd.workers.dev`

This URL is always available and doesn't require custom domain configuration.

