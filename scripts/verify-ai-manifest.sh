#!/usr/bin/env bash
# Verify integrity of all AI agent configuration files against manifest

set -euo pipefail
IFS=$'\n\t'

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MANIFEST_FILE="$REPO_ROOT/.ai-configs.manifest.sha256"

# Detect platform and set appropriate SHA256 command
if command -v sha256sum >/dev/null 2>&1; then
    HASH_CHECK="sha256sum"
elif command -v shasum >/dev/null 2>&1; then
    HASH_CHECK="shasum"
else
    echo "ERROR: Neither sha256sum nor shasum found."
    exit 1
fi

if [ ! -f "$MANIFEST_FILE" ]; then
    echo "ERROR: Manifest file not found at $MANIFEST_FILE"
    echo "Run scripts/generate-ai-manifest.sh to create it"
    exit 1
fi

cd "$REPO_ROOT"

echo "Verifying AI agent configuration integrity..."

# Verify the manifest
if [ "$HASH_CHECK" = "sha256sum" ]; then
    if sha256sum -c "$MANIFEST_FILE" >/dev/null 2>&1; then
        FILE_COUNT=$(wc -l < "$MANIFEST_FILE")
        echo "✓ All $FILE_COUNT AI configuration files verified successfully"
        exit 0
    fi
elif [ "$HASH_CHECK" = "shasum" ]; then
    if shasum -a 256 -c "$MANIFEST_FILE" >/dev/null 2>&1; then
        FILE_COUNT=$(wc -l < "$MANIFEST_FILE")
        echo "✓ All $FILE_COUNT AI configuration files verified successfully"
        exit 0
    fi
fi

# If we get here, verification failed
echo "✗ SECURITY WARNING: AI configuration files have been modified!"
echo ""
echo "Running detailed check..."
if [ "$HASH_CHECK" = "sha256sum" ]; then
    sha256sum -c "$MANIFEST_FILE" 2>&1 | grep "FAILED" || true
else
    shasum -a 256 -c "$MANIFEST_FILE" 2>&1 | grep "FAILED" || true
fi

echo ""
echo "To restore trusted configurations:"
echo "  git checkout HEAD -- .claude .ai .cline .clinerules"
echo ""
echo "To update configurations securely:"
echo "  1. Make your changes"
echo "  2. Review changes carefully"
echo "  3. Run: bash scripts/generate-ai-manifest.sh"
echo "  4. Commit all files together"
exit 1
