#!/bin/bash
set -euo pipefail

# Deploy Website Script for A Whittle Wandering
# This script handles deployment of the AWhittleWandering website to Cloudflare
# It ensures proper environment variables and handles both site and API workers

echo "===== A Whittle Wandering Deployment Script ====="
echo "Starting deployment process..."

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo "Error: .env file not found. Please create one with required variables."
  exit 1
fi

# Load environment variables
source .env

# Validate required environment variables
if [ -z "$CF_API_TOKEN" ] || [ -z "$CF_ACCOUNT_ID" ]; then
  echo "Error: CF_API_TOKEN and CF_ACCOUNT_ID must be set in .env file."
  exit 1
fi

if [ -z "$MAPBOX_TOKEN" ]; then
  echo "Error: MAPBOX_TOKEN must be set in .env file."
  exit 1
fi

if [ -z "$TESSIE_API_TOKEN" ] || [ -z "$TESSIE_VIN" ]; then
  echo "Error: TESSIE_API_TOKEN and TESSIE_VIN must be set in .env file."
  exit 1
fi

# Change to the awhittlewandering directory
cd awhittlewandering

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm ci
fi

# Update .env file for the frontend
echo "Creating/updating frontend .env file..."
cat > .env << EOF
# A Whittle Wandering Environment Variables
# Production configuration

# Cloudflare credentials
CF_API_TOKEN=$CF_API_TOKEN
CF_ACCOUNT_ID=$CF_ACCOUNT_ID

# Tesla vehicle telemetry via Tessie API
TESSIE_API_TOKEN=$TESSIE_API_TOKEN
TESSIE_VIN=$TESSIE_VIN

# Mapbox for mapping functionality
MAPBOX_TOKEN=$MAPBOX_TOKEN
VITE_MAPBOX_TOKEN=$MAPBOX_TOKEN
REACT_APP_MAPBOX_TOKEN=$MAPBOX_TOKEN

# Mapbox API token (private)
MAPBOX_API_TOKEN=$MAPBOX_API_TOKEN

# Edge HMAC key for API security
EDGE_HMAC_KEY=$EDGE_HMAC_KEY

# OpenWeather API for weather data
OPENWEATHER_API_KEY=$OPENWEATHER_API_KEY

# Deployment environment (production or staging)
DEPLOYMENT_ENV=production

# Configuration for frontend
VITE_ENABLE_STREAMING=true
VITE_MAP_RETRY_ATTEMPTS=3
VITE_MAP_RETRY_DELAY=2000
VITE_APP_NAME=A Whittle Wandering
EOF

echo "Building the application..."
npm run build:all

echo "Deploying the site worker..."
CLOUDFLARE_API_TOKEN=$CF_API_TOKEN CLOUDFLARE_ACCOUNT_ID=$CF_ACCOUNT_ID npx wrangler deploy --config wrangler-site.toml

echo "Deploying the API worker..."
CLOUDFLARE_API_TOKEN=$CF_API_TOKEN CLOUDFLARE_ACCOUNT_ID=$CF_ACCOUNT_ID npx wrangler deploy --config wrangler.toml

echo "===== Deployment completed successfully! ====="
echo "Website should now be available at https://awhittlewandering.com"
echo "API should be available at https://api.awhittlewandering.com"

# Store the current commit as the last good deploy
cd ..
git rev-parse --short HEAD > .last_good_deploy
echo "Stored $(cat .last_good_deploy) as the last good deployment."
