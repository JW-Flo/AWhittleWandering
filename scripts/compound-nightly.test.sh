#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_DIR"
}

trap cleanup EXIT

mkdir -p "$TMP_DIR/scripts"
cp "$ROOT_DIR/scripts/compound-nightly.sh" "$TMP_DIR/scripts/compound-nightly.sh"

cat >"$TMP_DIR/scripts/security-scan.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
echo "secscan ok"
EOF

cat >"$TMP_DIR/scripts/preflight.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
echo "preflight ok"
EOF

chmod +x "$TMP_DIR/scripts/"*.sh

output="$(cd "$TMP_DIR" && COMPOUND_MAX_ATTEMPTS=1 bash scripts/compound-nightly.sh)"

if [[ "$output" != *"status=complete"* ]]; then
  echo "expected completion log"
  exit 1
fi

if [[ "$output" != *"step=preflight status=skipped reason=no_package_json"* ]]; then
  echo "expected preflight skip when package.json missing"
  exit 1
fi

echo "compound-nightly test: ok"
