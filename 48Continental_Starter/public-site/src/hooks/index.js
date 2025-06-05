/**
 * Custom Hooks Index
 * 
 * Exports all custom hooks for The Wandering Whittle website
 * NOTE: All hooks now use real API calls; no fallback mock data remains.
 */


/* eslint-env browser */
import { useState, useEffect } from 'react';
import realUseVehicleData from './useVehicleData';
import { fetchWeatherData } from '../api/weatherApi';

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

  useEffect(() => {
    async function loadWeather() {
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
        
        const data = await fetchWeatherData({ latitude: lat, longitude: lon });
        setWeatherData(data);
        setWeatherError(null);
      } catch (err) {
        console.error('Error loading weather data:', err);
        setWeatherError(err.message);
      } finally {
        setWeatherLoading(false);
      }
    }

    loadWeather();
  }, [options.location, options.latitude, options.longitude]);

  return {
    weatherData,
    weatherLoading,
    weatherError,
    refreshWeatherData: () => {}
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

  useEffect(() => {
    async function loadStations() {
      try {
        const lat = options.latitude || 27.741777;
        const lon = options.longitude || -97.388844;
  
        // Example: replace with your real stations endpoint
        const resp = await fetch(`/api/stations?lat=${lat}&lon=${lon}`);
        if (!resp.ok) {
          throw new Error(`Error loading stations: ${resp.status}`);
        }
        const data = await resp.json();
        setStationsData(data);
      } catch (err) {
        console.error('Error loading charging stations:', err);
        setStationsError(err.message);
      } finally {
        setStationsLoading(false);
      }
    }

    loadStations();
  }, [options]);

  return {
    stationsData,
    stationsLoading,
    stationsError,
    refreshStationsData: () => {}
  };
};
