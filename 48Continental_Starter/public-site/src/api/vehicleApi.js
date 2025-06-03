/**
 * Vehicle API Handler
 * 
 * This module handles interactions with the vehicle API.
 */

/* eslint-env browser */

/**
 * Fetch current vehicle data
 * @returns {Promise<Object>} Vehicle data
 */
export const fetchVehicleData = async () => {
  try {
    const response = await fetch('/api/vehicle');
    
    if (!response.ok) {
      throw new Error(`Vehicle API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching vehicle data:', error);
    throw error;
  }
};

/**
 * Generate simulated vehicle data for testing
 * @returns {Object} Simulated vehicle data
 */
export const generateSimulatedVehicleData = () => {
  return {
    id: 'tesla_model_3_2025',
    name: 'Tesla Model 3',
    model: 'model3',
    year: 2025,
    latitude: 39.8283 + (Math.random() - 0.5) * 0.1,
    longitude: -98.5795 + (Math.random() - 0.5) * 0.1,
    batteryLevel: 70 + (Math.random() * 20),
    range: 250 + (Math.random() * 50),
    speed: Math.random() * 70,
    power: Math.random() * 40,
    temperature: {
      inside: 68 + (Math.random() * 10),
      outside: 65 + (Math.random() * 15)
    },
    charging: false,
    climate: {
      enabled: true,
      temperature: 72
    },
    locked: true,
    sentry_mode: true,
    windows_open: false,
    doors_open: false,
    tire_pressure: {
      front_left: 45 + (Math.random() * 3),
      front_right: 45 + (Math.random() * 3),
      rear_left: 45 + (Math.random() * 3),
      rear_right: 45 + (Math.random() * 3)
    },
    last_updated: new Date().toISOString()
  };
};
