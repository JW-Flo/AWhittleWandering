# Enhanced Vehicle Tracker Documentation

This document provides information about the Enhanced Vehicle Tracker implementation for the The Wandering Whittle Project. The enhanced vehicle tracker provides real-time visualization of the Tesla's location and status during the 60-day road trip across all 48 contiguous U.S. states.

## Overview

The Enhanced Vehicle Tracker is built on top of the LiveVehicleMap component but uses the new `useVehicleData` hook for better separation of concerns and improved data management. This architecture makes the map component more maintainable and provides additional features for interacting with the vehicle.

## Components

### EnhancedVehicleMap

This is the main component that displays the vehicle on a map along with the trip route, stops, and vehicle status information. Key features include:

- Real-time vehicle location tracking
- Route visualization from trip data
- Stop markers with type-based styling (charging, overnight, etc.)
- Vehicle status indicators (battery, speed, connection status)
- Interactive controls for mock data simulation
- Map layer toggles (satellite view, traffic)
- Responsive design for various screen sizes

### useVehicleData Hook

This custom React hook handles all the vehicle data fetching, polling, and state management, providing a clean API for components to consume vehicle data. Features include:

- Support for both mock data and Tessie API integration
- WebSocket or polling-based updates
- Route following simulation for mock data
- Vehicle status management (charging, movement, etc.)
- Error handling and connection status tracking

## Testing

### Test Page

The Enhanced Vehicle Tracker has a dedicated test page available at:

```
/enhanced-vehicle-tracker
```

This page allows you to:

- Toggle between mock and live data
- Switch between WebSocket and polling updates
- Adjust polling interval
- Toggle map layers (satellite, traffic, charging stations)
- View the full route visualization
- Test vehicle controls

### Running the Test

To quickly test the Enhanced Vehicle Tracker, use the provided test script:

```bash
node test-enhanced-vehicle-tracker.cjs
```

Or with the executable:

```bash
./test-enhanced-vehicle-tracker.cjs
```

This script will start a development server and open the Enhanced Vehicle Tracker test page in your default browser.

## Integration

To use the Enhanced Vehicle Tracker in another page or component:

```jsx
import EnhancedVehicleMap from '../components/EnhancedVehicleMap';
import tripData from '../data/trip-data.json';

// In your component
<EnhancedVehicleMap
  tripData={tripData}
  useMock={true}
  pollingInterval={3000}
  mapLayers={{
    satellite: false,
    traffic: true,
    chargingStations: false
  }}
/>
```

## Configuration

### Mapbox Token

The Enhanced Vehicle Tracker requires a Mapbox token to render maps. Set this in your `.env` file:

```
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

You can set up a Mapbox token by running:

```bash
node setup-mapbox-token.cjs
```

### Tessie API Token

For live vehicle data, a Tessie API token is required. Set this in your `.env` file:

```
VITE_TESSIE_API_TOKEN=your_tessie_token_here
```

## Improvements Over Original Implementation

The Enhanced Vehicle Tracker offers several improvements over the original LiveVehicleMap:

1. **Better Separation of Concerns**
   - Vehicle data logic extracted to a custom hook
   - Map rendering separated from data fetching

2. **Enhanced User Experience**
   - Interactive vehicle controls
   - Improved loading states
   - Better error handling

3. **More Efficient Data Management**
   - Reduced unnecessary re-renders
   - Optimized data fetching
   - Better resource cleanup

4. **Additional Features**
   - Vehicle wake control for live data
   - Mock movement and charging toggles
   - Connection status indicator

## Future Enhancements

Planned improvements for the Enhanced Vehicle Tracker include:

- Integration with weather data along the route
- Historical path tracking (breadcrumb trail)
- Charging station directory overlay
- Trip statistics dashboard integration
- Enhanced trip progress visualization

## Troubleshooting

### Common Issues

1. **Map Not Loading**
   - Check that your Mapbox token is valid and set correctly in `.env`
   - Verify that the browser has internet access

2. **Vehicle Data Not Updating**
   - For mock data, ensure the simulation is running
   - For live data, check your Tessie API token

3. **Route Not Displaying**
   - Verify that your trip data contains valid coordinates
   - Check the browser console for any errors
