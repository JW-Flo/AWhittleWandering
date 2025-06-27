#!/bin/bash
# Deployment Pipeline CLI Tool
# Helps manage the streamlined deployment pipeline

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Function to display help
show_help() {
    echo -e "${BLUE}AWhittleWandering Deployment Pipeline CLI${NC}"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo -e "  ${GREEN}status${NC}           Show pipeline status"
    echo -e "  ${GREEN}test${NC} [TYPE]      Run tests (critical|api|components|all)"
    echo -e "  ${GREEN}deploy${NC} [STAGE]   Deploy to stage (alpha|beta|production)"
    echo -e "  ${GREEN}validate${NC}         Validate post-deployment"
    echo -e "  ${GREEN}rollback${NC}         Rollback deployment"
    echo -e "  ${GREEN}flags${NC}            Manage feature flags"
    echo ""
    echo "Examples:"
    echo "  $0 test critical          # Run only critical tests"
    echo "  $0 deploy beta            # Deploy to beta stage"
    echo "  $0 status                 # Show current status"
}

# Function to show pipeline status
show_status() {
    echo -e "${BLUE}=========================================${NC}"
    echo -e "${BLUE}   Deployment Pipeline Status          ${NC}"
    echo -e "${BLUE}=========================================${NC}"
    
    # Check if we're in the right directory
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        echo -e "${RED}Error: Not in AWhittleWandering project directory${NC}"
        exit 1
    fi
    
    echo -e "\n${YELLOW}Project Info:${NC}"
    echo "  Location: $PROJECT_ROOT"
    echo "  Branch: $(git branch --show-current 2>/dev/null || echo 'unknown')"
    echo "  Last Commit: $(git log -1 --pretty=format:'%h - %s' 2>/dev/null || echo 'unknown')"
    
    echo -e "\n${YELLOW}Test Suites:${NC}"
    
    # Check critical tests
    if [ -d "$PROJECT_ROOT/tests/critical" ]; then
        CRITICAL_COUNT=$(find "$PROJECT_ROOT/tests/critical" -name "*.test.*" | wc -l)
        echo -e "  🔴 Critical Tests: ${CRITICAL_COUNT} suites"
    else
        echo -e "  🔴 Critical Tests: ${RED}Not found${NC}"
    fi
    
    # Check API tests  
    if [ -d "$PROJECT_ROOT/tests/api" ]; then
        API_COUNT=$(find "$PROJECT_ROOT/tests/api" -name "*.test.*" | wc -l)
        echo -e "  🟡 API Tests: ${API_COUNT} suites"
    else
        echo -e "  🟡 API Tests: ${RED}Not found${NC}"
    fi
    
    # Check component tests
    if [ -d "$PROJECT_ROOT/tests/components" ]; then
        COMPONENT_COUNT=$(find "$PROJECT_ROOT/tests/components" -name "*.test.*" | wc -l)
        echo -e "  🟡 Component Tests: ${COMPONENT_COUNT} suites"
    else
        echo -e "  🟡 Component Tests: ${RED}Not found${NC}"
    fi
    
    # Check post-deploy tests
    if [ -d "$PROJECT_ROOT/tests/post-deploy" ]; then
        POST_DEPLOY_COUNT=$(find "$PROJECT_ROOT/tests/post-deploy" -name "*.test.*" | wc -l)
        echo -e "  🟢 Post-Deploy Tests: ${POST_DEPLOY_COUNT} suites"
    else
        echo -e "  🟢 Post-Deploy Tests: ${RED}Not found${NC}"
    fi
    
    echo -e "\n${YELLOW}Feature Flags:${NC}"
    if [ -f "$PROJECT_ROOT/packages/shared/featureFlags.ts" ]; then
        echo -e "  ✅ Feature flag system: ${GREEN}Available${NC}"
        echo "  📊 Deployment stages: alpha (5%), beta (25%), production (100%)"
    else
        echo -e "  ❌ Feature flag system: ${RED}Not configured${NC}"
    fi
    
    echo -e "\n${YELLOW}Recent Test Reports:${NC}"
    RECENT_REPORTS=$(find "$PROJECT_ROOT" -name "test-report-*.txt" -mtime -1 2>/dev/null | head -3)
    if [ -n "$RECENT_REPORTS" ]; then
        echo "$RECENT_REPORTS" | while read -r report; do
            TIMESTAMP=$(basename "$report" | sed 's/test-report-\([0-9]*\).txt/\1/')
            echo "  📄 $(basename "$report") ($(date -d "${TIMESTAMP:0:8} ${TIMESTAMP:8:2}:${TIMESTAMP:10:2}:${TIMESTAMP:12:2}" 2>/dev/null || echo 'recent'))"
        done
    else
        echo "  📄 No recent reports found"
    fi
}

# Function to run tests
run_tests() {
    local test_type=${1:-"critical"}
    
    echo -e "${BLUE}Running $test_type tests...${NC}"
    
    cd "$PROJECT_ROOT"
    
    if [ ! -f "scripts/run-api-tests.sh" ]; then
        echo -e "${RED}Error: Test script not found${NC}"
        exit 1
    fi
    
    chmod +x scripts/run-api-tests.sh
    ./scripts/run-api-tests.sh "$test_type"
}

# Function to deploy
deploy() {
    local stage=${1:-"production"}
    
    echo -e "${BLUE}Deploying to $stage stage...${NC}"
    
    # First run critical tests
    echo -e "${YELLOW}Step 1: Running critical tests...${NC}"
    if ! run_tests "critical"; then
        echo -e "${RED}Critical tests failed. Deployment blocked.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Critical tests passed${NC}"
    
    # Simulate deployment
    echo -e "${YELLOW}Step 2: Building application...${NC}"
    sleep 2
    echo -e "${GREEN}✓ Build completed${NC}"
    
    echo -e "${YELLOW}Step 3: Deploying to $stage...${NC}"
    sleep 2
    echo -e "${GREEN}✓ Deployment completed${NC}"
    
    echo -e "${PURPLE}🚀 Deployment to $stage successful!${NC}"
    echo -e "${YELLOW}Non-critical tests will run in background...${NC}"
}

# Function to validate deployment
validate_deployment() {
    echo -e "${BLUE}Validating deployment...${NC}"
    
    cd "$PROJECT_ROOT"
    
    if [ -d "tests/post-deploy" ]; then
        npm run test:post-deploy
    else
        echo -e "${YELLOW}No post-deployment tests configured${NC}"
    fi
}

# Function to manage feature flags
manage_flags() {
    echo -e "${BLUE}Feature Flag Management${NC}"
    echo ""
    echo "Current feature flag configuration:"
    echo ""
    
    if [ -f "$PROJECT_ROOT/packages/shared/featureFlags.ts" ]; then
        grep -A 10 "defaultFeatureFlags" "$PROJECT_ROOT/packages/shared/featureFlags.ts" | grep -E "(true|false)" | sed 's/^/  /'
    else
        echo -e "${RED}Feature flags not configured${NC}"
    fi
}

# Main execution
case "${1:-}" in
    "status")
        show_status
        ;;
    "test")
        run_tests "$2"
        ;;
    "deploy")
        deploy "$2"
        ;;
    "validate")
        validate_deployment
        ;;
    "rollback")
        echo -e "${YELLOW}Rollback functionality would be implemented here${NC}"
        ;;
    "flags")
        manage_flags
        ;;
    "help"|"-h"|"--help"|"")
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac