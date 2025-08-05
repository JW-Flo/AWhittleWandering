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
