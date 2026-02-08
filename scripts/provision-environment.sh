#!/usr/bin/env bash
# =============================================================================
# Environment Provisioning Script
# =============================================================================
# Provisions Cloudflare resources (D1, KV) for a new environment.
# This script enables smooth customer onboarding by automating resource creation.
#
# Usage: bash scripts/provision-environment.sh <environment-name>
# Example: bash scripts/provision-environment.sh staging
#          bash scripts/provision-environment.sh customer-acme
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_NAME="${1:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() { echo -e "${BLUE}[provision]${NC} $*"; }
log_success() { echo -e "${GREEN}[provision] ✅${NC} $*"; }
log_error() { echo -e "${RED}[provision] ❌${NC} $*" >&2; }
log_warn() { echo -e "${YELLOW}[provision] ⚠️${NC} $*"; }

# =============================================================================
# Validation
# =============================================================================

validate_prerequisites() {
    log "Validating prerequisites..."
    
    # Resolve wrangler command: prefer local, then global, then npx
    WRANGLER=""
    
    if [ -x "$REPO_ROOT/backend/edge-worker/node_modules/.bin/wrangler" ]; then
        WRANGLER="$REPO_ROOT/backend/edge-worker/node_modules/.bin/wrangler"
    elif command -v wrangler &>/dev/null; then
        WRANGLER="$(command -v wrangler)"
    elif command -v npx &>/dev/null; then
        WRANGLER="npx wrangler"
    else
        log_error "wrangler CLI not found.

This repository vendors wrangler as a devDependency for the edge worker.
Ensure dependencies are installed (e.g., 'npm install' in backend/edge-worker)
or install wrangler globally (e.g., 'npm install -g wrangler')."
        exit 1
    fi
    
    # Check if authenticated
    if ! $WRANGLER whoami &>/dev/null; then
        log_error "Not authenticated with Cloudflare. Run: $WRANGLER login"
        exit 1
    fi
    
    # Check if jq is installed (required for idempotent provisioning)
    if ! command -v jq &>/dev/null; then
        log_error "jq is required but was not found on PATH. Please install jq from https://stedolan.github.io/jq/ or your package manager."
        exit 1
    fi
    
    log_success "Prerequisites validated"
}

validate_environment_name() {
    if [ -z "$ENV_NAME" ]; then
        log_error "Environment name is required"
        echo ""
        echo "Usage: $0 <environment-name>"
        echo ""
        echo "Examples:"
        echo "  $0 staging"
        echo "  $0 customer-acme"
        echo "  $0 customer-widgets"
        exit 1
    fi
    
    # Validate environment name format (lowercase, alphanumeric, hyphens)
    if ! [[ "$ENV_NAME" =~ ^[a-z0-9-]+$ ]]; then
        log_error "Environment name must be lowercase alphanumeric with hyphens only"
        exit 1
    fi
    
    log_success "Environment name validated: $ENV_NAME"
}

# =============================================================================
# Resource Provisioning
# =============================================================================

provision_d1_database() {
    local db_name="tesla-journey-tracker-${ENV_NAME}"
    
    log "Provisioning D1 database: $db_name"
    
    # Check if database already exists using exact JSON match
    local d1_list_json
    if ! d1_list_json=$($WRANGLER d1 list --json 2>/dev/null); then
        log_error "Failed to list existing D1 databases with wrangler; cannot verify if ${db_name} already exists."
        exit 1
    fi
    
    local db_id
    db_id=$(echo "$d1_list_json" | jq -r --arg name "$db_name" '.[] | select(.name == $name) | .uuid' 2>/dev/null || true)
    
    if [ -n "$db_id" ] && [ "$db_id" != "null" ]; then
        log_warn "D1 database already exists: $db_name"
        echo "$db_id"
        return 0
    fi
    
    # Create D1 database
    log "Creating D1 database: $db_name"
    local output=$($WRANGLER d1 create "$db_name" 2>&1)
    
    # Extract database ID from output using portable sed
    local db_id=$(echo "$output" | sed -n 's/.*database_id[[:space:]]*=[[:space:]]*"\([^"]*\)".*/\1/p')
    
    if [ -z "$db_id" ]; then
        log_error "Failed to create D1 database or extract ID"
        echo "$output" >&2
        exit 1
    fi
    
    log_success "D1 database created: $db_name (ID: $db_id)"
    echo "$db_id"
}

provision_kv_namespace() {
    # Note: KV namespace name follows convention: awhittlewandering-auth-{env}
    # This naming is specific to this project's authentication token storage
    local kv_name="awhittlewandering-auth-${ENV_NAME}"
    
    log "Provisioning KV namespace: $kv_name"
    
    # Check if KV namespace already exists using JSON
    local kv_list_json
    if ! kv_list_json=$($WRANGLER kv:namespace list --json 2>/dev/null); then
        log_error "Failed to list existing KV namespaces; cannot verify if ${kv_name} already exists."
        exit 1
    fi
    
    local kv_id
    kv_id=$(echo "$kv_list_json" | jq -r --arg name "$kv_name" '.[] | select(.title == $name) | .id' 2>/dev/null || true)
    
    if [ -n "$kv_id" ] && [ "$kv_id" != "null" ]; then
        log_warn "KV namespace already exists: $kv_name"
        echo "$kv_id"
        return 0
    fi
    
    # Create KV namespace
    log "Creating KV namespace: $kv_name"
    local output=$($WRANGLER kv:namespace create "$kv_name" 2>&1)
    
    # Extract namespace ID from output using portable sed
    local kv_id=$(echo "$output" | sed -n 's/.*id[[:space:]]*=[[:space:]]*"\([^"]*\)".*/\1/p')
    
    if [ -z "$kv_id" ]; then
        log_error "Failed to create KV namespace or extract ID"
        echo "$output" >&2
        exit 1
    fi
    
    log_success "KV namespace created: $kv_name (ID: $kv_id)"
    echo "$kv_id"
}

# =============================================================================
# Configuration Generation
# =============================================================================

generate_wrangler_config() {
    local env_name="$1"
    local db_id="$2"
    local kv_id="$3"
    
    log "Generating wrangler.toml configuration for environment: $env_name"
    
    cat <<EOF

# ============================================================================
# Environment: $env_name
# ============================================================================
# Generated by: scripts/provision-environment.sh
# Date: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
# ============================================================================

[env.$env_name]
name = "awhittlewandering-api-${env_name}"

[env.$env_name.vars]
AI_GATEWAY_ID = "awhittlewandering-ai"
AI_MODEL_NAME = "@cf/meta/llama-3.1-8b-instruct"
LOG_LEVEL = "info"
ENVIRONMENT = "$env_name"

[[env.$env_name.d1_databases]]
binding = "TESLA_DB"
database_name = "tesla-journey-tracker-${env_name}"
database_id = "$db_id"

[[env.$env_name.kv_namespaces]]
binding = "AUTH_TOKENS"
id = "$kv_id"

[[env.$env_name.analytics_engine_datasets]]
binding = "TELEMETRY_ANALYTICS"

[env.$env_name.ai]
binding = "AI"

# Optional: Add custom route for this environment
# [[env.$env_name.routes]]
# pattern = "api-${env_name}.awhittlewandering.com/*"
# zone_name = "awhittlewandering.com"

EOF
}

generate_secrets_checklist() {
    local env_name="$1"
    
    log "Generating secrets checklist for environment: $env_name"
    
    cat <<EOF

# ============================================================================
# Secrets Checklist for Environment: $env_name
# ============================================================================
# Run these commands to set required secrets (from backend/edge-worker directory):
# ============================================================================

cd backend/edge-worker
wrangler secret put TESSIE_API_TOKEN --env $env_name
wrangler secret put MAPBOX_API_TOKEN --env $env_name
wrangler secret put OPENWEATHER_API_KEY --env $env_name
wrangler secret put JWT_SECRET --env $env_name
wrangler secret put TESLA_VIN --env $env_name

# ============================================================================
# Verification
# ============================================================================
# List secrets (without values):
wrangler secret list --env $env_name

# Deploy to this environment:
wrangler deploy --env $env_name

# Test health endpoint:
curl https://api-${env_name}.awhittlewandering.com/api/v1/health

EOF
}

generate_deployment_commands() {
    local env_name="$1"
    
    cat <<EOF

# ============================================================================
# Deployment Commands for Environment: $env_name
# ============================================================================

# 1. Update wrangler.toml with the configuration above

# 2. Apply D1 migrations (from backend/edge-worker directory):
cd backend/edge-worker
wrangler d1 migrations apply TESLA_DB --env $env_name --remote

# 3. Set secrets (see checklist above)

# 4. Deploy worker:
wrangler deploy --env $env_name

# 5. Verify deployment:
curl https://awhittlewandering-api-${env_name}.{account-id}.workers.dev/api/v1/health

EOF
}

# =============================================================================
# Main Provisioning Flow
# =============================================================================

main() {
    echo ""
    log "========================================="
    log "Environment Provisioning Script"
    log "========================================="
    echo ""
    
    # Validation
    validate_prerequisites
    validate_environment_name
    
    echo ""
    log "========================================="
    log "Provisioning resources for: $ENV_NAME"
    log "========================================="
    echo ""
    
    # Provision resources
    DB_ID=$(provision_d1_database)
    KV_ID=$(provision_kv_namespace)
    
    echo ""
    log "========================================="
    log "Provisioning Complete!"
    log "========================================="
    echo ""
    
    # Display resource IDs
    log_success "Environment: $ENV_NAME"
    log_success "D1 Database ID: $DB_ID"
    log_success "KV Namespace ID: $KV_ID"
    
    echo ""
    log "========================================="
    log "Next Steps"
    log "========================================="
    echo ""
    
    # Save configuration to file
    local config_file="$REPO_ROOT/.env.$ENV_NAME.resources"
    cat > "$config_file" <<EOF
# Cloudflare Resources for Environment: $ENV_NAME
# Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
D1_DATABASE_ID=$DB_ID
KV_NAMESPACE_ID=$KV_ID
ENVIRONMENT_NAME=$ENV_NAME
EOF
    log_success "Resource IDs saved to: $config_file"
    
    echo ""
    log "1. Add the following configuration to backend/edge-worker/wrangler.toml:"
    echo ""
    generate_wrangler_config "$ENV_NAME" "$DB_ID" "$KV_ID"
    
    echo ""
    log "2. Set required secrets:"
    echo ""
    generate_secrets_checklist "$ENV_NAME"
    
    echo ""
    log "3. Deploy to the new environment:"
    echo ""
    generate_deployment_commands "$ENV_NAME"
    
    echo ""
    log_success "Provisioning script completed successfully!"
    echo ""
}

# Run main function
main
