# A Whittle Wandering (48 Continental)

A real-time tracking system for a 60-day Tesla road trip through all 48 contiguous U.S. states.

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
├── 48Continental_Starter/     # Legacy React frontend (being consolidated)
│   └── public-site/           # React frontend application
├── awhittlewandering/         # New consolidated codebase (preferred)
│   ├── packages/
│   │   └── frontend/          # React application
│   └── workers/               # Cloudflare Workers
├── edge-worker/               # Edge Worker API implementation (active)
├── mcp-server/                # MCP server implementation (active)
├── mcp-48continental/         # MCP plugins for 48 Continental project
├── ContinentalUSA-mobile/     # Mobile app (Expo/React Native)
├── ios-client/                # iOS Swift client
├── shared/                    # Shared utilities and services
├── scripts/                   # Deployment and utility scripts
├── docs/                      # Project documentation
└── .github/                   # GitHub Actions workflows
```

> **Note**: The repository is currently undergoing consolidation. New development should focus on the `awhittlewandering/` directory where possible. Legacy directories are being maintained for compatibility.

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

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Setup
1. **Clone the repository**
   ```bash
   git clone https://github.com/JW-Flo/AWhittleWandering.git
   cd AWhittleWandering
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys (see CONTRIBUTING.md for details)
   ```

4. **Choose your development area**
   - **Edge Worker**: `cd edge-worker`
   - **Frontend**: `cd awhittlewandering/packages/frontend` 
   - **MCP Server**: `cd mcp-server`
   - **Mobile App**: `cd ContinentalUSA-mobile`

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed development setup instructions.

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
