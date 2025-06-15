# A Whittle Wandering

> 60 days, 48 states, One Tesla, One epic journey

A comprehensive web platform to track and showcase a 60-day Tesla road trip through all 48 contiguous U.S. states. This project provides real-time tracking, daily logs, and interactive maps to follow the journey.

## Project Overview

A Whittle Wandering is a monorepo project built using Cloudflare Workers for edge computing and React for the frontend. The project is structured to provide a seamless experience across devices while maintaining real-time data synchronization.

### Core Components

- **Frontend Application**: React-based SPA with MapBox integration for live tracking
- **Site Worker**: Serves the frontend and static assets
- **API Worker**: Handles data retrieval and updates for trip information
- **Browser Worker**: Enables server-side rendering and screenshots when needed
- **Dispatch Worker**: Coordinates system-wide operations and messaging

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- Cloudflare Workers account
- Mapbox API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/awhittlewandering.git
   cd awhittlewandering
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   
4. Update the `.env` file with your API keys and configuration values.

### Development

To run the project locally:

```bash
npm run dev
```

This will start the development server with hot reloading enabled.

### Building for Production

To build the project for production:

```bash
npm run build
```

### Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

## Project Structure

```
awhittlewandering/
├── packages/
│   ├── frontend/      # React frontend application
│   │   ├── src/       # Frontend source code
│   │   └── public/    # Static assets
│   └── shared/        # Shared types and utilities
├── workers/
│   ├── site.ts        # Site worker (serves frontend)
│   ├── api.ts         # API worker (data services)
│   ├── browser.ts     # Browser worker (SSR/screenshots)
│   └── dispatch.ts    # Dispatch worker (coordination)
├── wrangler.toml      # Main Cloudflare Workers config
└── wrangler-*.toml    # Worker-specific configs
```

## Features

- **Live Map Tracking**: Real-time visualization of the journey across the United States
- **Daily Logs**: Detailed records of each day's journey, including photos and highlights
- **Trip Statistics**: Mileage, states visited, charging stops, and more
- **Interactive Timeline**: Follow the journey chronologically
- **Responsive Design**: Optimized for all device sizes
- **Offline Support**: Progressive Web App capabilities
- **Supercharger Integration**: Information about Tesla Supercharger stops

## Data Architecture

The project uses Cloudflare KV for trip data storage, structured as follows:

- `current`: Current trip day and latest telemetry
- `days:${day}`: Trip data for each day (1-60)
- `summary`: Overall trip statistics and progress
- `route`: Complete planned route with waypoints
- `telemetry:${timestamp}`: Individual telemetry data points

## API Endpoints

- **GET /api/trip/current**: Current location and trip day
- **GET /api/trip/day/:day**: Details for a specific trip day
- **GET /api/trip/summary**: Overall trip statistics
- **GET /api/trip/route**: Complete route information

## Environment Variables

- `MAPBOX_TOKEN`: Mapbox API token for maps
- `APP_NAME`: Application name
- `MAP_STYLE`: Mapbox map style URL
- `ENABLE_STREAMING`: Enable streaming updates
- `ENABLE_MAP_PERFORMANCE_MONITORING`: Enable map performance monitoring
- `MAP_RETRY_ATTEMPTS`: Number of retry attempts for map loading
- `MAP_RETRY_DELAY`: Delay between retry attempts (ms)

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Cloudflare Workers](https://workers.cloudflare.com/)
- [React](https://reactjs.org/)
- [Mapbox](https://www.mapbox.com/)
- [Tesla API](https://www.teslaapi.io/)
