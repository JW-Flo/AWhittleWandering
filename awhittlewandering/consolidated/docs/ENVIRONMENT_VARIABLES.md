# Environment Variable Standardization

This document outlines the standardized environment variable naming convention for the 48 Continental USA project.

## Overview

The project previously suffered from inconsistent environment variable naming across different components:

- Frontend (Vite) using `VITE_` prefixed variables
- Backend using unprefixed variables
- GitHub Actions using different naming conventions
- Multiple versions of the same variable (e.g., `OPENWEATHER_API_KEY` vs `OPEN_WEATHER_API_KEY`)

To address this, we've implemented a centralized environment variable mapping system.

## Standard Variable Names

Use these standard names in your code by importing the environment mapper:

| Standard Name | Purpose | Required |
|--------------|---------|----------|
| `MAPBOX_TOKEN` | MapBox API access token | Yes |
| `WEATHER_API_KEY` | OpenWeatherMap API key | Yes |
| `TESSIE_TOKEN` | Tessie API token for Tesla data | Yes |
| `VEHICLE_VIN` | Vehicle identification number | Yes |
| `EDGE_WORKER_URL` | Edge worker endpoint URL | Yes |
| `API_BASE_URL` | API server base URL | Yes |
| `WEBSOCKET_ENDPOINT` | WebSocket connection URL | No |
| `ENABLE_STREAMING` | Feature flag for data streaming | No |
| `USE_SIMULATED_DATA` | Feature flag for simulation mode | No |

## Usage

### Frontend Components (React)

```javascript
import { getEnv } from '../../../shared/config/environmentMapper';

// Get the MapBox token
const mapboxToken = getEnv('MAPBOX_TOKEN');
```

### Backend Services (Node.js)

```javascript
const { getEnv } = require('../../shared/config/environmentMapper');

// Get the Weather API key
const weatherApiKey = getEnv('WEATHER_API_KEY');
```

## How It Works

The environment mapper:

1. Takes a standardized variable name
2. Checks all possible variations of that name:
   - In `import.meta.env` (Vite frontend)
   - In `process.env` (Node.js backend)
   - In `window.ENV` (browser-injected variables)
3. Returns the first value found or a default value

## Deployment Configuration

When setting up environment variables in GitHub Actions or other CI/CD systems:

- Use the standard names where possible
- If the deployment platform requires specific naming (e.g., Cloudflare Workers), ensure those names are added to the mapping

## Adding New Variables

To add a new environment variable:

1. Update `shared/config/environmentMapper.js` to include all variations
2. Document the new variable in this file
3. Use the standardized getter (`getEnv`) in your code

## Variable Precedence

If multiple variations of a variable exist, they are checked in this order:

1. Meta tag (for MapBox token only)
2. Frontend Vite variables (`import.meta.env`)
3. Backend Node.js variables (`process.env`)
4. Browser-injected variables (`window.ENV`)
