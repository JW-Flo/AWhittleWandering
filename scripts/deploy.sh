#!/bin/bash
set -e

echo "🚀 Deploying AWhittleWandering Tesla Tracker..."

# Build shared schemas
echo "📦 Building shared schemas..."
cd shared && bun run build && cd ..

# Deploy backend
echo "🌐 Deploying edge worker..."
cd backend/edge-worker
bun install
bun run build
npx wrangler deploy
cd ../..

echo "✅ Deployment complete!"
echo "🎯 Ready for Tesla telemetry data at: https://awhittlewandering-api.YOUR-SUBDOMAIN.workers.dev"
