# Agent Index

This file maps each agent to its domain, purpose, and configuration.

| Agent Name            | Location        | Purpose                                        | Config File              |
|-----------------------|-----------------|------------------------------------------------|--------------------------|
| edge-worker-agent     | `/edge-worker`  | CF Worker & OpenAPI endpoint implementation    | `edge-worker/.agentrc`   |
| ios-client-agent      | `/ios-client`   | iOS Swift client & telemetry UI                | `ios-client/.agentrc`    |
| cli-tools-agent       | `/cli-tools`    | Local CLI utilities, mocking, diagnostics      | `cli-tools/.agentrc`     |
| shared-types-agent    | `/shared`       | Common JSON-Schema, TS & Swift type contracts | `shared/.agentrc`        |
