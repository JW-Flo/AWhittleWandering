#!/bin/bash
# Deployment Verification Script for 48 Continental USA
# Tests all components of the deployment including Edge Worker and Public Site

# Colors for pretty output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URLs to test
PUBLIC_SITE_URL="https://thewanderingwhittle.pages.dev"
EDGE_WORKER_URL="https://trip.thewanderingwhittle.com"
EDGE_WORKER_DEV_URL="https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev"

# Test endpoints
TEST_ENDPOINTS=(
  "/test"
  "/api/v1/status"
  "/api/vehicle"
  "/api/trip"
  "/api/weather"
  "/api/stations"
)

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}       48 CONTINENTAL USA DEPLOYMENT TEST     ${NC}"
echo -e "${BLUE}==============================================${NC}"
echo -e "Date: $(date)"
echo -e "${BLUE}==============================================${NC}\n"

# Helper function to test HTTP endpoints
test_endpoint() {
  local url=$1
  local expected_status=$2
  
  echo -e "Testing: ${YELLOW}$url${NC}"
  
  # Use curl to make the request
  http_status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  
  if [ "$http_status" -eq "$expected_status" ]; then
    echo -e "  Status: ${GREEN}$http_status${NC} ✓"
    return 0
  else
    echo -e "  Status: ${RED}$http_status${NC} ✗ (Expected: $expected_status)"
    return 1
  fi
}

# Test public site
echo -e "\n${BLUE}Testing Public Site...${NC}"
public_site_status=$(test_endpoint "$PUBLIC_SITE_URL" 200)
public_site_result=$?

# Test edge worker (custom domain)
echo -e "\n${BLUE}Testing Edge Worker (Custom Domain)...${NC}"
edge_worker_status=$(test_endpoint "$EDGE_WORKER_URL" 200)
edge_worker_result=$?

# Test edge worker (workers.dev domain)
echo -e "\n${BLUE}Testing Edge Worker (workers.dev)...${NC}"
edge_worker_dev_status=$(test_endpoint "$EDGE_WORKER_DEV_URL" 200)
edge_worker_dev_result=$?

# Test API endpoints on custom domain
echo -e "\n${BLUE}Testing API Endpoints on Custom Domain...${NC}"
api_failures=0
for endpoint in "${TEST_ENDPOINTS[@]}"; do
  api_status=$(test_endpoint "${EDGE_WORKER_URL}${endpoint}" 200)
  if [ $? -ne 0 ]; then
    api_failures=$((api_failures + 1))
  fi
done

# Test API endpoints on workers.dev domain
echo -e "\n${BLUE}Testing API Endpoints on workers.dev domain...${NC}"
api_dev_failures=0
for endpoint in "${TEST_ENDPOINTS[@]}"; do
  api_dev_status=$(test_endpoint "${EDGE_WORKER_DEV_URL}${endpoint}" 200)
  if [ $? -ne 0 ]; then
    api_dev_failures=$((api_dev_failures + 1))
  fi
done

# Output summary
echo -e "\n${BLUE}==============================================${NC}"
echo -e "${BLUE}                 TEST SUMMARY                 ${NC}"
echo -e "${BLUE}==============================================${NC}"

# Public site status
if [ $public_site_result -eq 0 ]; then
  echo -e "Public Site: ${GREEN}ONLINE${NC}"
else
  echo -e "Public Site: ${RED}OFFLINE${NC}"
fi

# Edge worker (custom domain) status
if [ $edge_worker_result -eq 0 ]; then
  echo -e "Edge Worker (Custom Domain): ${GREEN}ONLINE${NC}"
else
  echo -e "Edge Worker (Custom Domain): ${RED}OFFLINE${NC}"
fi

# Edge worker (workers.dev) status
if [ $edge_worker_dev_result -eq 0 ]; then
  echo -e "Edge Worker (workers.dev): ${GREEN}ONLINE${NC}"
else
  echo -e "Edge Worker (workers.dev): ${RED}OFFLINE${NC}"
fi

# API endpoint status
if [ $api_failures -eq 0 ]; then
  echo -e "API Endpoints (Custom Domain): ${GREEN}ALL ONLINE${NC}"
else
  echo -e "API Endpoints (Custom Domain): ${RED}$api_failures FAILURES${NC}"
fi

# API endpoint status (workers.dev)
if [ $api_dev_failures -eq 0 ]; then
  echo -e "API Endpoints (workers.dev): ${GREEN}ALL ONLINE${NC}"
else
  echo -e "API Endpoints (workers.dev): ${RED}$api_dev_failures FAILURES${NC}"
fi

echo -e "\n${BLUE}==============================================${NC}"

# Check if all tests passed
if [ $public_site_result -eq 0 ] && [ $edge_worker_result -eq 0 ] && [ $edge_worker_dev_result -eq 0 ] && [ $api_failures -eq 0 ] && [ $api_dev_failures -eq 0 ]; then
  echo -e "${GREEN}All deployment tests passed! System is fully operational.${NC}"
  exit 0
else
  echo -e "${RED}Some deployment tests failed. See details above.${NC}"
  exit 1
fi
