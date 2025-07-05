#!/bin/bash
# Master integration script for 48 Continental USA project automation
# This script sets up all automation components: MCP server deployment and Project Charter automation

# Set error handling
set -e

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}     48 Continental USA Project Automation Setup      ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Get the base directory (repository root)
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$REPO_ROOT"

# Detect n8n installation
echo -e "${YELLOW}Checking n8n installation...${NC}"
N8N_PORT=$(grep "N8N_PORT" .env 2>/dev/null | cut -d'=' -f2 || echo "5678")

if ! curl -s "http://localhost:${N8N_PORT:-5678}/healthz" > /dev/null; then
  echo -e "${YELLOW}n8n does not appear to be running on port $N8N_PORT.${NC}"
  echo -e "${YELLOW}Would you like to start n8n? (y/n)${NC}"
  read -r START_N8N
  
  if [[ "$START_N8N" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Starting n8n...${NC}"
    
    # Check if docker-compose.yml exists
    if [ -f "docker-compose.yml" ]; then
      echo -e "${YELLOW}Using Docker Compose to start n8n...${NC}"
      docker-compose up -d
    else
      echo -e "${YELLOW}Starting n8n directly...${NC}"
      n8n start &
    fi
    
    # Wait for n8n to start
    echo -e "${YELLOW}Waiting for n8n to start...${NC}"
    for i in {1..30}; do
      if curl -s "http://localhost:${N8N_PORT:-5678}/healthz" > /dev/null; then
        echo -e "${GREEN}n8n is now running!${NC}"
        break
      fi
      
      if [ $i -eq 30 ]; then
        echo -e "${RED}Failed to start n8n. Please start it manually and try again.${NC}"
        exit 1
      fi
      
      echo -e "${YELLOW}Waiting for n8n to start ($i/30)...${NC}"
      sleep 2
    done
  else
    echo -e "${YELLOW}Please start n8n manually and run this script again.${NC}"
    exit 1
  fi
fi

# Setup for MCP Server Deployment
echo -e "\n${BLUE}======================================================${NC}"
echo -e "${BLUE}     Setting up MCP Server Deployment Automation      ${NC}"
echo -e "${BLUE}======================================================${NC}"

if [ -f "$REPO_ROOT/scripts/setup-mcp-automation.sh" ]; then
  echo -e "${YELLOW}Running MCP Server automation setup...${NC}"
  bash "$REPO_ROOT/scripts/setup-mcp-automation.sh"
else
  echo -e "${RED}Error: MCP Server automation setup script not found.${NC}"
  echo -e "${RED}Expected location: $REPO_ROOT/scripts/setup-mcp-automation.sh${NC}"
fi

# Setup for Project Charter Task Automation
echo -e "\n${BLUE}======================================================${NC}"
echo -e "${BLUE}     Setting up Project Charter Task Automation       ${NC}"
echo -e "${BLUE}======================================================${NC}"

if [ -f "$REPO_ROOT/n8n/scripts/setup-charter-automation.sh" ]; then
  echo -e "${YELLOW}Running Project Charter automation setup...${NC}"
  bash "$REPO_ROOT/n8n/scripts/setup-charter-automation.sh"
else
  echo -e "${RED}Error: Project Charter automation setup script not found.${NC}"
  echo -e "${RED}Expected location: $REPO_ROOT/n8n/scripts/setup-charter-automation.sh${NC}"
fi

# Start AI Gateway service
echo -e "\n${BLUE}======================================================${NC}"
echo -e "${BLUE}     Starting AI Gateway for Code Generation          ${NC}"
echo -e "${BLUE}======================================================${NC}"

if [ -f "$REPO_ROOT/services/ai-gateway/start-ai-gateway.sh" ]; then
  echo -e "${YELLOW}Starting AI Gateway service...${NC}"
  bash "$REPO_ROOT/services/ai-gateway/start-ai-gateway.sh"
else
  echo -e "${YELLOW}AI Gateway service script not found. It will be created during Charter automation setup.${NC}"
fi

# Update the workflow registration in n8n
echo -e "\n${BLUE}======================================================${NC}"
echo -e "${BLUE}     Registering All Workflows with n8n               ${NC}"
echo -e "${BLUE}======================================================${NC}"

if [ -f "$REPO_ROOT/n8n/scripts/register-workflows.sh" ]; then
  echo -e "${YELLOW}Running workflow registration...${NC}"
  bash "$REPO_ROOT/n8n/scripts/register-workflows.sh"
else
  echo -e "${YELLOW}Workflow registration script not found. Skipping.${NC}"
fi

# Final instructions
echo -e "\n${BLUE}======================================================${NC}"
echo -e "${GREEN}     48 Continental USA Automation Setup Complete    ${NC}"
echo -e "${BLUE}======================================================${NC}"
echo -e "${YELLOW}Available commands:${NC}"
echo -e ""
echo -e "${BLUE}MCP Server Deployment:${NC}"
echo -e "  ${GREEN}make mcp-setup${NC}     - Re-run MCP server setup"
echo -e "  ${GREEN}make mcp-deploy${NC}    - Manually trigger MCP server deployment"
echo -e "  ${GREEN}make mcp-watch${NC}     - Start file watcher for auto-deployment"
echo -e "  ${GREEN}make mcp-status${NC}    - Check MCP server status"
echo -e ""
echo -e "${BLUE}Project Charter Automation:${NC}"
echo -e "  ${GREEN}make charter-setup${NC}    - Re-run Project Charter setup"
echo -e "  ${GREEN}make charter-run${NC}      - Manually process Project Charter tasks"
echo -e "  ${GREEN}make charter-status${NC}   - Check Project Charter automation status"
echo -e "  ${GREEN}make charter-ai-start${NC} - Start AI Gateway for code generation"
echo -e "  ${GREEN}make charter-ai-stop${NC}  - Stop AI Gateway"
echo -e ""
echo -e "${YELLOW}To edit project tasks, simply modify:${NC}"
echo -e "  ${GREEN}docs/PROJECT_CHARTER.md${NC}"
echo -e ""
echo -e "${YELLOW}The system will automatically:${NC}"
echo -e "1. Monitor your MCP server code and documentation for changes"
echo -e "2. Check the Project Charter twice daily for new tasks"
echo -e "3. Generate code for new tasks based on the charter"
echo -e "4. Deploy changes to Cloudflare Workers"
echo -e ""
echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN}     No manual code changes required!                ${NC}"
echo -e "${BLUE}======================================================${NC}"
