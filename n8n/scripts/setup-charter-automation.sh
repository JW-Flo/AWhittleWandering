#!/bin/bash
# Setup script for Project Charter Task Automation workflow in n8n

# Set error handling
set -e

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}     Project Charter Task Automation Setup            ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Load environment variables
if [ -f ".env" ]; then
  source .env
else
  echo -e "${YELLOW}Warning: .env file not found. Using default values.${NC}"
fi

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

# Detect n8n installation
echo -e "${YELLOW}Detecting n8n installation...${NC}"
N8N_PORT=$(grep "N8N_PORT" .env 2>/dev/null | cut -d'=' -f2 || echo "5678")
echo -e "${GREEN}Using n8n port: $N8N_PORT${NC}"

# Define constants
N8N_API_URL="http://localhost:${N8N_PORT:-5678}/api"
WORKFLOW_PATH="$(dirname "$0")/../workflows/project-charter-automation.json"
WORKFLOW_NAME="Project Charter Task Automation"
ENV_FILE_EXAMPLE="$(dirname "$0")/../env/project-charter-automation.env.example"
ENV_FILE="$(dirname "$0")/../env/project-charter-automation.env"

# Check if workflow file exists
if [ ! -f "$WORKFLOW_PATH" ]; then
  echo -e "${RED}Error: Workflow file not found at $WORKFLOW_PATH${NC}"
  exit 1
fi

# Check if environment file example exists
if [ ! -f "$ENV_FILE_EXAMPLE" ]; then
  echo -e "${RED}Error: Environment file example not found at $ENV_FILE_EXAMPLE${NC}"
  exit 1
fi

# Create environment file if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${YELLOW}Creating environment file from example...${NC}"
  
  # Create a customized environment file based on the example
  cat "$ENV_FILE_EXAMPLE" | \
  sed "s|/path/to/your/project|$REPO_ROOT|g" | \
  sed "s|your-github-username|$GITHUB_OWNER|g" | \
  sed "s|ContinentalUSA|$GITHUB_REPO|g" > "$ENV_FILE"
  
  echo -e "${GREEN}Created customized environment file at $ENV_FILE${NC}"
  echo -e "${YELLOW}Please edit $ENV_FILE to add your API keys and tokens.${NC}"
fi

# Verify Project Charter exists
PROJECT_CHARTER_PATH="$REPO_ROOT/docs/PROJECT_CHARTER.md"
if [ ! -f "$PROJECT_CHARTER_PATH" ]; then
  echo -e "${YELLOW}Project Charter not found at $PROJECT_CHARTER_PATH${NC}"
  echo -e "${YELLOW}Creating a default Project Charter...${NC}"
  
  # Create basic structure for Project Charter
  mkdir -p "$(dirname "$PROJECT_CHARTER_PATH")"
  cat > "$PROJECT_CHARTER_PATH" << EOF
# 48 Continental USA Project Charter

@PROJECT_CHARTER

This document serves as the project charter for the 48 Continental USA project, outlining the main goals, deliverables, and tasks.

## Project Overview

The 48 Continental project tracks a 60-day Tesla road trip through all 48 contiguous U.S. states.

## Development Tasks

- [ ] Example task 1 #documentation priority:medium @cline
- [ ] Example task 2 #infrastructure priority:high @devops

EOF
  
  echo -e "${GREEN}Created a basic Project Charter at $PROJECT_CHARTER_PATH${NC}"
  echo -e "${YELLOW}Please edit this file to define your actual project tasks.${NC}"
fi

# Check if n8n is running
echo -e "${YELLOW}Checking if n8n is running...${NC}"
if ! curl -s "http://localhost:${N8N_PORT:-5678}/healthz" > /dev/null; then
  echo -e "${RED}Error: n8n is not running. Please start n8n first.${NC}"
  echo -e "${YELLOW}You can run the setup later with:${NC}"
  echo -e "${BLUE}  $0${NC}"
  exit 1
fi

# Check if the workflow already exists
echo -e "${YELLOW}Checking if workflow already exists...${NC}"
EXISTING_WORKFLOW=$(curl -s -H "X-N8N-API-KEY: ${N8N_API_KEY}" "${N8N_API_URL}/workflows" | jq -r '.data[] | select(.name == "'"$WORKFLOW_NAME"'") | .id')

if [ -n "$EXISTING_WORKFLOW" ]; then
  echo -e "${YELLOW}Workflow already exists with ID $EXISTING_WORKFLOW. Updating...${NC}"
  RESPONSE=$(curl -s -X PUT \
    -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
    -H "Content-Type: application/json" \
    -d @"$WORKFLOW_PATH" \
    "${N8N_API_URL}/workflows/$EXISTING_WORKFLOW")
  
  WORKFLOW_ID=$(echo "$RESPONSE" | jq -r '.id')
  echo -e "${GREEN}Workflow updated with ID $WORKFLOW_ID${NC}"
else
  echo -e "${YELLOW}Creating new workflow...${NC}"
  RESPONSE=$(curl -s -X POST \
    -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
    -H "Content-Type: application/json" \
    -d @"$WORKFLOW_PATH" \
    "${N8N_API_URL}/workflows")
  
  WORKFLOW_ID=$(echo "$RESPONSE" | jq -r '.id')
  echo -e "${GREEN}Workflow created with ID $WORKFLOW_ID${NC}"
fi

# Activate the workflow
echo -e "${YELLOW}Activating workflow...${NC}"
curl -s -X PUT \
  -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"active": true}' \
  "${N8N_API_URL}/workflows/$WORKFLOW_ID"

echo -e "${GREEN}Workflow activated successfully!${NC}"

# Create an AI Gateway service directory if it doesn't exist
echo -e "${YELLOW}Setting up AI Gateway service...${NC}"
mkdir -p services/ai-gateway

# Create a mock AI Gateway service script
cat > services/ai-gateway/ai-gateway-server.js << 'EOF'
#!/usr/bin/env node
/**
 * Simple AI Gateway server for code generation
 * This is a placeholder that would typically be replaced with a real AI service
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.AI_GATEWAY_PORT || 3030;
const SAMPLE_CODE_DIR = path.join(__dirname, 'sample-code');

// Ensure sample code directory exists
if (!fs.existsSync(SAMPLE_CODE_DIR)) {
  fs.mkdirSync(SAMPLE_CODE_DIR, { recursive: true });
  
  // Create some sample code templates
  fs.writeFileSync(path.join(SAMPLE_CODE_DIR, 'javascript.js'), 
    '/**\n * Generated JavaScript code for: {{task.description}}\n * @priority {{task.priority}}\n */\n\nfunction process{{taskType}}() {\n  console.log("Processing {{taskType}}");\n  // Implement {{task.description}}\n  return true;\n}\n\nmodule.exports = { process{{taskType}} };\n');
  
  fs.writeFileSync(path.join(SAMPLE_CODE_DIR, 'python.py'),
    '"""\nGenerated Python code for: {{task.description}}\nPriority: {{task.priority}}\n"""\n\ndef process_{{task_type}}():\n    print("Processing {{task_type}}")\n    # Implement {{task.description}}\n    return True\n');
}

// Create the HTTP server
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/task/generate-code') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const task = data.task;
        const projectRoot = data.project_root || '/project';
        
        console.log(`Received request to generate code for task: ${task.description}`);
        
        // Determine task type from tags or description
        let taskType = 'Unknown';
        if (task.tags && task.tags.length > 0) {
          taskType = task.tags[0].charAt(0).toUpperCase() + task.tags[0].slice(1);
        } else if (task.description) {
          // Extract a word to use as task type
          const words = task.description.split(' ');
          if (words.length > 0) {
            taskType = words[0].charAt(0).toUpperCase() + words[0].slice(1);
          }
        }
        
        // Determine file extension based on task tags
        let fileExt = '.js';
        let templateFile = 'javascript.js';
        
        if (task.tags) {
          if (task.tags.includes('python') || task.tags.includes('backend')) {
            fileExt = '.py';
            templateFile = 'python.py';
          }
        }
        
        // Read the template
        const templatePath = path.join(SAMPLE_CODE_DIR, templateFile);
        let codeTemplate = fs.readFileSync(templatePath, 'utf8');
        
        // Replace template variables
        const taskTypeSlug = taskType.toLowerCase().replace(/\s+/g, '_');
        codeTemplate = codeTemplate
          .replace(/{{task.description}}/g, task.description)
          .replace(/{{task.priority}}/g, task.priority)
          .replace(/{{taskType}}/g, taskType)
          .replace(/{{task_type}}/g, taskTypeSlug);
        
        // Determine output file path based on task section and description
        const section = task.section || 'tasks';
        const sectionDir = path.join(projectRoot, 'generated', section.toLowerCase().replace(/\s+/g, '-'));
        
        // Create output directory if it doesn't exist
        if (!fs.existsSync(sectionDir)) {
          fs.mkdirSync(sectionDir, { recursive: true });
        }
        
        // Create a filename from the task description
        const filename = task.description
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 30) + fileExt;
        
        const outputPath = path.join(sectionDir, filename);
        
        // Write the code to the output file
        fs.writeFileSync(outputPath, codeTemplate);
        
        console.log(`Generated code saved to ${outputPath}`);
        
        // Send success response
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          task: task,
          outputPath: outputPath,
          generatedCode: codeTemplate
        }));
      } catch (error) {
        console.error('Error processing request:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Not found' }));
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`AI Gateway server running at http://localhost:${PORT}`);
  console.log(`Code generation endpoint: http://localhost:${PORT}/task/generate-code`);
});
EOF

chmod +x services/ai-gateway/ai-gateway-server.js

# Create a service script to start the AI Gateway
cat > services/ai-gateway/start-ai-gateway.sh << 'EOF'
#!/bin/bash
# Start the AI Gateway service

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Start the server
node "$SCRIPT_DIR/ai-gateway-server.js" &

# Save the PID to a file
echo $! > "$SCRIPT_DIR/ai-gateway.pid"

echo "AI Gateway started with PID $(cat "$SCRIPT_DIR/ai-gateway.pid")"
echo "API endpoint: http://localhost:3030/task/generate-code"
EOF

chmod +x services/ai-gateway/start-ai-gateway.sh

# Create a service script to stop the AI Gateway
cat > services/ai-gateway/stop-ai-gateway.sh << 'EOF'
#!/bin/bash
# Stop the AI Gateway service

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Check if the PID file exists
if [ -f "$SCRIPT_DIR/ai-gateway.pid" ]; then
  # Read the PID from the file
  PID=$(cat "$SCRIPT_DIR/ai-gateway.pid")
  
  # Kill the process
  kill $PID 2>/dev/null || echo "Process already stopped"
  
  # Remove the PID file
  rm "$SCRIPT_DIR/ai-gateway.pid"
  
  echo "AI Gateway stopped"
else
  echo "AI Gateway is not running"
fi
EOF

chmod +x services/ai-gateway/stop-ai-gateway.sh

# Add Makefile target for easy management
if [ -f "Makefile" ]; then
  echo -e "${YELLOW}Adding Project Charter automation targets to Makefile...${NC}"
  
  # Only add if not already present
  if ! grep -q "charter-automation" Makefile; then
    cat >> Makefile << 'EOF'

# Project Charter automation targets
.PHONY: charter-setup charter-run charter-status charter-ai-start charter-ai-stop

charter-setup:
	@echo "Setting up Project Charter automation..."
	@bash n8n/scripts/setup-charter-automation.sh

charter-run:
	@echo "Manually triggering Project Charter processing..."
	@curl -X POST \
		http://localhost:$(N8N_PORT)/webhook/project-charter/poll \
		-H "Content-Type: application/json" \
		-d '{}'

charter-status:
	@echo "Checking Project Charter automation status..."
	@curl -s http://localhost:$(N8N_PORT)/webhook-test/project-charter/status || echo "Status endpoint not available"

charter-ai-start:
	@echo "Starting AI Gateway for code generation..."
	@bash services/ai-gateway/start-ai-gateway.sh

charter-ai-stop:
	@echo "Stopping AI Gateway..."
	@bash services/ai-gateway/stop-ai-gateway.sh
EOF
    echo -e "${GREEN}Added Project Charter automation targets to Makefile${NC}"
  else
    echo -e "${YELLOW}Project Charter automation targets already exist in Makefile${NC}"
  fi
else
  echo -e "${YELLOW}Creating new Makefile with Project Charter automation targets...${NC}"
  
  cat > Makefile << 'EOF'
# Project Charter Automation Makefile

N8N_PORT ?= 5678

# Project Charter automation targets
.PHONY: charter-setup charter-run charter-status charter-ai-start charter-ai-stop

charter-setup:
	@echo "Setting up Project Charter automation..."
	@bash n8n/scripts/setup-charter-automation.sh

charter-run:
	@echo "Manually triggering Project Charter processing..."
	@curl -X POST \
		http://localhost:$(N8N_PORT)/webhook/project-charter/poll \
		-H "Content-Type: application/json" \
		-d '{}'

charter-status:
	@echo "Checking Project Charter automation status..."
	@curl -s http://localhost:$(N8N_PORT)/webhook-test/project-charter/status || echo "Status endpoint not available"

charter-ai-start:
	@echo "Starting AI Gateway for code generation..."
	@bash services/ai-gateway/start-ai-gateway.sh

charter-ai-stop:
	@echo "Stopping AI Gateway..."
	@bash services/ai-gateway/stop-ai-gateway.sh
EOF
  echo -e "${GREEN}Created new Makefile with Project Charter automation targets${NC}"
fi

# Update the .env file with AI Gateway configuration if needed
if grep -q "AI_GATEWAY_URL" .env; then
  echo -e "${YELLOW}AI Gateway configuration already exists in .env file${NC}"
else
  echo -e "${YELLOW}Adding AI Gateway configuration to .env file...${NC}"
  cat >> .env << EOF

# AI Gateway configuration
AI_GATEWAY_URL=http://localhost:3030
AI_GATEWAY_TOKEN=mock-token
AI_MODEL=gpt-4-turbo
AI_MAX_TOKENS=8192
AI_TEMPERATURE=0.2
EOF
  echo -e "${GREEN}Added AI Gateway configuration to .env file${NC}"
fi

# Final instructions
echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN}Project Charter Task Automation is now set up!${NC}"
echo -e "${BLUE}======================================================${NC}"
echo -e "${YELLOW}Available commands:${NC}"
echo -e "${BLUE}  make charter-setup${NC}    - Run this setup process again"
echo -e "${BLUE}  make charter-run${NC}      - Manually trigger charter processing"
echo -e "${BLUE}  make charter-status${NC}   - Check the automation status"
echo -e "${BLUE}  make charter-ai-start${NC} - Start the AI Gateway for code generation"
echo -e "${BLUE}  make charter-ai-stop${NC}  - Stop the AI Gateway"
echo -e ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Edit ${GREEN}$ENV_FILE${NC} to add your API keys and tokens"
echo -e "2. Start the AI Gateway with ${BLUE}make charter-ai-start${NC}"
echo -e "3. Edit ${GREEN}$PROJECT_CHARTER_PATH${NC} to define your project tasks"
echo -e "4. Run ${BLUE}make charter-run${NC} to process tasks and generate code"
echo -e ""
echo -e "${YELLOW}The system will also automatically check for charter updates twice daily.${NC}"
echo -e "${BLUE}======================================================${NC}"
