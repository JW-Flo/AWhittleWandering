#!/bin/bash

# Tesla Data Ingestion Deployment Script
# Deploys the enhanced D1 schema and data ingestion system

set -e

echo "🚀 Deploying Tesla Data Ingestion System..."

# Navigate to backend directory
cd "$(dirname "$0")/backend/edge-worker"

echo "📋 Step 1: Apply enhanced database schema..."
wrangler d1 execute tesla-journey-tracker --file=migrations/0002_enhanced_data_structure.sql --remote

echo "🔧 Step 2: Deploy Worker with cron triggers..."
wrangler deploy

echo "🧪 Step 3: Test data ingestion endpoints..."

# Test health check
echo "Testing health endpoint..."
curl -f "https://awhittlewandering-api.kd8jc7v8cd.workers.dev/health" > /dev/null

# Test manual data ingestion (if Tessie API key is configured)
echo "Testing manual data ingestion..."
curl -f -X POST "https://awhittlewandering-api.kd8jc7v8cd.workers.dev/api/v1/admin/ingest-data" || echo "⚠️ Manual ingestion test failed (expected if Tessie API key not configured)"

# Test cron endpoints
echo "Testing cron endpoints..."
curl -f "https://awhittlewandering-api.kd8jc7v8cd.workers.dev/api/v1/cron/quality-check" > /dev/null || echo "⚠️ Quality check failed (expected if no data yet)"

echo "📊 Step 4: Verify database structure..."
wrangler d1 execute tesla-journey-tracker --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" --remote

echo "✅ Deployment complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Configure TESSIE_API_KEY in Cloudflare dashboard"
echo "2. Update vehicleVin in the cron endpoints"
echo "3. Cron triggers will automatically start populating data"
echo "4. Monitor /api/v1/cron/quality-check for data health"
echo ""
echo "🔄 Cron Schedule:"
echo "- Quick updates: Every 5 minutes (6 AM - 11 PM EST)"
echo "- Full sync: Every 30 minutes"
echo "- Historical backfill: Daily at 2 AM EST"
echo "- Quality checks: Every hour"
echo "- AI processing: Every 6 hours"
