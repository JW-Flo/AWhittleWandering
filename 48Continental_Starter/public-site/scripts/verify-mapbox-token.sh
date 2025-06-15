#!/bin/bash
# Script to verify that the Mapbox token is correctly included in production builds
# This helps validate our fix for the token initialization issue

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Mapbox Token Build Verification Tool${NC}"
echo "Checking if Mapbox token is correctly included in production builds..."

# Check if dist directory exists
if [ ! -d "dist" ]; then
  echo -e "${RED}Error: dist directory not found! Run 'npm run build' first.${NC}"
  exit 1
fi

# Look for the token in the built files (using just the "pk.ey" prefix to be safe)
echo "Searching for token in built JavaScript files..."
TOKEN_MATCHES=$(grep -r "pk.ey" --include="*.js" dist)

if [ -z "$TOKEN_MATCHES" ]; then
  echo -e "${RED}❌ No token found in built JavaScript files!${NC}"
  echo "This suggests the build process is not correctly embedding the token."
  echo "Ensure VITE_MAPBOX_TOKEN is set in your environment variables during build."
else
  echo -e "${GREEN}✅ Token found in the following files:${NC}"
  echo "$TOKEN_MATCHES" | cut -d: -f1 | sort | uniq
  
  # Count how many times the token appears
  COUNT=$(echo "$TOKEN_MATCHES" | wc -l)
  echo -e "${GREEN}Found token in $COUNT locations${NC}"
fi

# Also check if Mapbox CSS is included
echo "Checking for Mapbox CSS..."
CSS_MATCHES=$(grep -r "mapbox-gl.css" --include="*.js" --include="*.css" dist)

if [ -z "$CSS_MATCHES" ]; then
  echo -e "${RED}❌ Mapbox CSS not found in built files!${NC}"
  echo "This could cause map rendering issues."
else
  echo -e "${GREEN}✅ Mapbox CSS found${NC}"
fi

echo -e "${YELLOW}Verification complete.${NC}"
echo "If token wasn't found, ensure you're setting VITE_MAPBOX_TOKEN in your environment."
echo "Example: VITE_MAPBOX_TOKEN=your_token npm run build"
