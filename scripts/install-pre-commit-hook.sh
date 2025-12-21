#!/bin/bash
# Install pre-commit hook to prevent committing secrets

set -euo pipefail

HOOK_FILE=".git/hooks/pre-commit"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

if [ ! -d ".git" ]; then
    echo "❌ Error: Not a git repository"
    exit 1
fi

cat > "$HOOK_FILE" << 'HOOK_EOF'
#!/bin/bash
# Pre-commit hook to prevent committing secrets

# Check for common secret patterns
SECRET_PATTERNS=(
    "TESSIE_API_KEY=[^y][^o][^u]"
    "JWT_SECRET=[^r][^e][^p]"
    "MAPBOX_ACCESS_TOKEN=pk\.[a-zA-Z0-9]"
    "OPENWEATHER_API_KEY=[^y][^o][^u]"
    "API_KEY=[a-zA-Z0-9]{20,}"
    "SECRET=[a-zA-Z0-9]{20,}"
    "PASSWORD=[^p][^l][^a]"
)

FILES_TO_CHECK=$(git diff --cached --name-only --diff-filter=ACM)

for file in $FILES_TO_CHECK; do
    # Skip if file doesn't exist (deleted)
    [ ! -f "$file" ] && continue
    
    # Skip example files
    [[ "$file" == *.example ]] && continue
    [[ "$file" == *example* ]] && continue
    
    # Skip hook files and scripts that install hooks
    [[ "$file" == *"pre-commit"* ]] && continue
    [[ "$file" == *"install-pre-commit-hook"* ]] && continue
    
    # Check for secret patterns
    for pattern in "${SECRET_PATTERNS[@]}"; do
        if grep -qE "$pattern" "$file" 2>/dev/null; then
            echo "❌ ERROR: Potential secret detected in $file"
            echo "   Pattern matched: $pattern"
            echo ""
            echo "⚠️  SECURITY WARNING: Do not commit secrets!"
            echo "   - Use .example files for templates"
            echo "   - Store real secrets in Cloudflare Workers secrets"
            echo "   - Use .dev.vars (gitignored) for local development"
            echo ""
            echo "If this is a false positive, you can bypass with:"
            echo "  git commit --no-verify"
            exit 1
        fi
    done
    
    # Check for .dev.vars and .env files
    if [[ "$file" == *".dev.vars" ]] || [[ "$file" == *".env" ]] && [[ "$file" != *".example" ]]; then
        echo "❌ ERROR: Attempting to commit $file"
        echo ""
        echo "⚠️  SECURITY WARNING: Secret files should not be committed!"
        echo "   - $file is in .gitignore"
        echo "   - Use ${file}.example for templates"
        echo "   - Store real secrets in Cloudflare Workers secrets"
        echo ""
        exit 1
    fi
done

exit 0
HOOK_EOF

chmod +x "$HOOK_FILE"

echo "✅ Pre-commit hook installed successfully!"
echo ""
echo "The hook will now prevent committing:"
echo "  - Files matching secret patterns (API keys, secrets, etc.)"
echo "  - .dev.vars and .env files (unless they're .example files)"
echo ""
echo "To bypass (not recommended): git commit --no-verify"
