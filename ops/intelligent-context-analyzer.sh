#!/usr/bin/env bash
# =============================================================================
# Intelligent Context Analyzer
# =============================================================================
# This script automatically discovers context for a task based on minimal input.
# It uses various techniques to gather information without requiring manual input.
#
# Usage: bash ops/intelligent-context-analyzer.sh "task goal"
# Output: JSON with discovered context
# =============================================================================

set -euo pipefail

# Configuration
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TASK_GOAL="${1:-}"

# Logging
log() { echo "[context-analyzer] $*" >&2; }
log_debug() { [[ "${DEBUG:-}" == "1" ]] && echo "[context-analyzer] DEBUG: $*" >&2 || true; }

# =============================================================================
# Natural Language Processing for Goal Parsing
# =============================================================================

parse_goal_keywords() {
    local goal="$1"
    
    # Extract key information from natural language
    local keywords=()
    local file_hints=()
    local action=""
    local component=""
    
    # Detect action verbs
    if echo "$goal" | grep -qiE '\b(fix|repair|resolve|debug)\b'; then
        action="fix"
    elif echo "$goal" | grep -qiE '\b(add|implement|create|build)\b'; then
        action="add"
    elif echo "$goal" | grep -qiE '\b(update|modify|change|refactor)\b'; then
        action="update"
    elif echo "$goal" | grep -qiE '\b(remove|delete|drop)\b'; then
        action="remove"
    elif echo "$goal" | grep -qiE '\b(optimize|improve|enhance)\b'; then
        action="optimize"
    fi
    
    # Extract file/path hints from goal
    if echo "$goal" | grep -qiE '[a-zA-Z0-9_-]+\.(ts|js|tsx|jsx|py|go|java|md|yml|yaml|json)'; then
        file_hints+=($(echo "$goal" | grep -oE '[a-zA-Z0-9_/-]+\.(ts|js|tsx|jsx|py|go|java|md|yml|yaml|json)'))
    fi
    
    # Extract component hints
    if echo "$goal" | grep -qiE '\b(api|endpoint|route)\b'; then
        component="api"
    elif echo "$goal" | grep -qiE '\b(auth|authentication|login)\b'; then
        component="auth"
    elif echo "$goal" | grep -qiE '\b(ui|interface|component|button|form)\b'; then
        component="ui"
    elif echo "$goal" | grep -qiE '\b(database|db|schema|migration)\b'; then
        component="database"
    elif echo "$goal" | grep -qiE '\b(test|spec|unit test)\b'; then
        component="test"
    elif echo "$goal" | grep -qiE '\b(doc|documentation|readme)\b'; then
        component="docs"
    fi
    
    # Extract error/issue hints
    local has_error=false
    if echo "$goal" | grep -qiE '\b(error|exception|bug|issue|crash|fail)\b'; then
        has_error=true
    fi
    
    # Output as JSON
    jq -n \
        --arg action "$action" \
        --arg component "$component" \
        --argjson has_error "$has_error" \
        --argjson file_hints "$(printf '%s\n' "${file_hints[@]}" | jq -R . | jq -s .)" \
        '{action: $action, component: $component, has_error: $has_error, file_hints: $file_hints}'
}

# =============================================================================
# Semantic Code Search
# =============================================================================

search_relevant_files() {
    local goal="$1"
    local parsed_info="$2"
    
    local component=$(echo "$parsed_info" | jq -r '.component')
    local action=$(echo "$parsed_info" | jq -r '.action')
    local file_hints=($(echo "$parsed_info" | jq -r '.file_hints[]'))
    
    local relevant_paths=()
    
    # If file hints provided, use them
    if [ ${#file_hints[@]} -gt 0 ]; then
        for hint in "${file_hints[@]}"; do
            if find "$REPO_ROOT" -name "$hint" 2>/dev/null | grep -q .; then
                relevant_paths+=($(find "$REPO_ROOT" -name "$hint" 2>/dev/null | head -5))
            fi
        done
    fi
    
    # Search based on component
    case "$component" in
        api)
            relevant_paths+=($(find "$REPO_ROOT" -path "*/routes/*.ts" -o -path "*/api/*.ts" 2>/dev/null | head -10))
            ;;
        auth)
            relevant_paths+=($(find "$REPO_ROOT" -path "*/auth/*.ts" -o -path "*/middleware/auth*.ts" 2>/dev/null | head -10))
            ;;
        ui)
            relevant_paths+=($(find "$REPO_ROOT" -path "*/components/*.tsx" -o -path "*/components/*.jsx" 2>/dev/null | head -10))
            ;;
        database)
            relevant_paths+=($(find "$REPO_ROOT" -path "*/migrations/*.sql" -o -path "*/schema/*.ts" 2>/dev/null | head -10))
            ;;
        test)
            relevant_paths+=($(find "$REPO_ROOT" -path "*/tests/*.ts" -o -path "*/*.test.ts" -o -path "*/*.spec.ts" 2>/dev/null | head -10))
            ;;
        docs)
            relevant_paths+=($(find "$REPO_ROOT" -name "*.md" -not -path "*node_modules*" 2>/dev/null | head -10))
            ;;
    esac
    
    # Use ripgrep for keyword search if available
    if command -v rg &>/dev/null; then
        local keywords=$(echo "$goal" | tr ' ' '\n' | grep -E '^[a-zA-Z]{4,}$' | head -5)
        for keyword in $keywords; do
            rg -l "$keyword" "$REPO_ROOT" 2>/dev/null | head -5 | while read -r file; do
                relevant_paths+=("$file")
            done
        done
    fi
    
    # Remove duplicates and repo root prefix
    printf '%s\n' "${relevant_paths[@]}" | sort -u | sed "s|^$REPO_ROOT/||" | head -20
}

# =============================================================================
# Git History Analysis
# =============================================================================

analyze_recent_changes() {
    local goal="$1"
    local parsed_info="$2"
    
    cd "$REPO_ROOT"
    
    local component=$(echo "$parsed_info" | jq -r '.component')
    local recent_files=()
    
    # Get recently changed files related to component
    case "$component" in
        api)
            recent_files=($(git log --since="1 month ago" --name-only --pretty=format: | grep -E '(routes|api)/' | sort -u | head -10))
            ;;
        auth)
            recent_files=($(git log --since="1 month ago" --name-only --pretty=format: | grep -E 'auth' | sort -u | head -10))
            ;;
        *)
            recent_files=($(git log --since="1 week ago" --name-only --pretty=format: | grep -vE '^$' | sort -u | head -20))
            ;;
    esac
    
    # Get recent commit messages that might be related
    local related_commits=$(git log --since="1 month ago" --oneline --all --grep="$component" 2>/dev/null | head -5 || echo "")
    
    # Output as JSON
    jq -n \
        --argjson files "$(printf '%s\n' "${recent_files[@]}" | jq -R . | jq -s .)" \
        --arg commits "$related_commits" \
        '{recent_files: $files, related_commits: $commits}'
}

# =============================================================================
# Error Pattern Detection
# =============================================================================

detect_error_context() {
    local goal="$1"
    
    # Extract error messages, stack traces, line numbers
    local error_msg=""
    local line_number=""
    local file_name=""
    
    # Look for line numbers (e.g., "line 42", "L42", ":42")
    if echo "$goal" | grep -qE '\b[lL]ine\s+[0-9]+\b'; then
        line_number=$(echo "$goal" | grep -oE '\b[lL]ine\s+[0-9]+\b' | grep -oE '[0-9]+' | head -1)
    elif echo "$goal" | grep -qE ':[0-9]+\b'; then
        line_number=$(echo "$goal" | grep -oE ':[0-9]+\b' | grep -oE '[0-9]+' | head -1)
    fi
    
    # Look for error keywords
    if echo "$goal" | grep -qiE '(TypeError|ReferenceError|SyntaxError|Error|Exception)'; then
        error_msg=$(echo "$goal" | grep -oE '[A-Z][a-z]+Error:.*' | head -1)
    fi
    
    jq -n \
        --arg error "$error_msg" \
        --arg line "$line_number" \
        --arg file "$file_name" \
        '{error_message: $error, line_number: $line, file_name: $file}'
}

# =============================================================================
# Risk Level Auto-Detection
# =============================================================================

auto_detect_risk_level() {
    local parsed_info="$1"
    local relevant_files="$2"
    
    local component=$(echo "$parsed_info" | jq -r '.component')
    local action=$(echo "$parsed_info" | jq -r '.action')
    local has_error=$(echo "$parsed_info" | jq -r '.has_error')
    
    local risk="medium"  # Default
    
    # Low risk scenarios
    if [[ "$component" == "docs" ]]; then
        risk="low"
    elif [[ "$action" == "fix" ]] && [[ "$has_error" == "true" ]]; then
        # Bug fixes are often medium risk
        risk="medium"
    elif echo "$relevant_files" | grep -qE '(auth|security|migration)'; then
        # Security-related changes are high risk
        risk="high"
    elif echo "$relevant_files" | grep -qE '\.md$' && ! echo "$relevant_files" | grep -qvE '\.md$'; then
        # Only markdown files = low risk
        risk="low"
    fi
    
    # Check file count
    local file_count=$(echo "$relevant_files" | wc -l)
    if [ "$file_count" -gt 10 ]; then
        risk="high"
    elif [ "$file_count" -le 3 ] && [[ "$risk" != "high" ]]; then
        risk="low"
    fi
    
    echo "$risk"
}

# =============================================================================
# Branch Selection Logic
# =============================================================================

auto_select_branch() {
    local risk="$1"
    local component="$2"
    
    local branch="dev"  # Default
    
    # High-risk or production changes should target specific branches
    if [[ "$risk" == "high" ]]; then
        branch="dev"  # Start in dev for high-risk
    elif [[ "$component" == "docs" ]]; then
        branch="main"  # Docs can go straight to main
    else
        branch="dev"
    fi
    
    # Check if branches exist
    cd "$REPO_ROOT"
    if git show-ref --verify --quiet refs/heads/"$branch" || git show-ref --verify --quiet refs/remotes/origin/"$branch"; then
        echo "$branch"
    else
        echo "main"  # Fallback to main if branch doesn't exist
    fi
}

# =============================================================================
# Test File Discovery
# =============================================================================

discover_test_files() {
    local relevant_files="$1"
    
    local test_files=()
    
    # For each relevant file, try to find corresponding test file
    while IFS= read -r file; do
        [ -z "$file" ] && continue
        
        # Remove extension and try common test patterns
        local base="${file%.*}"
        local dir=$(dirname "$file")
        local name=$(basename "$base")
        
        # Check for test files
        if [ -f "${dir}/${name}.test.ts" ]; then
            test_files+=("${dir}/${name}.test.ts")
        elif [ -f "${dir}/${name}.spec.ts" ]; then
            test_files+=("${dir}/${name}.spec.ts")
        elif [ -f "${dir}/__tests__/${name}.test.ts" ]; then
            test_files+=("${dir}/__tests__/${name}.test.ts")
        fi
    done <<< "$relevant_files"
    
    printf '%s\n' "${test_files[@]}" | sort -u
}

# =============================================================================
# Main Analysis Function
# =============================================================================

analyze_task() {
    local goal="$1"
    
    log "Analyzing task: $goal"
    
    # Step 1: Parse goal with NLP
    log_debug "Parsing goal keywords..."
    local parsed_info=$(parse_goal_keywords "$goal")
    log_debug "Parsed info: $parsed_info"
    
    # Step 2: Search for relevant files
    log_debug "Searching for relevant files..."
    local relevant_files=$(search_relevant_files "$goal" "$parsed_info")
    local file_count=$(echo "$relevant_files" | grep -c '[^[:space:]]' || echo "0")
    log_debug "Found $file_count relevant files"
    
    # Step 3: Analyze git history
    log_debug "Analyzing git history..."
    local history_info=$(analyze_recent_changes "$goal" "$parsed_info")
    
    # Step 4: Detect error context
    log_debug "Detecting error context..."
    local error_info=$(detect_error_context "$goal")
    
    # Step 5: Auto-detect risk level
    log_debug "Auto-detecting risk level..."
    local risk_level=$(auto_detect_risk_level "$parsed_info" "$relevant_files")
    log "Auto-detected risk level: $risk_level"
    
    # Step 6: Select target branch
    local component=$(echo "$parsed_info" | jq -r '.component')
    local target_branch=$(auto_select_branch "$risk_level" "$component")
    log "Auto-selected branch: $target_branch"
    
    # Step 7: Discover test files
    log_debug "Discovering test files..."
    local test_files=""
    if [ -n "$relevant_files" ]; then
        test_files=$(discover_test_files "$relevant_files")
    fi
    
    # Compile comprehensive context
    local context_summary="Auto-discovered context:

Component: $component
Risk Level: $risk_level
Target Branch: $target_branch

Relevant Files:"
    
    if [ -n "$relevant_files" ]; then
        context_summary="$context_summary
$(echo "$relevant_files" | head -10 | sed 's/^/  - /')"
    else
        context_summary="$context_summary
  (No specific files identified - agent will search)"
    fi
    
    if [ -n "$test_files" ]; then
        context_summary="$context_summary

Test Files:
$(echo "$test_files" | sed 's/^/  - /')"
    fi
    
    # Output complete analysis as JSON
    jq -n \
        --arg goal "$goal" \
        --arg risk "$risk_level" \
        --arg branch "$target_branch" \
        --argjson parsed "$parsed_info" \
        --argjson history "$history_info" \
        --argjson error "$error_info" \
        --arg files "$relevant_files" \
        --arg tests "$test_files" \
        --arg summary "$context_summary" \
        '{
            goal: $goal,
            risk_level: $risk,
            target_branch: $branch,
            parsed_info: $parsed,
            history_context: $history,
            error_context: $error,
            relevant_files: ($files | split("\n") | map(select(length > 0))),
            test_files: ($tests | split("\n") | map(select(length > 0))),
            context_summary: $summary
        }'
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    if [ -z "$TASK_GOAL" ]; then
        echo "Usage: $0 \"task goal\"" >&2
        echo "Example: $0 \"Fix the null pointer error in the user validator\"" >&2
        exit 1
    fi
    
    # Run analysis
    local result=$(analyze_task "$TASK_GOAL")
    
    # Output result
    echo "$result"
    
    # Log summary to stderr
    log "Analysis complete"
    log "$(echo "$result" | jq -r '.context_summary')"
}

# Run if executed directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi
