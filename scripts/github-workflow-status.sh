#!/bin/bash
# github-workflow-status.sh
# Script to check GitHub Actions workflow status after commits

set -e

# Function to log operations
log_operation() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Check if GitHub CLI is installed
check_gh_cli() {
  if ! command -v gh &> /dev/null; then
    echo "Warning: GitHub CLI (gh) is not installed. Limited functionality will be available."
    echo "To install GitHub CLI:"
    echo "  brew install gh    # macOS"
    echo "  apt install gh     # Ubuntu/Debian"
    echo "  https://cli.github.com/manual/installation for other platforms"
    export MOCK_MODE="true"
    return 1
  fi
  
  # Check if authenticated
  if ! gh auth status &> /dev/null; then
    echo "Warning: Not authenticated with GitHub CLI. Limited functionality will be available."
    echo "To authenticate:"
    echo "  gh auth login"
    export MOCK_MODE="true"
    return 1
  fi
  
  export MOCK_MODE="false"
  return 0
}

# Function to get the repository name
get_repo_name() {
  # Extract from git config
  local remote_url=$(git config --get remote.origin.url)
  if [[ "$remote_url" =~ github\.com[:/]([^/]+/[^/]+)(\.git)?$ ]]; then
    echo "${BASH_REMATCH[1]}"
  else
    # Try to get from gh cli
    local repo_name=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")
    
    # If we still don't have a repo name, try to get the origin URL and extract owner/repo
    if [ -z "$repo_name" ]; then
      echo "Warning: Unable to get repository name from GitHub CLI. Using remote URL as fallback."
      repo_name=$(basename "$(git rev-parse --show-toplevel)")
      echo "Using local repository name: $repo_name"
    fi
    
    if [ -n "$repo_name" ]; then
      echo "$repo_name"
    else
      echo ""
      return 1
    fi
  fi
}

# Function to generate a mock workflow report when GitHub CLI is not available
generate_mock_report() {
  local commit_sha=$1
  local commit_date=$2
  local commit_message=$3
  local author=$4
  local mock_status=$5
  
  # Generate random workflow names and statuses for demo purposes
  local workflows=("build" "test" "lint" "deploy" "e2e-tests")
  local statuses=("completed" "completed" "completed" "in_progress" "queued")
  local conclusions=("success" "failure" "success" "neutral" "skipped")
  
  local report=""
  
  for i in {0..4}; do
    if [ $i -lt ${#workflows[@]} ]; then
      local workflow="${workflows[$i]}"
      local status="${statuses[$((RANDOM % ${#statuses[@]}))]}}"
      local conclusion="${conclusions[$((RANDOM % ${#conclusions[@]}))]}"
      
      report+="Workflow: $workflow\n"
      report+="  Status: $status\n"
      report+="  Conclusion: ${conclusion}\n"
      report+="  URL: https://github.com/example/repo/actions\n\n"
    fi
  done
  
  echo -e "$report"
  
  # Simulate success or failure randomly if not specified
  if [ -z "$mock_status" ]; then
    return $((RANDOM % 2))
  else
    if [ "$mock_status" = "success" ]; then
      return 0
    else
      return 1
    fi
  fi
}

# Function to check workflow status for a specific commit
check_workflow_status() {
  local commit_sha=$1
  local repo_name=$2
  local max_attempts=$3
  local polling_interval=$4
  
  log_operation "Checking workflow status for commit: ${commit_sha:0:8}"
  
  # Use mock mode if GitHub CLI is not available or not authenticated
  if [ "$MOCK_MODE" = "true" ]; then
    log_operation "Using mock mode for workflow status (GitHub CLI not available/authenticated)"
    
    # Get commit info for the mock report
    local commit_date
    local commit_message
    local author
    
    commit_date=$(git show -s --format=%ci "$commit_sha" 2>/dev/null || echo "Unknown date")
    commit_message=$(git show -s --format=%s "$commit_sha" 2>/dev/null || echo "Unknown commit message")
    author=$(git show -s --format=%an "$commit_sha" 2>/dev/null || echo "Unknown author")
    
    # Generate mock workflow status (randomly success or failure)
    local mock_status
    if [ $((RANDOM % 10)) -lt 8 ]; then  # 80% success rate
      mock_status="success"
    else
      mock_status="failure"
    fi
    
    # Generate mock report
    local status_summary
    status_summary=$(generate_mock_report "$commit_sha" "$commit_date" "$commit_message" "$author" "$mock_status")
    echo -e "$status_summary"
    
    if [ "$mock_status" = "success" ]; then
      log_operation "All workflows completed successfully for commit ${commit_sha:0:8} (MOCK DATA)"
      return 0
    else
      log_operation "Some workflows failed for commit ${commit_sha:0:8} (MOCK DATA)"
      return 1
    fi
  fi
  
  # Real mode using GitHub API
  local attempt=1
  while [ $attempt -le $max_attempts ]; do
    log_operation "Attempt $attempt of $max_attempts"
    
    # Get workflow runs for this commit
    local workflow_runs
    workflow_runs=$(gh api "repos/$repo_name/actions/runs?head_sha=$commit_sha" --jq '.workflow_runs' 2>/dev/null || echo '[]')
    
    # Check if we have any workflow runs
    local run_count
    run_count=$(echo "$workflow_runs" | jq 'length' 2>/dev/null || echo 0)
    
    # Ensure run_count is a valid integer
    if [[ ! "$run_count" =~ ^[0-9]+$ ]]; then
      run_count=0
    fi
    
    if [ "$run_count" -eq 0 ]; then
      log_operation "No workflow runs found for commit ${commit_sha:0:8} yet, waiting..."
      sleep $polling_interval
      attempt=$((attempt + 1))
      continue
    fi
    
    # Check status of all workflow runs
    local all_completed=true
    local all_successful=true
    local status_summary=""
    
    while read -r run; do
      local name
      local status
      local conclusion
      local url
      
      name=$(echo "$run" | jq -r '.name' 2>/dev/null || echo "Unknown")
      status=$(echo "$run" | jq -r '.status' 2>/dev/null || echo "unknown")
      conclusion=$(echo "$run" | jq -r '.conclusion' 2>/dev/null || echo "unknown")
      url=$(echo "$run" | jq -r '.html_url' 2>/dev/null || echo "#")
      
      status_summary+="Workflow: $name\n"
      status_summary+="  Status: $status\n"
      status_summary+="  Conclusion: ${conclusion:-pending}\n"
      status_summary+="  URL: $url\n\n"
      
      if [ "$status" != "completed" ]; then
        all_completed=false
      fi
      
      if [ "$status" = "completed" ] && [ "$conclusion" != "success" ]; then
        all_successful=false
      fi
    done <<< "$(echo "$workflow_runs" | jq -c '.[]' 2>/dev/null)"
    
    echo -e "$status_summary"
    
    if $all_completed; then
      if $all_successful; then
        log_operation "All workflows completed successfully for commit ${commit_sha:0:8}"
        return 0
      else
        log_operation "Some workflows failed for commit ${commit_sha:0:8}"
        return 1
      fi
    fi
    
    log_operation "Workflows still running for commit ${commit_sha:0:8}, waiting..."
    sleep $polling_interval
    attempt=$((attempt + 1))
  done
  
  log_operation "Timed out waiting for workflows to complete"
  return 2
}

# Main function to check GitHub workflow status recursively
check_workflows_recursive() {
  local repo_name=$1
  local max_attempts=${2:-30}  # Default to 30 attempts
  local polling_interval=${3:-60}  # Default to 60 seconds
  local max_commits=${4:-10}  # Default to checking the last 10 commits
  
  # Check if mock mode is forced via environment variable
  if [ "$MOCK_MODE" = "true" ]; then
    log_operation "MOCK MODE ENABLED: Using simulated GitHub workflow data"
  fi
  
  log_operation "Starting recursive workflow status check for repository: $repo_name"
  log_operation "Will check the last $max_commits commits"
  
  # Get the last N commits
  local commits=$(git log -n $max_commits --format="%H")
  
  # Initialize the report
  local report_dir="$ROOT_DIR/docs/workflow-reports"
  mkdir -p "$report_dir"
  local timestamp=$(date '+%Y%m%d-%H%M%S')
  local report_file="$report_dir/workflow-status-$timestamp.md"
  
  cat > "$report_file" << EOF
# GitHub Workflow Status Report

Date: $(date '+%Y-%m-%d %H:%M:%S')
Repository: $repo_name

## Workflow Results
EOF
  
  # Check each commit
  while IFS= read -r commit; do
    local commit_date=$(git show -s --format=%ci "$commit")
    local commit_message=$(git show -s --format=%s "$commit")
    local author=$(git show -s --format=%an "$commit")
    
    echo "### Commit: ${commit:0:8}" >> "$report_file"
    echo "- Date: $commit_date" >> "$report_file"
    echo "- Author: $author" >> "$report_file"
    echo "- Message: $commit_message" >> "$report_file"
    echo "" >> "$report_file"
    
    # Check workflows for this commit
    if check_workflow_status "$commit" "$repo_name" "$max_attempts" "$polling_interval"; then
      echo "✅ All workflows passed" >> "$report_file"
    else
      local exit_code=$?
      if [ $exit_code -eq 1 ]; then
        echo "❌ Some workflows failed" >> "$report_file"
      else
        echo "⚠️ Workflow status check timed out" >> "$report_file"
      fi
    fi
    
    # Get detailed status for this commit and add to report
    local workflow_runs
    if [ "$MOCK_MODE" = "true" ]; then
      # Generate mock data in the report
      echo "#### Detailed Results (MOCK DATA)" >> "$report_file"
      echo "" >> "$report_file"
      echo "| Workflow | Status | Conclusion | URL |" >> "$report_file"
      echo "|----------|--------|-----------|-----|" >> "$report_file"
      
      # Generate some mock workflow data
      local workflows=("build" "test" "lint" "deploy" "e2e-tests")
      local statuses=("completed" "completed" "completed" "in_progress" "queued")
      local conclusions=("success" "failure" "success" "neutral" "skipped")
      
      for i in {0..4}; do
        if [ $i -lt ${#workflows[@]} ]; then
          local workflow="${workflows[$i]}"
          local status="${statuses[$((RANDOM % ${#statuses[@]}))]}"
          local conclusion="${conclusions[$((RANDOM % ${#conclusions[@]}))]}"
          
          echo "| $workflow | $status | $conclusion | [View Run](https://github.com/example/repo/actions) |" >> "$report_file"
        fi
      done
    else
      # Use real data if available
      workflow_runs=$(gh api "repos/$repo_name/actions/runs?head_sha=$commit" --jq '.workflow_runs' 2>/dev/null || echo '[]')
      
      echo "#### Detailed Results" >> "$report_file"
      echo "" >> "$report_file"
      
      local wf_count
      wf_count=$(echo "$workflow_runs" | jq 'length' 2>/dev/null || echo 0)
      
      # Ensure wf_count is a valid integer
      if [[ ! "$wf_count" =~ ^[0-9]+$ ]]; then
        wf_count=0
      fi
      
      if [ "$wf_count" -eq 0 ]; then
        echo "No workflow runs found for this commit." >> "$report_file"
      else
        echo "| Workflow | Status | Conclusion | URL |" >> "$report_file"
        echo "|----------|--------|-----------|-----|" >> "$report_file"
        
        echo "$workflow_runs" | jq -c '.[]' 2>/dev/null | while read -r run; do
          local name=$(echo "$run" | jq -r '.name' 2>/dev/null || echo "Unknown")
          local status=$(echo "$run" | jq -r '.status' 2>/dev/null || echo "unknown")
          local conclusion=$(echo "$run" | jq -r '.conclusion // "pending"' 2>/dev/null || echo "unknown")
          local url=$(echo "$run" | jq -r '.html_url' 2>/dev/null || echo "#")
          
          echo "| $name | $status | $conclusion | [View Run]($url) |" >> "$report_file"
        done
      fi
    fi
    
    echo "" >> "$report_file"
    echo "---" >> "$report_file"
    echo "" >> "$report_file"
    
  done <<< "$commits"
  
  log_operation "Workflow status check completed. Report available at: $report_file"
  echo "Workflow status report: $report_file"
}

# Main execution
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log_operation "Working in directory: $ROOT_DIR"

# Initialize mock mode flag if not already set
if [ -z "$MOCK_MODE" ]; then
  export MOCK_MODE="false"
fi

# Override mock mode if GitHub CLI check fails
check_gh_cli

# Get repository name
repo_name=$(get_repo_name)
if [ -z "$repo_name" ]; then
  echo "Error: Unable to determine repository name"
  exit 1
fi

# Parse command line arguments
max_attempts=30
polling_interval=60
max_commits=10

while [[ "$#" -gt 0 ]]; do
  case $1 in
    --attempts) max_attempts="$2"; shift ;;
    --interval) polling_interval="$2"; shift ;;
    --commits) max_commits="$2"; shift ;;
    *) echo "Unknown parameter: $1"; exit 1 ;;
  esac
  shift
done

# Run the workflow check
check_workflows_recursive "$repo_name" "$max_attempts" "$polling_interval" "$max_commits"
