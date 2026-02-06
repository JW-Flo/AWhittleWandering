#!/usr/bin/env bash
# Generate integrity manifest for all AI agent configuration files

set -euo pipefail
IFS=$'\n\t'

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MANIFEST_FILE="$REPO_ROOT/.ai-configs.manifest.sha256"

# Detect platform and set appropriate SHA256 command
if command -v sha256sum >/dev/null 2>&1; then
    HASH_CMD="sha256sum"
elif command -v shasum >/dev/null 2>&1; then
    HASH_CMD="shasum -a 256"
else
    echo "ERROR: Neither sha256sum nor shasum found."
    exit 1
fi

echo "Generating AI configuration integrity manifest..."
cd "$REPO_ROOT"

# Clear or create manifest
> "$MANIFEST_FILE"

# Hash .claude/settings.json specifically
if [ -f ".claude/settings.json" ]; then
    $HASH_CMD ".claude/settings.json" >> "$MANIFEST_FILE"
fi

# Hash all .ai configuration files
find .ai -type f \( -name "*.md" -o -name "*.json" -o -name "*.yml" -o -name "*.yaml" \) 2>/dev/null | sort | while read -r file; do
    $HASH_CMD "$file" >> "$MANIFEST_FILE"
done

# Hash all .cline configuration files
find .cline -type f \( -name "*.md" -o -name "*.json" -o -name "*.yml" -o -name "*.yaml" \) 2>/dev/null | sort | while read -r file; do
    $HASH_CMD "$file" >> "$MANIFEST_FILE"
done

# Hash all .clinerules configuration files (excluding binary files)
find .clinerules -type f \( -name "*.md" -o -name "*.json" -o -name "*.yml" -o -name "*.yaml" -o -name "*.sh" \) 2>/dev/null | sort | while read -r file; do
    $HASH_CMD "$file" >> "$MANIFEST_FILE"
done

# Also hash the hook files without extensions in .clinerules/hooks
find .clinerules/hooks -type f ! -name "*.sh" 2>/dev/null | sort | while read -r file; do
    $HASH_CMD "$file" >> "$MANIFEST_FILE"
done

echo "✓ Manifest generated: $MANIFEST_FILE"
echo "  $(wc -l < "$MANIFEST_FILE") files hashed"
