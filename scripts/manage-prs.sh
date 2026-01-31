#!/usr/bin/env bash
#
# PR Management Script
# 
# Helps batch-process PRs based on review recommendations
# Requires: gh CLI authenticated with repo access
#
# Usage:
#   ./manage-prs.sh status                    # Show PR status
#   ./manage-prs.sh merge PR_NUMBER          # Merge a PR
#   ./manage-prs.sh close PR_NUMBER(s)       # Close PR(s)
#   ./manage-prs.sh --dry-run close 37 38    # Dry run
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO="${GITHUB_REPOSITORY:-JW-Flo/AWhittleWandering}"
DRY_RUN=false

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $*"
}

log_success() {
    echo -e "${GREEN}✓${NC} $*"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $*"
}

log_error() {
    echo -e "${RED}✗${NC} $*"
}

# Check prerequisites
check_prerequisites() {
    if ! command -v gh &> /dev/null; then
        log_error "GitHub CLI (gh) is not installed"
        echo "Install it from: https://cli.github.com/"
        exit 1
    fi

    if ! gh auth status &> /dev/null; then
        log_error "Not authenticated with GitHub CLI"
        echo "Run: gh auth login"
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Show PR status
show_status() {
    log_info "Fetching PR status from $REPO..."
    echo ""

    # Get all open PRs
    prs=$(gh pr list -R "$REPO" --limit 100 --json number,title,state,isDraft,createdAt,updatedAt,labels)

    if [ -z "$prs" ] || [ "$prs" = "[]" ]; then
        log_info "No open PRs found"
        return
    fi

    # Parse and display
    echo "$prs" | jq -r '.[] | 
        "\(.number)|\(.title)|\(.isDraft)|\(.createdAt)|\(.updatedAt)|" + 
        ([.labels[].name] | join(","))' | \
    while IFS='|' read -r num title draft created updated labels; do
        # Portable date calculation that works on both Linux and macOS
        if date --version >/dev/null 2>&1; then
            # GNU date (Linux)
            age_days=$(( ($(date +%s) - $(date -d "$created" +%s)) / 86400 ))
        else
            # BSD date (macOS)
            age_days=$(( ($(date +%s) - $(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$created" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%S" "${created%Z}" +%s)) / 86400 ))
        fi
        
        status="Ready"
        if [ "$draft" = "true" ]; then
            status="Draft"
        fi

        echo ""
        echo -e "${BLUE}PR #$num${NC} - $status - Age: ${age_days}d"
        echo "  Title: $title"
        [ -n "$labels" ] && echo "  Labels: $labels"
        
        # Add recommendations based on age and status
        if [ $age_days -gt 30 ]; then
            log_warning "  Consider closing (>30 days old)"
        elif [ $age_days -gt 14 ] && [ "$draft" = "true" ]; then
            log_warning "  Consider closing (draft >14 days old)"
        fi
    done

    echo ""
    log_info "See docs/PR_REVIEW_RECOMMENDATIONS.md for detailed analysis"
}

# Get PR details
get_pr_details() {
    local pr_number=$1
    gh pr view "$pr_number" -R "$REPO" --json number,title,state,isDraft,url,author
}

# Merge a PR
merge_pr() {
    local pr_number=$1

    log_info "Fetching details for PR #$pr_number..."
    
    if ! pr_data=$(get_pr_details "$pr_number"); then
        log_error "PR #$pr_number not found"
        return 1
    fi

    title=$(echo "$pr_data" | jq -r '.title')
    state=$(echo "$pr_data" | jq -r '.state')
    draft=$(echo "$pr_data" | jq -r '.isDraft')
    url=$(echo "$pr_data" | jq -r '.url')

    echo ""
    echo -e "${BLUE}PR #$pr_number${NC}"
    echo "  Title: $title"
    echo "  State: $state"
    echo "  Draft: $draft"
    echo "  URL: $url"
    echo ""

    if [ "$state" != "OPEN" ]; then
        log_error "PR is not open (state: $state)"
        return 1
    fi

    if [ "$draft" = "true" ]; then
        log_warning "PR is in draft state"
        read -p "Mark as ready for review first? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if [ "$DRY_RUN" = true ]; then
                log_info "[DRY RUN] Would mark PR #$pr_number as ready"
            else
                gh pr ready "$pr_number" -R "$REPO"
                log_success "Marked PR as ready"
            fi
        else
            log_error "Cannot merge draft PR"
            return 1
        fi
    fi

    # Confirm merge
    read -p "Merge PR #$pr_number? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Merge cancelled"
        return 0
    fi

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would merge PR #$pr_number"
    else
        log_info "Merging PR #$pr_number..."
        if gh pr merge "$pr_number" -R "$REPO" --merge --delete-branch; then
            log_success "PR #$pr_number merged successfully"
        else
            log_error "Failed to merge PR #$pr_number"
            log_info "Check: CI status, conflicts, or branch protection rules"
            return 1
        fi
    fi
}

# Close a PR
close_pr() {
    local pr_number=$1
    local comment=$2

    log_info "Fetching details for PR #$pr_number..."
    
    if ! pr_data=$(get_pr_details "$pr_number"); then
        log_error "PR #$pr_number not found"
        return 1
    fi

    title=$(echo "$pr_data" | jq -r '.title')
    state=$(echo "$pr_data" | jq -r '.state')
    url=$(echo "$pr_data" | jq -r '.url')

    echo ""
    echo -e "${BLUE}PR #$pr_number${NC}"
    echo "  Title: $title"
    echo "  State: $state"
    echo "  URL: $url"
    echo ""

    if [ "$state" != "OPEN" ]; then
        log_warning "PR is already closed"
        return 0
    fi

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would close PR #$pr_number"
        [ -n "$comment" ] && log_info "[DRY RUN] Would add comment: $comment"
    else
        if [ -n "$comment" ]; then
            gh pr comment "$pr_number" -R "$REPO" -b "$comment"
        fi
        
        if gh pr close "$pr_number" -R "$REPO"; then
            log_success "PR #$pr_number closed"
        else
            log_error "Failed to close PR #$pr_number"
            return 1
        fi
    fi
}

# Close multiple PRs
close_prs_batch() {
    local pr_numbers=("$@")
    local comment="Closing as stale/obsolete based on PR review. See docs/PR_REVIEW_RECOMMENDATIONS.md for analysis. If this PR is still needed, please reopen and update."

    echo ""
    log_info "Preparing to close ${#pr_numbers[@]} PRs"
    echo ""

    # Show all PRs that will be closed
    for pr_number in "${pr_numbers[@]}"; do
        if pr_data=$(get_pr_details "$pr_number" 2>/dev/null); then
            title=$(echo "$pr_data" | jq -r '.title')
            echo "  • PR #$pr_number: $title"
        else
            log_warning "  • PR #$pr_number: Not found (will skip)"
        fi
    done

    echo ""
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would close these PRs"
        return 0
    fi

    read -p "Close all these PRs? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Cancelled"
        return 0
    fi

    # Close each PR
    local success_count=0
    local fail_count=0

    for pr_number in "${pr_numbers[@]}"; do
        echo ""
        if close_pr "$pr_number" "$comment"; then
            ((success_count++))
        else
            ((fail_count++))
        fi
        sleep 1  # Rate limiting
    done

    echo ""
    log_success "Closed $success_count PRs"
    [ $fail_count -gt 0 ] && log_error "Failed to close $fail_count PRs"
}

# Show usage
usage() {
    cat << EOF
PR Management Script

Usage:
    $0 status                      Show status of all PRs
    $0 merge PR_NUMBER            Merge a specific PR
    $0 close PR_NUMBER            Close a specific PR
    $0 close PR_NUM1 PR_NUM2...   Close multiple PRs
    $0 --dry-run close 37 38      Dry run (no actual changes)

Options:
    --dry-run    Show what would happen without making changes
    --help       Show this help message

Examples:
    # Show all PRs with recommendations
    $0 status

    # Merge PR #95 (after review)
    $0 merge 95

    # Close stale PRs (as recommended)
    $0 close 37 38 40 41 42 43

    # Test what would happen (safe)
    $0 --dry-run close 37 38 40 41

Requirements:
    - GitHub CLI (gh) installed
    - Authenticated: gh auth login
    - Write access to repository

See docs/PR_AUTOMATION_GUIDE.md for more information
EOF
}

# Main script
main() {
    # Parse flags
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --help|-h)
                usage
                exit 0
                ;;
            *)
                break
                ;;
        esac
    done

    if [ $# -eq 0 ]; then
        usage
        exit 1
    fi

    check_prerequisites

    local action=$1
    shift

    case "$action" in
        status)
            show_status
            ;;
        merge)
            if [ $# -eq 0 ]; then
                log_error "PR number required"
                echo "Usage: $0 merge PR_NUMBER"
                exit 1
            fi
            merge_pr "$1"
            ;;
        close)
            if [ $# -eq 0 ]; then
                log_error "At least one PR number required"
                echo "Usage: $0 close PR_NUMBER [PR_NUMBER...]"
                exit 1
            fi
            if [ $# -eq 1 ]; then
                close_pr "$1" "Closing based on PR review. See docs/PR_REVIEW_RECOMMENDATIONS.md"
            else
                close_prs_batch "$@"
            fi
            ;;
        *)
            log_error "Unknown action: $action"
            echo ""
            usage
            exit 1
            ;;
    esac
}

main "$@"
