#!/bin/bash

# Start Services Script for 48 Continental
# This script starts all necessary services for local development

set -e

echo "🚀 Starting 48 Continental Services..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if required environment variables are set
check_env() {
    if [ -z "$TESSIE_API_TOKEN" ]; then
        echo -e "${YELLOW}Warning: TESSIE_API_TOKEN not set in environment${NC}"
        echo "Please set it in edge-worker/.dev.vars or as an environment variable"
    fi
    
    if [ -z "$TESSIE_VIN" ]; then
        echo -e "${YELLOW}Warning: TESSIE_VIN not set in environment${NC}"
        echo "Please set it in edge-worker/.dev.vars or as an environment variable"
    fi
}

# Start Edge Worker
start_edge_worker() {
    echo -e "${GREEN}Starting Edge Worker...${NC}"
    cd edge-worker
    
    # Create .dev.vars if it doesn't exist
    if [ ! -f .dev.vars ]; then
        echo "Creating .dev.vars file..."
        cat > .dev.vars << EOF
# Tessie API Configuration
TESSIE_API_TOKEN=your_tessie_api_token_here
TESSIE_VIN=your_tesla_vin_here

# Other API Keys
WEATHER_API_KEY=your_openweather_api_key_here
MAPBOX_TOKEN=your_mapbox_token_here

# Edge Worker Configuration
EDGE_HMAC_KEY=your_hmac_key_here
EOF
        echo -e "${YELLOW}Please update edge-worker/.dev.vars with your API credentials${NC}"
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing Edge Worker dependencies..."
        npm install
    fi
    
    # Start the worker
    npm run dev &
    EDGE_WORKER_PID=$!
    echo "Edge Worker started with PID: $EDGE_WORKER_PID"
    
    cd ..
}

# Start Frontend
start_frontend() {
    echo -e "${GREEN}Starting Frontend...${NC}"
    cd 48Continental_Starter/public-site
    
    # Create .env.local if it doesn't exist
    if [ ! -f .env.local ]; then
        echo "Creating .env.local file..."
        cat > .env.local << EOF
# Tessie API Configuration
VITE_TESSIE_API_TOKEN=your_tessie_api_token_here
VITE_TESSIE_VIN=your_tesla_vin_here

# API Endpoints
VITE_API_BASE_URL=http://localhost:8787

# Map Configuration
VITE_MAPBOX_TOKEN=your_mapbox_token_here

# Feature Flags
VITE_ENABLE_STREAMING=true
VITE_USE_SIMULATED_DATA=false
EOF
        echo -e "${YELLOW}Please update 48Continental_Starter/public-site/.env.local with your API credentials${NC}"
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing Frontend dependencies..."
        npm install
    fi
    
    # Start the frontend
    npm run dev &
    FRONTEND_PID=$!
    echo "Frontend started with PID: $FRONTEND_PID"
    
    cd ../..
}

# Function to stop all services
stop_services() {
    echo -e "\n${YELLOW}Stopping all services...${NC}"
    
    if [ ! -z "$EDGE_WORKER_PID" ]; then
        kill $EDGE_WORKER_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    # Also kill any remaining node processes on the ports
    lsof -ti:8787 | xargs kill -9 2>/dev/null || true
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    
    echo -e "${GREEN}All services stopped${NC}"
}

# Trap to ensure cleanup on exit
trap stop_services EXIT

# Main execution
main() {
    check_env
    
    echo "Starting services..."
    start_edge_worker
    
    # Wait a bit for edge worker to start
    sleep 3
    
    start_frontend
    
    echo -e "\n${GREEN}All services started!${NC}"
    echo -e "Edge Worker: http://localhost:8787"
    echo -e "Frontend: http://localhost:5173"
    echo -e "\nPress Ctrl+C to stop all services"
    
    # Wait for user to stop
    wait
}

# Run main function
main
