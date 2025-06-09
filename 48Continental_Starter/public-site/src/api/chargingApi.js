/**
 * Charging Stations API Utilities
 * 
 * This module provides functions to generate simulated charging station data
 * for testing and development of the The Wandering Whittle application.
 */

/* eslint-env browser */

// Fixed list of Tesla Supercharger locations for simulation
const SIMULATED_SUPERCHARGERS = [
  { id: 'sc1', name: 'San Francisco Supercharger', latitude: 37.7749, longitude: -122.4194, stalls: 12, available: 5 },
  { id: 'sc2', name: 'Los Angeles Supercharger', latitude: 34.0522, longitude: -118.2437, stalls: 20, available: 7 },
  { id: 'sc3', name: 'Las Vegas Supercharger', latitude: 36.1699, longitude: -115.1398, stalls: 24, available: 10 },
  { id: 'sc4', name: 'Phoenix Supercharger', latitude: 33.4484, longitude: -112.0740, stalls: 16, available: 3 },
  { id: 'sc5', name: 'Salt Lake City Supercharger', latitude: 40.7608, longitude: -111.8910, stalls: 12, available: 8 },
  { id: 'sc6', name: 'Denver Supercharger', latitude: 39.7392, longitude: -104.9903, stalls: 18, available: 6 },
  { id: 'sc7', name: 'Dallas Supercharger', latitude: 32.7767, longitude: -96.7970, stalls: 20, available: 9 },
  { id: 'sc8', name: 'Houston Supercharger', latitude: 29.7604, longitude: -95.3698, stalls: 16, available: 5 },
  { id: 'sc9', name: 'Chicago Supercharger', latitude: 41.8781, longitude: -87.6298, stalls: 24, available: 7 },
  { id: 'sc10', name: 'New York Supercharger', latitude: 40.7128, longitude: -74.0060, stalls: 30, available: 2 },
  { id: 'sc11', name: 'Miami Supercharger', latitude: 25.7617, longitude: -80.1918, stalls: 16, available: 11 },
  { id: 'sc12', name: 'Seattle Supercharger', latitude: 47.6062, longitude: -122.3321, stalls: 14, available: 8 },
  { id: 'sc13', name: 'Portland Supercharger', latitude: 45.5051, longitude: -122.6750, stalls: 12, available: 6 },
  { id: 'sc14', name: 'Boston Supercharger', latitude: 42.3601, longitude: -71.0589, stalls: 20, available: 9 },
  { id: 'sc15', name: 'Atlanta Supercharger', latitude: 33.7490, longitude: -84.3880, stalls: 18, available: 4 }
];

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in miles
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Generate simulated charging station data for testing
 * @param {number} latitude - Center latitude for search
 * @param {number} longitude - Center longitude for search
 * @param {number} radius - Search radius in miles
 * @returns {Object} Simulated charging stations data
 */
export function generateSimulatedChargingStations(latitude = 37.7749, longitude = -122.4194, radius = 50) {
  // Filter stations within the specified radius
  const nearbyStations = SIMULATED_SUPERCHARGERS.map(station => {
    const distance = calculateDistance(latitude, longitude, station.latitude, station.longitude);
    return {
      ...station,
      distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
      available: Math.floor(Math.random() * (station.stalls + 1)), // Randomize availability each time
      inRange: distance <= radius
    };
  }).filter(station => station.inRange);
  
  // Sort by distance
  nearbyStations.sort((a, b) => a.distance - b.distance);
  
  return {
    latitude,
    longitude,
    radius,
    stations: nearbyStations,
    total: nearbyStations.length,
    available: nearbyStations.reduce((count, station) => count + station.available, 0),
    last_updated: new Date().toISOString()
  };
}

/**
 * Fetch charging stations data from the API
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Charging stations data
 */
export const fetchChargingStations = async (options = {}) => {
  try {
    // Build query string with parameters
    const params = new URLSearchParams();
    if (options.latitude) params.append('lat', options.latitude);
    if (options.longitude) params.append('lon', options.longitude);
    if (options.radius) params.append('radius', options.radius);
    
    const url = `/api/charging${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Charging API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching charging stations data:', error);
    throw error;
  }
};
