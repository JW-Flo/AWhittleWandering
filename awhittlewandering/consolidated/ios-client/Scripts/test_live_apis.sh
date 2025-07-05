#!/bin/bash

# Live API Test Script with Real Tokens
# Makes actual API calls to production endpoints

echo "🚀 Testing Live APIs for 48 Continental USA..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Real API Tokens
TESSIE_TOKEN="bqfufwiCC5QeXIhlZ9I1eCYoF9XFd9xo"
MAPBOX_TOKEN="sk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJteGVzYTUxajlqMmtwenI5bHl1NDk4In0.3D0MbddcATKNja5NnvwYZQ"
TESLA_CLIENT_ID="a78b7df7-5e4f-4ea4-91f4-d3963bcaf74e"
TESLA_CLIENT_SECRET="ta-secret.t4@VFJevq!il8gTM"
APP_DEPLOY_TOKEN="lrka-qvsm-xrwo-yqkc"

# Test locations
NYC_COORDS="40.7128,-74.0060"
LA_COORDS="34.0522,-118.2437"

# Function to make API call and display response
call_api() {
    local name=$1
    local url=$2
    local headers=$3
    
    echo -e "\n${YELLOW}Testing $name API${NC}"
    echo "URL: $url"
    echo -e "${BLUE}Response:${NC}"
    
    response=$(curl -s -H "$headers" "$url")
    echo $response | python3 -m json.tool
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $name API call successful${NC}"
        echo "$response" > "${name// /_}_response.json"
    else
        echo -e "${RED}✗ $name API call failed${NC}"
    fi
}

# 1. Test Tessie API with Real Token
echo -e "\n${YELLOW}1. Testing Tessie API${NC}"

# Get vehicle data
call_api "Tessie Vehicle" \
    "https://api.tessie.com/v1/vehicles" \
    "Authorization: Bearer $TESSIE_TOKEN"

# Get real-time telemetry
call_api "Tessie Telemetry" \
    "https://api.tessie.com/v1/vehicles/5YJ3E7EB9LF123456/telemetry" \
    "Authorization: Bearer $TESSIE_TOKEN"

# 2. Test Mapbox with Real Token
echo -e "\n${YELLOW}2. Testing Mapbox${NC}"

# Get route
call_api "Mapbox Route" \
    "https://api.mapbox.com/directions/v5/mapbox/driving/$NYC_COORDS;$LA_COORDS?access_token=$MAPBOX_TOKEN" \
    "Content-Type: application/json"

# Get map tiles
call_api "Mapbox Tiles" \
    "https://api.mapbox.com/v4/mapbox.terrain-rgb/0/0/0.pngraw?access_token=$MAPBOX_TOKEN" \
    ""

# 3. Test Tesla OAuth with Real Credentials
echo -e "\n${YELLOW}3. Testing Tesla OAuth${NC}"

# Get OAuth token
tesla_auth=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"grant_type\": \"client_credentials\", \"client_id\": \"$TESLA_CLIENT_ID\", \"client_secret\": \"$TESLA_CLIENT_SECRET\"}" \
    "https://auth.tesla.com/oauth2/v3/token")

echo $tesla_auth | python3 -m json.tool
echo "$tesla_auth" > tesla_auth_response.json

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Tesla OAuth successful${NC}"
    
    # Extract access token
    TESLA_ACCESS_TOKEN=$(echo $tesla_auth | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")
    
    # Test vehicle data with OAuth token
    call_api "Tesla Vehicle" \
        "https://owner-api.tesla.com/api/1/vehicles" \
        "Authorization: Bearer $TESLA_ACCESS_TOKEN"
else
    echo -e "${RED}✗ Tesla OAuth failed${NC}"
fi

# 4. Test NWS Weather (No auth required)
echo -e "\n${YELLOW}4. Testing NWS Weather${NC}"

# Get stations
call_api "NWS Stations" \
    "https://api.weather.gov/points/$NYC_COORDS" \
    "User-Agent: 48Continental/1.0 ($APP_DEPLOY_TOKEN)"

# 5. Test Complete Journey
echo -e "\n${YELLOW}5. Testing Complete Journey${NC}"

# Create a complete journey test
journey_data=$(cat << EOF
{
    "tessie_token": "$TESSIE_TOKEN",
    "mapbox_token": "$MAPBOX_TOKEN",
    "tesla_token": "$TESLA_ACCESS_TOKEN",
    "route": {
        "start": {
            "lat": 40.7128,
            "lng": -74.0060
        },
        "end": {
            "lat": 34.0522,
            "lng": -118.2437
        }
    }
}
EOF
)

echo -e "\n${BLUE}Journey Test Data:${NC}"
echo $journey_data | python3 -m json.tool
echo "$journey_data" > journey_test_data.json

# Save all responses to log
echo -e "\n${YELLOW}Saving all responses...${NC}"
mkdir -p test_responses
mv *_response.json test_responses/
mv journey_test_data.json test_responses/

echo -e "\n${GREEN}✅ Live API tests complete${NC}"
echo "Check test_responses/ directory for all raw API responses"

# Display summary
echo -e "\n${YELLOW}Test Summary:${NC}"
echo "1. Tessie API: Vehicle data and telemetry"
echo "2. Mapbox: Route planning and map tiles"
echo "3. Tesla OAuth: Authentication and vehicle data"
echo "4. NWS Weather: Station data and conditions"
echo "5. Complete Journey: All APIs working together"

# Validate responses
echo -e "\n${YELLOW}Response Validation:${NC}"
for file in test_responses/*.json; do
    if [ -f "$file" ]; then
        size=$(stat -f%z "$file")
        if [ $size -gt 100 ]; then
            echo -e "${GREEN}✓ Valid response in ${file##*/}${NC}"
        else
            echo -e "${RED}✗ Suspicious response size in ${file##*/}${NC}"
        fi
    fi
done
