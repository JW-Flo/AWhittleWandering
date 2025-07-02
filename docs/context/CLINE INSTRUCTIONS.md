# A WHITTLE WANDERING: AI AGENT DEPLOYMENT INSTRUCTIONS

## Project Identity

- __Project Name__: A Whittle Wandering
- __Website Domain__: awhittlewandering.com
- __Purpose__: Real-time tracking of a Tesla journey across all 48 continental United States

## Core Requirements

### 1. Tesla Telemetry Integration

- Implement Tessie API integration to stream real-time Tesla Model Y data
- Store vehicle telemetry in Cloudflare KV with appropriate TTL
- Create resilient error handling with fallbacks for API interruptions
- Implement secure API key management via Cloudflare Worker secrets

### 2. Waypoint Tracking System

- Use location data from `48Continental_Final_Itinerary.csv` as waypoint reference

- __Key Change__: Implement location-based waypoint tracking rather than date-based forecasting

- Create data structure for tracking waypoint status:

  ```typescript
  interface Waypoint {
    id: string;
    name: string;
    state: string;
    coordinates: [number, number]; // [longitude, latitude]
    visited: boolean;
    visitedAt?: string; // ISO timestamp when visited
    notes?: string; // Optional contextual information
  }
  ```

- Visually highlight completed waypoints on the map

- Store completion status in Cloudflare KV for persistence

### 3. MapBox Integration Enhancement

- Fix existing MapBox implementation issues:

  - Ensure proper coordinate format ([longitude, latitude])
  - Correct layer management and rendering
  - Implement proper error boundaries and loading states

- Create responsive map interface that works on all devices

- Implement clear visual indicators for:

  - Current vehicle location
  - Completed waypoints
  - Upcoming waypoints
  - Travel path/history

### 4. State Visit Tracker

- Implement visual component showing all 48 continental states
- Track states visited during the journey
- Create color-coded map overlay showing visited vs. unvisited states
- Implement state detection algorithm using vehicle's GPS coordinates
- Store state visit data in Cloudflare KV

### 5. Cloudflare Deployment Configuration

- Complete migration from Cloudflare Pages to Workers
- Configure necessary KV namespaces and bindings
- Set up proper CORS headers and security policies
- Implement caching strategies for static assets and API responses
- Create proper CI/CD pipeline for automated deployments

## Implementation Guidelines

### Data Architecture

- __Vehicle Data__: Real-time stream from Tessie API, cached in KV
- __Waypoint Data__: Static base from CSV, dynamic status in KV
- __State Visit Data__: Dynamic tracking in KV with timestamp
- __Map Configuration__: Mapbox token and settings in environment variables

### UI Components

- Live map showing current location and route
- Waypoint status indicators
- State visit tracker/counter
- Vehicle telemetry dashboard (speed, battery, charging status)
- Trip statistics (states visited, miles traveled, etc.)

### Technical Specifications

- __Frontend__: React with TypeScript

- __Backend__: Cloudflare Workers for API and site hosting

- __Data Storage__: Cloudflare KV for state persistence

- __APIs__:

  - Tessie API for Tesla data
  - Mapbox for mapping
  - OpenWeather for weather data (if applicable)

### Performance Requirements

- Map rendering optimized for mobile devices
- Progressive loading for performance
- Maximum 2-second response time for API endpoints
- Graceful degradation when APIs are unavailable

## Testing and Validation

- Test vehicle data flow with simulated GPS coordinates
- Verify waypoint detection with test coordinates
- Validate state boundary detection algorithm
- Test responsive design across multiple device sizes

## Deployment Checklist

- All required environment variables configured
- KV namespace bindings verified
- API keys securely stored in Worker secrets
- CORS headers properly configured
- Cache policies implemented
- DNS configuration validated

The implementation should focus on creating a reliable, real-time tracking experience that accurately displays the Tesla's journey across the 48 continental states, emphasizing waypoint achievements and state visits rather than adhering to a specific timeline.

Did you use @/awhittlewandering/docs/__Project Overview and Current Goals__.pdf to create this? Ensure you address each and every concern, and that the Cline agent can handle all the necessary steps.

# Task: Complete AWhittleWandering Website Deployment & Fix CI/CD Pipeline

## Current State

- __Project__: 48 Continental USA - A 60-day Tesla road trip tracker across all 48 contiguous states
- __Main Directory__: `/awhittlewandering` (ignore legacy directories)
- __Recent Achievement__: Successfully deployed staging environment to `https://staging.awhittlewandering.com/*`
- __Current Blocker__: GitHub Actions workflow failing with 403 permission error when attempting auto-deploy

## Critical Issues to Fix

### 1. GitHub Actions Deployment Error (PRIORITY)

The workflow is failing with:

```javascript
remote: Write access to repository not granted.
fatal: unable to access 'https://github.com/JW-Flo/AWhittleWandering/': The requested URL returned error: 403
```

__Root Cause__: The workflow is trying to push changes but lacks proper permissions. Need to:

- Fix the malformed `.github/workflows/deploy.yml` (has duplicate `run:` statements)
- Add proper GitHub token permissions for pushing branches
- Configure GITHUB_TOKEN with `contents: write` permission

### 2. Complete Core Website Features

Per the project overview, focus on:

- __Real-time Map__: Ensure Mapbox integration displays Tesla location/route
- __Tessie Integration__: Verify vehicle telemetry data flows from Tessie API
- __API Endpoints__: Confirm all required endpoints work (location, telemetry, status)
- __Social Integration__: Add simple Instagram link to @awhittlewandering (skip other platforms)

### 3. Environment Configuration

__Secrets Already Available__:

- `CLOUDFLARE_API_TOKEN`: `9JmBrBD1c2uIh-2rQ9YHqlJsKzExfqSrnDtwBdDQ`
- `CLOUDFLARE_ACCOUNT_ID`: `620865722bd88ef0a77dbbb60c91392e`
- Zone ID: `4983dcf0cbfebc73e920a2f1f27acabc`

__KV Namespaces Available__ (from screenshots):

- `APP_KV`: `8016b1e4a16f4f7b75bce91e37573`
- `ITINERARY_KV`: `41e8cca691d4733d647d950d2344d91`

## Deployment Strategy

### Phase 1: Fix CI/CD Pipeline

1. Correct the syntax errors in `.github/workflows/deploy.yml`
2. Add proper GitHub token permissions for auto-deployment
3. Configure production deployment to use existing Cloudflare credentials

### Phase 2: Complete Production Deployment

1. Deploy Cloudflare Worker with proper KV bindings
2. Build and deploy frontend to Cloudflare Pages
3. Configure DNS for production domain (if not staging)

### Phase 3: Verify Core Functionality

1. Test real-time map displays correctly
2. Verify Tessie data integration works
3. Confirm API endpoints respond properly
4. Check Instagram link/integration

## Technical Context

- __Stack__: Vite + React + TypeScript, Cloudflare Workers, Mapbox GL
- __Build Tool__: Bun (not npm/pnpm)
- __Deployment__: Wrangler 3.x for Workers, Cloudflare Pages for frontend
- __Current Working Directory__: `/Users/joe/Projects/Personal/ContinentalUSA`

## Success Criteria

- GitHub Actions workflow successfully deploys on push to main
- Production website accessible and showing live Tesla tracking map
- All core API endpoints functional
- No TypeScript or build errors
- Clean deployment pipeline for future updates

# Fix CI/CD and Complete AWhittleWandering Production Deployment

## Project Context

__AWhittleWandering__ - A live Tesla road trip tracker showing a 60-day journey across all 48 continental US states. The staging environment is deployed but CI/CD is broken and production deployment needs completion.

## 🔴 Critical Issue #1: Fix GitHub Actions Workflow

__Error__: `remote: Write access to repository not granted. fatal: unable to access 'https://github.com/JW-Flo/AWhittleWandering/': The requested URL returned error: 403`

### Required Fixes

1. __Fix `.github/workflows/deploy.yml` syntax error__:

   - Line has duplicate `run:` statements that need correction
   - Missing `bun install` step in deploy job

2. __Add proper permissions__ for GitHub token:

   ```yaml
   permissions:
     contents: write  # Need write access for auto-deploy branches
     id-token: write
   ```

3. __Remove auto-deploy branch creation__ (causing the 403 error) or use proper PAT token

## 🎯 Core Tasks to Complete

### 1. Production Deployment Setup

- __Cloudflare Worker__: Deploy with proper KV namespace bindings

  - Use `APP_KV`: `8016b1e4a16f4f7b75bce91e37573`
  - Zone ID: `4983dcf0cbfebc73e920a2f1f27acabc`

- __Frontend__: Build and deploy to Cloudflare Pages

- __DNS__: Configure production domain after deployment

### 2. Complete Core Features

- ✅ __Real-time Map__: Verify Mapbox integration displays Tesla location
- ✅ __Tessie Integration__: Ensure vehicle telemetry flows properly
- ✅ __API Endpoints__: Test `/api/location`, `/api/telemetry`, `/api/status`
- ✅ __Social Link__: Add Instagram link to @awhittlewandering

### 3. Fix TypeScript & Build Issues

- Resolve remaining TS errors from previous session
- Fix PostCSS configuration issue
- Ensure clean `bun run build`

## 📋 Environment Info

- __Stack__: Vite + React + TypeScript + Cloudflare Workers
- __Package Manager__: Bun (not npm/pnpm)
- __Deployment Tool__: Wrangler 3.x
- __Working Directory__: `/Users/joe/Projects/Personal/ContinentalUSA/awhittlewandering`

## 🔑 Available Credentials

```javascript
CLOUDFLARE_API_TOKEN: 9JmBrBD1c2uIh-2rQ9YHqlJsKzExfqSrnDtwBdDQ
CLOUDFLARE_ACCOUNT_ID: 620865722bd88ef0a77dbbb60c91392e
Zone ID: 4983dcf0cbfebc73e920a2f1f27acabc
```

## ✅ Success Criteria

1. GitHub Actions successfully deploys on push to main
2. Production site live at configured domain
3. Real-time Tesla tracking map functional
4. Zero TypeScript/build errors
5. CI/CD pipeline runs without manual intervention

## 🚦 Start Here

1. First fix the deploy.yml syntax error
2. Then run a test deployment locally
3. Push changes to trigger fixed CI/CD
4. Monitor deployment and fix any remaining issues



