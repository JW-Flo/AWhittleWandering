# The Wandering Whittle Road Trip Tracker

Real-time tracking and visualization for a 60-day Tesla road trip across all 48 contiguous U.S. states.

## Project Overview

The Wandering Whittle is a real-time, multi-system initiative that tracks a 60-day Tesla road trip through all 48 contiguous U.S. states. The system consists of multiple integrated components:

1. **Public Website** - Shows live trip status, vehicle data, weather conditions, and trip progress
2. **MCP Server** - Mission Control Platform running on an always-on iMac to coordinate components
3. **Mobile Client** - React Native app for real-time updates while on the road
4. **Edge Worker** - Cloudflare Workers that provide API endpoints and handle data synchronization
5. **Functions** - Serverless functions that fetch real-time data from various sources

## Features

- ✅ **Real-time Tesla data** integration via Tessie API (location, battery level, speed, range)
- ✅ **Weather data** for current and upcoming locations
- ✅ **MapBox integration** for route visualization and mapping
- ✅ **Offline support** via service workers
- ✅ **Email subscription** for trip updates
- ✅ **Photo gallery** from the journey
- ✅ **Interactive map** showing current location and route

## System Architecture

```
┌─────────────────┐     ┌───────────────┐     ┌────────────────┐
│                 │     │               │     │                │
│  Public Website │◄────┤  Edge Worker  │◄────┤   MCP Server   │
│                 │     │               │     │                │
└────────┬────────┘     └───────┬───────┘     └────────┬───────┘
         │                      │                      │
         │                      │                      │
         │                      ▼                      ▼
         │              ┌───────────────┐     ┌────────────────┐
         │              │  Cloudflare   │     │   Tessie API   │
         └─────────────►│    Workers    │     │                │
                        │               │     └────────┬───────┘
                        └───────┬───────┘              │
                                │                      │
                                ▼                      ▼
                        ┌───────────────┐     ┌────────────────┐
                        │   Weather &   │     │    MapBox      │
                        │  MapBox APIs  │     │      API       │
                        │               │     │                │
                        └───────────────┘     └────────────────┘
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- API keys for Tessie, OpenWeatherMap, and MapBox

### Installation and Setup

1. Clone the repository:
   ```
   git clone https://github.com/username/WanderingWhittle.git
   cd WanderingWhittle
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with your API keys (or run one of the deployment scripts which will create it for you):
   ```
   # Tessie API token
   TESSIE_API_TOKEN=your_tessie_api_token

   # Weather API key
   WEATHER_API_KEY=your_weather_api_key

   # MapBox token
   MAPBOX_TOKEN=pk.eyJ1IjoidGhld2FuZGVyaW5nd2hpdHRsZSIsImEiOiJjbHQxaXhzejYwYmU2MmpxdHl0MHowN3UzIn0.Q7xKTRlXvtimBHd39JqN1A

   # KV namespace for caching
   WANDERINGWHITTLE_KV=your_kv_namespace_id
   ```

### Running the Application

#### Quick Start - All Services

To start all services with real-time data integration:

```
./scripts/start-services.sh
```

This script will:
1. Load environment variables from `.env`
2. Start the MCP server
3. Start the Edge Worker locally
4. Start the Public Website in development mode
5. Open the website in your default browser

The website will be available at http://localhost:3000

> **Important Note:** All Cloudflare Wrangler commands in this project should be run using `npx wrangler` rather than a global `wrangler` installation. For example, use `npx wrangler dev` instead of `wrangler dev`. This follows Cloudflare's recommendation to install Wrangler locally in your project rather than globally.

To stop all services:

```
./scripts/stop-services.sh
```

#### Local Development Server Only

To run only the public website:

```
./scripts/deploy-public-site.sh
```

This script will:
1. Install dependencies
2. Create `.env` file if needed
3. Build the public site
4. Start the local development server

#### MCP Server Only

To only run the MCP server:

```
./scripts/start-mcp-server.sh
```

#### Full Production Deployment

For a full production deployment of all components:

```
./scripts/deploy-all.sh
```

This script will:
1. Verify environment variables
2. Deploy the Edge Worker to Cloudflare
3. Set up the MCP Server
4. Deploy the Public Website to Cloudflare Pages
5. Build mobile applications (if configured)
6. Perform verification checks

## Data Sources

The application integrates data from multiple sources:

### Tessie API
- Vehicle location
- Battery level and range
- Speed and power usage
- Climate control status

### OpenWeatherMap API
- Current weather conditions
- Temperature and humidity
- Wind speed
- Weather forecasts

### MapBox API
- Interactive maps
- Route visualization
- Geocoding (location names)
- Distance and duration calculations

## Project Structure

```
WanderingWhittle/
├── 48Continental_Starter/    # Public website code
│   └── public-site/          # Vite-based frontend
├── edge-worker/              # Cloudflare Workers code
├── functions/                # Serverless functions
├── ios-client/               # iOS native client
├── mcp-server/               # Mission Control Platform
├── scripts/                  # Deployment and utility scripts
├── shared/                   # Shared code and models
│   ├── api-manager/          # API integration code
│   ├── credential-manager/   # Secure credential handling
│   └── models/               # Shared data models
└── docs/                     # Documentation
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Work Completed Summary

A detailed summary of the recent development work is available in the [docs/WORK_COMPLETED_SUMMARY.md](docs/WORK_COMPLETED_SUMMARY.md) file. This document outlines:

- Photo Gallery Component for the website with responsive design and API
- Trip Statistics Dashboard with interactive visualizations and localStorage persistence
- Environmental Impact Calculator module tailored for Tesla Model Y 2020
- 1Password Connect MCP Server implementation for secure credential management
- Comprehensive test suite with unit tests and GitHub Actions CI workflow

Please refer to this document for an overview to assist the orchestrator MCP and further development.
