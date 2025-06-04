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

# Create or update .env file with required variables
echo "Creating .env file with required variables..."
cat > .env << EOL
VITE_MAPBOX_TOKEN=${MAPBOX_TOKEN}
VITE_APP_NAME="The Wandering Whittle"
EOL

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
