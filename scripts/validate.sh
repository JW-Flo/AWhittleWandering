#!/usr/bin/env bash
# Unified validation script — single entrypoint for repo self-validation.
# Usage: ./scripts/validate.sh [--quick]
# Exit code 0 = pass, non-zero = fail.

set -euo pipefail

QUICK="${1:-}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

pass=0
fail=0

step() {
  echo "──── $1"
}

check() {
  if "$@"; then
    pass=$((pass + 1))
  else
    echo "  FAIL: $*"
    fail=$((fail + 1))
  fi
}

# 1. Deterministic install check
step "Install integrity"
check test -d node_modules

# 2. Shared package build
step "Shared package build"
check test -f shared/dist/schemas/canonical/event-types.js
check test -f shared/dist/providers/provider-interface.js

# 3. Backend tests
step "Backend tests"
check npm test --prefix backend/edge-worker -- --run

# 4. Backend build
step "Backend build"
check npm run build --prefix backend/edge-worker

# 5. Frontend build (skip on --quick)
if [ "$QUICK" != "--quick" ]; then
  step "Frontend build"
  check npm run build --prefix frontend
fi

# 6. Security: no secrets in tracked files
step "Secret scan (basic)"
check bash -c '! git grep -lE "(CLOUDFLARE_API_TOKEN|sk-[a-zA-Z0-9]{20,}|AKIA[A-Z0-9]{16})" -- ":(exclude)scripts/validate.sh" ":(exclude).github/workflows/*"'

# 7. Migration idempotency
step "Migration files present"
check test -d backend/edge-worker/migrations
check bash -c 'ls backend/edge-worker/migrations/*.sql >/dev/null 2>&1'

# Summary
echo ""
echo "════════════════════════════"
echo "  PASS: $pass  FAIL: $fail"
echo "════════════════════════════"

[ "$fail" -eq 0 ]
