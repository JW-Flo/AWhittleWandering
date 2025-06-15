#!/bin/bash
# API Endpoints Validation Script
# This script verifies that the API endpoints configured in the environment 
# are valid and reachable. It checks URLs in built files to ensure they 
# are production endpoints, not localhost or development servers.

# Exit on error
set -e

# Configuration
DIST_DIR="dist"
API_PATTERN="https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\/?(api)?\/?"
LOCALHOST_PATTERN="https?:\/\/(localhost|127\.0\.0\.1|\[::\]|0\.0\.0\.0)"
INVALID_ENV_PATTERN="(undefined|null)\.awhittlewandering\.com"
ENV_FILE=".env.production"
REQUIRED_ENDPOINTS=(
  "VITE_API_BASE_URL"
  "VITE_EDGE_WORKER_URL"
  "VITE_WEBSOCKET_ENDPOINT"
)
CHECK_CONNECTIVITY=${CHECK_CONNECTIVITY:-false}  # Set to true to actually ping endpoints

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🔍 Validating API endpoints..."

# Check if build directory exists
if [ ! -d "$DIST_DIR" ]; then
  echo -e "${RED}Error: Build directory '$DIST_DIR' not found. Run 'npm run build' first.${NC}"
  exit 1
fi

# Initialize counters
invalid_endpoints=0
localhost_endpoints=0
missing_endpoints=0
unreachable_endpoints=0

# 1. Check .env.production file for API endpoints
echo "Checking environment configuration in $ENV_FILE..."
if [ -f "$ENV_FILE" ]; then
  for endpoint_var in "${REQUIRED_ENDPOINTS[@]}"; do
    if grep -q "^$endpoint_var=" "$ENV_FILE"; then
      endpoint_value=$(grep "^$endpoint_var=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
      
      # Check if endpoint is properly formatted
      if [[ "$endpoint_value" =~ $LOCALHOST_PATTERN ]]; then
        echo -e "${YELLOW}⚠ $endpoint_var in $ENV_FILE contains localhost URL: $endpoint_value${NC}"
        localhost_endpoints=$((localhost_endpoints + 1))
      elif [[ "$endpoint_value" =~ $INVALID_ENV_PATTERN ]]; then
        echo -e "${RED}✗ $endpoint_var in $ENV_FILE contains invalid URL: $endpoint_value${NC}"
        invalid_endpoints=$((invalid_endpoints + 1))
      elif ! [[ "$endpoint_value" =~ $API_PATTERN ]]; then
        echo -e "${RED}✗ $endpoint_var in $ENV_FILE has invalid format: $endpoint_value${NC}"
        invalid_endpoints=$((invalid_endpoints + 1))
      else
        echo -e "${GREEN}✓ $endpoint_var in $ENV_FILE is properly formatted: $endpoint_value${NC}"
        
        # Optionally check connectivity
        if [ "$CHECK_CONNECTIVITY" = true ]; then
          # Remove trailing slashes and add /health for the check
          check_url=$(echo "$endpoint_value" | sed 's/\/$//')/health
          
          # Use curl to check endpoint availability
          if curl --output /dev/null --silent --head --fail --max-time 5 "$check_url"; then
            echo -e "${GREEN}  ✓ Endpoint is reachable${NC}"
          else
            echo -e "${YELLOW}  ⚠ Endpoint is not reachable or doesn't have a /health endpoint${NC}"
            unreachable_endpoints=$((unreachable_endpoints + 1))
          fi
        fi
      fi
    else
      echo -e "${RED}✗ Required endpoint $endpoint_var not found in $ENV_FILE${NC}"
      missing_endpoints=$((missing_endpoints + 1))
    fi
  done
else
  echo -e "${RED}✗ Environment file $ENV_FILE not found${NC}"
  missing_endpoints=$((missing_endpoints + 1))
fi

# 2. Check for localhost URLs in built JS files
echo ""
echo "Checking for localhost URLs in built JavaScript files..."
js_files=$(find "$DIST_DIR" -type f -name "*.js")
for file in $js_files; do
  # Skip source maps
  if [[ "$file" == *.map ]]; then
    continue
  fi
  
  # Check for localhost URLs
  localhost_matches=$(grep -o "$LOCALHOST_PATTERN" "$file" 2>/dev/null | wc -l)
  if [ "$localhost_matches" -gt 0 ]; then
    echo -e "${RED}✗ Found $localhost_matches localhost URLs in $(basename "$file")${NC}"
    localhost_endpoints=$((localhost_endpoints + localhost_matches))
    
    # Show the lines with localhost
    grep -n "$LOCALHOST_PATTERN" "$file" | head -5 | while read -r line; do
      echo -e "${RED}  - $line${NC}"
    done
    
    # If more than 5 matches, show count of remaining
    remaining=$((localhost_matches - 5))
    if [ "$remaining" -gt 0 ]; then
      echo -e "${RED}  - ... and $remaining more${NC}"
    fi
  fi
  
  # Check for invalid environment variable references that weren't replaced
  invalid_matches=$(grep -o "$INVALID_ENV_PATTERN" "$file" 2>/dev/null | wc -l)
  if [ "$invalid_matches" -gt 0 ]; then
    echo -e "${RED}✗ Found $invalid_matches invalid environment references in $(basename "$file")${NC}"
    invalid_endpoints=$((invalid_endpoints + invalid_matches))
  fi
done

# 3. Look for hardcoded API URLs that might not be configurable
echo ""
echo "Checking for hardcoded API URLs in JavaScript files..."
hardcoded_api_count=0
hardcoded_apis=$(grep -r --include="*.js" "https://.*\.awhittlewandering\.com" "$DIST_DIR" 2>/dev/null)
if [ -n "$hardcoded_apis" ]; then
  echo -e "${YELLOW}⚠ Found hardcoded API URLs:${NC}"
  echo "$hardcoded_apis" | head -5 | while read -r line; do
    echo -e "${YELLOW}  - $line${NC}"
    hardcoded_api_count=$((hardcoded_api_count + 1))
  done
  
  echo -e "${YELLOW}⚠ Hardcoded URLs may cause issues if the API domain changes${NC}"
  echo -e "${YELLOW}  Consider using environment variables for all API URLs${NC}"
fi

# Validation result
echo ""
echo "-------------------------------------"
echo "API Endpoints Validation Summary:"

if [ "$missing_endpoints" -gt 0 ] || [ "$invalid_endpoints" -gt 0 ]; then
  echo -e "${RED}❌ Validation failed with errors:${NC}"
  [ "$missing_endpoints" -gt 0 ] && echo -e "${RED}   - $missing_endpoints required endpoint(s) missing${NC}"
  [ "$invalid_endpoints" -gt 0 ] && echo -e "${RED}   - $invalid_endpoints invalid endpoint format(s)${NC}"
  [ "$localhost_endpoints" -gt 0 ] && echo -e "${RED}   - $localhost_endpoints localhost URL(s) found${NC}"
  [ "$unreachable_endpoints" -gt 0 ] && echo -e "${RED}   - $unreachable_endpoints endpoint(s) unreachable${NC}"
  echo -e "${RED}   Please fix these issues before deployment${NC}"
  exit 1
elif [ "$localhost_endpoints" -gt 0 ] || [ "$unreachable_endpoints" -gt 0 ] || [ "$hardcoded_api_count" -gt 0 ]; then
  echo -e "${YELLOW}⚠️ Validation passed with warnings:${NC}"
  [ "$localhost_endpoints" -gt 0 ] && echo -e "${YELLOW}   - $localhost_endpoints localhost URL(s) found${NC}"
  [ "$unreachable_endpoints" -gt 0 ] && echo -e "${YELLOW}   - $unreachable_endpoints endpoint(s) unreachable${NC}"
  [ "$hardcoded_api_count" -gt 0 ] && echo -e "${YELLOW}   - $hardcoded_api_count hardcoded API URL(s) found${NC}"
  echo -e "${YELLOW}   Review these warnings before production deployment${NC}"
  exit 0
else
  echo -e "${GREEN}✅ API endpoints validation passed successfully${NC}"
  echo -e "${GREEN}   All endpoints are properly configured${NC}"
  exit 0
fi
