# 48 Continental USA - Final Deployment Steps

This document provides step-by-step instructions to finalize the deployment of the 48 Continental USA road trip tracking system.

## Deployment Decision: Domain Strategy

Before proceeding, decide which domain strategy to use:

### Option A: Continue with workers.dev domain (Simpler)

- **Edge Worker URL**: https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev
- **Public Site URL**: https://main.continentalusa-site.pages.dev
- **Pro**: Already configured and working
- **Con**: Less professional, longer URL

### Option B: Use custom domain (More professional)

- **Edge Worker URL**: https://trip.thewanderingwhittle.com
- **Public Site URL**: Could also be configured with custom domain
- **Pro**: More professional, branded experience
- **Con**: Requires domain registration and additional configuration

## Step 1: Final Configuration Updates

### For Option A (workers.dev domain)

1. Ensure the frontend correctly points to the workers.dev API:

```bash
# Verify .env.production has correct API URL
cat 48Continental_Starter/public-site/.env.production

# If needed, update API URL to workers.dev domain
cat << EOF > 48Continental_Starter/public-site/.env.production
REACT_APP_API_URL=https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev
REACT_APP_MAPBOX_TOKEN=[your mapbox token]
REACT_APP_VERSION=1.0.0
EOF
```

2. Update wrangler.toml to explicitly enable workers.dev:

```bash
cd edge-worker
# Ensure workers_dev is set to true in wrangler.toml
node ../scripts/fix-deployment-routes.cjs
```

### For Option B (custom domain)

1. Register the domain if not already owned
2. Configure DNS in Cloudflare:
   - Add domain to Cloudflare account
   - Set up DNS records pointing to Cloudflare Workers
3. Update wrangler.toml with custom domain:

```bash
cd edge-worker
# Edit wrangler.toml to add custom domain
# Example: 
# routes = ["https://trip.thewanderingwhittle.com/*"]
# Set workers_dev = true to keep workers.dev domain as fallback
```

4. Update frontend .env.production to point to custom domain:

```bash
cat << EOF > 48Continental_Starter/public-site/.env.production
REACT_APP_API_URL=https://trip.thewanderingwhittle.com
REACT_APP_MAPBOX_TOKEN=[your mapbox token]
REACT_APP_VERSION=1.0.0
EOF
```

## Step 2: Final Deployment via GitHub Actions

1. Ensure all GitHub secrets are configured:

```bash
bash scripts/verify-github-secrets.sh
# If missing secrets, run:
bash scripts/upload-missing-secrets.sh
```

2. Update GitHub Actions workflow file if needed:

```bash
# Review workflow file
cat .github/workflows/deploy-all-final.yml

# Make any necessary adjustments
```

3. Commit and push all changes to trigger GitHub Actions deployment:

```bash
git add .
git commit -m "Final deployment configuration"
git push origin main
```

4. Monitor GitHub Actions workflow execution to ensure successful deployment

## Step 3: Manual Deployment (Alternative to GitHub Actions)

If GitHub Actions is not configured, perform manual deployment:

### Deploy Edge Worker

```bash
cd edge-worker
npm install
npx wrangler deploy
```

### Deploy Public Site

```bash
cd 48Continental_Starter/public-site
npm install
npm run build
npx wrangler pages deploy build
```

## Step 4: Verify Deployment

1. Run the monitoring script to check all components:

```bash
bash scripts/monitor-deployment.sh
```

2. Verify API endpoints are working correctly:

```bash
node scripts/check-api-data.cjs
```

3. Check the public site in a browser to ensure it's loading properly:
   - Visit https://main.continentalusa-site.pages.dev
   - Verify map displays correctly
   - Verify vehicle data appears
   - Verify trip data is visible
   - Check that state tracking is correct

## Step 5: Configure MCP Server for Persistent Operation

1. Install MCP server dependencies:

```bash
cd mcp-server
npm install
```

2. Create or update .env file with necessary configuration:

```bash
cp .env.example .env
# Edit .env with appropriate values
```

3. Set up systemd service for persistent operation (Linux/Mac):

```bash
# Create systemd service file
cat << EOF > /tmp/48continental-mcp.service
[Unit]
Description=48 Continental USA MCP Server
After=network.target

[Service]
User=your-username
WorkingDirectory=/path/to/ContinentalUSA/mcp-server
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=48continental-mcp

[Install]
WantedBy=multi-user.target
EOF

# Install service file
sudo mv /tmp/48continental-mcp.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable 48continental-mcp
sudo systemctl start 48continental-mcp
```

4. Verify MCP server is running:

```bash
sudo systemctl status 48continental-mcp
# or check logs
sudo journalctl -u 48continental-mcp
```

## Step 6: Final Checklist

- [ ] Edge Worker is deployed and all API endpoints are working
- [ ] Public site is deployed and connecting to API correctly
- [ ] KV namespaces are populated with required data
- [ ] Vehicle data is being correctly pulled from Tessie API
- [ ] Trip data shows correct states visited and progress
- [ ] Weather data is displaying for current location
- [ ] MCP server is running persistently and buffering telemetry
- [ ] Monitoring scripts are running and reporting all systems operational
- [ ] Documentation is updated with final deployment status

## Troubleshooting

If any issues are encountered during the final deployment:

1. Check `docs/DEPLOYMENT_TROUBLESHOOTING.md` for common issues and solutions
2. Run `scripts/cloudflare-diagnostic.js` to diagnose Cloudflare-specific issues
3. Verify environment variables in `.dev.vars` and `.env.production` files
4. Check Cloudflare dashboard for any worker or Pages errors
5. Review GitHub Actions logs for deployment errors

## Post-Deployment Maintenance

1. Set up regular monitoring:
   - Configure monitoring script to run via cron
   - Set up alerts for any downtime or issues

2. Update trip data as the journey progresses:
   - Use `scripts/upload-itinerary-data.cjs` to update trip progress
   - MCP server should automatically sync with edge worker

3. Backup important data:
   - Regularly export KV namespace data
   - Backup edge worker code and configurations

4. Plan for scaling:
   - Monitor usage and adjust Cloudflare Workers limits if needed
   - Consider adding additional edge locations if traffic increases
