#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

scan_paths() {
  local pattern="$1"
  if ! command -v rg >/dev/null 2>&1; then
    echo "[secscan] rg not found; skipping scan (CI installs ripgrep explicitly)"
    return 0
  fi

  # IMPORTANT: all flags (including -g) must come before the pattern/path args.
  rg --hidden --no-ignore-vcs --files-with-matches \
    -g '!.git/**' \
    -g '!node_modules/**' -g '!dist/**' -g '!build/**' -g '!.wrangler/**' -g '!.backup/**' \
    -g '!**/package-lock.json' -g '!**/pnpm-lock.yaml' -g '!**/yarn.lock' \
    -g '!scripts/security-scan.sh' -g '!scripts/setup-ide-ai.sh' \
    -- "$pattern" . || true
}

hits=0
echo "[secscan] scanning for common secret patterns (paths only)..."

patterns=(
  'AKIA[0-9A-Z]{16}'
  'AIzaSy[0-9A-Za-z\\-_]{35}'
  'xox[baprs]-[0-9A-Za-z-]{10,}'
  '-----BEGIN (RSA|EC|OPENSSH|PGP) PRIVATE KEY-----'
  'sk-[A-Za-z0-9]{20,}'
  'Bearer [A-Za-z0-9\\-_\\.]{20,}'
  'password\\s*[:=]\\s*["'\''][^"'\'']+["'\'']'
)

# Files that commonly contain documentation/examples/placeholder text which are noisy in scans.
# Keep this list tight; it should only include known-safe contexts.
is_allowed_path() {
  local f="$1"
  case "$f" in
    docs/*|archive/*|legacy/*|qa/*|debug/*|GITHUB_SECRETS_GUIDE.md|SYNC_SECRETS_GUIDE.md) return 0 ;;
    *) return 1 ;;
  esac
}

for pat in "${patterns[@]}"; do
  files="$(scan_paths "$pat")"
  if [[ -n "$files" ]]; then
    # Filter out allowlisted paths to reduce false positives.
    filtered=""
    while IFS= read -r f; do
      [[ -z "$f" ]] && continue
      if ! is_allowed_path "$f"; then
        filtered+="${f}"$'\n'
      fi
    done <<< "$files"

    if [[ -n "${filtered//$'\n'/}" ]]; then
      echo "[secscan] possible secret pattern (non-allowlisted): $pat"
      echo "$filtered"
      hits=1
    else
      echo "[secscan] allowlisted matches for pattern: $pat"
    fi
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
