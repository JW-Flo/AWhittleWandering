#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# Common exclusions for noise directories and known safe files
EXCLUDE_GLOBS=(
  '!.git/**'
  '!node_modules/**'
  '!dist/**'
  '!build/**'
  '!.wrangler/**'
  '!.backup/**'
  '!*.lock'
  '!pnpm-lock.yaml'
  '!package-lock.json'
  '!yarn.lock'
  # Documentation and example code (not production secrets)
  '!docs/**'
  '!*.md'
  '!archive/**'
  # Known safe utility files that use "secret" as variable names
  '!**/utils/totp.ts'
  '!**/utils/totp.js'
  '!**/*.test.ts'
  '!**/*.test.js'
  '!**/*.spec.ts'
  '!**/*.spec.js'
)

scan_paths() {
  local pattern="$1"
  local glob_args=()
  for g in "${EXCLUDE_GLOBS[@]}"; do
    glob_args+=(-g "$g")
  done
  rg --hidden --no-ignore-vcs --files-with-matches -e "$pattern" \
    "${glob_args[@]}" -- . 2>/dev/null || true
}

hits=0
echo "[secscan] scanning for common secret patterns (paths only)..."

# Patterns targeting actual leaked secrets, not code that handles secrets
patterns=(
  # AWS Access Key ID (very specific format)
  'AKIA[0-9A-Z]{16}'
  # Google API key (very specific format)
  'AIzaSy[0-9A-Za-z\-_]{35}'
  # Slack tokens
  'xox[baprs]-[0-9A-Za-z-]{10,}'
  # Private keys (actual key material)
  '-----BEGIN (RSA|EC|OPENSSH|PGP) PRIVATE KEY-----'
  # OpenAI API keys
  'sk-[A-Za-z0-9]{20,}'
  # Bearer tokens with actual values (not placeholders)
  'Bearer [A-Za-z0-9\-_\.]{40,}'
  # Hardcoded passwords in config (quoted strings only, min 12 chars)
  'password\s*[:=]\s*["'\''][^"'\'']{12,}["'\'']'
  # API keys with actual values (quoted, min 24 chars to reduce false positives)
  'api[_-]?key\s*[:=]\s*["'\''][A-Za-z0-9._-]{24,}["'\'']'
)

for pat in "${patterns[@]}"; do
  files="$(scan_paths "$pat")"
  if [[ -n "$files" ]]; then
    echo "[secscan] possible secret pattern: $pat"
    echo "$files"
    hits=1
  fi
done

if [[ -f package-lock.json || -f pnpm-lock.yaml || -f yarn.lock ]]; then
  echo "[secscan] dependency audit (best-effort)..."
  if [[ -f pnpm-lock.yaml ]] && command -v pnpm >/dev/null; then pnpm audit || true; fi
  if [[ -f yarn.lock ]] && command -v yarn >/dev/null; then yarn audit || true; fi
  if [[ -f package-lock.json ]] && command -v npm >/dev/null; then npm audit || true; fi
fi

if [[ "$hits" -eq 1 ]]; then
  echo "[secscan] ❌ possible secrets detected (paths listed). Remediate + rotate if real."
  exit 1
fi

echo "[secscan] ✅ no obvious secrets found"
