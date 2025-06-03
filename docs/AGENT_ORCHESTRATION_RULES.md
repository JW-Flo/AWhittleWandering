# 48 Continental Project: Agent Orchestration Rules & Workflows

## Purpose

This document defines the operational doctrine, rules, and workflows for all agents, AIs, scripts, and the Orchestrator MCP in the 48 Continental project. It is the canonical reference for enforcement, onboarding, and system health.

---

## 1. First Principles Rules

- **Verifiability:** Every build, test, deployment, and agent action must be observable and reproducible.
- **Agent Health:** No agent/service is considered "up" unless it is actively reporting health/telemetry to the MCP server.
- **Data Model Consistency:** All shared types and schemas must be versioned and validated across all codebases (iOS, edge, web, CLI, shared).
- **Critical Path Coverage:** All safety, synchronization, and telemetry logic must have automated tests for real-world edge cases.
- **Documentation & Fallbacks:** No code/config is "done" until it is documented, has a fallback/rollback, and is covered by a .env.example or equivalent.
- **Atomic Deployments:** All deployments must be atomic, observable, and revertible.

---

## 2. Orchestrator MCP (Mission Control Platform) Responsibilities

- **Rule Enforcement:** MCP is the source of truth for all operational rules and workflows. It must validate agent compliance and block non-compliant actions.
- **Agent Registry:** MCP maintains a registry of all agents, their health, telemetry, and version.
- **Separation of Concerns:** MCP does not perform worker tasks directly. It delegates, monitors, and enforces, but does not execute business logic or data processing.
- **Audit & Observability:** MCP logs all agent actions, health checks, and rule violations for audit and debugging.
- **Version Awareness:** MCP tracks the version of all agents and shared types, and blocks incompatible or out-of-date agents.

---

## 3. Worker Agent Responsibilities

- **Autonomy:** Worker agents (iOS, edge, CLI, etc.) operate independently but must register with MCP and comply with all rules.
- **Health Reporting:** Agents must send regular heartbeats and telemetry to MCP.
- **Contract Compliance:** Agents must validate their data models against the shared schema and MCP registry.
- **Fail Fast:** On any build/test/health failure, agents must halt further actions and report to MCP.

---

## 4. Workflow for Issue Resolution and Feature Delivery

1. **Build:** All codebases must pass clean builds locally and in CI.
2. **Test:** All critical tests must pass, especially for safety and synchronization.
3. **Deploy:** Only after passing tests, deploy to staging, then production, with health checks and rollbacks enabled.
4. **Observe:** MCP must show all agents as healthy and reporting. If not, block further work until resolved.

---

## 5. Data Model/Contract Changes

- All changes to shared types/schemas must be made in `shared/` and versioned.
- Downstream consumers must update and validate against the new version.
- MCP blocks agents with incompatible or out-of-date models.

---

## 6. Safety and Synchronization

- Route optimization and safety logic must react to real-world data and fail gracefully.
- All such logic must be testable with simulated adverse conditions.

---

## 7. End-State Alignment

- All agents/services are healthy and visible in MCP.
- All builds/tests pass.
- All data models are in sync.
- All critical logic is covered by tests and fallbacks.
- All documentation and environment files are up to date.
- The system is observable, revertible, and ready for real-world operation.

---

## 8. Orchestrator MCP Prompt/Config (for AI/Agent Use)

```
You are the Orchestrator MCP for the 48 Continental project. Your role is to:
- Enforce all operational rules and workflows as defined in AGENT_ORCHESTRATION_RULES.md.
- Maintain a registry of all agents, their health, and their compliance.
- Never perform worker/processing tasks directly; always delegate and monitor.
- Block any agent or workflow that is non-compliant, out-of-date, or unhealthy.
- Provide audit logs and observability for all actions.
- Maintain clear separation between orchestration and execution.
```

---

## 9. Enforcement

- MCP and all agents/scripts must reference this document at startup and on every deployment.
- Any deviation or violation must be logged and, if critical, must block further progress until resolved.

---

_Last updated: 2025-06-02_
