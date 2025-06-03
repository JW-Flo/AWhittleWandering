/**
 * Weather API Handler
 * 
 * This module handles interactions with the weather API.
 */

/* eslint-env browser */

/**
 * Fetch weather data for a specific location
 * @param {Object} location - Location object with latitude and longitude
 * @returns {Promise<Object>} Weather data
 */
export const fetchWeatherData = async (location = null) => {
  try {
    // Build endpoint URL with optional location parameters
    let endpoint = '/api/weather';
    
    if (location && location.latitude && location.longitude) {
      endpoint += `?lat=${location.latitude}&lon=${location.longitude}`;
    }
    
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
};

/**
 * Fetch weather forecast for upcoming days
 * @param {Object} location - Location object with latitude and longitude
 * @param {number} days - Number of days to forecast
 * @returns {Promise<Object>} Weather forecast data
 */
export const fetchWeatherForecast = async (location = null, days = 7) => {
  try {
    // Build endpoint URL with parameters
    let endpoint = '/api/weather-forecast';
    
    const params = new URLSearchParams();
    if (location && location.latitude && location.longitude) {
      params.append('lat', location.latitude);
      params.append('lon', location.longitude);
    }
    params.append('days', days);
    
    endpoint += `?${params.toString()}`;
    
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Weather forecast API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    throw error;
  }
};

/**
 * Generate simulated weather data for testing
 * @param {Object} location - Optional location to get weather for
 * @returns {Object} Simulated weather data
 */
export const generateSimulatedWeatherData = (location) => {
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
};
