/**
 * Custom Hooks Index
 * 
 * Exports all custom hooks for The Wandering Whittle website
 */

/* eslint-env browser */
import { useState, useEffect } from 'react';
import { mockWeatherData, mockTripData, mockStationsData } from '../mockData';
import realUseVehicleData from './useVehicleData';

/**
 * Hook for accessing vehicle data with real implementation
 * Adapts the new hook to maintain the same API interface
 * Now with enhanced error handling and mock data fallback
 */
export const useVehicleData = (options = {}) => {
  const vehicleId = options.vehicleId || 'default';
  
  // Use our real implementation with improved fallback
  const {
    vehicleData,
    loading,
    error,
    connectionStatus,
    isMockData
  } = realUseVehicleData(vehicleId);

  // Return with the naming expected by components
  return {
    vehicleData,
    vehicleLoading: loading,
    vehicleError: error,
    connectionStatus,
    isMockData,
    refreshVehicleData: () => {}, // Maintained for API compatibility
    usingMockData: isMockData
  };
};

/**
 * Hook for accessing weather data with mock implementation
 */
export const useWeatherData = (options = {}) => {
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError] = useState(null);

  useEffect(() => {
    // Short timeout to simulate loading
    const timer = setTimeout(() => {
      setWeatherData(mockWeatherData);
      setWeatherLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [options.location]);

  return {
    weatherData,
    weatherLoading,
    weatherError,
    refreshWeatherData: () => {}
  };
};

/**
 * Hook for accessing trip data with mock implementation
 */
export const useTripData = () => {
  const [tripData, setTripData] = useState(null);
  const [tripLoading, setTripLoading] = useState(true);
  const [tripError] = useState(null);

  useEffect(() => {
    // Short timeout to simulate loading
    const timer = setTimeout(() => {
      setTripData(mockTripData);
      setTripLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Computed values
  const currentStop = tripData?.currentStop || null;
  const nextStop = tripData?.nextStop || null;
  const visitedStates = tripData?.visitedStates || [];
  const remainingStates = tripData ? 
    48 - visitedStates.length : 
    48;
  const completionPercentage = tripData ? 
    Math.round((visitedStates.length / 48) * 100) : 
    0;

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
 * Hook for accessing charging stations data with mock implementation
 */
export const useChargingStations = (options = {}) => {
  const [stationsData, setStationsData] = useState(null);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [stationsError] = useState(null);

  useEffect(() => {
    // Short timeout to simulate loading
    const timer = setTimeout(() => {
      setStationsData(mockStationsData);
      setStationsLoading(false);
    }, 1800);

    return () => clearTimeout(timer);
  }, [options.latitude, options.longitude]);

  return {
    stationsData,
    stationsLoading,
    stationsError,
    refreshStationsData: () => {}
  };
};
