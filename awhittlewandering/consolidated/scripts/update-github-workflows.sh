#!/bin/bash
# update-github-workflows.sh
# Updates GitHub workflow files with new directory paths and environment variables
# after renaming the project from 48Continental to AWhittleWandering

set -e

echo "========================================================="
echo "GitHub Workflows Update: 48Continental → AWhittleWandering"
echo "========================================================="

# Function to log operations
log_operation() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log_operation "Starting GitHub workflow updates"

# Define the root directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

WORKFLOWS_DIR="$ROOT_DIR/.github/workflows"

# Check if workflows directory exists
if [ ! -d "$WORKFLOWS_DIR" ]; then
    log_operation "ERROR: GitHub workflows directory not found: $WORKFLOWS_DIR"
    exit 1
fi

log_operation "Working in workflows directory: $WORKFLOWS_DIR"

# Create a report file
REPORT_DIR="$ROOT_DIR/docs/rename-reports"
mkdir -p "$REPORT_DIR"
TIMESTAMP=$(date '+%Y%m%d-%H%M%S')
REPORT_FILE="$REPORT_DIR/workflows-update-report-$TIMESTAMP.md"

# Start the report
cat > "$REPORT_FILE" << EOF
# GitHub Workflows Update Report

Date: $(date '+%Y-%m-%d %H:%M:%S')

## Files Updated

| File | Changes | Status |
|------|---------|--------|
EOF

# Process each workflow file
TOTAL_FILES=0
TOTAL_UPDATED=0

for workflow_file in "$WORKFLOWS_DIR"/*.yml; do
    if [ -f "$workflow_file" ]; then
        TOTAL_FILES=$((TOTAL_FILES + 1))
        FILE_NAME=$(basename "$workflow_file")
        
        log_operation "Processing workflow file: $FILE_NAME"
        
        # Create backup
        cp "$workflow_file" "${workflow_file}.bak"
        
        # Make replacements
        CHANGES=0
        
        # Replace directory references
        sed -i'' -e 's|48Continental_Starter/public-site|AWhittleWandering_Website/public-site|g' "$workflow_file"
        if [ $? -eq 0 ]; then
            PATH_CHANGES=$(diff "${workflow_file}.bak" "$workflow_file" | grep -c "48Continental_Starter/public-site" || true)
            CHANGES=$((CHANGES + PATH_CHANGES))
        fi
        
        # Replace environment variable defaults
        sed -i'' -e "s|48continental_secure_key|awhittlewandering_secure_key|g" "$workflow_file"
        if [ $? -eq 0 ]; then
            ENV_CHANGES=$(diff "${workflow_file}.bak" "$workflow_file" | grep -c "48continental_secure_key" || true)
            CHANGES=$((CHANGES + ENV_CHANGES))
        fi
        
        # Replace project names in comments and step names
        sed -i'' -e 's|48 Continental|AWhittleWandering|g' -e 's|48Continental|AWhittleWandering|g' "$workflow_file"
        if [ $? -eq 0 ]; then
            NAME_CHANGES=$(diff "${workflow_file}.bak" "$workflow_file" | grep -E -c "48 Continental|48Continental" || true)
            CHANGES=$((CHANGES + NAME_CHANGES))
        fi
        
        # Check if any changes were made
        if [ $CHANGES -gt 0 ]; then
            STATUS="✅ Updated ($CHANGES changes)"
            TOTAL_UPDATED=$((TOTAL_UPDATED + 1))
        else
            STATUS="ℹ️ No changes needed"
        fi
        
        echo "| $FILE_NAME | $CHANGES | $STATUS |" >> "$REPORT_FILE"
        log_operation "$STATUS in $FILE_NAME"
    fi
done

# Add summary to report
cat >> "$REPORT_FILE" << EOF

## Summary

- Total workflow files: $TOTAL_FILES
- Files updated: $TOTAL_UPDATED
- Date completed: $(date '+%Y-%m-%d %H:%M:%S')

## Next Steps

1. Verify workflow files by running test builds
2. Update related CI/CD configurations in other systems
3. Update documentation references
EOF

# Display next steps
echo
echo "========================================================="
echo "GitHub workflow updates completed"
echo "========================================================="
echo "Files processed: $TOTAL_FILES"
echo "Files updated: $TOTAL_UPDATED"
echo
echo "Detailed report: $REPORT_FILE"
echo
echo "NEXT STEPS:"
echo "1. Verify workflow files by running test builds"
echo "2. Update related CI/CD configurations in other systems"
echo "3. Update documentation references"
echo "========================================================="

# Cleanup temporary backup files
find "$WORKFLOWS_DIR" -name "*.yml.bak" -exec rm {} \;

exit 0
