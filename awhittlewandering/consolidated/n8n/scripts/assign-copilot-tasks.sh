#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Assigning tasks to Copilot...${NC}"

# Function to assign task
assign_task() {
    local title="$1"
    local description="$2"
    local type="$3"
    local priority="$4"

    response=$(curl -s -X POST "http://localhost:5678/webhook/agent/task" \
        -H "Content-Type: application/json" \
        -d "{
            \"title\": \"$title\",
            \"description\": \"$description\",
            \"type\": \"$type\",
            \"priority\": \"$priority\",
            \"assigned_agent\": \"copilot\"
        }")

    if [[ $response == *"success"* ]]; then
        echo -e "${GREEN}✓${NC} Task assigned: $title"
        return 0
    else
        echo -e "${RED}✗${NC} Failed to assign task: $title"
        echo "Response: $response"
        return 1
    fi
}

# Repository Cleanup Tasks
assign_task \
    "Repository Structure Analysis" \
    "Analyze current repository structure and document component relationships" \
    "analysis" \
    "high"

assign_task \
    "Tag Stable Version" \
    "Create v1.0.0-stable tag and document version differences" \
    "versioning" \
    "high"

# CI/CD Pipeline Tasks
assign_task \
    "Fix Redundant Workflow Runs" \
    "Analyze and optimize GitHub Actions workflows to prevent redundant runs" \
    "optimization" \
    "high"

assign_task \
    "Update Security Credentials" \
    "Review and update security credential handling in CI/CD pipelines" \
    "security" \
    "critical"

# Edge Worker Tasks
assign_task \
    "Implement CORS Handling" \
    "Add comprehensive CORS handling to Edge Worker with proper security headers" \
    "implementation" \
    "high"

assign_task \
    "Add Telemetry Validation" \
    "Implement telemetry validation layer with error handling and monitoring" \
    "implementation" \
    "high"

# Documentation Tasks
assign_task \
    "Create Developer Guide" \
    "Create comprehensive developer onboarding guide and API documentation" \
    "documentation" \
    "medium"

assign_task \
    "Update Troubleshooting Docs" \
    "Document common issues and troubleshooting procedures" \
    "documentation" \
    "medium"

echo -e "\n${BLUE}Task Assignment Summary${NC}"
echo "------------------------"
echo "✓ Repository cleanup tasks assigned"
echo "✓ CI/CD pipeline tasks assigned"
echo "✓ Edge Worker tasks assigned"
echo "✓ Documentation tasks assigned"
echo "------------------------"

echo -e "\n${GREEN}All tasks have been assigned to Copilot!${NC}"
echo "Use 'make agent-status' to monitor task progress"
