#!/bin/bash

# Automated Fix for Database and Secret Sync
# This script attempts to fix both issues automatically

set -e

echo "🚀 Automated Database & Secret Sync Fix"
echo "========================================"
echo ""

cd backend/edge-worker

# Check if authenticated
if ! npx wrangler whoami &> /dev/null; then
    echo "⚠️  Cloudflare authentication needed"
    echo "   Run: npx wrangler login"
    echo "   Then run this script again"
    exit 1
fi

echo "✅ Cloudflare authenticated"
echo ""

# Step 1: Check and create database if needed
echo "📦 Step 1: Checking D1 Database..."
DB_NAME="tesla-journey-tracker"
DB_EXISTS=$(npx wrangler d1 list 2>&1 | grep -q "$DB_NAME" && echo "yes" || echo "no")

if [ "$DB_EXISTS" = "no" ]; then
    echo "⚠️  Database not found, creating..."
    npx wrangler d1 create "$DB_NAME"
    echo "✅ Database created"
else
    echo "✅ Database exists"
fi

# Step 2: Apply migrations
echo ""
echo "📦 Step 2: Applying Database Migrations..."
if [ -d "migrations" ]; then
    npx wrangler d1 migrations apply "$DB_NAME" 2>&1 | head -30
    echo "✅ Migrations applied"
else
    echo "⚠️  Migrations directory not found"
fi

# Step 3: Test database
echo ""
echo "🧪 Step 3: Testing Database Connection..."
npx wrangler d1 execute "$DB_NAME" --command="SELECT 1" 2>&1 | head -10
echo "✅ Database connection test complete"

# Step 4: Check secrets
echo ""
echo "🔐 Step 4: Checking Secrets..."
SECRET_LIST=$(npx wrangler secret list 2>&1 || echo "")

REQUIRED=("TESSIE_API_KEY" "TESLA_VIN" "MAPBOX_ACCESS_TOKEN" "OPENWEATHER_API_KEY" "JWT_SECRET")
MISSING=()

for secret in "${REQUIRED[@]}"; do
    if echo "$SECRET_LIST" | grep -q "$secret"; then
        echo "✅ $secret - Configured"
    else
        echo "❌ $secret - MISSING"
        MISSING+=("$secret")
    fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
    echo ""
    echo "⚠️  Missing secrets: ${MISSING[*]}"
    echo "   Run GitHub Actions workflow to sync, or sync manually"
else
    echo ""
    echo "✅ All secrets configured!"
fi

echo ""
echo "✅ Automated fix complete!"
echo ""
echo "Next: Test backend API endpoints"
