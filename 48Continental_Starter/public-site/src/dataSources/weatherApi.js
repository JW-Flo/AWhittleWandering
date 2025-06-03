/**
 * Weather API Module for 48 Continental USA
 * 
 * Handles fetching weather data from weather APIs via edge worker
 */

/* eslint-env browser */

// Sample data for development/fallback
const SAMPLE_WEATHER = {
  temperature: 72,
  feelsLike: 74,
  condition: 'Clear',
  description: 'Clear skies',
  icon: '01d',
  humidity: 65,
  pressure: 1012,
  windSpeed: 8.5,
  windDirection: 270,
  visibility: 10000,
  uv: 5,
  dewPoint: 61,
  cloudCover: 10,
  timestamp: new Date().toISOString()
};

// Weather conditions by temperature range
const WEATHER_CONDITIONS = [
  { temp: 32, condition: 'Snow', icon: '13d', descriptions: ['Light snow', 'Snow flurries', 'Snow shower'] },
  { temp: 40, condition: 'Rain', icon: '10d', descriptions: ['Cold rain', 'Freezing rain', 'Sleet'] },
  { temp: 50, condition: 'Rain', icon: '09d', descriptions: ['Light rain', 'Drizzle', 'Showers'] },
  { temp: 60, condition: 'Cloudy', icon: '04d', descriptions: ['Mostly cloudy', 'Overcast', 'Grey skies'] },
  { temp: 70, condition: 'Partly Cloudy', icon: '02d', descriptions: ['Partly cloudy', 'Scattered clouds', 'Broken clouds'] },
  { temp: 85, condition: 'Clear', icon: '01d', descriptions: ['Clear skies', 'Sunny', 'Fair'] },
  { temp: 95, condition: 'Hot', icon: '01d', descriptions: ['Hot and sunny', 'Heat wave', 'Very hot'] },
  { temp: 120, condition: 'Extreme Heat', icon: '01d', descriptions: ['Extreme heat', 'Dangerous heat', 'Scorching'] }
];

/**
 * Fetch the latest weather data
 * @param {Object} options - Options for fetching weather data
 * @param {number} [options.latitude] - Latitude for weather location
 * @param {number} [options.longitude] - Longitude for weather location
 * @returns {Promise<Object>} Weather data
 */
export async function fetchWeatherData(options = {}) {
  try {
    // If we have Tesla vehicle data with location, use that
    let latitude = options.latitude;
    let longitude = options.longitude;
    
    if (!latitude || !longitude) {
      // Try to get location from Tesla data in global state
      if (window.TRIP_DATA && window.TRIP_DATA.vehicle) {
        latitude = window.TRIP_DATA.vehicle.latitude;
        longitude = window.TRIP_DATA.vehicle.longitude;
      }
    }
    
    // If we still don't have coordinates, use a default
    if (!latitude || !longitude) {
      latitude = 40.7128; // New York City
      longitude = -74.006;
    }
    
    // Edge worker domain
    const EDGE_WORKER_DOMAIN = window.EDGE_WORKER_DOMAIN || 'https://thewanderingwhittle-edge.workers.dev';
    
    // Attempt to fetch real data from the weather API via edge worker
    const response = await fetch(`${EDGE_WORKER_DOMAIN}/weather?lat=${latitude}&lon=${longitude}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      // Short timeout to avoid blocking UI
      signal: AbortSignal.timeout(5000)
    });
    
    // If the request was successful, return the real data
    if (response.ok) {
      const data = await response.json();
      
      // Set timestamp if not provided
      if (!data.timestamp) {
        data.timestamp = new Date().toISOString();
      }
      
      console.log('Weather data fetched successfully:', data);
      return data;
    }
    
    // If we got an error response, log it and fall back to sample data
    console.warn('Failed to fetch weather data, using sample data:', await response.text());
    return generateWeatherData(latitude, longitude);
  } catch (error) {
    // If there was a network error or other exception, log it and fall back to sample data
    console.warn('Error fetching weather data, using sample data:', error);
    return generateWeatherData(options.latitude, options.longitude);
  }
}

/**
 * Generate dynamic weather data based on location and time
 * @param {number} latitude - Latitude for weather location
 * @param {number} longitude - Longitude for weather location
 * @returns {Object} Dynamically generated weather data
 */
function generateWeatherData(latitude = 40.7128, longitude = -74.006) {
  // Create a copy of the sample data
  const data = { ...SAMPLE_WEATHER };
  
  // Update timestamp
  data.timestamp = new Date().toISOString();
  
  // Simulate temperature based on latitude, longitude, time of year, and time of day
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const hour = now.getHours(); // 0-23
  
  // Base temperature depends on latitude (cooler as you go north)
  // Roughly: temperature decreases by about 5°F per 5° latitude increase
  let baseTemp = 85 - (Math.abs(latitude - 25) * 0.5);
  
  // Adjust for season (Northern Hemisphere)
  // Winter (Dec-Feb): colder
  if (month <= 1 || month === 11) {
    baseTemp -= 30;
  }
  // Spring (Mar-May): mild
  else if (month >= 2 && month <= 4) {
    baseTemp -= 10;
  }
  // Summer (Jun-Aug): warmer
  else if (month >= 5 && month <= 7) {
    baseTemp += 10;
  }
  // Fall (Sep-Nov): mild, cooling
  else {
    baseTemp -= 5;
  }
  
  // Adjust for time of day
  // Coolest at 5am, warmest at 3pm
  const hourFactor = Math.sin(((hour - 5) % 24) / 24 * 2 * Math.PI);
  baseTemp += hourFactor * 15;
  
  // Add some randomness (±5°F)
  baseTemp += (Math.random() * 10 - 5);
  
  // Round to nearest integer
  data.temperature = Math.round(baseTemp);
  
  // Set "feels like" temperature (accounting for humidity and wind)
  data.humidity = 40 + Math.random() * 50; // 40-90%
  data.windSpeed = Math.random() * 15; // 0-15 mph
  
  // Calculate "feels like" temperature
  if (data.temperature > 80 && data.humidity > 60) {
    // Hot and humid feels hotter
    data.feelsLike = data.temperature + (data.humidity - 60) / 3;
  } else if (data.temperature < 50 && data.windSpeed > 5) {
    // Cold and windy feels colder (wind chill)
    data.feelsLike = data.temperature - (data.windSpeed - 5) / 2;
  } else {
    data.feelsLike = data.temperature;
  }
  
  data.feelsLike = Math.round(data.feelsLike);
  
  // Set weather condition based on temperature
  for (let i = 0; i < WEATHER_CONDITIONS.length; i++) {
    if (data.temperature <= WEATHER_CONDITIONS[i].temp) {
      data.condition = WEATHER_CONDITIONS[i].condition;
      data.icon = WEATHER_CONDITIONS[i].icon;
      
      // Pick a random description
      const descriptions = WEATHER_CONDITIONS[i].descriptions;
      data.description = descriptions[Math.floor(Math.random() * descriptions.length)];
      
      break;
    }
  }
  
  // Special cases for certain conditions
  // Simulate rain probability based on humidity
  if (data.humidity > 80 && Math.random() > 0.5) {
    data.condition = 'Rain';
    data.description = 'Light rain';
    data.icon = '10d';
  }
  
  // Simulate thunderstorms in summer with high humidity
  if (data.temperature > 80 && data.humidity > 75 && Math.random() > 0.7) {
    data.condition = 'Thunderstorm';
    data.description = 'Thunderstorms';
    data.icon = '11d';
  }
  
  // Nighttime condition
  if (hour >= 18 || hour <= 6) {
    // Replace day icon with night icon (d -> n)
    data.icon = data.icon.replace('d', 'n');
  }
  
  // Additional data
  data.pressure = Math.round(1010 + (Math.random() * 20 - 10)); // 1000-1030 hPa
  data.windDirection = Math.round(Math.random() * 360); // 0-359 degrees
  data.visibility = Math.min(10000, Math.round((10000 - data.humidity * 50) + Math.random() * 2000)); // Lower in humidity
  data.cloudCover = Math.round(data.condition === 'Clear' ? Math.random() * 10 : 30 + Math.random() * 70);
  data.uv = Math.round(data.condition === 'Clear' ? 5 + Math.random() * 5 : Math.random() * 5);
  
  return data;
}

/**
 * Get current air quality data
 * @param {Object} options - Options for fetching air quality data
 * @param {number} [options.latitude] - Latitude for location
 * @param {number} [options.longitude] - Longitude for location
 * @returns {Promise<Object>} Air quality data
 */
export async function getAirQualityData(options = {}) {
  try {
    // If we have coordinates, use them
    let latitude = options.latitude;
    let longitude = options.longitude;
    
    if (!latitude || !longitude) {
      // Try to get location from Tesla data in global state
      if (window.TRIP_DATA && window.TRIP_DATA.vehicle) {
        latitude = window.TRIP_DATA.vehicle.latitude;
        longitude = window.TRIP_DATA.vehicle.longitude;
      }
    }
    
    // If we still don't have coordinates, use a default
    if (!latitude || !longitude) {
      latitude = 40.7128; // New York City
      longitude = -74.006;
    }
    
    // Edge worker domain
    const EDGE_WORKER_DOMAIN = window.EDGE_WORKER_DOMAIN || 'https://thewanderingwhittle-edge.workers.dev';
    
    // Attempt to fetch real data from the air quality API via edge worker
    const response = await fetch(`${EDGE_WORKER_DOMAIN}/airquality?lat=${latitude}&lon=${longitude}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      const data = await response.json();
      return data;
    }
    
    // Fall back to simulated data
    return {
      aqi: Math.floor(Math.random() * 100) + 20, // 20-120
      pollutants: {
        pm25: Math.random() * 50,
        pm10: Math.random() * 70,
        o3: Math.random() * 80,
        no2: Math.random() * 40,
        so2: Math.random() * 30,
        co: Math.random() * 5
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.warn('Error fetching air quality data:', error);
    
    // Return simulated data
    return {
      aqi: Math.floor(Math.random() * 100) + 20, // 20-120
      pollutants: {
        pm25: Math.random() * 50,
        pm10: Math.random() * 70,
        o3: Math.random() * 80,
        no2: Math.random() * 40,
        so2: Math.random() * 30,
        co: Math.random() * 5
      },
      timestamp: new Date().toISOString()
    };
  }
}
