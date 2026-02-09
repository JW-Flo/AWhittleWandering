# Secret Auto-Creation Safety Guide

## Overview

The Smart Secrets Validation workflow includes an optional auto-creation feature that can automatically generate missing secrets in 1Password. This document explains the safety mechanisms in place to prevent accidental data loss.

## Safety Mechanisms

### 1. Explicit Opt-In Required

Auto-creation is **disabled by default**. It must be explicitly enabled by:
- Setting `auto_create: true` when running the workflow manually
- The scheduled validation runs with `auto_create: false` by default

### 2. No Overwriting of Existing Secrets

**Critical Safety Feature:** The auto-creation logic will **NEVER** overwrite existing secrets.

When auto-creation is enabled, the script:
1. ✅ Checks if the 1Password item exists
2. ✅ Checks if the field already exists in the item
3. ✅ **Skips creation if the field exists** (with a clear warning message)
4. ✅ Only creates NEW fields that don't exist yet

### 3. Clear Logging

The validation script provides clear feedback:
- `✓ Added new field X to item Y` - Success, field was created
- `✗ Field X already exists in item Y - skipping to prevent overwriting existing secret` - Skipped to protect existing data
- `If you need to update this secret, please do so manually in 1Password` - Manual intervention required

## How It Works

### Code Flow (scripts/validate-secrets.sh)

```bash
create_1password_secret() {
    # 1. Check auto_create is enabled
    if [ "$auto_create" != "true" ]; then
        return 1  # Exit early if disabled
    fi
    
    # 2. Verify item exists
    if ! op item get "$item" --vault "$vault" &> /dev/null; then
        return 1  # Item doesn't exist, manual creation needed
    fi
    
    # 3. Check if field already exists (SAFETY CHECK)
    if op read "op://$vault/$item/$field" &> /dev/null; then
        # Field exists - DO NOT OVERWRITE
        log_warn "Field already exists - skipping to prevent overwriting"
        return 1
    fi
    
    # 4. Safe to create - field doesn't exist
    op item edit "$item" --vault "$vault" "$field[password]=$secret_value"
}
```

### Example Scenarios

#### Scenario 1: Missing Secret (Safe to Create)
```
Validation: TESSIE_API_TOKEN missing from op://AWW_SHARED/prod/TESSIE_API_TOKEN
Auto-create: Enabled
Result: ✓ Created new TESSIE_API_TOKEN field in prod item
```

#### Scenario 2: Existing Secret (Protected)
```
Validation: JWT_SECRET exists but validation marked as missing (e.g., API error)
Auto-create: Enabled
Result: ✗ Field JWT_SECRET already exists - skipping to prevent overwriting
Action: Manual review required
```

#### Scenario 3: Auto-Create Disabled (Default)
```
Validation: ADMIN_TOKEN missing
Auto-create: Disabled (default)
Result: Auto-creation disabled - manual intervention required
```

## Manual Testing

To manually test the safety mechanism:

### Prerequisites
1. 1Password CLI installed (`op --version`)
2. Authenticated to 1Password (`op signin`)
3. Access to AWW_SHARED vault

### Test Case 1: Verify No Overwrite of Existing Secret
```bash
# 1. Create a test secret in 1Password
op item create --category=password \
    --vault=AWW_SHARED \
    --title=test_item \
    test_field[password]="original_value"

# 2. Run validation with auto-create enabled
cd /home/runner/work/AWhittleWandering/AWhittleWandering
# Ensure OP_SERVICE_ACCOUNT_TOKEN is already set securely in your environment
# (e.g., via a .env file or secret store). Avoid pasting real tokens directly
# into shell commands to prevent them from being stored in shell history.
AUTO_CREATE=true ./scripts/validate-secrets.sh .github/secrets-config.yml production

# 3. Verify the original value is preserved
op read "op://AWW_SHARED/test_item/test_field"
# Should still show "original_value", NOT a new random value

# 4. Check logs for safety message
# Should see: "Field test_field already exists in item test_item - skipping..."

# 5. Cleanup
op item delete test_item --vault=AWW_SHARED
```

### Test Case 2: Verify Creation of New Secret
```bash
# 1. Create item without the field
op item create --category=password \
    --vault=AWW_SHARED \
    --title=test_item

# 2. Run validation with auto-create
AUTO_CREATE=true \
OP_SERVICE_ACCOUNT_TOKEN=<your_token> \
./scripts/validate-secrets.sh .github/secrets-config.yml production

# 3. Verify new field was created
op read "op://AWW_SHARED/test_item/test_field"
# Should show newly generated value

# 4. Cleanup
op item delete test_item --vault=AWW_SHARED
```

## Workflow Usage

### Safe Way to Use Auto-Creation

1. **Review validation failures first:**
   ```bash
   # Run without auto-create to see what's missing
   gh workflow run smart-secrets-validation.yml \
       -f environment=production \
       -f auto_create=false
   ```

2. **Manually add critical secrets:**
   - Add any production secrets manually in 1Password
   - This gives you full control over sensitive values

3. **Use auto-create for non-critical secrets:**
   ```bash
   # Enable auto-create for safe, auto-generated secrets
   gh workflow run smart-secrets-validation.yml \
       -f environment=development \
       -f auto_create=true
   ```

4. **Verify results:**
   ```bash
   # Check what was created
   op item get prod --vault=AWW_SHARED
   ```

## Best Practices

1. ✅ **Always review validation logs before enabling auto-create**
2. ✅ **Use auto-create for development environments first**
3. ✅ **Manually create production secrets for critical services**
4. ✅ **Enable auto-create only for non-sensitive, auto-generated tokens**
5. ✅ **Regularly audit secrets in 1Password**

## Security Considerations

- Auto-generated secrets use `openssl rand -base64 48` (384-bit entropy)
- Secrets are never logged or printed to console
- All 1Password operations use secure service account authentication
- Field type is set to `[password]` for secure storage

## Related Documentation

- [Smart Secrets Validation Workflow](../.github/workflows/smart-secrets-validation.yml)
- [Secrets Configuration](../.github/secrets-config.yml)
- [Sync Secrets Guide](./SYNC_SECRETS_GUIDE.md)
- [Secret Management Summary](./SECRET_MANAGEMENT_SUMMARY.md)

## Changelog

### 2026-02-09 - Initial Safety Implementation
- Added check to prevent overwriting existing secret fields
- Added clear logging for skipped creations
- Updated workflow documentation with safety notice

---

*Last updated: 2026-02-09*
