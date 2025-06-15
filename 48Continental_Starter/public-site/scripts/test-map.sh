#!/bin/bash
# Map Testing Script
# This script helps with map initialization testing and debugging

set -e # Exit on error

# Terminal colors for nicer output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Project paths
PUBLIC_SITE_PATH="$(pwd)"
TEST_URL="http://localhost:5173/map-test"

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}   AWhittleWandering Map Testing Tool   ${NC}"
echo -e "${BLUE}=========================================${NC}"

# Check if MAPBOX_TOKEN is set
if [ -z "$MAPBOX_TOKEN" ]; then
  echo -e "${YELLOW}⚠️  Warning: MAPBOX_TOKEN is not set in your environment${NC}"
  # Check if it's in .env
  if [ -f .env ]; then
    echo -e "${GREEN}Found .env file, checking for token...${NC}"
    if grep -q "MAPBOX_TOKEN\|VITE_MAPBOX_TOKEN" .env; then
      echo -e "${GREEN}✅ Token found in .env file${NC}"
    else
      echo -e "${YELLOW}⚠️  No token found in .env file${NC}"
    fi
  else
    echo -e "${YELLOW}⚠️  No .env file found${NC}"
    echo -e "${YELLOW}Creating .env file with placeholder token...${NC}"
    echo "VITE_MAPBOX_TOKEN=pk.placeholder_token_for_testing" > .env
  fi
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Function to start dev server
start_dev_server() {
  echo -e "${GREEN}Starting development server...${NC}"
  npm run dev &
  SERVER_PID=$!
  
  # Wait for server to be ready
  echo -e "${YELLOW}Waiting for server to be ready...${NC}"
  while ! curl -s http://localhost:5173 >/dev/null; do
    sleep 1
  done
  echo -e "${GREEN}Server is ready!${NC}"
}

# Function to open browser
open_browser() {
  echo -e "${GREEN}Opening map test in browser...${NC}"
  if command_exists open; then
    open "$TEST_URL"
  elif command_exists xdg-open; then
    xdg-open "$TEST_URL"
  elif command_exists wslview; then
    wslview "$TEST_URL"
  else
    echo -e "${YELLOW}Unable to open browser automatically. Please open this URL manually:${NC}"
    echo -e "${BLUE}$TEST_URL${NC}"
  fi
}

# Function to run tests
run_tests() {
  echo -e "${GREEN}Running map tests...${NC}"
  npm test -- --testPathPattern=Map
}

# Main execution
echo -e "${GREEN}Verifying Mapbox token in configuration...${NC}"
node -e "
const fs = require('fs');
const path = require('path');
try {
  const configPath = path.resolve('./src/shared/mapbox/mapboxConfig.ts');
  const content = fs.readFileSync(configPath, 'utf8');
  console.log('✅ Found mapboxConfig.ts');
  console.log('Checking getMapboxToken implementation...');
  if (content.includes('getMapboxToken')) {
    console.log('✅ getMapboxToken function found');
  } else {
    console.log('❌ getMapboxToken function not found!');
  }
} catch (err) {
  console.error('❌ Error reading mapbox config:', err.message);
}
"

# Build check
echo -e "${GREEN}Running a quick build to verify no syntax errors...${NC}"
npm run build --quiet

# Start server and open browser
echo -e "${GREEN}Would you like to start the development server? (y/n)${NC}"
read -r START_SERVER
if [[ $START_SERVER == "y" ]]; then
  start_dev_server
  open_browser
  
  echo -e "${YELLOW}Press Ctrl+C to stop the server when you're done testing${NC}"
  wait $SERVER_PID
else
  echo -e "${BLUE}Skipping server start.${NC}"
  echo -e "${GREEN}You can manually start the server with:${NC} npm run dev"
fi

echo -e "${BLUE}=========================================${NC}"
echo -e "${GREEN}Map testing script completed!${NC}"
echo -e "${BLUE}=========================================${NC}"
