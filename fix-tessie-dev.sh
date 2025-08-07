#!/bin/bash

# EMERGENCY FIX: Set TESSIE_API_KEY for development
# This will immediately fix the 401 error and enable real-time data

echo "🚨 EMERGENCY FIX: Development environment missing TESSIE_API_KEY"
echo "Current status: Tessie API error: 401 (Unauthorized)"
echo ""
echo "Setting TESSIE_API_KEY for development environment..."
echo "Please paste your Tessie API key when prompted:"

cd backend/edge-worker
npx wrangler secret put TESSIE_API_KEY --env development

echo ""
echo "✅ TESSIE_API_KEY set for development!"
echo ""
echo "🔄 Testing the fix..."
sleep 2

echo "Testing development API..."
curl -s "https://awhittlewandering-api-dev.kd8jc7v8cd.workers.dev/api/v1/unified-data" | grep -o '"tessieStatus":[^}]*}' | head -1

echo ""
echo "🚀 If you see connected:true above, the fix worked!"
echo "   If you see connected:false, try again or check the API key."
