# 48 Continental MVP Setup Guide

## Overview

This guide will help you set up and run the 48 Continental MVP with real-time Tesla telemetry data from Tessie API.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Tessie API Account** with:
   - API Token
   - Vehicle VIN
3. **Mapbox Account** for map rendering
4. **OpenWeather API Key** for weather data

## Quick Start

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd ContinentalUSA

# Install all dependencies
cd edge-worker && npm install && cd ..
cd 48Continental_Starter/public-site && npm install && cd ../..
```

### 2. Configure Environment Variables

#### Edge Worker Configuration
Create `edge-worker/.dev.vars`:

```env
# Tessie API Configuration
TESSIE_API_TOKEN=your_tessie_api_token_here
TESSIE_VIN=your_tesla_vin_here

# Weather API
WEATHER_API_KEY=your_openweather_api_key_here

# Map Services
MAPBOX_TOKEN=your_mapbox_token_here

# Security
EDGE_HMAC_KEY=your_random_hmac_key_here
```

#### Frontend Configuration
Create `48Continental_Starter/public-site/.env.local`:

```env
# Tessie API Configuration
VITE_TESSIE_API_TOKEN=your_tessie_api_token_here
VITE_TESSIE_VIN=your_tesla_vin_here

# API Endpoints
VITE_API_BASE_URL=http://localhost:8787

# Map Configuration
VITE_MAPBOX_TOKEN=your_mapbox_token_here

# Feature Flags
VITE_ENABLE_STREAMING=true
VITE_USE_SIMULATED_DATA=false
```

### 3. Start All Services

```bash
# Make the script executable (first time only)
chmod +x scripts/start-services.sh

# Start all services
./scripts/start-services.sh
```

This will start:
- **Edge Worker** on http://localhost:8787
- **Frontend** on http://localhost:5173

## Architecture Overview

### Frontend (React + Vite)
- **Location**: `48Continental_Starter/public-site/`
- **Key Components**:
  - `Dashboard.jsx` - Main UI component
  - `useVehicleData` hook - Manages real-time vehicle data
  - `Map.jsx` - Renders vehicle location on map
  - `VehicleStatusCard.jsx` - Displays vehicle metrics

### Backend (Cloudflare Worker)
- **Location**: `edge-worker/`
- **Key Endpoints**:
  - `/api/vehicle` - Get current vehicle state from Tessie
  - `/api/weather` - Get weather for vehicle location
  - `/api/charging-stations` - Find nearby charging stations

### Data Flow
1. Frontend requests vehicle data from Edge Worker
2. Edge Worker fetches data from Tessie API
3. Data is transformed and returned to frontend
4. Frontend updates UI with real-time information
5. WebSocket connection maintains live updates

## API Endpoints

### Vehicle Data
```
GET /api/vehicle
Response: {
  id: "VIN",
  name: "Vehicle Name",
  batteryLevel: 85,
  range: 250,
  location: {
    latitude: 30.2672,
    longitude: -97.7431
  },
  speed: 65,
  ...
}
```

### Weather Data
```
GET /api/weather?lat=30.2672&lon=-97.7431
Response: {
  temperature: 72,
  conditions: "Clear",
  humidity: 45,
  ...
}
```

## Troubleshooting

### Common Issues

1. **"Vehicle API not configured" Error**
   - Ensure `TESSIE_API_TOKEN` and `TESSIE_VIN` are set in `.dev.vars`
   - Verify your Tessie API token is valid

2. **Map Not Loading**
   - Check that `MAPBOX_TOKEN` is set correctly
   - Ensure the token has the necessary permissions

3. **No Real-Time Updates**
   - Verify WebSocket connection in browser console
   - Check that vehicle is awake (Tessie may need to wake it)

4. **CORS Errors**
   - Ensure Edge Worker is running on http://localhost:8787
   - Check that API endpoints include proper CORS headers

### Debug Mode

To use simulated data (no API required):
```env
VITE_USE_SIMULATED_DATA=true
```

### Logs

- **Frontend Logs**: Browser Developer Console
- **Edge Worker Logs**: Terminal where `npm run dev` is running

## Testing the Integration

1. **Verify Vehicle Data**:
   - Open http://localhost:5173
   - Check that vehicle status card shows real data
   - Verify battery level, range, and location

2. **Test Real-Time Updates**:
   - Drive the vehicle (or use Tessie simulator)
   - Watch for location updates on the map
   - Monitor speed and power changes

3. **Weather Integration**:
   - Verify weather shows for vehicle's current location
   - Check that weather updates as vehicle moves

4. **Charging Stations**:
   - Enable charging stations layer on map
   - Verify stations appear near vehicle location

## Production Deployment

See [DEPLOYMENT_STRATEGY.md](./DEPLOYMENT_STRATEGY.md) for production deployment instructions.

## Security Notes

- Never commit `.env.local` or `.dev.vars` files
- Use environment variables for all sensitive data
- Rotate API keys regularly
- Enable CORS only for your domain in production

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review logs for error messages
3. Verify all API credentials are correct
4. Ensure vehicle is online and accessible via Tessie

## Next Steps

Once the MVP is running:
1. Customize the UI in `Dashboard.jsx`
2. Add more vehicle metrics to `VehicleStatusCard.jsx`
3. Implement trip tracking in `useTripData` hook
4. Add charging recommendations based on route
5. Integrate with iOS app for mobile access
