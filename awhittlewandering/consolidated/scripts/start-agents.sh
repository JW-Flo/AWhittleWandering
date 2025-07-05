#!/usr/bin/env bash
# Script to start both ROO agents in background

## Determine ROO command: use global if available, otherwise use local stub
if command -v roo >/dev/null 2>&1; then
  ROO_CMD=roo
else
  DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  ROO_CMD="$DIR/roo"
fi
echo "Starting Edge Worker agent with '$ROO_CMD'..."
$ROO_CMD run --config edge-worker/.agentrc &
EW_PID=$!

echo "Starting iOS Client agent with '$ROO_CMD'..."
$ROO_CMD run --config ios-client/.agentrc &
IC_PID=$!

echo "Agents started:"
echo "  Edge Worker PID: $EW_PID"
echo "  iOS Client PID: $IC_PID"

echo "To stop agents, run: kill $EW_PID $IC_PID"
