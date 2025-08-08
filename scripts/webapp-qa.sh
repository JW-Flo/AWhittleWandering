#!/usr/bin/env bash
set -euo pipefail

# Simple Web App QA Script
# 1. Build shared, backend, frontend
# 2. Run contract/schema QA scripts if available
# 3. Deploy backend in dev (remote) and hit health endpoint
# 4. Summarize results

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

pass() { echo -e "[PASS] $1"; }
fail() { echo -e "[FAIL] $1"; exit 1; }

# Ensure bun/node tooling present
command -v bun >/dev/null || fail "bun not installed"

# Build sequence
(bun run build:shared && pass "Shared build") || fail "Shared build"
(bun run build:backend && pass "Backend build") || fail "Backend build"
(bun run build:frontend && pass "Frontend build") || fail "Frontend build"

# Backend QA (contract/schema) if scripts exist
if [ -d backend/edge-worker ]; then
  pushd backend/edge-worker >/dev/null
  if grep -q "qa:contract" package.json 2>/dev/null; then
    (bun run qa:contract && pass "Contract QA") || fail "Contract QA"
  fi
  if grep -q "qa:schema" package.json 2>/dev/null; then
    (bun run qa:schema && pass "Schema QA") || fail "Schema QA"
  fi
  popd >/dev/null
fi

# Remote dev deploy (best effort)
if [ -d backend/edge-worker ]; then
  pushd backend/edge-worker >/dev/null
  if grep -q "\"deploy\"" package.json; then
    if bun run deploy 2>&1 | tee /tmp/dev_deploy.log | grep -Eqi "uploaded|success|ready"; then
      pass "Dev deploy initiated"
    else
      echo "Skipping failure exit – deploy may require auth or remote context"
    fi
  fi
  popd >/dev/null
fi

# Health endpoint probe (optional): user to adjust BASE_URL env
BASE_URL=${BASE_URL:-"https://example.invalid"}
if curl -sSf "$BASE_URL/api/v1/health" -m 10 >/dev/null 2>&1; then
  pass "Health endpoint reachable at $BASE_URL"
else
  echo "Health probe skipped or failed (set BASE_URL to deployed worker host)"
fi

echo "Web App QA complete."
