#!/bin/bash
set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(dirname "$0")"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MCP_DIR="$PROJECT_ROOT/mcp-server"

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}   48 Continental MCP Server Startup         ${NC}"
echo -e "${BLUE}=============================================${NC}"

# Check if MCP server directory exists
if [ ! -d "$MCP_DIR" ]; then
    echo -e "${RED}Error: MCP server directory not found at $MCP_DIR${NC}"
    exit 1
fi

cd "$MCP_DIR"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed. Please install Node.js and npm.${NC}"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    bun install
fi

# Check if .env exists, create from example if not
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}Please edit .env with your actual configuration values.${NC}"
    echo -e "${YELLOW}Press any key to open .env in your default editor, or Ctrl+C to exit${NC}"
    read -n 1 -s
    if command -v open &> /dev/null; then
        open .env
    elif command -v xdg-open &> /dev/null; then
        xdg-open .env
    else
        echo -e "${YELLOW}Could not open .env automatically. Please edit it manually at:${NC}"
        echo -e "$MCP_DIR/.env"
    fi
    echo -e "${YELLOW}After editing .env, run this script again to start the MCP server.${NC}"
    exit 0
fi

# Create necessary directories
echo -e "${YELLOW}Creating necessary directories...${NC}"
mkdir -p data logs

# Ensure right permissions
chmod -R 755 data logs

# Start the MCP server
echo -e "${GREEN}Starting MCP server...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"

# Check if PM2 is installed for production mode
if command -v pm2 &> /dev/null && [ "$1" == "--production" ]; then
    echo -e "${YELLOW}Starting server in production mode with PM2...${NC}"
    pm2 start src/server.js --name "48continental-mcp" --log-date-format "YYYY-MM-DD HH:mm:ss" --time
    echo -e "${GREEN}MCP Server started in production mode${NC}"
    echo -e "${YELLOW}View logs with: pm2 logs 48continental-mcp${NC}"
    echo -e "${YELLOW}Stop server with: pm2 stop 48continental-mcp${NC}"
else
    # Start in development mode
    echo -e "${YELLOW}Starting server in development mode...${NC}"
    npm start
fi
