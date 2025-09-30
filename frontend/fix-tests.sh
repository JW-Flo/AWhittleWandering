
#!/usr/bin/env bash
set -euo pipefail

FILE="src/pages/Index.tsx"
BACKUP="${FILE}.bak.fix-tests"

cp -n "$FILE" "$BACKUP" 2>/dev/null || true

echo "[fix-tests] Updating $FILE (backup at $BACKUP)"

# Guard: ensure pattern exists before replacing to avoid malformed output
safe_replace() {
	local search="$1"; shift
	local replace="$1"; shift
	if grep -q "$search" "$FILE"; then
		# Use perl for safer in-place editing (handles quotes). macOS perl available.
		perl -0777 -i -pe "s/$search/$replace/g" "$FILE"
	else
		echo "[fix-tests] Pattern not found, skipping: $search" >&2
	fi
}

# Add test id only if not already present
if ! grep -q 'data-testid="dashboard-container"' "$FILE"; then
	safe_replace '<div className=\\"min-h-screen bg-background\\"' '<div data-testid="dashboard-container" className="min-h-screen bg-background"'
fi

# Simplify loading message (non-critical)
safe_replace 'Loading live Tesla data...' 'Loading...'

# User-friendly retry message (idempotent)
safe_replace 'setError(err instanceof Error ? err.message : \\"Failed to fetch Tesla data\\");' 'setError("Unable to connect. Please check your connection and try again.");'

echo "[fix-tests] Completed updates"

