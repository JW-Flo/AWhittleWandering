#!/bin/bash
#
# 48 Continental USA - Deployment Fixes Script
#
# This script deploys the fixes for map data loading and slide-out panel issues

set -e  # Exit on error

# ANSI colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}          48 CONTINENTAL USA DEPLOYMENT FIXES              ${NC}"
echo -e "${BLUE}============================================================${NC}"
echo -e "Run time: $(date)"
echo -e "${BLUE}============================================================${NC}\n"

# Check if we're in the right directory
if [ ! -d "edge-worker" ] || [ ! -d "48Continental_Starter" ]; then
  echo -e "${RED}Error: This script must be run from the project root directory.${NC}"
  exit 1
fi

# Step 1: Deploy Edge Worker with Fixed Configuration
echo -e "\n${BLUE}STEP 1: Deploying Edge Worker with Fixed Configuration${NC}"
cd edge-worker

echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

echo -e "${YELLOW}Deploying edge worker...${NC}"
npx wrangler deploy
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Edge worker deployed successfully${NC}"
else
  echo -e "${RED}✗ Edge worker deployment failed${NC}"
  exit 1
fi

cd ..

# Step 2: Deploy Public Site with Fixed Components
echo -e "\n${BLUE}STEP 2: Deploying Public Site with Fixed Components${NC}"
cd 48Continental_Starter/public-site

echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

echo -e "${YELLOW}Building public site...${NC}"
npm run build

echo -e "${YELLOW}Deploying public site...${NC}"
npx wrangler pages deploy build
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Public site deployed successfully${NC}"
else
  echo -e "${RED}✗ Public site deployment failed${NC}"
  exit 1
fi

cd ../..

# Step 3: Test the Deployment
echo -e "\n${BLUE}STEP 3: Testing the Deployment${NC}"

echo -e "${YELLOW}Testing API endpoints...${NC}"
edge_worker_url="https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev"

echo -e "Testing endpoint: $edge_worker_url/test"
test_status=$(curl -s -o /dev/null -w "%{http_code}" "$edge_worker_url/test")
if [ "$test_status" -eq 200 ]; then
  echo -e "${GREEN}✓ /test endpoint is working ($test_status)${NC}"
else
  echo -e "${RED}✗ /test endpoint is not working ($test_status)${NC}"
fi

echo -e "Testing endpoint: $edge_worker_url/api/v1/status"
status_api_status=$(curl -s -o /dev/null -w "%{http_code}" "$edge_worker_url/api/v1/status")
if [ "$status_api_status" -eq 200 ]; then
  echo -e "${GREEN}✓ /api/v1/status endpoint is working ($status_api_status)${NC}"
else
  echo -e "${RED}✗ /api/v1/status endpoint is not working ($status_api_status)${NC}"
fi

echo -e "${YELLOW}Testing public site...${NC}"
public_site_url="https://main.continentalusa-site.pages.dev"
public_site_status=$(curl -s -o /dev/null -w "%{http_code}" "$public_site_url")
if [ "$public_site_status" -eq 200 ]; then
  echo -e "${GREEN}✓ Public site is accessible ($public_site_status)${NC}"
else
  echo -e "${RED}✗ Public site is not accessible ($public_site_status)${NC}"
fi

# Final Status
echo -e "\n${BLUE}============================================================${NC}"
echo -e "${GREEN}                 DEPLOYMENT FIXES COMPLETE                ${NC}"
echo -e "${BLUE}============================================================${NC}"

echo -e "${YELLOW}Your system is deployed with the workers.dev domain:${NC}"
echo -e "${GREEN}  API: $edge_worker_url${NC}"
echo -e "${GREEN}  Public Site: $public_site_url${NC}"

echo -e "\n${YELLOW}If you still encounter issues, please check:${NC}"
echo -e "  ${GREEN}1. The console logs in your browser${NC}"
echo -e "  ${GREEN}2. Network requests in the browser developer tools${NC}"
echo -e "  ${GREEN}3. The worker logs in the Cloudflare dashboard${NC}"

echo -e "\n${BLUE}============================================================${NC}"
