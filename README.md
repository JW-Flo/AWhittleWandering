# A Whittle Wandering (48 Continental)

A comprehensive real-time tracking system for a 60-day Tesla road trip through all 48 contiguous U.S. states. This project provides live vehicle tracking, trip statistics, weather integration, and interactive mapping capabilities.

## 🚗 Project Overview

The Wandering Whittle is a live, production system that tracks our Tesla Model Y as we journey through all 48 contiguous states. The system provides:

- **Real-time vehicle tracking** with GPS coordinates and telemetry
- **Interactive map visualization** with route planning and state progress
- **Live trip statistics** including distance traveled, states visited, and charging information
- **Weather integration** for current conditions along the route
- **Social sharing capabilities** for trip milestones

## 🏗️ Architecture

This is a distributed system built with modern web technologies:

- **Frontend**: React 18 application with Vite, deployed on Cloudflare Pages
- **Backend**: Cloudflare Workers for API endpoints and data processing
- **Storage**: Cloudflare KV for persistent trip data and caching
- **External APIs**: Tessie (Tesla data), OpenWeather (weather), Mapbox (maps)
- **Real-time**: WebSocket streaming for live updates

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account (for deployment)
- API keys for external services (see [Environment Setup](#environment-setup))

### Installation

```bash
# Clone the repository
git clone https://github.com/JW-Flo/AWhittleWandering.git
cd AWhittleWandering

# Install dependencies
npm install

# Set up environment variables (see Environment Setup section)
cp .env.example .env
# Edit .env with your API keys
```

### Environment Setup

Create a `.env` file based on `.env.example` and configure the following:

```

#### Required Environment Variables

- `TESSIE_API_TOKEN` - Tesla vehicle data via Tessie API
- `TESSIE_VIN` - Your Tesla vehicle identification number
- `MAPBOX_TOKEN` - Mapbox API token for map rendering
- `OPENWEATHER_API_KEY` - OpenWeatherMap API key for weather data
- `EDGE_HMAC_KEY` - Security key for API authentication
- `CF_API_TOKEN` - Cloudflare API token (for deployment)
- `CF_ACCOUNT_ID` - Cloudflare account ID (for deployment)

See [Environment Setup Guide](docs/GITHUB_SECRETS_SETUP.md) for detailed instructions on obtaining these credentials.

### Development

```bash
# Start the frontend development server
cd 48Continental_Starter/public-site
npm install
npm run dev

# In another terminal, start the edge worker locally
cd edge-worker
npm install
npm run dev
```

### Deployment

```bash
# Deploy edge worker
cd edge-worker
npm run deploy

# Deploy frontend (automatically via GitHub Actions)
git push origin main
```

## 📁 Repository Structure

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

## 🧪 Testing

The project includes comprehensive testing infrastructure:

```bash
# Run API endpoint tests
node scripts/test-api-endpoints.js

# Run frontend component tests  
cd 48Continental_Starter/public-site
npm run test

# Validate deployment
node scripts/deployment-success-validator.js
```

## 📊 Monitoring & Analytics

- **Real-time monitoring**: GitHub Actions workflows for continuous integration
- **Performance tracking**: Built-in analytics for map loading and API response times
- **Error reporting**: Comprehensive logging and error tracking
- **Health checks**: Automated endpoint validation and system health monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and formatting
- Add tests for new functionality
- Update documentation for any API changes
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Website**: [The Wandering Whittle](https://main.continentalusa-site.pages.dev)
- **API Documentation**: [Edge Worker API](docs/PROJECT_SUMMARY.md)
- **Technical Docs**: [Architecture Guide](docs/mcp-server-architecture/index.md)

## 📞 Support

For questions or issues:

1. Check the [documentation](docs/) directory
2. Review existing [GitHub issues](https://github.com/JW-Flo/AWhittleWandering/issues)
3. Create a new issue with detailed description

---

Built with ❤️ for the 48 Continental journey

## Contact

For questions or support, please open an issue in the repository or contact the project maintainers.
