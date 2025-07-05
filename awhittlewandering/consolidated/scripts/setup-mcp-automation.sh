#!/bin/bash
# Entry point script for MCP Server deployment automation
# This script serves as a simple entry point to set up the MCP server automation

# Colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}     MCP Server Deployment Automation Setup           ${NC}"
echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN}Starting MCP server deployment automation setup...${NC}"
echo

# Get the base directory (repository root)
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$REPO_ROOT"

# Check if the auto-setup script exists
if [ -f "$REPO_ROOT/n8n/scripts/auto-setup-mcp.sh" ]; then
    # Execute the auto-setup script
    bash "$REPO_ROOT/n8n/scripts/auto-setup-mcp.sh"
else
    echo "Error: MCP server automation setup script not found."
    echo "Please ensure the file exists at: $REPO_ROOT/n8n/scripts/auto-setup-mcp.sh"
    exit 1
fi
