#!/bin/bash
# Script to rotate credentials exposed in git history
# See SECURITY_INCIDENT_REMEDIATION.md for details

set -euo pipefail

echo "⚠️  CRITICAL: Credentials were exposed in git history"
echo "=================================================="
echo ""
echo "This script will help you rotate the exposed credentials."
echo ""
echo "Exposed credentials:"
echo "  - TESSIE_API_KEY: 64rbSGkMgblAZ5TaivBzokOGKTy72fYw"
echo "  - TESLA_VIN: 5YJYGDEE5LF027324"
echo ""
echo "⚠️  ACTION REQUIRED:"
echo "  1. Revoke the exposed TESSIE_API_KEY in your Tessie account"
echo "  2. Generate new credentials"
echo "  3. Update Cloudflare Workers secrets using the commands below"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

echo ""
echo "Step 1: Rotate TESSIE_API_KEY"
echo "-----------------------------"
echo "1. Log into https://tessie.com"
echo "2. Navigate to API settings"
echo "3. Revoke key: 64rbSGkMgblAZ5TaivBzokOGKTy72fYw"
echo "4. Generate a new API key"
echo ""
read -p "Have you revoked the old key and generated a new one? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please complete the rotation before continuing."
    exit 1
fi

echo ""
echo "Step 2: Update Cloudflare Workers Secrets"
echo "------------------------------------------"
echo "Run these commands to update secrets:"
echo ""
echo "  cd backend/edge-worker"
echo "  npx wrangler secret put TESSIE_API_KEY"
echo "  npx wrangler secret put TESLA_VIN"
echo "  npx wrangler secret put JWT_SECRET"
echo "  npx wrangler secret put MAPBOX_ACCESS_TOKEN"
echo "  npx wrangler secret put OPENWEATHER_API_KEY"
echo ""
read -p "Have you updated all Cloudflare Workers secrets? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please update the secrets before marking as complete."
    exit 1
fi

echo ""
echo "✅ Credential rotation complete!"
echo ""
echo "Next steps:"
echo "  1. Verify the application works with new credentials"
echo "  2. Consider cleaning git history (see SECURITY_INCIDENT_REMEDIATION.md)"
echo "  3. Review SECURITY_INCIDENT_REMEDIATION.md for additional security measures"
echo ""
