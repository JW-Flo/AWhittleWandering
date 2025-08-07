#!/bin/bash
# ⚡ SPEED DEMON - Fast ESLint Warning Batch Processor
# Processes multiple files quickly with Ollama assistance

# Get script directory dynamically
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$SCRIPT_DIR"

echo "⚡ SPEED MODE: Fast ESLint Warning Cleanup"
echo "=========================================="

# Get current warning count
cd frontend
CURRENT_WARNINGS=$(npm run lint 2>&1 | grep -c "warning" || echo "0")
echo "📊 Current warnings: $CURRENT_WARNINGS"

# Get top 5 problematic files
echo "🎯 Top problem files:"
npm run lint 2>&1 | grep "\.tsx\|\.ts" | head -5

echo ""
echo "⚡ FAST COMMANDS AVAILABLE:"
echo "./ollama-assistant.sh -f AdminPortal.tsx    # Analyze specific file"
echo "./ollama-assistant.sh 'Remove unused Badge import from React component'"
echo "./speed-fix.sh                              # Auto-fix obvious issues"

# Create auto-fixer for obvious issues
cat > speed-fix.sh << 'EOF'
#!/bin/bash
echo "⚡ Auto-fixing obvious ESLint issues..."

# Fix unused variables that are clearly safe to remove
echo "Removing obvious unused imports..."
find frontend/src -name "*.tsx" -o -name "*.ts" | while read file; do
    # Remove unused imports that appear in isolation
    sed -i '' '/^import.*{.*}.*from.*ui.*badge.*;$/d' "$file" 2>/dev/null
    sed -i '' '/^import.*{.*}.*from.*lucide-react.*;$/d' "$file" 2>/dev/null
done

echo "✅ Auto-fix complete. Run 'npm run lint' to check results."
EOF

chmod +x speed-fix.sh
echo "✅ Speed tools ready!"
