#!/bin/bash
set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Starting deployment...${NC}"

# Deploy Edge Worker
echo -e "\n${YELLOW}Deploying Edge Worker...${NC}"
cd "$(dirname "$0")/../edge-worker"
npm run deploy
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Edge Worker deployment successful${NC}"
else
    echo -e "${RED}Edge Worker deployment failed${NC}"
    exit 1
fi

# Archive iOS App
echo -e "\n${YELLOW}Archiving iOS App...${NC}"
cd ../ios-client
xcodebuild archive -scheme "48 Continental" -archivePath "48Continental.xcarchive"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}iOS App archive successful${NC}"
else
    echo -e "${RED}iOS App archive failed${NC}"
    exit 1
fi

# Deploy Documentation
echo -e "\n${YELLOW}Deploying documentation...${NC}"
cd ../docs
npm run deploy
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Documentation deployment successful${NC}"
else
    echo -e "${RED}Documentation deployment failed${NC}"
    exit 1
fi

echo -e "\n${GREEN}All deployments completed successfully${NC}"
