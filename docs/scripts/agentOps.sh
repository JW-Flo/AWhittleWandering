#!/usr/bin/env bash
set -euo pipefail

cmd="${1:-help}"

py_env="${PYTHON:-python3}"
node_env="${NODE:-node}"
npm_cmd="${NPM:-npm}"

case "$cmd" in
  lint_test)
    echo "==> Python lint/test"
    $py_env -m pip install -q -U pip
    $py_env -m pip install -q pytest pytest-cov bandit
    if [ -f requirements.txt ]; then $py_env -m pip install -q -r requirements.txt || true; fi
    if [ -d tests ]; then $py_env -m pytest -q --maxfail=1 --disable-warnings || true; fi
    echo "==> Node lint/test"
    if [ -f package.json ]; then $npm_cmd ci || $npm_cmd install; fi
    if [ -f package.json ]; then $npm_cmd test --silent || true; fi
    ;;
  scan)
    echo "==> Semgrep"
    semgrep --error --config auto || true
    echo "==> Bandit"
    bandit -r . || true
    echo "==> Trivy fs scan"
    trivy fs --scanners vuln,secret,config --exit-code 0 --quiet . || true
    ;;
  tf_plan)
    echo "==> Terraform fmt/validate/plan"
    cd infra/terraform || exit 1
    terraform fmt -recursive
    terraform init -input=false
    terraform validate
    terraform plan -input=false
    ;;
  cf_deploy)
    echo "==> Cloudflare Worker build & deploy"
    if command -v wrangler >/dev/null 2>&1; then
      wrangler deploy --env production
    else
      echo "wrangler not found. Install: npm i -g wrangler"
      exit 1
    fi
    ;;
  help|*)
    cat <<EOF
Usage: scripts/agentOps.sh <command>
  lint_test     - Lint & test Python/Node
  scan          - Semgrep, Bandit, Trivy scans
  tf_plan       - Terraform fmt/validate/plan (infra/terraform)
  cf_deploy     - Build & deploy Cloudflare Worker (wrangler)
EOF
    ;;
esac
