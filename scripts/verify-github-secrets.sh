#!/bin/bash

# Script to verify GitHub secrets are configured
# This script checks for the presence of required secrets using GitHub CLI

echo "🔍 Verifying GitHub Secrets Configuration"
echo "========================================"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Please install it first:"
    echo "   brew install gh (macOS)"
    echo "   https://cli.github.com/manual/installation"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI. Please run: gh auth login"
    exit 1
fi

# Required secrets
REQUIRED_SECRETS=(
    "CF_API_TOKEN"
    "CF_ACCOUNT_ID"
    "TESSIE_API_TOKEN"
    "TESSIE_VIN"
    "OPENWEATHER_API_KEY"
    "MAPBOX_TOKEN"
    "EDGE_HMAC_KEY"
    "VITE_MAPBOX_TOKEN"
    "VITE_OPENWEATHER_API_KEY"
    "VITE_TESSIE_API_TOKEN"
    "VITE_TESSIE_VIN"
)

# Optional secrets
OPTIONAL_SECRETS=(
    "CONTINENTAL_API_KEY"
)

echo "Checking required secrets..."
echo ""

MISSING_SECRETS=()
FOUND_SECRETS=()

# Check each required secret
for secret in "${REQUIRED_SECRETS[@]}"; do
    if gh secret list | grep -q "^$secret"; then
        echo "✅ $secret - Found"
        FOUND_SECRETS+=("$secret")
    else
        echo "❌ $secret - Missing"
        MISSING_SECRETS+=("$secret")
    fi
done

echo ""
echo "Checking optional secrets..."
echo ""

# Check optional secrets
for secret in "${OPTIONAL_SECRETS[@]}"; do
    if gh secret list | grep -q "^$secret"; then
        echo "✅ $secret - Found (optional)"
    else
        echo "⚠️  $secret - Missing (optional)"
    fi
done

echo ""
echo "========================================"
echo "Summary:"
echo "  Found: ${#FOUND_SECRETS[@]} required secrets"
echo "  Missing: ${#MISSING_SECRETS[@]} required secrets"

if [ ${#MISSING_SECRETS[@]} -gt 0 ]; then
    echo ""
    echo "❌ Missing required secrets:"
    for secret in "${MISSING_SECRETS[@]}"; do
        echo "   - $secret"
    done
    echo ""
    echo "Please add these secrets in your GitHub repository:"
    echo "1. Go to Settings → Secrets and variables → Actions"
    echo "2. Click 'New repository secret'"
    echo "3. Add each missing secret"
    exit 1
else
    echo ""
    echo "✅ All required secrets are configured!"
fi

# Check for environment-specific configurations
echo ""
echo "Checking environment configurations..."
echo ""

# Check if .env files exist
if [ -f "48Continental_Starter/public-site/.env.local" ]; then
    echo "✅ Found .env.local for public site"
else
    echo "⚠️  No .env.local found for public site (may use GitHub secrets instead)"
fi

if [ -f "edge-worker/.dev.vars" ]; then
    echo "✅ Found .dev.vars for edge worker"
else
    echo "⚠️  No .dev.vars found for edge worker (may use GitHub secrets instead)"
fi

echo ""
echo "🎉 Verification complete!"
