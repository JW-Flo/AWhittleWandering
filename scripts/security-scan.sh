#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# Exclusions for false positives
EXCLUDE_GLOBS=(
  '!.git/**'
  '!node_modules/**'
  '!dist/**'
  '!build/**'
  '!.wrangler/**'
  '!.backup/**'
  '!**/*.test.ts'      # Test files often have mock credentials
  '!**/*.spec.ts'      # Spec files often have mock credentials
  '!**/tests/**'       # Test directories
  '!**/__tests__/**'   # Jest test directories
  '!*.example'         # Example files
  '!*.example.*'       # Example files
  '!.env.example'      # Example env files
)

scan_paths() {
  local pattern="$1"
  local glob_args=""
  for g in "${EXCLUDE_GLOBS[@]}"; do
    glob_args="$glob_args -g '$g'"
  done
  eval "rg --hidden --no-ignore-vcs --files-with-matches -e '$pattern' $glob_args -- . 2>/dev/null" || true
}

hits=0
echo "[secscan] scanning for common secret patterns (paths only)..."

# High-confidence patterns - these are almost always real secrets
high_confidence_patterns=(
  'AKIA[0-9A-Z]{16}'                                    # AWS Access Key ID
  'AIzaSy[0-9A-Za-z\-_]{35}'                           # Google API Key
  'xox[baprs]-[0-9A-Za-z-]{10,}'                       # Slack tokens
  '-----BEGIN (RSA|EC|OPENSSH|PGP) PRIVATE KEY-----'  # Private keys
  'sk-[A-Za-z0-9]{48,}'                                # OpenAI API Key (48+ chars)
)

# Medium-confidence patterns - may have false positives
medium_confidence_patterns=(
  'Bearer [A-Za-z0-9\-_\.]{40,}'                       # Bearer tokens (40+ chars to reduce FP)
)

for pat in "${high_confidence_patterns[@]}"; do
  files="$(scan_paths "$pat")"
  if [[ -n "$files" ]]; then
    echo "[secscan] ❌ HIGH-CONFIDENCE secret pattern found: $pat"
    echo "$files"
    hits=1
  fi
done

for pat in "${medium_confidence_patterns[@]}"; do
  files="$(scan_paths "$pat")"
  if [[ -n "$files" ]]; then
    echo "[secscan] ⚠️  Medium-confidence pattern (review manually): $pat"
    echo "$files"
    # Don't set hits=1 for medium confidence - just warn
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
