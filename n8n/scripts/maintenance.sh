#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

source "$ROOT_DIR/env/workflows.env"

# Function to show status
show_status() {
    echo -e "${BLUE}=== n8n Integration Status ===${NC}"
    
    # Check n8n
    if curl -s "http://localhost:5678/healthz" > /dev/null; then
        echo -e "${GREEN}✓${NC} n8n: Running"
        echo "  Workflows: $(curl -s -H "Authorization: Bearer $N8N_AUTH_TOKEN" http://localhost:5678/rest/workflows | jq length)"
    else
        echo -e "${RED}✗${NC} n8n: Not Running"
    fi
    
    # Check Copilot Agent
    if curl -s "$COPILOT_AGENT_URL/healthz" > /dev/null; then
        echo -e "${GREEN}✓${NC} Copilot Agent: Running"
    else
        echo -e "${RED}✗${NC} Copilot Agent: Not Running"
    fi
    
    # Check Disk Space
    echo -e "\n${BLUE}=== Disk Usage ===${NC}"
    df -h "$ROOT_DIR" | tail -n 1
    
    # Check Log Sizes
    echo -e "\n${BLUE}=== Log Sizes ===${NC}"
    du -sh "$ROOT_DIR"/logs/* 2>/dev/null || echo "No logs found"
}

# Function to clean logs
clean_logs() {
    echo -e "${BLUE}Cleaning logs...${NC}"
    
    # Archive old logs
    archive_date=$(date +%Y%m%d)
    mkdir -p "$ROOT_DIR/logs/archive"
    
    find "$ROOT_DIR/logs" -name "*.log" -mtime +7 -exec gzip -c {} \; | \
        cat > "$ROOT_DIR/logs/archive/logs_${archive_date}.tar.gz"
    
    # Remove old logs
    find "$ROOT_DIR/logs" -name "*.log" -mtime +7 -delete
    
    echo -e "${GREEN}Logs cleaned and archived${NC}"
}

# Function to repair workflows
repair_workflows() {
    echo -e "${BLUE}Repairing workflows...${NC}"
    
    # Export current workflows
    mkdir -p "$ROOT_DIR/backups/workflows"
    curl -s -H "Authorization: Bearer $N8N_AUTH_TOKEN" \
        http://localhost:5678/rest/workflows > "$ROOT_DIR/backups/workflows/backup_$(date +%Y%m%d).json"
    
    # Reimport all workflows
    for workflow in "$ROOT_DIR"/workflows/*.json; do
        name=$(basename "$workflow" .json)
        echo "Repairing $name..."
        curl -s -X POST \
            -H "Authorization: Bearer $N8N_AUTH_TOKEN" \
            -H "Content-Type: application/json" \
            -d @"$workflow" \
            http://localhost:5678/rest/workflows > /dev/null
    done
    
    echo -e "${GREEN}Workflows repaired${NC}"
}

# Function to check connectivity
check_connectivity() {
    echo -e "${BLUE}Checking connectivity...${NC}"
    
    # Test n8n API
    echo -n "n8n API: "
    curl -s "http://localhost:5678/healthz" > /dev/null && \
        echo -e "${GREEN}OK${NC}" || echo -e "${RED}Failed${NC}"
    
    # Test Copilot Agent
    echo -n "Copilot Agent: "
    curl -s "$COPILOT_AGENT_URL/healthz" > /dev/null && \
        echo -e "${GREEN}OK${NC}" || echo -e "${RED}Failed${NC}"
    
    # Test WebSocket
    echo -n "WebSocket: "
    if command -v wscat &> /dev/null; then
        echo '{"type":"ping"}' | wscat -c "$COPILOT_AGENT_URL/ws" --connect-timeout 5 > /dev/null 2>&1 && \
            echo -e "${GREEN}OK${NC}" || echo -e "${RED}Failed${NC}"
    else
        echo -e "${YELLOW}wscat not installed${NC}"
    fi
    
    # Test GitHub API
    echo -n "GitHub API: "
    curl -s -H "Authorization: token $GITHUB_TOKEN" \
        "https://api.github.com/rate_limit" > /dev/null && \
        echo -e "${GREEN}OK${NC}" || echo -e "${RED}Failed${NC}"
}

# Function to display logs
show_logs() {
    echo -e "${BLUE}Recent Logs${NC}"
    
    # Show last 50 lines of each log file
    for log in "$ROOT_DIR"/logs/*.log; do
        if [ -f "$log" ]; then
            echo -e "\n${YELLOW}=== $(basename "$log") ===${NC}"
            tail -n 50 "$log"
        fi
    done
}

# Main menu
while true; do
    echo -e "\n${BLUE}n8n Integration Maintenance${NC}"
    echo "1. Show Status"
    echo "2. Clean Logs"
    echo "3. Repair Workflows"
    echo "4. Check Connectivity"
    echo "5. Show Logs"
    echo "q. Quit"
    
    read -p "Select an option: " choice
    
    case $choice in
        1) show_status ;;
        2) clean_logs ;;
        3) repair_workflows ;;
        4) check_connectivity ;;
        5) show_logs ;;
        q) exit 0 ;;
        *) echo -e "${RED}Invalid option${NC}" ;;
    esac
    
    echo -e "\nPress Enter to continue..."
    read
done
