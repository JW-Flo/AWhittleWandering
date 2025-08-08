#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-"https://awhittlewandering-api.kd8jc7v8cd.workers.dev"}

echo "Running backend smoke QA against $BASE_URL"

failures=0

check() {
  local path="$1"; local expect="${2:-200}"; local label="$3"
  local code
  code=$(curl -s -o /tmp/resp.$$ -w '%{http_code}' "$BASE_URL$path" || echo "000")
  if [ "$code" = "$expect" ]; then
    echo "[PASS] $label ($path => $code)"
  else
    echo "[FAIL] $label ($path => $code expected $expect)"; failures=$((failures+1))
    head -200 /tmp/resp.$$ || true
  fi
  rm -f /tmp/resp.$$ || true
}

check /api/v1/health 200 "Health"
check /api/v1/unified-data 200 "Unified Data"
check /api/v1/config 200 "Config"
check /api/v1/ingestion-status 200 "Ingestion Status"
check /api/v1/component/overview 200 "Component Overview (may be empty)"

echo "Smoke QA completed with $failures failure(s)."
exit $([ $failures -eq 0 ] && echo 0 || echo 1)
