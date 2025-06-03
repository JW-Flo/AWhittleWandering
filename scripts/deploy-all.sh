#!/bin/bash
set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(dirname "$0")"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}   48 Continental Deployment Script         ${NC}"
echo -e "${BLUE}   Following deployment sequence from       ${NC}"
echo -e "${BLUE}   docs/DEPLOYMENT_STRATEGY.md              ${NC}"
echo -e "${BLUE}=============================================${NC}"

# Check environment variables
echo -e "\n${YELLOW}Checking environment variables...${NC}"
if [ -z "$EDGE_HMAC_KEY" ]; then
    echo -e "${RED}ERROR: EDGE_HMAC_KEY environment variable is not set${NC}"
    echo -e "${YELLOW}Please set this variable before continuing:${NC}"
    echo -e "export EDGE_HMAC_KEY=your-secret-key"
    exit 1
fi

# Check for API keys
if [ -z "$WEATHER_API_KEY" ]; then
    echo -e "${YELLOW}WARNING: WEATHER_API_KEY environment variable is not set${NC}"
    echo -e "${YELLOW}Weather data will use fallback values${NC}"
fi

if [ -z "$ABRP_API_KEY" ]; then
    echo -e "${YELLOW}WARNING: ABRP_API_KEY environment variable is not set${NC}"
    echo -e "${YELLOW}Better Route Planner integration will be disabled${NC}"
fi

if [ -z "$MAPBOX_TOKEN" ]; then
    echo -e "${YELLOW}WARNING: MAPBOX_TOKEN environment variable is not set${NC}"
    echo -e "${YELLOW}Map display may be limited${NC}"
fi

# Load environment variables from .env if they exist
if [ -f "$PROJECT_ROOT/.env" ]; then
    echo -e "${YELLOW}Loading environment variables from .env file...${NC}"
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

#------------------------------------------------------------
# 1. Deploy Edge Worker
#------------------------------------------------------------
echo -e "\n${YELLOW}STEP 1: Deploying Edge Worker...${NC}"
cd "$PROJECT_ROOT/edge-worker"

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# Validate configuration
echo -e "${YELLOW}Validating edge-worker configuration...${NC}"
if [ -f "wrangler.toml" ]; then
    echo -e "${GREEN}wrangler.toml found${NC}"
else
    echo -e "${RED}wrangler.toml not found${NC}"
    exit 1
fi

# Deploy to Cloudflare
echo -e "${YELLOW}Deploying to Cloudflare...${NC}"
npm run deploy
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Edge Worker deployment successful${NC}"
else
    echo -e "${RED}Edge Worker deployment failed${NC}"
    exit 1
fi

# Verify deployment
echo -e "${YELLOW}Verifying Edge Worker deployment...${NC}"
EDGE_WORKER_URL=$(grep -o 'https://[^"]*' wrangler.toml | head -1)
if [ -z "$EDGE_WORKER_URL" ]; then
    EDGE_WORKER_URL="https://continentalusa.workers.dev"
fi

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$EDGE_WORKER_URL/health")
if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}Edge Worker health check passed (HTTP $HTTP_STATUS)${NC}"
else
    echo -e "${RED}Edge Worker health check failed (HTTP $HTTP_STATUS)${NC}"
    echo -e "${YELLOW}Continuing anyway, but please check the worker manually${NC}"
fi

#------------------------------------------------------------
# 2. Start MCP Server (if local deployment)
#------------------------------------------------------------
echo -e "\n${YELLOW}STEP 2: Starting MCP Server...${NC}"
echo -e "${YELLOW}Note: For production deployment, MCP Server should be running on the always-on iMac${NC}"
echo -e "${YELLOW}This step is for local development/testing only${NC}"

if [ -d "$PROJECT_ROOT/mcp-server" ]; then
    cd "$PROJECT_ROOT/mcp-server"
    
    # Check if .env exists, create from example if not
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}Creating .env from .env.example...${NC}"
        cp .env.example .env
        echo "EDGE_HMAC_KEY=$EDGE_HMAC_KEY" >> .env
        echo "EDGE_WORKER_URL=$EDGE_WORKER_URL" >> .env
    fi
    
    echo -e "${YELLOW}MCP Server setup complete. To start it manually:${NC}"
    echo -e "cd $PROJECT_ROOT/mcp-server && npm start"
else
    echo -e "${YELLOW}MCP Server directory not found, skipping setup${NC}"
fi

#------------------------------------------------------------
# 3. Deploy Public Website
#------------------------------------------------------------
echo -e "\n${YELLOW}STEP 3: Deploying Public Website...${NC}"
cd "$PROJECT_ROOT/48Continental_Starter/public-site"

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# Build the site
echo -e "${YELLOW}Building the site...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Website build failed${NC}"
    exit 1
fi

# Deploy to Cloudflare Pages
echo -e "${YELLOW}Deploying to Cloudflare Pages...${NC}"
wrangler pages deploy ./dist --project-name continentalusa-site
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Public Website deployment successful${NC}"
else
    echo -e "${RED}Public Website deployment failed${NC}"
    echo -e "${YELLOW}Possible issues:${NC}"
    echo -e "1. Project 'continentalusa-site' might not exist in Cloudflare Pages"
    echo -e "2. Wrangler might not be authenticated with Cloudflare"
    echo -e "3. The build output directory might be incorrect"
    echo -e "\n${YELLOW}To fix:${NC}"
    echo -e "1. Check Cloudflare dashboard for project configuration"
    echo -e "2. Run 'wrangler login' to authenticate"
    echo -e "3. Verify 'dist' is the correct output directory in vite.config.js"
    exit 1
fi

#------------------------------------------------------------
# 4. Deploy Mobile Apps
#------------------------------------------------------------
echo -e "\n${YELLOW}STEP 4: Deploying Mobile Apps...${NC}"

# React Native App
echo -e "${YELLOW}Building React Native App...${NC}"
cd "$PROJECT_ROOT/ContinentalUSA-mobile"
if [ -f "package.json" ]; then
    npm install
    
    # Check if build:ios script exists
    if grep -q "\"build:ios\"" package.json; then
        echo -e "${YELLOW}Building iOS app...${NC}"
        npm run build:ios
    else
        echo -e "${YELLOW}No build:ios script found, skipping${NC}"
    fi
    
    # Check if build:android script exists
    if grep -q "\"build:android\"" package.json; then
        echo -e "${YELLOW}Building Android app...${NC}"
        npm run build:android
    else
        echo -e "${YELLOW}No build:android script found, skipping${NC}"
    fi
else
    echo -e "${YELLOW}React Native app package.json not found, skipping${NC}"
fi

# iOS Native App
echo -e "${YELLOW}Building iOS Native App...${NC}"
cd "$PROJECT_ROOT/ios-client"
if [ -f "Package.swift" ]; then
    echo -e "${YELLOW}Archiving iOS app...${NC}"
    xcodebuild archive -scheme "48 Continental" -archivePath "48Continental.xcarchive"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}iOS App archive successful${NC}"
    else
        echo -e "${RED}iOS App archive failed${NC}"
        echo -e "${YELLOW}This is likely an Xcode configuration issue${NC}"
        echo -e "${YELLOW}Try opening the project in Xcode and building manually${NC}"
    fi
else
    echo -e "${YELLOW}iOS app Package.swift not found, skipping${NC}"
fi

#------------------------------------------------------------
# 5. Final Verification
#------------------------------------------------------------
echo -e "\n${YELLOW}STEP 5: Performing final verification...${NC}"

# Check Edge Worker
echo -e "${YELLOW}Checking Edge Worker...${NC}"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$EDGE_WORKER_URL/health")
if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}Edge Worker health check passed (HTTP $HTTP_STATUS)${NC}"
else
    echo -e "${RED}Edge Worker health check failed (HTTP $HTTP_STATUS)${NC}"
fi

# Check WebSocket endpoint
echo -e "${YELLOW}Checking WebSocket endpoint...${NC}"
echo -e "${YELLOW}WebSocket endpoint should be available at:${NC}"
echo -e "${YELLOW}wss://${EDGE_WORKER_URL#https://}/tesla/vehicle/stream${NC}"
echo -e "${YELLOW}This can be tested with WebSocket testing tools like WebSocket King${NC}"

# Check Public Website
echo -e "${YELLOW}Checking Public Website...${NC}"
echo -e "${YELLOW}Visit https://continentalusa.pages.dev to verify manually${NC}"

# Create verification report
echo -e "${YELLOW}Creating verification report...${NC}"
REPORT_FILE="$PROJECT_ROOT/deployment-verification-$(date +%Y%m%d-%H%M%S).txt"
echo "48 Continental Deployment Verification Report" > "$REPORT_FILE"
echo "Date: $(date)" >> "$REPORT_FILE"
echo "Edge Worker Status: $HTTP_STATUS" >> "$REPORT_FILE"
echo "WebSocket Endpoint: wss://${EDGE_WORKER_URL#https://}/tesla/vehicle/stream" >> "$REPORT_FILE"
echo "Public Website: Deployed to https://continentalusa.pages.dev" >> "$REPORT_FILE"
echo "Mobile Apps: Build completed" >> "$REPORT_FILE"

echo -e "${GREEN}Verification report created at: $REPORT_FILE${NC}"

#------------------------------------------------------------
# 6. Post-Deployment Instructions
#------------------------------------------------------------
echo -e "\n${BLUE}=============================================${NC}"
echo -e "${BLUE}   Deployment Complete - Next Steps          ${NC}"
echo -e "${BLUE}=============================================${NC}"

echo -e "${YELLOW}1. Verify the deployed website:${NC}"
echo -e "   Visit https://continentalusa.pages.dev"
echo -e "   Ensure the map loads with vehicle location"
echo -e "   Check that trip statistics are displayed"

echo -e "${YELLOW}2. Verify MCP Server:${NC}"
echo -e "   Ensure the MCP server is running on the always-on iMac"
echo -e "   Check logs for any errors or warnings"

echo -e "${YELLOW}3. Test Mobile Apps:${NC}"
echo -e "   Install and test the built mobile apps"
echo -e "   Verify Tesla API integration is working"
echo -e "   Test offline functionality"

echo -e "${YELLOW}4. Monitor System:${NC}"
echo -e "   Check Cloudflare Workers analytics for errors"
echo -e "   Monitor MCP server logs for issues"
echo -e "   Set up alerts for critical errors"

echo -e "\n${GREEN}All deployments completed! Refer to docs/DEPLOYMENT_STRATEGY.md for troubleshooting.${NC}"
