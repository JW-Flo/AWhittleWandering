#!/bin/bash
# master-rename.sh
# Master script to execute the entire project renaming process
# from 48Continental to AWhittleWandering

set -e

echo "========================================================="
echo "MASTER RENAME PROCESS: 48Continental → AWhittleWandering"
echo "========================================================="

# Function to log operations
log_operation() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log_operation "Starting master rename process"

# Define the root directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log_operation "Working in directory: $ROOT_DIR"

# Create a master report file
TIMESTAMP=$(date '+%Y%m%d-%H%M%S')
REPORT_DIR="$ROOT_DIR/docs/rename-reports"
mkdir -p "$REPORT_DIR"
MASTER_REPORT="$REPORT_DIR/master-rename-report-$TIMESTAMP.md"

# Start the master report
cat > "$MASTER_REPORT" << EOF
# Master Rename Process Report: 48Continental → AWhittleWandering

Date: $(date '+%Y-%m-%d %H:%M:%S')

## Process Overview

This report documents the execution of the complete rename process.

## Phase Results

EOF

# Function to execute a phase and log results
execute_phase() {
  local phase_number="$1"
  local phase_name="$2"
  local command="$3"
  local phase_description="$4"
  
  echo
  echo "========================================================="
  echo "PHASE $phase_number: $phase_name"
  echo "========================================================="
  echo "$phase_description"
  echo
  
  # Update master report
  cat >> "$MASTER_REPORT" << EOF

### Phase $phase_number: $phase_name

$phase_description

EOF
  
  # Execute the command
  log_operation "Executing: $command"
  
  if eval "$command"; then
    STATUS="✅ SUCCESS"
  else
    STATUS="❌ FAILED"
    log_operation "ERROR: Phase $phase_number failed"
    
    # Update master report with failure
    cat >> "$MASTER_REPORT" << EOF
**Status: $STATUS**

Phase execution failed. Please review logs and address issues before continuing.
EOF
    
    echo
    echo "========================================================="
    echo "ERROR: Phase $phase_number ($phase_name) failed"
    echo "Please review the logs and fix issues before continuing"
    echo "========================================================="
    
    exit 1
  fi
  
  # Update master report with success
  cat >> "$MASTER_REPORT" << EOF
**Status: $STATUS**

Phase completed successfully. See detailed report for more information.
EOF
  
  log_operation "Phase $phase_number ($phase_name) completed successfully"
}

# Create a backup before starting
BACKUP_DIR="$ROOT_DIR/../ContinentalUSA_backup_$TIMESTAMP"
log_operation "Creating backup at: $BACKUP_DIR"

cp -R "$ROOT_DIR" "$BACKUP_DIR"
log_operation "Backup created successfully"

# Update master report with backup information
cat >> "$MASTER_REPORT" << EOF
## Backup

A complete backup of the repository was created at:
\`$BACKUP_DIR\`

This backup can be used to restore the repository if needed.
EOF

# Phase 1: Execute content replacement
execute_phase "1" "Content Replacement" \
  "$ROOT_DIR/scripts/rename-project.sh" \
  "Replace all text references from '48 Continental' and '48Continental' to 'AWhittleWandering'."

# Give the system a moment to settle
sleep 2

# Phase 2: Update GitHub workflows
execute_phase "2" "Update GitHub Workflows" \
  "$ROOT_DIR/scripts/update-github-workflows.sh" \
  "Update GitHub workflow files with new directory paths and project names."

# Give the system a moment to settle
sleep 2

# Phase 3: Rename directories
execute_phase "3" "Directory Rename" \
  "$ROOT_DIR/scripts/rename-directories.sh" \
  "Rename directories from '48Continental' naming to 'AWhittleWandering' naming."

# Give the system a moment to settle
sleep 2

# Phase 4: Validation
execute_phase "4" "Validation" \
  "$ROOT_DIR/scripts/validate-rename.sh" \
  "Validate the rename process to ensure all references have been updated."

# Add completion summary to master report
cat >> "$MASTER_REPORT" << EOF

## Completion Summary

The project rename from '48Continental' to 'AWhittleWandering' has been completed successfully.

### Next Steps

1. Review validation report for any remaining issues
2. Test the application to ensure functionality remains intact
3. Deploy the changes following the deployment strategy
4. Update any external references (documentation, URLs, etc.)
5. Monitor the application for any issues related to the rename

### Reports Generated

EOF

# Find all reports and add them to the master report
find "$REPORT_DIR" -name "*-report-*.md" -not -name "master-rename-report-*.md" | while read -r report; do
  report_name=$(basename "$report")
  echo "- [$report_name](./${report_name})" >> "$MASTER_REPORT"
done

# Final message
echo
echo "========================================================="
echo "RENAME PROCESS COMPLETED SUCCESSFULLY"
echo "========================================================="
echo
echo "Master report: $MASTER_REPORT"
echo
echo "NEXT STEPS:"
echo "1. Review validation report for any remaining issues"
echo "2. Test the application to ensure functionality remains intact"
echo "3. Deploy the changes following the deployment strategy"
echo "4. Update any external references (documentation, URLs, etc.)"
echo "5. Monitor the application for any issues related to the rename"
echo "========================================================="

exit 0
