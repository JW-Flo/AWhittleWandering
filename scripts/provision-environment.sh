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
    
    # Check if wrangler is installed
    if ! command -v wrangler &>/dev/null; then
        log_error "wrangler CLI not found. Install with: npm install -g wrangler"
        exit 1
    fi
    
    # Check if authenticated
    if ! wrangler whoami &>/dev/null; then
        log_error "Not authenticated with Cloudflare. Run: wrangler login"
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
    
    # Check if database already exists
    if wrangler d1 list 2>/dev/null | grep -q "$db_name"; then
        log_warn "D1 database already exists: $db_name"
        # Try JSON format first (more reliable)
        local db_id=$(wrangler d1 list --json 2>/dev/null | jq -r '.[] | select(.name=="'"$db_name"'") | .uuid' 2>/dev/null || echo "")
        if [ -z "$db_id" ]; then
            # Fallback to text parsing
            db_id=$(wrangler d1 list 2>/dev/null | grep "$db_name" | awk '{print $1}')
        fi
        if [ -n "$db_id" ]; then
            echo "$db_id"
            return 0
        fi
    fi
    
    # Create D1 database
    log "Creating D1 database: $db_name"
    local output=$(wrangler d1 create "$db_name" 2>&1)
    
    # Extract database ID from output
    local db_id=$(echo "$output" | grep -oP 'database_id\s*=\s*"\K[^"]+' || echo "")
    
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
    
    # Check if KV namespace already exists
    # Try JSON format first (more reliable)
    local kv_id=$(wrangler kv:namespace list --json 2>/dev/null | jq -r '.[] | select(.title=="'"$kv_name"'") | .id' 2>/dev/null || echo "")
    
    if [ -n "$kv_id" ]; then
        log_warn "KV namespace already exists: $kv_name"
        echo "$kv_id"
        return 0
    fi
    
    # Create KV namespace
    log "Creating KV namespace: $kv_name"
    local output=$(wrangler kv:namespace create "$kv_name" 2>&1)
    
    # Extract namespace ID from output
    local kv_id=$(echo "$output" | grep -oP 'id\s*=\s*"\K[^"]+' || echo "")
    
    if [ -z "$kv_id" ]; then
        log_error "Failed to create KV namespace or extract ID"
        echo "$output" >&2
        exit 1
    fi
    
    log_success "KV namespace created: $kv_name (ID: $kv_id)"
    echo "$kv_id"
}

apply_migrations() {
    local env_name="$1"
    
    log "Applying D1 migrations for environment: $env_name"
    
    # Check if migrations directory exists
    local migrations_dir="$REPO_ROOT/backend/edge-worker/migrations"
    if [ ! -d "$migrations_dir" ] || [ -z "$(ls -A "$migrations_dir" 2>/dev/null)" ]; then
        log_warn "No migrations found in $migrations_dir"
        return 0
    fi
    
    # Apply migrations
    log "Running: wrangler d1 migrations apply TESLA_DB --env $env_name --remote"
    if wrangler d1 migrations apply TESLA_DB --env "$env_name" --remote; then
        log_success "Migrations applied successfully"
    else
        log_warn "Migration application failed or not supported yet"
        log "You may need to apply migrations manually after updating wrangler.toml"
    fi
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
# Run these commands to set required secrets:
# ============================================================================

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

# 2. Apply D1 migrations:
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
