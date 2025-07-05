#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}Initializing n8n environment...${NC}"

# Check if .env file exists
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "Creating .env file from example..."
    cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
    echo -e "${RED}Please update .env file with your configuration${NC}"
    exit 1
fi

# Source environment variables
source "$SCRIPT_DIR/.env"

# Create necessary directories
mkdir -p "$SCRIPT_DIR/data/workflows"
mkdir -p "$SCRIPT_DIR/logs"
mkdir -p "$SCRIPT_DIR/backups"
mkdir -p "$SCRIPT_DIR/monitoring"

# Generate secure credentials if needed
if [ ! -f "$SCRIPT_DIR/credentials.json" ]; then
    echo "Generating secure credentials..."
    ./scripts/generate-credentials.sh
fi

# Set up workflows
echo "Setting up workflows..."
if ! ./scripts/setup-workflows.sh; then
    echo -e "${RED}Failed to set up workflows${NC}"
    exit 1
fi

# Register workflows
echo "Registering workflows..."
if ! ./scripts/register-workflows.sh; then
    echo -e "${RED}Failed to register workflows${NC}"
    exit 1
fi

# Start n8n
echo "Starting n8n..."
if ! docker-compose up -d; then
    echo -e "${RED}Failed to start n8n${NC}"
    exit 1
fi

# Wait for n8n to be ready
echo "Waiting for n8n to be ready..."
until curl -s http://localhost:5678/healthz > /dev/null; do
    sleep 1
done

# Run integration tests
echo "Running integration tests..."
if ! ./scripts/test-integration.sh quick-check; then
    echo -e "${YELLOW}Warning: Some integration tests failed${NC}"
fi

# Set up monitoring
echo "Setting up monitoring..."
if [ "$ANALYTICS_ENABLED" = "true" ]; then
    if ! ./scripts/maintenance.sh setup-monitoring; then
        echo -e "${YELLOW}Warning: Failed to set up monitoring${NC}"
    fi
fi

# Create initial MCP connection
echo "Connecting to MCP server..."
if curl -s "$MCP_SERVER_URL/health" > /dev/null; then
    echo -e "${GREEN}✓${NC} MCP server connection established"
else
    echo -e "${RED}✗${NC} Failed to connect to MCP server"
fi

# Initialize agent connections
echo "Initializing agent connections..."
agents=("copilot" "cline" "blackbox" "cloudflare")
for agent in "${agents[@]}"; do
    agent_url="${agent^^}_AGENT_URL"
    if curl -s "${!agent_url}/health" > /dev/null; then
        echo -e "${GREEN}✓${NC} Connected to $agent agent"
    else
        echo -e "${RED}✗${NC} Failed to connect to $agent agent"
    fi
done

echo -e "\n${BLUE}Initialization Summary${NC}"
echo "------------------------"
echo "Data Directory: $SCRIPT_DIR/data"
echo "Logs Directory: $SCRIPT_DIR/logs"
echo "Backups Directory: $SCRIPT_DIR/backups"
echo "n8n URL: http://localhost:5678"
echo "------------------------"

echo -e "\n${GREEN}Initialization complete!${NC}"
echo "You can now access n8n at http://localhost:5678"
echo "Use 'make help' to see available commands"
