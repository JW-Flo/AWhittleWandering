#!/bin/bash

# Pre-launch Validation Script for 48 Continental USA iOS App
# This script performs a comprehensive check of all components before allowing launch

echo "🔍 Starting Pre-launch Validation..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Track validation status
VALIDATION_PASSED=true

# Function to check endpoint availability
check_endpoint() {
    local url=$1
    local name=$2
    
    echo "Testing $name endpoint: $url"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    if [ "$response" == "200" ] || [ "$response" == "401" ]; then
        echo "${GREEN}✓ $name endpoint is accessible${NC}"
        return 0
    else
        echo "${RED}✗ $name endpoint is not accessible (HTTP $response)${NC}"
        VALIDATION_PASSED=false
        return 1
    fi
}

# 1. Check API Endpoints
echo "📡 Validating API Endpoints..."

# Mapbox Endpoints
check_endpoint "https://api.mapbox.com/v1/status" "Mapbox"
check_endpoint "https://api.weather.gov/status" "Weather Service"
check_endpoint "https://api.openchargemap.io/v3/status" "Charging API"

# 2. Validate Configuration Files
echo "⚙️ Validating Configuration Files..."

required_files=(
    "Sources/Configuration/APIEndpoints.swift"
    "Sources/Configuration/InstantDeployConfig.swift"
    "Sources/Configuration/ProductionConfig.swift"
    "Package.swift"
    "Info.plist"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "${GREEN}✓ Found $file${NC}"
    else
        echo "${RED}✗ Missing $file${NC}"
        VALIDATION_PASSED=false
    fi
done

# 3. Validate API Keys
echo "🔑 Validating API Keys..."

validate_api_key() {
    local key=$1
    local name=$2
    
    if [ -z "$key" ]; then
        echo "${RED}✗ Missing $name API key${NC}"
        VALIDATION_PASSED=false
        return 1
    fi
    
    if [[ ${#key} -lt 32 ]]; then
        echo "${RED}✗ Invalid $name API key length${NC}"
        VALIDATION_PASSED=false
        return 1
    fi
    
    echo "${GREEN}✓ Valid $name API key${NC}"
    return 0
}

# Extract and validate API keys from APIEndpoints.swift
MAPBOX_KEY=$(grep "accessToken" Sources/Configuration/APIEndpoints.swift | grep -o '".*"' | sed 's/"//g')
WEATHER_KEY=$(grep "apiKey.*weather" Sources/Configuration/APIEndpoints.swift | grep -o '".*"' | sed 's/"//g')
TESLA_KEY=$(grep "clientSecret" Sources/Configuration/APIEndpoints.swift | grep -o '".*"' | sed 's/"//g')

validate_api_key "$MAPBOX_KEY" "Mapbox"
validate_api_key "$WEATHER_KEY" "Weather"
validate_api_key "$TESLA_KEY" "Tesla"

# 4. Validate Dependencies
echo "📦 Validating Dependencies..."

check_dependency() {
    local package=$1
    if grep -q "\"$package\"" Package.swift; then
        echo "${GREEN}✓ Found dependency: $package${NC}"
        return 0
    else
        echo "${RED}✗ Missing dependency: $package${NC}"
        VALIDATION_PASSED=false
        return 1
    fi
}

required_dependencies=(
    "mapbox-maps-ios"
    "mapbox-navigation-ios"
    "Alamofire"
    "realm-swift"
    "firebase-ios-sdk"
    "apollo-ios"
    "lottie-ios"
    "swift-composable-architecture"
)

for dep in "${required_dependencies[@]}"; do
    check_dependency "$dep"
done

# 5. Validate Source Files
echo "📝 Validating Source Files..."

required_source_files=(
    "Sources/Features/AppState.swift"
    "Sources/Features/MapManager.swift"
    "Sources/Features/NetworkManager.swift"
    "Sources/Models/VehicleData.swift"
    "Sources/Models/Route.swift"
    "Sources/Features/Views/MapView.swift"
)

for file in "${required_source_files[@]}"; do
    if [ -f "$file" ]; then
        echo "${GREEN}✓ Found source file: $file${NC}"
    else
        echo "${RED}✗ Missing source file: $file${NC}"
        VALIDATION_PASSED=false
    fi
done

# 6. Run Integration Tests
echo "🧪 Running Integration Tests..."

xcodebuild test \
    -scheme 48Continental \
    -destination 'platform=iOS Simulator,name=iPhone 15 Pro,OS=17.0' \
    | xcpretty

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo "${GREEN}✓ Integration tests passed${NC}"
else
    echo "${RED}✗ Integration tests failed${NC}"
    VALIDATION_PASSED=false
fi

# Final Validation Result
echo "\n🎯 Pre-launch Validation Complete"

if [ "$VALIDATION_PASSED" = true ]; then
    echo "${GREEN}
✅ ALL VALIDATIONS PASSED
App is ready for launch!

Next Steps:
1. Open 48Continental.xcodeproj
2. Select your development team
3. Press ⌘R to run

All components are verified and ready to go.${NC}"
    exit 0
else
    echo "${RED}
❌ VALIDATION FAILED
Please fix the issues above before launching the app.${NC}"
    exit 1
fi
