#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

MAX_ATTEMPTS="${COMPOUND_MAX_ATTEMPTS:-3}"

log() {
  echo "event=compound $*"
}

warn() {
  echo "::warning::event=compound $*"
}

error() {
  echo "::error::event=compound $*"
}

on_error() {
  local exit_code=$?
  error "status=error exit_code=$exit_code"
}

trap on_error ERR

retry() {
  local name="$1"
  shift
  local attempt=1
  local delay=2

  while true; do
    log "step=$name attempt=$attempt status=start"
    if "$@"; then
      log "step=$name attempt=$attempt status=success"
      return 0
    fi

    if [[ "$attempt" -ge "$MAX_ATTEMPTS" ]]; then
      error "step=$name status=failed attempts=$attempt"
      return 1
    fi

    warn "step=$name status=retrying next_delay=${delay}s"
    sleep "$delay"
    attempt=$((attempt + 1))
    delay=$((delay * 2))
  done
}

log "status=start max_attempts=$MAX_ATTEMPTS"
retry "security-scan" bash scripts/security-scan.sh

if [[ -f package.json ]]; then
  retry "preflight" bash scripts/preflight.sh
else
  log "step=preflight status=skipped reason=no_package_json"
fi

log "status=complete"
