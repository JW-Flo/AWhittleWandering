#!/bin/bash
# Fully automated setup script for MCP Server deployment workflow

# Set error handling
set -e

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}     Automated MCP Server Workflow Setup Tool          ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Get the base directory (repository root)
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$REPO_ROOT"

# Auto-detect GitHub repository information
echo -e "${YELLOW}Auto-detecting GitHub repository information...${NC}"
REMOTE_URL=$(git config --get remote.origin.url 2>/dev/null || echo "")

if [[ $REMOTE_URL == *"github.com"* ]]; then
  # Extract owner and repo from GitHub URL
  if [[ $REMOTE_URL == *"github.com:"* ]]; then
    # SSH format
    GITHUB_INFO=${REMOTE_URL#*github.com:}
  else
    # HTTPS format
    GITHUB_INFO=${REMOTE_URL#*github.com/}
  fi
  
  GITHUB_INFO=${GITHUB_INFO%.git}
  GITHUB_OWNER=$(echo $GITHUB_INFO | cut -d'/' -f1)
  GITHUB_REPO=$(echo $GITHUB_INFO | cut -d'/' -f2)
  
  echo -e "${GREEN}Detected GitHub repository: $GITHUB_OWNER/$GITHUB_REPO${NC}"
else
  echo -e "${YELLOW}Could not auto-detect GitHub repository. Using defaults.${NC}"
  GITHUB_OWNER="your-github-username"
  GITHUB_REPO="ContinentalUSA"
fi

# Auto-detect paths
echo -e "${YELLOW}Auto-detecting project paths...${NC}"
MCP_SERVER_PATH="$REPO_ROOT/mcp-server"
MCP_SERVER_DOCS_PATH="$REPO_ROOT/docs/mcp-server-architecture"

if [ -d "$MCP_SERVER_PATH" ]; then
  echo -e "${GREEN}Found MCP server at: $MCP_SERVER_PATH${NC}"
else
  echo -e "${YELLOW}MCP server path not found at default location. Using placeholder.${NC}"
fi

if [ -d "$MCP_SERVER_DOCS_PATH" ]; then
  echo -e "${GREEN}Found MCP documentation at: $MCP_SERVER_DOCS_PATH${NC}"
else
  echo -e "${YELLOW}MCP documentation path not found at default location. Using placeholder.${NC}"
fi

# Detect n8n installation
echo -e "${YELLOW}Detecting n8n installation...${NC}"
N8N_PORT=$(grep "N8N_PORT" .env 2>/dev/null | cut -d'=' -f2 || echo "5678")
echo -e "${GREEN}Using n8n port: $N8N_PORT${NC}"

# Create n8n environment directory if it doesn't exist
mkdir -p n8n/env

# Auto-generate environment file with detected values
ENV_FILE="n8n/env/mcp-server-deployment.env"
ENV_EXAMPLE="n8n/env/mcp-server-deployment.env.example"

echo -e "${YELLOW}Creating customized environment file at $ENV_FILE...${NC}"

# Check if example file exists
if [ ! -f "$ENV_EXAMPLE" ]; then
  echo -e "${RED}Error: Environment example file not found at $ENV_EXAMPLE${NC}"
  exit 1
fi

# Create a customized environment file based on the example
cat "$ENV_EXAMPLE" | \
sed "s|your-github-username|$GITHUB_OWNER|g" | \
sed "s|ContinentalUSA|$GITHUB_REPO|g" | \
sed "s|/path/to/mcp-server|$MCP_SERVER_PATH|g" | \
sed "s|/path/to/docs/mcp-server-architecture|$MCP_SERVER_DOCS_PATH|g" > "$ENV_FILE"

echo -e "${GREEN}Created customized environment file with auto-detected values at $ENV_FILE${NC}"
echo -e "${YELLOW}NOTE: You will still need to fill in API tokens and other secure values manually.${NC}"

# Check if n8n is running
echo -e "${YELLOW}Checking if n8n is running...${NC}"
if curl -s "http://localhost:${N8N_PORT}/healthz" > /dev/null; then
  echo -e "${GREEN}n8n is running. Proceeding with workflow registration.${NC}"
  
  # Auto-register the workflow
  echo -e "${YELLOW}Registering MCP server deployment workflow with n8n...${NC}"
  
  if [ -f "n8n/scripts/setup-mcp-workflow.sh" ]; then
    chmod +x n8n/scripts/setup-mcp-workflow.sh
    n8n/scripts/setup-mcp-workflow.sh
  else
    echo -e "${RED}Error: Workflow setup script not found at n8n/scripts/setup-mcp-workflow.sh${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}n8n is not running. Skipping workflow registration.${NC}"
  echo -e "${YELLOW}You can register the workflow later by running:${NC}"
  echo -e "${BLUE}  n8n/scripts/setup-mcp-workflow.sh${NC}"
fi

# Setup file watcher to auto-trigger deployments
echo -e "${YELLOW}Setting up automatic deployment triggers...${NC}"

# Create the file watcher service directory
mkdir -p services/mcp-file-watcher

# Create file watcher service
cat > services/mcp-file-watcher/watch-mcp-changes.sh << 'EOF'
#!/bin/bash
# File watcher service to auto-trigger MCP server deployments when files change

# Configuration
WATCH_PATHS="${MCP_SERVER_DOCS_PATH} ${MCP_SERVER_PATH}"
N8N_WEBHOOK_URL="http://localhost:${N8N_PORT}/webhook/mcp-server/update"
DEBOUNCE_SECONDS=30

# Store the last modification time
LAST_MOD_TIME=0
LAST_TRIGGER_TIME=0

echo "Starting MCP file watcher service..."
echo "Watching paths: $WATCH_PATHS"
echo "Webhook URL: $N8N_WEBHOOK_URL"

while true; do
  # Get the latest modification time across all watched paths
  LATEST_MOD_TIME=0
  
  for path in $WATCH_PATHS; do
    if [ -d "$path" ]; then
      # Find the most recently modified file
      MOD_TIME=$(find "$path" -type f -not -path "*/node_modules/*" -not -path "*/\.*" -printf "%T@\n" 2>/dev/null | sort -nr | head -1)
      
      # Update the latest mod time if this is newer
      if (( $(echo "$MOD_TIME > $LATEST_MOD_TIME" | bc -l) )); then
        LATEST_MOD_TIME=$MOD_TIME
      fi
    fi
  done
  
  # If the modification time has changed and we haven't triggered recently
  CURRENT_TIME=$(date +%s)
  if (( $(echo "$LATEST_MOD_TIME > $LAST_MOD_TIME" | bc -l) )) && (( CURRENT_TIME - LAST_TRIGGER_TIME > DEBOUNCE_SECONDS )); then
    echo "Detected changes, triggering MCP server deployment..."
    
    # Determine what type of update this is
    UPDATE_TYPE="documentation"
    if [[ "$LATEST_MOD_PATHS" == *"mcp-server/src"* ]]; then
      UPDATE_TYPE="core"
    elif [[ "$LATEST_MOD_PATHS" == *"mcp-server/plugins"* ]]; then
      UPDATE_TYPE="plugins"
    elif [[ "$LATEST_MOD_PATHS" == *"mcp-server/auth"* ]]; then
      UPDATE_TYPE="authentication"
    fi
    
    # Trigger the webhook
    curl -s -X POST \
      -H "Content-Type: application/json" \
      -d "{\"title\":\"Automatic update from file changes\",\"type\":\"$UPDATE_TYPE\",\"description\":\"Auto-triggered deployment from file watcher service.\"}" \
      "$N8N_WEBHOOK_URL"
    
    LAST_TRIGGER_TIME=$CURRENT_TIME
    echo "Deployment triggered at $(date)"
  fi
  
  LAST_MOD_TIME=$LATEST_MOD_TIME
  sleep 10
done
EOF

chmod +x services/mcp-file-watcher/watch-mcp-changes.sh

# Create systemd service file template
cat > services/mcp-file-watcher/mcp-file-watcher.service << EOF
[Unit]
Description=MCP File Watcher Service
After=network.target

[Service]
ExecStart=/bin/bash $REPO_ROOT/services/mcp-file-watcher/watch-mcp-changes.sh
WorkingDirectory=$REPO_ROOT
Restart=always
User=$(whoami)
Environment=HOME=$HOME
Environment=N8N_PORT=$N8N_PORT
Environment=MCP_SERVER_PATH=$MCP_SERVER_PATH
Environment=MCP_SERVER_DOCS_PATH=$MCP_SERVER_DOCS_PATH

[Install]
WantedBy=multi-user.target
EOF

echo -e "${GREEN}Created file watcher service at services/mcp-file-watcher/watch-mcp-changes.sh${NC}"
echo -e "${YELLOW}To enable automatic deployments when files change:${NC}"
echo -e "${BLUE}  1. Start the file watcher: bash services/mcp-file-watcher/watch-mcp-changes.sh &${NC}"
echo -e "${BLUE}  2. For systemd installation (optional):${NC}"
echo -e "${BLUE}     sudo cp services/mcp-file-watcher/mcp-file-watcher.service /etc/systemd/system/${NC}"
echo -e "${BLUE}     sudo systemctl daemon-reload${NC}"
echo -e "${BLUE}     sudo systemctl enable --now mcp-file-watcher.service${NC}"

# Create GitHub workflow file for automatic deployment
mkdir -p .github/workflows

cat > .github/workflows/mcp-server-deployment.yml << EOF
name: MCP Server Deployment

on:
  push:
    branches: [main]
    paths:
      - 'docs/mcp-server-architecture/**'
      - 'mcp-server/**'
  workflow_dispatch:

jobs:
  trigger-deployment:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v2

      - name: Determine update type
        id: determine-type
        run: |
          # Get the list of changed files
          CHANGED_FILES=\$(git diff --name-only HEAD~1 HEAD)
          
          # Determine the update type based on changed files
          UPDATE_TYPE="documentation"
          
          if echo "\$CHANGED_FILES" | grep -q "mcp-server/src"; then
            UPDATE_TYPE="core"
          elif echo "\$CHANGED_FILES" | grep -q "mcp-server/plugins"; then
            UPDATE_TYPE="plugins"
          elif echo "\$CHANGED_FILES" | grep -q "mcp-server/auth"; then
            UPDATE_TYPE="authentication"
          fi
          
          echo "::set-output name=type::\$UPDATE_TYPE"
      
      - name: Trigger n8n webhook
        run: |
          curl -X POST \
            \${{ secrets.MCP_WEBHOOK_URL }} \
            -H "Content-Type: application/json" \
            -d "{\"title\":\"GitHub Auto-Deployment\",\"type\":\"\${{ steps.determine-type.outputs.type }}\",\"description\":\"Automatic deployment triggered by GitHub Actions from commit \${{ github.sha }}\"}"
EOF

echo -e "${GREEN}Created GitHub workflow file at .github/workflows/mcp-server-deployment.yml${NC}"
echo -e "${YELLOW}NOTE: For GitHub Actions to work, add the MCP_WEBHOOK_URL secret in your repository settings${NC}"

# Add Makefile target for easy management
if [ -f "Makefile" ]; then
  echo -e "${YELLOW}Adding MCP deployment targets to Makefile...${NC}"
  
  # Only add if not already present
  if ! grep -q "mcp-deploy" Makefile; then
    cat >> Makefile << 'EOF'

# MCP Server deployment targets
.PHONY: mcp-setup mcp-deploy mcp-watch mcp-status

mcp-setup:
	@echo "Setting up MCP server deployment workflow..."
	@bash n8n/scripts/auto-setup-mcp.sh

mcp-deploy:
	@echo "Manually triggering MCP server deployment..."
	@curl -X POST \
		http://localhost:$(N8N_PORT)/webhook/mcp-server/update \
		-H "Content-Type: application/json" \
		-d '{"title":"Manual Deployment","type":"documentation","description":"Manually triggered deployment via Makefile"}'

mcp-watch:
	@echo "Starting MCP file watcher service..."
	@bash services/mcp-file-watcher/watch-mcp-changes.sh

mcp-status:
	@echo "Checking MCP server deployment status..."
	@curl -s http://localhost:$(N8N_PORT)/webhook-test/mcp-server/status || echo "Status endpoint not available"
EOF
    echo -e "${GREEN}Added MCP deployment targets to Makefile${NC}"
  else
    echo -e "${YELLOW}MCP deployment targets already exist in Makefile${NC}"
  fi
else
  echo -e "${YELLOW}Creating new Makefile with MCP deployment targets...${NC}"
  
  cat > Makefile << 'EOF'
# MCP Server deployment Makefile

N8N_PORT ?= 5678

# MCP Server deployment targets
.PHONY: mcp-setup mcp-deploy mcp-watch mcp-status

mcp-setup:
	@echo "Setting up MCP server deployment workflow..."
	@bash n8n/scripts/auto-setup-mcp.sh

mcp-deploy:
	@echo "Manually triggering MCP server deployment..."
	@curl -X POST \
		http://localhost:$(N8N_PORT)/webhook/mcp-server/update \
		-H "Content-Type: application/json" \
		-d '{"title":"Manual Deployment","type":"documentation","description":"Manually triggered deployment via Makefile"}'

mcp-watch:
	@echo "Starting MCP file watcher service..."
	@bash services/mcp-file-watcher/watch-mcp-changes.sh

mcp-status:
	@echo "Checking MCP server deployment status..."
	@curl -s http://localhost:$(N8N_PORT)/webhook-test/mcp-server/status || echo "Status endpoint not available"
EOF
  echo -e "${GREEN}Created new Makefile with MCP deployment targets${NC}"
fi

# Add target to n8n workflow file
cat > n8n/workflows/mcp-server-status.json << EOF
{
  "name": "MCP Server Status",
  "nodes": [
    {
      "parameters": {
        "path": "mcp-server/status",
        "options": {
          "allowUnauthorizedCerts": true
        },
        "responseMode": "responseNode",
        "responseData": "json"
      },
      "name": "Status Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [
        250,
        300
      ]
    },
    {
      "parameters": {
        "functionCode": "// Get current MCP server status\nreturn [{\n  json: {\n    status: \"success\",\n    mcp_server: {\n      status: \"active\",\n      last_deployment: new Date().toISOString(),\n      version: \"1.0.0\",\n      documentation_url: \"${MCP_SERVER_DOCS_URL}\",\n      github_url: \"https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}\"\n    }\n  }\n}];"
      },
      "name": "Generate Status",
      "type": "n8n-nodes-base.function",
      "position": [
        450,
        300
      ]
    },
    {
      "parameters": {},
      "name": "Respond With Status",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [
        650,
        300
      ]
    }
  ],
  "connections": {
    "Status Webhook": {
      "main": [
        [
          {
            "node": "Generate Status",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Generate Status": {
      "main": [
        [
          {
            "node": "Respond With Status",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "saveManualRuns": true,
    "callerPolicy": "workflowsFromSameOwner"
  },
  "staticData": null,
  "pinData": {},
  "versionId": 1,
  "triggerCount": 1,
  "tags": ["mcp-server", "status"]
}
EOF

echo -e "${GREEN}Created MCP server status endpoint workflow${NC}"

# Final instructions
echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN}MCP Server deployment automation is now set up!${NC}"
echo -e "${BLUE}======================================================${NC}"
echo -e "${YELLOW}Available commands:${NC}"
echo -e "${BLUE}  make mcp-setup${NC}   - Run this setup process again"
echo -e "${BLUE}  make mcp-deploy${NC}  - Manually trigger a deployment"
echo -e "${BLUE}  make mcp-watch${NC}   - Start the file watcher for auto-deployments"
echo -e "${BLUE}  make mcp-status${NC}  - Check the current MCP server status"
echo -e ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Edit ${GREEN}$ENV_FILE${NC} to add your API keys and tokens"
echo -e "2. If n8n is not running, start it and run ${BLUE}n8n/scripts/setup-mcp-workflow.sh${NC}"
echo -e "3. For continuous auto-deployment, run ${BLUE}make mcp-watch${NC}"
echo -e ""
echo -e "${YELLOW}For GitHub integration:${NC}"
echo -e "Add the ${BLUE}MCP_WEBHOOK_URL${NC} secret to your GitHub repository settings"
echo -e "with the value: ${GREEN}http://your-n8n-server:$N8N_PORT/webhook/mcp-server/update${NC}"
echo -e "${BLUE}======================================================${NC}"
