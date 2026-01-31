#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
MIGRATIONS_DIR="$ROOT_DIR/backend/edge-worker/migrations"
DB_FILE="${TMPDIR:-/tmp}/awhittlewandering-ci-migrations.db"

if [[ ! -d "$MIGRATIONS_DIR" ]]; then
  echo "[migrations-check] ❌ migrations directory not found: $MIGRATIONS_DIR"
  exit 1
fi

rm -f "$DB_FILE"
echo "[migrations-check] Using temp DB: $DB_FILE"

apply_migrations() {
  local pass_label="$1"
  echo "[migrations-check] Applying migrations ($pass_label)"

  for migration in "$MIGRATIONS_DIR"/*.sql; do
    echo "[migrations-check] Running $(basename "$migration")"
    sqlite3 "$DB_FILE" < "$migration"
  done
}

apply_migrations "first"

FIRST_TABLE_COUNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM sqlite_master WHERE type='table';")

apply_migrations "second"

SECOND_TABLE_COUNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM sqlite_master WHERE type='table';")

if [[ "$SECOND_TABLE_COUNT" -lt "$FIRST_TABLE_COUNT" ]]; then
  echo "[migrations-check] ❌ table count regression: $FIRST_TABLE_COUNT -> $SECOND_TABLE_COUNT"
  exit 1
fi

echo "[migrations-check] ✅ migrations idempotency check passed"