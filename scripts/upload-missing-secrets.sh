#!/bin/bash

# Script to upload missing GitHub secrets based on local environment files
# Requires GitHub CLI (gh) to be installed and authenticated

set -e

echo "🔒 Uploading missing GitHub secrets..."
echo "========================================"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Please install it first:"
    echo "   https://cli.github.com/manual/installation"
    exit 1
fi

# Check if user is authenticated with GitHub
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub. Please run:"
    echo "   gh auth login"
    exit 1
fi

# Extract secrets from local files
EDGE_DEV_VARS="edge-worker/.dev.vars"
PUBLIC_ENV_PROD="48Continental_Starter/public-site/.env.production"

# Check if files exist
if [ ! -f "$EDGE_DEV_VARS" ]; then
    echo "❌ $EDGE_DEV_VARS file not found"
    exit 1
fi

if [ ! -f "$PUBLIC_ENV_PROD" ]; then
    echo "❌ $PUBLIC_ENV_PROD file not found"
    exit 1
fi

# Extract values
TESSIE_VIN=$(grep -o 'VITE_TESSIE_VIN=[^[:space:]]*' "$PUBLIC_ENV_PROD" | cut -d= -f2)
MAPBOX_TOKEN=$(grep -o 'VITE_MAPBOX_TOKEN=[^[:space:]]*' "$PUBLIC_ENV_PROD" | cut -d= -f2)
TESSIE_API_TOKEN=$(grep -o 'VITE_TESSIE_API_TOKEN=[^[:space:]]*' "$PUBLIC_ENV_PROD" | cut -d= -f2)

# Verify values were found
if [ -z "$TESSIE_VIN" ]; then
    echo "❌ Could not find VITE_TESSIE_VIN in $PUBLIC_ENV_PROD"
    exit 1
fi

if [ -z "$MAPBOX_TOKEN" ]; then
    echo "❌ Could not find VITE_MAPBOX_TOKEN in $PUBLIC_ENV_PROD"
    exit 1
fi

if [ -z "$TESSIE_API_TOKEN" ]; then
    echo "❌ Could not find VITE_TESSIE_API_TOKEN in $PUBLIC_ENV_PROD"
    exit 1
fi

# Upload secrets
echo "📤 Uploading TESSIE_VIN..."
echo "$TESSIE_VIN" | gh secret set TESSIE_VIN

echo "📤 Uploading MAPBOX_TOKEN..."
echo "$MAPBOX_TOKEN" | gh secret set MAPBOX_TOKEN

echo "📤 Uploading VITE_TESSIE_API_TOKEN..."
echo "$TESSIE_API_TOKEN" | gh secret set VITE_TESSIE_API_TOKEN

echo "📤 Uploading VITE_TESSIE_VIN..."
echo "$TESSIE_VIN" | gh secret set VITE_TESSIE_VIN

echo "========================================"
echo "✅ All missing secrets have been uploaded!"
echo "You can now run ./scripts/verify-github-secrets.sh to confirm."
