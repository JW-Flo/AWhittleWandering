#!/bin/bash
# Setup script for MCP Server Deployment workflow in n8n

# Set error handling
set -e

# Load environment variables
if [ -f ".env" ]; then
  source .env
else
  echo "Error: .env file not found. Please create one based on .env.example"
  exit 1
fi

# Check if n8n is running
echo "Checking if n8n is running..."
if ! curl -s "http://localhost:${N8N_PORT:-5678}/healthz" > /dev/null; then
  echo "Error: n8n is not running. Please start n8n first."
  exit 1
fi

# Define constants
N8N_API_URL="http://localhost:${N8N_PORT:-5678}/api"
WORKFLOW_PATH="$(dirname "$0")/../workflows/mcp-server-deployment.json"
WORKFLOW_NAME="MCP Server Deployment"
ENV_FILE_EXAMPLE="$(dirname "$0")/../env/mcp-server-deployment.env.example"
ENV_FILE="$(dirname "$0")/../env/mcp-server-deployment.env"

# Check if workflow file exists
if [ ! -f "$WORKFLOW_PATH" ]; then
  echo "Error: Workflow file not found at $WORKFLOW_PATH"
  exit 1
fi

# Check if environment file example exists
if [ ! -f "$ENV_FILE_EXAMPLE" ]; then
  echo "Error: Environment file example not found at $ENV_FILE_EXAMPLE"
  exit 1
fi

# Create environment file if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
  echo "Creating environment file from example..."
  cp "$ENV_FILE_EXAMPLE" "$ENV_FILE"
  echo "Please edit $ENV_FILE with your configuration values."
fi

# Check if the workflow already exists
echo "Checking if workflow already exists..."
EXISTING_WORKFLOW=$(curl -s -H "X-N8N-API-KEY: ${N8N_API_KEY}" "${N8N_API_URL}/workflows" | jq -r '.data[] | select(.name == "'"$WORKFLOW_NAME"'") | .id')

if [ -n "$EXISTING_WORKFLOW" ]; then
  echo "Workflow already exists with ID $EXISTING_WORKFLOW. Updating..."
  RESPONSE=$(curl -s -X PUT \
    -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
    -H "Content-Type: application/json" \
    -d @"$WORKFLOW_PATH" \
    "${N8N_API_URL}/workflows/$EXISTING_WORKFLOW")
  
  WORKFLOW_ID=$(echo "$RESPONSE" | jq -r '.id')
  echo "Workflow updated with ID $WORKFLOW_ID"
else
  echo "Creating new workflow..."
  RESPONSE=$(curl -s -X POST \
    -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
    -H "Content-Type: application/json" \
    -d @"$WORKFLOW_PATH" \
    "${N8N_API_URL}/workflows")
  
  WORKFLOW_ID=$(echo "$RESPONSE" | jq -r '.id')
  echo "Workflow created with ID $WORKFLOW_ID"
fi

# Activate the workflow
echo "Activating workflow..."
curl -s -X PUT \
  -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"active": true}' \
  "${N8N_API_URL}/workflows/$WORKFLOW_ID/activate"

echo "Setting up workflow environment variables..."
# If the workflow uses environment variables, set them up here
if [ -f "$ENV_FILE" ]; then
  echo "Loading environment variables from $ENV_FILE"
  source "$ENV_FILE"
  
  # Register environment variables with n8n
  # This is a simplified example - in a real scenario, you might have a more complex
  # approach to register environment variables
  echo "Registering environment variables with n8n..."
  # Your logic to register environment variables
fi

echo "MCP Server Deployment workflow setup complete!"
echo "Workflow ID: $WORKFLOW_ID"
echo "You can now trigger the workflow by sending a webhook request to:"
echo "http://localhost:${N8N_PORT:-5678}/webhook/mcp-server/update"
echo ""
echo "Don't forget to edit the environment variables in:"
echo "$ENV_FILE"
