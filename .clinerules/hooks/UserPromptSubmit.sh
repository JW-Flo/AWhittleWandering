#!/usr/bin/env bash
set -euo pipefail

echo "[cline-hook][UserPromptSubmit] $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> .clinerules/hooks/telemetry.log
echo "[cline-hook][UserPromptSubmit] prompt_len=${CLINE_PROMPT_LENGTH:-unknown}" >> .clinerules/hooks/telemetry.log