#!/bin/bash
# 🧠 INTELLIGENT MODEL LOAD BALANCER FOR TESLA APP
# Automatically selects optimal Ollama model based on task complexity

WORKSPACE="/Users/joe/Projects/Personal/ContinentalUSA"

# Task Classification Function
classify_task() {
    local task="$1"
    
    # Simple ESLint fixes - use fastest model
    if [[ "$task" =~ (unused|import|variable|console) ]]; then
        echo "phi3:latest"
    # TypeScript analysis - use balanced model
    elif [[ "$task" =~ (typescript|interface|type|any) ]]; then
        echo "gemma2:2b"
    # Complex refactoring - use coding specialist
    elif [[ "$task" =~ (refactor|architecture|complex|logic) ]]; then
        echo "codellama:7b"
    # Code review and validation - use most comprehensive
    elif [[ "$task" =~ (review|validate|quality|test) ]]; then
        echo "mistral:latest"
    # Default to balanced model
    else
        echo "gemma2:2b"
    fi
}

# Smart Query Function
smart_query() {
    local task="$1"
    local context="$2"
    
    # Classify task and select optimal model
    local selected_model=$(classify_task "$task")
    
    echo "🧠 Task: $task"
    echo "🎯 Selected Model: $selected_model"
    echo "─────────────────────────────────────────────────"
    
    # Execute with selected model
    ollama run "$selected_model" "$task $context"
}

# Model Health Check
check_model_availability() {
    echo "🔍 Checking model availability..."
    ollama list | while read -r line; do
        if [[ "$line" =~ ^(phi3|gemma|codellama|mistral) ]]; then
            echo "✅ $line"
        fi
    done
}

# Load Balancing Strategy for Tesla App
tesla_app_strategy() {
    echo "🚗 TESLA APP INTELLIGENT MODEL STRATEGY"
    echo "========================================"
    
    # Get current warning count
    cd "$WORKSPACE/frontend"
    local warning_count=$(npm run lint 2>&1 | grep -c "warning" || echo "0")
    
    echo "📊 Current ESLint warnings: $warning_count"
    
    # Strategy based on warning count
    if [ "$warning_count" -gt 100 ]; then
        echo "🎯 HIGH VOLUME STRATEGY:"
        echo "   • phi3:latest - Batch unused import removal"
        echo "   • gemma2:2b - TypeScript type fixes" 
        echo "   • codellama:7b - Complex refactoring"
        echo "   • mistral:latest - Final validation"
    elif [ "$warning_count" -gt 50 ]; then
        echo "🎯 MEDIUM VOLUME STRATEGY:"
        echo "   • gemma2:2b - Primary fixes"
        echo "   • codellama:7b - Complex cases"
        echo "   • mistral:latest - Validation"
    else
        echo "🎯 LOW VOLUME STRATEGY:"
        echo "   • gemma2:2b - All fixes"
        echo "   • mistral:latest - Final review"
    fi
}

# Parallel Processing for High Volume
parallel_processing() {
    echo "⚡ PARALLEL MODEL PROCESSING"
    echo "Using multiple models simultaneously for max speed..."
    
    # Simple fixes in parallel
    smart_query "Remove unused imports from React components" &
    smart_query "Fix TypeScript any types" &
    smart_query "Remove console.log statements" &
    
    wait # Wait for all parallel tasks to complete
    
    # Complex fixes sequentially
    smart_query "Fix React hook dependency arrays"
    smart_query "Validate all changes maintain functionality"
}

# Main execution
case "$1" in
    "check")
        check_model_availability
        ;;
    "strategy")
        tesla_app_strategy
        ;;
    "parallel")
        parallel_processing
        ;;
    "query")
        smart_query "$2" "$3"
        ;;
    *)
        echo "Usage: $0 {check|strategy|parallel|query 'task' 'context'}"
        echo ""
        echo "Examples:"
        echo "  $0 check                                    # Check model availability"
        echo "  $0 strategy                                 # Show Tesla app strategy"
        echo "  $0 parallel                                 # Run parallel processing"
        echo "  $0 query 'fix unused imports' 'React TSX'  # Smart query"
        ;;
esac
