#!/bin/bash

# ZERO-FAILURE API MANAGEMENT SETUP
# This script configures ALL 5 critical API connections for the Tesla web application
# 
# CRITICAL APIs (in order of priority):
# 1. TESSIE_API_KEY - Tesla data integration (HIGHEST PRIORITY)
# 2. MAPBOX_ACCESS_TOKEN - Map services and geocoding  
# 3. OPENWEATHER_API_KEY - Weather data integration
# 4. JWT_SECRET - Authentication security
# 5. TESLA_VIN - Tesla Vehicle Identification Number
#
# This script MUST be run to configure all required API tokens
# NO TOLERANCE FOR MISSING CONFIGURATIONS

set -e  # Exit on any error

echo "🚨 ZERO-FAILURE API MANAGEMENT SETUP"
echo "================================================"
echo "Configuring ALL 5 critical API connections..."
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
BACKEND_DIR="$PROJECT_ROOT/backend/edge-worker"

cd "$BACKEND_DIR"

# Check if we're in the right directory
if [ ! -f "wrangler.toml" ]; then
    echo -e "${RED}❌ ERROR: Must be run from project root directory${NC}"
    exit 1
fi

echo -e "${BLUE}📍 Current directory: $(pwd)${NC}"
echo ""

# Function to set secret safely with validation
set_secret() {
    local secret_name=$1
    local env_flag=$2
    local validation_info=$3
    
    echo -e "${BLUE}Setting $secret_name...${NC}"
    echo -e "${YELLOW}Please enter the value for $secret_name:${NC}"
    if [ ! -z "$validation_info" ]; then
        echo -e "${YELLOW}Expected format: $validation_info${NC}"
    fi
    read -s secret_value
    
    if [ -z "$secret_value" ]; then
        echo -e "${RED}❌ ERROR: $secret_name cannot be empty${NC}"
        exit 1
    fi
    
    # Basic validation
    case "$secret_name" in
        "TESSIE_API_KEY")
            if [[ ! $secret_value =~ ^[A-Za-z0-9_-]+$ ]]; then
                echo -e "${RED}❌ ERROR: TESSIE_API_KEY format invalid${NC}"
                exit 1
            fi
            ;;
        "MAPBOX_ACCESS_TOKEN")
            if [[ ! $secret_value =~ ^pk\. ]]; then
                echo -e "${RED}❌ ERROR: MAPBOX_ACCESS_TOKEN must start with 'pk.'${NC}"
                exit 1
            fi
            ;;
        "OPENWEATHER_API_KEY")
            if [[ ! $secret_value =~ ^[a-f0-9]{32}$ ]]; then
                echo -e "${RED}❌ ERROR: OPENWEATHER_API_KEY must be 32 hex characters${NC}"
                exit 1
            fi
            ;;
        "JWT_SECRET")
            if [ ${#secret_value} -lt 32 ]; then
                echo -e "${RED}❌ ERROR: JWT_SECRET must be at least 32 characters${NC}"
                exit 1
            fi
            ;;
        "TESLA_VIN")
            if [[ ! $secret_value =~ ^[A-HJ-NPR-Z0-9]{17}$ ]]; then
                echo -e "${RED}❌ ERROR: TESLA_VIN must be 17 characters (valid VIN format)${NC}"
                exit 1
            fi
            ;;
    esac
    
    if [ -n "$env_flag" ]; then
        npx wrangler secret put "$secret_name" --env "$env_flag" <<< "$secret_value"
    else
        npx wrangler secret put "$secret_name" <<< "$secret_value"
    fi
    
    echo -e "${GREEN}✅ $secret_name configured successfully${NC}"
    echo ""
}

echo -e "${BLUE}🔐 Setting up DEVELOPMENT environment secrets...${NC}"
echo "================================================"

# Set development secrets with validation
set_secret "TESSIE_API_KEY" "" "Alphanumeric with dashes/underscores"
set_secret "MAPBOX_ACCESS_TOKEN" "" "Starts with 'pk.' (public key)"
set_secret "OPENWEATHER_API_KEY" "" "32 character hex string"
set_secret "JWT_SECRET" "" "At least 32 characters (secure random string)"
set_secret "TESLA_VIN" "" "17 character VIN (no I, O, Q)"

echo -e "${BLUE}🔐 Setting up PRODUCTION environment secrets...${NC}"
echo "================================================"

# Set production secrets with validation  
set_secret "TESSIE_API_KEY" "production" "Alphanumeric with dashes/underscores"
set_secret "MAPBOX_ACCESS_TOKEN" "production" "Starts with 'pk.' (public key)"
set_secret "OPENWEATHER_API_KEY" "production" "32 character hex string"
set_secret "JWT_SECRET" "production" "At least 32 characters (secure random string)"
set_secret "TESLA_VIN" "production" "17 character VIN (no I, O, Q)"

echo -e "${GREEN}🎉 ALL API SECRETS CONFIGURED SUCCESSFULLY!${NC}"
echo "================================================"
echo -e "${GREEN}✅ Development environment: ALL 5 APIs configured${NC}"
echo -e "${GREEN}✅ Production environment: ALL 5 APIs configured${NC}"
echo ""
echo -e "${YELLOW}APIs configured:${NC}"
echo -e "${GREEN}  1. TESSIE_API_KEY - Tesla data integration${NC}"
echo -e "${GREEN}  2. MAPBOX_ACCESS_TOKEN - Map services${NC}" 
echo -e "${GREEN}  3. OPENWEATHER_API_KEY - Weather data${NC}"
echo -e "${GREEN}  4. JWT_SECRET - Authentication security${NC}"
echo -e "${GREEN}  5. TESLA_VIN - Vehicle identification${NC}"
echo ""

# Test the configuration
echo -e "${BLUE}🧪 Testing API configuration...${NC}"
cd ../../

# Run API audit to verify configuration
if [ -f "api-management-system.js" ]; then
    echo -e "${BLUE}Running comprehensive API audit...${NC}"
    node api-management-system.js audit
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ All API configurations verified!${NC}"
    else
        echo -e "${RED}❌ API configuration issues detected${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  API management system not found - manual verification needed${NC}"
fi

echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "${YELLOW}  • Deploy backend: 'npm run deploy'${NC}"
echo -e "${YELLOW}  • Deploy frontend: 'npm run deploy:frontend'${NC}"
echo -e "${YELLOW}  • Run QA: 'npm run qa:full'${NC}"
echo ""
echo -e "${GREEN}🚀 ZERO-FAILURE API MANAGEMENT COMPLETE!${NC}"
