#!/bin/bash

###############################################################################
# Initial Data Load Script for AWhittleWandering
#
# This script loads historical Tesla drive and charge data from CSV files
# and narrative waypoint data from JSON into the D1 database.
#
# Prerequisites:
# - Wrangler CLI installed
# - CLOUDFLARE_API_TOKEN set in environment or .env
# - CSV files in ./data/ directory
# - Narrative JSON in ./data/waypoints.json
# - API deployed and accessible
#
# Usage:
#   ./scripts/initial-data-load.sh [environment]
#
# Arguments:
#   environment: 'production' or 'development' (default: development)
###############################################################################

set -e # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-development}"
DATA_DIR="./data"
JOURNEY_ID="continental-usa-2025"
VEHICLE_ID="midnight-shadow"

# API endpoints based on environment
if [ "$ENVIRONMENT" = "production" ]; then
  API_BASE_URL="https://api.awhittlewandering.com"
else
  API_BASE_URL="https://awhittlewandering-api-dev.workers.dev"
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}AWhittleWandering Initial Data Load${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Environment:${NC} $ENVIRONMENT"
echo -e "${YELLOW}API Base URL:${NC} $API_BASE_URL"
echo -e "${YELLOW}Data Directory:${NC} $DATA_DIR"
echo ""

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

# Check if data directory exists
if [ ! -d "$DATA_DIR" ]; then
  echo -e "${RED}❌ Data directory not found: $DATA_DIR${NC}"
  echo -e "${YELLOW}Please create the directory and add your CSV files${NC}"
  exit 1
fi

# Check if ADMIN_TOKEN or JWT is set
if [ -z "$ADMIN_TOKEN" ] && [ -z "$JWT_TOKEN" ]; then
  echo -e "${RED}❌ ADMIN_TOKEN or JWT_TOKEN not set${NC}"
  echo -e "${YELLOW}Set ADMIN_TOKEN or JWT_TOKEN environment variable for authentication${NC}"
  echo ""
  echo "Example:"
  echo "  export ADMIN_TOKEN=your_admin_token"
  echo "  export JWT_TOKEN=your_jwt_token"
  exit 1
fi

# Use whichever token is available
AUTH_TOKEN="${ADMIN_TOKEN:-$JWT_TOKEN}"

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# =====================================================
# Step 1: Create Journey Record
# =====================================================
echo -e "${BLUE}Step 1: Verifying journey record...${NC}"

# Check if journey exists via unified-data endpoint
JOURNEY_CHECK=$(curl -s "$API_BASE_URL/api/v1/unified-data" | grep -o "continental-usa-2025" || echo "")

if [ -z "$JOURNEY_CHECK" ]; then
  echo -e "${YELLOW}⚠️  Journey record not found in database${NC}"
  echo -e "${YELLOW}The journey should be created by migration 0001_comprehensive_schema.sql${NC}"
  echo -e "${YELLOW}Please run database migrations first:${NC}"
  echo ""
  echo "  npx wrangler d1 migrations apply journey-prod --env $ENVIRONMENT --remote"
  echo ""
  exit 1
fi

echo -e "${GREEN}✅ Journey record found${NC}"
echo ""

# =====================================================
# Step 2: Import Drive Segments CSV
# =====================================================
echo -e "${BLUE}Step 2: Importing drive segments from CSV...${NC}"

DRIVES_CSV_FILES=$(find "$DATA_DIR" -name "*drive*.csv" -o -name "*trip*.csv" 2>/dev/null || echo "")

if [ -z "$DRIVES_CSV_FILES" ]; then
  echo -e "${YELLOW}⚠️  No drive CSV files found in $DATA_DIR${NC}"
  echo -e "${YELLOW}Skipping drive import${NC}"
else
  for csv_file in $DRIVES_CSV_FILES; do
    echo -e "${YELLOW}Importing: $csv_file${NC}"

    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -F "file=@$csv_file" \
      -F "journeyId=$JOURNEY_ID" \
      -F "vehicleId=$VEHICLE_ID" \
      "$API_BASE_URL/api/v1/import/tesla-drives")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)

    if [ "$HTTP_CODE" = "200" ]; then
      echo -e "${GREEN}✅ Successfully imported drives from $csv_file${NC}"
      echo "$BODY" | grep -o '"imported":[0-9]*' | head -1 || echo "Stats not available"
    else
      echo -e "${RED}❌ Failed to import drives from $csv_file (HTTP $HTTP_CODE)${NC}"
      echo "$BODY" | head -20
    fi
    echo ""
  done
fi

# =====================================================
# Step 3: Import Charge Events CSV
# =====================================================
echo -e "${BLUE}Step 3: Importing charge events from CSV...${NC}"

CHARGES_CSV_FILES=$(find "$DATA_DIR" -name "*charge*.csv" 2>/dev/null || echo "")

if [ -z "$CHARGES_CSV_FILES" ]; then
  echo -e "${YELLOW}⚠️  No charge CSV files found in $DATA_DIR${NC}"
  echo -e "${YELLOW}Skipping charge import${NC}"
else
  for csv_file in $CHARGES_CSV_FILES; do
    echo -e "${YELLOW}Importing: $csv_file${NC}"

    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -F "file=@$csv_file" \
      -F "journeyId=$JOURNEY_ID" \
      -F "vehicleId=$VEHICLE_ID" \
      "$API_BASE_URL/api/v1/import/tesla-charges")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)

    if [ "$HTTP_CODE" = "200" ]; then
      echo -e "${GREEN}✅ Successfully imported charges from $csv_file${NC}"
      echo "$BODY" | grep -o '"imported":[0-9]*' | head -1 || echo "Stats not available"
    else
      echo -e "${RED}❌ Failed to import charges from $csv_file (HTTP $HTTP_CODE)${NC}"
      echo "$BODY" | head -20
    fi
    echo ""
  done
fi

# =====================================================
# Step 4: Import Narrative Waypoints JSON
# =====================================================
echo -e "${BLUE}Step 4: Importing narrative waypoints from JSON...${NC}"

WAYPOINTS_JSON="$DATA_DIR/waypoints.json"

if [ ! -f "$WAYPOINTS_JSON" ]; then
  echo -e "${YELLOW}⚠️  No waypoints.json found in $DATA_DIR${NC}"
  echo -e "${YELLOW}Skipping waypoint import${NC}"
else
  echo -e "${YELLOW}Importing: $WAYPOINTS_JSON${NC}"

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d "@$WAYPOINTS_JSON" \
    "$API_BASE_URL/api/v1/import/waypoints")

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)

  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Successfully imported waypoints${NC}"
    echo "$BODY" | grep -o '"imported":[0-9]*' | head -1 || echo "Stats not available"
  else
    echo -e "${RED}❌ Failed to import waypoints (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -20
  fi
  echo ""
fi

# =====================================================
# Step 5: Verify Data Integrity
# =====================================================
echo -e "${BLUE}Step 5: Verifying data integrity...${NC}"

# Check unified data endpoint
UNIFIED_RESPONSE=$(curl -s "$API_BASE_URL/api/v1/unified-data?revalidate=true")

TOTAL_MILES=$(echo "$UNIFIED_RESPONSE" | grep -o '"totalMiles":[0-9.]*' | head -1 | grep -o '[0-9.]*$' || echo "0")
STATES_VISITED=$(echo "$UNIFIED_RESPONSE" | grep -o '"statesVisited":[0-9]*' | head -1 | grep -o '[0-9]*$' || echo "0")

echo -e "${GREEN}✅ Data integrity check complete${NC}"
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Import Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${YELLOW}Total Miles:${NC} $TOTAL_MILES"
echo -e "${YELLOW}States Visited:${NC} $STATES_VISITED"
echo ""

# Check import history
echo -e "${BLUE}Recent Import History:${NC}"
curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
  "$API_BASE_URL/api/v1/import/history?limit=10" | \
  grep -o '"import_type":"[^"]*"' | head -5 || echo "No history available"

echo ""
echo -e "${GREEN}✅ Data load complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Verify data in the dashboard: $API_BASE_URL/api/v1/unified-data"
echo "  2. Check import history: $API_BASE_URL/api/v1/import/history"
echo "  3. Review any errors in the import logs"
echo ""
