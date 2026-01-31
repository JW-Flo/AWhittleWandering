#!/usr/bin/env bash
set -euo pipefail

TOOL_NAME=${CLINE_TOOL_NAME:-unknown}
TOOL_INPUT=${CLINE_TOOL_INPUT:-}

echo "[cline-hook][PreToolUse] $(date -u +%Y-%m-%dT%H:%M:%SZ) tool=${TOOL_NAME}" >> .clinerules/hooks/telemetry.log

# Guardrail: block raw GPS exposure in public responses if a patch mentions raw lat/lng exposure
if echo "$TOOL_INPUT" | grep -qiE "raw GPS|full GPS|public coordinates"; then
  echo "[cline-hook][PreToolUse] blocked: potential raw GPS exposure" >> .clinerules/hooks/telemetry.log
  exit 2
fi