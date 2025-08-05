#!/bin/bash

# REAL TESSIE DATA SETUP SCRIPT
# Sets up environment variables and tests actual Tessie API connection

echo "🔥 REAL TESSIE DATA VALIDATOR SETUP"
echo "📅 This will test your actual Tesla data from June 1, 2025"
echo "🚫 NO SIMULATIONS - REAL DATA ONLY"
echo "─────────────────────────────────────────────────────────"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    touch .env
fi

# Function to prompt for input
prompt_for_value() {
    local var_name=$1
    local description=$2
    local current_value=$(grep "^$var_name=" .env 2>/dev/null | cut -d'=' -f2-)
    
    if [ -n "$current_value" ]; then
        echo "✅ $var_name is already set: ${current_value:0:20}..."
        read -p "🔄 Update $var_name? (y/N): " update
        if [[ ! $update =~ ^[Yy]$ ]]; then
            return
        fi
    fi
    
    echo ""
    echo "🔍 $description"
    read -p "Enter $var_name: " value
    
    if [ -n "$value" ]; then
        # Remove existing entry and add new one
        grep -v "^$var_name=" .env > .env.tmp 2>/dev/null || touch .env.tmp
        echo "$var_name=$value" >> .env.tmp
        mv .env.tmp .env
        echo "✅ $var_name saved to .env"
    else
        echo "⚠️  Skipped $var_name"
    fi
}

echo "🔑 TESSIE API CREDENTIALS SETUP"
echo ""

# Get Tessie API Token
prompt_for_value "TESSIE_API_TOKEN" "Get your API token from: https://my.tessie.com/settings/api"

# Get Vehicle ID  
prompt_for_value "VEHICLE_ID" "Your Tesla Vehicle ID (find it in Tessie dashboard or use 'vehicles' endpoint)"

# Alternative: Tesla VIN
prompt_for_value "TESLA_VIN" "Your Tesla VIN (17 characters, alternative to Vehicle ID)"

echo ""
echo "─────────────────────────────────────────────────────────"
echo "🧪 TESTING REAL TESSIE API CONNECTION..."

# Load environment variables
set -a
source .env
set +a

# Test the API connection
node test-tessie-api.js

echo ""
echo "─────────────────────────────────────────────────────────"
echo "🎯 NEXT STEPS:"
echo "1. ✅ API credentials configured"
echo "2. 🔄 Run: 'npm run test:real-data' to validate historical data"  
echo "3. 🚀 Deploy to Cloudflare Workers for full ingestion"
echo "4. 📊 View real Tesla data in your dashboard"
