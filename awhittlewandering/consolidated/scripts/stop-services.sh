#!/bin/bash

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(dirname "$0")"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_FILE="$PROJECT_ROOT/.48continental_processes"

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}   48 Continental Services Shutdown Script   ${NC}"
echo -e "${BLUE}=============================================${NC}"

# Check if PID file exists
if [ ! -f "$PID_FILE" ]; then
    echo -e "${YELLOW}PID file not found. Services may not be running.${NC}"
    echo -e "${YELLOW}If services are running, you may need to stop them manually.${NC}"
    exit 1
fi

# Load PIDs from file
source "$PID_FILE"

# Stop MCP Server
if [ -n "$MCP_PID" ]; then
    echo -e "${YELLOW}Stopping MCP Server (PID: $MCP_PID)...${NC}"
    if kill -0 $MCP_PID 2>/dev/null; then
        kill $MCP_PID
        echo -e "${GREEN}MCP Server stopped${NC}"
    else
        echo -e "${YELLOW}MCP Server process no longer exists${NC}"
    fi
fi

# Stop Edge Worker
if [ -n "$EDGE_PID" ]; then
    echo -e "${YELLOW}Stopping Edge Worker (PID: $EDGE_PID)...${NC}"
    if kill -0 $EDGE_PID 2>/dev/null; then
        kill $EDGE_PID
        echo -e "${GREEN}Edge Worker stopped${NC}"
    else
        echo -e "${YELLOW}Edge Worker process no longer exists${NC}"
    fi
fi

# Stop Public Website
if [ -n "$WEBSITE_PID" ]; then
    echo -e "${YELLOW}Stopping Public Website (PID: $WEBSITE_PID)...${NC}"
    if kill -0 $WEBSITE_PID 2>/dev/null; then
        kill $WEBSITE_PID
        echo -e "${GREEN}Public Website stopped${NC}"
    else
        echo -e "${YELLOW}Public Website process no longer exists${NC}"
    fi
fi

# Remove PID file
echo -e "${YELLOW}Removing PID file...${NC}"
rm -f "$PID_FILE"

# Check for any remaining processes
echo -e "${YELLOW}Checking for remaining processes...${NC}"
MCP_PROCESSES=$(ps -ef | grep -v grep | grep -E "mcp-server.*npm" | wc -l)
EDGE_PROCESSES=$(ps -ef | grep -v grep | grep -E "edge-worker.*npm" | wc -l)
WEBSITE_PROCESSES=$(ps -ef | grep -v grep | grep -E "public-site.*npm" | wc -l)

if [ $MCP_PROCESSES -gt 0 ] || [ $EDGE_PROCESSES -gt 0 ] || [ $WEBSITE_PROCESSES -gt 0 ]; then
    echo -e "${YELLOW}Some processes may still be running:${NC}"
    if [ $MCP_PROCESSES -gt 0 ]; then
        echo -e "${YELLOW}MCP Server processes: $MCP_PROCESSES${NC}"
        ps -ef | grep -v grep | grep -E "mcp-server.*npm"
    fi
    if [ $EDGE_PROCESSES -gt 0 ]; then
        echo -e "${YELLOW}Edge Worker processes: $EDGE_PROCESSES${NC}"
        ps -ef | grep -v grep | grep -E "edge-worker.*npm"
    fi
    if [ $WEBSITE_PROCESSES -gt 0 ]; then
        echo -e "${YELLOW}Public Website processes: $WEBSITE_PROCESSES${NC}"
        ps -ef | grep -v grep | grep -E "public-site.*npm"
    fi
    
    echo -e "${YELLOW}Do you want to force stop all remaining processes? (y/n)${NC}"
    read -r FORCE_STOP
    if [ "$FORCE_STOP" = "y" ] || [ "$FORCE_STOP" = "Y" ]; then
        echo -e "${YELLOW}Force stopping all remaining processes...${NC}"
        if [ $MCP_PROCESSES -gt 0 ]; then
            pkill -f "mcp-server.*npm"
        fi
        if [ $EDGE_PROCESSES -gt 0 ]; then
            pkill -f "edge-worker.*npm"
        fi
        if [ $WEBSITE_PROCESSES -gt 0 ]; then
            pkill -f "public-site.*npm"
        fi
        echo -e "${GREEN}All processes stopped${NC}"
    else
        echo -e "${YELLOW}Some processes may still be running${NC}"
    fi
else
    echo -e "${GREEN}All processes stopped successfully${NC}"
fi

echo -e "\n${BLUE}=============================================${NC}"
echo -e "${GREEN}   48 Continental Services Shutdown Complete ${NC}"
echo -e "${BLUE}=============================================${NC}"

echo -e "${YELLOW}To restart services:${NC}"
echo -e "Run ./scripts/start-services.sh"
