#!/bin/bash
# Script to verify Mapbox token functionality
# Version 1.0.0

set -e # Exit on error

# Terminal colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
PUBLIC_SITE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${PUBLIC_SITE_ROOT}/.env"
ENV_PROD_FILE="${PUBLIC_SITE_ROOT}/.env.production"
MAP_CONFIG_FILE="${PUBLIC_SITE_ROOT}/src/shared/mapbox/mapboxConfig.ts"

# Log messages with timestamp
log() {
  local level=$1
  local message=$2
  local color=$NC
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  
  case $level in
    "INFO") color=$GREEN ;;
    "WARN") color=$YELLOW ;;
    "ERROR") color=$RED ;;
    "STEP") color=$BLUE ;;
  esac
  
  echo -e "${color}[${timestamp}] ${level}: ${message}${NC}"
}

# Check if Mapbox token exists in environment
check_env_token() {
  log "STEP" "Checking for Mapbox token in environment variables"
  
  # Check current environment
  if [ -n "${VITE_MAPBOX_TOKEN}" ]; then
    log "INFO" "Found Mapbox token in environment variable VITE_MAPBOX_TOKEN"
    MAPBOX_TOKEN="${VITE_MAPBOX_TOKEN}"
    return 0
  fi
  
  # Check .env file
  if [ -f "${ENV_FILE}" ]; then
    log "INFO" "Checking .env file"
    MAPBOX_TOKEN=$(grep -o 'VITE_MAPBOX_TOKEN=.*' "${ENV_FILE}" | cut -d '=' -f2 || echo "")
    
    if [ -n "${MAPBOX_TOKEN}" ]; then
      log "INFO" "Found Mapbox token in .env file"
      return 0
    fi
  fi
  
  # Check .env.production file
  if [ -f "${ENV_PROD_FILE}" ]; then
    log "INFO" "Checking .env.production file"
    MAPBOX_TOKEN=$(grep -o 'VITE_MAPBOX_TOKEN=.*' "${ENV_PROD_FILE}" | cut -d '=' -f2 || echo "")
    
    if [ -n "${MAPBOX_TOKEN}" ]; then
      log "INFO" "Found Mapbox token in .env.production file"
      return 0
    fi
  fi
  
  # Check MapboxConfig file
  if [ -f "${MAP_CONFIG_FILE}" ]; then
    log "INFO" "Checking mapboxConfig.ts file"
    MAPBOX_TOKEN=$(grep -o 'token:.*' "${MAP_CONFIG_FILE}" | cut -d "'" -f2 || echo "")
    
    if [ -n "${MAPBOX_TOKEN}" ]; then
      log "INFO" "Found Mapbox token in mapboxConfig.ts file"
      return 0
    fi
  fi
  
  log "ERROR" "No Mapbox token found in environment variables or config files"
  return 1
}

# Validate Mapbox token with API call
validate_token() {
  log "STEP" "Validating Mapbox token with API"
  
  # Remove any quotes from the token
  MAPBOX_TOKEN=$(echo "${MAPBOX_TOKEN}" | tr -d '"' | tr -d "'")
  
  # Test endpoint URL
  ENDPOINT="https://api.mapbox.com/tokens/v2?access_token=${MAPBOX_TOKEN}"
  
  log "INFO" "Making request to Mapbox API"
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${ENDPOINT}")
  
  if [ "${RESPONSE}" = "200" ]; then
    log "INFO" "Mapbox token is valid"
    return 0
  else
    log "ERROR" "Mapbox token validation failed with status code: ${RESPONSE}"
    return 1
  fi
}

# Add token to env file if missing
add_token_to_env() {
  log "STEP" "Adding Mapbox token to .env file"
  
  if [ ! -f "${ENV_FILE}" ]; then
    log "INFO" "Creating .env file"
    touch "${ENV_FILE}"
  fi
  
  # Check if token already exists in file
  if grep -q "VITE_MAPBOX_TOKEN=" "${ENV_FILE}"; then
    log "INFO" "Updating existing token in .env file"
    sed -i'.bak' "s/VITE_MAPBOX_TOKEN=.*/VITE_MAPBOX_TOKEN=${MAPBOX_TOKEN}/" "${ENV_FILE}"
    rm "${ENV_FILE}.bak" 2>/dev/null || true
  else
    log "INFO" "Adding new token entry to .env file"
    echo "VITE_MAPBOX_TOKEN=${MAPBOX_TOKEN}" >> "${ENV_FILE}"
  fi
  
  log "INFO" "Token added to .env file"
  return 0
}

# Add token to config file if missing
add_token_to_config() {
  log "STEP" "Checking mapboxConfig.ts file"
  
  if [ ! -f "${MAP_CONFIG_FILE}" ]; then
    log "WARN" "mapboxConfig.ts file not found. Creating it."
    
    # Create the directory if it doesn't exist
    mkdir -p "$(dirname "${MAP_CONFIG_FILE}")"
    
    # Create config file with token
    cat > "${MAP_CONFIG_FILE}" << EOF
/**
 * Mapbox configuration
 * 
 * This file contains the configuration for Mapbox GL JS
 */

export const mapboxConfig = {
  token: '${MAPBOX_TOKEN}',
  style: 'mapbox://styles/mapbox/streets-v11',
  options: {
    attributionControl: true,
    interactive: true,
    minZoom: 2,
    maxZoom: 18
  }
};

export default mapboxConfig;
EOF
    
    log "INFO" "Created mapboxConfig.ts with token"
    return 0
  fi
  
  # Check if token exists in config file
  if grep -q "token:" "${MAP_CONFIG_FILE}"; then
    log "INFO" "Updating existing token in mapboxConfig.ts"
    sed -i'.bak' "s/token:.*,/token: '${MAPBOX_TOKEN}',/" "${MAP_CONFIG_FILE}"
    rm "${MAP_CONFIG_FILE}.bak" 2>/dev/null || true
  else
    log "WARN" "Could not update mapboxConfig.ts - token field not found"
    return 1
  fi
  
  log "INFO" "Token updated in mapboxConfig.ts"
  return 0
}

# Run test to verify token works with MapboxGL
run_mapbox_test() {
  log "STEP" "Testing Mapbox token with MapboxGL"
  
  # Create a temporary HTML file for testing
  TEST_HTML="/tmp/mapbox-test-$(date +%s).html"
  
  cat > "${TEST_HTML}" << EOF
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Mapbox Token Test</title>
  <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no">
  <link href="https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css" rel="stylesheet">
  <script src="https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.js"></script>
  <style>
    body { margin: 0; padding: 0; }
    #map { position: absolute; top: 0; bottom: 0; width: 100%; }
    #result { position: absolute; bottom: 10px; left: 10px; padding: 10px; background: white; z-index: 1; }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="result">Testing...</div>
  
  <script>
    const token = '${MAPBOX_TOKEN}';
    let resultDiv = document.getElementById('result');
    
    try {
      mapboxgl.accessToken = token;
      const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-74.5, 40], // starting position
        zoom: 9 // starting zoom
      });
      
      map.on('load', () => {
        resultDiv.style.backgroundColor = '#dfd';
        resultDiv.textContent = 'SUCCESS: Map loaded successfully!';
        
        // Exit with success code for headless environments
        if (window.testComplete) {
          window.testComplete(true);
        }
      });
      
      map.on('error', (e) => {
        resultDiv.style.backgroundColor = '#fdd';
        resultDiv.textContent = 'ERROR: ' + e.error.message || 'Unknown map error';
        
        // Exit with error code for headless environments
        if (window.testComplete) {
          window.testComplete(false);
        }
      });
    } catch (e) {
      resultDiv.style.backgroundColor = '#fdd';
      resultDiv.textContent = 'ERROR: ' + e.message;
      
      // Exit with error code for headless environments
      if (window.testComplete) {
        window.testComplete(false);
      }
    }
  </script>
</body>
</html>
EOF
  
  log "INFO" "Created test HTML file at ${TEST_HTML}"
  
  # Check if we're in a CI environment or have a browser
  if [ -n "${CI}" ] || [ -n "${GITHUB_ACTIONS}" ]; then
    log "INFO" "CI environment detected. Skipping browser test."
    # In CI, we'll just do a simple API check instead
    MAP_API_URL="https://api.mapbox.com/v4/mapbox.satellite/1/0/0@2x.jpg90?access_token=${MAPBOX_TOKEN}"
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${MAP_API_URL}")
    
    if [ "${RESPONSE}" = "200" ]; then
      log "INFO" "Mapbox token works with map tiles API"
      rm "${TEST_HTML}" 2>/dev/null || true
      return 0
    else
      log "ERROR" "Mapbox token failed with map tiles API: status ${RESPONSE}"
      rm "${TEST_HTML}" 2>/dev/null || true
      return 1
    fi
  else
    # Try to open in a browser if available
    if command -v open &> /dev/null; then
      log "INFO" "Opening test in browser"
      open "${TEST_HTML}"
      log "WARN" "Manual verification required. Check browser window."
      log "INFO" "Test file available at: ${TEST_HTML}"
    elif command -v xdg-open &> /dev/null; then
      log "INFO" "Opening test in browser"
      xdg-open "${TEST_HTML}"
      log "WARN" "Manual verification required. Check browser window."
      log "INFO" "Test file available at: ${TEST_HTML}"
    else
      log "WARN" "No browser available. Skipping visual test."
      log "INFO" "Test file available at: ${TEST_HTML}"
    fi
    
    return 0
  fi
}

# Main function
main() {
  log "INFO" "Starting Mapbox token verification"
  
  # Check if token exists
  if ! check_env_token; then
    log "ERROR" "No Mapbox token found. Please set the VITE_MAPBOX_TOKEN environment variable."
    return 1
  fi
  
  # Validate token
  if ! validate_token; then
    log "ERROR" "Mapbox token validation failed."
    return 1
  fi
  
  # Add token to env file
  add_token_to_env
  
  # Add token to config file
  add_token_to_config
  
  # Run Mapbox test
  if ! run_mapbox_test; then
    log "ERROR" "Mapbox rendering test failed."
    return 1
  fi
  
  log "INFO" "Mapbox token verification completed successfully"
  return 0
}

# Run the main function
main
exit $?
