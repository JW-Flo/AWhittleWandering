#!/bin/bash
# Environment Verification Script for The Wandering Whittle

echo "====================================================="
echo "🔍 48 Continental USA Environment Configuration Check"
echo "====================================================="

ENV_FILE=".env"
CRITICAL_VARS=(
  "VITE_EDGE_WORKER_URL"
  "VITE_API_BASE_URL"
  "VITE_MAPBOX_TOKEN"
  "VITE_USE_SIMULATED_DATA"
)

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ ERROR: $ENV_FILE file not found!"
  echo "Please create a $ENV_FILE file with required environment variables."
  exit 1
fi

echo "✅ Found $ENV_FILE file"

# Check critical environment variables
echo "Checking critical environment variables..."
MISSING_VARS=0

for VAR in "${CRITICAL_VARS[@]}"; do
  if ! grep -q "^$VAR=" "$ENV_FILE"; then
    echo "❌ Missing critical variable: $VAR"
    MISSING_VARS=$((MISSING_VARS+1))
  else
    VALUE=$(grep "^$VAR=" "$ENV_FILE" | cut -d '=' -f2-)
    # Truncate long values for display
    if [ ${#VALUE} -gt 20 ]; then
      DISPLAY_VALUE="${VALUE:0:20}..."
    else
      DISPLAY_VALUE="$VALUE"
    fi
    echo "✅ $VAR = $DISPLAY_VALUE"
  fi
done

# Check if simulated data is enabled
if grep -q "^VITE_USE_SIMULATED_DATA=true" "$ENV_FILE"; then
  echo "✅ Simulated data is ENABLED (recommended for stable operation)"
else
  echo "⚠️ WARNING: Simulated data is DISABLED. This may cause issues if the Edge Worker is unavailable."
fi

# Check for API URL consistency
EDGE_WORKER_URL=$(grep "^VITE_EDGE_WORKER_URL=" "$ENV_FILE" | cut -d '=' -f2-)
API_BASE_URL=$(grep "^VITE_API_BASE_URL=" "$ENV_FILE" | cut -d '=' -f2-)

if [ "$EDGE_WORKER_URL" = "$API_BASE_URL" ]; then
  echo "✅ API URLs are consistent"
else
  echo "⚠️ WARNING: API URLs are inconsistent:"
  echo "  VITE_EDGE_WORKER_URL = $EDGE_WORKER_URL"
  echo "  VITE_API_BASE_URL = $API_BASE_URL"
  echo "These should typically match for proper operation."
fi

# Check MapBox token (should match hardcoded token in Map.jsx)
MAPBOX_TOKEN=$(grep "^VITE_MAPBOX_TOKEN=" "$ENV_FILE" | cut -d '=' -f2-)
EXPECTED_TOKEN="pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJmNXlwY2IycGdtMnFva2liaTA4enIwIn0.tU9_tLaaxXxhfcVX4WhOeA"

if [ "$MAPBOX_TOKEN" = "$EXPECTED_TOKEN" ]; then
  echo "✅ MapBox token matches expected value"
else
  echo "⚠️ WARNING: MapBox token does not match the hardcoded value in Map.jsx"
  echo "  For maximum reliability, ensure both values match."
fi

echo "====================================================="
if [ $MISSING_VARS -eq 0 ]; then
  echo "✅ All critical environment variables are set!"
  echo "The environment configuration appears to be valid."
else
  echo "❌ $MISSING_VARS critical variables are missing!"
  echo "Please add the missing variables to your $ENV_FILE file."
fi
echo "====================================================="
