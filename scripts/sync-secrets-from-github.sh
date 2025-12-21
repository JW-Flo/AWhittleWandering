#!/bin/bash

# Sync Secrets from GitHub Actions to Cloudflare Workers
# This script can be run locally to sync secrets from GitHub Secrets
# Requires: GitHub CLI (gh) and Wrangler CLI

set -e

echo "🔄 Syncing Secrets from GitHub to Cloudflare Workers"
echo "=================================================="

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo "Install: https://cli.github.com/"
    exit 1
fi

# Check if Wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI is not installed"
    echo "Install: npm install -g wrangler"
    exit 1
fi

# Check if authenticated with GitHub
if ! gh auth status &> /dev/null; then
    echo "⚠️  Not authenticated with GitHub"
    echo "Run: gh auth login"
    exit 1
fi

# Get environment (default to development)
ENV=${1:-development}
echo "Environment: $ENV"

# Get repository name
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "Repository: $REPO"
echo ""

# Required secrets
SECRETS=(
    "TESSIE_API_KEY"
    "MAPBOX_ACCESS_TOKEN"
    "OPENWEATHER_API_KEY"
    "JWT_SECRET"
    "TESLA_VIN"
)

cd backend/edge-worker

# Sync each secret
for SECRET in "${SECRETS[@]}"; do
    echo "📦 Syncing $SECRET..."
    
    # Get secret from GitHub
    SECRET_VALUE=$(gh secret list --repo "$REPO" --json name,value --jq ".[] | select(.name==\"$SECRET\") | .value" 2>/dev/null || echo "")
    
    if [ -z "$SECRET_VALUE" ]; then
        echo "  ⚠️  Secret $SECRET not found in GitHub Secrets"
        echo "  Add it at: https://github.com/$REPO/settings/secrets/actions"
        continue
    fi
    
    # Set secret in Cloudflare Workers
    if [ "$ENV" == "production" ]; then
        echo "$SECRET_VALUE" | wrangler secret put "$SECRET" --env production
    else
        echo "$SECRET_VALUE" | wrangler secret put "$SECRET"
    fi
    
    echo "  ✅ $SECRET synced successfully"
done

echo ""
echo "✅ Secret sync complete!"
echo ""
echo "Verify secrets:"
if [ "$ENV" == "production" ]; then
    wrangler secret list --env production
else
    wrangler secret list
fi
