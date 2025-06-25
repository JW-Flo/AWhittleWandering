#!/bin/bash

# Repository Validation Script
# Validates the repository structure and basic functionality

set -e

echo "🔍 Validating A Whittle Wandering Repository"
echo "============================================"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✓${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }

ERRORS=0

# Check required files
echo ""
echo "Checking required files..."

REQUIRED_FILES=(
    "README.md"
    "CONTRIBUTING.md"
    "CHANGELOG.md"
    "LICENSE"
    "package.json"
    ".gitignore"
    ".env.example"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_status "Found: $file"
    else
        print_error "Missing: $file"
        ((ERRORS++))
    fi
done

# Check directory structure
echo ""
echo "Checking directory structure..."

EXPECTED_DIRS=(
    "docs"
    "scripts"
    "shared"
    ".github"
    "edge-worker"
    "awhittlewandering"
    "mcp-server"
)

for dir in "${EXPECTED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        print_status "Found directory: $dir"
    else
        print_warning "Directory not found: $dir (may be optional)"
    fi
done

# Check for sensitive data
echo ""
echo "Checking for sensitive data..."

if grep -r "pk\.eyJ" . --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null | grep -v ".example" | grep -v "CONTRIBUTING.md" | grep -v "README.md"; then
    print_error "Found potential Mapbox tokens in code!"
    ((ERRORS++))
else
    print_status "No exposed Mapbox tokens found"
fi

if grep -r "sk-" . --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null | grep -v ".example"; then
    print_error "Found potential OpenAI API keys in code!"
    ((ERRORS++))
else
    print_status "No exposed OpenAI API keys found"
fi

# Check package.json files
echo ""
echo "Checking package.json files..."

find . -name "package.json" -not -path "./node_modules/*" | while read -r pkg; do
    if [ -f "$pkg" ]; then
        if jq empty "$pkg" 2>/dev/null; then
            print_status "Valid JSON: $pkg"
        else
            print_error "Invalid JSON: $pkg"
            ((ERRORS++))
        fi
    fi
done

# Check .env files for actual credentials
echo ""
echo "Checking .env files..."

find . -name ".env" -not -path "./node_modules/*" | while read -r envfile; do
    if grep -E "(pk\.eyJ|sk-|[A-Za-z0-9]{32,})" "$envfile" 2>/dev/null | grep -v "your_.*_here" >/dev/null; then
        print_warning "Potential credentials found in: $envfile"
        print_warning "Please ensure this file is in .gitignore and not committed"
    else
        print_status "Clean .env file: $envfile"
    fi
done

# Final report
echo ""
echo "📊 Validation Summary"
echo "===================="

if [ $ERRORS -eq 0 ]; then
    print_status "Repository validation passed! ✨"
    echo ""
    echo "🚀 Repository is ready for sharing!"
    echo "Next steps:"
    echo "  1. Run './setup-dev.sh' to set up development environment"
    echo "  2. Follow CONTRIBUTING.md for development guidelines"
    echo "  3. Check individual components for specific setup instructions"
    exit 0
else
    print_error "Repository validation failed with $ERRORS errors"
    echo ""
    echo "Please fix the errors above before sharing the repository."
    exit 1
fi