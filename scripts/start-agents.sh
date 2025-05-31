#!/usr/bin/env bash
# Script to start both ROO agents in background

echo "Starting Edge Worker agent..."
roo run --config edge-worker/.agentrc &
EW_PID=$!

echo "Starting iOS Client agent..."
roo run --config ios-client/.agentrc &
IC_PID=$!

echo "Agents started:"
echo "  Edge Worker PID: $EW_PID"
echo "  iOS Client PID: $IC_PID"

echo "To stop agents, run: kill $EW_PID $IC_PID"
