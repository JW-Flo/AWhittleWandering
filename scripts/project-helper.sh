#!/bin/bash

# Project Structure Helper Script
# This script helps navigate the reorganized project structure

# Color codes for output
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[1;33m"
NC="\033[0m" # No Color

cat <<EOF | sed \
	-e "s|{BLUE}|${BLUE}|g" \
	-e "s|{YELLOW}|${YELLOW}|g" \
	-e "s|{GREEN}|${GREEN}|g" \
	-e "s|{NC}|${NC}|g"
{BLUE}========================================={NC}
{BLUE}    A Whittle Wandering Project Helper   {NC}
{BLUE}========================================={NC}

{YELLOW}Project Structure:{NC}
  {GREEN}•{NC} config/      - Configuration files
  {GREEN}•{NC} mcp/         - MCP server and related files
  {GREEN}•{NC} data/        - Data files including itineraries
  {GREEN}•{NC} docs/        - Documentation
  {GREEN}•{NC} scripts/     - Deployment and build scripts
  {GREEN}•{NC} utilities/   - Utility scripts
  {GREEN}•{NC} components/  - UI Components
  {GREEN}•{NC} tests/       - Test files

{YELLOW}Common Commands:{NC}
  {GREEN}•{NC} npm run start         - Start all services
  {GREEN}•{NC} npm run deploy        - Deploy everything
  {GREEN}•{NC} npm run build:edge    - Build edge worker
  {GREEN}•{NC} npm run build:site    - Build public site
  {GREEN}•{NC} npm run build:mobile  - Build mobile app

{YELLOW}Environment Files:{NC}
  {GREEN}•{NC} .env        - Main environment file
  {GREEN}•{NC} config/.env - Backup environment file

{BLUE}========================================={NC}
EOF
