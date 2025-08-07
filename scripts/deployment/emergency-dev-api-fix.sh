#!/bin/bash

# EMERGENCY API FIX - Copy Production Secrets to Development
# This will fix the real-time data issue immediately

set -e

echo "🚨 EMERGENCY API FIX FOR DEVELOPMENT ENVIRONMENT"
echo "==============================================="
echo "The app isn't working because development has NO API keys configured!"
echo "We need to copy all secrets from production to development."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cd "$(dirname "$0")/backend/edge-worker"

echo -e "${BLUE}📍 Current directory: $(pwd)${NC}"
echo ""

# Function to set secret for development
set_dev_secret() {
    local secret_name=$1
    
    echo -e "${BLUE}Setting $secret_name for development...${NC}"
    echo -e "${YELLOW}Please enter the value for $secret_name (same as production):${NC}"
    read -s secret_value
    
    if [ -z "$secret_value" ]; then
        echo -e "${RED}❌ ERROR: $secret_name cannot be empty${NC}"
        exit 1
    fi
    
    npx wrangler secret put "$secret_name" --env development <<< "$secret_value"
    
    echo -e "${GREEN}✅ $secret_name configured for development${NC}"
    echo ""
}

echo -e "${YELLOW}We need to set these 5 critical secrets for development:${NC}"
echo -e "${YELLOW}1. TESSIE_API_KEY (MOST CRITICAL - Tesla data)${NC}"
echo -e "${YELLOW}2. MAPBOX_ACCESS_TOKEN (Map services)${NC}"
echo -e "${YELLOW}3. JWT_SECRET (Authentication)${NC}"
echo -e "${YELLOW}4. TESLA_VIN (Vehicle identification)${NC}"
echo -e "${YELLOW}5. ADMIN_PASSWORD (Admin access)${NC}"
echo ""

# Set all development secrets
set_dev_secret "TESSIE_API_KEY"
set_dev_secret "MAPBOX_ACCESS_TOKEN"
set_dev_secret "JWT_SECRET"
set_dev_secret "TESLA_VIN"
set_dev_secret "ADMIN_PASSWORD"

echo -e "${GREEN}🎉 ALL DEVELOPMENT SECRETS CONFIGURED!${NC}"
echo "==============================================="
echo -e "${GREEN}✅ Development environment now has all 5 API keys${NC}"
echo -e "${GREEN}✅ Real-time Tesla data should now work${NC}"
echo -e "${GREEN}✅ Frontend can connect to backend APIs${NC}"
echo ""

# Verify the configuration
echo -e "${BLUE}🔍 Verifying development secrets...${NC}"
npx wrangler secret list --env development

echo ""
echo -e "${GREEN}🚀 READY FOR REAL-TIME DATA!${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo -e "${YELLOW}  • Deploy development: npx wrangler deploy --env development${NC}"
echo -e "${YELLOW}  • Test API: curl https://awhittlewandering-api-dev.kd8jc7v8cd.workers.dev/api/v1/health${NC}"
echo -e "${YELLOW}  • Run QA: npm run api:audit${NC}"
