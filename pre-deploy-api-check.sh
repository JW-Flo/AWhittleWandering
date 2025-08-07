#!/bin/bash
# Auto-generated deployment check for API configurations
# This runs before every deployment to ensure zero failures

echo "🔍 Pre-deployment API configuration check..."

# Check if API management system exists
if [ ! -f "api-management-system.js" ]; then
    echo "❌ API management system not found!"
    exit 1
fi

# Run comprehensive audit
node api-management-system.js audit

# Check audit results
if [ -f "api-config-status.json" ]; then
    CRITICAL_ISSUES=$(cat api-config-status.json | grep -o '"severity":"CRITICAL"' | wc -l)
    if [ "$CRITICAL_ISSUES" -gt 0 ]; then
        echo "❌ DEPLOYMENT BLOCKED: $CRITICAL_ISSUES critical API configuration issues found"
        echo "Run './setup-tessie-secrets.sh' to fix configurations"
        exit 1
    fi
    echo "✅ All API configurations verified - deployment can proceed"
else
    echo "❌ Unable to verify API configurations"
    exit 1
fi
