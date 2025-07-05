# DNS Change Pre-deployment Checklist

## Current Status (as of verification)
- Target Site (continentalusa-site.pages.dev):
  - ❌ Returns 404 status
  - ❌ SSL certificate invalid
- WWW Domain (www.awhittlewandering.com):
  - ℹ️ Not yet configured (expected)
  - Current CNAME: None
- Main Domain (awhittlewandering.com):
  - ✅ Resolves to Cloudflare IPs:
    - 104.21.75.241
    - 172.67.183.167

## Required Actions Before DNS Change

1. **Fix Target Site Issues**
   - Deploy site content to `continentalusa-site.pages.dev`
   - Verify deployment through Cloudflare Pages dashboard
   - Test direct access to ensure 200 status code

2. **SSL Certificate Setup**
   - Ensure SSL is enabled in Cloudflare Pages settings
   - Wait for SSL certificate provisioning (can take up to 15 minutes)
   - Verify certificate validity using browser or SSL checker

3. **Cloudflare Configuration**
   - Verify Pages project settings
   - Check production branch deployment
   - Ensure custom domain settings are ready

4. **Rollback Plan**
   ```plaintext
   Current DNS Configuration:
   - Main domain: Points to Cloudflare proxy
   - WWW subdomain: Not configured
   - Target site: Pages deployment
   ```

5. **Post-Change Verification**
   - Run verification script again after DNS change
   - Test HTTPS access
   - Verify redirects and routing
   - Check SSL certificate validity

## DNS Change Process

1. Add CNAME record:
   ```
   Type: CNAME
   Name: www
   Content: continentalusa-site.pages.dev
   Proxy status: Proxied
   TTL: Auto
   ```

2. Wait for propagation (15-30 minutes)

3. Verify:
   ```bash
   npm run verify-dns
   ```

4. Monitor for any issues:
   - SSL errors
   - 404/5xx errors
   - Routing problems

## Emergency Rollback
If issues occur, revert CNAME record to original configuration:
```
Name: www
Content: awhittlewandering.com
