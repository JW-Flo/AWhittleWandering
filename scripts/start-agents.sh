#!/usr/bin/env bash
# Script to start both ROO agents in background

ROO_CMD="roo"
if ! command -v "$ROO_CMD" >/dev/null 2>&1; then
  if command -v npx >/dev/null 2>&1; then
    ROO_CMD="npx roo"
  else
    echo "Error: 'roo' CLI not found. Install with 'npm install -g @roo/cli' or use npx."
    exit 1
  fi
fi
echo "Starting Edge Worker agent..."
${ROO_CMD} run --config edge-worker/.agentrc &
EW_PID=$!

echo "Starting iOS Client agent..."
${ROO_CMD} run --config ios-client/.agentrc &
IC_PID=$!

echo "Agents started:"
echo "  Edge Worker PID: $EW_PID"
echo "  iOS Client PID: $IC_PID"

echo "To stop agents, run: kill $EW_PID $IC_PID"
