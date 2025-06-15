#!/bin/bash
# validate-rename.sh
# Script to validate the project rename from 48Continental to AWhittleWandering

set -e

echo "========================================================="
echo "Project Rename Validation: 48Continental → AWhittleWandering"
echo "========================================================="

# Function to log operations
log_operation() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log_operation "Starting validation process"

# Define the root directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log_operation "Working in directory: $ROOT_DIR"

# Create a report file
REPORT_DIR="$ROOT_DIR/docs/rename-reports"
mkdir -p "$REPORT_DIR"
TIMESTAMP=$(date '+%Y%m%d-%H%M%S')
REPORT_FILE="$REPORT_DIR/validation-report-$TIMESTAMP.md"

# Start the report
cat > "$REPORT_FILE" << EOF
# Project Rename Validation Report

Date: $(date '+%Y-%m-%d %H:%M:%S')

## Validation Results
EOF

# Helper function to check for old references
check_for_references() {
  local pattern="$1"
  local description="$2"
  local exclude_pattern="$3"
  
  log_operation "Checking for $description"
  
  echo "### $description" >> "$REPORT_FILE"
  
  # Build the find command
  find_cmd="find . -type f"
  find_cmd+=" -not -path \"*/node_modules/*\""
  find_cmd+=" -not -path \"*/build/*\""
  find_cmd+=" -not -path \"*/dist/*\""
  find_cmd+=" -not -path \"*/.git/*\""
  
  # Add exclude pattern if provided
  if [ -n "$exclude_pattern" ]; then
    find_cmd+=" -not -path \"$exclude_pattern\""
  fi
  
  # Add the grep part
  grep_result=$($find_cmd | xargs grep -l "$pattern" 2>/dev/null || echo "")
  
  if [ -z "$grep_result" ]; then
    echo "✅ No instances found" >> "$REPORT_FILE"
  else
    echo "⚠️ Found instances in the following files:" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    echo "$grep_result" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
  fi
}

# Check for references to the old project name
check_for_references "48 Continental" "References to '48 Continental'" "*rename-reports/*"
check_for_references "48Continental" "References to '48Continental'" "*rename-reports/*"
check_for_references "48continental" "References to '48continental' (lowercase)" "*rename-reports/*"
check_for_references "48continental\.com" "References to '48continental.com' domain" "*rename-reports/*"

# Check for renamed directories
echo "### Directory Structure Check" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Check if old directories still exist
if [ -d "$ROOT_DIR/48Continental_Starter" ]; then
  echo "⚠️ Directory still exists: 48Continental_Starter" >> "$REPORT_FILE"
else
  echo "✅ Directory renamed: 48Continental_Starter" >> "$REPORT_FILE"
fi

if [ -d "$ROOT_DIR/48Continental" ]; then
  echo "⚠️ Directory still exists: 48Continental" >> "$REPORT_FILE"
else
  echo "✅ Directory renamed: 48Continental" >> "$REPORT_FILE"
fi

if [ -d "$ROOT_DIR/48 Continental" ]; then
  echo "⚠️ Directory still exists: 48 Continental" >> "$REPORT_FILE"
else
  echo "✅ Directory renamed: 48 Continental" >> "$REPORT_FILE"
fi

# Check if new directories exist
if [ -d "$ROOT_DIR/AWhittleWandering_Website" ]; then
  echo "✅ New directory exists: AWhittleWandering_Website" >> "$REPORT_FILE"
else
  echo "⚠️ New directory missing: AWhittleWandering_Website" >> "$REPORT_FILE"
fi

if [ -d "$ROOT_DIR/AWhittleWandering" ]; then
  echo "✅ New directory exists: AWhittleWandering" >> "$REPORT_FILE"
else
  echo "⚠️ New directory missing: AWhittleWandering" >> "$REPORT_FILE"
fi

# Check build configuration
echo "" >> "$REPORT_FILE"
echo "### Build Configuration Check" >> "$REPORT_FILE"

if [ -d "$ROOT_DIR/AWhittleWandering_Website/public-site" ]; then
  cd "$ROOT_DIR/AWhittleWandering_Website/public-site"
  
  echo "" >> "$REPORT_FILE"
  echo "#### Package.json Check" >> "$REPORT_FILE"
  
  if grep -q "48Continental\|48 Continental" package.json; then
    echo "⚠️ Found old references in package.json" >> "$REPORT_FILE"
    grep "48Continental\|48 Continental" package.json >> "$REPORT_FILE"
  else
    echo "✅ No old references in package.json" >> "$REPORT_FILE"
  fi
  
  echo "" >> "$REPORT_FILE"
  echo "#### Build Script Test" >> "$REPORT_FILE"
  
  # Try to run a build test without actually building
  if npm run build --dry-run > /dev/null 2>&1; then
    echo "✅ Build script executes without errors" >> "$REPORT_FILE"
  else
    echo "⚠️ Build script has errors" >> "$REPORT_FILE"
  fi
fi

# Check GitHub workflows
echo "" >> "$REPORT_FILE"
echo "### GitHub Workflows Check" >> "$REPORT_FILE"

if [ -d "$ROOT_DIR/.github/workflows" ]; then
  cd "$ROOT_DIR/.github/workflows"
  
  if grep -r "48Continental_Starter\|48Continental\|48 Continental" --include="*.yml" .; then
    echo "⚠️ Found old references in GitHub workflows" >> "$REPORT_FILE"
    grep -r "48Continental_Starter\|48Continental\|48 Continental" --include="*.yml" . >> "$REPORT_FILE"
  else
    echo "✅ No old references in GitHub workflows" >> "$REPORT_FILE"
  fi
fi

# Add summary to report
cat >> "$REPORT_FILE" << EOF

## Summary

- Date completed: $(date '+%Y-%m-%d %H:%M:%S')

## Recommendations

Based on the validation results, take the following actions:

1. Fix any remaining references to "48Continental" in files
2. Ensure all directories have been properly renamed
3. Test builds and deployments to verify functionality
4. Update any external references or documentation
EOF

# Display next steps
echo
echo "========================================================="
echo "Validation completed"
echo "========================================================="
echo
echo "Detailed report: $REPORT_FILE"
echo
echo "Review the report and address any issues found."
echo "========================================================="

exit 0
