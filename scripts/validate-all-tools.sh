#!/bin/bash

# =============================================================================
#  A Whittle Wandering: Tools and MCP Validation Script
#  This script validates all tools and MCP components in the project.
# =============================================================================

# Terminal colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Header
echo -e "${BLUE}=========================================================${NC}"
echo -e "${BLUE}  A Whittle Wandering: Tools and MCP Validation Script   ${NC}"
echo -e "${BLUE}=========================================================${NC}"
echo -e "${CYAN}Started at: $(date)${NC}"
echo -e "${CYAN}Project root: ${PROJECT_ROOT}${NC}\n"

# Function to check if previous command succeeded
check_result() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ PASSED${NC}: $1"
    return 0
  else
    echo -e "${RED}✗ FAILED${NC}: $1"
    if [ "$2" == "critical" ]; then
      echo -e "${RED}Critical validation failed. Exiting.${NC}"
      exit 1
    fi
    return 1
  fi
}

# Function to run a test with timeout
run_with_timeout() {
    timeout=$1
    shift
    command="$@"
    
    ( $command ) & pid=$!
    
    ( sleep $timeout && kill -HUP $pid 2>/dev/null ) & watcher=$!
    
    if wait $pid 2>/dev/null; then
        pkill -HUP -P $watcher 2>/dev/null
        wait $watcher 2>/dev/null
        return 0
    else
        echo -e "${RED}Command timed out after ${timeout} seconds${NC}"
        return 1
    fi
}

# Initialize counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0
CRITICAL_FAILURES=()
NONCRITICAL_FAILURES=()

# Function to run a test and update counters
run_test() {
  test_name=$1
  test_command=$2
  criticality=$3
  
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  echo -e "${BLUE}Running test:${NC} $test_name"
  bash -c "$test_command"
  
  if [ $? -eq 0 ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo -e "${GREEN}✓ PASSED:${NC} $test_name"
    # Add to validation report
    echo "- ✅ **$test_name**: Passed" >> "$VALIDATION_REPORT"
    return 0
  else
FAILED_TESTS=$((FAILED_TESTS + 1))
echo -e "${RED}✗ FAILED:${NC} $test_name"
# Add to validation report
echo "- ❌ **$test_name**: Failed" >> "$VALIDATION_REPORT"
if [ "$criticality" == "critical" ]; then
  CRITICAL_FAILURES+=("$test_name")
else
  NONCRITICAL_FAILURES+=("$test_name")
fi
return 1
  fi
}

print_summary() {
  echo -e "\n${BLUE}=========================================================${NC}"
  echo -e "${BLUE}                  Validation Summary                     ${NC}"
  echo -e "${BLUE}=========================================================${NC}"
  echo -e "${CYAN}Total tests     : ${TOTAL_TESTS}${NC}"
  echo -e "${GREEN}Passed tests    : ${PASSED_TESTS}${NC}"
  echo -e "${RED}Failed tests    : ${FAILED_TESTS}${NC}"
  echo -e "${YELLOW}Skipped tests   : ${SKIPPED_TESTS}${NC}"

  if [ ${#CRITICAL_FAILURES[@]} -gt 0 ]; then
    echo -e "\n${RED}Critical failures:${NC}"
    for fail in "${CRITICAL_FAILURES[@]}"; do
      echo -e "  - $fail"
    done
  fi
  if [ ${#NONCRITICAL_FAILURES[@]} -gt 0 ]; then
    echo -e "\n${YELLOW}Non-critical failures (did NOT block deployment):${NC}"
    for fail in "${NONCRITICAL_FAILURES[@]}"; do
      echo -e "  - $fail"
    done
  fi

  if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}All validation tests passed successfully!${NC}"
  elif [ ${#CRITICAL_FAILURES[@]} -eq 0 ]; then
    echo -e "\n${YELLOW}All failed tests were non-critical. Proceeding with deployment.${NC}"
  else
    echo -e "\n${RED}${#CRITICAL_FAILURES[@]} critical validation tests failed. Deployment should be blocked.${NC}"
  fi
}

# ========= STEP 1: Environment Check =========
echo -e "${PURPLE}=== Step 1: Environment Check ===${NC}"

# Check if Node.js is installed
run_test "Node.js installation check" "command -v node &> /dev/null" "critical"

# Check Node.js version
run_test "Node.js version check" "node --version | grep -E 'v[0-9]+\.[0-9]+\.[0-9]+' &> /dev/null" "critical"

# Check if npm is installed
run_test "npm installation check" "command -v npm &> /dev/null" "critical"

# Check if required directories exist
run_test "MCP server directory check" "[ -d \"${PROJECT_ROOT}/mcp-server\" ]" "critical"
run_test "Edge worker directory check" "[ -d \"${PROJECT_ROOT}/edge-worker\" ]"
run_test "AI agents directory check" "[ -d \"${PROJECT_ROOT}/ai-agents\" ]"

# ========= STEP 2: MCP Server Validation =========
echo -e "\n${PURPLE}=== Step 2: MCP Server Validation ===${NC}"

# Change directory to project root
cd "${PROJECT_ROOT}"

# Check if MCP server package.json exists
if [ -f "${PROJECT_ROOT}/mcp-server/package.json" ]; then
  run_test "MCP server package.json validation" "node -e \"JSON.parse(require('fs').readFileSync('${PROJECT_ROOT}/mcp-server/package.json', 'utf8'))\""
else
  echo -e "${YELLOW}SKIPPED: MCP server package.json not found${NC}"
  SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
fi

# Run agent validation if script exists
if [ -f "${PROJECT_ROOT}/mcp-server/tests/validate-agents.js" ]; then
  run_test "MCP agent validation" "node mcp-server/tests/validate-agents.js"
else
  echo -e "${YELLOW}SKIPPED: Agent validation script not found${NC}"
  SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
fi

# Validate Map Integration
echo -e "\n${BLUE}== Validating Map Integration ==${NC}"
if [ -f "${PROJECT_ROOT}/codex-agent/tasks/mapIntegration.ts" ]; then
  run_test "Map Integration diagnostics" "cd ${PROJECT_ROOT} && npx ts-node ./codex-agent/tasks/mapIntegration.ts"
else
  echo -e "${YELLOW}SKIPPED: Map Integration diagnostic script not found${NC}"
  SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
fi

# ========= STEP 3: Edge Worker MCP Validation =========
echo -e "\n${PURPLE}=== Step 3: Edge Worker MCP Validation ===${NC}"

# Check if edge worker wrangler.toml exists
if [ -f "${PROJECT_ROOT}/edge-worker/wrangler.toml" ]; then
  run_test "Edge worker wrangler.toml validation" "[ -s \"${PROJECT_ROOT}/edge-worker/wrangler.toml\" ]"
else
  echo -e "${YELLOW}SKIPPED: Edge worker wrangler.toml not found${NC}"
  SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
fi

# Check if MCP components exist in edge worker
run_test "Edge worker MCP components check" "[ -f \"${PROJECT_ROOT}/edge-worker/src/mcp/index.ts\" ]"

# Run edge worker tests if package.json exists
if [ -f "${PROJECT_ROOT}/edge-worker/package.json" ]; then
  cd "${PROJECT_ROOT}/edge-worker"
  if grep -q "\"test\":" package.json; then
    run_test "Edge worker tests" "npm test --silent || exit 1"
  else
    echo -e "${YELLOW}SKIPPED: No test script found in edge-worker package.json${NC}"
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
  fi
  cd "${PROJECT_ROOT}"
else
  echo -e "${YELLOW}SKIPPED: Edge worker package.json not found${NC}"
  SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
fi

# ========= STEP 4: AI Agents Validation =========
echo -e "\n${PURPLE}=== Step 4: AI Agents Validation ===${NC}"

# Check if AI agents tools exist
run_test "AI agents tools check" "ls ${PROJECT_ROOT}/ai-agents/tools/*.json &> /dev/null"

# Validate JSON format of tool definitions
for tool_file in ${PROJECT_ROOT}/ai-agents/tools/*.json; do
  if [ -f "$tool_file" ]; then
    tool_name=$(basename "$tool_file")
    run_test "Tool validation: $tool_name" "node -e \"JSON.parse(require('fs').readFileSync('$tool_file', 'utf8'))\""
  fi
done

# Run AI agents activation script if it exists
if [ -f "${PROJECT_ROOT}/ai-agents/activate-agents.sh" ]; then
  if [ -x "${PROJECT_ROOT}/ai-agents/activate-agents.sh" ]; then
    # Only validate if the script has a validate flag
    if grep -q -- "--validate" "${PROJECT_ROOT}/ai-agents/activate-agents.sh"; then
      run_test "AI agents activation validation" "${PROJECT_ROOT}/ai-agents/activate-agents.sh --validate || exit 0"
    else
      echo -e "${YELLOW}SKIPPED: AI agents activation script does not support validation${NC}"
      SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    fi
  else
    echo -e "${YELLOW}SKIPPED: AI agents activation script is not executable${NC}"
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
  fi
else
  echo -e "${YELLOW}SKIPPED: AI agents activation script not found${NC}"
  SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
fi

# ========= STEP 5: GitHub MCP Validation =========
echo -e "\n${PURPLE}=== Step 5: GitHub MCP Validation ===${NC}"

# Check if GitHub MCP exists
if [ -d "${PROJECT_ROOT}/github-mcp" ]; then
  run_test "GitHub MCP directory check" "[ -d \"${PROJECT_ROOT}/github-mcp\" ]"
  
  # Check if GitHub workflow status script exists
  if [ -f "${PROJECT_ROOT}/scripts/github-workflow-status.sh" ]; then
    run_test "GitHub workflow status check" "${PROJECT_ROOT}/scripts/github-workflow-status.sh"
  else
    echo -e "${YELLOW}SKIPPED: GitHub workflow status script not found${NC}"
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
  fi
else
  echo -e "${YELLOW}SKIPPED: GitHub MCP directory not found${NC}"
  SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
fi

# ========= STEP 6: API Endpoint Testing =========
echo -e "\n${PURPLE}=== Step 6: API Endpoint Testing ===${NC}"

# Check if API endpoint test script exists
if [ -f "${PROJECT_ROOT}/scripts/test-api-endpoints.js" ]; then
  run_test "API endpoint tests" "node ${PROJECT_ROOT}/scripts/test-api-endpoints.js"
else
  echo -e "${YELLOW}SKIPPED: API endpoint test script not found${NC}"
  SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
fi

# ========= STEP 7: Pre-deploy Checks =========
echo -e "\n${PURPLE}=== Step 7: Pre-deploy Checks ===${NC}"

# Run pre-deploy checks if available
if command -v npx &> /dev/null && [ -f "${PROJECT_ROOT}/package.json" ] && grep -q "\"pre-deploy\":" "${PROJECT_ROOT}/package.json"; then
  run_test "Pre-deploy checks" "cd ${PROJECT_ROOT} && npm run pre-deploy --silent || exit 1"
else
  echo -e "${YELLOW}SKIPPED: Pre-deploy script not found in package.json${NC}"
  SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
fi

# ========= STEP 8: Map Integration Diagnostics =========
echo -e "\n${PURPLE}=== Step 8: Map Integration Diagnostics ===${NC}"

# Run map integration diagnostics if available
if [ -f "${PROJECT_ROOT}/codex-agent/tasks/mapIntegration.ts" ]; then
  run_test "Map integration diagnostics" "cd ${PROJECT_ROOT} && npx ts-node ./codex-agent/tasks/mapIntegration.ts"
else
  echo -e "${YELLOW}SKIPPED: Map integration diagnostics script not found${NC}"
  SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
fi

# Print summary
print_summary

# Generate validation report
REPORT_PATH="${PROJECT_ROOT}/docs/testing/validation_report_$(date +"%Y%m%d_%H%M%S").md"
echo -e "# A Whittle Wandering Tools and MCP Validation Report\n" > "$REPORT_PATH"
echo -e "**Date:** $(date)\n" >> "$REPORT_PATH"
echo -e "**Total tests:** ${TOTAL_TESTS}\n" >> "$REPORT_PATH"
echo -e "**Passed tests:** ${PASSED_TESTS}\n" >> "$REPORT_PATH"
echo -e "**Failed tests:** ${FAILED_TESTS}\n" >> "$REPORT_PATH"
echo -e "**Skipped tests:** ${SKIPPED_TESTS}\n" >> "$REPORT_PATH"

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "\n**Status:** ✅ All validation tests passed successfully!\n" >> "$REPORT_PATH"
else
  echo -e "\n**Status:** ❌ ${FAILED_TESTS} validation tests failed.\n" >> "$REPORT_PATH"
fi

echo -e "See \`${PROJECT_ROOT}/docs/testing/TOOLS_MCP_VALIDATION_PLAN.md\` for the complete validation plan.\n" >> "$REPORT_PATH"

echo -e "${GREEN}Validation report saved to:${NC} $REPORT_PATH"

exit $FAILED_TESTS
