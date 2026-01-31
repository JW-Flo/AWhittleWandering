#!/usr/bin/env bash
# =============================================================================
# Task Type Classifier
# =============================================================================
# Intelligently detects task type from goal to route to appropriate handlers.
# Supports: implementation, research, review/analysis, UI improvement, mixed
#
# Usage: bash ops/task-type-classifier.sh "task goal"
# Output: JSON with task type and routing information
# =============================================================================

set -euo pipefail

# Configuration
TASK_GOAL="${1:-}"

# Logging
log() { echo "[classifier] $*" >&2; }

# =============================================================================
# Task Type Detection
# =============================================================================

detect_task_type() {
    local goal="$1"
    local primary_type="implementation"  # default
    local secondary_types=()
    local confidence="medium"
    local requires_research=false
    local requires_analysis=false
    local produces_code=true
    local produces_docs=false
    
    # Convert to lowercase for matching
    local goal_lower=$(echo "$goal" | tr '[:upper:]' '[:lower:]')
    
    # Research indicators
    if echo "$goal_lower" | grep -qE '\b(research|investigate|explore|study|learn|compare|evaluate|find out)\b'; then
        primary_type="research"
        requires_research=true
        produces_docs=true
        confidence="high"
    fi
    
    # Review/Analysis indicators
    if echo "$goal_lower" | grep -qE '\b(review|analyze|audit|assess|examine|identify|determine|find|check)\b'; then
        if [[ "$primary_type" == "research" ]]; then
            secondary_types+=("analysis")
        else
            primary_type="analysis"
        fi
        requires_analysis=true
        produces_docs=true
        confidence="high"
    fi
    
    # Improvement indicators (often requires research + implementation)
    if echo "$goal_lower" | grep -qE '\b(improve|enhance|optimize|better|upgrade|modernize)\b'; then
        if [[ "$primary_type" == "implementation" ]]; then
            primary_type="improve"
            requires_research=true
            requires_analysis=true
            produces_code=true
            produces_docs=true
        else
            secondary_types+=("improve")
        fi
        confidence="high"
    fi
    
    # UI/UX specific
    if echo "$goal_lower" | grep -qE '\b(ui|ux|user interface|user experience|design|accessibility|responsive|mobile)\b'; then
        secondary_types+=("ui-ux")
        produces_code=true
    fi
    
    # Infrastructure/automation specific
    if echo "$goal_lower" | grep -qE '\b(workflow|github action|pr|pull request|merge|wrangler|cloudflare|deploy|ci|cd)\b'; then
        secondary_types+=("infrastructure")
        produces_code=true
        if [[ "$primary_type" == "implementation" ]]; then
            primary_type="infrastructure"
        fi
    fi
    
    # Implementation indicators (explicit)
    if echo "$goal_lower" | grep -qE '\b(fix|add|implement|create|build|update|refactor|remove|delete)\b'; then
        if [[ "$primary_type" != "research" ]] && [[ "$primary_type" != "analysis" ]]; then
            primary_type="implementation"
            produces_code=true
        else
            secondary_types+=("implementation")
        fi
    fi
    
    # Platform/deployment specific
    if echo "$goal_lower" | grep -qE '\b(deploy|deployment|pipeline|ci|cd|platform|infrastructure|failure)\b'; then
        secondary_types+=("platform")
        requires_analysis=true
    fi
    
    # PR/Git management specific
    if echo "$goal_lower" | grep -qE '\b(pr|pull request|merge|branch|git|github)\b'; then
        secondary_types+=("git-ops")
    fi
    
    # Vague request detection
    local is_vague=false
    if echo "$goal_lower" | grep -qE '\b(make|help|something|somehow|better)\b' && [ ${#goal} -lt 50 ]; then
        is_vague=true
        confidence="low"
    fi
    
    # Complex multi-part request
    local is_complex=false
    if [ ${#secondary_types[@]} -gt 1 ] || [[ "$requires_research" == "true" && "$produces_code" == "true" ]]; then
        is_complex=true
    fi
    
    # Determine appropriate handler/subagent
    local handler="standard"
    local subagents=()
    
    case "$primary_type" in
        research)
            handler="research"
            subagents+=("research-agent")
            if echo "$goal_lower" | grep -qE '\b(implement|build|add)\b'; then
                subagents+=("standard-agent")
            fi
            ;;
        analysis)
            handler="analysis"
            subagents+=("platform-analyst")
            if echo "$goal_lower" | grep -qE '\b(deploy|ci|pipeline)\b'; then
                subagents+=("cloudflare-auditor")
            fi
            ;;
        improve)
            handler="multi-phase"
            subagents+=("research-agent" "platform-analyst")
            if [[ " ${secondary_types[*]} " =~ " ui-ux " ]]; then
                subagents+=("ui-ux-agent")
            fi
            subagents+=("standard-agent")
            ;;
        infrastructure)
            handler="infrastructure"
            subagents+=("infrastructure-agent")
            if [[ " ${secondary_types[*]} " =~ " platform " ]]; then
                subagents+=("cloudflare-auditor")
            fi
            ;;
        implementation)
            handler="standard"
            if [[ " ${secondary_types[*]} " =~ " ui-ux " ]]; then
                subagents+=("ui-ux-agent")
            fi
            if [[ " ${secondary_types[*]} " =~ " infrastructure " ]]; then
                subagents+=("infrastructure-agent")
            fi
            ;;
    esac
    
    # Determine output expectations
    local output_type="code"
    if [[ "$produces_docs" == "true" ]] && [[ "$produces_code" == "false" ]]; then
        output_type="report"
    elif [[ "$produces_docs" == "true" ]] && [[ "$produces_code" == "true" ]]; then
        output_type="both"
    fi
    
    # Execution strategy
    local execution_strategy="single-phase"
    if [[ "$is_complex" == "true" ]] || [[ "$handler" == "multi-phase" ]]; then
        execution_strategy="multi-phase"
    fi
    
    # Risk assessment for complex tasks
    local default_risk="medium"
    if [[ "$primary_type" == "research" ]] || [[ "$primary_type" == "analysis" ]]; then
        default_risk="low"  # Analysis/research tasks don't change code initially
    elif [[ "$primary_type" == "improve" ]]; then
        default_risk="medium"  # Improvements touch multiple areas
    fi
    
    # Output as JSON
    local secondary_json="[]"
    if [ ${#secondary_types[@]} -gt 0 ] && [ -n "${secondary_types[0]}" ]; then
        secondary_json=$(printf '%s\n' "${secondary_types[@]}" | jq -R . | jq -s .)
    fi
    
    local subagents_json="[]"
    if [ ${#subagents[@]} -gt 0 ] && [ -n "${subagents[0]}" ]; then
        subagents_json=$(printf '%s\n' "${subagents[@]}" | jq -R . | jq -s .)
    fi
    
    jq -n \
        --arg primary "$primary_type" \
        --argjson secondary "$secondary_json" \
        --arg confidence "$confidence" \
        --argjson research "$requires_research" \
        --argjson analysis "$requires_analysis" \
        --argjson code "$produces_code" \
        --argjson docs "$produces_docs" \
        --arg handler "$handler" \
        --argjson subagents "$subagents_json" \
        --arg output "$output_type" \
        --arg strategy "$execution_strategy" \
        --argjson vague "$is_vague" \
        --argjson complex "$is_complex" \
        --arg risk "$default_risk" \
        '{
            task_type: {
                primary: $primary,
                secondary: $secondary,
                confidence: $confidence
            },
            requirements: {
                research: $research,
                analysis: $analysis,
                produces_code: $code,
                produces_documentation: $docs
            },
            routing: {
                handler: $handler,
                subagents: $subagents,
                execution_strategy: $strategy
            },
            output: {
                expected_type: $output,
                location_code: "working branch",
                location_docs: "docs/analysis/ or docs/research/"
            },
            characteristics: {
                is_vague: $vague,
                is_complex: $complex,
                suggested_risk: $risk
            }
        }'
}

# =============================================================================
# Task Complexity Scorer
# =============================================================================

score_complexity() {
    local goal="$1"
    local score=1  # base score
    
    # Length indicates complexity
    local word_count=$(wc -w <<< "$goal")
    if [ "$word_count" -gt 20 ]; then
        ((score++))
    fi
    if [ "$word_count" -gt 50 ]; then
        ((score++))
    fi
    
    # Multiple verbs indicate multi-step
    local verb_count=$(grep -oiE '\b(fix|add|update|research|review|analyze|improve)\b' <<< "$goal" | wc -l)
    if [ "$verb_count" -gt 2 ]; then
        ((score++))
    fi
    
    # Explicit phases
    if grep -qiE '\b(then|after|next|finally|first|second)\b' <<< "$goal"; then
        ((score++))
    fi
    
    # Output: simple (1-2), moderate (3-4), complex (5+)
    if [ "$score" -le 2 ]; then
        echo "simple"
    elif [ "$score" -le 4 ]; then
        echo "moderate"
    else
        echo "complex"
    fi
}

# =============================================================================
# Main
# =============================================================================

main() {
    if [ -z "$TASK_GOAL" ]; then
        echo "Usage: $0 \"task goal\"" >&2
        exit 1
    fi
    
    log "Classifying task type..."
    
    # Detect task type
    local classification=$(detect_task_type "$TASK_GOAL")
    
    # Score complexity
    local complexity=$(score_complexity "$TASK_GOAL")
    
    # Combine results
    echo "$classification" | jq --arg complexity "$complexity" '. + {complexity: $complexity}'
    
    # Log summary
    local primary=$(echo "$classification" | jq -r '.task_type.primary')
    local handler=$(echo "$classification" | jq -r '.routing.handler')
    log "Type: $primary, Handler: $handler, Complexity: $complexity"
}

# Run if executed directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi
