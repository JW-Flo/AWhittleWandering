#!/bin/bash
# Script to verify the 48 Continental USA deployment

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo "===== 48 Continental USA Deployment Verification ====="
echo "Checking deployed services..."
echo ""

# Verify edge worker
EDGE_URL="https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev"
echo "Testing Edge Worker at $EDGE_URL"

# Check if the edge worker is accessible
EDGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $EDGE_URL/test)
if [ "$EDGE_STATUS" == "200" ]; then
  echo -e "${GREEN}✓ Edge Worker is responding (HTTP $EDGE_STATUS)${NC}"
else
  echo -e "${RED}✗ Edge Worker is not accessible (HTTP $EDGE_STATUS)${NC}"
fi

# Verify itinerary data
echo ""
echo "Testing Itinerary Data Access"
ITINERARY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $EDGE_URL/api/itinerary)
if [ "$ITINERARY_STATUS" == "200" ]; then
  echo -e "${GREEN}✓ Itinerary API is responding (HTTP $ITINERARY_STATUS)${NC}"
  
  # Check if the response contains valid itinerary data
  ITINERARY_DATA=$(curl -s $EDGE_URL/api/itinerary)
  if [[ $ITINERARY_DATA == *"stops"* ]]; then
    echo -e "${GREEN}✓ Itinerary data includes stops${NC}"
  else
    echo -e "${RED}✗ Itinerary data might be incomplete or invalid${NC}"
  fi
else
  echo -e "${RED}✗ Itinerary API is not accessible (HTTP $ITINERARY_STATUS)${NC}"
fi

# Verify public site
PUBLIC_URL="https://main.continentalusa-site.pages.dev"
echo ""
echo "Testing Public Site at $PUBLIC_URL"
PUBLIC_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $PUBLIC_URL)
if [ "$PUBLIC_STATUS" == "200" ]; then
  echo -e "${GREEN}✓ Public site is accessible (HTTP $PUBLIC_STATUS)${NC}"
else
  echo -e "${RED}✗ Public site is not accessible (HTTP $PUBLIC_STATUS)${NC}"
fi

# Check for Map.jsx component rendering (page contains mapboxgl)
PUBLIC_CONTENT=$(curl -s $PUBLIC_URL)
if [[ $PUBLIC_CONTENT == *"mapboxgl"* ]]; then
  echo -e "${GREEN}✓ Public site likely includes the Map component${NC}"
else
  echo -e "${YELLOW}⚠ Could not verify Map component on public site${NC}"
fi

# Check if public site can access the API
echo ""
echo "Testing API Access from Public Site"
echo -e "${YELLOW}Note: This is a CORS check and may not be fully verifiable from the command line${NC}"
echo -e "${YELLOW}Manual testing in browser may be needed to confirm frontend-backend integration${NC}"

# Summary
echo ""
echo "===== Verification Summary ====="
if [ "$EDGE_STATUS" == "200" ] && [ "$ITINERARY_STATUS" == "200" ] && [ "$PUBLIC_STATUS" == "200" ]; then
  echo -e "${GREEN}✓ All core services appear to be deployed and accessible${NC}"
  echo -e "${GREEN}✓ Basic deployment verification passed${NC}"
else
  echo -e "${RED}✗ Some services may not be properly deployed or accessible${NC}"
  echo -e "${YELLOW}⚠ Please check the detailed output above and address any issues${NC}"
fi

echo ""
echo "For complete verification, please also manually check:"
echo "1. Map rendering with itinerary display"
echo "2. Vehicle telemetry updates"
echo "3. Weather data integration"
echo "4. Mobile responsiveness"
echo ""
echo "Verification completed on $(date)"
