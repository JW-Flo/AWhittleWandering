# MCP Server (Orchestrator) – 48 Continental

This directory contains the local orchestrator for the 48 Continental project. The MCP server is responsible for:

- Scheduling and coordinating agent tasks (iOS, Edge Worker, CLI, Shared)
- Buffering telemetry locally (lowdb/SQLite)
- Exposing a REST API for tracker and web clients
- Managing a persistent task queue and agent status
- Providing MCP tools for agent integration and validation

## Directory Structure

```
mcp-server/
  ├── src/
  │   ├── api/         # REST API endpoints
  │   ├── db/          # Database integration (lowdb/SQLite)
  │   ├── queue/       # Task scheduling and queue logic
  │   ├── tools/       # MCP tools for agents
  │   └── server.js    # Main server entrypoint
  ├── tests/           # Test suite for validation
  ├── .env.example     # Example environment variables
  ├── package.json
  └── README.md
```

## Quick Start

1. Install dependencies:
   ```
   npm install
   ```

2. Copy and configure environment variables:
   ```
   cp .env.example .env
   ```

3. Start the server:
   ```
   npm start
   ```

## Features

- **Task Queue:** Assigns, schedules, and tracks agent tasks
- **Telemetry Buffer:** Stores incoming data from tracker and agents
- **REST API:** `/api/tasks`, `/api/telemetry`, `/api/status`
- **Agent Validation:** Tools to verify agent connectivity and operational state
- **Security:** HMAC authentication, rate limiting, and logging

## Next Steps

- Implement workflow queueing and agent validation tools
- Integrate with all agent MCP configs
- Add tests for agent connectivity and task execution

---

## Orchestration Rules & Enforcement

This MCP server is governed by the operational doctrine in [docs/AGENT_ORCHESTRATION_RULES.md](../docs/AGENT_ORCHESTRATION_RULES.md).

**Key enforcement points:**
- MCP is the source of truth for all agent rules, workflows, and compliance.
- MCP maintains a registry of all agents, their health, and their compliance status.
- MCP never performs worker/processing tasks directly; it delegates, monitors, and enforces.
- MCP blocks any agent or workflow that is non-compliant, out-of-date, or unhealthy.
- MCP provides audit logs and observability for all actions.
- MCP maintains clear separation between orchestration and execution.

All agents/scripts must reference the orchestration rules at startup and on every deployment.
Any deviation or violation must be logged and, if critical, must block further progress until resolved.
