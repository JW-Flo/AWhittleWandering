#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

scan_paths() {
  local pattern="$1"
  rg --hidden --no-ignore-vcs --files-with-matches "$pattern" . \
    -g '!.git/**' -g '!node_modules/**' -g '!dist/**' -g '!build/**' -g '!.wrangler/**' -g '!.backup/**' || true
}

hits=0
echo "[secscan] scanning for common secret patterns (paths only)..."

patterns=(
  'AKIA[0-9A-Z]{16}'
  'AIzaSy[0-9A-Za-z\-_]{35}'
  'xox[baprs]-[0-9A-Za-z-]{10,}'
  '-----BEGIN (RSA|EC|OPENSSH|PGP) PRIVATE KEY-----'
  'sk-[A-Za-z0-9]{20,}'
  'Bearer [A-Za-z0-9\-_\.]{20,}'
  'password\s*[:=]\s*["'\''][^"'\'']+["'\'']'
  'api[_-]?key\s*[:=]'
  'secret\s*[:=]'
)

for pat in "${patterns[@]}"; do
  files="$(scan_paths "$pat")"
  if [[ -n "$files" ]]; then
    echo "[secscan] possible secret pattern: $pat"
    echo "$files"
    hits=1
  fi
done

if [[ -f package-lock.json || -fnpm-lock.yaml || -f yarn.lock ]]; then
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
