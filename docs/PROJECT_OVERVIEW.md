# 48 Continental – Project Overview

This document provides a high-level overview of the entire system architecture, component responsibilities, current status, and next steps. It serves as the single source of truth for the project's structure and deployment strategy. Refer to this document before making any changes to ensure consistency across all components.

---

## 1. Components & Responsibilities

### 1.1 edge-worker (Cloud Orchestrator & API Proxy)
- **Location**: Cloudflare Workers
- **Primary Responsibilities**:
  - Acts as the central API hub for the entire system
  - Proxies all Tesla API calls securely (no test data, no mocks)
  - Handles authentication, token refresh, and secure storage (KV/D1)
  - Aggregates telemetry streams from tracker and mobile clients
  - Provides public and authenticated endpoints for web, mobile, and iOS
  - Handles email subscription and notification triggers
- **Integration Points**:
  - Tesla API (vehicle data)
  - MapBox API (mapping)
  - ABRP API (route planning)
  - Weather API (forecast data)
  - Public website (data consumption)
  - Mobile clients (data consumption)
  - MCP server (data synchronization)

### 1.2 mcp-server (Local Orchestrator)
- **Location**: Always-on iMac
- **Primary Responsibilities**:
  - Schedules and coordinates agent tasks
  - Buffers telemetry locally when edge-worker is unavailable
  - Manages persistent task queue and agent status
  - Enforces deployment verification and validation
  - Provides centralized logging and monitoring
- **Integration Points**:
  - Edge worker (data synchronization)
  - Mobile clients (task coordination)
  - Tracker (telemetry collection)

### 1.3 public-site (Public Storytelling Site)
- **Location**: Cloudflare Pages
- **Primary Responsibilities**:
  - Displays live map, trip narrative, gallery, comments, and journal log
  - Visualizes real-time vehicle location and status
  - Provides interactive trip statistics and charging information
  - Supports email subscription for update notifications
  - Offers offline access to critical information
- **Integration Points**:
  - Edge worker (data source)
  - MapBox (map visualization)
  - Browser local storage (offline functionality)

### 1.4 mobile clients
- **React Native App** (iOS/Android):
  - Trip management dashboard
  - Charging station finder
  - Push notifications for trip events
  - Offline access to critical information
- **Native iOS Client** (Swift):
  - Primary interface for vehicle telemetry
  - Advanced route planning and optimization
  - Offline map and navigation capabilities
  - Background data synchronization
- **Integration Points**:
  - Edge worker (data source)
  - MCP server (task coordination)
  - Device local storage (offline functionality)

---

## 2. Current Status (June 2025)

- **edge-worker**: 
  - ✅ Tesla API proxy endpoints fully operational (`/tesla/vehicle`, `/tesla/auth`)
  - ✅ Secure token storage in KV/D1 with refresh mechanism
  - ✅ Weather API integration complete
  - ✅ MapBox API integration complete
  - ✅ ABRP route planning integration complete
  - ✅ Static file serving for web assets
  - ✅ Email subscription and notification system operational

- **mcp-server**: 
  - ✅ Task scheduling and coordination system operational
  - ✅ Telemetry buffering system implemented
  - ✅ Agent validation tools operational
  - ✅ REST API endpoints for data synchronization live
  - ⚠️ Advanced logging and monitoring in progress

- **public-site**: 
  - ✅ React/Vite site deployed to Cloudflare Pages
  - ✅ Live map with real-time vehicle location
  - ✅ Trip statistics dashboard operational
  - ✅ Photo gallery and trip journal implemented
  - ✅ Offline support via service worker
  - ⚠️ Email subscription UI in final testing

- **mobile-clients**: 
  - ✅ React Native app connects to live edge-worker data
  - ✅ iOS native app fully operational
  - ✅ Tesla dashboard and charging station finder implemented
  - ✅ Trip planner with offline capabilities complete
  - ✅ Push notifications for trip events enabled
  - ⚠️ Android-specific optimizations in progress

---

## 3. Deployment Architecture & Strategy

The system deployment follows a strict sequence to ensure proper integration and functionality:

```
┌─────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│                 │     │                   │     │                   │
│  Edge Worker    │◄────┤  Public Website   │     │  Mobile Apps      │
│  (Cloudflare)   │     │  (CF Pages)       │     │  (iOS/Android)    │
│                 │     │                   │     │                   │
└────────┬────────┘     └───────────────────┘     └─────────┬─────────┘
         │                                                  │
         │                                                  │
         ▼                                                  ▼
┌─────────────────┐                              ┌───────────────────┐
│                 │                              │                   │
│  External APIs  │                              │  MCP Server       │
│  Tesla/MapBox/  │◄─────────────────────────────┤  (Always-on iMac) │
│  Weather/ABRP   │                              │                   │
│                 │                              └───────────────────┘
└─────────────────┘
```

### Deployment Sequence:
1. **Edge Worker** must be deployed first as all other components depend on it
2. **MCP Server** must be started before mobile clients to coordinate tasks
3. **Public Website** depends on Edge Worker for data
4. **Mobile Clients** depend on both Edge Worker and MCP Server

### Verification Process:
Each deployment must be verified using the verification scripts to ensure proper integration and functionality. The MCP Server enforces this verification process and will block non-compliant components.

---

## 4. Roadmap & Next Steps

| Component      | Priority | Next Tasks                                              | Status      |
| -------------- | -------- | --------------------------------------------------------| ------------|
| edge-worker    | High     | - Enhance error handling resilience<br>- Optimize API response times<br>- Add rate limiting and throttling | In Progress |
| mcp-server     | High     | - Implement advanced monitoring<br>- Add predictive maintenance<br>- Optimize database queries | In Progress |
| public-site    | High     | - Finalize email subscription UI<br>- Add social sharing capabilities<br>- Enhance offline experience | In Progress |
| mobile clients | High     | - Complete Android optimizations<br>- Add battery optimization features<br>- Enhance UI/UX for night driving | In Progress |

---

## 5. Environment Configuration

### Edge Worker
- `EDGE_HMAC_KEY`: Secret key for authentication
- `TESLA_CLIENT_ID`: Tesla API credentials
- `TESLA_CLIENT_SECRET`: Tesla API credentials
- `MAPBOX_TOKEN`: MapBox API token
- `ABRP_API_KEY`: ABRP API credentials
- `WEATHER_API_KEY`: Weather service API key

### Public Site
- `VITE_EDGE_WORKER_URL`: URL of the deployed Edge Worker
- `VITE_MAPBOX_TOKEN`: MapBox API token for frontend map

### MCP Server
- `MCP_PORT`: Port to run the local server on
- `EDGE_WORKER_URL`: URL of the deployed Edge Worker
- `EDGE_HMAC_KEY`: Secret key matching Edge Worker

All environment configurations must be consistent across all components to ensure proper integration.

---

## 6. Supporting Resources
- `docs/AGENT_ORCHESTRATION_RULES.md`: Operational doctrine and enforcement
- `docs/AUDIT_FINDINGS_TESLA_API.md`: Audit of Tesla integration and next steps
- `docs/deployment-checklist.md`: Production deployment and rollback procedures
- `docs/DEPLOYMENT_STRATEGY.md`: Comprehensive deployment strategy

---

## 7. How To Use This Guide
- Review this document before starting any feature development
- Refer to the deployment sequence when updating any component
- Ensure environment variables are consistent across all components
- Link PRs and issues back to these sections for context
- Update statuses and next tasks as you complete work

---

_Last updated: 2025-06-03_
