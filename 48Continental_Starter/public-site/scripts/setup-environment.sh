#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up development environment...${NC}"

# Check Node.js version
echo -e "\n${YELLOW}Checking Node.js version...${NC}"
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node -v)
    MAJOR_VERSION=${NODE_VERSION:1:2}
    if [[ $MAJOR_VERSION -lt 22 ]]; then
        echo -e "${RED}Node.js 22+ is required. Current version: $NODE_VERSION${NC}"
        if command -v nvm >/dev/null 2>&1; then
            echo -e "${YELLOW}Installing Node.js 22 using nvm...${NC}"
            nvm install 22
            nvm use 22
        else
            echo -e "${RED}Please install Node.js 22+ manually or install nvm${NC}"
            echo -e "${YELLOW}Download from: https://nodejs.org/en/download/${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}Node.js version $NODE_VERSION is compatible${NC}"
    fi
else
    echo -e "${RED}Node.js is not installed${NC}"
    echo -e "${YELLOW}Download from: https://nodejs.org/en/download/${NC}"
    exit 1
fi

# Check npm version
echo -e "\n${YELLOW}Checking npm version...${NC}"
NPM_VERSION=$(npm -v)
MAJOR_NPM_VERSION=${NPM_VERSION%%.*}
if [[ $MAJOR_NPM_VERSION -lt 10 ]]; then
    echo -e "${RED}npm 10+ is required. Current version: $NPM_VERSION${NC}"
    echo -e "${YELLOW}Updating npm...${NC}"
    npm install -g npm@latest
else
    echo -e "${GREEN}npm version $NPM_VERSION is compatible${NC}"
fi

# Check if Wrangler is installed
echo -e "\n${YELLOW}Checking Wrangler CLI...${NC}"
if command -v wrangler >/dev/null 2>&1; then
    WRANGLER_VERSION=$(wrangler --version)
    echo -e "${GREEN}Wrangler is installed: $WRANGLER_VERSION${NC}"
else
    echo -e "${YELLOW}Installing Wrangler CLI...${NC}"
    npm install -g wrangler@4.19.1
fi

# Install project dependencies
echo -e "\n${YELLOW}Installing project dependencies...${NC}"
npm install

# Check if .env file exists
echo -e "\n${YELLOW}Checking environment configuration...${NC}"
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}Creating .env file from .env.example...${NC}"
        cp .env.example .env
        echo -e "${YELLOW}Please update .env with your actual values${NC}"
    else
        echo -e "${YELLOW}No .env.example found. You may need to create a .env file manually${NC}"
    fi
else
    echo -e "${GREEN}.env file already exists${NC}"
fi

# Verify setup
echo -e "\n${YELLOW}Verifying setup...${NC}"
echo -e "Node.js: $(node -v)"
echo -e "npm: $(npm -v)"
echo -e "Wrangler: $(wrangler --version)"

echo -e "\n${GREEN}Setup complete! You can now run:${NC}"
echo -e "  ${YELLOW}npm run dev${NC}     - Start development server"
echo -e "  ${YELLOW}npm test${NC}       - Run tests"
echo -e "  ${YELLOW}npm run build${NC}  - Build for production"
echo -e "  ${YELLOW}npm run deploy${NC} - Deploy to Cloudflare"
