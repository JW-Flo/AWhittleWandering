# Using AI Agents to Fix MapBox Token Issues

This document explains how to use the existing agent architecture to fix the MapBox token error shown in the screenshot.

## The Problem

The map is showing an error: "Map loading error: you may have provided an invalid Mapbox access token."

## Solution 1: Use the MCP Server Directly

The project already has an MCP server with tools to handle token issues:

1. Make sure the MCP server is running:

   ```bash
   cd /Users/joe/Projects/Personal/ContinentalUSA
   bun run start:mcp
   ```

2. Use the `syncEnvironmentVariables` tool that's already built into your MCP server:

   ```bash
   curl -X POST http://localhost:8890 \
     -H "Content-Type: application/json" \
     -d '{"tool":"syncEnvironmentVariables","input":{"source":"merged","syncType":"tokens"}}'
   ```

## Solution 2: Use the MapBox Specialist Agent

You already have a MapBox Specialist Agent defined in `docs/mcp/map-agent.json` that can handle this:

1. Activate the agent:

   ```bash
   cd /Users/joe/Projects/Personal/ContinentalUSA
   node scripts/activate-agent.js map-specialist
   ```

2. Request the agent to fix the token:

   ```bash
   curl -X POST http://localhost:3002/api/fixToken \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

## Solution 3: Run the Fix Script

We've added a convenience script that uses your existing MCP infrastructure:

```bash
cd /Users/joe/Projects/Personal/ContinentalUSA
node scripts/fix-mapbox-token.js
```

## How This Works

Your agent architecture already has:

1. A `MapBox Specialist Agent` defined in `docs/mcp/map-agent.json`
2. An MCP server with tools for environment variable management
3. Tools to synchronize tokens across components

No need to create new agents or scripts each time - your existing infrastructure is designed to handle these issues!
