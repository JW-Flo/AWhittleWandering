# The Wandering Whilttle – Project Overview

This document provides a high-level overview of the entire system architecture, component responsibilities, current status, and next steps. It is always up to date with the latest production deployment and cloud architecture.

---

## 1. Components & Responsibilities

### 1.1 edge-worker (Cloud Orchestrator & API Proxy)
- Runs on Cloudflare Workers (no local dependencies)
- Proxies all Tesla API calls securely (no test data, no mocks)
- Handles authentication, token refresh, and secure storage (KV/D1)
- Aggregates telemetry streams from tracker and mobile clients
- Provides public and authenticated endpoints for web, mobile, and iOS
- Handles email subscription and notification triggers

### 1.2 tracker (Location Logger)
- Device: Tesla + iPhone + Starlink
- Records visits (geofence, manual triggers)
- Buffers telemetry locally if offline, syncs to edge-worker over HTTPS

### 1.3 web (Public Storytelling Site)
- Framework: Astro (preferred) or Next.js
- Hosted on Cloudflare Pages + Workers
- Displays live map, trip narrative, gallery, comments, and journal log
- Supports email subscription for update notifications
- All data fetched from edge-worker APIs (no local or mock data)

### 1.4 mobile clients
- React Native companion app (iOS/Android)
- Native iOS client (Swift)
- All data (vehicle, trip, gallery) fetched from edge-worker APIs
- No local MCP, no test tabs, no mock data
- Supports offline UI for safety-critical features

---

## 2. Current Status (June 2025)

- **edge-worker**: 
  - Tesla API proxy endpoints live (`/tesla/vehicle`, `/tesla/auth`)
  - Secure token storage in KV/D1
  - Weather and route endpoints live
  - Static file serving for web assets
- **tracker**: 
  - Basic geolocation and cache implemented
  - Syncs to edge-worker
- **web**: 
  - Astro/Next.js site deployed to Cloudflare
  - Live map, trip log, and gallery UI in progress
  - Email subscription UI planned
- **mobile**: 
  - React Native and iOS apps fetch live data from edge-worker
  - Tesla dashboard and trip planner tabs implemented
  - No mock/test tabs remain

---

## 3. Roadmap & Next Steps

| Component      | Priority | Next Tasks                                              |
| -------------- | -------- | --------------------------------------------------------|
| edge-worker    | High     | - Add email subscription endpoints<br>- Productionize error handling<br>- Harden authentication |
| tracker        | High     | - Geofence logic refinement<br>- Auto-sync retry logic   |
| web            | High     | - Integrate email subscription<br>- Comments persistence<br>- Polish gallery and journal log |
| mobile clients | High     | - Polish UI/UX<br>- Add offline fallback for critical data<br>- Finalize trip planner |

---

## 4. Supporting Resources
- `docs/AGENT_ORCHESTRATION_RULES.md`: operational doctrine and enforcement
- `docs/AUDIT_FINDINGS_TESLA_API.md`: audit of Tesla integration and next steps
- `docs/deployment-checklist.md`: production deployment and rollback procedures

---

## 5. How To Use This Guide
- Review the roadmap table before starting any feature
- Link PRs and issues back to these sections for context
- Update statuses and next tasks as you complete work

---

_Last updated: 2025-06-02_
