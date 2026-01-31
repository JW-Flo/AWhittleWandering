#!/usr/bin/env bash
set -euo pipefail

echo "[cline-hook][TaskStart] $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> .clinerules/hooks/telemetry.log
echo "[cline-hook][TaskStart] task_id=${CLINE_TASK_ID:-unknown}" >> .clinerules/hooks/telemetry.log