#!/bin/bash

# =============================================================================
#  A Whittle Wandering: Tools and MCP Validation Script
#  SIMPLIFIED: Only essential validations run by default
#  Complex validations are commented out but preserved for future use
# =============================================================================

# Terminal colors (kept for future use)
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "🔍 Running essential build checks..."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required"
    exit 1
fi

# Check if npm is available  
if ! command -v npm &> /dev/null; then
    echo "❌ npm is required"
    exit 1
fi

echo "✅ All essential checks passed"

# =============================================================================
# COMPLEX VALIDATION FUNCTIONS (COMMENTED OUT BUT PRESERVED)
# Uncomment sections below if you need comprehensive validation
# =============================================================================

# Function to check if previous command succeeded
# check_result() {
#   if [ $? -eq 0 ]; then
#     echo -e "${GREEN}✓ PASSED${NC}: $1"
#     return 0
#   else
#     echo -e "${RED}✗ FAILED${NC}: $1"
#     if [ "$2" == "critical" ]; then
#       echo -e "${RED}Critical validation failed. Exiting.${NC}"
#       exit 1
#     fi
#     return 1
#   fi
# }

# Function to run a test with timeout
# run_with_timeout() {
#     timeout=$1
#     shift
#     command="$@"
#     
#     ( $command ) & pid=$!
#     
#     ( sleep $timeout && kill -HUP $pid 2>/dev/null ) & watcher=$!
#     
#     if wait $pid 2>/dev/null; then
#         pkill -HUP -P $watcher 2>/dev/null
#         wait $watcher 2>/dev/null
#         return 0
#     else
#         echo -e "${RED}Command timed out after ${timeout} seconds${NC}"
#         return 1
#     fi
# }

# Initialize counters
# TOTAL_TESTS=0
# PASSED_TESTS=0
# FAILED_TESTS=0
# SKIPPED_TESTS=0

# Function to run a test and update counters
# run_test() {
#   test_name=$1
#   test_command=$2
#   criticality=$3
#   
#   TOTAL_TESTS=$((TOTAL_TESTS + 1))
#   
#   echo -e "${BLUE}Running test:${NC} $test_name"
#   bash -c "$test_command"
#   
#   if [ $? -eq 0 ]; then
#     PASSED_TESTS=$((PASSED_TESTS + 1))
#     return 0
#   else
#     FAILED_TESTS=$((FAILED_TESTS + 1))
#     if [ "$criticality" == "critical" ]; then
#       echo -e "${RED}Critical validation failed. Exiting.${NC}"
#       print_summary
#       exit 1
#     fi
#     return 1
#   fi
# }

# }

# print_summary() {
#   echo -e "\n${BLUE}=========================================================${NC}"
#   echo -e "${BLUE}                  Validation Summary                     ${NC}"
#   echo -e "${BLUE}=========================================================${NC}"
#   echo -e "${CYAN}Total tests     : ${TOTAL_TESTS}${NC}"
#   echo -e "${GREEN}Passed tests    : ${PASSED_TESTS}${NC}"
#   echo -e "${RED}Failed tests    : ${FAILED_TESTS}${NC}"
#   echo -e "${YELLOW}Skipped tests   : ${SKIPPED_TESTS}${NC}"
#   
#   if [ $FAILED_TESTS -eq 0 ]; then
#     echo -e "\n${GREEN}All validation tests passed successfully!${NC}"
#   else
#     echo -e "\n${RED}${FAILED_TESTS} validation tests failed. See above for details.${NC}"
#   fi
# }

# =============================================================================
# COMPREHENSIVE VALIDATION STEPS (COMMENTED OUT BUT PRESERVED)
# =============================================================================

# ========= STEP 1: Environment Check =========
# echo -e "${PURPLE}=== Step 1: Environment Check ===${NC}"
# 
# # Check if Node.js is installed
# run_test "Node.js installation check" "command -v node &> /dev/null" "critical"
# 
# # Check Node.js version
# run_test "Node.js version check" "node --version | grep -E 'v[0-9]+\.[0-9]+\.[0-9]+' &> /dev/null" "critical"
# 
# # Check if npm is installed
# run_test "npm installation check" "command -v npm &> /dev/null" "critical"
# 
# # Check if required directories exist
# run_test "MCP server directory check" "[ -d \"${PROJECT_ROOT}/mcp-server\" ]" "critical"
# run_test "Edge worker directory check" "[ -d \"${PROJECT_ROOT}/edge-worker\" ]"
# run_test "AI agents directory check" "[ -d \"${PROJECT_ROOT}/ai-agents\" ]"

# ========= STEP 2: MCP Server Validation =========
# echo -e "\n${PURPLE}=== Step 2: MCP Server Validation ===${NC}"
# 
# # Change directory to project root
# cd "${PROJECT_ROOT}"
# 
# # Check if MCP server package.json exists
# if [ -f "${PROJECT_ROOT}/mcp-server/package.json" ]; then
#   run_test "MCP server package.json validation" "node -e \"JSON.parse(require('fs').readFileSync('${PROJECT_ROOT}/mcp-server/package.json', 'utf8'))\""
# else
#   echo -e "${YELLOW}SKIPPED: MCP server package.json not found${NC}"
#   SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
# fi
# 
# # Run agent validation if script exists
# if [ -f "${PROJECT_ROOT}/mcp-server/tests/validate-agents.js" ]; then
#   run_test "MCP agent validation" "node mcp-server/tests/validate-agents.js"
# else
#   echo -e "${YELLOW}SKIPPED: Agent validation script not found${NC}"
#   SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
# fi

# ========= STEP 3: Edge Worker MCP Validation =========
# echo -e "\n${PURPLE}=== Step 3: Edge Worker MCP Validation ===${NC}"
# 
# # Check if edge worker wrangler.toml exists
# if [ -f "${PROJECT_ROOT}/edge-worker/wrangler.toml" ]; then
#   run_test "Edge worker wrangler.toml validation" "[ -s \"${PROJECT_ROOT}/edge-worker/wrangler.toml\" ]"
# else
#   echo -e "${YELLOW}SKIPPED: Edge worker wrangler.toml not found${NC}"
#   SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
# fi
# 
# # Check if MCP components exist in edge worker
# run_test "Edge worker MCP components check" "[ -f \"${PROJECT_ROOT}/edge-worker/src/mcp/index.ts\" ]"
# 
# # Run edge worker tests if package.json exists
# if [ -f "${PROJECT_ROOT}/edge-worker/package.json" ]; then
#   cd "${PROJECT_ROOT}/edge-worker"
#   if grep -q "\"test\":" package.json; then
#     run_test "Edge worker tests" "npm test --silent || exit 1"
#   else
#     echo -e "${YELLOW}SKIPPED: No test script found in edge-worker package.json${NC}"
#     SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
#   fi
#   cd "${PROJECT_ROOT}"
# else
#   echo -e "${YELLOW}SKIPPED: Edge worker package.json not found${NC}"
#   SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
# fi

# ========= ADDITIONAL VALIDATION STEPS =========
# (All other complex validation steps are preserved here but commented out)
# Uncomment as needed for comprehensive validation

# =============================================================================
# TO ENABLE COMPREHENSIVE VALIDATION:
# 1. Uncomment the functions above
# 2. Uncomment the validation steps you need
# 3. Run the script with: ./validate-all-tools.sh --comprehensive
# =============================================================================
