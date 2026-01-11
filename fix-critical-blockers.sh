#!/bin/bash

# CRITICAL BLOCKERS FIX SCRIPT
# Addresses the 3 main issues preventing V1 functionality:
# 1. Empty database (no real data)
# 2. VIN not configured
# 3. Data ingestion not running

set -e

echo "🔥 CRITICAL BLOCKERS FIX - Getting Back on Track"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend/edge-worker"

# Function to check if we're in the right directory
check_environment() {
    if [ ! -f "$BACKEND_DIR/wrangler.toml" ]; then
        echo -e "${RED}❌ ERROR: Must be run from project root directory${NC}"
        exit 1
    fi
    echo -e "${BLUE}📍 Project root: $PROJECT_ROOT${NC}"
    echo -e "${BLUE}📍 Backend dir: $BACKEND_DIR${NC}"
    echo ""
}

# Function to check current secrets status
check_secrets() {
    echo -e "${BLUE}🔐 Checking API secrets configuration...${NC}"

    cd "$BACKEND_DIR"

    # Try to list secrets (this will fail if not authenticated, but we can catch it)
    if npx wrangler secret list 2>/dev/null; then
        echo -e "${GREEN}✅ Can access Cloudflare secrets${NC}"
    else
        echo -e "${RED}❌ Cannot access Cloudflare secrets (authentication required)${NC}"
        echo -e "${YELLOW}Run: npx wrangler auth login${NC}"
        return 1
    fi
}

# Function to configure secrets
configure_secrets() {
    echo -e "${BLUE}🔑 Setting up required API secrets...${NC}"

    cd "$BACKEND_DIR"

    # Check if secrets already exist
    SECRET_LIST=$(npx wrangler secret list 2>/dev/null || echo "")

    # Set ADMIN_TOKEN if not exists
    if ! echo "$SECRET_LIST" | grep -q "ADMIN_TOKEN"; then
        echo -e "${YELLOW}Setting ADMIN_TOKEN...${NC}"
        # Generate a secure random token
        ADMIN_TOKEN=$(openssl rand -hex 32)
        echo "$ADMIN_TOKEN" | npx wrangler secret put ADMIN_TOKEN
        echo -e "${GREEN}✅ ADMIN_TOKEN configured${NC}"
        echo -e "${BLUE}ADMIN_TOKEN: $ADMIN_TOKEN${NC}"
        echo "$ADMIN_TOKEN" > /tmp/admin_token.txt
    else
        echo -e "${GREEN}✅ ADMIN_TOKEN already configured${NC}"
    fi

    # Set TESSIE_API_KEY if not exists
    if ! echo "$SECRET_LIST" | grep -q "TESSIE_API_KEY"; then
        echo -e "${YELLOW}TESSIE_API_KEY not configured${NC}"
        echo -e "${YELLOW}Please provide your Tessie API key:${NC}"
        read -s TESSIE_KEY
        echo "$TESSIE_KEY" | npx wrangler secret put TESSIE_API_KEY
        echo -e "${GREEN}✅ TESSIE_API_KEY configured${NC}"
    else
        echo -e "${GREEN}✅ TESSIE_API_KEY already configured${NC}"
    fi

    # Set TESLA_VIN if not exists
    if ! echo "$SECRET_LIST" | grep -q "TESLA_VIN"; then
        echo -e "${YELLOW}TESLA_VIN not configured${NC}"
        echo -e "${YELLOW}Please provide your Tesla VIN (17 characters):${NC}"
        read TESLA_VIN
        echo "$TESLA_VIN" | npx wrangler secret put TESLA_VIN
        echo -e "${GREEN}✅ TESLA_VIN configured${NC}"
    else
        echo -e "${GREEN}✅ TESLA_VIN already configured${NC}"
    fi

    # Set other required secrets
    for SECRET in MAPBOX_API_TOKEN OPENWEATHER_API_KEY JWT_SECRET; do
        if ! echo "$SECRET_LIST" | grep -q "$SECRET"; then
            echo -e "${YELLOW}$SECRET not configured${NC}"
            echo -e "${YELLOW}Please provide $SECRET:${NC}"
            read -s SECRET_VALUE
            echo "$SECRET_VALUE" | npx wrangler secret put $SECRET
            echo -e "${GREEN}✅ $SECRET configured${NC}"
        else
            echo -e "${GREEN}✅ $SECRET already configured${NC}"
        fi
    done
}

# Function to update VIN in database
update_database_vin() {
    echo -e "${BLUE}🗄️  Updating vehicle VIN in database...${NC}"

    # Get TESLA_VIN from secrets
    TESLA_VIN=$(npx wrangler secret get TESLA_VIN 2>/dev/null || echo "")

    if [ -z "$TESLA_VIN" ]; then
        echo -e "${RED}❌ TESLA_VIN not found in secrets${NC}"
        return 1
    fi

    echo -e "${BLUE}Updating VIN to: $TESLA_VIN${NC}"

    # Update database (production)
    npx wrangler d1 execute tesla-journey-tracker --remote --command="
        UPDATE vehicles
        SET vin = '$TESLA_VIN'
        WHERE id = 'midnight-shadow';
    "

    echo -e "${GREEN}✅ Database VIN updated${NC}"
}

# Function to test manual ingestion
test_ingestion() {
    echo -e "${BLUE}🧪 Testing manual data ingestion...${NC}"

    # Get admin token
    ADMIN_TOKEN=$(cat /tmp/admin_token.txt 2>/dev/null || echo "")
    if [ -z "$ADMIN_TOKEN" ]; then
        ADMIN_TOKEN=$(npx wrangler secret get ADMIN_TOKEN 2>/dev/null || echo "")
    fi

    if [ -z "$ADMIN_TOKEN" ]; then
        echo -e "${RED}❌ No ADMIN_TOKEN available${NC}"
        return 1
    fi

    # Test ingestion endpoint
    RESPONSE=$(curl -s -X POST \
        https://awhittlewandering-api.kd8jc7v8cd.workers.dev/api/v1/admin/ingest \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json")

    if echo "$RESPONSE" | grep -q '"ok":true'; then
        echo -e "${GREEN}✅ Manual ingestion successful${NC}"
        echo "$RESPONSE" | jq '.message' 2>/dev/null || echo "$RESPONSE"
    else
        echo -e "${RED}❌ Manual ingestion failed${NC}"
        echo "$RESPONSE"
    fi
}

# Function to verify fixes
verify_fixes() {
    echo -e "${BLUE}✅ Verifying fixes...${NC}"

    # Test unified data endpoint
    UNIFIED_RESPONSE=$(curl -s https://awhittlewandering-api.kd8jc7v8cd.workers.dev/api/v1/unified-data)

    if echo "$UNIFIED_RESPONSE" | grep -q '"error":"unified data unavailable"'; then
        echo -e "${RED}❌ Unified data still unavailable${NC}"
    elif echo "$UNIFIED_RESPONSE" | grep -q '"overview"'; then
        echo -e "${GREEN}✅ Unified data now available${NC}"

        # Check if we have real data
        DRIVES_COUNT=$(echo "$UNIFIED_RESPONSE" | jq '.timeline.drives | length' 2>/dev/null || echo "0")
        STATES_COUNT=$(echo "$UNIFIED_RESPONSE" | jq '.overview.statesVisited' 2>/dev/null || echo "0")

        echo -e "${BLUE}📊 Current data: $DRIVES_COUNT drives, $STATES_COUNT states visited${NC}"
    else
        echo -e "${YELLOW}⚠️  Unexpected unified data response${NC}"
        echo "$UNIFIED_RESPONSE" | head -5
    fi
}

# Main execution
main() {
    check_environment

    echo -e "${BLUE}Current Status Check:${NC}"
    echo "1. API Health: $(curl -s https://awhittlewandering-api.kd8jc7v8cd.workers.dev/api/v1/health | jq -r '.status' 2>/dev/null || echo 'unknown')"
    echo "2. Unified Data: $(curl -s https://awhittlewandering-api.kd8jc7v8cd.workers.dev/api/v1/unified-data | jq -r 'if .error then .error else "available" end' 2>/dev/null || echo 'unknown')"
    echo ""

    # Step 1: Check secrets access
    if ! check_secrets; then
        echo -e "${YELLOW}⚠️  Skipping secrets configuration (authentication required)${NC}"
        echo -e "${YELLOW}Run this script again after: npx wrangler auth login${NC}"
        exit 1
    fi

    # Step 2: Configure secrets
    configure_secrets

    # Step 3: Deploy updated code
    echo -e "${BLUE}🚀 Deploying updated backend...${NC}"
    cd "$BACKEND_DIR"
    npx wrangler deploy

    # Step 4: Update database VIN
    update_database_vin

    # Step 5: Test ingestion
    test_ingestion

    # Step 6: Verify fixes
    verify_fixes

    echo ""
    echo -e "${GREEN}🎉 CRITICAL BLOCKERS FIX COMPLETE!${NC}"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "1. Monitor cron jobs (should run every 15-30 minutes)"
    echo "2. Check data flow in frontend dashboard"
    echo "3. Verify state detection is working"
    echo ""
    echo -e "${GREEN}You're now back on track for V1 QA-ready!${NC}"
}

# Run main function
main "$@"