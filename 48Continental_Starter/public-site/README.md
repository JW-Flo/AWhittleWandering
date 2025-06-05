# The Wandering Whittle Public Website

This is the public-facing website for The Wandering Whittle road trip tracking application. It provides real-time tracking and visualization of a 60-day Tesla road trip across all 48 contiguous United States.

## Quick Start

```bash
# Install dependencies and set up environment
npm run setup

# Start development server
npm run dev
```

## Requirements

- Node.js >= 22.16.0 (LTS)
- npm >= 10.0.0
- Wrangler CLI >= 4.19.0

## Documentation

- [Setup Guide](./SETUP.md) - Initial setup and installation instructions
- [Development Guide](./DEVELOPMENT_GUIDE.md) - Comprehensive development documentation
- [WebSocket Implementation](../../docs/websocket-implementation.md)
- [Vehicle Stream API](../../docs/vehicle-stream-api.md)

## Features

- **Real-time Vehicle Tracking**: Live tracking of Tesla vehicle position, speed, and status
- **Interactive Map**: Visual representation of the journey with route visualization
- **Trip Statistics**: Up-to-date statistics about the journey, including states visited and miles traveled
- **Weather Integration**: Current weather conditions along the route
- **Charging Station Finder**: Locate nearby Tesla Superchargers and other charging options
- **Offline Support**: Progressive Web App (PWA) functionality for offline access to key features
- **Responsive Design**: Optimized for both desktop and mobile viewing

## Development

```bash
# Run tests
npm test

# Run tests with real data
npm run test:real-data

# Analyze test failures
npm run test:analyze

# Build for production
npm run build

# Deploy
npm run deploy
```

## Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configure required environment variables:
   - `VITE_MAPBOX_TOKEN`: Your Mapbox access token
   - `CF_ACCOUNT_ID`: Your Cloudflare account ID
   - `CF_API_TOKEN`: Your Cloudflare API token

See [Setup Guide](./SETUP.md) for detailed configuration instructions.

## Testing Philosophy

We prioritize testing with real data over mocks to catch actual integration issues. See our [Development Guide](./DEVELOPMENT_GUIDE.md) for more details on our testing strategy and failure tracking system.

## Technology Stack

- **Frontend**: React.js with custom hooks for data management
- **Maps**: MapBox integration for detailed mapping
- **Real-time Updates**: WebSocket connection for live vehicle data
- **Offline Support**: Service Worker for Progressive Web App capabilities
- **Styling**: CSS with custom variables for theming

## Contributing

1. Ensure you have the required Node.js version:
   ```bash
   nvm use
   ```

2. Set up the development environment:
   ```bash
   npm run setup
   ```

3. Make your changes and run tests:
   ```bash
   npm run test:real-data
   ```

4. Review the test results in `test-results/LATEST_FAILURES.md`

## License

MIT
