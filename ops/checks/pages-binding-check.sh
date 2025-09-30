#!/bin/bash

# Cloudflare Pages Binding Check Script
# Verifies atlas-it Pages project is healthy and bindings are correct

PROJECT_NAME="atlas-it"
HEALTH_URL="https://atlas-it.pages.dev/healthz"
GUARD_URL="https://atlas-it.pages.dev/guardz"

echo "🔍 Checking Cloudflare Pages project: $PROJECT_NAME"

# Check health endpoint
echo "Checking health endpoint: $HEALTH_URL"
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")

if [ "$HEALTH_STATUS" -eq 200 ]; then
    echo "✅ Health check passed (HTTP $HEALTH_STATUS)"
else
    echo "❌ Health check failed (HTTP $HEALTH_STATUS)"
    echo ""
    echo "🔧 Troubleshooting steps:"
    echo "1. Verify Pages project exists: wrangler pages list"
    echo "2. Check current wrangler config:"
    cat frontend/wrangler.toml
    echo ""
    echo "3. Fallback to atlasit-platform:"
    echo "   wrangler pages deploy dist --project-name atlasit-platform"
    echo ""
    echo "4. Or create new project:"
    echo "   wrangler pages create atlas-it"
    exit 1
fi

# Check bindings endpoint (if exists)
echo "Checking bindings endpoint: $GUARD_URL"
GUARD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$GUARD_URL")

if [ "$GUARD_STATUS" -eq 200 ]; then
    echo "✅ Bindings check passed (HTTP $GUARD_STATUS)"
    BINDINGS=$(curl -s "$GUARD_URL" | jq '.bindingsOk' 2>/dev/null)
    if [ "$BINDINGS" = "true" ]; then
        echo "✅ All bindings OK"
    else
        echo "⚠️  Bindings may have issues"
    fi
else
    echo "⚠️  Bindings endpoint not available (HTTP $GUARD_STATUS)"
fi

echo ""
echo "🎉 Pages project $PROJECT_NAME is healthy!"
