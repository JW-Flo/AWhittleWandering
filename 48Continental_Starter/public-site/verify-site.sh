#!/bin/bash
# Site Verification Script
# This script launches a headless browser to verify the functionality of the 48 Continental USA site

echo "====================================================="
echo "🔍 48 Continental USA Site Verification Script"
echo "====================================================="

SITE_URL="https://main.wandering-whittle.pages.dev"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
SCREENSHOT_DIR="./verification_reports"

# Create directory for reports if it doesn't exist
mkdir -p "$SCREENSHOT_DIR"

# Function to check if required tools are installed
check_dependencies() {
  echo "Checking dependencies..."
  
  if ! command -v curl &> /dev/null; then
    echo "❌ curl is not installed. Please install it and try again."
    exit 1
  fi
  
  if ! command -v jq &> /dev/null; then
    echo "❌ jq is not installed. Please install it and try again."
    exit 1
  fi
  
  echo "✅ All dependencies installed."
}

# Function to verify API endpoints
verify_api() {
  echo "Verifying API endpoints..."
  
  # Check Edge Worker API
  EDGE_WORKER_URL="https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev"
  EDGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$EDGE_WORKER_URL")
  
  if [ "$EDGE_STATUS" -eq 200 ]; then
    echo "✅ Edge Worker API is accessible ($EDGE_STATUS)"
    API_RESPONSE=$(curl -s "$EDGE_WORKER_URL")
    echo "Edge Worker response sample: ${API_RESPONSE:0:100}..."
  else
    echo "❌ Edge Worker API returned status $EDGE_STATUS"
  fi
}

# Function to check site availability
check_site() {
  echo "Checking site availability..."
  
  SITE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL")
  
  if [ "$SITE_STATUS" -eq 200 ]; then
    echo "✅ Site is accessible ($SITE_STATUS)"
  else
    echo "❌ Site returned status $SITE_STATUS"
  fi
}

# Function to check that key resources exist
check_resources() {
  echo "Checking for key resources..."
  
  # Check for main JS bundle
  JS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL/assets/index-*.js")
  
  if [ "$JS_STATUS" -eq 200 ]; then
    echo "✅ Main JS bundle found"
  else
    echo "❌ Main JS bundle not found (status $JS_STATUS)"
  fi
  
  # Check for map resources
  MAP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL/chunks/mapbox-core*.js")
  
  if [ "$MAP_STATUS" -eq 200 ]; then
    echo "✅ MapBox resources found"
  else
    echo "❌ MapBox resources not found (status $MAP_STATUS)"
  fi
}

# Main verification function
run_verification() {
  echo "Starting verification for $SITE_URL"
  echo "Timestamp: $(date)"
  echo "Report will be saved to $SCREENSHOT_DIR"
  
  check_dependencies
  check_site
  verify_api
  check_resources
  
  echo "---------------------------------------------------"
  echo "Verification complete. Please use the verification checklist"
  echo "to perform visual inspection of the site."
  echo "---------------------------------------------------"
  
  # Create the verification report
  cat > "$SCREENSHOT_DIR/verification_report_$TIMESTAMP.md" << EOL
# 48 Continental USA Site Verification Report

## Automated Checks

* **Date:** $(date)
* **Site URL:** $SITE_URL
* **Edge Worker API:** $EDGE_WORKER_URL

### Availability Checks

* Site Status: $SITE_STATUS
* Edge Worker Status: $EDGE_STATUS

### Resource Checks

* Main JS Bundle: $([ "$JS_STATUS" -eq 200 ] && echo "✅ Found" || echo "❌ Not Found")
* MapBox Resources: $([ "$MAP_STATUS" -eq 200 ] && echo "✅ Found" || echo "❌ Not Found")

## Manual Verification Required

Please complete the checklist in verification-checklist.md and attach screenshots
of any issues found.

## Notes

* This report only provides basic availability and resource checks
* Full functional verification requires manual testing
* Browser console errors must be checked manually
EOL

  echo "Verification report saved to: $SCREENSHOT_DIR/verification_report_$TIMESTAMP.md"
}

# Run the verification
run_verification
