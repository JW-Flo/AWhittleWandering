#!/bin/bash

# 🤖 DYAD PROGRESS MONITOR
# Tracks ESLint warning cleanup progress and provides feedback

echo "🎯 TESLA APP CODE CLEANUP - PROGRESS MONITOR"
echo "=============================================="

# Get script directory dynamically
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Get current warning count
cd "$SCRIPT_DIR/frontend"
CURRENT_WARNINGS=$(npm run lint 2>&1 | grep -c "warning" || echo "0")

echo "📊 Current ESLint Warnings: $CURRENT_WARNINGS"
echo "🎯 Target: 0 warnings"
echo "✅ Completed: AdminPortal.tsx (19 warnings fixed)"

# Check if Dyad has made progress on target files
echo ""
echo "🔍 NEXT TARGET FILES STATUS:"

# Check AdvancedTeslaMap.tsx
echo "1. AdvancedTeslaMap.tsx:"
if npx eslint src/components/AdvancedTeslaMap.tsx 2>&1 | grep -q "warning"; then
    WARNINGS=$(npx eslint src/components/AdvancedTeslaMap.tsx 2>&1 | grep -c "warning")
    echo "   ⚠️  $WARNINGS warnings remaining"
else
    echo "   ✅ CLEAN - No warnings!"
fi

# Check AdventureCsvUploader.tsx  
echo "2. AdventureCsvUploader.tsx:"
if npx eslint src/components/AdventureCsvUploader.tsx 2>&1 | grep -q "warning"; then
    WARNINGS=$(npx eslint src/components/AdventureCsvUploader.tsx 2>&1 | grep -c "warning")
    echo "   ⚠️  $WARNINGS warnings remaining"
else
    echo "   ✅ CLEAN - No warnings!"
fi

# Check ApiTest.tsx
echo "3. ApiTest.tsx:"
if npx eslint src/components/ApiTest.tsx 2>&1 | grep -q "warning"; then
    WARNINGS=$(npx eslint src/components/ApiTest.tsx 2>&1 | grep -c "warning")
    echo "   ⚠️  $WARNINGS warnings remaining"
else
    echo "   ✅ CLEAN - No warnings!"
fi

echo ""
echo "📝 INSTRUCTIONS FOR DYAD:"
echo "1. Read: $SCRIPT_DIR/DYAD_INSTRUCTIONS.md"
echo "2. Start with: AdvancedTeslaMap.tsx"
echo "3. Report progress after each file"

# Update timestamp
echo ""
echo "⏰ Last checked: $(date)"
echo "🤖 Monitored by: GitHub Copilot"
