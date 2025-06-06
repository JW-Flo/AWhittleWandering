/* eslint-disable */
/**
 * Tessie API Client
 *
 * This service handles communication with the Tessie API to retrieve real-time
 * Tesla vehicle data. This is a placeholder implementation that will be expanded
 * when actual Tessie API integration is implemented.
 *
 * Tessie API documentation: https://developer.tessie.com/
 */

// Default endpoint for Tessie API
const TESSIE_API_BASE_URL = "https://api.tessie.com/";

// Get Tessie API token from environment variables
const getApiToken = () => {
  return import.meta.env.VITE_TESSIE_TOKEN || null;
};

/**
 * Get current vehicle data from Tessie API
 * @returns {Promise} Promise that resolves to vehicle data
 */
export const getVehicleData = async () => {
  const token = getApiToken();

  if (!token) {
    throw new Error(
      "Tessie API token is not configured. Please set VITE_TESSIE_TOKEN in .env file."
    );
  }

  try {
    // This is a placeholder - in a real implementation, we would fetch data from Tessie API
    // For now, we'll return a mocked vehicle response

    // In actual implementation:
    // const response = await fetch(`${TESSIE_API_BASE_URL}/vehicles/state`, {
    //   headers: {
    //     'Authorization': `Bearer ${token}`,
    //     'Content-Type': 'application/json'
    //   }
    // });
    // if (!response.ok) throw new Error(`Tessie API error: ${response.status} ${response.statusText}`);
    // return await response.json();

    return {
      vehicle_data: {
        id: "real123456789",
        display_name: "Model Y",
        state: "online",
        latitude: 37.7749, // San Francisco default
        longitude: -122.4194,
        heading: 90,
        speed: 65,
        power: 20,
        battery_level: 70,
        battery_range: 220,
        charging_state: "Disconnected",
        timestamp: Date.now(),
        temperature: 72,
        climate_on: false,
        locked: true,
        sentry_mode: true,
        odometer: 15420,
      },
    };
  } catch (error) {
    console.error("Error fetching vehicle data from Tessie:", error);
    throw error;
  }
};

/**
 * Create a WebSocket connection to Tessie for real-time updates
 * @param {Function} callback Function to call with updated data
 * @returns {Object} WebSocket connection object
 */
export const createWebSocketConnection = (callback) => {
  const token = getApiToken();

  if (!token) {
    throw new Error(
      "Tessie API token is not configured. Please set VITE_TESSIE_TOKEN in .env file."
    );
  }

  // This is a placeholder - in a real implementation, we would establish a WebSocket connection
  console.log("Creating WebSocket connection to Tessie API...");

  // Mock implementation - generate a random update every few seconds
  const intervalId = setInterval(() => {
    const mockData = {
      vehicle_data: {
        id: "real123456789",
        display_name: "Model Y",
        state: "online",
        latitude: 37.7749 + (Math.random() - 0.5) * 0.01,
        longitude: -122.4194 + (Math.random() - 0.5) * 0.01,
        heading: Math.floor(Math.random() * 360),
        speed: Math.floor(Math.random() * 75),
        power: Math.floor(Math.random() * 30),
        battery_level: Math.max(
          0,
          Math.min(100, 70 + Math.floor((Math.random() - 0.3) * 10))
        ),
        battery_range: 0, // Will be calculated based on battery level
        charging_state: Math.random() > 0.9 ? "Charging" : "Disconnected",
        timestamp: Date.now(),
        temperature: 70 + Math.floor(Math.random() * 10),
        climate_on: Math.random() > 0.7,
        locked: true,
        sentry_mode: true,
        odometer: 15420 + Math.floor(Math.random() * 10),
      },
    };

    // Calculate battery range based on level
    mockData.vehicle_data.battery_range =
      mockData.vehicle_data.battery_level * 3.5;

    callback(mockData);
  }, 3000);

  // Return a mock WebSocket object with a close method
  return {
    close: () => {
      clearInterval(intervalId);
      console.log("Closing WebSocket connection to Tessie API");
    },
  };
};

/**
 * Wake up the vehicle
 * @returns {Promise} Promise that resolves when the wake command is sent
 */
export const wakeVehicle = async () => {
  const token = getApiToken();

  if (!token) {
    throw new Error(
      "Tessie API token is not configured. Please set VITE_TESSIE_TOKEN in .env file."
    );
  }

  console.log("Sending wake command to vehicle...");

  // This is a placeholder - in a real implementation, we would send a wake command to the Tessie API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: "Vehicle wake command sent" });
    }, 2000);
  });
};

/**
 * Check if the Tessie API is properly configured
 * @returns {boolean} True if Tessie API is configured, false otherwise
 */
export const isTessieConfigured = () => {
  return !!getApiToken();
};
