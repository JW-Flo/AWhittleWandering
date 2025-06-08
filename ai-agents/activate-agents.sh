#!/bin/bash

# Agent Activation Script for A Whittle Wandering Project
# This script initializes the AI agent system and validates the environment

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
AI_AGENTS_DIR="$PROJECT_ROOT/ai-agents"

# Color codes for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}    A Whittle Wandering Agent System     ${NC}"
echo -e "${BLUE}=========================================${NC}"

# Check if required directories exist
echo -e "\n${BLUE}Checking agent configuration directories...${NC}"
required_dirs=("prompts" "configs" "workflows" "tools" "settings" "docs")
all_dirs_exist=true

for dir in "${required_dirs[@]}"; do
  if [ -d "$AI_AGENTS_DIR/$dir" ]; then
    echo -e "  ${GREEN}✓${NC} Found $dir directory"
  else
    echo -e "  ${RED}✗${NC} Missing $dir directory"
    all_dirs_exist=false
  fi
done

if [ "$all_dirs_exist" = false ]; then
  echo -e "\n${RED}Error: Some required directories are missing. Please ensure the ai-agents structure is correctly set up.${NC}"
  exit 1
fi

# Validate environment variables
echo -e "\n${BLUE}Checking required environment variables...${NC}"
env_file="$AI_AGENTS_DIR/settings/environment-config.json"

if [ ! -f "$env_file" ]; then
  echo -e "${RED}Error: Environment configuration file not found at $env_file${NC}"
  exit 1
fi

# Extract required environment variables from the JSON file
required_vars=$(grep -o '"[A-Z_]*": {' "$env_file" | sed 's/": {//g' | sed 's/"//g')

# Check if each required variable is set
missing_vars=false
for var in $required_vars; do
  if [ -z "${!var}" ] && grep -q "\"$var\".*\"required\": true" "$env_file"; then
    echo -e "  ${RED}✗${NC} Required environment variable $var is not set"
    missing_vars=true
  else
    echo -e "  ${GREEN}✓${NC} Environment variable $var is set"
  fi
done

if [ "$missing_vars" = true ]; then
  echo -e "\n${YELLOW}Warning: Some required environment variables are not set.${NC}"
  echo -e "Please set them before proceeding with agent tasks that require them."
fi

# Validate MCP configurations
echo -e "\n${BLUE}Validating MCP configurations...${NC}"
mcp_configs=$(find "$AI_AGENTS_DIR/configs" -name "*.json" | grep -v "vscode-extensions.json" | grep -v "agent-environment.json")

all_configs_valid=true
for config in $mcp_configs; do
  config_name=$(basename "$config")
  if jq . "$config" > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Valid JSON: $config_name"
  else
    echo -e "  ${RED}✗${NC} Invalid JSON: $config_name"
    all_configs_valid=false
  fi
done

if [ "$all_configs_valid" = false ]; then
  echo -e "\n${RED}Error: Some MCP configurations have invalid JSON format.${NC}"
  echo -e "Please fix the issues before proceeding."
  exit 1
fi

# Check for workflow configuration
echo -e "\n${BLUE}Checking workflow configuration...${NC}"
if [ -f "$AI_AGENTS_DIR/workflows/map-priority-workflow.json" ]; then
  echo -e "  ${GREEN}✓${NC} Map priority workflow configuration found"
else
  echo -e "  ${RED}✗${NC} Map priority workflow configuration not found"
  exit 1
fi

# Display available agent roles
echo -e "\n${BLUE}Available specialized agent roles:${NC}"
find "$AI_AGENTS_DIR/prompts" -name "*.md" | while read -r prompt_file; do
  agent_name=$(basename "$prompt_file" .md)
  agent_desc=$(head -n 3 "$prompt_file" | grep -A1 "# " | tail -n 1)
  echo -e "  ${GREEN}•${NC} $agent_name: $agent_desc"
done

# Instructions for using the agent system
echo -e "\n${BLUE}Instructions for using the agent system:${NC}"
echo -e "  1. Use the '@agent-name' syntax to address specific agents"
echo -e "  2. For complex tasks, start with the coordinator agent"
echo -e "  3. Refer to the documentation in ai-agents/docs/ for detailed instructions"

echo -e "\n${GREEN}Agent system initialization complete!${NC}"
echo -e "${BLUE}For detailed usage instructions, see: ${YELLOW}ai-agents/docs/using-ai-agents.md${NC}"
echo -e "${BLUE}=========================================${NC}\n"
