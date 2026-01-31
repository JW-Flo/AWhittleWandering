#!/usr/bin/env bash
set -euo pipefail

TOOL_NAME=${CLINE_TOOL_NAME:-unknown}
TOOL_STATUS=${CLINE_TOOL_STATUS:-unknown}

echo "[cline-hook][PostToolUse] $(date -u +%Y-%m-%dT%H:%M:%SZ) tool=${TOOL_NAME} status=${TOOL_STATUS}" >> .clinerules/hooks/telemetry.log