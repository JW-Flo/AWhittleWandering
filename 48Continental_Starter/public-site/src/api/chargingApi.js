/**
 * Charging API Handler
 * 
 * This module handles interactions with the charging stations API.
 */

/* eslint-env browser */

/**
 * Fetch charging stations
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} radius - Search radius in miles
 * @returns {Promise<Object>} Charging stations data
 */
export const fetchChargingStations = async (lat, lon, radius = 50) => {
  try {
    const params = new URLSearchParams();
    if (lat && lon) {
      params.append('lat', lat);
      params.append('lon', lon);
    }
    params.append('radius', radius);
    
    const response = await fetch(`/api/charging?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Charging stations API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching charging stations:', error);
    throw error;
  }
};

/**
 * Generate simulated charging stations data for testing
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} radius - Search radius in miles
 * @returns {Object} Simulated charging stations data
 */
export const generateSimulatedChargingStations = (lat = 39.8283, lon = -98.5795, radius = 50) => {
  const stations = [];
  const count = 10 + Math.floor(Math.random() * 15); // 10-25 stations
  
  for (let i = 0; i < count; i++) {
    // Random position within radius
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;
    
    // Convert to lat/lon (approximate)
    const latOffset = distance * Math.cos(angle) * 0.01;
    const lonOffset = distance * Math.sin(angle) * 0.01;
    
    const stationLat = lat + latOffset;
    const stationLon = lon + lonOffset;
    
    // Random charging station type
    const stationTypes = ['Tesla Supercharger', 'CCS Fast Charger', 'CHAdeMO Fast Charger', 'Level 2 Charger'];
    const stationType = stationTypes[Math.floor(Math.random() * stationTypes.length)];
    
    // Random connector type based on station type
    let connectorType;
    if (stationType.includes('Tesla')) {
      connectorType = 'Tesla';
    } else if (stationType.includes('CCS')) {
      connectorType = 'CCS';
    } else if (stationType.includes('CHAdeMO')) {
      connectorType = 'CHAdeMO';
    } else {
      connectorType = 'J1772';
    }
    
    // Create station in the format expected by the Map component
    stations.push({
      id: `station-${i}`,
      name: `${stationType} ${i+1}`,
      latitude: stationLat,
      longitude: stationLon,
      available: Math.random() > 0.2,
      power: 50 + Math.floor(Math.random() * 200),
      connectorType: connectorType,
      description: `${Math.floor(Math.random() * 1000)} Main St, City ${i+1}`,
      amenities: ['Restrooms', 'Food', 'Shopping', 'WiFi'].filter(() => Math.random() > 0.5).join(', '),
      distanceFromRoute: Math.random() * 15,
      pricing: `$${(0.25 + Math.random() * 0.15).toFixed(2)}/kWh`
    });
  }
  
  return { 
    stations, 
    radius,
    lastUpdated: new Date().toISOString()
  };
};
