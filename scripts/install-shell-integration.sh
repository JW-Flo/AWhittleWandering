#!/usr/bin/env bash
set -euo pipefail

# Idempotent VS Code shell integration installer.
# Mirrors minimal DevSecOps pack logic and can be invoked via npm/yarn/bun script or task.

CODE_BIN="${CODE_BIN:-code-insiders}"
if ! command -v "$CODE_BIN" >/dev/null 2>&1; then
  CODE_BIN="code"
fi

ensure_line() {
  local file="$1"; local needle="$2"
  touch "$file"
  grep -Fq "$needle" "$file" || echo "$needle" >> "$file"
}

shell="${SHELL##*/}"
case "$shell" in
  bash)
    RC="$HOME/.bashrc"
    LINE='[[ "$TERM_PROGRAM" == "vscode" ]] && . "$('"$CODE_BIN"' --locate-shell-integration-path bash)"'
    ensure_line "$RC" "$LINE" ;;
  zsh)
    RC="$HOME/.zshrc"
    LINE='[[ "$TERM_PROGRAM" == "vscode" ]] && . "$('"$CODE_BIN"' --locate-shell-integration-path zsh)"'
    ensure_line "$RC" "$LINE" ;;
  fish)
    RC="$HOME/.config/fish/config.fish"; mkdir -p "$(dirname "$RC")"
    LINE='string match -q "$TERM_PROGRAM" "vscode"; and . ('"$CODE_BIN"' --locate-shell-integration-path fish)'
    ensure_line "$RC" "$LINE" ;;
  pwsh|powershell)
    PROFILE_PATH="$(pwsh -NoProfile -Command '$PROFILE')"
    LINE='if ($env:TERM_PROGRAM -eq "vscode") { . & '"$CODE_BIN"' --locate-shell-integration-path pwsh }'
    mkdir -p "$(dirname "$PROFILE_PATH")"
    ensure_line "$PROFILE_PATH" "$LINE" ;;
  *)
    echo "Unsupported shell '$shell' – add integration manually (see VS Code docs)." >&2
    exit 1 ;;
 esac

 echo "Shell integration ensured for $shell. Restart the terminal or source the RC file to activate."
