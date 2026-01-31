# Smart Secrets Management

This directory contains the smart secrets validation and management system for the AWhittleWandering project.

## Overview

The smart secrets management system provides:
- **Automated validation** of secrets across multiple sources
- **Dynamic secret creation** for missing secrets (when enabled)
- **Multi-environment support** (development, production)
- **Error handling and notifications** via GitHub Issues
- **Secrets as code** configuration

## Components

### 1. Secrets Configuration (`secrets-config.yml`)

Defines all required secrets with:
- Source (1Password, etc.)
- Vault and item paths
- Environment mappings (dev/prod)
- Validation rules (type, pattern, min_length)
- Required vs optional flags

Example:
```yaml
secrets:
  - name: TESSIE_API_TOKEN
    source: 1password
    vault: AWW_SHARED
    environments:
      production: prod
      development: dev
    required: true
    validation:
      type: token
      min_length: 32
```

### 2. Validation Script (`scripts/validate-secrets.sh`)

Bash script that:
- Parses the secrets configuration
- Validates each secret exists in its source
- Optionally creates missing secrets
- Reports detailed validation results

Usage:
```bash
# Validate production secrets
./scripts/validate-secrets.sh .github/secrets-config.yml production

# Validate with auto-creation enabled
AUTO_CREATE=true ./scripts/validate-secrets.sh .github/secrets-config.yml production
```

### 3. Smart Secrets Validation Workflow (`smart-secrets-validation.yml`)

GitHub Actions workflow that:
- Runs on schedule (daily at 3 AM UTC)
- Can be triggered manually with environment selection
- Validates all configured secrets
- Creates GitHub Issues on validation failures
- Supports automatic secret creation

## Usage

### Manual Validation

1. Go to Actions → Smart Secrets Validation
2. Click "Run workflow"
3. Select environment (production/development)
4. Choose whether to enable auto-creation
5. Click "Run workflow"

### Automated Validation

The workflow runs automatically daily at 3 AM UTC. If validation fails:
- A GitHub Issue is created with details
- The workflow logs show which secrets are missing
- Team members are notified

### Adding New Secrets

1. Add the secret definition to `.github/secrets-config.yml`:
```yaml
secrets:
  - name: NEW_SECRET_NAME
    source: 1password
    vault: AWW_SHARED
    environments:
      production: prod
      development: dev
    required: true
    validation:
      type: token
      min_length: 32
```

2. Manually add the secret to 1Password vault

3. Run the validation workflow to confirm

### Secret Creation

To enable automatic creation of missing secrets:
- Run the workflow manually with `auto_create: true`
- Or update the config file to set `auto_create.enabled: true`

**Note:** Auto-creation generates secure random values. You may need to update these with actual API keys afterward.

## Security Considerations

- The `OP_SERVICE_ACCOUNT_TOKEN` (AWW_1PASS_SA) is required for all operations
- Auto-creation is disabled by default to prevent accidental secret generation
- All operations are logged in workflow runs
- Secrets are masked in GitHub Actions logs automatically

## Troubleshooting

### Validation Fails

1. Check the workflow logs for specific missing secrets
2. Verify the 1Password vault and item paths are correct
3. Ensure the service account token has access to the vault
4. Manually add missing secrets to 1Password

### Auto-Creation Fails

1. Verify the 1Password item exists (script can't create items, only fields)
2. Check service account permissions
3. Review the script logs for specific error messages

## Integration with Existing Workflows

The smart validation system complements the existing workflows:

- **sync-secrets.yml**: Continues to sync secrets to Cloudflare Workers
- **test-1password-pipeline.yml**: Tests 1Password integration
- **1password-example.yml**: Shows usage examples

All workflows use the same secrets configuration, ensuring consistency.

## Future Enhancements

Potential improvements:
- Support for additional secret sources (AWS Secrets Manager, HashiCorp Vault)
- Slack/Email notifications
- Secret rotation automation
- Compliance reporting
- Secret expiration tracking
