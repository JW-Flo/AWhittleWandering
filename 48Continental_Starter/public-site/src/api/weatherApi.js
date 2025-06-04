/**
 * Weather API Utilities
 * 
 * This module provides functions to fetch and process weather data
 * from OpenWeather API for The Wandering Whittle application.
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
 * Fetch weather data directly from OpenWeather API
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Weather data
 */
export const fetchWeatherData = async (options = {}) => {
  const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
  
  if (!API_KEY) {
    console.error('Missing OpenWeather API key in environment variables');
    throw new Error('Configuration error: Missing OpenWeather API key');
  }
  
  try {
    // Use our Cloudflare Worker to proxy the request and add caching
    let url = '/api/weather';
    
    // Add query parameters if provided
    if (options.latitude && options.longitude) {
      url += `?lat=${options.latitude}&lon=${options.longitude}`;
    } else if (options.location) {
      // Use location object if provided
      url += `?lat=${options.location.latitude}&lon=${options.location.longitude}`;
    }
    
    // Add our API key to the request
    url += `&appid=${API_KEY}&units=imperial`;
    
    // Make the request
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Weather API error:', response.status, errorText);
      throw new Error(`Weather API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return transformWeatherData(data);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    
    // If we're in development mode or the API fails, return simulated data
    if (import.meta.env.DEV || error.message.includes('Weather API error')) {
      console.warn('Using simulated weather data due to API error');
      return generateSimulatedWeatherData(options);
    }
    
    throw error;
  }
};

/**
 * Transform OpenWeather API data to our application format
 * @param {Object} weatherData - Raw data from OpenWeather API
 * @returns {Object} Transformed weather data
 */
const transformWeatherData = (weatherData) => {
  // If we received data in our format already (e.g., from cache)
  if (weatherData.current && weatherData.daily) {
    return weatherData;
  }
  
  // Get the weather condition icon mapping
  const getConditionFromCode = (code) => {
    const codeStr = code.toString();
    
    // Weather condition mapping based on OpenWeather codes
    // https://openweathermap.org/weather-conditions
    if (codeStr.startsWith('2')) {
      return { type: 'thunderstorm', description: 'Thunderstorm', icon: '🌩️' };
    } else if (codeStr.startsWith('3')) {
      return { type: 'drizzle', description: 'Drizzle', icon: '🌧️' };
    } else if (codeStr.startsWith('5')) {
      return { type: 'rain', description: 'Rain', icon: '🌧️' };
    } else if (codeStr.startsWith('6')) {
      return { type: 'snow', description: 'Snow', icon: '❄️' };
    } else if (codeStr.startsWith('7')) {
      return { type: 'fog', description: 'Fog', icon: '🌫️' };
    } else if (codeStr === '800') {
      return { type: 'clear', description: 'Clear sky', icon: '☀️' };
    } else if (codeStr.startsWith('80')) {
      return { type: 'clouds', description: 'Clouds', icon: '☁️' };
    }
    
    return { type: 'unknown', description: 'Unknown', icon: '❓' };
  };
  
  // Format hourly forecast if available
  const hourly = weatherData.hourly?.map(hour => {
    const condition = getConditionFromCode(hour.weather[0].id);
    
    return {
      hour: new Date(hour.dt * 1000).getHours(),
      temp: Math.round(hour.temp),
      condition
    };
  }) || [];
  
  // Format daily forecast if available
  const daily = weatherData.daily?.map(day => {
    const condition = getConditionFromCode(day.weather[0].id);
    
    return {
      day: new Date(day.dt * 1000).toISOString().split('T')[0],
      high: Math.round(day.temp.max),
      low: Math.round(day.temp.min),
      condition,
      precipitation: Math.round(day.pop * 100) // Probability of precipitation
    };
  }) || [];
  
  // Transform the current weather data
  const current = weatherData.current;
  const mainCondition = current?.weather?.[0] || { id: 800, description: 'Clear' };
  
  return {
    location: {
      latitude: weatherData.lat || 0,
      longitude: weatherData.lon || 0,
      city: weatherData.name || 'Unknown',
      state: weatherData.state || '',
      country: weatherData.country || 'US'
    },
    current: {
      temp: Math.round(current?.temp || 0),
      feels_like: Math.round(current?.feels_like || 0),
      humidity: current?.humidity || 0,
      wind_speed: Math.round(current?.wind_speed || 0),
      wind_direction: current?.wind_deg || 0,
      condition: getConditionFromCode(mainCondition.id),
      uv_index: Math.round(current?.uvi || 0),
      visibility: Math.round((current?.visibility || 0) / 1609.34), // Convert meters to miles
      pressure: current?.pressure || 0
    },
    hourly: hourly.slice(0, 24), // Limit to 24 hours
    daily: daily.slice(0, 7),    // Limit to 7 days
    alerts: weatherData.alerts || [],
    last_updated: new Date().toISOString()
  };
};
