#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

cd "$(dirname "$0")/.."

echo -e "${BLUE}Registering all workflows...${NC}"

# Create directories if they don't exist
mkdir -p workflows

# Core workflows to register
WORKFLOWS=(
    "copilot-task-handler"
    "task-monitoring"
    "edge-worker-tasks"
    "agent-coordination"
    "repo-cleanup"
    "website-deployment"
)

for workflow in "${WORKFLOWS[@]}"; do
    echo -e "${BLUE}Registering $workflow...${NC}"
    
    # Check if workflow file exists
    if [[ ! -f "workflows/${workflow}.json" ]]; then
        echo -e "${RED}Error: workflows/${workflow}.json not found${NC}"
        continue
    fi

    # Register workflow with n8n
    response=$(curl -s -X POST "http://localhost:5679/rest/workflows" \
        -H "Content-Type: application/json" \
        -d @"workflows/${workflow}.json")

    if [[ $response == *"id"* ]]; then
        echo -e "${GREEN}✓ ${workflow} registered successfully${NC}"
    else
        echo -e "${RED}✗ Failed to register ${workflow}${NC}"
        echo "Response: $response"
    fi
done

# Activate all workflows
echo -e "\n${BLUE}Activating workflows...${NC}"
for workflow in "${WORKFLOWS[@]}"; do
    id=$(curl -s "http://localhost:5679/rest/workflows" | jq -r ".data[] | select(.name==\"$workflow\") | .id")
    
    if [[ -n "$id" ]]; then
        response=$(curl -s -X PATCH "http://localhost:5679/rest/workflows/${id}/activate" \
            -H "Content-Type: application/json")
        
        if [[ $response == *"true"* ]]; then
            echo -e "${GREEN}✓ ${workflow} activated${NC}"
        else
            echo -e "${RED}✗ Failed to activate ${workflow}${NC}"
        fi
    fi
done

echo -e "\n${GREEN}Workflow registration complete!${NC}"
