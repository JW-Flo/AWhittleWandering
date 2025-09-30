#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${1:-http://localhost:8787}" # Pass deployed base URL or default local
printf "[auth-smoke] Target: %s\n" "$BASE_URL"

login=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/v1/auth" -H 'Content-Type: application/json' -d '{"action":"login"}')
register=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/v1/auth" -H 'Content-Type: application/json' -d '{"action":"register"}')
invalid=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/v1/auth" -H 'Content-Type: application/json' -d '{"action":"noop"}')
legacy=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/drop" -H 'Content-Type: application/json' -d '{"action":"login"}')

printf "login=%s register=%s invalid=%s legacy=%s\n" "$login" "$register" "$invalid" "$legacy"

fail=0
[[ "$login" == 200 ]] || { echo "login failed"; fail=1; }
[[ "$register" == 200 ]] || { echo "register failed"; fail=1; }
[[ "$invalid" == 400 ]] || { echo "invalid action expected 400"; fail=1; }
[[ "$legacy" == 200 ]] || { echo "legacy endpoint failed"; fail=1; }

if [ $fail -eq 0 ]; then
  echo "[auth-smoke] PASS"; exit 0
else
  echo "[auth-smoke] FAIL"; exit 1
fi
