#!/usr/bin/env bash
# AI Agent Configurations Integrity Verification Script
# This script verifies that all AI agent configuration files have not been tampered with

set -euo pipefail
IFS=$'\n\t'

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Detect platform and set appropriate SHA256 command
if command -v sha256sum >/dev/null 2>&1; then
    HASH_CHECK="sha256sum"
    HASH_GEN="sha256sum"
elif command -v shasum >/dev/null 2>&1; then
    HASH_CHECK="shasum"
    HASH_GEN="shasum"
else
    echo "ERROR: Neither sha256sum nor shasum found. Please install one of these utilities."
    exit 1
fi

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track verification results
ALL_PASSED=true
VERIFIED_COUNT=0
FAILED_COUNT=0

# Function to verify a single configuration directory
verify_config_dir() {
    local config_dir="$1"
    local config_name=$(basename "$config_dir")
    
    # Skip if directory doesn't exist
    if [ ! -d "$config_dir" ]; then
        echo -e "${YELLOW}⊘ Skipping $config_name (directory not found)${NC}"
        return 0
    fi
    
    # Check for verify script
    local verify_script="$config_dir/verify-settings.sh"
    if [ -f "$verify_script" ]; then
        echo -n "Verifying $config_name configuration... "
        if bash "$verify_script" >/dev/null 2>&1; then
            echo -e "${GREEN}✓ PASSED${NC}"
            ((VERIFIED_COUNT++))
        else
            echo -e "${RED}✗ FAILED${NC}"
            ((FAILED_COUNT++))
            ALL_PASSED=false
            bash "$verify_script" 2>&1 | sed 's/^/  /'
        fi
    else
        echo -e "${YELLOW}⊘ Skipping $config_name (no verification script)${NC}"
    fi
}

echo "=========================================="
echo "AI Agent Configuration Integrity Check"
echo "=========================================="
echo ""

# Verify each AI agent configuration directory
verify_config_dir "$REPO_ROOT/.claude"
verify_config_dir "$REPO_ROOT/.ai"
verify_config_dir "$REPO_ROOT/.cline"
verify_config_dir "$REPO_ROOT/.clinerules"

echo ""
echo "=========================================="
if [ "$ALL_PASSED" = true ]; then
    echo -e "${GREEN}✓ All checks passed ($VERIFIED_COUNT verified)${NC}"
    echo "=========================================="
    exit 0
else
    echo -e "${RED}✗ Integrity check failed ($FAILED_COUNT failed, $VERIFIED_COUNT passed)${NC}"
    echo "=========================================="
    exit 1
fi
