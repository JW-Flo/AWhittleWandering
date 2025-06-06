#!/bin/bash
# deploy-public-site.sh
# Script to deploy the public site to Cloudflare Pages
# Usage: ./scripts/deploy-public-site.sh

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo -e "${BOLD}=========================================${NC}"
echo -e "${BOLD}48 Continental USA - Public Site Deployment${NC}"
echo -e "${BOLD}=========================================${NC}"

# Check for Cloudflare API token
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo -e "${YELLOW}Cloudflare API token not found in environment.${NC}"
    echo -e "${YELLOW}Please enter your Cloudflare API token:${NC}"
    read -s CLOUDFLARE_API_TOKEN
    export CLOUDFLARE_API_TOKEN
fi

# Check for Cloudflare Account ID
if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
    echo -e "${YELLOW}Cloudflare Account ID not found in environment.${NC}"
    echo -e "${YELLOW}Please enter your Cloudflare Account ID:${NC}"
    read CLOUDFLARE_ACCOUNT_ID
    export CLOUDFLARE_ACCOUNT_ID
fi

# Main function
deploy_public_site() {
    echo -e "\n${BOLD}Step 1: Setting up environment${NC}"
    
    # Navigate to public site directory
    cd "$(dirname "$0")/../48Continental_Starter/public-site" || exit 1
    
    # Ensure the dist directory is clean
    if [ -d "dist" ]; then
        echo "Cleaning dist directory..."
        rm -rf dist
    fi
    
    # Copy environment file
    echo "Setting up environment variables..."
    if [ -f ".env.production" ]; then
        cp .env.production .env
        echo -e "${GREEN}Using .env.production as environment file${NC}"
    else
        echo -e "${YELLOW}Warning: .env.production not found, using .env.example${NC}"
        cp .env.example .env
    fi
    
    # Ensure the API endpoint is set correctly
    echo "VITE_API_BASE_URL=https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev" >> .env
    echo "VITE_MAPBOX_TOKEN=pk.eyJ1IjoidGhld2FuZGVyaW5nd2hpdHRsZSIsImEiOiJjbHQxaXhzejYwYmU2MmpxdHl0MHowN3UzIn0.Q7xKTRlXvtimBHd39JqN1A" >> .env
    
    echo -e "\n${BOLD}Step 2: Installing dependencies${NC}"
    echo "Running npm ci..."
    npm ci
    
    echo -e "\n${BOLD}Step 3: Building the site${NC}"
    echo "Running npm run build..."
    npm run build
    
    echo -e "\n${BOLD}Step 4: Deploying to Cloudflare Pages${NC}"
    echo "Installing wrangler..."
    npm install -D wrangler@latest
    
    echo "Deploying to Cloudflare Pages..."
    npx wrangler pages deploy dist --project-name=continentalusa-site
    
    echo -e "\n${BOLD}Step 5: Verifying deployment${NC}"
    # Wait a moment for the deployment to propagate
    echo "Waiting for deployment to propagate..."
    sleep 10
    
    # Check if the site is accessible
    echo "Checking if site is accessible..."
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://continentalusa-site.pages.dev)
    
    if [ "$HTTP_STATUS" == "200" ]; then
        echo -e "${GREEN}✅ Deployment successful! Site is accessible.${NC}"
    else
        echo -e "${YELLOW}⚠️ Site returned HTTP status $HTTP_STATUS. Deployment may need more time to propagate.${NC}"
    fi
    
    echo -e "\n${GREEN}${BOLD}Public site deployment process completed!${NC}"
    echo -e "${BOLD}Public Site URL: https://continentalusa-site.pages.dev${NC}"
}

# Run the main function
deploy_public_site

# Return to original directory
cd - > /dev/null

echo -e "\n${BOLD}=========================================${NC}"
echo -e "${GREEN}${BOLD}Deployment script completed!${NC}"
echo -e "${BOLD}Next steps:${NC}"
echo -e "1. Verify that the site is working correctly"
echo -e "2. Check that it connects to the Edge Worker API"
echo -e "3. Verify that vehicle telemetry data is displayed"
echo -e "4. Update the DEPLOYMENT_STATUS.md document"
echo -e "${BOLD}=========================================${NC}"
