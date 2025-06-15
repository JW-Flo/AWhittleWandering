#!/bin/bash
# Mapbox Token Verification Script
# This script verifies that the Mapbox token is properly embedded in the build
# It performs multiple checks to ensure the token is accessible in various ways

# Exit on error
set -e

# Configuration
DIST_DIR="dist"
TOKEN_CHECK_FILES=("index.html" "assets/*.js")
TOKEN_PATTERN="pk\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*"
MIN_TOKEN_LENGTH=70
MAX_TOKEN_LENGTH=150
CHECK_GLOBAL_VAR=true
CHECK_META_TAG=true
CHECK_ENV_REPLACEMENT=true

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo "🔍 Verifying Mapbox token in build..."

# Check if build directory exists
if [ ! -d "$DIST_DIR" ]; then
  echo -e "${RED}Error: Build directory '$DIST_DIR' not found. Run 'npm run build' first.${NC}"
  exit 1
fi

# Initialize counters
token_found=false
token_instances=0
token_files=0
valid_token_count=0

# 1. Check for window.__MAPBOX_TOKEN__ variable
if [ "$CHECK_GLOBAL_VAR" = true ]; then
  echo "Checking for window.__MAPBOX_TOKEN__ variable..."
  if grep -q "window\.__MAPBOX_TOKEN__" "$DIST_DIR/index.html"; then
    echo -e "${GREEN}✓ window.__MAPBOX_TOKEN__ variable found in index.html${NC}"
    token_found=true
    token_instances=$((token_instances + 1))
    token_files=$((token_files + 1))
  else
    echo -e "${YELLOW}⚠ window.__MAPBOX_TOKEN__ variable not found in index.html${NC}"
  fi
fi

# 2. Check for meta[name="mapbox-token"] tag
if [ "$CHECK_META_TAG" = true ]; then
  echo "Checking for meta[name=\"mapbox-token\"] tag..."
  if grep -q '<meta name="mapbox-token" content="' "$DIST_DIR/index.html"; then
    echo -e "${GREEN}✓ meta[name=\"mapbox-token\"] tag found in index.html${NC}"
    token_found=true
    token_instances=$((token_instances + 1))
    # No need to increment token_files, already counted index.html
  else
    echo -e "${YELLOW}⚠ meta[name=\"mapbox-token\"] tag not found in index.html${NC}"
  fi
fi

# 3. Check for Mapbox token pattern in files
echo "Checking for Mapbox token pattern in build files..."
for pattern in "${TOKEN_CHECK_FILES[@]}"; do
  for file in $DIST_DIR/$pattern; do
    if [ -f "$file" ]; then
      token_matches=$(grep -o "$TOKEN_PATTERN" "$file" | wc -l)
      if [ "$token_matches" -gt 0 ]; then
        echo -e "${GREEN}✓ Found $token_matches token(s) in $(basename "$file")${NC}"
        token_found=true
        token_instances=$((token_instances + token_matches))
        token_files=$((token_files + 1))
        
        # Check token validity (length check)
        tokens=$(grep -o "$TOKEN_PATTERN" "$file")
        while IFS= read -r token; do
          token_length=${#token}
          if [ "$token_length" -ge "$MIN_TOKEN_LENGTH" ] && [ "$token_length" -le "$MAX_TOKEN_LENGTH" ]; then
            valid_token_count=$((valid_token_count + 1))
          else
            echo -e "${YELLOW}⚠ Token in $(basename "$file") has unusual length: $token_length chars${NC}"
          fi
        done <<< "$tokens"
      fi
    fi
  done
done

# 4. Verify that environment variables were correctly replaced
if [ "$CHECK_ENV_REPLACEMENT" = true ]; then
  echo "Checking for unresolved environment variables..."
  if grep -q "import\.meta\.env\.VITE_MAPBOX_TOKEN" "$DIST_DIR"/assets/*.js; then
    echo -e "${RED}✗ Found unresolved VITE_MAPBOX_TOKEN references in JS bundle${NC}"
  else
    echo -e "${GREEN}✓ No unresolved environment variables found${NC}"
  fi
fi

# Validation result
echo "-------------------------------------"
if [ "$token_found" = true ] && [ "$valid_token_count" -gt 0 ]; then
  echo -e "${GREEN}✅ Mapbox token verification passed:${NC}"
  echo "   - Token found in $token_files file(s)"
  echo "   - $token_instances total token instance(s)"
  echo "   - $valid_token_count valid token(s) found"
  echo "-------------------------------------"
  exit 0
else
  echo -e "${RED}❌ Mapbox token verification failed:${NC}"
  echo "   - Token found: $token_found"
  echo "   - Files with token: $token_files"
  echo "   - Total instances: $token_instances"
  echo "   - Valid tokens: $valid_token_count"
  echo "   - Please check that the Mapbox token is correctly set in .env.production"
  echo "   - Ensure the token is included in the build via HTML and/or JS"
  echo "-------------------------------------"
  exit 1
fi
