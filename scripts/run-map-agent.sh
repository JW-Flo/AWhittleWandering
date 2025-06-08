#!/usr/bin/env bash
# Script to run the map-integration-agent to fix Mapbox token issues

echo "🗺️ Starting Map Integration Agent to fix Mapbox token issues..."

# Change to project root directory
cd "$(dirname "$0")/.."

# Set up environment variables for the agent
export AGENT_TYPE="map-integration"
export AGENT_TASK="fix-mapbox-token"

# Check if we have the correct token in environment
if [ -z "$MAPBOX_TOKEN" ]; then
  # Try to get token from .env file if it exists
  if [ -f ".env" ]; then
    source .env
  fi
  
  # If still not found, use the token from the repository
  if [ -z "$MAPBOX_TOKEN" ]; then
    export MAPBOX_TOKEN="pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJmNXlwY2IycGdtMnFva2liaTA4enIwIn0.tU9_tLaaxXxhfcVX4WhOeA"
    echo "Using default token from repository"
  fi
fi

# Set up the agent configuration
cp ai-agents/configs/map-integration-agent.json ./current-agent-config.json

# Run the agent with specific task focus
echo "Running map-integration-agent with task: fix-mapbox-token"
node ./ai-agents/run-agent.js --config=./current-agent-config.json --task=fix-mapbox-token --focus="mapbox-token-error"

# Clean up
rm ./current-agent-config.json

echo "✅ Map Integration Agent task completed"
