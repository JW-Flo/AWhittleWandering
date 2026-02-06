#!/usr/bin/env bash
# Claude Settings Integrity Verification Script
# This script verifies that .claude/settings.json has not been tampered with

set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SETTINGS_FILE="${SCRIPT_DIR}/settings.json"
HASH_FILE="${SCRIPT_DIR}/settings.json.sha256"

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

if [ ! -f "$SETTINGS_FILE" ]; then
    echo "ERROR: Settings file not found at $SETTINGS_FILE"
    exit 1
fi

if [ ! -f "$HASH_FILE" ]; then
    echo "ERROR: Hash file not found at $HASH_FILE"
    exit 1
fi

# Change to script directory for verification
cd "$SCRIPT_DIR"

# Verify the settings file integrity
if [ "$HASH_CHECK" = "sha256sum" ]; then
    if sha256sum -c "settings.json.sha256" >/dev/null 2>&1; then
        echo "✓ Claude settings integrity verified successfully"
        exit 0
    fi
elif [ "$HASH_CHECK" = "shasum" ]; then
    if shasum -a 256 -c "settings.json.sha256" >/dev/null 2>&1; then
        echo "✓ Claude settings integrity verified successfully"
        exit 0
    fi
fi

# If we get here, verification failed
echo "✗ SECURITY WARNING: Claude settings file has been modified!"
echo "  Expected hash (from $HASH_FILE):"
cat "$HASH_FILE"
echo "  Current hash:"
if [ "$HASH_GEN" = "sha256sum" ]; then
    sha256sum "settings.json"
else
    shasum -a 256 "settings.json"
fi
echo ""
echo "  To restore trusted settings:"
echo "    git checkout HEAD -- .claude/settings.json"
echo ""
echo "  To update settings securely:"
echo "    1. Make changes to .claude/settings.json"
echo "    2. Review changes carefully"
if [ "$HASH_GEN" = "sha256sum" ]; then
    echo "    3. Run: cd .claude && sha256sum settings.json > settings.json.sha256"
else
    echo "    3. Run: cd .claude && shasum -a 256 settings.json > settings.json.sha256"
fi
echo "    4. Commit both files together"
exit 1
