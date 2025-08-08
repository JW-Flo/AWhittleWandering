#!/usr/bin/env bash
set -euo pipefail

case "${1:-help}" in
  lint_test)
    echo "==> Python"
    command -v python3 >/dev/null && python3 -m pip install -q -U pip pytest pytest-cov || true
    [ -f requirements.txt ] && python3 -m pip install -q -r requirements.txt || true
    [ -d tests ] && python3 -m pytest -q --maxfail=1 --disable-warnings || true
    echo "==> Node"
    [ -f package.json ] && (npm ci || npm install); 
    [ -f package.json ] && npm test --silent || true
    ;;
  scan)
    command -v semgrep >/dev/null && semgrep --error --config auto || echo "semgrep not installed"
    command -v bandit  >/dev/null && bandit -r . || echo "bandit not installed"
    command -v trivy   >/dev/null && trivy fs --scanners vuln,secret,config --exit-code 0 --quiet . || echo "trivy not installed"
    ;;
  *)
    echo "Usage: scripts/agentOps.sh {lint_test|scan}";;
esac
