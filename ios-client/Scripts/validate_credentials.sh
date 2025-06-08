d#!/bin/bash

# Credential Validation Script
# Validates tokens and obtains necessary credentials in the correct order

echo "🔑 Validating 48 Continental USA Credentials..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Initial tokens
TESSIE_TOKEN="bqfufwiCC5QeXIhlZ9I1eCYoF9XFd9xo"
MAPBOX_TOKEN="sk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJteGVzYTUxajlqMmtwenI5bHl1NDk4In0.3D0MbddcATKNja5NnvwYZQ"
TESLA_CLIENT_ID="a78b7df7-5e4f-4ea4-91f4-d3963bcaf74e"
TESLA_CLIENT_SECRET="ta-secret.t4@VFJevq!il8gTM"
APP_DEPLOY_TOKEN="lrka-qvsm-xrwo-yqkc"

# Store credentials
mkdir -p .credentials

# Step 1: Validate Tesla OAuth and get access token
echo -e "\n${YELLOW}1. Validating Tesla OAuth...${NC}"
echo "Getting OAuth token..."

tesla_auth=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{
        \"grant_type\": \"client_credentials\",
        \"client_id\": \"$TESLA_CLIENT_ID\",
        \"client_secret\": \"$TESLA_CLIENT_SECRET\"
    }" \
    "https://auth.tesla.com/oauth2/v3/token")

if [[ $tesla_auth == *"access_token"* ]]; then
    echo -e "${GREEN}✓ Tesla OAuth successful${NC}"
    TESLA_ACCESS_TOKEN=$(echo $tesla_auth | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")
    echo $TESLA_ACCESS_TOKEN > .credentials/tesla_access_token
    echo -e "Access token saved to .credentials/tesla_access_token"
else
    echo -e "${RED}✗ Tesla OAuth failed${NC}"
    echo "Response: $tesla_auth"
    exit 1
fi

# Step 2: Validate Tessie API with Tesla token
echo -e "\n${YELLOW}2. Validating Tessie API...${NC}"

tessie_response=$(curl -s \
    -H "Authorization: Bearer $TESSIE_TOKEN" \
    -H "X-Tesla-Token: $TESLA_ACCESS_TOKEN" \
    "https://api.tessie.com/v1/vehicles")

if [[ $tessie_response == *"vehicles"* ]]; then
    echo -e "${GREEN}✓ Tessie API validated${NC}"
    echo $tessie_response > .credentials/tessie_vehicles
    
    # Extract first vehicle ID
    VEHICLE_ID=$(echo $tessie_response | python3 -c "import sys, json; print(json.load(sys.stdin)['vehicles'][0]['id'])")
    echo $VEHICLE_ID > .credentials/vehicle_id
    echo -e "Vehicle ID saved to .credentials/vehicle_id"
else
    echo -e "${RED}✗ Tessie API validation failed${NC}"
    echo "Response: $tessie_response"
    exit 1
fi

# Step 3: Validate Mapbox token
echo -e "\n${YELLOW}3. Validating Mapbox token...${NC}"

mapbox_response=$(curl -s \
    "https://api.mapbox.com/tokens/v2/validate?access_token=$MAPBOX_TOKEN")

if [[ $mapbox_response == *"true"* ]]; then
    echo -e "${GREEN}✓ Mapbox token valid${NC}"
else
    echo -e "${RED}✗ Mapbox token invalid${NC}"
    echo "Response: $mapbox_response"
    exit 1
fi

# Step 4: Test complete integration
echo -e "\n${YELLOW}4. Testing complete integration...${NC}"

# Get vehicle location from Tessie
VEHICLE_ID=$(cat .credentials/vehicle_id)
location_response=$(curl -s \
    -H "Authorization: Bearer $TESSIE_TOKEN" \
    "https://api.tessie.com/v1/vehicles/$VEHICLE_ID/location")

if [[ $location_response == *"latitude"* ]]; then
    echo -e "${GREEN}✓ Got vehicle location${NC}"
    
    # Extract coordinates
    LAT=$(echo $location_response | python3 -c "import sys, json; print(json.load(sys.stdin)['latitude'])")
    LNG=$(echo $location_response | python3 -c "import sys, json; print(json.load(sys.stdin)['longitude'])")
    
    # Test Mapbox with these coordinates
    mapbox_route=$(curl -s \
        "https://api.mapbox.com/directions/v5/mapbox/driving/$LNG,$LAT;-118.2437,34.0522?access_token=$MAPBOX_TOKEN")
    
    if [[ $mapbox_route == *"routes"* ]]; then
        echo -e "${GREEN}✓ Got route from current location to LA${NC}"
        echo $mapbox_route > .credentials/current_route
    else
        echo -e "${RED}✗ Route calculation failed${NC}"
    fi
else
    echo -e "${RED}✗ Failed to get vehicle location${NC}"
fi

# Final validation summary
echo -e "\n${YELLOW}Credential Validation Summary:${NC}"
echo "----------------------------------------"

# Check Tesla OAuth
if [ -f .credentials/tesla_access_token ]; then
    echo -e "${GREEN}✓ Tesla OAuth: Valid access token obtained${NC}"
else
    echo -e "${RED}✗ Tesla OAuth: Missing access token${NC}"
fi

# Check Tessie integration
if [ -f .credentials/tessie_vehicles ]; then
    echo -e "${GREEN}✓ Tessie API: Successfully connected${NC}"
    echo -e "${GREEN}✓ Vehicle ID: $(cat .credentials/vehicle_id)${NC}"
else
    echo -e "${RED}✗ Tessie API: Connection failed${NC}"
fi

# Check Mapbox
if [ -f .credentials/current_route ]; then
    echo -e "${GREEN}✓ Mapbox: Route calculation successful${NC}"
else
    echo -e "${RED}✗ Mapbox: Route calculation failed${NC}"
fi

# Display obtained credentials
echo -e "\n${YELLOW}Available Credentials:${NC}"
echo "----------------------------------------"
ls -l .credentials/

echo -e "\n${BLUE}To use these credentials in your app:${NC}"
echo "1. Tesla Access Token: $(cat .credentials/tesla_access_token)"
echo "2. Vehicle ID: $(cat .credentials/vehicle_id)"
echo "3. Current route data available in .credentials/current_route"

echo -e "\n${GREEN}✅ Credential validation complete${NC}"
