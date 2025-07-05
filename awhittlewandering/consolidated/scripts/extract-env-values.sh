#!/bin/bash

echo "📋 Environment Variables for GitHub Secrets"
echo "=========================================="
echo ""
echo "Copy these values to add as GitHub Secrets:"
echo "https://github.com/JW-Flo/ContinentalUSA/settings/secrets/actions"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ No .env file found in the root directory"
    echo "Please create a .env file with your API keys first"
    exit 1
fi

echo "Found .env file. Here are your values:"
echo ""

# Function to extract and display env value
extract_value() {
    local key=$1
    local value=$(grep "^$key=" .env | cut -d'=' -f2- | sed 's/^"//' | sed 's/"$//' | sed "s/^'//" | sed "s/'$//")
    
    if [ -n "$value" ]; then
        # Mask the value for security (show first 4 and last 4 chars)
        local masked_value
        if [ ${#value} -gt 10 ]; then
            masked_value="${value:0:4}...${value: -4}"
        else
            masked_value="***hidden***"
        fi
        echo "✅ $key = $masked_value"
        echo "   Full value: $value"
    else
        echo "❌ $key = NOT FOUND"
    fi
    echo ""
}

echo "=== Cloudflare Secrets ==="
extract_value "CF_API_TOKEN"
extract_value "CF_ACCOUNT_ID"

echo "=== Tessie Secrets ==="
extract_value "TESSIE_API_TOKEN"
extract_value "TESSIE_VIN"

echo "=== API Keys ==="
extract_value "OPENWEATHER_API_KEY"
extract_value "WEATHER_API_KEY"  # Check both variants
extract_value "MAPBOX_TOKEN"

echo "=== Security ==="
extract_value "EDGE_HMAC_KEY"

echo "=== Frontend Variables (VITE_) ==="
echo "Note: These should use the same values as above"
echo ""
echo "VITE_MAPBOX_TOKEN = (same as MAPBOX_TOKEN)"
echo "VITE_OPENWEATHER_API_KEY = (same as OPENWEATHER_API_KEY)"
echo "VITE_TESSIE_API_TOKEN = (same as TESSIE_API_TOKEN)"
echo "VITE_TESSIE_VIN = (same as TESSIE_VIN)"

echo ""
echo "=========================================="
echo "⚠️  IMPORTANT: Add ALL of these to GitHub Secrets"
echo "⚠️  The VITE_ prefixed ones need to be added separately"
echo ""
echo "Missing critical secret: OPENWEATHER_API_KEY"
echo "Get one free at: https://openweathermap.org/api"
