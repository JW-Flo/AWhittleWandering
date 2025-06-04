# The Wandering Whittle Public Website

This is the public-facing website for The Wandering Whittle road trip tracking application. It provides real-time tracking and visualization of a Tesla road trip across all 48 contiguous United States.

## Features

- **Real-time Vehicle Tracking**: Live tracking of Tesla vehicle position, speed, and status
- **Interactive Map**: Visual representation of the journey with route visualization
- **Trip Statistics**: Up-to-date statistics about the journey, including states visited and miles traveled
- **Weather Integration**: Current weather conditions along the route
- **Charging Station Finder**: Locate nearby Tesla Superchargers and other charging options
- **Offline Support**: Progressive Web App (PWA) functionality for offline access to key features
- **Responsive Design**: Optimized for both desktop and mobile viewing

## Technology Stack

- **Frontend**: React.js with custom hooks for data management
- **Maps**: MapBox integration for detailed mapping
- **Real-time Updates**: WebSocket connection for live vehicle data
- **Offline Support**: Service Worker for Progressive Web App capabilities
- **Styling**: CSS with custom variables for theming

## New Feature: Real-time Vehicle Data

The website now includes a WebSocket-based real-time vehicle data stream that provides continuous updates about the Tesla's:

- Current location
- Battery status
- Speed and power usage
- Climate control settings
- Vehicle lock status
- Tire pressure
- Other critical vehicle metrics

This feature replaces the previous polling mechanism and offers:

- Lower latency updates
- Reduced API calls to Tesla's servers
- Reliable connection status indicators
- Automatic reconnection on network issues
- Consistent user experience across devices

### Technical Implementation

The real-time vehicle data is implemented using:

1. A Cloudflare Worker that:
   - Establishes a secure connection to Tesla API
   - Handles authentication and token refresh
   - Polls the Tesla API at defined intervals
   - Broadcasts updates to all connected clients via WebSockets

2. A React hook (`useVehicleData`) that:
   - Manages WebSocket connection lifecycle
   - Handles data serialization/deserialization
   - Provides connection status information
   - Implements reconnection logic
   - Offers fallback to traditional polling when needed

3. A React component (`VehicleStatusCard`) that:
   - Displays real-time vehicle data
   - Shows connection status
   - Provides reconnection controls
   - Adapts to different vehicle states

## Development

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with required API keys:
   ```
   MAPBOX_TOKEN=your_mapbox_token
   WEATHER_API_KEY=your_weather_api_key
   ```

### Running Locally

Start the development server:
```
npm run dev
```

The site will be available at http://localhost:3000

### Testing WebSocket Connections

For testing the WebSocket vehicle data stream locally:

1. Start the Edge Worker locally:
   ```
   cd ../../edge-worker
   npx wrangler dev
   ```

> **Note:** All Cloudflare Wrangler commands in this project should use `npx wrangler` rather than a global `wrangler` installation to ensure compatibility with CI/CD workflows.

2. Use the included test utility from the browser console:
   ```javascript
   import { testVehicleWebSocket } from './src/utils/websocket-test';
   const test = testVehicleWebSocket('your_vehicle_id');
   ```

### Building for Production

```
npm run build
```

This generates static files in the `dist` directory.

## Deployment

The website is deployed to Cloudflare Pages. The deployment process is managed through the `scripts/deploy-all.sh` script.

## Documentation

For more detailed documentation, please see:
- [WebSocket Implementation](../../docs/websocket-implementation.md)
- [Vehicle Stream API](../../docs/vehicle-stream-api.md)
