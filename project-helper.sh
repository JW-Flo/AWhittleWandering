#!/bin/bash

# Project Structure Helper Script
# This script helps navigate the reorganized project structure

# Color codes for output
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[1;33m"
NC="\033[0m" # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}    A Whittle Wandering Project Helper   ${NC}"
echo -e "${BLUE}=========================================${NC}"

echo -e "\n${YELLOW}Project Structure:${NC}"
echo -e "  ${GREEN}•${NC} config/      - Configuration files"
echo -e "  ${GREEN}•${NC} mcp/         - MCP server and related files"
echo -e "  ${GREEN}•${NC} data/        - Data files including itineraries"
echo -e "  ${GREEN}•${NC} docs/        - Documentation"
echo -e "  ${GREEN}•${NC} scripts/     - Deployment and build scripts"
echo -e "  ${GREEN}•${NC} utilities/   - Utility scripts"
echo -e "  ${GREEN}•${NC} components/  - UI Components"
echo -e "  ${GREEN}•${NC} tests/       - Test files"

echo -e "\n${YELLOW}Common Commands:${NC}"
echo -e "  ${GREEN}•${NC} npm run start         - Start all services"
echo -e "  ${GREEN}•${NC} npm run deploy        - Deploy everything"
echo -e "  ${GREEN}•${NC} npm run build:edge    - Build edge worker"
echo -e "  ${GREEN}•${NC} npm run build:site    - Build public site"
echo -e "  ${GREEN}•${NC} npm run build:mobile  - Build mobile app"

echo -e "\n${YELLOW}Environment Files:${NC}"
echo -e "  ${GREEN}•${NC} .env        - Main environment file"
echo -e "  ${GREEN}•${NC} config/.env - Backup environment file"

echo -e "\n${BLUE}=========================================${NC}"
