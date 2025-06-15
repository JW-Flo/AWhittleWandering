#!/bin/bash

# Codex Agent Setup Script
# This script runs at the start of every task after repo cloning

# Simple color formatting
GREEN="\033[0;32m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

echo -e "${BLUE}=== Codex Agent Setup ===${NC}"

# Create basic working directories if they don't exist
mkdir -p workspace
mkdir -p .cache

# Install or update any required dependencies
echo -e "${BLUE}Checking dependencies...${NC}"
npm install --quiet --no-fund

# Setup environment variables from secrets
# These are assumed to be already available in the environment
echo -e "${BLUE}Checking environment variables...${NC}"
required_vars=("OPENAI_API_KEY" "ANTHROPIC_API_KEY")
missing_vars=0

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ $var is not set"
    missing_vars=$((missing_vars+1))
  else
    echo "✅ $var is available"
  fi
done

# Ensure app is ready for use
echo -e "${BLUE}Preparing workspace...${NC}"

# Clean any temporary files from previous runs
rm -rf .tmp/* 2>/dev/null || true

# Create system directories if necessary
mkdir -p logs
mkdir -p data

# Set file permissions
chmod -R 755 scripts/ 2>/dev/null || true

echo -e "${GREEN}✅ Setup complete. Agent ready for task.${NC}"

# Return success
exit 0
