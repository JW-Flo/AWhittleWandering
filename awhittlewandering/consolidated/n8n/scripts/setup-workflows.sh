#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}Setting up n8n workflows and Copilot integration...${NC}"

# Check if n8n is running
check_n8n() {
    curl -s http://localhost:5678/healthz > /dev/null
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: n8n is not running. Please start n8n first.${NC}"
        exit 1
    fi
}

# Import environment variables
setup_env() {
    echo "Setting up environment..."
    if [ ! -f "$ROOT_DIR/env/workflows.env" ]; then
        echo "Creating workflows.env from example..."
        cp "$ROOT_DIR/env/workflows.env.example" "$ROOT_DIR/env/workflows.env"
        echo -e "${BLUE}Please update workflows.env with your configuration${NC}"
        exit 1
    fi
    source "$ROOT_DIR/env/workflows.env"
}

# Create workflow directories
create_directories() {
    echo "Creating workflow directories..."
    mkdir -p "$ROOT_DIR/data/workflows"
    mkdir -p "$ROOT_DIR/logs"
}

# Import workflows to n8n
import_workflows() {
    echo "Importing workflows..."
    
    for workflow in "$ROOT_DIR"/workflows/*.json; do
        filename=$(basename "$workflow")
        name="${filename%.*}"
        
        echo "Importing $name..."
        response=$(curl -s -X POST \
            -H "Authorization: Bearer $N8N_AUTH_TOKEN" \
            -H "Content-Type: application/json" \
            -d @"$workflow" \
            http://localhost:5678/rest/workflows)
        
        if [[ $response == *"id"* ]]; then
            echo -e "${GREEN}✓${NC} $name imported successfully"
        else
            echo -e "${RED}✗${NC} Failed to import $name"
            echo "Response: $response"
        fi
    done
}

# Configure Copilot agent connection
setup_copilot_connection() {
    echo "Setting up Copilot agent connection..."
    
    # Test connection to Copilot agent
    echo "Testing Copilot agent connection..."
    curl -s "$COPILOT_AGENT_URL/healthz" > /dev/null
    if [ $? -ne 0 ]; then
        echo -e "${RED}Warning: Could not connect to Copilot agent${NC}"
        echo "Please ensure Copilot agent is running at $COPILOT_AGENT_URL"
    else
        echo -e "${GREEN}✓${NC} Copilot agent connection successful"
    fi
}

# Setup monitoring
setup_monitoring() {
    echo "Setting up monitoring..."
    
    if [ "$ANALYTICS_ENABLED" = "true" ]; then
        # Create monitoring directory
        mkdir -p "$ROOT_DIR/monitoring"
        
        # Set up log rotation
        cat > "$ROOT_DIR/monitoring/logrotate.conf" << EOL
$ROOT_DIR/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 root root
}
EOL
        echo -e "${GREEN}✓${NC} Monitoring configured"
    fi
}

# Validate setup
validate_setup() {
    echo "Validating setup..."
    
    # Check required environment variables
    required_vars=(
        "GITHUB_TOKEN"
        "COPILOT_AGENT_SECRET"
        "N8N_AUTH_TOKEN"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo -e "${RED}Error: $var is not set${NC}"
            exit 1
        fi
    done
    
    echo -e "${GREEN}✓${NC} Environment validation complete"
}

# Run setup
main() {
    echo "Starting setup..."
    check_n8n
    setup_env
    create_directories
    import_workflows
    setup_copilot_connection
    setup_monitoring
    validate_setup
    
    echo -e "\n${GREEN}Setup completed successfully!${NC}"
    echo -e "\nNext steps:"
    echo "1. Verify workflows in n8n dashboard"
    echo "2. Test Copilot agent communication"
    echo "3. Check monitoring configuration"
    echo -e "\nAccess n8n dashboard at: http://localhost:5678"
}

# Run main function
main
