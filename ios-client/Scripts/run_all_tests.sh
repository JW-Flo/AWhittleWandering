#!/bin/bash

# Comprehensive Test Runner for 48 Continental USA iOS App
# This script runs all tests and provides detailed results

echo "🚀 Starting Complete Test Suite..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test results storage
declare -A TEST_RESULTS
TOTAL_TESTS=0
PASSED_TESTS=0

# Function to run a test and store result
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -e "\n${BLUE}Running: $test_name${NC}"
    echo "Command: $test_command"
    
    if eval "$test_command"; then
        TEST_RESULTS[$test_name]="PASS"
        ((PASSED_TESTS++))
        echo -e "${GREEN}✓ $test_name passed${NC}"
    else
        TEST_RESULTS[$test_name]="FAIL"
        echo -e "${RED}✗ $test_name failed${NC}"
    fi
    ((TOTAL_TESTS++))
}

# 1. Pre-launch Validation
echo -e "\n${YELLOW}1. Running Pre-launch Validation...${NC}"
run_test "Pre-launch Validation" "./Scripts/pre_launch_validation.sh"

# 2. Service Integration Tests
echo -e "\n${YELLOW}2. Running Service Integration Tests...${NC}"

# Mapbox Tests
run_test "Mapbox Integration" "xcodebuild test -scheme 48Continental -only-testing:ServiceIntegrationTests/testMapboxConfiguration -only-testing:ServiceIntegrationTests/testMapboxDirections"

# Weather Tests
run_test "Weather Service" "xcodebuild test -scheme 48Continental -only-testing:ServiceIntegrationTests/testWeatherServiceConfiguration"

# Tesla Tests
run_test "Tesla Integration" "xcodebuild test -scheme 48Continental -only-testing:ServiceIntegrationTests/testTeslaAuthentication -only-testing:ServiceIntegrationTests/testTeslaVehicleData"

# Charging Station Tests
run_test "Charging Stations" "xcodebuild test -scheme 48Continental -only-testing:ServiceIntegrationTests/testChargingStationSearch"

# 3. End-to-End Tests
echo -e "\n${YELLOW}3. Running End-to-End Tests...${NC}"

# App Launch & Configuration
run_test "App Launch" "xcodebuild test -scheme 48Continental -only-testing:EndToEndTests/testAppLaunch"

# Map Integration
run_test "Map Integration" "xcodebuild test -scheme 48Continental -only-testing:EndToEndTests/testMapInitialization"

# Complete User Journey
run_test "User Journey" "xcodebuild test -scheme 48Continental -only-testing:EndToEndTests/testCompleteUserJourney"

# 4. API Endpoint Tests
echo -e "\n${YELLOW}4. Testing API Endpoints...${NC}"

# Test Mapbox Endpoints
run_test "Mapbox API" "curl -s -o /dev/null -w '%{http_code}' 'https://api.mapbox.com/v1/status'"

# Test Weather API
run_test "Weather API" "curl -s -o /dev/null -w '%{http_code}' 'https://api.weather.gov/status'"

# Test Tesla API
run_test "Tesla API" "curl -s -o /dev/null -w '%{http_code}' 'https://owner-api.teslamotors.com/api/1/status'"

# Test Charging API
run_test "Charging API" "curl -s -o /dev/null -w '%{http_code}' 'https://api.openchargemap.io/v3/status'"

# 5. Performance Tests
echo -e "\n${YELLOW}5. Running Performance Tests...${NC}"

run_test "Launch Time" "xcodebuild test -scheme 48Continental -only-testing:ProductionValidationTests/testAppLaunchPerformance"
run_test "Memory Usage" "xcodebuild test -scheme 48Continental -only-testing:ProductionValidationTests/testMemoryManagement"
run_test "Concurrent Operations" "xcodebuild test -scheme 48Continental -only-testing:ProductionValidationTests/testConcurrentOperations"

# Generate Test Report
echo -e "\n${YELLOW}Test Results Summary${NC}"
echo "===================="
echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Tests Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Tests Failed: ${RED}$((TOTAL_TESTS - PASSED_TESTS))${NC}"
echo ""

# Show detailed results
echo "Detailed Results:"
echo "----------------"
for test_name in "${!TEST_RESULTS[@]}"; do
    if [ "${TEST_RESULTS[$test_name]}" == "PASS" ]; then
        echo -e "${GREEN}✓ $test_name${NC}"
    else
        echo -e "${RED}✗ $test_name${NC}"
    fi
done

# Calculate pass percentage
PASS_PERCENTAGE=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))

echo -e "\n${YELLOW}Final Status${NC}"
echo "============"
if [ "$PASS_PERCENTAGE" -eq 100 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
    echo "App is verified and ready for deployment"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo "Pass rate: $PASS_PERCENTAGE%"
    echo "Please fix failing tests before deployment"
    exit 1
fi
