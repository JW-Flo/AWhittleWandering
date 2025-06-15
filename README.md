# A Whittle Wandering

A Whittle Wandering - A 60-day road trip through all 48 continental United States.

## Project Overview

This repository contains the complete code for the A Whittle Wandering project, tracking a 60-day Tesla road trip through all 48 contiguous U.S. states. The application displays real-time vehicle telemetry, trip progress, charging station information, and interactive maps.

## Repository Structure

- **public-site/**: Main frontend web application (React) (located in 48Continental_Starter folder)
- **edge-worker/**: Edge infrastructure for data handling via Cloudflare Workers
- **mcp-server/**: Mission Control Platform (MCP) server for vehicle telemetry
- **shared/**: Shared utilities and services used across components
- **scripts/**: Build, deployment, and maintenance scripts
- **docs/**: Project documentation

## Setup Instructions

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/AWhittleWandering.git
   cd A-Whittle-Wandering
   ```

2. Set up the frontend application:
   ```bash
   cd 48Continental_Starter/public-site
   npm install
   ```

3. Create a `.env` file based on the `.env.example` template:
   ```bash
   cp .env.example .env
   ```

4. Configure your Mapbox token in the `.env` file:
   ```
   VITE_MAPBOX_TOKEN=your_mapbox_token_here
   ```

### Development

Run the development server:
```bash
cd 48Continental_Starter/public-site
npm run dev
```

The site should now be available at http://localhost:5173/

## Building and Deployment

### Production Build

To create a production build:

```bash
cd 48Continental_Starter/public-site
npm run build:validate
```

This command will:
1. Build the application with production settings
2. Verify the Mapbox token is correctly embedded
3. Check bundle sizes for performance concerns
4. Validate API endpoints configuration

### GitHub Pages Deployment

The repository includes a GitHub Actions workflow for automated deployment to GitHub Pages:

1. Push changes to the `main` branch
2. The GitHub Action will automatically build and deploy the site
3. The site will be available at your GitHub Pages URL

## Mapbox Integration

The application uses Mapbox for map rendering with multiple fallback mechanisms to ensure reliability:

1. **Token Preloading**: Mapbox token is injected early via global variable
2. **Container Visibility**: Map initializes only when its container is visible
3. **Script Loading**: Controlled loading of Mapbox GL JS
4. **Single Initialization**: Unified map startup sequence
5. **Tiered Fallbacks**: Multiple fallback options if primary rendering fails

## Environment Configuration

The application uses environment files for configuration:

- `.env.development`: Development environment variables
- `.env.production`: Production environment variables

Key variables include:

```
# Mapbox configuration
VITE_MAPBOX_TOKEN=pk.your_token_here
VITE_MAPBOX_STYLE=mapbox://styles/mapbox/dark-v11
VITE_MAPBOX_FALLBACK_TOKEN=pk.your_fallback_token_here
VITE_MAPBOX_FALLBACK_STYLE=mapbox://styles/mapbox/light-v11

# API configuration
VITE_API_BASE_URL=https://api.awhittlewandering.com
VITE_EDGE_WORKER_URL=https://api.awhittlewandering.com
VITE_WEBSOCKET_ENDPOINT=wss://api.awhittlewandering.com/ws

# Feature flags
VITE_USE_SIMULATED_DATA=false
VITE_ENABLE_ANALYTICS=true
```

## Validation Scripts

The repository contains several validation scripts to ensure reliable deployment:

- **verify-mapbox-token.sh**: Ensures Mapbox token is correctly embedded in the build
- **check-bundle-size.sh**: Verifies bundle sizes are within acceptable limits
- **validate-api-endpoints.sh**: Checks API endpoint configurations
- **validate-build.js**: Orchestrates all validation scripts

Run validation scripts with:
```bash
cd 48Continental_Starter/public-site
bash scripts/verify-mapbox-token.sh
bash scripts/check-bundle-size.sh
bash scripts/validate-api-endpoints.sh
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Mapbox for map rendering
- OpenWeatherMap for weather data
- Tesla API for vehicle telemetry
