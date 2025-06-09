/**
 * The Wandering Whittle Main Application Component
 * 
 * This is the primary React component that renders the entire
 * The Wandering Whittle road trip tracking application.
 * 
 * @version 1.0.0
 * @author The Wandering Whittle Team
 * @license MIT
 * 
 * CRITICAL LAUNCH VERSION
 */

/* eslint-env browser */
import React, { useState, useEffect } from 'react';

// Import data source hooks
import { useVehicleData, useWeatherData, useTripData, useChargingStations } from './hooks';
import mapboxConfig from '@shared/mapbox/mapboxConfig.ts';

// Import Dashboard component
import Dashboard from './components/Dashboard';

/**
 * Main App component
 */
const App = () => {
  // Component state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data using custom hooks with WebSocket streaming for vehicle data from Tessie API
  const { vehicleData, loading: vehicleLoading, error: vehicleError, connectionStatus } = useVehicleData({
    enableStreaming: true,
    pollInterval: 30000  // Fallback polling interval if WebSocket fails
  });

  // Update other data sources based on vehicle location
  const { weatherData, weatherLoading, weatherError } = useWeatherData({
    location: vehicleData ? {
      latitude: vehicleData.location?.latitude || vehicleData.latitude,
      longitude: vehicleData.location?.longitude || vehicleData.longitude
    } : null,
    pollInterval: 15000  // More frequent updates for weather
  });

  const { tripData, tripLoading, tripError } = useTripData({ pollInterval: 20000 });

  const { stationsData, stationsLoading, stationsError } = useChargingStations({
    latitude: vehicleData?.location?.latitude || vehicleData?.latitude,
    longitude: vehicleData?.location?.longitude || vehicleData?.longitude,
    radius: 50,
    pollInterval: 30000
  });

  // Set loading state based on data loading
  useEffect(() => {
    if (!vehicleLoading && !weatherLoading && !tripLoading && !stationsLoading) {
      // Slight delay to ensure smooth transition
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [vehicleLoading, weatherLoading, tripLoading, stationsLoading]);

  // Set error state only if we have no data at all
  useEffect(() => {
    // Only show error if we have no vehicle data AND an error
    // Since vehicle data is the most critical, we can still show the app with just that
    if (!vehicleData && vehicleError) {
      setError(vehicleError);
    } else {
      // Clear any previous errors if we have data
      setError(null);
    }
  }, [vehicleData, vehicleError, weatherError, tripError, stationsError]);

  // Add Mapbox token to document head if not already present
  useEffect(() => {
    // Check if token meta tag already exists
    if (!document.querySelector('meta[name="mapbox-token"]')) {
      const tokenMeta = document.createElement('meta');
      tokenMeta.name = 'mapbox-token';
      // Use The Wandering Whittle's Mapbox token
      tokenMeta.content = import.meta.env.VITE_MAPBOX_TOKEN || '';
      document.head.appendChild(tokenMeta);
    }
  }, []);

  return (
    <div className="app-container">
      <Dashboard
        vehicleData={vehicleData}
        weatherData={weatherData}
        tripData={tripData}
        stationsData={stationsData}
        connectionStatus={connectionStatus}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
};

export default App;
