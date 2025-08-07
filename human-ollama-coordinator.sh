#!/bin/bash

# 🤖 DIRECT OLLAMA MODEL COORDINATION FOR TESLA APP CLEANUP
# Uses available models: phi3:latest, gemma3:4b, codellama:7b, mistral:latest

# Get script directory dynamically
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK_DIR="$SCRIPT_DIR/frontend"

echo "🚀 HUMAN-OLLAMA COORDINATED CODE CLEANUP"
echo "Target: 240 → <50 ESLint warnings"
echo ""

# Helper function to query Ollama models
query_model() {
    local model=$1
    local prompt=$2
    curl -s http://localhost:11434/api/generate -d "{\"model\": \"$model\", \"prompt\": \"$prompt\", \"stream\": false}" | jq -r '.response'
}

echo "Phase 1: Identify files needing React Hook dependency fixes"
cd $WORK_DIR

# Get specific files with hook issues
echo "Files with React Hook dependency issues:"
npx eslint . --format=json 2>/dev/null | jq -r '.[] | select(.messages[] | .ruleId == "react-hooks/exhaustive-deps") | .filePath' | sed "s|$WORK_DIR/||" | sort | uniq

echo ""
echo "Phase 2: Quick fixes with Human guidance + Ollama validation"
echo "✅ AdventureCsvUploader.tsx - Fixed onMapDataAvailable dependency"

echo ""
echo "Phase 3: Remaining target files for coordination:"
echo "- EnhancedTeslaMap.tsx (multiple hook issues)"
echo "- JourneyDashboard.tsx (unnecessary dependencies)"  
echo "- TeslaMap.tsx (missing dependency)"
echo "- SystemHealthMonitor.tsx (missing dependency)"

echo ""
echo "🎯 RECOMMENDED HUMAN-OLLAMA WORKFLOW:"
echo "1. Human: Fix complex logic & architecture issues"
echo "2. Ollama phi3: Remove unused imports/variables (fast pattern recognition)"
echo "3. Ollama gemma3: Fix TypeScript any types (type system expertise)"
echo "4. Human: Validate functionality & commit strategic chunks"

echo ""
echo "Ready for coordinated execution! 🤖⚡"
