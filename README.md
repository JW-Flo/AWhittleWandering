# A Whittle Wandering (48 Continental)

A real-time tracking system for a 60-day Tesla road trip through all 48 contiguous U.S. states.

## Quick Start (Simplified)

**Want to just deploy the site? Skip all the complexity below:**

1. **Local Development**:
   ```bash
   cd 48Continental_Starter/public-site
   npm install
   npm run dev
   ```

2. **Build & Deploy**:
   ```bash
   npm run build   # Builds the site
   npm run deploy  # Deploys to Cloudflare Pages
   ```

3. **Automatic Deployment**: Push to main branch and GitHub Actions will auto-deploy.

---

## 🎯 Current Status (June 27, 2025)

✅ **FULLY OPERATIONAL**: All systems deployed and functional
- **Website**: https://faa9b25d.awhittlewandering-site.pages.dev
- **API Endpoints**: https://awhittlewandering-edge.kd8jc7v8cd.workers.dev  
- **Current Location**: Pocatello, ID → Farr West, UT → Provo, UT
- **Trip Progress**: 34% complete (10 states visited, 38 remaining)
- **Vehicle Stats**: 62,036 miles, 94% battery, traveling I-15 South
- **Data Integration**: Real-time vehicle, weather, trip, and charging APIs

---

## Project Description

This project tracks a Tesla vehicle on a 60-day journey across all 48 contiguous United States, providing real-time updates on location, weather, state visits, and trip progress. The system consists of multiple interconnected components that work together to create a seamless experience for users following the journey.

## System Architecture

The system is built with the following core components:

- **Public Website**: React-based frontend for user interaction
- **Edge Worker**: Cloudflare Workers API backend
- **MCP Server**: Mission Control Platform running on a persistent iMac
- **Vehicle Telemetry**: Integration with Tessie API for Tesla data
- **Weather Integration**: Real-time weather data along the route
- **Deployment Pipeline**: Automated testing and deployment

## Repository Structure

```
├── 48Continental_Starter/     # Original project structure
│   └── public-site/           # React frontend application
├── awhittlewandering/         # New consolidated codebase
│   ├── packages/
│   │   └── frontend/          # React application
│   └── workers/               # Cloudflare Workers
├── edge-worker/               # Edge Worker API implementation
├── mcp-server/                # MCP server implementation
├── mcp-48continental/         # MCP plugins for 48 Continental project
├── n8n/                       # n8n workflows for automation
├── shared/                    # Shared utilities and services
├── scripts/                   # Deployment and utility scripts
├── docs/                      # Project documentation
└── .github/                   # GitHub Actions workflows
```

## Key Features

- Real-time vehicle tracking on an interactive map
- Current weather conditions along the route
- State visit tracking and visualization
- Trip progress and statistics
- Automated deployment and monitoring
- Resilient infrastructure with fallback mechanisms

## Deployment Process

The project uses a comprehensive deployment process:

1. **Environment Validation**: Checks for required environment variables
2. **Component Deployment**: Deploys each component in the correct order
3. **Testing**: Runs automated tests to verify functionality
4. **Verification**: Performs post-deployment checks
5. **Reporting**: Generates deployment reports

To deploy the project:

```bash
# Deploy everything
./scripts/deploy-project.sh

# Deploy specific components
./scripts/deploy-project.sh --component edge-worker
./scripts/deploy-project.sh --component public-site
```

## Environment Setup

The following environment variables are required:

```
CF_API_TOKEN=your_cloudflare_api_token
CF_ACCOUNT_ID=your_cloudflare_account_id
TESSIE_API_TOKEN=your_tessie_api_token
TESSIE_VIN=your_tesla_vehicle_id
OPENWEATHER_API_KEY=your_openweather_api_key
MAPBOX_TOKEN=your_mapbox_token
EDGE_HMAC_KEY=your_edge_hmac_key
```

Create a `.env` file in the project root with these variables or set them in your environment.

## Development

To set up a local development environment:

```bash
# Install dependencies
npm install

# Start frontend development server
cd 48Continental_Starter/public-site
npm run dev

# Start edge worker locally
cd edge-worker
npm run dev
```

## Testing

The project includes various testing scripts:

```bash
# Test API endpoints
node scripts/test-api-endpoints.js

# Verify Mapbox token
cd 48Continental_Starter/public-site
./scripts/verify-mapbox-token.sh

# Validate deployment
node scripts/deployment-success-validator.js
```

## CI/CD

The project uses GitHub Actions for continuous integration and deployment. The workflows are defined in:

```
.github/workflows/deploy-all-final.yml
.github/workflows/test-edge-worker.yml
.github/workflows/auto-monitoring.yml
```

## Documentation

For more detailed information, refer to the following documentation:

- [Project Summary](docs/PROJECT_SUMMARY.md) - Complete project overview
- [Deployment Strategy](docs/DEPLOYMENT_STRATEGY.md) - Deployment approach and considerations
- [MCP Server Architecture](docs/mcp-server-architecture/index.md) - MCP server design and implementation

## License

This project is licensed under the terms of the LICENSE file included in the repository.

## Contact

For questions or support, please open an issue in the repository or contact the project maintainers.
