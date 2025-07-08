#!/bin/bash
set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Starting mobile app deployment...${NC}"

# Build and deploy React Native app
cd "$(dirname "$0")/../ContinentalUSA-mobile"

# iOS Build
echo -e "\n${YELLOW}Building iOS app...${NC}"
bun run build:ios
if [ $? -eq 0 ]; then
    echo -e "${GREEN}iOS build successful${NC}"
else
    echo -e "${RED}iOS build failed${NC}"
    exit 1
fi

# Android Build
echo -e "\n${YELLOW}Building Android app...${NC}"
bun run build:android
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Android build successful${NC}"
else
    echo -e "${RED}Android build failed${NC}"
    exit 1
fi

echo -e "\n${GREEN}Mobile app builds completed successfully${NC}"
