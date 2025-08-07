#!/bin/bash

# AUTOMATED DEVELOPMENT SECRETS SETUP
# Reads from dev-secrets-config.env and applies all secrets to development environment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔐 AUTOMATED DEVELOPMENT SECRETS SETUP${NC}"
echo "========================================"

# Check if config file exists
if [ ! -f "dev-secrets-config.env" ]; then
    echo -e "${RED}❌ ERROR: dev-secrets-config.env file not found${NC}"
    echo -e "${YELLOW}Please create the file with your secret values first${NC}"
    exit 1
fi

# Navigate to backend directory
cd backend/edge-worker

echo -e "${BLUE}📍 Setting secrets in development environment...${NC}"
echo ""

# Read the config file and set each secret
while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip comments and empty lines
    if [[ "$key" =~ ^#.*$ ]] || [[ -z "$key" ]] || [[ -z "$value" ]]; then
        continue
    fi
    
    # Remove any whitespace
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)
    
    if [ -n "$value" ]; then
        echo -e "${BLUE}Setting $key...${NC}"
        
        # Validate based on key type
        case "$key" in
            "TESSIE_API_KEY")
                if [[ ! $value =~ ^[A-Za-z0-9_-]+$ ]]; then
                    echo -e "${RED}❌ ERROR: TESSIE_API_KEY format invalid${NC}"
                    exit 1
                fi
                ;;
            "MAPBOX_ACCESS_TOKEN")
                if [[ ! $value =~ ^pk\. ]]; then
                    echo -e "${RED}❌ ERROR: MAPBOX_ACCESS_TOKEN must start with 'pk.'${NC}"
                    exit 1
                fi
                ;;
            "OPENWEATHER_API_KEY")
                if [[ ! $value =~ ^[a-f0-9]{32}$ ]]; then
                    echo -e "${RED}❌ ERROR: OPENWEATHER_API_KEY must be 32 hex characters${NC}"
                    exit 1
                fi
                ;;
            "JWT_SECRET")
                if [ ${#value} -lt 32 ]; then
                    echo -e "${RED}❌ ERROR: JWT_SECRET must be at least 32 characters${NC}"
                    exit 1
                fi
                ;;
            "TESLA_VIN")
                if [[ ! $value =~ ^[A-HJ-NPR-Z0-9]{17}$ ]]; then
                    echo -e "${RED}❌ ERROR: TESLA_VIN must be 17 characters (valid VIN format)${NC}"
                    exit 1
                fi
                ;;
        esac
        
        # Set the secret
        if npx wrangler secret put "$key" --env development <<< "$value"; then
            echo -e "${GREEN}✅ $key configured successfully${NC}"
        else
            echo -e "${RED}❌ Failed to set $key${NC}"
            exit 1
        fi
        echo ""
    else
        echo -e "${YELLOW}⚠️  Skipping $key (no value provided)${NC}"
    fi
done < "../../dev-secrets-config.env"

# Go back to root
cd ../../

echo -e "${GREEN}🎉 ALL DEVELOPMENT SECRETS CONFIGURED!${NC}"
echo ""

# Verify configuration
echo -e "${BLUE}🔍 Verifying configuration...${NC}"
if npm run api:audit; then
    echo -e "${GREEN}✅ All secrets verified successfully!${NC}"
else
    echo -e "${YELLOW}⚠️  Some configuration issues remain${NC}"
fi

# Security cleanup
echo -e "${BLUE}🔒 Cleaning up config file for security...${NC}"
if [ -f "dev-secrets-config.env" ]; then
    rm dev-secrets-config.env
    echo -e "${GREEN}✅ Configuration file deleted for security${NC}"
fi

echo ""
echo -e "${GREEN}🚀 DEVELOPMENT ENVIRONMENT READY!${NC}"
echo -e "${BLUE}Test the development API: https://awhittlewandering-api-dev.kd8jc7v8cd.workers.dev/api/v1/health${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "${YELLOW}  • Deploy: npm run deploy${NC}"
echo -e "${YELLOW}  • Test real-time data: Visit your frontend${NC}"
echo -e "${YELLOW}  • Monitor: npm run api:health${NC}"
