#!/bin/bash
# Script to automatically fix undefined visitedStates issue
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
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
JOURNEY_TAB_PATH="48Continental_Starter/public-site/src/components/JourneyTab.jsx"
FULL_PATH="${PROJECT_ROOT}/${JOURNEY_TAB_PATH}"
BACKUP_PATH="${FULL_PATH}.backup"

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

# Create a backup of the original file
create_backup() {
  log "STEP" "Creating backup of ${JOURNEY_TAB_PATH}"
  cp "${FULL_PATH}" "${BACKUP_PATH}"
  log "INFO" "Backup created at ${BACKUP_PATH}"
}

# Restore from backup if needed
restore_backup() {
  if [ -f "${BACKUP_PATH}" ]; then
    log "STEP" "Restoring from backup"
    cp "${BACKUP_PATH}" "${FULL_PATH}"
    log "INFO" "Restored from backup"
    return 0
  else
    log "ERROR" "No backup file found at ${BACKUP_PATH}"
    return 1
  fi
}

# Check if the file has the unsafe patterns
check_unsafe_patterns() {
  log "STEP" "Checking for unsafe patterns in ${JOURNEY_TAB_PATH}"
  
  # Check for unsafe access to visitedStates.length
  if grep -q "visitedStates.length" "${FULL_PATH}" && ! grep -q "visitedStates?.length" "${FULL_PATH}"; then
    log "INFO" "Found unsafe pattern: visitedStates.length"
    return 0
  fi
  
  log "INFO" "No unsafe patterns found in ${JOURNEY_TAB_PATH}"
  return 1
}

# Fix the file
fix_file() {
  log "STEP" "Fixing unsafe patterns in ${JOURNEY_TAB_PATH}"
  
  # Fix all instances of visitedStates.length to use optional chaining
  sed -i'.tmp' 's/visitedStates\.length/visitedStates?.length || 0/g' "${FULL_PATH}"
  
  # Fix all other unsafe access
  sed -i'.tmp' 's/visitedStates\[/visitedStates?.\[/g' "${FULL_PATH}"
  sed -i'.tmp' 's/visitedStates\.map/visitedStates?.map/g' "${FULL_PATH}"
  sed -i'.tmp' 's/visitedStates\.filter/visitedStates?.filter/g' "${FULL_PATH}"
  sed -i'.tmp' 's/visitedStates\.forEach/visitedStates?.forEach/g' "${FULL_PATH}"
  sed -i'.tmp' 's/visitedStates\.includes/visitedStates?.includes/g' "${FULL_PATH}"
  
  # Remove temp files
  rm -f "${FULL_PATH}.tmp"
  
  log "INFO" "Fixed unsafe patterns in ${JOURNEY_TAB_PATH}"
}

# Run automated tests to verify the fix
run_tests() {
  log "STEP" "Running tests to verify the fix"
  
  cd "${PROJECT_ROOT}/48Continental_Starter/public-site"
  npm test -- --run || {
    log "ERROR" "Tests failed. Rolling back changes."
    restore_backup
    return 1
  }
  
  log "INFO" "Tests passed. Fix verified."
  return 0
}

# Check if a commit is needed
check_and_commit() {
  cd "${PROJECT_ROOT}"
  
  if git diff --quiet "${JOURNEY_TAB_PATH}"; then
    log "INFO" "No changes to commit."
    return 0
  fi
  
  log "STEP" "Committing changes to ${JOURNEY_TAB_PATH}"
  
  git add "${JOURNEY_TAB_PATH}"
  git commit -m "fix: Add null checks to visitedStates in JourneyTab component" || {
    log "WARN" "Failed to commit changes. You may need to commit manually."
    return 1
  }
  
  log "INFO" "Changes committed successfully."
  return 0
}

# Main function
main() {
  log "INFO" "Starting visitedStates fix script"
  
  # Check if the file exists
  if [ ! -f "${FULL_PATH}" ]; then
    log "ERROR" "File not found: ${JOURNEY_TAB_PATH}"
    return 1
  fi
  
  # Check if fix is needed
  if ! check_unsafe_patterns; then
    log "INFO" "Fix not needed. Exiting."
    return 0
  fi
  
  # Create backup
  create_backup
  
  # Apply the fix
  fix_file
  
  # Run tests
  if ! run_tests; then
    log "ERROR" "Fix verification failed. Rolled back changes."
    return 1
  fi
  
  # Commit changes if successful
  check_and_commit
  
  log "INFO" "Fix completed successfully."
  return 0
}

# Run the main function
main

# Clean up backup file if script executed successfully
if [ $? -eq 0 ] && [ -f "${BACKUP_PATH}" ]; then
  log "STEP" "Cleaning up backup file"
  rm -f "${BACKUP_PATH}"
  log "INFO" "Backup file removed"
fi

exit $?
