#!/bin/bash

# Real API Test Script
# Makes actual API calls and displays responses

echo "🚀 Testing Real APIs for 48 Continental USA..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# API Keys (replace with your actual keys)
TESSIE_API_KEY="tsk_live_48continental_key"
ABRP_API_KEY="48cont_abrp_key"

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
    echo "Headers: $headers"
    echo -e "${BLUE}Response:${NC}"
    
    response=$(curl -s -H "$headers" "$url")
    echo $response | python3 -m json.tool
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $name API call successful${NC}"
    else
        echo -e "${RED}✗ $name API call failed${NC}"
    fi
}

# 1. Test Tessie API
echo -e "\n${YELLOW}1. Testing Tessie API${NC}"

# Get vehicle data
call_api "Tessie Vehicle" \
    "https://api.tessie.com/v1/vehicles" \
    "Authorization: Bearer $TESSIE_API_KEY"

# Get telemetry
call_api "Tessie Telemetry" \
    "https://api.tessie.com/v1/vehicles/5YJ3E7EB9LF123456/telemetry" \
    "Authorization: Bearer $TESSIE_API_KEY"

# 2. Test ABRP
echo -e "\n${YELLOW}2. Testing ABRP${NC}"

# Plan route
call_api "ABRP Route" \
    "https://api.iternio.com/1/route/plan?from=$NYC_COORDS&to=$LA_COORDS&vehicle=tesla_model3_2021" \
    "X-Api-Key: $ABRP_API_KEY"

# Get charging stations
call_api "ABRP Charging" \
    "https://api.iternio.com/1/stations?lat=$NYC_COORDS&lng=$LA_COORDS&radius=50" \
    "X-Api-Key: $ABRP_API_KEY"

# 3. Test NWS Weather
echo -e "\n${YELLOW}3. Testing NWS Weather${NC}"

# Get stations
call_api "NWS Stations" \
    "https://api.weather.gov/points/$NYC_COORDS/stations" \
    "User-Agent: 48Continental/1.0"

# Get forecast
call_api "NWS Forecast" \
    "https://api.weather.gov/gridpoints/NYC/33,35/forecast" \
    "User-Agent: 48Continental/1.0"

# 4. Test Cloudflare Worker
echo -e "\n${YELLOW}4. Testing Cloudflare Worker${NC}"

# Create trip
trip_data='{
    "start": {"lat": 40.7128, "lng": -74.0060},
    "end": {"lat": 34.0522, "lng": -118.2437},
    "vehicle_id": "5YJ3E7EB9LF123456"
}'

call_api "Cloudflare Trip" \
    "https://route-tracker.48continental.workers.dev/trip" \
    "Content-Type: application/json" \
    -d "$trip_data"

# 5. Test Complete Journey
echo -e "\n${YELLOW}5. Testing Complete Journey${NC}"

# 1. Get vehicle status from Tessie
vehicle_response=$(curl -s -H "Authorization: Bearer $TESSIE_API_KEY" \
    "https://api.tessie.com/v1/vehicles/5YJ3E7EB9LF123456")
battery_level=$(echo $vehicle_response | jq -r '.battery_level')

# 2. Plan route with ABRP using actual battery level
route_response=$(curl -s -H "X-Api-Key: $ABRP_API_KEY" \
    "https://api.iternio.com/1/route/plan?from=$NYC_COORDS&to=$LA_COORDS&battery=$battery_level")

# 3. Get weather for first charging stop
first_stop_coords=$(echo $route_response | jq -r '.charging_stops[0].location | "\(.latitude),\(.longitude)"')
weather_response=$(curl -s -H "User-Agent: 48Continental/1.0" \
    "https://api.weather.gov/points/$first_stop_coords")

# 4. Create trip in Cloudflare with all data
trip_data=$(cat << EOF
{
    "start": {"lat": 40.7128, "lng": -74.0060},
    "end": {"lat": 34.0522, "lng": -118.2437},
    "vehicle_id": "5YJ3E7EB9LF123456",
    "route": $(echo $route_response | jq '.route'),
    "weather": $(echo $weather_response | jq '.properties'),
    "vehicle": $(echo $vehicle_response | jq '.')
}
EOF
)

echo -e "\n${BLUE}Complete Journey Data:${NC}"
echo $trip_data | python3 -m json.tool

# Save all responses to log file
echo "Saving responses to api_responses.log..."
{
    echo "=== Tessie Vehicle Data ==="
    echo $vehicle_response | python3 -m json.tool
    echo -e "\n=== ABRP Route ==="
    echo $route_response | python3 -m json.tool
    echo -e "\n=== NWS Weather ==="
    echo $weather_response | python3 -m json.tool
    echo -e "\n=== Complete Journey ==="
    echo $trip_data | python3 -m json.tool
} > api_responses.log

echo -e "\n${GREEN}✅ All API tests complete${NC}"
echo "Check api_responses.log for full response data"
