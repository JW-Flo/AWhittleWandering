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
  # Build the find command as an array for safety
  find_args=(. -type f)
  find_args+=(-not -path "*/node_modules/*")
  find_args+=(-not -path "*/build/*")
  find_args+=(-not -path "*/dist/*")
  find_args+=(-not -path "*/.git/*")
  if [ -n "$exclude_pattern" ]; then
    find_args+=(-not -path "$exclude_pattern")
  fi
  grep_result=$(find "${find_args[@]}" -exec grep -l "$pattern" {} + 2>/dev/null || echo "")
  
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

# Check GitHub workflow status for recent commits
echo "### GitHub Workflow Status Check" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [ -f "$ROOT_DIR/scripts/github-workflow-status.sh" ]; then
  echo "Running GitHub workflow status check..." >> "$REPORT_FILE"
  echo "For detailed results, see the workflow status report." >> "$REPORT_FILE"
  
  # Set executable permission if needed
  chmod +x "$ROOT_DIR/scripts/github-workflow-status.sh"
  
  # Run the workflow status check script with limited scope for the validation report
  workflow_report=$("$ROOT_DIR/scripts/github-workflow-status.sh" --commits 3 --attempts 5 --interval 30)
  
  # Extract the report file path from the output
  report_path=$(echo "$workflow_report" | grep "Workflow status report:" | awk '{print $NF}')
  
  if [ -n "$report_path" ] && [ -f "$report_path" ]; then
    echo "✅ Workflow status report generated: $(basename "$report_path")" >> "$REPORT_FILE"
    echo "See the complete report for workflow status details." >> "$REPORT_FILE"
  else
    echo "⚠️ Unable to generate workflow status report" >> "$REPORT_FILE"
  fi
else
  echo "⚠️ GitHub workflow status check script not found" >> "$REPORT_FILE"
fi

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
  if bun run build --dry-run > /dev/null 2>&1; then
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
