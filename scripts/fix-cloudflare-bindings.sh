#!/bin/bash

# Script to verify and fix Cloudflare bindings for D1 and R2

set -e

cd "$(dirname "$0")/../backend/edge-worker"

echo "🔍 Checking Cloudflare bindings..."
echo ""

# Check D1 database
echo "📊 D1 Database:"
echo "  Database ID: 09a6ba85-bd36-4ad3-b5a8-92e230943dcb"
echo "  Database Name: tesla-journey-tracker"
echo ""
echo "  To verify in Cloudflare Dashboard:"
echo "  1. Go to: https://dash.cloudflare.com"
echo "  2. Select your account"
echo "  3. Workers & Pages → D1"
echo "  4. Look for 'tesla-journey-tracker'"
echo "  5. Verify the database ID matches: 09a6ba85-bd36-4ad3-b5a8-92e230943dcb"
echo ""

# Check R2 bucket
echo "🪣 R2 Storage:"
echo "  Bucket Name: awhittlewandering-media"
echo ""
echo "  To verify in Cloudflare Dashboard:"
echo "  1. Go to: https://dash.cloudflare.com"
echo "  2. Select your account"
echo "  3. R2 → Object Storage"
echo "  4. Look for 'awhittlewandering-media'"
echo "  5. Verify the bucket exists"
echo ""

# Check worker bindings
echo "🔗 Worker Bindings:"
echo "  Worker: awhittlewandering-api"
echo ""
echo "  To verify bindings in Cloudflare Dashboard:"
echo "  1. Go to: Workers & Pages → awhittlewandering-api"
echo "  2. Click 'Settings' tab"
echo "  3. Scroll to 'Variables' section"
echo "  4. Check 'D1 Database Bindings':"
echo "     - Binding name: TESLA_DB"
echo "     - Database: tesla-journey-tracker"
echo "  5. Check 'R2 Bucket Bindings':"
echo "     - Binding name: MEDIA_BUCKET"
echo "     - Bucket: awhittlewandering-media"
echo ""

echo "✅ If bindings are missing, add them:"
echo ""
echo "  For D1:"
echo "  1. In Worker Settings → Variables → D1 Database Bindings"
echo "  2. Click 'Add binding'"
echo "  3. Variable name: TESLA_DB"
echo "  4. Select database: tesla-journey-tracker"
echo "  5. Save"
echo ""
echo "  For R2:"
echo "  1. In Worker Settings → Variables → R2 Bucket Bindings"
echo "  2. Click 'Add binding'"
echo "  3. Variable name: MEDIA_BUCKET"
echo "  4. Select bucket: awhittlewandering-media"
echo "  5. Save"
echo ""

echo "🔄 After adding bindings, redeploy the worker:"
echo "  cd backend/edge-worker"
echo "  npx wrangler deploy --env production"
echo ""

