#!/bin/bash

echo "Deploying 48 Continental USA fixes..."

# Build the public site
echo "Building public site..."
cd 48Continental_Starter/public-site && bun run build

# Deploy to Cloudflare Pages
echo "Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist --project-name continentalusa-site

# Return to root directory
cd ../..

# Deploy edge worker
echo "Deploying edge worker..."
cd edge-worker && bun run deploy

echo "Deployment complete! Testing endpoints..."

# Test the deployment
cd .. && node scripts/check-api-data.cjs

echo "Fixes have been deployed and tested."
