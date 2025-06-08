# The Wandering Whittle Road Trip Tracker

Real-time tracking and visualization for a 60-day Tesla road trip across all 48 contiguous U.S. states.

## Project Overview

The Wandering Whittle is a real-time, multi-system initiative that tracks a 60-day Tesla road trip through all 48 contiguous U.S. states. The system consists of multiple integrated components:

1. **Public Website** - Shows live trip status, vehicle data, weather conditions, and trip progress
2. **Edge Worker & AI Backend** - Cloudflare Workers providing API endpoints, data synchronization, and GPU-powered analytics
3. **Mobile Client** - React Native app for real-time updates while on the road
4. **Functions** - Serverless functions that fetch real-time data from various sources

## Project Structure

The project has been organized into a clean directory structure:

- **`config/`** - Configuration files and environment variables
- **`mcp/`** - MCP (Model Context Protocol) server and related files
- **`data/`** - Data files including itineraries and trip information
- **`docs/`** - Documentation and project guides
- **`scripts/`** - Build, deployment, and utility scripts
- **`utilities/`** - Helper utilities and tools
- **`components/`** - Reusable UI components
- **`edge-worker/`** - Cloudflare edge worker code
- **`ContinentalUSA-mobile/`** - Mobile app code
- **`ios-client/`** - iOS Swift client
- **`ai-agents/`** - AI agent configurations and prompts
- **`tests/`** - Test files
- **`shared/`** - Shared libraries and schemas
- **`docs/`** - Documentation and guides
- **`scripts/`** - Deployment and build scripts
- **`utilities/`** - Utility scripts and helpers
- **`components/`** - UI Components
- **`tests/`** - Test files and test utilities
- **`edge-worker/`** - Cloudflare edge worker code
- **`ContinentalUSA-mobile/`** - Mobile application code

## Recent Updates & Planned Enhancements

### Completed Work
- Migrated MCP backend server to Cloudflare Workers for improved performance and reliability
- Integrated GPU-powered AI analytics for route optimization and weather prediction
- Enhanced error handling and API response format validation
- Implemented automated CI/CD error monitoring with GitHub issue creation
- Updated deployment scripts to use `npx wrangler` consistently
- Added comprehensive testing coverage for critical paths

### In Progress
- Extending Cloudflare Workers with AI-powered analytics endpoints
- Implementing intelligent charging station recommendations
- Enhancing frontend components to display AI-generated insights
- Upgrading Node.js version requirements in CI/CD pipelines
- Integrating AI agents for system monitoring and maintenance

## Features

- ✅ **Real-time Tesla data** integration via Tessie API (location, battery level, speed, range)
- ✅ **Weather data** for current and upcoming locations
- ✅ **MapBox integration** for route visualization and mapping
- ✅ **Offline support** via service workers
- ✅ **Email subscription** for trip updates
- ✅ **Photo gallery** from the journey
- ✅ **Interactive map** showing current location and route
- ✅ **AI-powered analytics** for route optimization and predictions
- ✅ **Automated error monitoring** and issue creation

## System Architecture

```
┌─────────────────┐     ┌───────────────┐     ┌────────────────┐
│                 │     │   AI-Powered  │     │                │
│  Public Website │◄────┤  Edge Worker  │◄────┤   Tessie API   │
│                 │     │               │     │                │
└────────┬────────┘     └───────┬───────┘     └────────┬───────┘
         │                      │                      │
         │                      │                      │
         │                      ▼                      ▼
         │              ┌───────────────┐     ┌────────────────┐
         │              │  Cloudflare   │     │   GPU-Powered  │
         └─────────────►│    Workers    │────►│    Analytics   │
                        │               │     │                │
                        └───────┬───────┘     └────────┬───────┘
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

- Node.js (v20+)
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

   # GPU cluster configuration
   GPU_CLUSTER_URL=your_gpu_cluster_url
   GPU_API_KEY=your_gpu_api_key
   ```

### Running the Application

#### Quick Start - All Services

To start all services with real-time data integration:

```
./scripts/start-services.sh
```

This script will:
1. Load environment variables from `.env`
2. Deploy and start the Edge Worker
3. Start the Public Website in development mode
4. Open the website in your default browser

The website will be available at http://localhost:3000

> **Important Note:** All Cloudflare Wrangler commands in this project must be run using `npx wrangler` rather than a global `wrangler` installation. For example, use `npx wrangler dev` instead of `wrangler dev`. This follows Cloudflare's recommendation and ensures consistent versioning.

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

#### Full Production Deployment

For a full production deployment of all components:

```
./scripts/deploy-all.sh
```

This script will:
1. Verify environment variables
2. Deploy the Edge Worker to Cloudflare
3. Deploy the Public Website to Cloudflare Pages
4. Build mobile applications (if configured)
5. Perform verification checks
6. Monitor deployment status and create GitHub issues for any failures

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

### GPU-Powered Analytics
- Route optimization
- Weather prediction
- Charging station recommendations
- Environmental impact calculations

## Project Structure

```
WanderingWhittle/
├── 48Continental_Starter/    # Public website code
│   └── public-site/          # Vite-based frontend
├── edge-worker/              # Cloudflare Workers code
├── functions/                # Serverless functions
├── ios-client/               # iOS native client
├── scripts/                  # Deployment and utility scripts
├── shared/                   # Shared code and models
│   ├── api-manager/          # API integration code
│   ├── credential-manager/   # Secure credential handling
│   └── models/              # Shared data models
└── docs/                    # Documentation
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Work Completed Summary

A detailed summary of the recent development work is available in the [docs/WORK_COMPLETED_SUMMARY.md](docs/WORK_COMPLETED_SUMMARY.md) file. This document outlines:

- Migration of MCP backend to Cloudflare Workers
- Integration of GPU-powered AI analytics
- Enhanced CI/CD with automated issue creation
- Photo Gallery Component with responsive design
- Trip Statistics Dashboard with interactive visualizations
- Environmental Impact Calculator module
- 1Password Connect implementation
- Comprehensive test suite with GitHub Actions workflow

Please refer to this document for an overview to assist the orchestrator MCP and further development.
