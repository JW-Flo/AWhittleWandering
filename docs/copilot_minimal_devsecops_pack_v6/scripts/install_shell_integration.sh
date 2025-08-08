#!/usr/bin/env bash
set -euo pipefail

# Detect VS Code binary
CODE_BIN="${CODE_BIN:-code-insiders}"
if ! command -v "$CODE_BIN" >/dev/null 2>&1; then
  CODE_BIN="code"
fi

function ensure_line {
  local file="$1"; local needle="$2"
  touch "$file"
  grep -Fq "$needle" "$file" || echo "$needle" >> "$file"
}

case "${SHELL##*/}" in
  bash)
    RC="$HOME/.bashrc"
    LINE='[[ "$TERM_PROGRAM" == "vscode" ]] && . "$('"$CODE_BIN"' --locate-shell-integration-path bash)"'
    ensure_line "$RC" "$LINE"
    echo "Installed shell integration line into $RC"
    ;;
  zsh)
    RC="$HOME/.zshrc"
    LINE='[[ "$TERM_PROGRAM" == "vscode" ]] && . "$('"$CODE_BIN"' --locate-shell-integration-path zsh)"'
    ensure_line "$RC" "$LINE"
    echo "Installed shell integration line into $RC"
    ;;
  fish)
    RC="$HOME/.config/fish/config.fish"
    mkdir -p "$(dirname "$RC")"
    LINE='string match -q "$TERM_PROGRAM" "vscode"; and . ('"$CODE_BIN"' --locate-shell-integration-path fish)'
    ensure_line "$RC" "$LINE"
    echo "Installed shell integration line into $RC"
    ;;
  pwsh|powershell)
    PROFILE_PATH="$(pwsh -NoProfile -Command '$PROFILE')"
    LINE='if ($env:TERM_PROGRAM -eq "vscode") { . & '"$CODE_BIN"' --locate-shell-integration-path pwsh }'
    mkdir -p "$(dirname "$PROFILE_PATH")"
    ensure_line "$PROFILE_PATH" "$LINE"
    echo "Installed shell integration line into $PROFILE_PATH"
    ;;
  *)
    echo "Unknown shell; append the appropriate line manually per VS Code docs."
    exit 1
    ;;
esac

echo "Restart your terminal or run: source \"$RC\" (or reload pwsh profile)."
