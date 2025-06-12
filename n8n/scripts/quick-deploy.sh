#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Check if port 5679 is available
if lsof -i:5679 > /dev/null; then
    echo -e "${RED}Error: Port 5679 is already in use${NC}"
    echo "Please stop any running n8n instances first"
    exit 1
fi

echo -e "${BLUE}Starting rapid deployment...${NC}"

# Assign tasks to Copilot
echo -e "${BLUE}Assigning tasks to Copilot...${NC}"
"$(dirname "$0")/assign-copilot-tasks.sh" &

# Start n8n server and monitoring
echo -e "${BLUE}Starting n8n services...${NC}"
cd "$(dirname "$0")/.." && docker-compose up -d

# Wait for n8n to be ready
echo -e "${BLUE}Waiting for n8n to be ready...${NC}"
until curl -s http://localhost:5679/healthz > /dev/null; do
    sleep 2
done

# Register all workflows
echo -e "${BLUE}Registering workflows...${NC}"
"$(dirname "$0")/register-workflows.sh"

# Apply security configurations
echo -e "${BLUE}Applying security configurations...${NC}"
"$(dirname "$0")/validate-security.sh"

# Trigger all tasks
echo -e "${BLUE}Triggering tasks...${NC}"
curl -X POST http://localhost:5679/webhook/copilot/start \
  -H "Content-Type: application/json" \
  -d '{
    "action": "start",
    "parallel": true,
    "priority": "high"
  }'

echo -e "\n${GREEN}Deployment initiated!${NC}"
echo -e "Monitor progress with: make agent-status"
echo -e "View logs with: docker-compose logs -f n8n"
