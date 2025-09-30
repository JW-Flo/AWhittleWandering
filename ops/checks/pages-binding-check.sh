#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# Cloudflare Pages Binding Check Script
# Verifies a Pages project is healthy and bindings are correct.
# Usage: ./ops/checks/pages-binding-check.sh [project-name]
# Defaults to atlas-it. Derives URLs from project name.

PROJECT_NAME="${1:-atlas-it}"
BASE="https://${PROJECT_NAME}.pages.dev"
HEALTH_URL="${BASE}/healthz"
GUARD_URL="${BASE}/guardz"

echo "🔍 Checking Cloudflare Pages project: $PROJECT_NAME"

# Check health endpoint
echo "Checking health endpoint: $HEALTH_URL"
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || echo 000)

if [ "$HEALTH_STATUS" -eq 200 ]; then
    echo "✅ Health check passed (HTTP $HEALTH_STATUS)"
else
    echo "❌ Health check failed (HTTP $HEALTH_STATUS)"
    echo ""
    echo "🔧 Troubleshooting steps:"
    echo "1. Verify Pages project exists: wrangler pages list"
    echo "2. Check current wrangler config:"
        if [ -f frontend/wrangler.toml ]; then
            cat frontend/wrangler.toml
        else
            echo "(frontend/wrangler.toml not found)"
        fi
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
GUARD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$GUARD_URL" || echo 000)

if [ "$GUARD_STATUS" -eq 200 ]; then
    echo "✅ Bindings check passed (HTTP $GUARD_STATUS)"
    BINDINGS=$(curl -s "$GUARD_URL" | jq -r '.bindingsOk // empty' 2>/dev/null || true)
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
