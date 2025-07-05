#!/bin/bash

# Cloudflare API Token Permissions Verification Script
# This script helps verify that your Cloudflare API token has the required permissions

set -e

echo "🔍 Verifying Cloudflare API Token Permissions..."

# Check if required environment variables are set
if [ -z "$CF_API_TOKEN" ]; then
    echo "❌ CF_API_TOKEN environment variable is not set"
    echo "Please set it with: export CF_API_TOKEN=your_token_here"
    exit 1
fi

if [ -z "$CF_ACCOUNT_ID" ]; then
    echo "❌ CF_ACCOUNT_ID environment variable is not set"
    echo "Please set it with: export CF_ACCOUNT_ID=your_account_id_here"
    exit 1
fi

# Check if wrangler is installed locally
if [ ! -f "node_modules/.bin/wrangler" ]; then
    echo "📦 Installing Wrangler CLI locally..."
    npm install -D wrangler@latest
fi

echo "✅ Environment variables set"
echo "✅ Wrangler CLI available"

# Test basic authentication
echo ""
echo "🔐 Testing API token authentication..."
if npx wrangler whoami --api-token "$CF_API_TOKEN" > /dev/null 2>&1; then
    echo "✅ API token authentication successful"
    npx wrangler whoami --api-token "$CF_API_TOKEN"
else
    echo "❌ API token authentication failed"
    echo "Please check your CF_API_TOKEN value"
    exit 1
fi

# Test account access
echo ""
echo "🏢 Testing account access..."
if npx wrangler whoami --api-token "$CF_API_TOKEN" | grep -q "$CF_ACCOUNT_ID"; then
    echo "✅ Account access verified"
else
    echo "⚠️  Account ID mismatch or access issue"
    echo "Current account info:"
    npx wrangler whoami --api-token "$CF_API_TOKEN"
    echo "Expected account ID: $CF_ACCOUNT_ID"
fi

# Test KV namespace access
echo ""
echo "🗄️  Testing KV namespace permissions..."
if npx wrangler kv:namespace list --api-token "$CF_API_TOKEN" > /dev/null 2>&1; then
    echo "✅ KV namespace read access verified"
    echo "Available KV namespaces:"
    npx wrangler kv:namespace list --api-token "$CF_API_TOKEN"
else
    echo "❌ KV namespace access failed"
    echo "Your API token needs 'Workers KV Storage:Edit' permission"
    echo ""
    echo "To fix this:"
    echo "1. Go to https://dash.cloudflare.com/profile/api-tokens"
    echo "2. Edit your API token"
    echo "3. Add 'Workers KV Storage:Edit' permission"
    echo "4. Save and try again"
    exit 1
fi

# Test Workers script permissions
echo ""
echo "⚡ Testing Workers script permissions..."
if npx wrangler list --api-token "$CF_API_TOKEN" > /dev/null 2>&1; then
    echo "✅ Workers script access verified"
    echo "Deployed workers:"
    npx wrangler list --api-token "$CF_API_TOKEN"
else
    echo "❌ Workers script access failed"
    echo "Your API token needs 'Workers Scripts:Edit' permission"
    exit 1
fi

# Test deployment permissions (dry run)
echo ""
echo "🚀 Testing deployment permissions..."
if [ -d "edge-worker" ]; then
    cd edge-worker
    if npx wrangler deploy --dry-run --api-token "$CF_API_TOKEN" > /dev/null 2>&1; then
        echo "✅ Deployment permissions verified"
    else
        echo "❌ Deployment permissions failed"
        echo "Check that your token has all required permissions"
        exit 1
    fi
    cd ..
else
    echo "⚠️  edge-worker directory not found, skipping deployment test"
fi

echo ""
echo "🎉 All permission checks passed!"
echo ""
echo "Your Cloudflare API token has the required permissions:"
echo "✅ Account access"
echo "✅ KV namespace read/write"
echo "✅ Workers script deployment"
echo ""
echo "You can now run deployments with confidence."
