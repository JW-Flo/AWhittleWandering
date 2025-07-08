#!/bin/bash

# MVP Setup Script for 48 Continental USA
# This script helps configure the environment for the MVP

echo "🚗 48 Continental USA - MVP Setup"
echo "================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "48Continental_Starter" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Function to prompt for input with a default value
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    
    read -p "$prompt [$default]: " input
    if [ -z "$input" ]; then
        eval "$var_name='$default'"
    else
        eval "$var_name='$input'"
    fi
}

echo "📋 This script will help you configure:"
echo "  - Tessie API credentials"
echo "  - Environment variables"
echo "  - Service startup"
echo ""

# Check for existing credentials
if [ -f "edge-worker/.dev.vars" ]; then
    echo "⚠️  Found existing edge-worker/.dev.vars"
    read -p "Do you want to update it with real credentials? (y/n): " update_edge
else
    update_edge="y"
fi

if [ "$update_edge" = "y" ]; then
    echo ""
    echo "🔑 Tessie API Configuration"
    echo "Get your credentials from: https://developer.tessie.com/"
    echo ""
    
    read -p "Enter your Tessie API Token: " tessie_token
    read -p "Enter your Tesla VIN: " tessie_vin
    
    # Create edge-worker .dev.vars
    cat > edge-worker/.dev.vars << EOF
# Tessie API Configuration
TESSIE_API_TOKEN=$tessie_token
TESSIE_VIN=$tessie_vin

# Weather API (using default test key)
WEATHER_API_KEY=test_weather_key_placeholder

# Map Services (using project's Mapbox token)
MAPBOX_TOKEN=pk.eyJ1IjoidGhld2FuZGVyaW5nd2hpdHRsZSIsImEiOiJjbHQxaXhzejYwYmU2MmpxdHl0MHowN3UzIn0.Q7xKTRlXvtimBHd39JqN1A

# Security
EDGE_HMAC_KEY=$(openssl rand -hex 32)
EOF
    
    echo "✅ Created edge-worker/.dev.vars"
fi

# Create frontend .env.local
if [ -f "48Continental_Starter/public-site/.env.local" ]; then
    echo ""
    echo "⚠️  Found existing frontend .env.local"
    read -p "Do you want to update it? (y/n): " update_frontend
else
    update_frontend="y"
fi

if [ "$update_frontend" = "y" ]; then
    # Use the same credentials if we just collected them
    if [ "$update_edge" != "y" ]; then
        echo ""
        echo "🔑 Frontend Configuration"
        read -p "Enter your Tessie API Token: " tessie_token
        read -p "Enter your Tesla VIN: " tessie_vin
    fi
    
    cat > 48Continental_Starter/public-site/.env.local << EOF
# Tessie API Configuration
VITE_TESSIE_API_TOKEN=$tessie_token
VITE_TESSIE_VIN=$tessie_vin

# API Endpoints
VITE_API_BASE_URL=http://localhost:8787

# Map Configuration (using project's token)
VITE_MAPBOX_TOKEN=pk.eyJ1IjoidGhld2FuZGVyaW5nd2hpdHRsZSIsImEiOiJjbHQxaXhzejYwYmU2MmpxdHl0MHowN3UzIn0.Q7xKTRlXvtimBHd39JqN1A

# Feature Flags
VITE_ENABLE_STREAMING=true
VITE_USE_SIMULATED_DATA=false
EOF
    
    echo "✅ Created frontend .env.local"
fi

echo ""
echo "📦 Installing dependencies..."

# Install edge-worker dependencies
echo "Installing edge-worker dependencies..."
cd edge-worker && bun install && cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd 48Continental_Starter/public-site && bun install && cd ../..

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start the services, run:"
echo "   ./scripts/start-services.sh"
echo ""
echo "Or manually start each service:"
echo "   Terminal 1: cd edge-worker && bun run dev"
echo "   Terminal 2: cd 48Continental_Starter/public-site && bun run dev"
echo ""
echo "📱 Then open: http://localhost:5175"
echo ""
echo "⚠️  Note: If you see 'Vehicle is asleep' errors, wait 10-30 seconds and refresh."
