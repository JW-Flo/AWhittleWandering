#!/bin/bash
# rename-directories.sh
# Script to rename directories from "48Continental" to "AWhittleWandering"
# Must be run after the content replacement script (rename-project.sh)

set -e

echo "========================================================="
echo "Directory Rename Utility: 48Continental → AWhittleWandering"
echo "========================================================="

# Function to log operations
log_operation() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log_operation "Starting directory rename operation"

# Define the root directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log_operation "Working in directory: $ROOT_DIR"

# Create a report file
REPORT_DIR="$ROOT_DIR/docs/rename-reports"
mkdir -p "$REPORT_DIR"
TIMESTAMP=$(date '+%Y%m%d-%H%M%S')
REPORT_FILE="$REPORT_DIR/directory-rename-report-$TIMESTAMP.md"

# Start the report
cat > "$REPORT_FILE" << EOF
# Directory Rename Report: 48Continental → AWhittleWandering

Date: $(date '+%Y-%m-%d %H:%M:%S')

## Directories Renamed

| Original Path | New Path | Status |
|---------------|----------|--------|
EOF

# Function to safely rename directories and log the result
rename_directory() {
    local source="$1"
    local target="$2"
    
    if [ -d "$source" ]; then
        log_operation "Renaming: $source → $target"
        
        # Create a backup first
        backup_dir="${source}_backup_$(date '+%Y%m%d%H%M%S')"
        cp -R "$source" "$backup_dir"
        log_operation "Backup created: $backup_dir"
        
        # Perform the rename
        mv "$source" "$target"
        
        if [ $? -eq 0 ]; then
            STATUS="✅ Success"
            echo "| $source | $target | $STATUS |" >> "$REPORT_FILE"
        else
            STATUS="❌ Failed"
            echo "| $source | $target | $STATUS |" >> "$REPORT_FILE"
            log_operation "ERROR: Failed to rename directory"
            return 1
        fi
    else
        log_operation "WARNING: Directory not found: $source"
        echo "| $source | $target | ⚠️ Source not found |" >> "$REPORT_FILE"
    fi
}

# Perform directory renames in the correct order
log_operation "Starting directory renames"

# Rename the project starter directory
rename_directory "$ROOT_DIR/48Continental_Starter" "$ROOT_DIR/AWhittleWandering_Website"

# Rename other directories
rename_directory "$ROOT_DIR/48Continental" "$ROOT_DIR/AWhittleWandering"
rename_directory "$ROOT_DIR/48 Continental" "$ROOT_DIR/AWhittleWandering_Legacy"

# Add summary to report
cat >> "$REPORT_FILE" << EOF

## Summary

- Date completed: $(date '+%Y-%m-%d %H:%M:%S')

## Next Steps

1. Update all import statements referring to the old directory paths
2. Update build configurations and workflow files
3. Verify the application builds and runs correctly
4. Update deployment configurations
EOF

# Display next steps
echo
echo "========================================================="
echo "Directory rename operation completed"
echo "========================================================="
echo
echo "Detailed report: $REPORT_FILE"
echo
echo "NEXT STEPS:"
echo "1. Update all import statements referring to the old directory paths"
echo "2. Update build configurations and workflow files"
echo "3. Verify the application builds and runs correctly"
echo "4. Update deployment configurations"
echo "========================================================="

exit 0
