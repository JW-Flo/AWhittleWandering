#!/bin/bash
# The Wandering Whittle - Cloudflare Pages Deployment Script
# This script builds and deploys the site to Cloudflare Pages with proper configuration

# Exit on error
set -e

# Display execution steps
set -x

# Configuration
CLOUDFLARE_ACCOUNT_ID="620865722bd88ef0a77dbbb60c91392e"
PROJECT_NAME="wandering-whittle"
PRODUCTION_BRANCH="main"
MAPBOX_TOKEN="pk.eyJ1IjoidGhld2FuZGVyaW5nd2hpdHRsZSIsImEiOiJjbHQxaXhzejYwYmU2MmpxdHl0MHowN3UzIn0.Q7xKTRlXvtimBHd39JqN1A"

# Check if running in CI or locally
if [ -z "$CI" ]; then
  echo "Running in local environment"
  # Make sure wrangler is installed
  if ! command -v npx &> /dev/null; then
    echo "Error: npx is not installed. Please install Node.js and npm."
    exit 1
  fi
else
  echo "Running in CI environment"
fi

# Go to the public site directory
cd "$(dirname "$0")"

# Do NOT overwrite the existing .env file, just ensure required vars are set
if [ ! -f .env ]; then
  echo "Creating .env file with required variables..."
  cat > .env << EOL
VITE_MAPBOX_TOKEN=${MAPBOX_TOKEN}
VITE_APP_NAME="The Wandering Whittle"
VITE_EDGE_WORKER_URL=https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev
VITE_WEBSOCKET_ENDPOINT=wss://thewanderingwhittle-edge.workers.dev/ws
VITE_API_BASE_URL=https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev
VITE_ENABLE_STREAMING=true
VITE_USE_SIMULATED_DATA=true
EOL
else
  echo "Using existing .env file and ensuring required vars are set"
  # Ensure MAPBOX_TOKEN is set correctly, but preserve other values
  if grep -q "VITE_MAPBOX_TOKEN=" .env; then
    sed -i '' "s|VITE_MAPBOX_TOKEN=.*|VITE_MAPBOX_TOKEN=${MAPBOX_TOKEN}|" .env
  else
    echo "VITE_MAPBOX_TOKEN=${MAPBOX_TOKEN}" >> .env
  fi
  
  # Ensure app name is set
  if ! grep -q "VITE_APP_NAME=" .env; then
    echo 'VITE_APP_NAME="The Wandering Whittle"' >> .env
  fi
  
  # Make sure fallback to simulated data is available
  if ! grep -q "VITE_USE_SIMULATED_DATA=" .env; then
    echo 'VITE_USE_SIMULATED_DATA=true' >> .env
  fi
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the site for production
echo "Building site for production..."
npm run build

# Verify build output
if [ ! -d "dist" ]; then
  echo "Error: Build failed - dist directory not found"
  exit 1
fi

# Deploy to Cloudflare Pages
echo "Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist \
  --project-name="$PROJECT_NAME" \
  --branch="$PRODUCTION_BRANCH" \
  --commit-message="Deploy The Wandering Whittle site $(date)" \
  --compatibility-date="2025-06-03"

# Run post-deployment verification
echo "Running post-deployment verification..."
# Uncomment to add additional verification steps
# npx wrangler pages deployment list --project-name="$PROJECT_NAME"

echo "✅ Deployment complete!"
echo "🌎 Your site should be available at: https://$PROJECT_NAME.pages.dev"
echo "⚡ Live site: https://thewanderingwhittle.com"
