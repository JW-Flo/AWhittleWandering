#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

PM="npm"
[[ -f pnpm-lock.yaml ]] && PM="pnpm"
[[ -f yarn.lock ]] && PM="yarn"

echo "[preflight] pm=$PM"

run_script_if_exists() {
  local name="$1"
  if $PM run -s 2>/dev/null | grep -qE "^[[:space:]]*$name(:)?$"; then
    echo "[preflight] $PM run $name"
    $PM run "$name"
  else
    echo "[preflight] skip: $name"
  fi
}

if [[ "$PM" == "pnpm" ]]; then
  command -v pnpm >/dev/null || { echo "pnpm missing"; exit 1; }
  pnpm install --frozen-lockfile || pnpm install
elif [[ "$PM" == "yarn" ]]; then
  yarn install --frozen-lockfile || yarn install
else
  npm ci || npm install
fi

run_script_if_exists format:check
run_script_if_exists lint
run_script_if_exists typecheck
run_script_if_exists test

echo "[preflight] ✅ done"
