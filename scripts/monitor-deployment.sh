#!/bin/bash
# ================================================================
# 48 Continental USA Deployment Monitor
# 
# This script checks the status of all deployed components and
# provides detailed diagnostics about what's working and what's not.
# ================================================================

# ANSI colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URLs to check
PUBLIC_SITE_URL="https://thewanderingwhittle.pages.dev"
EDGE_WORKER_CUSTOM_URL="https://trip.thewanderingwhittle.com"
EDGE_WORKER_DEV_URL="https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev"

# API endpoints to check
ENDPOINTS=(
  "test"
  "api/v1/status"
  "api/vehicle"
  "api/trip"
  "api/weather"
)

# Print header
echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}        48 CONTINENTAL USA DEPLOYMENT MONITOR               ${NC}"
echo -e "${BLUE}============================================================${NC}"
echo -e "Run time: $(date)"
echo -e "${BLUE}============================================================${NC}\n"

# Function to check if a URL is accessible
check_url() {
  local url=$1
  local name=$2
  
  echo -e "${YELLOW}Checking ${name}...${NC}"
  
  # Use curl with a 5 second timeout
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url")
  
  if [ "$HTTP_STATUS" -ge 200 ] && [ "$HTTP_STATUS" -lt 400 ]; then
    echo -e "  ${GREEN}✓ $name is UP${NC} (HTTP $HTTP_STATUS)"
    return 0
  else
    echo -e "  ${RED}✗ $name is DOWN${NC} (HTTP $HTTP_STATUS)"
    return 1
  fi
}

# Function to check API endpoints
check_api_endpoints() {
  local base_url=$1
  local name=$2
  local success_count=0
  local total_count=${#ENDPOINTS[@]}
  
  echo -e "\n${YELLOW}Checking $name API endpoints...${NC}"
  
  for endpoint in "${ENDPOINTS[@]}"; do
    local url="${base_url}/${endpoint}"
    
    # Use curl with a 5 second timeout and capture response
    RESPONSE=$(curl -s --max-time 5 "$url")
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url")
    
    if [ "$HTTP_STATUS" -ge 200 ] && [ "$HTTP_STATUS" -lt 400 ]; then
      echo -e "  ${GREEN}✓ /${endpoint} is working${NC} (HTTP $HTTP_STATUS)"
      
      # For status endpoints, check if they contain expected fields
      if [[ "$endpoint" == "test" ]] || [[ "$endpoint" == "api/v1/status" ]]; then
        if [[ "$RESPONSE" == *"status"* ]] && [[ "$RESPONSE" == *"version"* ]]; then
          echo -e "    ${GREEN}✓ Response data looks valid${NC}"
        else
          echo -e "    ${YELLOW}⚠ Response data may be incomplete${NC}"
        fi
      fi
      
      success_count=$((success_count + 1))
    else
      echo -e "  ${RED}✗ /${endpoint} is not working${NC} (HTTP $HTTP_STATUS)"
    fi
  done
  
  # Calculate success percentage
  local success_percent=$((success_count * 100 / total_count))
  
  if [ $success_count -eq $total_count ]; then
    echo -e "\n  ${GREEN}All endpoints working ($success_count/$total_count - 100%)${NC}"
  elif [ $success_count -gt 0 ]; then
    echo -e "\n  ${YELLOW}Some endpoints working ($success_count/$total_count - $success_percent%)${NC}"
  else
    echo -e "\n  ${RED}No endpoints working (0/$total_count - 0%)${NC}"
  fi
}

# Function to check for CORS headers
check_cors() {
  local url=$1
  
  echo -e "\n${YELLOW}Checking CORS configuration...${NC}"
  
  # Use curl with OPTIONS method to check CORS headers
  CORS_HEADERS=$(curl -s -X OPTIONS -I --max-time 5 "$url")
  
  if [[ "$CORS_HEADERS" == *"Access-Control-Allow-Origin"* ]]; then
    echo -e "  ${GREEN}✓ CORS headers are properly set${NC}"
    echo -e "  Headers found:"
    echo "$CORS_HEADERS" | grep -i "Access-Control" | sed 's/^/    /'
  else
    echo -e "  ${RED}✗ CORS headers are missing${NC}"
  fi
}

# Function to check KV namespace access
check_kv_access() {
  echo -e "\n${YELLOW}Checking KV namespace access...${NC}"
  
  # Try to list KV keys
  KV_OUTPUT=$(cd edge-worker && npx wrangler kv:key list APP_KV --limit 1 2>&1)
  
  if [[ "$KV_OUTPUT" == *"error"* ]] || [[ "$KV_OUTPUT" == *"Error"* ]]; then
    echo -e "  ${RED}✗ Failed to access KV namespace${NC}"
    echo -e "  ${YELLOW}Possible issues:${NC}"
    echo -e "    - Not logged in to Cloudflare (run 'npx wrangler login')"
    echo -e "    - Missing permissions for the KV namespace"
    echo -e "    - Incorrect binding configuration in wrangler.toml"
  else
    echo -e "  ${GREEN}✓ KV namespace access is working${NC}"
    echo -e "  Keys found:"
    echo "$KV_OUTPUT" | grep -v "Listing" | sed 's/^/    /'
  fi
}

# Function to check worker version
check_worker_version() {
  echo -e "\n${YELLOW}Checking deployed worker version...${NC}"
  
  # Get status endpoint response which should include version
  VERSION_RESPONSE=$(curl -s --max-time 5 "${EDGE_WORKER_DEV_URL}/api/v1/status")
  
  if [[ "$VERSION_RESPONSE" == *"version"* ]]; then
    VERSION=$(echo $VERSION_RESPONSE | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
    DEPLOY_TIME=$(echo $VERSION_RESPONSE | grep -o '"time":"[^"]*"' | cut -d'"' -f4)
    
    if [ ! -z "$VERSION" ]; then
      echo -e "  ${GREEN}✓ Worker version: ${VERSION}${NC}"
      
      if [ ! -z "$DEPLOY_TIME" ]; then
        echo -e "  ${GREEN}✓ Last deployed: ${DEPLOY_TIME}${NC}"
      fi
    else
      echo -e "  ${YELLOW}⚠ Could not determine worker version${NC}"
    fi
  else
    echo -e "  ${RED}✗ Could not retrieve version information${NC}"
  fi
}

# Main diagnostic flow
echo -e "${BLUE}Checking public site accessibility...${NC}"
check_url "$PUBLIC_SITE_URL" "Public Site"

echo -e "\n${BLUE}Checking edge worker accessibility...${NC}"
check_url "$EDGE_WORKER_CUSTOM_URL" "Edge Worker (Custom Domain)"
check_url "$EDGE_WORKER_DEV_URL" "Edge Worker (workers.dev)"

# Check API endpoints on both domains
check_api_endpoints "$EDGE_WORKER_CUSTOM_URL" "Custom Domain"
check_api_endpoints "$EDGE_WORKER_DEV_URL" "workers.dev Domain"

# Check CORS configuration
check_cors "$EDGE_WORKER_DEV_URL/api/v1/status"

# Check KV access
check_kv_access

# Check worker version
check_worker_version

# Print summary
echo -e "\n${BLUE}============================================================${NC}"
echo -e "${BLUE}                    DEPLOYMENT SUMMARY                       ${NC}"
echo -e "${BLUE}============================================================${NC}"

# Check if basic endpoints are working
if curl -s --max-time 5 "${EDGE_WORKER_DEV_URL}/test" > /dev/null; then
  echo -e "${GREEN}✓ Edge Worker API is operational${NC}"
  echo -e "${YELLOW}  Next steps:${NC}"
  echo -e "  1. Run './scripts/fix-deployment.cjs' to fix any remaining issues"
  echo -e "  2. Log in to Cloudflare with 'cd edge-worker && npx wrangler login'"
  echo -e "  3. Set up proper KV namespace permissions"
else
  echo -e "${RED}✗ Edge Worker API is not operational${NC}"
  echo -e "${YELLOW}  Recommended actions:${NC}"
  echo -e "  1. Check Cloudflare account status and login"
  echo -e "  2. Verify API keys and tokens"
  echo -e "  3. Run './scripts/fix-deployment.cjs' to attempt repairs"
fi

if curl -s --max-time 5 "$PUBLIC_SITE_URL" > /dev/null; then
  echo -e "${GREEN}✓ Public site is operational${NC}"
else
  echo -e "${RED}✗ Public site is not operational${NC}"
  echo -e "${YELLOW}  Check Cloudflare Pages deployment status${NC}"
fi

echo -e "\n${BLUE}For detailed troubleshooting, see:${NC}"
echo -e "${YELLOW}docs/DEPLOYMENT_TROUBLESHOOTING.md${NC}"
echo -e "${BLUE}============================================================${NC}"
