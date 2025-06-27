#!/usr/bin/env bash
# =======================================================================
#  AWhittleWandering – One‑Shot Autopilot Deployment  (NO heavy tests)
#  Orchestrator : Cline
#  Helpers      : Copilot (edits) • PyExec (shell) • EdgeOps (wrangler)
# =======================================================================

set -e

# Set to the project directory
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Terminal colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log prefix function
log_prefix() {
  echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $1"
}

# Check for required environment variables
check_env() {
  log_prefix "${YELLOW}Checking environment variables...${NC}"
  local required_vars=("MAPBOX_TOKEN" "TESSIE_API_TOKEN" "OPENWEATHER_API_KEY" "CF_API_TOKEN" "CF_ACCOUNT_ID" "ADMIN_JWT_SECRET")
  local missing_vars=()
  
  for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
      missing_vars+=("$var")
    fi
  done
  
  if [[ ${#missing_vars[@]} -gt 0 ]]; then
    log_prefix "${RED}ERROR: Missing required environment variables: ${missing_vars[*]}${NC}"
    log_prefix "${YELLOW}Set these variables in your .env file or environment.${NC}"
    exit 1
  fi
  
  log_prefix "${GREEN}Environment check passed.${NC}"
}

# Create deployment branch
create_branch() {
  local branch_name="auto-deploy/$(date +%Y%m%d-%H%M)"
  log_prefix "${YELLOW}Creating deployment branch: ${branch_name}${NC}"
  
  git checkout -b "$branch_name"
  
  log_prefix "${GREEN}Created branch: ${branch_name}${NC}"
  echo "$branch_name"
}

# Task: Build
task_build() {
  log_prefix "${YELLOW}TASK: Building project...${NC}"
  
  cd "$REPO_ROOT/awhittlewandering"
  
  log_prefix "Running npm clean-install --workspaces"
  npm clean-install --workspaces
  
  log_prefix "Building frontend..."
  npm run build -w packages/frontend
  
  if [[ $? -ne 0 ]]; then
    log_prefix "${RED}ERROR: Build failed.${NC}"
    exit 1
  fi
  
  log_prefix "${GREEN}Build completed successfully.${NC}"
}

# Task: Edge Preview Deployment
task_edge_preview() {
  log_prefix "${YELLOW}TASK: Deploying to preview environment...${NC}"
  
  cd "$REPO_ROOT/awhittlewandering"
  
  log_prefix "Deploying to Cloudflare Workers preview..."
  wrangler deploy --env preview --minify --config wrangler-site.toml
  
  PREVIEW_URL=$(wrangler deployments list --json | jq -r '.[0].url')
  
  log_prefix "${GREEN}Preview deployment successful.${NC}"
  log_prefix "Preview URL: ${PREVIEW_URL}"
  
  echo "$PREVIEW_URL"
}

# Task: Smoke Tests
task_smoke() {
  local preview_url=$1
  log_prefix "${YELLOW}TASK: Running smoke tests...${NC}"
  
  log_prefix "Testing health endpoint..."
  curl -sSL "${preview_url}/health" || { log_prefix "${RED}Health check failed.${NC}"; exit 1; }
  
  log_prefix "Testing API version endpoint..."
  curl -sSL "${preview_url}/api/version" || { log_prefix "${RED}API version check failed.${NC}"; exit 1; }
  
  log_prefix "${GREEN}Smoke tests passed.${NC}"
}

# Task: Promote to Production
task_promote() {
  log_prefix "${YELLOW}TASK: Promoting to production...${NC}"
  
  cd "$REPO_ROOT/awhittlewandering"
  
  log_prefix "Deploying to Cloudflare Workers production..."
  wrangler deploy --env production --minify --config wrangler-site.toml
  
  DEPLOY_ID=$(wrangler deployments list --json | jq -r '.[0].id')
  
  log_prefix "Writing deployment ID to .last_good_deploy..."
  echo "$DEPLOY_ID" > "$REPO_ROOT/.last_good_deploy"
  
  log_prefix "${GREEN}Production deployment successful.${NC}"
  log_prefix "Deployment ID: ${DEPLOY_ID}"
  
  # Commit the .last_good_deploy file
  git add "$REPO_ROOT/.last_good_deploy"
  git commit -m "Update last good deploy ID: $DEPLOY_ID"
  
  echo "$DEPLOY_ID"
}

# Main execution
main() {
  log_prefix "${BLUE}===== AWhittleWandering – One‑Shot Autopilot Deployment =====${NC}"
  
  # 1. PREP
  check_env
  local branch=$(create_branch)
  local max_time_minutes=10
  log_prefix "Setting MAX_TASK_TIME = ${max_time_minutes}m"
  
  # Start timeout monitor in background
  (
    sleep $((max_time_minutes * 60))
    log_prefix "${RED}MAX_TASK_TIME exceeded. Aborting.${NC}"
    kill -TERM "$PPID"
  ) &
  timeout_pid=$!
  
  # 2. QUICK HEALTH TASKS
  task_build
  local preview_url=$(task_edge_preview)
  task_smoke "$preview_url"
  
  # 3. PROMOTE
  local deploy_id=$(task_promote)
  
  # Kill the timeout monitor
  kill $timeout_pid 2>/dev/null || true
  
  log_prefix "${GREEN}===== Deployment completed successfully! =====${NC}"
  log_prefix "Production URL: https://awhittlewandering.com"
  log_prefix "Deployment ID: ${deploy_id}"
}

# Execute main function
main "$@"
