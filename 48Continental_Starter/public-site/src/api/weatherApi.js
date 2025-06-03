/**
 * Weather API Utilities
 * 
 * This module provides functions to generate simulated weather data
 * for testing and development of the 48 Continental USA application.
 */

/* eslint-env browser */

// List of weather conditions to randomly select from
const WEATHER_CONDITIONS = [
  { type: 'clear', description: 'Clear sky', icon: '☀️' },
  { type: 'partly_cloudy', description: 'Partly cloudy', icon: '⛅' },
  { type: 'cloudy', description: 'Cloudy', icon: '☁️' },
  { type: 'rain', description: 'Light rain', icon: '🌧️' },
  { type: 'heavy_rain', description: 'Heavy rain', icon: '⛈️' },
  { type: 'thunderstorm', description: 'Thunderstorm', icon: '🌩️' },
  { type: 'snow', description: 'Snow', icon: '❄️' },
  { type: 'fog', description: 'Foggy', icon: '🌫️' },
  { type: 'windy', description: 'Windy', icon: '💨' }
];

/**
 * Generate random temperature value within a range
 * @param {number} min - Minimum temperature
 * @param {number} max - Maximum temperature
 * @returns {number} Random temperature
 */
function getRandomTemperature(min = 65, max = 85) {
  return Math.round(min + Math.random() * (max - min));
}

/**
 * Generate random wind speed
 * @param {number} max - Maximum wind speed
 * @returns {number} Random wind speed
 */
function getRandomWindSpeed(max = 15) {
  return Math.round(Math.random() * max);
}

/**
 * Generate random humidity percentage
 * @returns {number} Random humidity percentage
 */
function getRandomHumidity() {
  return Math.round(30 + Math.random() * 50);
}

/**
 * Generate simulated weather data for testing
 * @param {Object} options - Configuration options
 * @param {Object} options.location - Location coordinates
 * @returns {Object} Simulated weather data
 */
export function generateSimulatedWeatherData(options = {}) {
  const { location } = options;
  const latitude = location?.latitude || 37.7749;
  const longitude = location?.longitude || -122.4194;
  
  // Get random weather condition
  const condition = WEATHER_CONDITIONS[Math.floor(Math.random() * WEATHER_CONDITIONS.length)];
  
  // Generate base temperature for the area
  const baseTemp = getRandomTemperature();
  
  // Today's forecast
  const hourlyForecast = Array.from({ length: 24 }, (_, i) => {
    // Temperature fluctuates throughout the day
    let tempVariation = 0;
    if (i < 6) {
      // Early morning (coolest)
      tempVariation = -5 - Math.random() * 5;
    } else if (i >= 6 && i < 12) {
      // Morning to noon (warming up)
      tempVariation = -5 + ((i - 6) / 6) * 10;
    } else if (i >= 12 && i < 18) {
      // Afternoon (warmest)
      tempVariation = 5 - ((i - 12) / 6) * 5;
    } else {
      // Evening (cooling down)
      tempVariation = 0 - ((i - 18) / 6) * 5;
    }
    
    return {
      hour: i,
      temp: Math.round(baseTemp + tempVariation),
      condition: { ...condition }
    };
  });
  
  // 5-day forecast
  const dailyForecast = Array.from({ length: 5 }, (_, i) => {
    // Each day's conditions may be different
    const dayCondition = WEATHER_CONDITIONS[Math.floor(Math.random() * WEATHER_CONDITIONS.length)];
    
    // Temperature varies by day
    const dayTempVariation = Math.round((Math.random() - 0.5) * 10);
    
    return {
      day: new Date(Date.now() + (i + 1) * 86400000).toISOString().split('T')[0],
      high: Math.round(baseTemp + dayTempVariation + 5),
      low: Math.round(baseTemp + dayTempVariation - 10),
      condition: { ...dayCondition },
      precipitation: Math.round(Math.random() * 100)
    };
  });
  
  return {
    location: {
      latitude,
      longitude,
      city: "Simulated City",
      state: "CA",
      country: "US"
    },
    current: {
      temp: baseTemp,
      feels_like: Math.round(baseTemp + (Math.random() - 0.5) * 5),
      humidity: getRandomHumidity(),
      wind_speed: getRandomWindSpeed(),
      wind_direction: Math.round(Math.random() * 360),
      condition,
      uv_index: Math.round(Math.random() * 10),
      visibility: Math.round(5 + Math.random() * 5), // in miles
      pressure: Math.round(990 + Math.random() * 40) // in hPa
    },
    hourly: hourlyForecast,
    daily: dailyForecast,
    alerts: [],
    last_updated: new Date().toISOString()
  };
}

/**
 * Fetch weather data from the API
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Weather data
 */
export const fetchWeatherData = async (options = {}) => {
  try {
    let url = '/api/weather';
    
    // Add query parameters if provided
    if (options.latitude && options.longitude) {
      url += `?lat=${options.latitude}&lon=${options.longitude}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
};
