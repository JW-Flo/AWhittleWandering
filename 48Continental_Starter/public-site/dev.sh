#!/bin/bash
# The Wandering Whittle - Local Development Script
# This script sets up and runs the site for local development with mock data

# Exit on error
set -e

# Go to the script's directory
cd "$(dirname "$0")"

# Ensure .env file exists with required variables
if [ ! -f .env ]; then
  echo "Creating .env file with development settings..."
  cat > .env << EOL
# The Wandering Whittle Environment Variables - Development
VITE_MAPBOX_TOKEN=pk.eyJ1IjoidGhld2FuZGVyaW5nd2hpdHRsZSIsImEiOiJjbHQxaXhzejYwYmU2MmpxdHl0MHowN3UzIn0.Q7xKTRlXvtimBHd39JqN1A
VITE_APP_NAME="The Wandering Whittle"
VITE_ENABLE_MOCK_DATA=true
VITE_ENABLE_OFFLINE_MODE=true
EOL
  echo "✅ Created .env file with development settings"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
  echo "✅ Dependencies installed"
fi

# Start development server
echo "🚀 Starting development server..."
echo "🌎 The site will be available at: http://localhost:3000"
echo "⚡ Press Ctrl+C to stop the server"
echo ""
npm run dev
