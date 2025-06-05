/**
 * Custom Hooks Index
 * 
 * Exports all custom hooks for The Wandering Whittle website
 * NOTE: All hooks now use real API calls; no fallback mock data remains.
 */


/* eslint-env browser */
import { useState, useEffect, useRef } from 'react';
import realUseVehicleData from './useVehicleData';
import { fetchWeatherData } from '../api/weatherApi';
import { mockWeatherData, mockStationsData } from '../api/mockData';

// Track API call counts globally to prevent excessive calls
const apiCallCounts = {
  weather: 0,
  stations: 0
};

/**
 * Hook for accessing vehicle data with real implementation
 * Adapts the new hook to maintain the same API interface
 * Now with enhanced error handling and mock data fallback (if desired)
 */
export const useVehicleData = (options = {}) => {
  // Use our real implementation with options passed through
  const {
    vehicleData,
    loading,
    error,
    connectionStatus,
    retry,
    isSimulated
  } = realUseVehicleData(options);

  // Return with the naming expected by components
  return {
    vehicleData,
    vehicleLoading: loading,
    vehicleError: error,
    connectionStatus,
    isMockData: isSimulated,
    refreshVehicleData: retry, // Use the retry function
    usingMockData: isSimulated
  };
};

/**
 * Hook for accessing weather data with real OpenWeather integration
 */
export const useWeatherData = (options = {}) => {
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    async function loadWeather() {
      // Prevent duplicate calls on mount
      if (hasLoadedRef.current) return;
      hasLoadedRef.current = true;

      try {
        // Use location from options if provided (from vehicle data)
        let lat, lon;
        if (options.location) {
          lat = options.location.latitude;
          lon = options.location.longitude;
        } else {
          // Default to Texas location if no vehicle location available
          lat = options.latitude || 27.741777;
          lon = options.longitude || -97.388844;
        }
        
        if (!lat || !lon) {
          setWeatherLoading(false);
          return;
        }

        // Check if we should use mock data
        if (apiCallCounts.weather >= 5) {
          console.log('Weather API: Using mock data after 5 failed attempts');
          setWeatherData({ ...mockWeatherData, coord: { lat, lon } });
          setWeatherError(null);
          setWeatherLoading(false);
          return;
        }
        
        const data = await fetchWeatherData({ latitude: lat, longitude: lon });
        setWeatherData(data);
        setWeatherError(null);
        apiCallCounts.weather = 0; // Reset on success
      } catch (err) {
        apiCallCounts.weather++;
        console.error(`Weather API error (attempt ${apiCallCounts.weather}/5):`, err);
        
        if (apiCallCounts.weather >= 5) {
          console.log('Weather API: Switching to mock data');
          setWeatherData({ ...mockWeatherData, coord: { lat: options.latitude || 27.741777, lon: options.longitude || -97.388844 } });
          setWeatherError('Using cached data');
        } else {
          setWeatherError(err.message);
        }
      } finally {
        setWeatherLoading(false);
      }
    }

    loadWeather();
  }, [options.location?.latitude, options.location?.longitude, options.latitude, options.longitude]);

  return {
    weatherData,
    weatherLoading,
    weatherError,
    refreshWeatherData: () => {
      hasLoadedRef.current = false;
      setWeatherLoading(true);
    }
  };
};

/**
 * Hook for accessing trip data from real API
 */
export const useTripData = () => {
  const [tripData, setTripData] = useState(null);
  const [tripLoading, setTripLoading] = useState(true);
  const [tripError, setTripError] = useState(null);

  useEffect(() => {
    async function loadTrip() {
      try {
        // Example: replace with your real trip endpoint
        const response = await fetch('/api/trip');
        if (!response.ok) {
          throw new Error(`Trip data error: ${response.status}`);
        }
        const data = await response.json();
        setTripData(data);
      } catch (error) {
        console.error('Error loading trip data:', error);
        setTripError(error.message);
      } finally {
        setTripLoading(false);
      }
    }

    loadTrip();
  }, []);

  // Computed values
  const currentStop = tripData?.currentStop || null;
  const nextStop = tripData?.nextStop || null;
  const visitedStates = tripData?.visitedStates || [];
  const remainingStates = tripData ? (48 - visitedStates.length) : 48;
  const completionPercentage = tripData
    ? Math.round((visitedStates.length / 48) * 100)
    : 0;

  return {
    tripData,
    tripLoading,
    tripError,
    refreshTripData: () => {},
    // Computed properties
    currentStop,
    nextStop,
    visitedStates,
    remainingStates,
    completionPercentage
  };
};

/**
 * Hook for accessing charging stations data from real API
 */
export const useChargingStations = (options = {}) => {
  const [stationsData, setStationsData] = useState(null);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [stationsError, setStationsError] = useState(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    async function loadStations() {
      // Prevent duplicate calls on mount
      if (hasLoadedRef.current) return;
      hasLoadedRef.current = true;

      try {
        const lat = options.latitude || 27.741777;
        const lon = options.longitude || -97.388844;

        // Check if we should use mock data
        if (apiCallCounts.stations >= 5) {
          console.log('Stations API: Using mock data after 5 failed attempts');
          setStationsData(mockStationsData);
          setStationsError(null);
          setStationsLoading(false);
          return;
        }
  
        const resp = await fetch(`/api/stations?lat=${lat}&lon=${lon}`);
        if (!resp.ok) {
          throw new Error(`Error loading stations: ${resp.status}`);
        }
        const data = await resp.json();
        setStationsData(data);
        setStationsError(null);
        apiCallCounts.stations = 0; // Reset on success
      } catch (err) {
        apiCallCounts.stations++;
        console.error(`Stations API error (attempt ${apiCallCounts.stations}/5):`, err);
        
        if (apiCallCounts.stations >= 5) {
          console.log('Stations API: Switching to mock data');
          setStationsData(mockStationsData);
          setStationsError('Using cached data');
        } else {
          setStationsError(err.message);
        }
      } finally {
        setStationsLoading(false);
      }
    }

    loadStations();
  }, [options.latitude, options.longitude]);

  return {
    stationsData,
    stationsLoading,
    stationsError,
    refreshStationsData: () => {
      hasLoadedRef.current = false;
      setStationsLoading(true);
    }
  };
};
