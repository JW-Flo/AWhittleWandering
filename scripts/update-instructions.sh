#!/bin/bash
# update-instructions.sh
# Script to update the project instructions with CI/CD monitoring information

set -e

# Function to log operations
log_operation() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Define the root directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log_operation "Working in directory: $ROOT_DIR"

# Check if the instructions file exists
INSTRUCTIONS_FILE="$ROOT_DIR/README.md"
if [ ! -f "$INSTRUCTIONS_FILE" ]; then
  log_operation "Instructions file not found at $INSTRUCTIONS_FILE"
  exit 1
fi

log_operation "Updating instructions file with CI/CD monitoring information"

# Add the CI/CD monitoring section to the instructions file if it doesn't exist
if ! grep -q "CI/CD Monitoring" "$INSTRUCTIONS_FILE"; then
  cat >> "$INSTRUCTIONS_FILE" << EOF

## CI/CD Monitoring

The project includes a GitHub Workflow Status Checker that recursively monitors CI/CD pipeline status after commits:

- Automatically checks workflow status for multiple commits
- Generates detailed reports with workflow outcomes
- Provides real-time feedback on build, test, and deployment processes
- Integrates with the MCP server for comprehensive monitoring

For detailed instructions, see [CI/CD Monitoring Instructions](./docs/ci-cd-monitoring-instructions.md)
EOF

  log_operation "CI/CD monitoring section added to the instructions file"
else
  log_operation "CI/CD monitoring section already exists in the instructions file"
fi

# Make both scripts executable
chmod +x "$ROOT_DIR/scripts/github-workflow-status.sh"
chmod +x "$ROOT_DIR/scripts/validate-rename.sh"

log_operation "Scripts made executable"
log_operation "Instructions update completed"
