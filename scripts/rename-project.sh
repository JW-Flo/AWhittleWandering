#!/bin/bash
# rename-project.sh
# Script to rename all occurrences of "48 Continental" to "AWhittleWandering"
# Created as part of the project rebrand effort

set -e

echo "========================================================="
echo "Project Rename Utility: 48 Continental → AWhittleWandering"
echo "========================================================="

# Function to log operations
log_operation() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log_operation "Starting rename operation"

# Define the root directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log_operation "Working in directory: $ROOT_DIR"

# Create a list of files to exclude from renaming
cat > /tmp/rename-exclude.txt << EOF
.git
node_modules
build
dist
.env
.DS_Store
rename-project.sh
rename-project-report.md
EOF

# Find all files excluding those in the exclude list and temp files
log_operation "Searching for files containing '48 Continental' or '48Continental'"
find . -type f \
  -not -path "*/node_modules/*" \
  -not -path "*/build/*" \
  -not -path "*/dist/*" \
  -not -path "*/.git/*" \
  -not -name ".env*" \
  -not -name ".DS_Store" \
  -not -name "rename-project.sh" \
  -not -name "rename-project-report.md" \
  | xargs grep -l -E '48 Continental|48Continental' 2>/dev/null > /tmp/files-to-rename.txt

FILE_COUNT=$(wc -l < /tmp/files-to-rename.txt)
log_operation "Found $FILE_COUNT files with references to rename"

# Create a report directory for the rename operation
REPORT_DIR="$ROOT_DIR/docs/rename-reports"
mkdir -p "$REPORT_DIR"
TIMESTAMP=$(date '+%Y%m%d-%H%M%S')
REPORT_FILE="$REPORT_DIR/rename-report-$TIMESTAMP.md"

# Start the report
cat > "$REPORT_FILE" << EOF
# Project Rename Report: 48 Continental → AWhittleWandering

Date: $(date '+%Y-%m-%d %H:%M:%S')

## Files Modified

| File Path | Occurrences | Status |
|-----------|-------------|--------|
EOF

# Process each file
TOTAL_REPLACED=0

while IFS= read -r file; do
  # Count occurrences before replacement
  OCCURRENCES=$(grep -E '48 Continental|48Continental' "$file" | wc -l)
  
  # Replace occurrences
  # 1. Replace "48 Continental" with "AWhittleWandering"
  # 2. Replace "48Continental" with "AWhittleWandering"
  # Handle special cases for URLs and domains
  sed -i'' -e 's/48 Continental/AWhittleWandering/g' \
           -e 's/48Continental/AWhittleWandering/g' \
           -e 's/48continental\.com/awhittlewandering.com/g' "$file"
  
  # Check if replacements were successful
  if [ $? -eq 0 ]; then
    STATUS="✅ Success"
    TOTAL_REPLACED=$((TOTAL_REPLACED + OCCURRENCES))
  else
    STATUS="❌ Failed"
  fi
  
  # Add to report
  echo "| $file | $OCCURRENCES | $STATUS |" >> "$REPORT_FILE"
  
  log_operation "Processed: $file ($OCCURRENCES occurrences)"
done < /tmp/files-to-rename.txt

# Add summary to report
cat >> "$REPORT_FILE" << EOF

## Summary

- Total files processed: $FILE_COUNT
- Total occurrences replaced: $TOTAL_REPLACED
- Date completed: $(date '+%Y-%m-%d %H:%M:%S')

## Next Steps

1. Verify the changes in each file
2. Update any directory names containing "48 Continental" or "48Continental"
3. Update deployment configurations
4. Test the application to ensure functionality remains intact
5. Update external references (documentation, URLs, etc.)
EOF

# Create a simplified report for quick reference
SIMPLE_REPORT="$ROOT_DIR/rename-project-report.md"
cat > "$SIMPLE_REPORT" << EOF
# Project Rename: 48 Continental → AWhittleWandering

- **Date:** $(date '+%Y-%m-%d')
- **Files Modified:** $FILE_COUNT
- **Occurrences Replaced:** $TOTAL_REPLACED
- **Detailed Report:** [View Report](${REPORT_FILE#$ROOT_DIR/})

## Critical Areas to Verify

1. Configuration files
2. API endpoints
3. Environment variables
4. Build scripts
5. Deployment workflows

## Manual Updates Required

1. Directory names (e.g., "48Continental_Starter" → "AWhittleWandering_Website")
2. Database references
3. External service configurations
4. CI/CD pipeline settings

For more details, see the complete report at: ${REPORT_FILE#$ROOT_DIR/}
EOF

# Display next steps
echo
echo "========================================================="
echo "Rename operation completed"
echo "========================================================="
echo "Files processed: $FILE_COUNT"
echo "References replaced: $TOTAL_REPLACED"
echo
echo "Detailed report: $REPORT_FILE"
echo "Summary report: $SIMPLE_REPORT"
echo
echo "NEXT STEPS:"
echo "1. Review the reports to verify all changes"
echo "2. Manually rename directories containing '48Continental'"
echo "3. Update deployment configurations"
echo "4. Test the application thoroughly"
echo "========================================================="

# Cleanup temporary files
rm /tmp/files-to-rename.txt /tmp/rename-exclude.txt

exit 0
