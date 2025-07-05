#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

source "$ROOT_DIR/env/workflows.env"

# Function to check if command was successful
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1"
        return 1
    fi
}

# Test n8n connection
test_n8n() {
    echo "Testing n8n connection..."
    curl -s "http://localhost:5678/healthz" > /dev/null
    check_status "n8n health check"
}

# Test Copilot agent connection
test_copilot() {
    echo "Testing Copilot agent connection..."
    curl -s "$COPILOT_AGENT_URL/healthz" > /dev/null
    check_status "Copilot agent health check"
}

# Test WebSocket connection
test_websocket() {
    echo "Testing WebSocket connection..."
    # Simple WebSocket test using wscat if available
    if command -v wscat &> /dev/null; then
        echo '{"type":"ping"}' | wscat -c "$COPILOT_AGENT_URL/ws" --connect-timeout 5 > /dev/null 2>&1
        check_status "WebSocket connection"
    else
        echo -e "${YELLOW}Warning: wscat not installed, skipping WebSocket test${NC}"
    fi
}

# Test workflow import
test_workflow_import() {
    echo "Testing workflow import..."
    for workflow in "$ROOT_DIR"/workflows/*.json; do
        name=$(basename "$workflow" .json)
        response=$(curl -s -X POST \
            -H "Authorization: Bearer $N8N_AUTH_TOKEN" \
            -H "Content-Type: application/json" \
            -d @"$workflow" \
            http://localhost:5678/rest/workflows)
        
        if [[ $response == *"id"* ]]; then
            check_status "Import workflow: $name"
        else
            check_status "Import workflow: $name failed"
            return 1
        fi
    done
}

# Test task creation
test_task_creation() {
    echo "Testing task creation..."
    task_data='{
        "title": "Test Task",
        "description": "This is a test task",
        "type": "test",
        "priority": "low"
    }'
    
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$task_data" \
        "http://localhost:5678/webhook/copilot/task")
    
    if [[ $response == *"success"* ]]; then
        check_status "Task creation"
        echo -e "${BLUE}Task ID: $(echo $response | jq -r '.task_id')${NC}"
    else
        check_status "Task creation failed"
        return 1
    fi
}

# Test monitoring
test_monitoring() {
    echo "Testing monitoring setup..."
    if [ -f "$ROOT_DIR/monitoring/logrotate.conf" ]; then
        check_status "Monitoring configuration"
    else
        check_status "Monitoring configuration not found"
        return 1
    fi
}

# Run all tests
run_tests() {
    echo -e "${BLUE}Starting integration tests...${NC}"
    
    local failed=0
    
    test_n8n || failed=1
    test_copilot || failed=1
    test_websocket || failed=1
    test_workflow_import || failed=1
    test_task_creation || failed=1
    test_monitoring || failed=1
    
    if [ $failed -eq 0 ]; then
        echo -e "\n${GREEN}All tests passed successfully!${NC}"
    else
        echo -e "\n${RED}Some tests failed. Please check the output above.${NC}"
        exit 1
    fi
}

# Display test summary
print_summary() {
    echo -e "\n${BLUE}Integration Test Summary${NC}"
    echo "------------------------"
    echo "n8n URL: http://localhost:5678"
    echo "Copilot Agent URL: $COPILOT_AGENT_URL"
    echo "Workflows Tested: $(ls -1 "$ROOT_DIR"/workflows/*.json | wc -l)"
    echo "------------------------"
}

# Main execution
echo -e "${BLUE}n8n - Copilot Integration Tests${NC}"
echo "==============================="

run_tests
print_summary
