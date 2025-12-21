#!/bin/bash

# Sync Secrets to Cloudflare and Validate All API Connections
# Comprehensive validation after credentials are configured

set -e

echo "🚀 Starting Secret Sync and API Validation"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "backend/edge-worker" ]; then
    echo -e "${RED}❌ Error: Must run from project root${NC}"
    exit 1
fi

cd backend/edge-worker

echo -e "${BLUE}📋 Step 1: Checking GitHub Secrets Status...${NC}"
echo ""

# Check if GitHub CLI is available
if command -v gh &> /dev/null; then
    if gh auth status &> /dev/null; then
        echo -e "${GREEN}✅ GitHub CLI authenticated${NC}"
        SECRET_LIST=$(gh secret list 2>&1 || echo "")
        
        REQUIRED=("TESSIE_API_KEY" "MAPBOX_ACCESS_TOKEN" "OPENWEATHER_API_KEY" "TESLA_VIN" "JWT_SECRET" "CLOUDFLARE_API_TOKEN")
        FOUND=0
        
        for secret in "${REQUIRED[@]}"; do
            if echo "$SECRET_LIST" | grep -q "$secret"; then
                echo -e "${GREEN}  ✅ $secret found in GitHub${NC}"
                FOUND=$((FOUND + 1))
            else
                echo -e "${YELLOW}  ⚠️  $secret not found in GitHub${NC}"
            fi
        done
        
        echo ""
        echo -e "${BLUE}GitHub Secrets: $FOUND/${#REQUIRED[@]} configured${NC}"
    else
        echo -e "${YELLOW}⚠️  GitHub CLI not authenticated - skipping GitHub verification${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  GitHub CLI not available - skipping GitHub verification${NC}"
fi

echo ""
echo -e "${BLUE}📦 Step 2: Syncing Secrets to Cloudflare Workers...${NC}"
echo ""

# Check if Wrangler is available
if ! command -v wrangler &> /dev/null && ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ Wrangler not found. Install: npm install -g wrangler${NC}"
    exit 1
fi

# Check Cloudflare authentication
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  CLOUDFLARE_API_TOKEN not in environment${NC}"
    echo -e "${YELLOW}   Attempting to use wrangler auth...${NC}"
    
    # Try to check if already authenticated
    if npx wrangler whoami &> /dev/null; then
        echo -e "${GREEN}✅ Cloudflare authenticated${NC}"
    else
        echo -e "${YELLOW}⚠️  Cloudflare authentication needed${NC}"
        echo -e "${YELLOW}   Run: npx wrangler login${NC}"
        echo -e "${YELLOW}   Or set CLOUDFLARE_API_TOKEN environment variable${NC}"
    fi
fi

echo ""
echo -e "${BLUE}🔄 Syncing secrets from GitHub to Cloudflare...${NC}"
echo -e "${YELLOW}Note: This requires GitHub CLI authentication${NC}"
echo ""

# Function to sync a secret
sync_secret() {
    local secret_name=$1
    local env_flag=${2:-""}
    
    if command -v gh &> /dev/null && gh auth status &> /dev/null; then
        echo -e "${BLUE}  Syncing $secret_name...${NC}"
        SECRET_VALUE=$(gh secret get "$secret_name" 2>/dev/null || echo "")
        
        if [ -z "$SECRET_VALUE" ]; then
            echo -e "${YELLOW}    ⚠️  Could not retrieve from GitHub (may need manual sync)${NC}"
            return 1
        fi
        
        if [ -n "$env_flag" ]; then
            echo "$SECRET_VALUE" | npx wrangler secret put "$secret_name" --env "$env_flag" 2>&1 | grep -v "Enter a secret value" || true
        else
            echo "$SECRET_VALUE" | npx wrangler secret put "$secret_name" 2>&1 | grep -v "Enter a secret value" || true
        fi
        
        echo -e "${GREEN}    ✅ $secret_name synced${NC}"
        return 0
    else
        echo -e "${YELLOW}    ⚠️  GitHub CLI not available - manual sync required${NC}"
        echo -e "${YELLOW}    Run: echo 'value' | npx wrangler secret put $secret_name${NC}"
        return 1
    fi
}

# Try to sync secrets
SYNCED=0
TOTAL=5

sync_secret "TESSIE_API_KEY" && SYNCED=$((SYNCED + 1)) || true
sync_secret "TESLA_VIN" && SYNCED=$((SYNCED + 1)) || true
sync_secret "MAPBOX_ACCESS_TOKEN" && SYNCED=$((SYNCED + 1)) || true
sync_secret "OPENWEATHER_API_KEY" && SYNCED=$((SYNCED + 1)) || true
sync_secret "JWT_SECRET" && SYNCED=$((SYNCED + 1)) || true

echo ""
echo -e "${BLUE}Sync Status: $SYNCED/$TOTAL secrets${NC}"

if [ $SYNCED -lt $TOTAL ]; then
    echo -e "${YELLOW}⚠️  Some secrets may need manual sync${NC}"
    echo -e "${YELLOW}   Or trigger GitHub Actions workflow: Sync Secrets to Cloudflare Workers${NC}"
fi

echo ""
echo -e "${BLUE}🔍 Step 3: Verifying Cloudflare Workers Secrets...${NC}"
echo ""

# Check Cloudflare secrets
if npx wrangler secret list 2>&1 | head -20; then
    echo -e "${GREEN}✅ Cloudflare secrets list retrieved${NC}"
else
    echo -e "${YELLOW}⚠️  Could not list Cloudflare secrets (may need authentication)${NC}"
fi

echo ""
echo -e "${BLUE}🧪 Step 4: Testing API Connections...${NC}"
echo ""

cd ../..

# Run comprehensive API validation
echo -e "${BLUE}Running comprehensive API validation...${NC}"
node validate-api-functionality.js 2>&1 | tee api-sync-validation-output.txt

echo ""
echo -e "${BLUE}Running intensive API review...${NC}"
node intensive-api-review.js 2>&1 | tee intensive-validation-output.txt

echo ""
echo -e "${GREEN}✅ Validation Complete!${NC}"
echo ""
echo -e "${BLUE}📊 Check the following files for detailed results:${NC}"
echo "  - api-sync-validation-output.txt"
echo "  - intensive-validation-output.txt"
echo "  - api-validation-report.json"
echo "  - intensive-api-review-report.json"
