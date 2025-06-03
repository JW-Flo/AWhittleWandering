/**
 * Weather Data Hook
 * 
 * This hook provides access to weather data for the current vehicle location
 * or any specified location.
 */

/* eslint-env browser */
import { useState, useEffect, useCallback } from 'react';
import { fetchWeatherData, generateSimulatedWeatherData } from '../api';

// Default polling interval in milliseconds
const DEFAULT_POLL_INTERVAL = 300000; // 5 minutes

/**
 * Hook for accessing weather data
 * @param {Object} options - Configuration options
 * @param {Object} options.location - Location object with latitude and longitude
 * @param {number} options.pollInterval - Data refresh interval in ms
 * @returns {Object} Weather data, loading state, and error
 */
export const useWeatherData = (options = {}) => {
  const {
    location = null,
    pollInterval = DEFAULT_POLL_INTERVAL
  } = options;
  
  // State for weather data
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(null);
  
  // Function to fetch weather data from API
  const getWeatherData = useCallback(async () => {
    setWeatherLoading(true);
    
    try {
      // Call our API function
      const data = await fetchWeatherData(location);
      setWeatherData(data);
      setWeatherError(null);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setWeatherError(error.message);
      
      // If we don't have data yet, use simulated data
      if (!weatherData) {
        setWeatherData(generateSimulatedWeatherData(location));
      }
    } finally {
      setWeatherLoading(false);
    }
  }, [location, weatherData]);
  
  // Refresh weather data when location changes
  useEffect(() => {
    getWeatherData();
  }, [getWeatherData]);
  
  // Set up polling for periodic updates
  useEffect(() => {
    const pollTimer = setInterval(getWeatherData, pollInterval);
    
    return () => {
      clearInterval(pollTimer);
    };
  }, [getWeatherData, pollInterval]);
  
  return {
    weatherData,
    weatherLoading,
    weatherError,
    refreshWeatherData: getWeatherData
  };
};
