# Monorepo Multi-Agent Architecture

This document defines a monorepo structure that partitions responsibilities between AI agents and human maintainers.

## Top-Level Layout

```
/edge-worker
/ios-client
/cli-tools
/shared
.github
/docs
```

## Responsibilities

- **Edge Worker agent**
  - Handles Cloudflare Worker code in `edge-worker/`
  - Exposes REST (or GraphQL) endpoints and HMAC-signed payloads
  - Publishes an OpenAPI spec in `edge-worker/openapi.yaml`
- **iOS Client agent**
  - Implements Swift logic in `ios-client/`
  - Consumes the Edge Worker API via generated Swift client from OpenAPI
  - Manages on-device telemetry, offline routing, and upload logic
- **CLI Tools agent**
  - Contains utilities in `cli-tools/`: data import/export, mocking, diagnostics
- **Shared agent**
  - Holds type definitions and JSON Schema/TS interfaces in `shared/`
  - Packaged as an npm or Swift-PM library for canonical types

## Communication Contract

All HTTP interfaces are defined in a single OpenAPI file:

```yaml
# edge-worker/openapi.yaml
openapi: 3.0.0
info:
  title: EV Trip Planner API
paths:
  /stats:
    post:
      summary: Ingest telemetry and leg data
      requestBody: {}
      responses: {}
```

Automated codegen commands:

- **TypeScript client** for tests & CLI: `npm run codegen:ts`
- **Swift client** for iOS: `swift run tools/codegen-swift`

## CI/CD

GitHub Actions workflows:

```yaml
name: CI

on: [push, pull_request]

jobs:
  edge-worker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run build:edge
      - run: wrangler publish --cwd edge-worker

  ios-client:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v2
      - run: swift build --package-path ios-client
      - run: swift test --package-path ios-client
      - run: swift run fastlane beta

  cli-tools:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm test

  integration:
    runs-on: ubuntu-latest
    needs: [edge-worker, cli-tools]
    steps:
      - uses: actions/checkout@v2
      - run: npm run codegen:ts
      - run: swift run tools/codegen-swift
      - run: npm run test:integration
```

## Agent-Level Ownership

- Each agent only edits its own folder.
- Commits are prefixed: `edge:`, `ios:`, `cli:`, `shared:`.
- Shared types in `shared/` are reviewed jointly to prevent drift.

```mermaid
flowchart LR
  subgraph Monorepo
    EW[edge-worker] -->|OpenAPI spec| SC[shared Contract]
    IC[ios-client] --> SC
    CL[cli-tools] --> SC
    EW --> BuildEW[Build & Deploy]
    IC --> BuildIC[Swift Build & Test]
    CL --> TestCL[CLI Tests]
    SC --> Codegen[Codegen Clients]
  end