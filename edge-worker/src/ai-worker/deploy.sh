#!/bin/bash
# 48 Continental AI Worker Deployment Script

# Exit on any error
set -e

echo "=== 48 Continental AI Worker Deployment ==="
echo "Starting deployment process..."

# Check if Wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Check for CLOUDFLARE_API_TOKEN
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "Warning: CLOUDFLARE_API_TOKEN environment variable not set."
    echo "You may need to log in with 'wrangler login' if not already authenticated."
fi

# Check for wrangler.toml
if [ ! -f "wrangler.toml" ]; then
    echo "Error: wrangler.toml not found in current directory."
    exit 1
fi

# Check for main worker file
if [ ! -f "continental-ai-worker.js" ]; then
    echo "Error: continental-ai-worker.js not found in current directory."
    exit 1
fi

echo "Running linting checks..."
# If you have eslint set up, uncomment this
# npx eslint continental-ai-worker.js

echo "Validating Worker configuration..."
wrangler config validate

echo "Deploying to Cloudflare Workers..."
wrangler deploy

echo "Deployment complete!"
echo "Your Worker is now available at: https://continental-ai-worker.yourworker.workers.dev"
echo "Test the OpenAI-compatible endpoint with:"
echo "curl -X POST https://continental-ai-worker.yourworker.workers.dev/v1/chat/completions \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"model\":\"@cf/meta/llama-3.1-8b-instruct\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello, how are you?\"}]}'"

echo ""
echo "To update the Cline MCP settings, add the entries from cline_mcp_settings.json to:"
echo "~/.cline/mcp_config.json or the appropriate configuration file for your environment."

echo ""
echo "=== Deployment Script Complete ==="
