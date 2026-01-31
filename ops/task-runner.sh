#!/usr/bin/env bash
# =============================================================================
# Task Runner Orchestrator Script
# =============================================================================
# This script is the heart of the Codex autonomous CI/CD pipeline.
# It orchestrates: task parsing, agent invocation, patch application,
# verification loops, and subagent triggers.
#
# Usage: Called by .github/workflows/task-runner.yml
# Environment variables expected:
#   - ISSUE_NUMBER: GitHub issue number
#   - ISSUE_TITLE: Issue title
#   - TASK_GOAL: Parsed goal from task definition
#   - TARGET_BRANCH: Branch to target (dev/staging/main)
#   - RISK_LEVEL: low/medium/high
#   - VERIFY_TIER: lite/full
#   - WORK_BRANCH: Working branch name
#   - OPENAI_API_KEY: (optional) For API calls
#   - GH_TOKEN: GitHub token for API calls
# =============================================================================

set -euo pipefail
IFS=$'\n\t'

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
MAX_ITERATIONS=${MAX_ITERATIONS:-5}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
AI_DIR="$REPO_ROOT/.ai"

# Logging
log() { echo "[task-runner] $*"; }
log_error() { echo "[task-runner] ❌ ERROR: $*" >&2; }
log_success() { echo "[task-runner] ✅ $*"; }
log_warn() { echo "[task-runner] ⚠️  $*"; }

# -----------------------------------------------------------------------------
# Allowlist of Safe Commands
# -----------------------------------------------------------------------------
# Security measure: only these commands can be executed
ALLOWED_COMMANDS=(
  "npm"
  "pnpm"
  "yarn"
  "npx"
  "node"
  "git"
  "wrangler"
  "bash scripts/preflight.sh"
  "bash scripts/security-scan.sh"
  "jq"
  "rg"
  "curl"
)

is_command_allowed() {
  local cmd="$1"
  for allowed in "${ALLOWED_COMMANDS[@]}"; do
    if [[ "$cmd" == "$allowed"* ]]; then
      return 0
    fi
  done
  return 1
}

# -----------------------------------------------------------------------------
# Environment Validation
# -----------------------------------------------------------------------------
validate_environment() {
  log "Validating environment..."
  
  # Required variables
  local required_vars=("ISSUE_NUMBER" "TASK_GOAL" "TARGET_BRANCH" "RISK_LEVEL")
  for var in "${required_vars[@]}"; do
    if [[ -z "${!var:-}" ]]; then
      log_error "Required environment variable $var is not set"
      return 1
    fi
  done
  
  # Check for AI configuration files
  if [[ ! -f "$AI_DIR/SYSTEM.md" ]]; then
    log_warn "AI system prompt not found at $AI_DIR/SYSTEM.md"
  fi
  
  # Check for required scripts
  if [[ ! -f "$REPO_ROOT/scripts/preflight.sh" ]]; then
    log_error "preflight.sh not found"
    return 1
  fi
  
  log_success "Environment validated"
  return 0
}

# -----------------------------------------------------------------------------
# Load AI Prompts
# -----------------------------------------------------------------------------
load_system_prompt() {
  if [[ -f "$AI_DIR/SYSTEM.md" ]]; then
    cat "$AI_DIR/SYSTEM.md"
  else
    echo "You are an autonomous AI developer. Follow security-first principles."
  fi
}

load_subagent_prompt() {
  local subagent="$1"
  local prompt_file="$AI_DIR/SUBAGENTS/${subagent}.md"
  
  if [[ -f "$prompt_file" ]]; then
    cat "$prompt_file"
  else
    log_warn "Subagent prompt not found: $prompt_file"
    echo ""
  fi
}

# -----------------------------------------------------------------------------
# Task Parsing with Intelligent Context Analysis
# -----------------------------------------------------------------------------
parse_task() {
  log "Parsing task definition..."
  
  # Task is already parsed by the workflow, just log it
  log "  Issue: #${ISSUE_NUMBER}"
  log "  Title: ${ISSUE_TITLE:-N/A}"
  log "  Goal: ${TASK_GOAL}"
  log "  Branch: ${TARGET_BRANCH}"
  log "  Risk: ${RISK_LEVEL}"
  log "  Verify: ${VERIFY_TIER:-auto}"
  
  # Run intelligent context analysis if available
  if [[ -f "$SCRIPT_DIR/intelligent-context-analyzer.sh" ]]; then
    log "Running intelligent context analysis..."
    
    if CONTEXT_ANALYSIS=$(bash "$SCRIPT_DIR/intelligent-context-analyzer.sh" "$TASK_GOAL" 2>&1); then
      log_success "Context analysis complete"
      
      # Extract auto-detected values if not already set
      if [[ "${RISK_LEVEL}" == "auto" ]]; then
        AUTO_RISK=$(echo "$CONTEXT_ANALYSIS" | jq -r '.risk_level // "medium"')
        RISK_LEVEL="$AUTO_RISK"
        log "Auto-detected risk level: $RISK_LEVEL"
      fi
      
      if [[ -z "${TARGET_BRANCH:-}" ]] || [[ "${TARGET_BRANCH}" == "auto" ]]; then
        AUTO_BRANCH=$(echo "$CONTEXT_ANALYSIS" | jq -r '.target_branch // "dev"')
        TARGET_BRANCH="$AUTO_BRANCH"
        log "Auto-selected branch: $TARGET_BRANCH"
      fi
      
      # Store context for later use
      export DISCOVERED_CONTEXT="$CONTEXT_ANALYSIS"
      
      # Log discovered files
      local file_count=$(echo "$CONTEXT_ANALYSIS" | jq -r '.relevant_files | length')
      if [[ "$file_count" -gt 0 ]]; then
        log "Discovered $file_count relevant files"
        echo "$CONTEXT_ANALYSIS" | jq -r '.relevant_files[]' | head -5 | while read -r file; do
          log "  - $file"
        done
      fi
    else
      log_warn "Context analysis failed, continuing with manual context"
    fi
  else
    log_warn "Intelligent context analyzer not found, using manual context"
  fi
  
  return 0
}

# -----------------------------------------------------------------------------
# Codex Agent Invocation
# -----------------------------------------------------------------------------
# This function would call the OpenAI API in a full implementation
invoke_codex_agent() {
  local task_prompt="$1"
  local system_prompt
  system_prompt=$(load_system_prompt)
  
  log "Invoking Codex agent..."
  
  # Check if API key is available
  if [[ -z "${OPENAI_API_KEY:-}" ]]; then
    log_warn "OPENAI_API_KEY not set - running in dry-run mode"
    echo "DRY_RUN: Would invoke Codex with task: $task_prompt"
    return 0
  fi
  
  # Build the full prompt
  local full_prompt
  read -r -d '' full_prompt <<EOF || true
You are an autonomous AI developer integrated with a CI/CD pipeline.

SYSTEM INSTRUCTIONS:
$system_prompt

TASK:
Issue #${ISSUE_NUMBER}: ${ISSUE_TITLE:-Task}

Goal: ${TASK_GOAL}

Target Branch: ${TARGET_BRANCH}
Risk Level: ${RISK_LEVEL}

Instructions:
1. Plan the changes needed to complete the task
2. Implement with minimal, auditable diffs
3. Follow all security and quality rules from SYSTEM.md
4. Output your changes in unified diff format

Begin by formulating a plan, then provide the implementation.
EOF

  # API call placeholder
  # In production, this would be:
  # curl -s https://api.openai.com/v1/chat/completions \
  #   -H "Authorization: Bearer $OPENAI_API_KEY" \
  #   -H "Content-Type: application/json" \
  #   -d "{\"model\": \"gpt-4\", \"messages\": [{\"role\": \"system\", \"content\": \"...\"}]}"
  
  log "Agent prompt prepared (${#full_prompt} chars)"
  log "API integration point - would send to OpenAI here"
  
  return 0
}

# -----------------------------------------------------------------------------
# Subagent Invocation
# -----------------------------------------------------------------------------
invoke_subagent() {
  local subagent="$1"
  local context="$2"
  
  log "Invoking subagent: $subagent"
  
  local subagent_prompt
  subagent_prompt=$(load_subagent_prompt "$subagent")
  
  if [[ -z "$subagent_prompt" ]]; then
    log_warn "No prompt for subagent $subagent, skipping"
    return 0
  fi
  
  # Build subagent context
  local full_context
  read -r -d '' full_context <<EOF || true
SUBAGENT: $subagent

INSTRUCTIONS:
$subagent_prompt

CONTEXT:
$context

Analyze the above and provide specific recommendations or fixes.
EOF

  log "Subagent $subagent invoked with context (${#context} chars)"
  
  # In production, this would call the API
  return 0
}

# -----------------------------------------------------------------------------
# Patch Application
# -----------------------------------------------------------------------------
apply_patch() {
  local patch_content="$1"
  
  if [[ -z "$patch_content" ]]; then
    log "No patch to apply"
    return 0
  fi
  
  log "Applying patch..."
  
  # Save patch to temp file
  local patch_file="/tmp/codex-patch-$$.diff"
  echo "$patch_content" > "$patch_file"
  
  # Try to apply with git apply
  if git apply --check "$patch_file" 2>/dev/null; then
    git apply "$patch_file"
    log_success "Patch applied successfully"
    rm -f "$patch_file"
    return 0
  else
    log_error "Patch failed to apply cleanly"
    rm -f "$patch_file"
    return 1
  fi
}

# -----------------------------------------------------------------------------
# Verification Steps
# -----------------------------------------------------------------------------
run_preflight() {
  log "Running preflight checks..."
  
  if [[ -f "$REPO_ROOT/scripts/preflight.sh" ]]; then
    if bash "$REPO_ROOT/scripts/preflight.sh"; then
      log_success "Preflight passed"
      return 0
    else
      log_error "Preflight failed"
      return 1
    fi
  else
    log_warn "No preflight script found"
    return 0
  fi
}

run_security_scan() {
  log "Running security scan..."
  
  if [[ -f "$REPO_ROOT/scripts/security-scan.sh" ]]; then
    if bash "$REPO_ROOT/scripts/security-scan.sh"; then
      log_success "Security scan passed"
      return 0
    else
      log_error "Security scan found issues"
      return 1
    fi
  else
    log_warn "No security scan script found"
    return 0
  fi
}

run_cloudflare_check() {
  log "Running Cloudflare deployment check..."
  
  if [[ -f "$REPO_ROOT/backend/edge-worker/wrangler.toml" ]]; then
    # Dry-run deployment check
    if command -v wrangler &>/dev/null; then
      log "Wrangler available - would run dry-run deploy check"
      # wrangler deploy --dry-run --env staging
    else
      log_warn "Wrangler not available for deployment check"
    fi
  fi
  
  return 0
}

# -----------------------------------------------------------------------------
# Verification Loop with Subagent Recovery
# -----------------------------------------------------------------------------
verification_loop() {
  local iteration=0
  local preflight_ok=false
  local security_ok=false
  
  while [[ $iteration -lt $MAX_ITERATIONS ]]; do
    ((iteration++))
    log "Verification iteration $iteration/$MAX_ITERATIONS"
    
    # Run preflight
    if run_preflight; then
      preflight_ok=true
    else
      preflight_ok=false
      log "Invoking CI-Reviewer subagent..."
      local preflight_output
      preflight_output=$(cat /tmp/preflight.log 2>/dev/null || echo "No output")
      invoke_subagent "ci-reviewer" "$preflight_output"
      # In production: apply fix from subagent, continue loop
    fi
    
    # Run security scan
    if run_security_scan; then
      security_ok=true
    else
      security_ok=false
      log "Invoking Security-Linter subagent..."
      local security_output
      security_output=$(cat /tmp/security.log 2>/dev/null || echo "No output")
      invoke_subagent "security-linter" "$security_output"
      # In production: apply fix from subagent, continue loop
    fi
    
    # Check if all passed
    if $preflight_ok && $security_ok; then
      log_success "All verification checks passed"
      return 0
    fi
    
    # If we're in dry-run mode (no API key), don't loop
    if [[ -z "${OPENAI_API_KEY:-}" ]]; then
      log_warn "Dry-run mode - not iterating for fixes"
      break
    fi
  done
  
  if ! $preflight_ok || ! $security_ok; then
    log_error "Verification failed after $MAX_ITERATIONS iterations"
    return 1
  fi
  
  return 0
}

# -----------------------------------------------------------------------------
# Git Operations
# -----------------------------------------------------------------------------
commit_changes() {
  local message="$1"
  
  git config user.name "${GIT_USER_NAME:-Codex Bot}"
  git config user.email "${GIT_USER_EMAIL:-codex-bot@awhittlewandering.com}"
  
  if git diff --quiet && git diff --cached --quiet; then
    log "No changes to commit"
    return 0
  fi
  
  git add -A
  git commit -m "$message"
  log_success "Changes committed: $message"
  return 0
}

push_changes() {
  local branch="${WORK_BRANCH:-$(git branch --show-current)}"
  
  if git push -u origin "$branch" 2>/dev/null; then
    log_success "Pushed to origin/$branch"
    return 0
  else
    log_error "Failed to push to origin/$branch"
    return 1
  fi
}

# -----------------------------------------------------------------------------
# Main Orchestration
# -----------------------------------------------------------------------------
main() {
  log "=========================================="
  log "Task Runner Orchestrator"
  log "=========================================="
  
  # Step 1: Validate environment
  if ! validate_environment; then
    log_error "Environment validation failed"
    exit 1
  fi
  
  # Step 2: Parse task
  if ! parse_task; then
    log_error "Task parsing failed"
    exit 1
  fi
  
  # Step 3: Invoke GitHub Copilot agent
  log "Invoking GitHub Copilot agent integration..."
  if [[ -f "$SCRIPT_DIR/copilot-agent-integration.sh" ]]; then
    if bash "$SCRIPT_DIR/copilot-agent-integration.sh"; then
      log_success "Copilot agent invoked successfully"
      # Agent will create PR directly, this workflow monitors it
      log "Note: Agent will create PR automatically"
      log "This workflow will continue to monitor and verify"
    else
      log_warn "Copilot agent invocation had issues, falling back to standard flow"
      invoke_codex_agent "$TASK_GOAL"
    fi
  else
    log_warn "Copilot integration script not found, using standard agent"
    invoke_codex_agent "$TASK_GOAL"
  fi
  
  # Step 4: Run verification loop
  # This handles preflight, security, and subagent recovery
  if ! verification_loop; then
    log_warn "Verification loop completed with issues"
    # Don't exit - let the workflow handle the state
  fi
  
  # Step 5: Cloudflare-specific checks (if applicable)
  run_cloudflare_check
  
  # Step 6: Prepare summary
  log "=========================================="
  log "Task Runner Summary"
  log "=========================================="
  log "Issue: #${ISSUE_NUMBER}"
  log "Goal: ${TASK_GOAL}"
  log "Risk Level: ${RISK_LEVEL}"
  log "Target Branch: ${TARGET_BRANCH}"
  
  # Determine next steps based on risk
  case "$RISK_LEVEL" in
    low)
      log "Next: Auto-merge eligible after CI passes"
      ;;
    medium)
      log "Next: Standard review process"
      ;;
    high)
      log "Next: Manual review required"
      ;;
  esac
  
  log "=========================================="
  log_success "Task Runner completed"
  
  return 0
}

# Run main
main "$@"
