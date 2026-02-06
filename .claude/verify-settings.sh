#!/bin/bash
# Claude Settings Integrity Verification Script
# This script verifies that .claude/settings.json has not been tampered with

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SETTINGS_FILE="${SCRIPT_DIR}/settings.json"
HASH_FILE="${SCRIPT_DIR}/settings.json.sha256"

if [ ! -f "$SETTINGS_FILE" ]; then
    echo "ERROR: Settings file not found at $SETTINGS_FILE"
    exit 1
fi

if [ ! -f "$HASH_FILE" ]; then
    echo "ERROR: Hash file not found at $HASH_FILE"
    exit 1
fi

# Verify the settings file integrity
if sha256sum -c "$HASH_FILE" --status 2>/dev/null; then
    echo "✓ Claude settings integrity verified successfully"
    exit 0
else
    echo "✗ SECURITY WARNING: Claude settings file has been modified!"
    echo "  Expected hash (from $HASH_FILE):"
    cat "$HASH_FILE"
    echo "  Current hash:"
    sha256sum "$SETTINGS_FILE"
    echo ""
    echo "  To restore trusted settings:"
    echo "    git checkout HEAD -- .claude/settings.json"
    echo ""
    echo "  To update settings securely:"
    echo "    1. Make changes to .claude/settings.json"
    echo "    2. Review changes carefully"
    echo "    3. Run: sha256sum .claude/settings.json > .claude/settings.json.sha256"
    echo "    4. Commit both files together"
    exit 1
fi
