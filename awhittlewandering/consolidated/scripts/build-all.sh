#!/bin/bash
set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Starting full project build...${NC}"

# Build Edge Worker
echo -e "\n${YELLOW}Building Edge Worker...${NC}"
cd "$(dirname "$0")/../edge-worker"
bun install
bun run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Edge Worker build successful${NC}"
else
    echo -e "${RED}Edge Worker build failed${NC}"
    exit 1
fi

# Build iOS Client
echo -e "\n${YELLOW}Building iOS Client...${NC}"
cd ../ios-client
swift build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}iOS Client build successful${NC}"
else
    echo -e "${RED}iOS Client build failed${NC}"
    exit 1
fi

# Run Tests
echo -e "\n${YELLOW}Running tests...${NC}"
cd ../edge-worker
npm test
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Edge Worker tests passed${NC}"
else
    echo -e "${RED}Edge Worker tests failed${NC}"
    exit 1
fi

cd ../ios-client
swift test
if [ $? -eq 0 ]; then
    echo -e "${GREEN}iOS Client tests passed${NC}"
else
    echo -e "${RED}iOS Client tests failed${NC}"
    exit 1
fi

# Build Documentation
echo -e "\n${YELLOW}Generating documentation...${NC}"
cd ../docs
bun install
bun run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Documentation build successful${NC}"
else
    echo -e "${RED}Documentation build failed${NC}"
    exit 1
fi

echo -e "\n${GREEN}All builds completed successfully${NC}"
