#!/bin/bash
# Map Data Setup Script for 48 Continental USA Project
#
# This script orchestrates the process of validating, fixing, and copying map data
# to the correct locations for use in the 48 Continental USA map application.

# ANSI color codes
RESET="\033[0m"
RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"
BLUE="\033[34m"
MAGENTA="\033[35m"
CYAN="\033[36m"

# Directory setup
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PUBLIC_SITE="$PROJECT_ROOT/48Continental_Starter/public-site"
DATA_DIR="$PUBLIC_SITE/public/data"
SRC_DATA_DIR="$PUBLIC_SITE/src/data"

echo -e "${BLUE}=========================================${RESET}"
echo -e "${BLUE}  48 Continental USA Map Data Setup Tool ${RESET}"
echo -e "${BLUE}=========================================${RESET}"
echo -e "${CYAN}Project root:${RESET} $PROJECT_ROOT"

# Ensure all necessary directories exist
echo -e "\n${BLUE}Ensuring data directories exist...${RESET}"
mkdir -p "$DATA_DIR"
mkdir -p "$SRC_DATA_DIR"
echo -e "${GREEN}✓ Directories created${RESET}"

# Check if we need to run the coordinate fixing process
if [ ! -f "$PROJECT_ROOT/itinerary-fixed.json" ] || [ ! -f "$PROJECT_ROOT/itinerary-geo.json" ]; then
    echo -e "\n${YELLOW}Map data files not found or incomplete.${RESET}"
    echo -e "${BLUE}Running coordinate validation and fixing process...${RESET}"
    
    # Run the coordinate validation and fixing script
    node "$SCRIPT_DIR/validate-and-fix-coordinates.cjs"
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Coordinate validation script failed.${RESET}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Coordinate validation and fixing complete${RESET}"
else
    echo -e "\n${GREEN}✓ Fixed map data files already exist${RESET}"
fi

# Validate and copy the GeoJSON data to the correct locations
echo -e "\n${BLUE}Validating and copying GeoJSON data...${RESET}"
node "$SCRIPT_DIR/validate-and-copy-geojson.cjs"
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: GeoJSON validation and copying failed.${RESET}"
    exit 1
fi

# Check if we need to verify the MapBox token
if [ -f "$PUBLIC_SITE/verify-mapbox-token.cjs" ]; then
    echo -e "\n${BLUE}Verifying MapBox token...${RESET}"
    node "$PUBLIC_SITE/verify-mapbox-token.cjs"
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}Warning: MapBox token verification failed or not configured.${RESET}"
        echo -e "${YELLOW}You may need to set up a valid MapBox token in .env file.${RESET}"
    else
        echo -e "${GREEN}✓ MapBox token verified${RESET}"
    fi
fi

echo -e "\n${GREEN}=======================================${RESET}"
echo -e "${GREEN}  Map Data Setup Complete!             ${RESET}"
echo -e "${GREEN}=======================================${RESET}"
echo -e "${CYAN}Map data has been prepared and copied to:${RESET}"
echo -e "  - ${CYAN}$DATA_DIR/itinerary-geo.json${RESET}"
echo -e "  - ${CYAN}$SRC_DATA_DIR/trip-data.json${RESET}"
echo -e "\n${YELLOW}Next steps:${RESET}"
echo -e "  1. Check that your ${CYAN}.env${RESET} file contains a valid MapBox token"
echo -e "  2. Start the development server with ${CYAN}npm run dev${RESET}"
echo -e "  3. Open the map page to verify it's working correctly"
