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
PUBLIC_SITE_DIR="$PROJECT_ROOT/48Continental_Starter/public-site"
ENV_FILE="$PROJECT_ROOT/.env"

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}   48 Continental Public Site Deployment     ${NC}"
echo -e "${BLUE}=============================================${NC}"

# Check if public site directory exists
if [ ! -d "$PUBLIC_SITE_DIR" ]; then
    echo -e "${RED}Error: Public site directory not found at $PUBLIC_SITE_DIR${NC}"
    exit 1
fi

cd "$PUBLIC_SITE_DIR"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed. Please install Node.js and npm.${NC}"
    exit 1
fi

# Install dependencies if needed
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# Create necessary environment variables if not present
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cat > "$ENV_FILE" << EOL
# Tesla API credentials
TESLA_CLIENT_ID=your_tesla_client_id
TESLA_CLIENT_SECRET=your_tesla_client_secret
TESLA_REFRESH_TOKEN=your_tesla_refresh_token

# ABRP API key
ABRP_API_KEY=your_abrp_api_key

# Weather API key
WEATHER_API_KEY=your_weather_api_key

# MapBox token
MAPBOX_TOKEN=pk.eyJ1IjoidGhld2FuZGVyaW5nd2hpdHRsZSIsImEiOiJjbHQxaXhzejYwYmU2MmpxdHl0MHowN3UzIn0.Q7xKTRlXvtimBHd39JqN1A

# KV namespace for caching
CONTINENTALUSA_KV=your_kv_namespace_id
EOL
    echo -e "${YELLOW}Please edit .env with your actual API credentials.${NC}"
    echo -e "${YELLOW}Press any key to open .env in your default editor, or Ctrl+C to exit${NC}"
    read -n 1 -s
    if command -v open &> /dev/null; then
        open "$ENV_FILE"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "$ENV_FILE"
    else
        echo -e "${YELLOW}Could not open .env automatically. Please edit it manually at:${NC}"
        echo -e "$ENV_FILE"
    fi
    echo -e "${YELLOW}After editing .env, run this script again to deploy the site.${NC}"
    exit 0
fi

# Build the site
echo -e "${YELLOW}Building the public site...${NC}"
npm run build

# Start the MCP server in the background
echo -e "${YELLOW}Starting the MCP server...${NC}"
"$PROJECT_ROOT/scripts/start-mcp-server.sh" &
MCP_PID=$!

# Wait a bit for MCP server to start
sleep 3

# Deploy the function routes
echo -e "${YELLOW}Deploying functions...${NC}"
mkdir -p "$PUBLIC_SITE_DIR/functions"
cp "$PROJECT_ROOT/functions/route.js" "$PUBLIC_SITE_DIR/functions/"

# Start the local server
echo -e "${GREEN}Starting local development server...${NC}"
echo -e "${YELLOW}The website will be available at http://localhost:5173${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"

# Run the local server
npm run dev

# When user presses Ctrl+C, also stop the MCP server
trap 'kill $MCP_PID 2>/dev/null || true' EXIT
