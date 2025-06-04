/**
 * weatherApi.js
 * Provides functions to load weather data through the backend API, using in-memory caching and deduplication.
 */
/* global fetch, URLSearchParams, console */
import { cachedRequest } from './apiCache';

const API_BASE_URL = '/api';

export async function loadWeather(params) {
  // Construct the full URL with the /api prefix so that Vite’s proxy can forward the request.
  const url = `${API_BASE_URL}/weather?${new URLSearchParams(params)}`;
  try {
    const response = await fetch(url);
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Unexpected response format');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    console.warn('Using simulated weather data due to API error');
    // Return simulated weather data as a fallback
    return {
      simulated: true,
      temperature: 25,
      condition: 'Sunny',
      windSpeed: 10
    };
  }
}
export const fetchWeatherData = loadWeather;

export async function getCachedWeather(params) {
  // Wrap the loadWeather call with caching via cachedRequest.
  return cachedRequest(() => loadWeather(params), `weather-${JSON.stringify(params)}`);
}
