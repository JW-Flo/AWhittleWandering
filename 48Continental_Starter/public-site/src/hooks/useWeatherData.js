/**
 * Weather Data Hook
 * 
 * This hook provides access to real-time weather data along the route
 * including temperature, conditions, and forecasts.
 */

/* eslint-env browser */
import { useState, useEffect, useCallback } from 'react';

// Default polling interval in milliseconds
const DEFAULT_POLL_INTERVAL = 300000; // 5 minutes

/**
 * Hook for accessing weather data
 * @param {Object} options - Configuration options
 * @param {number} options.pollInterval - Data refresh interval in ms
 * @param {Object} options.location - Location to get weather for
 * @returns {Object} Weather data, loading state, and error
 */
export const useWeatherData = (options = {}) => {
  const {
    pollInterval = DEFAULT_POLL_INTERVAL,
    location = null
  } = options;
  
  // State for weather data
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(null);
  
  // Function to fetch weather data from API
  const fetchWeatherData = useCallback(async () => {
    setWeatherLoading(true);
    
    try {
      // In a real implementation, this would call a weather API service
      // For now, using simulated data for the prototype
      let endpoint = '/api/weather';
      
      // Add location parameters if provided
      if (location && location.latitude && location.longitude) {
        endpoint += `?lat=${location.latitude}&lon=${location.longitude}`;
      }
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
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
  
  // Initial data fetch and polling setup
  useEffect(() => {
    fetchWeatherData();
    
    // Set up polling
    const pollTimer = setInterval(fetchWeatherData, pollInterval);
    
    return () => {
      clearInterval(pollTimer);
    };
  }, [fetchWeatherData, pollInterval]);
  
  return { 
    weatherData, 
    weatherLoading, 
    weatherError,
    refreshWeatherData: fetchWeatherData
  };
};

/**
 * Generate simulated weather data for testing
 * @param {Object} location - Optional location to get weather for
 * @returns {Object} Simulated weather data
 */
function generateSimulatedWeatherData(location) {
  // Randomize conditions
  const conditions = [
    'Clear', 'Partly Cloudy', 'Cloudy', 'Overcast', 
    'Rain', 'Light Rain', 'Thunderstorm', 'Snow', 'Fog'
  ];
  
  // Get random condition
  const conditionIndex = Math.floor(Math.random() * conditions.length);
  const condition = conditions[conditionIndex];
  
  // Map condition to icon code (OpenWeatherMap-like codes)
  const iconMap = {
    'Clear': '01d',
    'Partly Cloudy': '02d',
    'Cloudy': '03d',
    'Overcast': '04d',
    'Rain': '10d',
    'Light Rain': '09d',
    'Thunderstorm': '11d',
    'Snow': '13d',
    'Fog': '50d'
  };
  
  // Base temperature around location if provided
  let baseTemp = 65; // Default fallback
  
  if (location && location.latitude) {
    // Rough estimate - higher temp closer to equator
    baseTemp = 70 - Math.abs(location.latitude - 30);
  }
  
  return {
    location: location || {
      latitude: 39.8283,
      longitude: -98.5795,
      name: 'Current Location'
    },
    temperature: baseTemp + (Math.random() * 20 - 10), // Random fluctuation
    feelsLike: baseTemp + (Math.random() * 20 - 8),
    condition: condition,
    icon: iconMap[condition],
    humidity: 30 + Math.floor(Math.random() * 60),
    windSpeed: Math.floor(Math.random() * 20),
    windDirection: Math.floor(Math.random() * 360),
    precipitation: {
      probability: Math.random(),
      intensity: Math.random() * 5
    },
    sunrise: new Date(new Date().setHours(6, Math.floor(Math.random() * 60), 0, 0)).toISOString(),
    sunset: new Date(new Date().setHours(20, Math.floor(Math.random() * 60), 0, 0)).toISOString(),
    forecast: Array.from({ length: 5 }, (_, i) => ({
      day: new Date(Date.now() + (i * 86400000)).toLocaleDateString('en-US', { weekday: 'short' }),
      temperature: {
        high: baseTemp + (Math.random() * 15),
        low: baseTemp - (Math.random() * 15)
      },
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      precipitation: Math.random() * 100
    })),
    last_updated: new Date().toISOString()
  };
}
