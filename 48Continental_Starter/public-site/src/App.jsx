/**
 * 48 Continental USA Main Application Component
 * 
 * This is the primary React component that renders the entire
 * 48 Continental USA road trip tracking application.
 */

/* eslint-env browser */
import React, { useState, useEffect } from 'react';

// Import data source hooks
import { useVehicleData, useWeatherData, useTripData, useChargingStations } from './hooks';

// Import Dashboard component
import Dashboard from './components/Dashboard';

/**
 * Main App component
 */
const App = () => {
  // Component state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch data using custom hooks
  const { vehicleData, vehicleLoading, vehicleError } = useVehicleData();
  const { weatherData, weatherLoading, weatherError } = useWeatherData({
    location: vehicleData ? { latitude: vehicleData.latitude, longitude: vehicleData.longitude } : null
  });
  const { tripData, tripLoading, tripError } = useTripData();
  const { stationsData, stationsLoading, stationsError } = useChargingStations({
    latitude: vehicleData?.latitude,
    longitude: vehicleData?.longitude,
    radius: 50
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
  
  // Set error state if any data fetching fails
  useEffect(() => {
    const errorMessage = vehicleError || weatherError || tripError || stationsError;
    if (errorMessage) {
      setError(errorMessage);
    }
  }, [vehicleError, weatherError, tripError, stationsError]);
  
  // Add Mapbox token to document head if not already present
  useEffect(() => {
    // Check if token meta tag already exists
    if (!document.querySelector('meta[name="mapbox-token"]')) {
      const tokenMeta = document.createElement('meta');
      tokenMeta.name = 'mapbox-token';
      // This is a placeholder token - replace with a valid one for production
      tokenMeta.content = 'pk.placeholder-token-replace-in-production';
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
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
};

export default App;
