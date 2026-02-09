#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL_SECRETS=0
VALIDATED_SECRETS=0
MISSING_SECRETS=0
CREATED_SECRETS=0
FAILED_VALIDATIONS=0

# Function to log messages
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if 1Password CLI is available
check_op_cli() {
    if ! command -v op &> /dev/null; then
        log_error "1Password CLI (op) is not installed"
        return 1
    fi
    log_info "1Password CLI found"
    return 0
}

# Function to validate a secret exists in 1Password
validate_1password_secret() {
    local secret_path="$1"
    local secret_name="$2"
    
    if op read "$secret_path" &> /dev/null; then
        log_info "✓ Secret validated: $secret_name"
        ((VALIDATED_SECRETS++))
        return 0
    else
        log_warn "✗ Secret not found: $secret_name at $secret_path"
        ((MISSING_SECRETS++))
        return 1
    fi
}

# Function to create a secret in 1Password
create_1password_secret() {
    local vault="$1"
    local item="$2"
    local field="$3"
    local secret_name="$4"
    local auto_create="${5:-false}"
    
    if [ "$auto_create" != "true" ]; then
        log_warn "Auto-creation disabled for: $secret_name"
        return 1
    fi
    
    log_info "Attempting to create secret: $secret_name in vault: $vault/$item"
    
    # Check if item exists
    if ! op item get "$item" --vault "$vault" &> /dev/null; then
        log_warn "Item $item does not exist in vault $vault - manual creation required"
        ((FAILED_VALIDATIONS++))
        return 1
    fi
    
    # Check if field already exists (prevent overwriting existing secrets)
    local secret_path="op://$vault/$item/$field"
    if op read "$secret_path" &> /dev/null; then
        log_warn "✗ Field $field already exists in item $item - skipping to prevent overwriting existing secret"
        log_warn "  If you need to update this secret, please do so manually in 1Password"
        ((FAILED_VALIDATIONS++))
        return 1
    fi
    
    # Generate a secure random value
    local secret_value=$(openssl rand -base64 48)
    
    # Add field to existing item (field doesn't exist, so this is safe)
    if op item edit "$item" --vault "$vault" "$field[password]=$secret_value" &> /dev/null; then
        log_info "✓ Added new field $field to item $item"
        ((CREATED_SECRETS++))
        return 0
    else
        log_error "Failed to add field to item"
        ((FAILED_VALIDATIONS++))
        return 1
    fi
}

# Function to validate secret format
validate_secret_format() {
    local secret_value="$1"
    local validation_type="$2"
    local pattern="$3"
    local min_length="$4"
    
    # Check minimum length
    if [ -n "$min_length" ] && [ ${#secret_value} -lt "$min_length" ]; then
        log_warn "Secret does not meet minimum length requirement: $min_length"
        return 1
    fi
    
    # Check pattern if provided
    if [ -n "$pattern" ]; then
        if ! echo "$secret_value" | grep -qE "$pattern"; then
            log_warn "Secret does not match required pattern"
            return 1
        fi
    fi
    
    return 0
}

# Function to parse YAML config and validate secrets
validate_from_config() {
    local config_file="$1"
    local environment="$2"
    local auto_create="${3:-false}"
    
    if [ ! -f "$config_file" ]; then
        log_error "Config file not found: $config_file"
        return 1
    fi
    
    log_info "Validating secrets for environment: $environment"
    log_info "Auto-creation: $auto_create"
    echo ""
    
    # Parse config using Python (more reliable than bash YAML parsing)
    python3 <<EOF
import yaml
import sys
import os

try:
    with open('$config_file', 'r') as f:
        config = yaml.safe_load(f)
    
    if not config or 'secrets' not in config:
        print("ERROR: Invalid config format", file=sys.stderr)
        sys.exit(1)
    
    for secret in config['secrets']:
        name = secret['name']
        source = secret.get('source', '1password')
        required = secret.get('required', False)
        
        if source == '1password':
            vault = secret.get('vault', 'AWW_SHARED')
            envs = secret.get('environments', {})
            
            # Get environment-specific item
            if '$environment' in envs:
                item = envs['$environment']
            elif environment in envs:
                item = envs[environment]
            else:
                item = envs.get('production', 'prod')  # Default to prod
            
            secret_path = f"op://{vault}/{item}/{name}"
            
            # Output validation command
            print(f"VALIDATE|{name}|{secret_path}|{required}|{source}")
        else:
            print(f"SKIP|{name}|unknown_source|{required}|{source}")

except Exception as e:
    print(f"ERROR: Failed to parse config: {e}", file=sys.stderr)
    sys.exit(1)
EOF

    if [ $? -ne 0 ]; then
        log_error "Failed to parse secrets configuration"
        return 1
    fi
}

# Main validation logic
main() {
    local config_file="${1:-.github/secrets-config.yml}"
    local environment="${2:-production}"
    local auto_create="${AUTO_CREATE:-false}"
    
    log_info "=========================================="
    log_info "Smart Secrets Validation Pipeline"
    log_info "=========================================="
    echo ""
    
    # Check prerequisites
    if ! check_op_cli; then
        log_error "Prerequisites not met"
        exit 1
    fi
    
    # Validate OP_SERVICE_ACCOUNT_TOKEN is set
    if [ -z "${OP_SERVICE_ACCOUNT_TOKEN}" ]; then
        log_error "OP_SERVICE_ACCOUNT_TOKEN environment variable not set"
        exit 1
    fi
    
    log_info "1Password service account token found"
    echo ""
    
    # Process config file
    while IFS='|' read -r action name path required source; do
        ((TOTAL_SECRETS++))
        
        if [ "$action" = "VALIDATE" ]; then
            if validate_1password_secret "$path" "$name"; then
                # Secret exists, optionally validate format
                if [ "$required" = "True" ]; then
                    log_info "  Required secret validated: $name"
                fi
            else
                if [ "$required" = "True" ]; then
                    log_error "  Required secret missing: $name"
                    
                    # Try to create if auto-create is enabled
                    if [ "$auto_create" = "true" ]; then
                        # Extract vault, item, field from path
                        vault=$(echo "$path" | cut -d'/' -f3)
                        item=$(echo "$path" | cut -d'/' -f4)
                        field=$(echo "$path" | cut -d'/' -f5)
                        create_1password_secret "$vault" "$item" "$field" "$name" "$auto_create" || true
                    fi
                else
                    log_warn "  Optional secret missing: $name (skipping)"
                fi
            fi
        elif [ "$action" = "SKIP" ]; then
            log_warn "Skipping $name - unsupported source: $source"
        fi
    done < <(validate_from_config "$config_file" "$environment" "$auto_create")
    
    # Print summary
    echo ""
    log_info "=========================================="
    log_info "Validation Summary"
    log_info "=========================================="
    log_info "Total secrets checked: $TOTAL_SECRETS"
    log_info "Validated: $VALIDATED_SECRETS"
    log_warn "Missing: $MISSING_SECRETS"
    
    if [ "$auto_create" = "true" ]; then
        log_info "Created: $CREATED_SECRETS"
        log_error "Failed: $FAILED_VALIDATIONS"
    fi
    
    echo ""
    
    # Exit with error if required secrets are missing
    if [ $MISSING_SECRETS -gt 0 ]; then
        log_error "Validation failed: $MISSING_SECRETS secret(s) missing"
        exit 1
    fi
    
    log_info "✓ All required secrets validated successfully"
    exit 0
}

# Run main function
main "$@"
