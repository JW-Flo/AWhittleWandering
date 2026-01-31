#!/usr/bin/env bash
# =============================================================================
# GitHub Copilot Agent Integration
# =============================================================================
# This script integrates GitHub Copilot coding agent with the Codex task runner.
# It provides the bridge between task-runner workflow and Copilot agent execution.
#
# Usage: Called by ops/task-runner.sh
# Environment variables expected:
#   - ISSUE_NUMBER: GitHub issue number
#   - TASK_GOAL: Goal from task definition
#   - WORK_BRANCH: Working branch name
#   - GH_TOKEN: GitHub token
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_OWNER="${GITHUB_REPOSITORY_OWNER:-JW-Flo}"
REPO_NAME="${GITHUB_REPOSITORY##*/}"
REPO_NAME="${REPO_NAME:-AWhittleWandering}"

# Logging
log() { echo "[copilot-agent] $*"; }
log_error() { echo "[copilot-agent] ❌ ERROR: $*" >&2; }
log_success() { echo "[copilot-agent] ✅ $*"; }
log_warn() { echo "[copilot-agent] ⚠️  $*"; }

# =============================================================================
# Copilot Agent Invocation via GitHub API
# =============================================================================

invoke_copilot_agent() {
    local issue_number="$1"
    local task_goal="$2"
    
    log "Invoking GitHub Copilot agent for issue #${issue_number}..."
    
    # Check if GH CLI is available
    if ! command -v gh &> /dev/null; then
        log_error "GitHub CLI (gh) is not installed"
        return 1
    fi
    
    # Validate authentication
    if ! gh auth status &> /dev/null; then
        log_error "Not authenticated with GitHub CLI"
        return 1
    fi
    
    # Get discovered context if available
    local context_info=""
    if [ -n "${DISCOVERED_CONTEXT:-}" ]; then
        log "Using auto-discovered context..."
        context_info=$(echo "$DISCOVERED_CONTEXT" | jq -r '.context_summary // ""')
    fi
    
    # The GitHub Copilot agent can be triggered in multiple ways:
    # 1. Via @copilot mention in issue comments
    # 2. Via GitHub Copilot workspace integration
    # 3. Via direct API calls (when available)
    
    # For now, we use the issue comment method as it's most reliable
    log "Posting enhanced agent trigger comment to issue #${issue_number}..."
    
    # Create a comprehensive prompt for the agent with auto-discovered context
    local agent_prompt
    # Use quoted EOF to prevent variable expansion and injection attacks
    read -r -d '' agent_prompt <<'EOF' || true
@copilot Please implement the following task:

**Goal:** TASK_GOAL_PLACEHOLDER

CONTEXT_INFO_PLACEHOLDER

**Instructions:**
1. Analyze the codebase to understand the relevant components
2. Implement the necessary changes following best practices
3. Ensure all changes are minimal and focused
4. Add appropriate error handling
5. Update any related documentation
6. Ensure changes pass linting and type checking

**Verification:**
After implementation, run:
- `npm run lint` (if applicable)
- `npm run typecheck` (if applicable)
- `npm test` (if applicable)

**Security:**
- Do NOT include any secrets or credentials
- Validate all external inputs
- Follow security best practices

Please proceed with the implementation.
EOF
    
    # Safely substitute variables after HEREDOC using printf for safer handling
    # This prevents injection even if variables contain special characters
    local safe_task_goal
    safe_task_goal=$(printf '%s' "$task_goal")
    agent_prompt="${agent_prompt//TASK_GOAL_PLACEHOLDER/$safe_task_goal}"
    
    if [ -n "$context_info" ]; then
        local safe_context_info
        safe_context_info=$(printf '%s' "$context_info")
        local context_section="**Auto-Discovered Context:**
$safe_context_info
"
        agent_prompt="${agent_prompt//CONTEXT_INFO_PLACEHOLDER/$context_section}"
    else
        agent_prompt="${agent_prompt//CONTEXT_INFO_PLACEHOLDER/}"
    fi

    # Post the comment to trigger Copilot
    if gh issue comment "${issue_number}" \
        --repo "${REPO_OWNER}/${REPO_NAME}" \
        --body "${agent_prompt}"; then
        log_success "Enhanced agent prompt posted to issue #${issue_number}"
    else
        log_error "Failed to post agent prompt"
        return 1
    fi
    
    log "Note: The Copilot agent will process this request and create a PR"
    log "This workflow will detect the PR creation and continue the automation"
    
    return 0
}

# =============================================================================
# Wait for Agent Response
# =============================================================================

wait_for_agent_response() {
    local issue_number="$1"
    local max_wait_seconds="${2:-300}"  # Default 5 minutes
    local check_interval=10
    local elapsed=0
    
    log "Waiting for Copilot agent response (max ${max_wait_seconds}s)..."
    
    while [ $elapsed -lt $max_wait_seconds ]; do
        # Check if agent has responded (look for bot comments)
        # GitHub Copilot bot can use different login names: copilot, github-copilot[bot], copilot[bot]
        if gh issue view "${issue_number}" \
            --repo "${REPO_OWNER}/${REPO_NAME}" \
            --json comments \
            --jq '.comments[] | select(.author.login | test("copilot|github-copilot"; "i")) | .body' \
            | grep -qi "work\|processing\|implement\|started"; then
            log_success "Agent acknowledged the task"
            return 0
        fi
        
        sleep $check_interval
        elapsed=$((elapsed + check_interval))
        log "Waiting... (${elapsed}/${max_wait_seconds}s)"
    done
    
    log_warn "Timeout waiting for agent response (this is OK, agent may still be processing)"
    return 1
}

# =============================================================================
# Check for Agent-Created PR
# =============================================================================

check_for_agent_pr() {
    local issue_number="$1"
    
    log "Checking for PR created by Copilot agent..."
    
    # Look for PRs that reference this issue
    # Try multiple bot usernames as GitHub may use different identifiers
    # Note: GitHub Copilot typically uses "github-actions[bot]" or "copilot[bot]"
    # The actual username depends on how the GitHub App is configured
    local pr_number=""
    local bot_names=("github-actions[bot]" "copilot[bot]" "github-copilot[bot]" "copilot")
    
    for bot_name in "${bot_names[@]}"; do
        pr_number=$(gh pr list \
            --repo "${REPO_OWNER}/${REPO_NAME}" \
            --search "in:body #${issue_number}" \
            --author "$bot_name" \
            --state open \
            --json number \
            --jq '.[0].number' 2>/dev/null || echo "")
        
        if [ -n "$pr_number" ] && [ "$pr_number" != "null" ]; then
            log_success "Found agent PR #${pr_number} (author: ${bot_name})"
            echo "$pr_number"
            return 0
        fi
    done
    
    log "No agent PR found yet (tried: ${bot_names[*]})"
    return 1
}

# =============================================================================
# Alternative: Direct Code Generation
# =============================================================================
# If Copilot agent API is not available, we can generate code changes directly

generate_code_changes() {
    local task_goal="$1"
    
    log "Generating code changes for task..."
    log_warn "Note: This is a fallback mechanism"
    log_warn "For best results, use GitHub Copilot agent via @copilot mention"
    
    # This would be where we'd call OpenAI API directly if needed
    # But the preferred method is using GitHub's Copilot agent
    
    log "Task goal: ${task_goal}"
    log "Repository: ${REPO_OWNER}/${REPO_NAME}"
    log "Branch: ${WORK_BRANCH:-main}"
    
    # Placeholder for direct implementation
    # In production, this would:
    # 1. Analyze the codebase
    # 2. Generate appropriate changes
    # 3. Apply them to the working branch
    
    log "Direct code generation is not yet implemented"
    log "Please ensure GitHub Copilot agent is enabled for this repository"
    
    return 1
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    log "=== GitHub Copilot Agent Integration ==="
    
    # Validate required environment variables
    if [ -z "${ISSUE_NUMBER:-}" ]; then
        log_error "ISSUE_NUMBER environment variable is required"
        exit 1
    fi
    
    if [ -z "${TASK_GOAL:-}" ]; then
        log_error "TASK_GOAL environment variable is required"
        exit 1
    fi
    
    log "Issue: #${ISSUE_NUMBER}"
    log "Goal: ${TASK_GOAL}"
    
    # Invoke the Copilot agent
    if invoke_copilot_agent "${ISSUE_NUMBER}" "${TASK_GOAL}"; then
        log_success "Copilot agent invoked successfully"
        
        # Wait for acknowledgment (optional)
        # This step can be skipped if you want immediate return
        if wait_for_agent_response "${ISSUE_NUMBER}" 60; then
            log_success "Agent is processing the task"
        else
            log_warn "Agent response timeout - task may still be processing"
        fi
        
        # Check if agent created a PR
        if pr_number=$(check_for_agent_pr "${ISSUE_NUMBER}"); then
            log_success "Agent created PR #${pr_number}"
            echo "PR_NUMBER=${pr_number}" >> "${GITHUB_OUTPUT:-/dev/null}"
        else
            log "Agent is working on the task, PR will be created soon"
        fi
        
        exit 0
    else
        log_error "Failed to invoke Copilot agent"
        
        # Fallback: Try direct code generation
        log "Attempting fallback method..."
        if generate_code_changes "${TASK_GOAL}"; then
            log_success "Fallback succeeded"
            exit 0
        else
            log_error "All methods failed"
            exit 1
        fi
    fi
}

# Run main function if script is executed directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi
