# Claude Settings Security

This directory contains the Claude AI agent configuration with built-in security controls.

## Security Model

The `.claude/settings.json` file defines permissions for the Claude agent. To prevent the agent from modifying its own permissions (which would defeat security controls), we implement **SHA-256 integrity verification**.

### Key Security Features

1. **Immutable Permissions**: The agent is **denied** write access to `.claude/**` (see line 23 in `settings.json`)
2. **SHA-256 Verification**: A cryptographic hash ensures the settings file hasn't been tampered with
3. **Human-Only Updates**: Only authorized humans can update settings through git commits

## Files

- `settings.json` - Claude agent permissions configuration
- `settings.json.sha256` - SHA-256 hash for integrity verification
- `verify-settings.sh` - Script to verify settings integrity
- `README.md` - This file

## Verifying Settings Integrity

To verify that the settings file hasn't been modified:

```bash
./.claude/verify-settings.sh
```

✓ Success output: `Claude settings integrity verified successfully`  
✗ Failure output: Security warning with restore instructions

## Updating Settings (Authorized Personnel Only)

**IMPORTANT**: Settings can only be updated by authorized team members through pull requests.

### Step-by-Step Update Process

1. **Make your changes** to `.claude/settings.json`
   ```bash
   # Edit the file with your changes
   vim .claude/settings.json
   ```

2. **Review changes carefully** - Ensure you're not:
   - Exposing secrets or credentials
   - Granting excessive permissions
   - Removing security controls

3. **Generate new SHA-256 hash**
   ```bash
   # On Linux:
   cd .claude && sha256sum settings.json > settings.json.sha256
   
   # On macOS:
   cd .claude && shasum -a 256 settings.json > settings.json.sha256
   ```

4. **Verify the new hash**
   ```bash
   ./.claude/verify-settings.sh
   ```

5. **Commit both files together**
   ```bash
   git add .claude/settings.json .claude/settings.json.sha256
   git commit -m "Update Claude agent permissions"
   ```

6. **Create Pull Request** for review
   - Include rationale for permission changes
   - Tag security reviewers
   - Wait for approval before merging

## Permissions Explained

### Allowed Operations
- **Read(`**`)**: Agent can read any file (needed for code analysis)
- **Write(specific paths)**: Agent can write to approved directories only
- **Bash(specific commands)**: Agent can run approved shell commands

### Denied Operations
- **Read(`.env*`)**: No access to environment files with secrets
- **Read(`**/secrets/**`)**: No access to secrets directories
- **Write(`.claude/**`)**: Cannot modify its own permissions
- **Write(`.github/workflows/**`)**: Cannot modify CI/CD workflows (note: `.github/workflows/ci.yml` is explicitly allowed via an allow rule that overrides this deny rule)
- **Bash(`curl * | bash`)**: Blocked dangerous piped execution
- **Bash(`rm -rf *`)**: Blocked destructive commands

### Important Security Notes

**Git Command Bypass:** The agent has `Bash(git *)` permission which could theoretically be used to modify `.claude/settings.json` via commands like `git checkout`, `git apply`, or `git reset`. However:
1. The SHA-256 verification will detect any such tampering
2. Git operations are logged in the repository history
3. The verification script should be run before any agent operations to detect unauthorized changes
4. In practice, the permission system monitors direct file writes, and git commands would still trigger the file modification timestamps

## Security Rationale

### Why SHA-256 Verification?

1. **Prevents Self-Modification**: Agent cannot grant itself additional permissions
2. **Audit Trail**: Git history shows exactly who changed permissions and when
3. **Tamper Detection**: Any unauthorized modification is immediately detected
4. **Human Approval**: All permission changes require human review via PR

### Attack Prevention

This security model prevents several attack vectors:

1. **Permission Escalation**: Agent cannot remove deny rules
2. **Secret Exposure**: Agent cannot modify settings to read `.env*` or `**/secrets/**`
3. **CI/CD Tampering**: Agent cannot alter workflows to bypass checks
4. **Credential Theft**: Blocks access to sensitive configuration

## CI/CD Integration

The verification script can be integrated into CI pipelines:

```yaml
- name: Verify Claude Settings Integrity
  run: bash ./.claude/verify-settings.sh
```

Note: The script is executable, but using `bash` explicitly ensures it works across all CI environments.

This ensures settings haven't been tampered with before allowing agent operations.

## Troubleshooting

### Settings file modified warning

If you see a security warning about modified settings:

1. **Check git status**: `git status .claude/`
2. **Review changes**: `git diff .claude/settings.json`
3. **If unauthorized**, restore: `git checkout HEAD -- .claude/settings.json`
4. **If authorized**, regenerate hash:
   - Linux: `cd .claude && sha256sum settings.json > settings.json.sha256`
   - macOS: `cd .claude && shasum -a 256 settings.json > settings.json.sha256`

### Hash mismatch in CI

If CI fails with hash mismatch:
- Ensure both `settings.json` and `settings.json.sha256` are committed together
- Verify the hash was generated from the correct file version
- Check for line ending issues (CRLF vs LF)
- Ensure the hash file was generated from within the `.claude` directory (path must be relative: `settings.json` not `.claude/settings.json`)
- The verification script automatically detects and uses the correct command (`sha256sum` on Linux, `shasum` on macOS)

## Additional Security

For enhanced security in production environments, consider:

1. **GPG Signatures**: Sign the hash file with GPG for non-repudiation
   ```bash
   gpg --armor --sign .claude/settings.json.sha256
   ```

2. **CODEOWNERS**: Restrict `.claude/` changes to security team
   ```
   /.claude/ @security-team
   ```

3. **Branch Protection**: Require approval for `.claude/` changes

4. **Audit Logging**: Monitor access to Claude settings in git history
   ```bash
   git log --follow .claude/settings.json
   ```

## Support

For questions about Claude settings security, contact the security team or refer to:
- Claude Code Documentation: https://code.claude.com/docs/en/settings
- GitHub Security Best Practices: ../.github/SECRETS_MANAGEMENT.md
