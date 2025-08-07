#!/bin/bash
# 🤖 AUTONOMOUS AI CODING AGENT
# Fully automated ESLint warning cleanup with no human intervention

# Get script directory dynamically
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE="$SCRIPT_DIR"
MODEL="phi3:latest"  # Fast and efficient for autonomous operations
AGENT_LOG="$WORKSPACE/agent-log.txt"
MAX_ITERATIONS=50
ITERATION=0

cd "$WORKSPACE"

# Initialize agent
echo "🤖 AUTONOMOUS CODING AGENT STARTING" | tee "$AGENT_LOG"
echo "Target: Clean all ESLint warnings autonomously" | tee -a "$AGENT_LOG"
echo "Model: $MODEL" | tee -a "$AGENT_LOG"
echo "Max iterations: $MAX_ITERATIONS" | tee -a "$AGENT_LOG"
echo "========================================" | tee -a "$AGENT_LOG"

# Main autonomous loop
while [ $ITERATION -lt $MAX_ITERATIONS ]; do
    ITERATION=$((ITERATION + 1))
    echo "🔄 ITERATION $ITERATION" | tee -a "$AGENT_LOG"
    
    # Get current state
    cd frontend
    WARNINGS=$(npm run lint 2>&1 | grep -c "warning" 2>/dev/null || echo "0")
    
    if [ "$WARNINGS" -eq 0 ]; then
        echo "🎉 SUCCESS: All warnings resolved!" | tee -a "$AGENT_LOG"
        echo "Agent completed task in $ITERATION iterations" | tee -a "$AGENT_LOG"
        break
    fi
    
    echo "📊 Current warnings: $WARNINGS" | tee -a "$AGENT_LOG"
    
    # Get next file to fix
    NEXT_FILE=$(npm run lint 2>&1 | grep -E "\.tsx?:" | head -1 | cut -d: -f1 | xargs basename)
    
    if [ -z "$NEXT_FILE" ]; then
        echo "❌ No files found to fix" | tee -a "$AGENT_LOG"
        break
    fi
    
    echo "🎯 Target file: $NEXT_FILE" | tee -a "$AGENT_LOG"
    
    # Call autonomous agent to fix the file
    ../autonomous-fixer.sh "$NEXT_FILE" | tee -a "$AGENT_LOG"
    
    # Validate changes
    if npm run build >/dev/null 2>&1; then
        echo "✅ Build still passes" | tee -a "$AGENT_LOG"
    else
        echo "❌ Build broken - reverting changes" | tee -a "$AGENT_LOG"
        git checkout HEAD -- "src/components/$NEXT_FILE"
    fi
    
    sleep 2  # Brief pause between iterations
done

echo "🏁 AGENT COMPLETED" | tee -a "$AGENT_LOG"
echo "Final warning count: $(npm run lint 2>&1 | grep -c "warning" 2>/dev/null || echo "0")" | tee -a "$AGENT_LOG"
