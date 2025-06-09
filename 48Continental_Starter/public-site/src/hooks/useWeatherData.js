/**
 * Weather Data Hook
 * 
 * This hook provides access to current and forecasted weather data
 * for the The Wandering Whittle journey.
 */

/* eslint-env browser */
import { useState, useEffect, useCallback } from 'react';
import { fetchWeatherData, generateSimulatedWeatherData } from '../api/weatherApi';

// Default polling interval in milliseconds
const DEFAULT_POLL_INTERVAL = 600000; // 10 minutes

/**
 * Hook for accessing weather data
 * @param {Object} options - Configuration options
 * @param {Object} options.location - Location coordinates
 * @param {number} options.pollInterval - Data refresh interval in ms
 * @returns {Object} Weather data, loading state, and error
 */
export const useWeatherData = (options = {}) => {
  const {
    location,
    pollInterval = DEFAULT_POLL_INTERVAL
  } = options;
  
  // State for weather data
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(null);
  
  // Function to fetch weather data from API
  const getWeatherData = useCallback(async () => {
    // If no location provided, can't fetch weather
    if (!location || !location.latitude || !location.longitude) {
      // Use simulated data with default location
      setWeatherData(generateSimulatedWeatherData());
      setWeatherLoading(false);
      return;
    }
    
    setWeatherLoading(true);
    
    try {
      // Call our API function with location
      const data = await fetchWeatherData({
        latitude: location.latitude,
        longitude: location.longitude
      });
      
      setWeatherData(data);
      setWeatherError(null);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setWeatherError(error.message);
      
      // If we don't have data yet, use simulated data
      if (!weatherData) {
        setWeatherData(generateSimulatedWeatherData({ location }));
      }
    } finally {
      setWeatherLoading(false);
    }
  }, [location, weatherData]);
  
  // Fetch weather data when location changes or on initial load
  useEffect(() => {
    getWeatherData();
    
    // Set up polling if location provided
    if (location) {
      const pollTimer = setInterval(getWeatherData, pollInterval);
      
      return () => {
        clearInterval(pollTimer);
      };
    }
  }, [getWeatherData, location, pollInterval]);
  
  return {
    weatherData,
    weatherLoading,
    weatherError,
    refreshWeatherData: getWeatherData
  };
};
