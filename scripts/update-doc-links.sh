#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MODE="${1:-preview}" # preview|apply

FILES=(
  "SYNC_SECRETS_GUIDE.md"
  "GITHUB_SECRETS_GUIDE.md"
  "SECRET_MANAGEMENT_SUMMARY.md"
  "DEPLOYMENT.md"
  "DEPLOY_PAGES.md"
  "SECURITY.md"
  "ROADMAP.md"
  "STATUS_UPDATE.md"
)

echo "Mode: $MODE"
mkdir -p docs

for f in "${FILES[@]}"; do
  if [ -f "$f" ]; then
    if [ "$MODE" = "preview" ]; then
      if git ls-files --error-unmatch "$f" >/dev/null 2>&1; then
        echo "Would: git mv $f docs/$f"
      else
        echo "Would: copy $f -> docs/$f (untracked file)"
      fi
    else
      if git ls-files --error-unmatch "$f" >/dev/null 2>&1; then
        git mv "$f" "docs/$f"
        echo "Moved tracked $f -> docs/$f"
      else
        cp "$f" "docs/$f"
        git add "docs/$f"
        echo "Copied untracked $f -> docs/$f and staged"
      fi
    fi
  else
    echo "Missing: $f (skipping)"
  fi
done

if [ "$MODE" = "apply" ]; then
  echo "Updating internal links (markdown files)..."
  # Replace occurrences of filename with docs/filename in markdown/text files
  for f in "${FILES[@]}"; do
    # escape for perl
    esc=$(printf '%s\n' "$f" | sed -e 's/[]\/$*.^[]/\\&/g')
    # only in files tracked by git to avoid touching node_modules etc
    git ls-files | xargs -I{} grep -Il --line-number -e "$esc" "{}" 2>/dev/null | while read -r mf; do
      # skip files already inside docs/
      case "$mf" in
        docs/*) continue ;;
      esac
      perl -0777 -pe "s/\\b$esc\\b/docs\/$esc/g" -i "$mf" || true
      git add "$mf"
      echo "Patched links in $mf"
    done
  done

  # Commit changes
  git add docs
  if git diff --cached --quiet; then
    echo "No changes to commit."
  else
    git commit -m "docs: consolidate canonical docs into docs/ and update links"
    echo "Committed doc moves and link updates."
  fi
fi

echo "Done."

