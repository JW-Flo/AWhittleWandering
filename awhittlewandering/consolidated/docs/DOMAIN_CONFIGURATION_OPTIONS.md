# Domain Configuration Options for 48 Continental USA

## Current Configuration Status

The project currently contains references to a custom domain `trip.thewanderingwhittle.com` in various configuration files, primarily:

- `edge-worker/wrangler.toml` - for edge worker routing
- Various scripts for deployment testing and verification

However, this subdomain is **not currently set up or registered**, which explains the 403 errors when trying to access it.

## Options for Deployment

You have two main options for proceeding with deployment:

### Option 1: Continue Using workers.dev Domain (Simpler)

The Edge Worker is already functioning correctly on the workers.dev domain:
- **URL**: `https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev`
- **Status**: Working (verified by monitoring script)

#### Steps for This Approach:

1. **Update Frontend Configuration**:
   - Modify the frontend to use the workers.dev URL for API endpoints
   - Update `.env.production` in the public site to point to the workers.dev domain

2. **Update Monitoring Scripts**:
   - Modify the monitoring scripts to primarily check the workers.dev domain
   - Consider the custom domain checks as optional/future features

3. **Update Documentation**:
   - Update project documentation to reflect the use of workers.dev domain

#### Benefits:
- No domain registration required
- Works immediately
- No DNS configuration needed

### Option 2: Set Up the Custom Domain (More Professional)

If you prefer using a custom domain for production:

#### Steps for This Approach:

1. **Register Domain**:
   - Register `thewanderingwhittle.com` with a domain registrar if not already registered
   - Add the domain to your Cloudflare account

2. **Configure DNS**:
   - In Cloudflare, add a DNS record for the `trip` subdomain:
     ```
     Type: CNAME
     Name: trip
     Target: thewanderingwhittle-edge.kd8jc7v8cd.workers.dev
     Proxy status: Proxied
     ```

3. **Verify Worker Configuration**:
   - The worker is already configured for this domain in `wrangler.toml`
   - Ensure the `zone_name` is correctly set to `thewanderingwhittle.com`

4. **SSL/TLS Configuration**:
   - In Cloudflare dashboard, set SSL/TLS mode to "Full" or "Full (Strict)"
   - Ensure Universal SSL is enabled

#### Benefits:
- More professional appearance
- Better branding
- Can add multiple subdomains for different services

## Recommended Approach

If this is for a demonstration, proof of concept, or development, **Option 1** (workers.dev) is sufficient and simpler.

If this is for a production deployment, **Option 2** (custom domain) provides a more professional and branded experience.

## Configuration Updates Required

### For Option 1 (workers.dev)

Update these files to remove custom domain dependencies:

1. **Public Site Environment Variables**:
   ```bash
   # Update 48Continental_Starter/public-site/.env.production
   VITE_API_BASE_URL=https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev
   ```

2. **Edge Worker Configuration**:
   - Modify `edge-worker/wrangler.toml` to remove the custom domain route or keep it as a commented section for future use.

3. **Fix Scripts**:
   - Update monitoring scripts to focus on the workers.dev domain
   - Add comments that custom domain checks are expected to fail

### For Option 2 (Custom Domain)

1. **Domain Registration and Configuration**:
   - Register and configure as described above
   - Verify DNS propagation (can take 24-48 hours)

2. **No Code Changes Required**:
   - Current configuration already supports this option once DNS is set up

## Testing the Deployment

Regardless of which option you choose, use these commands to test:

```bash
# Check edge worker status
./scripts/monitor-deployment.sh

# If using Option 1 (workers.dev), focus on these outputs:
# - "Edge Worker (workers.dev) is UP"
# - "workers.dev Domain API endpoints" results

# If using Option 2 (custom domain), verify both:
# - "Edge Worker (workers.dev) is UP"
# - "Edge Worker (Custom Domain) is UP"
```

## Conclusion

The core system is functioning properly on the workers.dev domain, so the choice between options depends on your specific requirements for professionalism, branding, and deployment timeline.
