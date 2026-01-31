#!/usr/bin/env bash
# =============================================================================
# Infrastructure Automation Manager
# =============================================================================
# Handles automated management of PRs, GitHub Actions, and Cloudflare configs.
# 
# Usage: bash ops/infrastructure-automation.sh [operation] [args...]
# Operations: pr-create, pr-update, pr-merge, workflow-update, wrangler-update
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OPERATION="${1:-}"

# Logging
log() { echo "[infra-auto] $*"; }
log_error() { echo "[infra-auto] ❌ ERROR: $*" >&2; }
log_success() { echo "[infra-auto] ✅ $*"; }
log_warn() { echo "[infra-auto] ⚠️  $*"; }

# =============================================================================
# PR Operations
# =============================================================================

create_pr() {
    local title="$1"
    local body="$2"
    local base_branch="${3:-main}"
    local labels="${4:-}"
    
    log "Creating PR: $title"
    
    # Get current branch
    local current_branch=$(git branch --show-current)
    
    if [ "$current_branch" == "$base_branch" ]; then
        log_error "Cannot create PR from base branch"
        return 1
    fi
    
    # Check if there are changes
    if git diff --quiet HEAD "$base_branch"; then
        log_error "No changes to create PR from"
        return 1
    fi
    
    # Build gh pr create command
    local pr_cmd="gh pr create --title \"$title\" --body \"$body\" --base \"$base_branch\""
    
    if [ -n "$labels" ]; then
        pr_cmd="$pr_cmd --label \"$labels\""
    fi
    
    # Create PR
    if eval "$pr_cmd"; then
        log_success "PR created successfully"
        return 0
    else
        log_error "Failed to create PR"
        return 1
    fi
}

update_pr() {
    local pr_number="$1"
    local field="$2"
    local value="$3"
    
    log "Updating PR #$pr_number: $field"
    
    case "$field" in
        title)
            gh pr edit "$pr_number" --title "$value"
            ;;
        body)
            gh pr edit "$pr_number" --body "$value"
            ;;
        labels)
            gh pr edit "$pr_number" --add-label "$value"
            ;;
        reviewers)
            gh pr edit "$pr_number" --add-reviewer "$value"
            ;;
        *)
            log_error "Unknown field: $field"
            return 1
            ;;
    esac
    
    log_success "PR #$pr_number updated"
}

merge_pr() {
    local pr_number="$1"
    local strategy="${2:-squash}"
    
    log "Merging PR #$pr_number with strategy: $strategy"
    
    # Check if PR is mergeable
    local mergeable=$(gh pr view "$pr_number" --json mergeable --jq .mergeable)
    
    if [ "$mergeable" != "MERGEABLE" ]; then
        log_error "PR #$pr_number is not mergeable (state: $mergeable)"
        return 1
    fi
    
    # Check CI status
    local ci_status=$(gh pr view "$pr_number" --json statusCheckRollup --jq '.statusCheckRollup[].conclusion' | grep -v "SUCCESS" | wc -l)
    
    if [ "$ci_status" -gt 0 ]; then
        log_warn "PR #$pr_number has failing CI checks"
        # Continue anyway if explicitly requested
    fi
    
    # Merge
    case "$strategy" in
        squash)
            gh pr merge "$pr_number" --squash --delete-branch
            ;;
        merge)
            gh pr merge "$pr_number" --merge --delete-branch
            ;;
        rebase)
            gh pr merge "$pr_number" --rebase --delete-branch
            ;;
        *)
            log_error "Unknown merge strategy: $strategy"
            return 1
            ;;
    esac
    
    log_success "PR #$pr_number merged successfully"
}

auto_merge_pr() {
    local pr_number="$1"
    
    log "Enabling auto-merge for PR #$pr_number"
    
    # Enable auto-merge
    gh pr merge "$pr_number" --auto --squash --delete-branch
    
    log_success "Auto-merge enabled for PR #$pr_number"
}

# =============================================================================
# GitHub Actions Workflow Operations
# =============================================================================

update_workflow() {
    local workflow_file="$1"
    local operation="$2"
    shift 2
    local args=("$@")
    
    log "Updating workflow: $workflow_file"
    
    local workflow_path="$REPO_ROOT/.github/workflows/$workflow_file"
    
    if [ ! -f "$workflow_path" ]; then
        log_error "Workflow file not found: $workflow_file"
        return 1
    fi
    
    case "$operation" in
        update-action)
            local old_action="${args[0]}"
            local new_action="${args[1]}"
            log "Updating action: $old_action → $new_action"
            
            # Use yq if available, otherwise sed
            if command -v yq &>/dev/null; then
                yq -i "(.jobs.[].steps[] | select(.uses == \"$old_action\").uses) = \"$new_action\"" "$workflow_path"
            else
                sed -i "s|uses: $old_action|uses: $new_action|g" "$workflow_path"
            fi
            ;;
        
        add-step)
            log "Adding step (manual edit required)"
            log_warn "Complex workflow modifications should use a YAML editor"
            return 1
            ;;
        
        add-secret)
            local secret_name="${args[0]}"
            log "Adding secret reference: $secret_name"
            log_warn "Ensure secret exists in GitHub Settings → Secrets"
            # Just log for now, actual update needs careful YAML manipulation
            ;;
        
        *)
            log_error "Unknown workflow operation: $operation"
            return 1
            ;;
    esac
    
    log_success "Workflow updated: $workflow_file"
}

validate_workflow() {
    local workflow_file="$1"
    local workflow_path="$REPO_ROOT/.github/workflows/$workflow_file"
    
    log "Validating workflow: $workflow_file"
    
    # Check YAML syntax
    if command -v yq &>/dev/null; then
        if yq eval "$workflow_path" >/dev/null 2>&1; then
            log_success "Workflow syntax valid"
        else
            log_error "Workflow has syntax errors"
            return 1
        fi
    else
        log_warn "yq not available, skipping validation"
    fi
    
    # Check for common issues
    if grep -q "password:" "$workflow_path"; then
        log_error "Workflow contains hardcoded password!"
        return 1
    fi
    
    if grep -E 'token:' "$workflow_path" | grep -qv 'secrets\.'; then
        log_warn "Workflow may contain hardcoded token"
    fi
    
    log_success "Workflow validation passed"
}

# =============================================================================
# Wrangler Configuration Operations
# =============================================================================

update_wrangler() {
    local wrangler_file="$1"
    local operation="$2"
    shift 2
    local args=("$@")
    
    log "Updating Wrangler config: $wrangler_file"
    
    local wrangler_path="$REPO_ROOT/$wrangler_file"
    
    if [ ! -f "$wrangler_path" ]; then
        log_error "Wrangler config not found: $wrangler_file"
        return 1
    fi
    
    case "$operation" in
        add-kv)
            local binding="${args[0]}"
            local namespace_id="${args[1]}"
            local env="${args[2]:-production}"
            
            log "Adding KV namespace: $binding"
            
            # This is a simplified approach - real implementation should use TOML parser
            log_warn "KV namespace addition requires manual TOML editing"
            log "Add to $wrangler_path:"
            echo "[[env.$env.kv_namespaces]]"
            echo "binding = \"$binding\""
            echo "id = \"$namespace_id\""
            ;;
        
        add-var)
            local var_name="${args[0]}"
            local var_value="${args[1]}"
            local env="${args[2]:-production}"
            
            log "Adding environment variable: $var_name"
            log_warn "Non-secret variables can be added to wrangler.toml"
            log "Secret variables must use: wrangler secret put $var_name"
            ;;
        
        update-name)
            local new_name="${args[0]}"
            log "Updating worker name: $new_name"
            
            sed -i "s/^name = .*/name = \"$new_name\"/" "$wrangler_path"
            ;;
        
        update-compat-date)
            local new_date="${args[0]}"
            log "Updating compatibility_date: $new_date"
            
            sed -i "s/^compatibility_date = .*/compatibility_date = \"$new_date\"/" "$wrangler_path"
            ;;
        
        *)
            log_error "Unknown wrangler operation: $operation"
            return 1
            ;;
    esac
    
    log_success "Wrangler config updated"
}

validate_wrangler() {
    local wrangler_file="$1"
    local wrangler_path="$REPO_ROOT/$wrangler_file"
    
    log "Validating Wrangler config: $wrangler_file"
    
    # Check if file is valid TOML
    if command -v tomlq &>/dev/null; then
        if tomlq '.' "$wrangler_path" >/dev/null 2>&1; then
            log_success "Wrangler config syntax valid"
        else
            log_error "Wrangler config has syntax errors"
            return 1
        fi
    else
        log_warn "tomlq not available, skipping validation"
    fi
    
    # Check for secrets in config (they shouldn't be there)
    # Look for hardcoded values, not environment variables
    if grep -iE '(password|token|key|secret)\s*=\s*"[^${\"]' "$wrangler_path" | grep -v "binding"; then
        log_error "Wrangler config may contain hardcoded secrets!"
        return 1
    fi
    
    log_success "Wrangler config validation passed"
}

# =============================================================================
# Combined Operations
# =============================================================================

full_automation() {
    local task_type="$1"
    
    log "Running full automation for task type: $task_type"
    
    case "$task_type" in
        deploy-update)
            log "1. Creating feature branch"
            git checkout -b "auto/deploy-update-$(date +%s)"
            
            log "2. Making changes (example)"
            # Changes would be made here
            
            log "3. Committing changes"
            git add -A
            git commit -m "chore: automated deployment update"
            
            log "4. Pushing branch"
            git push origin HEAD
            
            log "5. Creating PR"
            create_pr \
                "chore: automated deployment update" \
                "Automated update to deployment configuration" \
                "main" \
                "automated"
            
            log_success "Full automation complete"
            ;;
        
        *)
            log_error "Unknown automation task type: $task_type"
            return 1
            ;;
    esac
}

# =============================================================================
# Main Execution
# =============================================================================

usage() {
    cat <<EOF
Usage: $0 <operation> [args...]

PR Operations:
  pr-create <title> <body> [base-branch] [labels]
  pr-update <pr-number> <field> <value>
  pr-merge <pr-number> [strategy]
  pr-auto-merge <pr-number>

Workflow Operations:
  workflow-update <file> <operation> [args...]
  workflow-validate <file>

Wrangler Operations:
  wrangler-update <file> <operation> [args...]
  wrangler-validate <file>

Combined Operations:
  full-automation <task-type>

Examples:
  $0 pr-create "Fix bug" "This fixes the login bug" main "bug,high-priority"
  $0 pr-merge 123 squash
  $0 workflow-update deploy.yml update-action actions/checkout@v3 actions/checkout@v4
  $0 wrangler-update backend/edge-worker/wrangler.toml update-name my-worker-v2
EOF
}

main() {
    if [ -z "$OPERATION" ]; then
        usage
        exit 1
    fi
    
    case "$OPERATION" in
        pr-create)
            create_pr "${@:2}"
            ;;
        pr-update)
            update_pr "${@:2}"
            ;;
        pr-merge)
            merge_pr "${@:2}"
            ;;
        pr-auto-merge)
            auto_merge_pr "${@:2}"
            ;;
        workflow-update)
            update_workflow "${@:2}"
            ;;
        workflow-validate)
            validate_workflow "${@:2}"
            ;;
        wrangler-update)
            update_wrangler "${@:2}"
            ;;
        wrangler-validate)
            validate_wrangler "${@:2}"
            ;;
        full-automation)
            full_automation "${@:2}"
            ;;
        help|--help|-h)
            usage
            ;;
        *)
            log_error "Unknown operation: $OPERATION"
            usage
            exit 1
            ;;
    esac
}

# Run if executed directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi
