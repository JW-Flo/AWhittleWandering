#!/bin/bash
# Streamlined Test Script - Supports Test Categorization
# This script runs tests based on deployment phase requirements

set -e  # Exit on any error

# Console colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command line arguments
TEST_TYPE=${1:-"all"}
FAIL_FAST=${2:-"false"}

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}   A Whittle Wandering - Test Suite     ${NC}"
echo -e "${BLUE}   Test Type: $TEST_TYPE                ${NC}"
echo -e "${BLUE}=========================================${NC}"

# Navigate to the project directory
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)

echo -e "\n${YELLOW}Starting automated tests...${NC}"

# Check dependencies
echo -e "\n${BLUE}Checking dependencies...${NC}"
if grep -q "@cloudflare/workerd-builder" package.json; then
    echo -e "${RED}ERROR: @cloudflare/workerd-builder dependency still present in package.json!${NC}"
    echo -e "${YELLOW}Please remove this dependency as it's causing installation issues.${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Dependencies check passed${NC}"
fi

# Function to run tests with error handling
run_test_suite() {
    local suite_name=$1
    local test_path=$2
    local is_critical=${3:-"false"}
    
    echo -e "\n${BLUE}Running $suite_name tests...${NC}"
    
    if [ "$is_critical" = "true" ] && [ "$FAIL_FAST" = "true" ]; then
        # Critical tests fail fast
        npx vitest run "$test_path" --reporter=verbose
    else
        # Non-critical tests continue on error
        if npx vitest run "$test_path" --reporter=verbose; then
            echo -e "${GREEN}✓ $suite_name tests passed${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠ $suite_name tests failed (non-critical)${NC}"
            return 1
        fi
    fi
}

# Track test results
CRITICAL_PASSED=true
NON_CRITICAL_FAILURES=0

case $TEST_TYPE in
    "critical")
        echo -e "\n${YELLOW}Running CRITICAL tests only (deployment blocking)${NC}"
        if ! run_test_suite "Critical API" "tests/critical/" "true"; then
            CRITICAL_PASSED=false
        fi
        ;;
    
    "api")
        echo -e "\n${YELLOW}Running API tests${NC}"
        if ! run_test_suite "API Endpoints" "tests/api/" "false"; then
            ((NON_CRITICAL_FAILURES++))
        fi
        ;;
    
    "components")
        echo -e "\n${YELLOW}Running Component tests${NC}"
        if ! run_test_suite "React Components" "tests/components/" "false"; then
            ((NON_CRITICAL_FAILURES++))
        fi
        ;;
    
    "integration")
        echo -e "\n${YELLOW}Running Integration tests${NC}"
        if ! run_test_suite "Integration" "tests/integration/" "false"; then
            ((NON_CRITICAL_FAILURES++))
        fi
        ;;
    
    "post-deploy")
        echo -e "\n${YELLOW}Running Post-Deployment validation${NC}"
        if ! run_test_suite "Post-Deploy Validation" "tests/post-deploy/" "false"; then
            ((NON_CRITICAL_FAILURES++))
        fi
        ;;
    
    "all")
        echo -e "\n${YELLOW}Running ALL tests${NC}"
        
        # Critical tests first
        echo -e "\n${BLUE}Phase 1: Critical Tests${NC}"
        if ! run_test_suite "Critical API" "tests/critical/" "true"; then
            CRITICAL_PASSED=false
        fi
        
        # Non-critical tests (can fail without blocking)
        echo -e "\n${BLUE}Phase 2: Non-Critical Tests${NC}"
        if ! run_test_suite "API Endpoints" "tests/api/" "false"; then
            ((NON_CRITICAL_FAILURES++))
        fi
        
        if ! run_test_suite "React Components" "tests/components/" "false"; then
            ((NON_CRITICAL_FAILURES++))
        fi
        ;;
    
    *)
        echo -e "${RED}ERROR: Unknown test type '$TEST_TYPE'${NC}"
        echo -e "${YELLOW}Available options: critical, api, components, integration, post-deploy, all${NC}"
        exit 1
        ;;
esac

# Generate report
echo -e "\n${BLUE}Generating test report...${NC}"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
REPORT_FILE="test-report-$(date +"%Y%m%d%H%M%S").txt"

echo "A Whittle Wandering Test Report" > "$REPORT_FILE"
echo "Generated: $TIMESTAMP" >> "$REPORT_FILE"
echo "Test Type: $TEST_TYPE" >> "$REPORT_FILE"
echo "===================================" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [ "$CRITICAL_PASSED" = "true" ]; then
    echo "Critical Tests: PASS ✓" >> "$REPORT_FILE"
else
    echo "Critical Tests: FAIL ✗" >> "$REPORT_FILE"
fi

echo "Non-Critical Failures: $NON_CRITICAL_FAILURES" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Add test type specific information
case $TEST_TYPE in
    "critical")
        echo "Deployment Status: READY FOR DEPLOYMENT" >> "$REPORT_FILE"
        ;;
    "all")
        if [ "$CRITICAL_PASSED" = "true" ]; then
            echo "Deployment Status: READY FOR DEPLOYMENT" >> "$REPORT_FILE"
        else
            echo "Deployment Status: BLOCKED - CRITICAL TESTS FAILED" >> "$REPORT_FILE"
        fi
        echo "Non-Critical Issues: $NON_CRITICAL_FAILURES (will not block deployment)" >> "$REPORT_FILE"
        ;;
    *)
        echo "Deployment Status: NOT APPLICABLE" >> "$REPORT_FILE"
        ;;
esac

echo "===================================" >> "$REPORT_FILE"

echo -e "${GREEN}Test report generated: $REPORT_FILE${NC}"

# Final status reporting
echo -e "\n${BLUE}=========================================${NC}"

if [ "$CRITICAL_PASSED" = "true" ]; then
    echo -e "${GREEN}✓ Critical tests passed - Deployment ready!${NC}"
    if [ "$NON_CRITICAL_FAILURES" -gt 0 ]; then
        echo -e "${YELLOW}⚠ $NON_CRITICAL_FAILURES non-critical test(s) failed${NC}"
        echo -e "${YELLOW}  These will not block deployment but should be addressed${NC}"
    fi
else
    echo -e "${RED}✗ Critical tests failed - Deployment blocked!${NC}"
    echo -e "${RED}  Fix critical issues before deploying${NC}"
fi

echo -e "${BLUE}=========================================${NC}"

# Exit codes
if [ "$CRITICAL_PASSED" = "false" ]; then
    exit 1
elif [ "$TEST_TYPE" = "critical" ] || [ "$TEST_TYPE" = "all" ]; then
    # For critical or all tests, success means critical tests passed
    exit 0
else
    # For other test types, exit with failure count (but capped at 1 for shell)
    if [ "$NON_CRITICAL_FAILURES" -gt 0 ]; then
        exit 1
    else
        exit 0
    fi
fi
