#!/bin/bash
#
# A Whittle Wandering (48 Continental) Project Deployment Script
# 
# This script orchestrates the complete deployment process for the project,
# including the edge-worker, public site, and MCP server components.
#
# Usage:
#   ./scripts/deploy-project.sh [--component <component-name>] [--env <environment>]
#
# Options:
#   --component    Specific component to deploy (edge-worker, public-site, mcp-server, all)
#   --env          Deployment environment (production, staging)
#   --dry-run      Show what would be deployed without making changes
#   --help         Show this help message
#

set -e

# Default values
COMPONENT="all"
ENVIRONMENT="production"
DRY_RUN=false
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
LOG_FILE="$PROJECT_ROOT/deployment-$TIMESTAMP.log"

# Load environment variables
if [[ -f "$PROJECT_ROOT/.env" ]]; then
  source "$PROJECT_ROOT/.env"
fi

# Parse arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --component)
      COMPONENT="$2"
      shift 2
      ;;
    --env)
      ENVIRONMENT="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --help)
      echo "Usage: $0 [--component <component-name>] [--env <environment>] [--dry-run]"
      echo ""
      echo "Options:"
      echo "  --component    Specific component to deploy (edge-worker, public-site, mcp-server, all)"
      echo "  --env          Deployment environment (production, staging)"
      echo "  --dry-run      Show what would be deployed without making changes"
      echo "  --help         Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate inputs
valid_components=("edge-worker" "public-site" "mcp-server" "all")
valid_environments=("production" "staging")

if [[ ! " ${valid_components[@]} " =~ " ${COMPONENT} " ]]; then
  echo "Error: Invalid component '${COMPONENT}'"
  echo "Valid components: ${valid_components[*]}"
  exit 1
fi

if [[ ! " ${valid_environments[@]} " =~ " ${ENVIRONMENT} " ]]; then
  echo "Error: Invalid environment '${ENVIRONMENT}'"
  echo "Valid environments: ${valid_environments[*]}"
  exit 1
fi

# Check for required environment variables
required_vars=()
if [[ "$COMPONENT" == "edge-worker" || "$COMPONENT" == "all" ]]; then
  required_vars+=("CF_API_TOKEN" "CF_ACCOUNT_ID" "TESSIE_API_TOKEN" "TESSIE_VIN" "EDGE_HMAC_KEY")
fi

if [[ "$COMPONENT" == "public-site" || "$COMPONENT" == "all" ]]; then
  required_vars+=("CF_API_TOKEN" "CF_ACCOUNT_ID" "MAPBOX_TOKEN")
fi

missing_vars=()
for var in "${required_vars[@]}"; do
  if [[ -z "${!var}" ]]; then
    missing_vars+=("$var")
  fi
done

if [[ "${#missing_vars[@]}" -gt 0 ]]; then
  echo "Error: Missing required environment variables: ${missing_vars[*]}"
  echo "Please set these variables in your .env file or environment"
  exit 1
fi

# Setup logging
exec > >(tee -a "$LOG_FILE") 2>&1
echo "==== A Whittle Wandering Deployment: $(date) ===="
echo "Component: $COMPONENT"
echo "Environment: $ENVIRONMENT"
echo "Dry run: $DRY_RUN"

# Helper function to print status messages
function print_status() {
  local status="$1"
  local message="$2"
  case $status in
    info)
      echo -e "\033[0;34m[INFO]\033[0m $message"
      ;;
    success)
      echo -e "\033[0;32m[SUCCESS]\033[0m $message"
      ;;
    warn)
      echo -e "\033[0;33m[WARNING]\033[0m $message"
      ;;
    error)
      echo -e "\033[0;31m[ERROR]\033[0m $message"
      ;;
    *)
      echo "$message"
      ;;
  esac
}

# Helper function to execute or simulate commands based on dry run flag
function execute_command() {
  local command="$1"
  local description="$2"
  
  print_status "info" "$description"
  if [[ "$DRY_RUN" == "true" ]]; then
    print_status "info" "DRY RUN: Would execute: $command"
  else
    print_status "info" "Executing: $command"
    eval "$command"
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
      print_status "error" "Command failed with exit code $exit_code"
      return $exit_code
    fi
  fi
}

# Helper function to check if a directory exists and navigate to it
function goto_directory() {
  local dir="$1"
  if [[ ! -d "$dir" ]]; then
    print_status "error" "Directory not found: $dir"
    return 1
  fi
  cd "$dir"
}

# Deploy Edge Worker
function deploy_edge_worker() {
  print_status "info" "Starting edge worker deployment"
  
  # Navigate to edge worker directory
  goto_directory "$PROJECT_ROOT/edge-worker" || return 1
  
  # Install dependencies
  execute_command "npm ci" "Installing edge worker dependencies" || return 1
  
  # Set environment variables for deployment
  local deploy_command="CLOUDFLARE_API_TOKEN=\"$CF_API_TOKEN\" CLOUDFLARE_ACCOUNT_ID=\"$CF_ACCOUNT_ID\" npx wrangler deploy"
  
  # Execute deployment
  execute_command "$deploy_command" "Deploying edge worker to Cloudflare" || return 1
  
  print_status "success" "Edge worker deployed successfully"
  return 0
}

# Deploy Public Site
function deploy_public_site() {
  print_status "info" "Starting public site deployment"
  
  # Navigate to public site directory
  goto_directory "$PROJECT_ROOT/48Continental_Starter/public-site" || return 1
  
  # Create or update .env file for the public site
  local env_file=".env"
  local env_content="VITE_MAPBOX_TOKEN=$MAPBOX_TOKEN"
  
  if [[ "$DRY_RUN" == "true" ]]; then
    print_status "info" "DRY RUN: Would create $env_file with Mapbox token"
  else
    echo "$env_content" > "$env_file"
  fi
  
  # Install dependencies
  execute_command "npm ci" "Installing public site dependencies" || return 1
  
  # Verify Mapbox token
  execute_command "./scripts/verify-mapbox-token.sh || echo 'Warning: Mapbox token verification issue'" \
    "Verifying Mapbox token" || print_status "warn" "Continuing despite Mapbox token verification issue"
  
  # Build the site
  execute_command "npm run build" "Building public site" || return 1
  
  # Check if build directory exists
  if [[ ! -d "dist" && "$DRY_RUN" == "false" ]]; then
    print_status "error" "Build failed: dist directory not found"
    return 1
  fi
  
  # Deploy to Cloudflare Pages
  local deploy_command="CLOUDFLARE_API_TOKEN=\"$CF_API_TOKEN\" CLOUDFLARE_ACCOUNT_ID=\"$CF_ACCOUNT_ID\" npx wrangler pages deploy dist --project-name=\"awhittlewandering-site\" --branch=\"$ENVIRONMENT\""
  
  # Execute deployment
  execute_command "$deploy_command" "Deploying public site to Cloudflare Pages" || return 1
  
  print_status "success" "Public site deployed successfully"
  return 0
}

# Deploy MCP Server
function deploy_mcp_server() {
  print_status "info" "Starting MCP server deployment"
  
  # Navigate to MCP server directory
  goto_directory "$PROJECT_ROOT/mcp-48continental" || goto_directory "$PROJECT_ROOT/mcp-server" || {
    print_status "warn" "MCP server directory not found, skipping"
    return 0
  }
  
  # Install dependencies
  execute_command "npm ci" "Installing MCP server dependencies" || return 1
  
  # Create or update .env file for the MCP server
  local env_file=".env"
  local env_content="TESSIE_API_TOKEN=$TESSIE_API_TOKEN
TESSIE_VIN=$TESSIE_VIN
EDGE_HMAC_KEY=$EDGE_HMAC_KEY"
  
  if [[ "$DRY_RUN" == "true" ]]; then
    print_status "info" "DRY RUN: Would create $env_file with required secrets"
  else
    echo "$env_content" > "$env_file"
  fi
  
  # Build if needed
  if [[ -f "package.json" ]] && grep -q "\"build\"" "package.json"; then
    execute_command "npm run build" "Building MCP server" || return 1
  fi
  
  # Restart the service if running in production
  if [[ "$ENVIRONMENT" == "production" && "$DRY_RUN" == "false" ]]; then
    if command -v pm2 >/dev/null 2>&1; then
      execute_command "pm2 restart mcp-server" "Restarting MCP server with PM2" || 
      execute_command "pm2 start src/index.js --name mcp-server" "Starting MCP server with PM2"
    else
      print_status "warn" "PM2 not found, please manually restart the MCP server"
    fi
  fi
  
  print_status "success" "MCP server deployed successfully"
  return 0
}

# Run post-deployment verification
function verify_deployment() {
  print_status "info" "Running post-deployment verification"
  
  # Check API endpoints if deployed edge worker
  if [[ "$COMPONENT" == "edge-worker" || "$COMPONENT" == "all" ]]; then
    if [[ -f "$PROJECT_ROOT/scripts/test-api-endpoints.js" ]]; then
      goto_directory "$PROJECT_ROOT" || return 1
      execute_command "NODE_OPTIONS=\"--unhandled-rejections=strict\" node ./scripts/test-api-endpoints.js" \
        "Testing API endpoints" || print_status "warn" "API endpoint tests failed"
    else
      print_status "warn" "API endpoint test script not found, skipping verification"
    fi
  fi
  
  # Run comprehensive deployment verification
  if [[ -f "$PROJECT_ROOT/scripts/deployment-success-validator.js" ]]; then
    goto_directory "$PROJECT_ROOT" || return 1
    execute_command "node ./scripts/deployment-success-validator.js" \
      "Verifying deployment success" || print_status "warn" "Deployment verification failed"
  else
    print_status "warn" "Deployment validator script not found, skipping verification"
  fi
  
  # Generate deployment report
  local report_file="$PROJECT_ROOT/LATEST_DEPLOYMENT_REPORT.md"
  local report_content="# A Whittle Wandering Deployment Report\n\n"
  report_content+="**Deployment Date:** $(date)\n\n"
  report_content+="**Component:** $COMPONENT\n\n"
  report_content+="**Environment:** $ENVIRONMENT\n\n"
  report_content+="**Deployment Log:** [View Log]($LOG_FILE)\n\n"
  report_content+="## Deployment Summary\n\n"
  report_content+="The deployment process has completed. Please review the log file for details.\n\n"
  
  if [[ "$DRY_RUN" == "true" ]]; then
    print_status "info" "DRY RUN: Would create deployment report at $report_file"
  else
    echo -e "$report_content" > "$report_file"
    print_status "success" "Deployment report generated: $report_file"
  fi
  
  return 0
}

# Main deployment process
function main() {
  print_status "info" "Starting deployment process"
  
  # Deploy components based on selection
  case $COMPONENT in
    "edge-worker")
      deploy_edge_worker || {
        print_status "error" "Edge worker deployment failed"
        return 1
      }
      ;;
    "public-site")
      deploy_public_site || {
        print_status "error" "Public site deployment failed"
        return 1
      }
      ;;
    "mcp-server")
      deploy_mcp_server || {
        print_status "error" "MCP server deployment failed"
        return 1
      }
      ;;
    "all")
      # Deploy edge worker first
      deploy_edge_worker || {
        print_status "error" "Edge worker deployment failed"
        return 1
      }
      
      # Deploy public site
      deploy_public_site || {
        print_status "error" "Public site deployment failed"
        return 1
      }
      
      # Deploy MCP server
      deploy_mcp_server || {
        print_status "error" "MCP server deployment failed"
        return 1
      }
      ;;
  esac
  
  # Verify deployment
  verify_deployment
  
  print_status "success" "Deployment process completed"
  echo "Deployment log saved to: $LOG_FILE"
  
  return 0
}

# Run the main function
main
exit_code=$?

if [[ $exit_code -eq 0 ]]; then
  print_status "success" "Deployment of $COMPONENT to $ENVIRONMENT environment completed successfully"
else
  print_status "error" "Deployment failed with exit code $exit_code"
fi

exit $exit_code
