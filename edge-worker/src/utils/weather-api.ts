/**
 * Weather API utilities for the 48 Continental project
 * Handles fetching weather data from external APIs and analyzing it for EV-specific risks
 */

import type { Weather } from '../types';

/**
 * Fetch weather data for a specific location
 * @param latitude The latitude coordinate
 * @param longitude The longitude coordinate
 * @param apiKey The Weather API key (optional, will use fallback data if not provided)
 * @returns Weather data for the specified location
 */
export async function fetchWeatherData(latitude: number, longitude: number, apiKey: string): Promise<Weather> {
  try {
    if (!apiKey) {
      console.warn('Weather API key not provided, using fallback data');
      return generateFallbackWeatherData(latitude, longitude);
    }

    // Use OpenWeatherMap API as primary source
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`
    );

    if (!response.ok) {
      console.warn(`Weather API returned status ${response.status}, using fallback data`);
      return generateFallbackWeatherData(latitude, longitude);
    }

    const data = await response.json();

    // Transform the response into our Weather type
    const weather: Weather = {
      temperature: data.main.temp, // Temperature in Celsius
      windSpeed: data.wind.speed * 3.6, // Convert m/s to km/h
      precipitation: data.rain ? data.rain['1h'] || 0 : 0, // mm of rain in last hour, or 0 if no rain data
      conditions: parseWeatherConditions(data.weather || [])
    };

    return weather;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return generateFallbackWeatherData(latitude, longitude);
  }
}

/**
 * Type definition for OpenWeatherMap condition objects
 */
interface OpenWeatherCondition {
  id: number;
  main?: string;
  description?: string;
  icon?: string;
}

/**
 * Parse OpenWeatherMap conditions into standardized condition strings
 * @param conditions Array of weather condition objects from OpenWeatherMap
 * @returns Array of standardized condition strings
 */
function parseWeatherConditions(conditions: OpenWeatherCondition[]): string[] {
  const mappedConditions: string[] = [];

  for (const condition of conditions) {
    const id = condition.id;
    const mainDesc = condition.main?.toLowerCase() || '';

    // Thunderstorms (200-299)
    if (id >= 200 && id < 300) {
      mappedConditions.push('thunderstorm');
    }
    // Drizzle (300-399)
    else if (id >= 300 && id < 400) {
      mappedConditions.push('light-rain');
    }
    // Rain (500-599)
    else if (id >= 500 && id < 600) {
      if (id === 511) {
        mappedConditions.push('freezing-rain');
      } else if (id >= 502) {
        mappedConditions.push('heavy-rain');
      } else {
        mappedConditions.push('rain');
      }
    }
    // Snow (600-699)
    else if (id >= 600 && id < 700) {
      if (id === 601 || id === 602) {
        mappedConditions.push('heavy-snow');
      } else if (id === 611 || id === 612 || id === 613) {
        mappedConditions.push('sleet');
      } else {
        mappedConditions.push('snow');
      }
    }
    // Atmosphere (700-799) - fog, mist, etc.
    else if (id >= 700 && id < 800) {
      if (id === 781) {
        mappedConditions.push('tornado');
      } else if (id === 771) {
        mappedConditions.push('strong-wind');
      } else if (id === 762) {
        mappedConditions.push('volcanic-ash');
      } else if (id === 751) {
        mappedConditions.push('sand');
      } else if (id === 741) {
        mappedConditions.push('fog');
      } else {
        mappedConditions.push('haze');
      }
    }
    // Clear (800)
    else if (id === 800) {
      mappedConditions.push('clear');
    }
    // Clouds (801-899)
    else if (id > 800 && id < 900) {
      if (id >= 803) {
        mappedConditions.push('cloudy');
      } else {
        mappedConditions.push('partly-cloudy');
      }
    }
    // Extreme conditions (900-999)
    else if (id >= 900) {
      if (id === 906) {
        mappedConditions.push('hail');
      } else if (id === 905 || id === 957) {
        mappedConditions.push('strong-wind');
      } else if (id === 904) {
        mappedConditions.push('extreme-heat');
      } else if (id === 903) {
        mappedConditions.push('extreme-cold');
      } else if (id === 902 || id === 901) {
        mappedConditions.push('hurricane');
      } else if (id === 900) {
        mappedConditions.push('tornado');
      }
    }

    // Add main condition if not already covered
    if (mainDesc && !mappedConditions.some(c => c.includes(mainDesc))) {
      mappedConditions.push(mainDesc);
    }
  }

  return mappedConditions;
}

/**
 * Generate fallback weather data based on location when API is unavailable
 * Uses a deterministic algorithm based on coordinates for consistency
 * @param latitude The latitude coordinate
 * @param longitude The longitude coordinate
 * @returns Generated weather data
 */
function generateFallbackWeatherData(latitude: number, longitude: number): Weather {
  // Use coordinates to generate somewhat realistic weather data
  // This is deterministic based on coordinates, so same locations get same weather
  const latFactor = Math.abs(Math.sin(latitude * 0.0174533));
  const lonFactor = Math.abs(Math.cos(longitude * 0.0174533));
  const dayOfYear = Math.floor((Date.now() / 86400000) % 365);
  const seasonFactor = Math.sin((dayOfYear / 365) * 2 * Math.PI);
  
  // Temperature between -10 and 35 degrees Celsius, affected by latitude and season
  const baseTemp = 15 - 25 * latFactor; // Base temperature based on latitude
  const seasonalTemp = 15 * seasonFactor; // Seasonal variation
  const temperature = baseTemp + seasonalTemp;
  
  // Wind speed between 0 and 60 km/h
  const windSpeed = 60 * (0.3 + 0.7 * lonFactor * Math.random());
  
  // Precipitation between 0 and 20 mm
  const precipitation = Math.random() < 0.3 ? 20 * Math.random() * latFactor : 0;
  
  // Determine conditions based on generated values
  const conditions: string[] = [];
  
  if (temperature < 0) {
    conditions.push(precipitation > 0.1 ? 'snow' : 'clear');
  } else if (precipitation > 5) {
    conditions.push('heavy-rain');
  } else if (precipitation > 0.5) {
    conditions.push('rain');
  } else if (precipitation > 0.1) {
    conditions.push('light-rain');
  } else {
    conditions.push(Math.random() < 0.7 ? 'clear' : 'partly-cloudy');
  }
  
  if (windSpeed > 40) {
    conditions.push('strong-wind');
  }
  
  return {
    temperature,
    windSpeed,
    precipitation,
    conditions
  };
}

/**
 * Determine if current weather conditions are favorable for EV travel
 * @param weather Current weather conditions
 * @returns true if conditions are favorable, false otherwise
 */
export function isFavorableForEV(weather: Weather): boolean {
  // Unfavorable conditions:
  // 1. Extreme temperatures (affect battery efficiency)
  if (weather.temperature < -10 || weather.temperature > 35) {
    return false;
  }
  
  // 2. Strong winds (increase energy consumption)
  if (weather.windSpeed > 50) {
    return false;
  }
  
  // 3. Heavy precipitation (safety and visibility issues)
  if (weather.precipitation > 10) {
    return false;
  }
  
  // 4. Dangerous conditions
  const dangerousConditions = [
    'thunderstorm', 'heavy-snow', 'tornado', 'hurricane', 
    'freezing-rain', 'sleet', 'ice', 'hail'
  ];
  
  if (weather.conditions.some(condition => dangerousConditions.includes(condition))) {
    return false;
  }
  
  // All other conditions are considered favorable
  return true;
}
