/**
 * A Whittle Wandering Main Application Component
 */

/* eslint-env browser */
import React, { useState, useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useErrorTracking } from './hooks/useErrorTracking';

// Import data source hooks
import { useVehicleData, useWeatherData, useTripData, useChargingStations } from './hooks';

// Import Dashboard component
import Dashboard from './components/Dashboard';

/**
 * Main App component
 */
const App = () => {
  // Enable error tracking
  useErrorTracking();

  // Component state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDataInitialized, setIsDataInitialized] = useState(false);

  // Start with only vehicle data and basic trip data
  const { vehicleData, loading: vehicleLoading, error: vehicleError, connectionStatus } = useVehicleData({
    enableStreaming: false,
    pollInterval: 30000
  });

  const { tripData, error: tripError } = useTripData({
    pollInterval: 30000,
    enabled: isDataInitialized
  });

  // Load weather and charging data only after initial render
  const { weatherData, error: weatherError } = useWeatherData({
    location: vehicleData ? {
      latitude: vehicleData.location?.latitude || vehicleData.latitude,
      longitude: vehicleData.location?.longitude || vehicleData.longitude
    } : null,
    pollInterval: 30000,
    enabled: isDataInitialized
  });

  const { stationsData, error: stationsError } = useChargingStations({
    latitude: vehicleData?.location?.latitude || vehicleData?.latitude,
    longitude: vehicleData?.location?.longitude || vehicleData?.longitude,
    radius: 50,
    pollInterval: 30000,
    enabled: isDataInitialized
  });

  // Enable additional data loading after initial render
  useEffect(() => {
    if (vehicleData && !isDataInitialized) {
      setIsDataInitialized(true);
    }
  }, [vehicleData]);

  // Set loading state based primarily on vehicle data
  useEffect(() => {
    if (!vehicleLoading && vehicleData) {
      setIsLoading(false);
    }
  }, [vehicleLoading, vehicleData]);

  // Set error state only if we have no data at all
  useEffect(() => {
    if (!vehicleData && vehicleError) {
      setError(vehicleError);
    } else {
      setError(null);
    }
  }, [vehicleData, vehicleError, weatherError, tripError, stationsError]);

  // Add Mapbox token to document head if not already present
  useEffect(() => {
    if (!document.querySelector('meta[name="mapbox-token"]')) {
      const tokenMeta = document.createElement('meta');
      tokenMeta.name = 'mapbox-token';
      tokenMeta.content = import.meta.env.VITE_MAPBOX_TOKEN || '';
      document.head.appendChild(tokenMeta);
    }
  }, []);

  return (
    <ErrorBoundary showError={import.meta.env.DEV}>
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
    </ErrorBoundary>
  );
};

export default App;
