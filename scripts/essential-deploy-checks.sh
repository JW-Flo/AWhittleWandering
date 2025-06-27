#!/bin/bash

# Essential Deployment Validation Script
# This script performs only the minimum essential checks needed before deployment

# Terminal colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}  Essential Deployment Validation      ${NC}"
echo -e "${BLUE}=======================================${NC}"

# Check for required environment variables
required_vars=("CF_API_TOKEN" "CF_ACCOUNT_ID" "VITE_MAPBOX_TOKEN")
missing_vars=()

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    missing_vars+=("$var")
  fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
  echo -e "${RED}Error: Missing required environment variables: ${missing_vars[*]}${NC}"
  echo "Please set these variables before continuing."
  exit 1
fi

echo -e "${GREEN}✓ All required environment variables are set${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo -e "${RED}Error: Node.js is not installed${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Node.js is installed: $(node --version)${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
  echo -e "${RED}Error: npm is not installed${NC}"
  exit 1
fi

echo -e "${GREEN}✓ npm is installed: $(npm --version)${NC}"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
  echo -e "${YELLOW}Warning: wrangler is not installed. It will be installed during deployment.${NC}"
else
  echo -e "${GREEN}✓ wrangler is installed: $(wrangler --version)${NC}"
fi

# Validate edge worker wrangler.toml exists if deploying edge worker
if [[ "$DEPLOY_COMPONENTS" == "all" || "$DEPLOY_COMPONENTS" == "edge-worker" ]]; then
  if [ ! -f "edge-worker/wrangler.toml" ]; then
    echo -e "${RED}Error: edge-worker/wrangler.toml not found${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ Edge worker configuration is valid${NC}"
fi

# Validate public site package.json exists if deploying public site
if [[ "$DEPLOY_COMPONENTS" == "all" || "$DEPLOY_COMPONENTS" == "public-site" ]]; then
  if [ ! -f "48Continental_Starter/public-site/package.json" ]; then
    echo -e "${RED}Error: public site package.json not found${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ Public site configuration is valid${NC}"
  
  # Validate Mapbox token if deploying public site
  if [ -z "$VITE_MAPBOX_TOKEN" ]; then
    echo -e "${RED}Error: VITE_MAPBOX_TOKEN is not set${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ Mapbox token is set${NC}"
fi

echo -e "${GREEN}All essential checks passed! Ready to deploy.${NC}"
exit 0
