#!/usr/bin/env bash
set -euo pipefail

# Import an external repo into this repo as a subtree while preserving history.
#
# Usage:
#   ./scripts/import-whimsical-subtree.sh <repo-url> [branch] [prefix]
#
# Example:
#   ./scripts/import-whimsical-subtree.sh https://github.com/JW-Flo/whimsical-wandering-data-6bf04dae main legacy/whimsical

REPO_URL="${1:-}"
BRANCH="${2:-}"
PREFIX="${3:-legacy/whimsical}"
REMOTE_NAME="whimsical"

if [[ -z "$REPO_URL" ]]; then
  echo "ERROR: repo-url is required."
  echo "Usage: $0 <repo-url> [branch] [prefix]"
  exit 2
fi

if [[ -n "$(git status --porcelain=v1)" ]]; then
  echo "ERROR: working tree is not clean. Commit/stash your changes before import."
  exit 2
fi

if git remote get-url "$REMOTE_NAME" >/dev/null 2>&1; then
  CURRENT_URL="$(git remote get-url "$REMOTE_NAME")"
  if [[ "$CURRENT_URL" != "$REPO_URL" ]]; then
    echo "ERROR: remote '$REMOTE_NAME' already exists but points to:"
    echo "  $CURRENT_URL"
    echo "Requested:"
    echo "  $REPO_URL"
    echo "Fix by running: git remote remove $REMOTE_NAME"
    exit 2
  fi
else
  git remote add "$REMOTE_NAME" "$REPO_URL"
fi

git fetch "$REMOTE_NAME" --tags

if [[ -z "$BRANCH" ]]; then
  # Parse "HEAD branch:" from `git remote show`.
  # Example line: "  HEAD branch: main"
  BRANCH="$(git remote show "$REMOTE_NAME" | sed -n 's/^\s*HEAD branch:\s*//p' | head -n 1)"
fi

if [[ -z "$BRANCH" ]]; then
  echo "ERROR: could not determine default branch. Pass it explicitly as arg #2."
  exit 2
fi

echo "Importing '$REPO_URL' (branch: $BRANCH) into prefix '$PREFIX'..."
git subtree add --prefix="$PREFIX" "$REMOTE_NAME" "$BRANCH" -m "Import whimsical repo as legacy subtree (preserve history)"

echo "Done."
echo "Verify history:"
echo "  git log --oneline -- $PREFIX | head"
echo "  git ls-tree -r HEAD --name-only $PREFIX | head"

