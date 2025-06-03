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

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}   48 Continental Services Startup Script    ${NC}"
echo -e "${BLUE}=============================================${NC}"

# Load environment variables from .env
if [ -f "$PROJECT_ROOT/.env" ]; then
    echo -e "${YELLOW}Loading environment variables from .env file...${NC}"
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
else
    echo -e "${RED}ERROR: .env file not found in project root${NC}"
    echo -e "${YELLOW}Please create an .env file with the necessary API keys:${NC}"
    echo -e "TESLA_CLIENT_ID=your-tesla-client-id"
    echo -e "TESLA_CLIENT_SECRET=your-tesla-client-secret"
    echo -e "TESLA_REFRESH_TOKEN=your-tesla-refresh-token"
    echo -e "WEATHER_API_KEY=your-weather-api-key"
    echo -e "ABRP_API_KEY=your-abrp-api-key"
    echo -e "MAPBOX_TOKEN=your-mapbox-token"
    echo -e "EDGE_HMAC_KEY=your-edge-hmac-key"
    exit 1
fi

# Verify critical environment variables
if [ -z "$EDGE_HMAC_KEY" ]; then
    echo -e "${RED}ERROR: EDGE_HMAC_KEY environment variable is not set${NC}"
    exit 1
fi

if [ -z "$TESLA_CLIENT_ID" ] || [ -z "$TESLA_CLIENT_SECRET" ] || [ -z "$TESLA_REFRESH_TOKEN" ]; then
    echo -e "${RED}ERROR: Tesla API credentials are missing${NC}"
    echo -e "${YELLOW}Please ensure TESLA_CLIENT_ID, TESLA_CLIENT_SECRET, and TESLA_REFRESH_TOKEN are set in .env${NC}"
    exit 1
fi

#------------------------------------------------------------
# 1. Start MCP Server
#------------------------------------------------------------
echo -e "\n${YELLOW}STEP 1: Starting MCP Server...${NC}"

if [ -d "$PROJECT_ROOT/mcp-server" ]; then
    cd "$PROJECT_ROOT/mcp-server"
    
    # Check if .env exists, create from example if not
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}Creating .env from .env.example...${NC}"
        cp .env.example .env
        echo "EDGE_HMAC_KEY=$EDGE_HMAC_KEY" >> .env
        echo "TESLA_CLIENT_ID=$TESLA_CLIENT_ID" >> .env
        echo "TESLA_CLIENT_SECRET=$TESLA_CLIENT_SECRET" >> .env
        echo "TESLA_REFRESH_TOKEN=$TESLA_REFRESH_TOKEN" >> .env
        echo "WEATHER_API_KEY=$WEATHER_API_KEY" >> .env
        echo "ABRP_API_KEY=$ABRP_API_KEY" >> .env
        echo "MAPBOX_TOKEN=$MAPBOX_TOKEN" >> .env
    fi
    
    # Check if node_modules exists, run npm install if not
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing MCP Server dependencies...${NC}"
        npm install
    fi
    
    # Start the MCP server in the background
    echo -e "${YELLOW}Starting MCP Server...${NC}"
    npm start &
    MCP_PID=$!
    echo -e "${GREEN}MCP Server started with PID: $MCP_PID${NC}"
    
    # Give the MCP server time to start
    echo -e "${YELLOW}Waiting for MCP Server to initialize...${NC}"
    sleep 5
else
    echo -e "${RED}MCP Server directory not found${NC}"
    exit 1
fi

#------------------------------------------------------------
# 2. Start Edge Worker locally
#------------------------------------------------------------
echo -e "\n${YELLOW}STEP 2: Starting Edge Worker locally...${NC}"

if [ -d "$PROJECT_ROOT/edge-worker" ]; then
    cd "$PROJECT_ROOT/edge-worker"
    
    # Check if node_modules exists, run npm install if not
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing Edge Worker dependencies...${NC}"
        npm install
    fi
    
    # Start the Edge Worker in development mode
    echo -e "${YELLOW}Starting Edge Worker in development mode...${NC}"
    # Run in background and save PID
    npm run dev &
    EDGE_PID=$!
    echo -e "${GREEN}Edge Worker started with PID: $EDGE_PID${NC}"
    
    # Give the Edge Worker time to start
    echo -e "${YELLOW}Waiting for Edge Worker to initialize...${NC}"
    sleep 5
else
    echo -e "${RED}Edge Worker directory not found${NC}"
    exit 1
fi

#------------------------------------------------------------
# 3. Start Public Website
#------------------------------------------------------------
echo -e "\n${YELLOW}STEP 3: Starting Public Website...${NC}"

if [ -d "$PROJECT_ROOT/48Continental_Starter/public-site" ]; then
    cd "$PROJECT_ROOT/48Continental_Starter/public-site"
    
    # Check if node_modules exists, run npm install if not
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing Public Website dependencies...${NC}"
        npm install
    fi
    
    # Start the website in development mode
    echo -e "${YELLOW}Starting Public Website in development mode...${NC}"
    # Run in background and save PID
    npm run dev &
    WEBSITE_PID=$!
    echo -e "${GREEN}Public Website started with PID: $WEBSITE_PID${NC}"
    
    # Open the website in the default browser
    echo -e "${YELLOW}Opening Public Website in browser...${NC}"
    sleep 5
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open http://localhost:3000
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        xdg-open http://localhost:3000
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        # Windows
        start http://localhost:3000
    else
        echo -e "${YELLOW}Please open http://localhost:3000 in your browser${NC}"
    fi
else
    echo -e "${RED}Public Website directory not found${NC}"
    exit 1
fi

#------------------------------------------------------------
# Save PIDs for cleanup
#------------------------------------------------------------
echo -e "\n${YELLOW}Saving process PIDs for cleanup...${NC}"
PID_FILE="$PROJECT_ROOT/.48continental_processes"
echo "MCP_PID=$MCP_PID" > "$PID_FILE"
echo "EDGE_PID=$EDGE_PID" >> "$PID_FILE"
echo "WEBSITE_PID=$WEBSITE_PID" >> "$PID_FILE"

echo -e "${GREEN}Process IDs saved to $PID_FILE${NC}"

#------------------------------------------------------------
# Display Success Message
#------------------------------------------------------------
echo -e "\n${BLUE}=============================================${NC}"
echo -e "${GREEN}   All 48 Continental services are running!   ${NC}"
echo -e "${BLUE}=============================================${NC}"

echo -e "${YELLOW}MCP Server:${NC} Running at http://localhost:4001"
echo -e "${YELLOW}Edge Worker:${NC} Running at http://localhost:8787"
echo -e "${YELLOW}Public Website:${NC} Running at http://localhost:3000"

echo -e "\n${YELLOW}To stop all services:${NC}"
echo -e "Run ./scripts/stop-services.sh"

echo -e "\n${YELLOW}To view logs:${NC}"
echo -e "For MCP Server: cd mcp-server && npm run logs"
echo -e "For Edge Worker: cd edge-worker && npm run logs"
echo -e "For Public Website: cd 48Continental_Starter/public-site && npm run logs"

echo -e "\n${YELLOW}Monitoring application state:${NC}"
echo -e "Real-time Tesla data will be fetched every 5 minutes"
echo -e "Weather data will be updated based on current vehicle location"
echo -e "Route planning will use ABRP and Mapbox APIs when available"

echo -e "\n${GREEN}Enjoy your 48 Continental journey!${NC}"
