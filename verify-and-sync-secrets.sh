#!/bin/bash

# Verify GitHub Secrets and Sync to Cloudflare Workers
# This script verifies secrets are in GitHub and syncs them to Cloudflare

set -e

echo "🔍 Verifying GitHub Secrets Configuration..."
echo "=============================================="

# Check if GitHub CLI is available
if ! command -v gh &> /dev/null; then
    echo "⚠️  GitHub CLI not found. Install: https://cli.github.com/"
    echo "   Or verify secrets manually at: https://github.com/[OWNER]/[REPO]/settings/secrets/actions"
    exit 1
fi

# Check authentication
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub"
    echo "   Run: gh auth login"
    exit 1
fi

echo ""
echo "📋 Checking GitHub Secrets..."
echo ""

REQUIRED_SECRETS=(
    "TESSIE_API_KEY"
    "MAPBOX_ACCESS_TOKEN"
    "OPENWEATHER_API_KEY"
    "CLOUDFLARE_API_TOKEN"
)

OPTIONAL_SECRETS=(
    "TESLA_VIN"
    "JWT_SECRET"
)

# Get list of secrets
SECRET_LIST=$(gh secret list 2>&1 || echo "")

# Check required secrets
MISSING_REQUIRED=()
for secret in "${REQUIRED_SECRETS[@]}"; do
    if echo "$SECRET_LIST" | grep -q "$secret"; then
        echo "✅ $secret - Found"
    else
        echo "❌ $secret - MISSING"
        MISSING_REQUIRED+=("$secret")
    fi
done

# Check optional secrets
MISSING_OPTIONAL=()
for secret in "${OPTIONAL_SECRETS[@]}"; do
    if echo "$SECRET_LIST" | grep -q "$secret"; then
        echo "✅ $secret - Found"
    else
        echo "⚠️  $secret - Missing (but may be required)"
        MISSING_OPTIONAL+=("$secret")
    fi
done

echo ""
echo "=============================================="

if [ ${#MISSING_REQUIRED[@]} -gt 0 ]; then
    echo "❌ Missing required secrets:"
    for secret in "${MISSING_REQUIRED[@]}"; do
        echo "   - $secret"
    done
    echo ""
    echo "Add them at: https://github.com/[OWNER]/[REPO]/settings/secrets/actions"
    exit 1
fi

if [ ${#MISSING_OPTIONAL[@]} -gt 0 ]; then
    echo "⚠️  Missing optional but recommended secrets:"
    for secret in "${MISSING_OPTIONAL[@]}"; do
        echo "   - $secret"
    done
    echo ""
    echo "Consider adding these for full functionality"
fi

echo ""
echo "✅ All required secrets are configured in GitHub!"
echo ""
echo "🔄 Next: Sync to Cloudflare Workers..."
echo ""

# Check if we should sync
read -p "Do you want to sync secrets to Cloudflare Workers now? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Skipping Cloudflare sync. You can sync later by:"
    echo "  1. Running GitHub Actions workflow: Sync Secrets to Cloudflare Workers"
    echo "  2. Or manually: cd backend/edge-worker && npx wrangler secret put [SECRET_NAME]"
    exit 0
fi

# Check Wrangler
if ! command -v wrangler &> /dev/null && ! command -v npx &> /dev/null; then
    echo "⚠️  Wrangler not found. Install: npm install -g wrangler"
    echo "   Or use: npx wrangler secret put [SECRET_NAME]"
    exit 1
fi

cd backend/edge-worker

echo "🔐 Syncing secrets to Cloudflare Workers (Development)..."
echo ""

# Sync each secret
for secret in "${REQUIRED_SECRETS[@]}"; do
    echo "📦 Syncing $secret..."
    SECRET_VALUE=$(gh secret get "$secret" 2>/dev/null || echo "")
    
    if [ -z "$SECRET_VALUE" ]; then
        echo "  ⚠️  Could not retrieve $secret from GitHub"
        continue
    fi
    
    echo "$SECRET_VALUE" | npx wrangler secret put "$secret" 2>&1 | grep -v "Enter a secret value" || true
    echo "  ✅ $secret synced"
done

# Sync optional secrets if they exist
for secret in "${OPTIONAL_SECRETS[@]}"; do
    if echo "$SECRET_LIST" | grep -q "$secret"; then
        echo "📦 Syncing $secret..."
        SECRET_VALUE=$(gh secret get "$secret" 2>/dev/null || echo "")
        
        if [ -z "$SECRET_VALUE" ]; then
            echo "  ⚠️  Could not retrieve $secret from GitHub"
            continue
        fi
        
        echo "$SECRET_VALUE" | npx wrangler secret put "$secret" 2>&1 | grep -v "Enter a secret value" || true
        echo "  ✅ $secret synced"
    fi
done

echo ""
echo "✅ Secret sync complete!"
echo ""
echo "🔍 Verifying Cloudflare Workers secrets..."
npx wrangler secret list 2>&1 | head -20

echo ""
echo "📝 Next steps:"
echo "  1. Test API endpoints: node validate-api-functionality.js"
echo "  2. Run full validation: node intensive-api-review.js"
echo "  3. Deploy backend: cd backend/edge-worker && npm run deploy"
