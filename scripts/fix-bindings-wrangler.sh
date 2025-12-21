#!/bin/bash

# Fix Cloudflare bindings using wrangler
# Since bindings are in wrangler.toml, deploying will apply them

set -e

cd "$(dirname "$0")/../backend/edge-worker"

echo "🔧 Fixing Cloudflare Worker Bindings"
echo ""

echo "📋 Current bindings in wrangler.toml:"
echo "  D1 Database: TESLA_DB → tesla-journey-tracker (${D1_DB_ID:-09a6ba85-bd36-4ad3-b5a8-92e230943dcb})"
echo "  R2 Bucket: MEDIA_BUCKET → awhittlewandering-media"
echo ""

echo "🚀 Deploying worker to apply bindings..."
echo ""

# Deploy to production (this will apply bindings from wrangler.toml)
if command -v wrangler &> /dev/null; then
    echo "Deploying to production environment..."
    wrangler deploy --env production
    
    echo ""
    echo "Deploying to development environment..."
    wrangler deploy --env development
    
    echo ""
    echo "✅ Deployment complete! Bindings should now be active."
    echo ""
    echo "🧪 Test connectivity:"
    echo "   npm run test:connectivity"
else
    echo "❌ wrangler not found. Install with: npm install -g wrangler"
    echo ""
    echo "Or deploy manually:"
    echo "   cd backend/edge-worker"
    echo "   npx wrangler deploy --env production"
    exit 1
fi

