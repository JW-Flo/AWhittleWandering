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
echo -e "${BLUE}   48 Continental Deployment Verification    ${NC}"
echo -e "${BLUE}=============================================${NC}"

# Load environment variables if .env exists
if [ -f "$PROJECT_ROOT/.env" ]; then
    source "$PROJECT_ROOT/.env"
fi

# Check required environment variables
if [ -z "$EDGE_HMAC_KEY" ]; then
    echo -e "${YELLOW}Warning: EDGE_HMAC_KEY environment variable is not set${NC}"
    echo -e "${YELLOW}Some verification checks may fail${NC}"
fi

EDGE_WORKER_URL=${EDGE_WORKER_URL:-"https://continentalusa.workers.dev"}
PUBLIC_SITE_URL=${PUBLIC_SITE_URL:-"https://continentalusa.pages.dev"}

#------------------------------------------------------------
# 1. Verify Edge Worker
#------------------------------------------------------------
echo -e "\n${YELLOW}Verifying Edge Worker...${NC}"

# Health check
echo -e "${YELLOW}Performing health check...${NC}"
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$EDGE_WORKER_URL/health")
if [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}Health endpoint: OK (HTTP $HEALTH_STATUS)${NC}"
else
    echo -e "${RED}Health endpoint: FAILED (HTTP $HEALTH_STATUS)${NC}"
fi

# Tesla API check (if EDGE_HMAC_KEY is available)
if [ ! -z "$EDGE_HMAC_KEY" ]; then
    echo -e "${YELLOW}Checking Tesla API...${NC}"
    TESLA_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer ${EDGE_HMAC_KEY}" "$EDGE_WORKER_URL/tesla/status")
    if [ "$TESLA_STATUS" = "200" ] || [ "$TESLA_STATUS" = "401" ]; then
        echo -e "${GREEN}Tesla API: OK (HTTP $TESLA_STATUS)${NC}"
        if [ "$TESLA_STATUS" = "401" ]; then
            echo -e "${YELLOW}Authentication required for Tesla API - this is normal${NC}"
        fi
    else
        echo -e "${RED}Tesla API: FAILED (HTTP $TESLA_STATUS)${NC}"
    fi
fi

# MapBox integration check
echo -e "${YELLOW}Checking MapBox integration...${NC}"
MAPBOX_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$EDGE_WORKER_URL/mapbox/status")
if [ "$MAPBOX_STATUS" = "200" ] || [ "$MAPBOX_STATUS" = "401" ]; then
    echo -e "${GREEN}MapBox integration: OK (HTTP $MAPBOX_STATUS)${NC}"
else
    echo -e "${RED}MapBox integration: FAILED (HTTP $MAPBOX_STATUS)${NC}"
fi

# Summarize Edge Worker checks
if [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}Edge Worker verification: PASSED${NC}"
else
    echo -e "${RED}Edge Worker verification: FAILED${NC}"
    echo -e "${YELLOW}Check wrangler.toml configuration and Cloudflare settings${NC}"
fi

#------------------------------------------------------------
# 2. Verify MCP Server
#------------------------------------------------------------
echo -e "\n${YELLOW}Verifying MCP Server...${NC}"

# Check if MCP server is running locally
MCP_PORT=${MCP_PORT:-3000}
MCP_URL="http://localhost:$MCP_PORT"

echo -e "${YELLOW}Checking if MCP server is running on port $MCP_PORT...${NC}"
MCP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$MCP_URL/health" 2>/dev/null || echo "000")
if [ "$MCP_STATUS" = "200" ]; then
    echo -e "${GREEN}MCP Server: RUNNING (HTTP $MCP_STATUS)${NC}"
    
    # Check agent registration
    echo -e "${YELLOW}Checking agent registration...${NC}"
    AGENT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$MCP_URL/api/agents" 2>/dev/null || echo "000")
    if [ "$AGENT_STATUS" = "200" ]; then
        echo -e "${GREEN}Agent registration: OK (HTTP $AGENT_STATUS)${NC}"
    else
        echo -e "${RED}Agent registration: FAILED (HTTP $AGENT_STATUS)${NC}"
    fi
    
    # Check Edge Worker connectivity
    echo -e "${YELLOW}Checking Edge Worker connectivity...${NC}"
    EDGE_CONN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$MCP_URL/api/edge-worker/status" 2>/dev/null || echo "000")
    if [ "$EDGE_CONN_STATUS" = "200" ]; then
        echo -e "${GREEN}Edge Worker connectivity: OK (HTTP $EDGE_CONN_STATUS)${NC}"
    else
        echo -e "${RED}Edge Worker connectivity: FAILED (HTTP $EDGE_CONN_STATUS)${NC}"
    fi
else
    echo -e "${RED}MCP Server: NOT RUNNING${NC}"
    echo -e "${YELLOW}This is normal if you're not running the MCP server locally${NC}"
    echo -e "${YELLOW}The MCP server should be running on the always-on iMac${NC}"
fi

#------------------------------------------------------------
# 3. Verify Public Website
#------------------------------------------------------------
echo -e "\n${YELLOW}Verifying Public Website...${NC}"

# Basic accessibility check
echo -e "${YELLOW}Checking if website is accessible...${NC}"
SITE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PUBLIC_SITE_URL" 2>/dev/null || echo "000")
if [ "$SITE_STATUS" = "200" ]; then
    echo -e "${GREEN}Website accessibility: OK (HTTP $SITE_STATUS)${NC}"
else
    echo -e "${RED}Website accessibility: FAILED (HTTP $SITE_STATUS)${NC}"
    echo -e "${YELLOW}Check Cloudflare Pages configuration${NC}"
fi

echo -e "${YELLOW}Checking for critical page elements...${NC}"
CONTENT_CHECK=$(curl -s "$PUBLIC_SITE_URL" | grep -c "map\|tesla\|trip\|dashboard" || echo "0")
if [ "$CONTENT_CHECK" -gt "0" ]; then
    echo -e "${GREEN}Content verification: OK (Found $CONTENT_CHECK relevant terms)${NC}"
else
    echo -e "${RED}Content verification: FAILED (No relevant content found)${NC}"
    echo -e "${YELLOW}The site may be showing a placeholder or error page${NC}"
fi

# Summarize Public Website checks
if [ "$SITE_STATUS" = "200" ] && [ "$CONTENT_CHECK" -gt "0" ]; then
    echo -e "${GREEN}Public Website verification: PASSED${NC}"
else
    echo -e "${RED}Public Website verification: FAILED${NC}"
    echo -e "${YELLOW}Manual check recommended: $PUBLIC_SITE_URL${NC}"
fi

#------------------------------------------------------------
# 4. Verify Mobile App Builds
#------------------------------------------------------------
echo -e "\n${YELLOW}Verifying Mobile App Builds...${NC}"

# Check React Native app build artifacts
echo -e "${YELLOW}Checking React Native app builds...${NC}"
RN_IOS_BUILD_PATH="$PROJECT_ROOT/ContinentalUSA-mobile/ios/build/Build/Products"
RN_ANDROID_BUILD_PATH="$PROJECT_ROOT/ContinentalUSA-mobile/android/app/build/outputs/apk"

if [ -d "$RN_IOS_BUILD_PATH" ]; then
    IOS_BUILD_FILES=$(find "$RN_IOS_BUILD_PATH" -name "*.app" | wc -l)
    if [ "$IOS_BUILD_FILES" -gt "0" ]; then
        echo -e "${GREEN}React Native iOS build: FOUND ($IOS_BUILD_FILES files)${NC}"
    else
        echo -e "${RED}React Native iOS build: NOT FOUND${NC}"
    fi
else
    echo -e "${YELLOW}React Native iOS build directory not found${NC}"
fi

if [ -d "$RN_ANDROID_BUILD_PATH" ]; then
    ANDROID_BUILD_FILES=$(find "$RN_ANDROID_BUILD_PATH" -name "*.apk" | wc -l)
    if [ "$ANDROID_BUILD_FILES" -gt "0" ]; then
        echo -e "${GREEN}React Native Android build: FOUND ($ANDROID_BUILD_FILES files)${NC}"
    else
        echo -e "${RED}React Native Android build: NOT FOUND${NC}"
    fi
else
    echo -e "${YELLOW}React Native Android build directory not found${NC}"
fi

# Check iOS native app build artifacts
echo -e "${YELLOW}Checking iOS native app builds...${NC}"
if [ -d "$PROJECT_ROOT/ios-client/48Continental.xcarchive" ]; then
    echo -e "${GREEN}iOS native app archive: FOUND${NC}"
else
    echo -e "${YELLOW}iOS native app archive not found${NC}"
    echo -e "${YELLOW}This is normal if you built the app through Xcode directly${NC}"
fi

#------------------------------------------------------------
# 5. Generate Verification Report
#------------------------------------------------------------
echo -e "\n${YELLOW}Generating Verification Report...${NC}"
REPORT_FILE="$PROJECT_ROOT/deployment-verification-$(date +%Y%m%d-%H%M%S).txt"

echo "48 Continental Deployment Verification Report" > "$REPORT_FILE"
echo "Date: $(date)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "1. Edge Worker ($EDGE_WORKER_URL)" >> "$REPORT_FILE"
echo "   Health Check: $HEALTH_STATUS" >> "$REPORT_FILE"
if [ ! -z "$EDGE_HMAC_KEY" ]; then
    echo "   Tesla API: $TESLA_STATUS" >> "$REPORT_FILE"
fi
echo "   MapBox Integration: $MAPBOX_STATUS" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "2. MCP Server ($MCP_URL)" >> "$REPORT_FILE"
echo "   Health Check: $MCP_STATUS" >> "$REPORT_FILE"
if [ "$MCP_STATUS" = "200" ]; then
    echo "   Agent Registration: $AGENT_STATUS" >> "$REPORT_FILE"
    echo "   Edge Worker Connectivity: $EDGE_CONN_STATUS" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"
echo "3. Public Website ($PUBLIC_SITE_URL)" >> "$REPORT_FILE"
echo "   Accessibility: $SITE_STATUS" >> "$REPORT_FILE"
echo "   Content Verification: $CONTENT_CHECK relevant terms found" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "4. Mobile App Builds" >> "$REPORT_FILE"
if [ -d "$RN_IOS_BUILD_PATH" ]; then
    echo "   React Native iOS: $IOS_BUILD_FILES files found" >> "$REPORT_FILE"
else
    echo "   React Native iOS: Build directory not found" >> "$REPORT_FILE"
fi
if [ -d "$RN_ANDROID_BUILD_PATH" ]; then
    echo "   React Native Android: $ANDROID_BUILD_FILES files found" >> "$REPORT_FILE"
else
    echo "   React Native Android: Build directory not found" >> "$REPORT_FILE"
fi
if [ -d "$PROJECT_ROOT/ios-client/48Continental.xcarchive" ]; then
    echo "   iOS Native App: Archive found" >> "$REPORT_FILE"
else
    echo "   iOS Native App: Archive not found" >> "$REPORT_FILE"
fi

echo -e "${GREEN}Verification report created at: $REPORT_FILE${NC}"

#------------------------------------------------------------
# 6. Summary
#------------------------------------------------------------
echo -e "\n${BLUE}=============================================${NC}"
echo -e "${BLUE}   Verification Summary                      ${NC}"
echo -e "${BLUE}=============================================${NC}"

if [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Edge Worker:${NC} OPERATIONAL"
else
    echo -e "${RED}✗ Edge Worker:${NC} ISSUES DETECTED"
fi

if [ "$MCP_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ MCP Server:${NC} OPERATIONAL"
else
    echo -e "${YELLOW}? MCP Server:${NC} NOT RUNNING LOCALLY (Check iMac)"
fi

if [ "$SITE_STATUS" = "200" ] && [ "$CONTENT_CHECK" -gt "0" ]; then
    echo -e "${GREEN}✓ Public Website:${NC} OPERATIONAL"
else
    echo -e "${RED}✗ Public Website:${NC} ISSUES DETECTED"
fi

MOBILE_BUILDS_OK="false"
if [ -d "$RN_IOS_BUILD_PATH" ] && [ "$IOS_BUILD_FILES" -gt "0" ] || \
   [ -d "$RN_ANDROID_BUILD_PATH" ] && [ "$ANDROID_BUILD_FILES" -gt "0" ] || \
   [ -d "$PROJECT_ROOT/ios-client/48Continental.xcarchive" ]; then
    MOBILE_BUILDS_OK="true"
fi

if [ "$MOBILE_BUILDS_OK" = "true" ]; then
    echo -e "${GREEN}✓ Mobile App Builds:${NC} ARTIFACTS FOUND"
else
    echo -e "${YELLOW}? Mobile App Builds:${NC} NO ARTIFACTS FOUND"
fi

# Overall status
if [ "$HEALTH_STATUS" = "200" ] && \
   ([ "$MCP_STATUS" = "200" ] || [ "$MCP_STATUS" = "000" ]) && \
   [ "$SITE_STATUS" = "200" ] && [ "$CONTENT_CHECK" -gt "0" ]; then
    echo -e "\n${GREEN}Overall Verification: PASSED${NC}"
else
    echo -e "\n${RED}Overall Verification: ISSUES DETECTED${NC}"
    echo -e "${YELLOW}Review the verification report and address any issues${NC}"
fi

echo -e "\n${YELLOW}Verification complete. See $REPORT_FILE for details.${NC}"
