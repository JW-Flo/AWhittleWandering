/* eslint-disable */
/**
 * Mock Vehicle Data Service
 *
 * Provides simulated Tesla vehicle data for testing the LiveVehicleMap component
 * without requiring a real Tesla API connection.
 */

// Configuration for the mock data simulation
let simulationConfig = {
  followPath: null, // Array of {latitude, longitude} points to follow
  pathIndex: 0, // Current index in the path
  moving: true, // Whether the vehicle is currently moving
  speed: 65, // Speed in mph
  updateInterval: 2000, // Milliseconds between updates
  batteryDrainRate: 0.01, // Battery percentage drained per update
  batteryChargeRate: 0.1, // Battery percentage charged per update when at a charging station
  intervalId: null, // Reference to the interval timer
  randomMovement: true, // Use random movement when no path is provided
  listeners: [], // Callbacks for data updates
};

// Initial mock vehicle data
let mockVehicleData = {
  vehicle_data: {
    id: "mock123456789",
    display_name: "Model Y",
    state: "online",
    latitude: 37.7749, // San Francisco default
    longitude: -122.4194,
    heading: 90, // East
    speed: 0,
    power: 0,
    battery_level: 70,
    battery_range: 220,
    charging_state: "Disconnected",
    timestamp: Date.now(),
    temperature: 72,
    climate_on: false,
    locked: true,
    sentry_mode: false,
    odometer: 15420,
  },
};

/**
 * Get the current mock vehicle data
 * @returns {Promise} Promise that resolves to the mock vehicle data
 */
export const getMockVehicleData = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ ...mockVehicleData });
    }, 100); // Simulate slight network delay
  });
};

/**
 * Start vehicle simulation with the given config
 * @param {Object} config Configuration for the simulation
 */
export const startMockVehicleSimulation = (config = {}) => {
  // Update config with provided values
  simulationConfig = {
    ...simulationConfig,
    ...config,
  };

  // If we already have an interval running, clear it
  if (simulationConfig.intervalId) {
    clearInterval(simulationConfig.intervalId);
  }

  // Start the simulation
  simulationConfig.intervalId = setInterval(
    updateMockVehicleData,
    simulationConfig.updateInterval
  );
};

/**
 * Stop the current vehicle simulation
 */
export const stopMockVehicleSimulation = () => {
  if (simulationConfig.intervalId) {
    clearInterval(simulationConfig.intervalId);
    simulationConfig.intervalId = null;
  }
};

/**
 * Create a mock WebSocket connection that emits vehicle data
 * @param {Function} callback Function to call with updated data
 * @returns {Object} Mock WebSocket object
 */
export const createMockWebSocket = (callback) => {
  // Add callback to listeners
  simulationConfig.listeners.push(callback);

  // Create a mock WebSocket object
  return {
    close: () => {
      // Remove this callback from listeners
      simulationConfig.listeners = simulationConfig.listeners.filter(
        (listener) => listener !== callback
      );
    },
  };
};

/**
 * Update the mock vehicle data based on simulation settings
 */
function updateMockVehicleData() {
  const data = mockVehicleData.vehicle_data;

  // Update timestamp
  data.timestamp = Date.now();

  // Update position based on path or random movement
  if (simulationConfig.moving) {
    if (simulationConfig.followPath && simulationConfig.followPath.length > 0) {
      // Follow the predefined path
      moveAlongPath();
    } else if (simulationConfig.randomMovement) {
      // Move randomly
      moveRandomly();
    }
  }

  // Update battery level
  if (data.charging_state === "Charging") {
    // Charge the battery
    data.battery_level = Math.min(
      100,
      data.battery_level + simulationConfig.batteryChargeRate
    );

    // If fully charged, stop charging
    if (data.battery_level >= 100) {
      data.charging_state = "Disconnected";
    }
  } else if (simulationConfig.moving) {
    // Drain the battery when moving
    data.battery_level = Math.max(
      0,
      data.battery_level - simulationConfig.batteryDrainRate
    );

    // If battery is too low, stop moving
    if (data.battery_level < 5) {
      simulationConfig.moving = false;
      data.speed = 0;
    }
  }

  // Update battery range based on level (rough approximation)
  data.battery_range = data.battery_level * 3.5; // ~350 miles at 100%

  // Notify all listeners
  simulationConfig.listeners.forEach((callback) => {
    callback({ ...mockVehicleData });
  });
}

/**
 * Move the vehicle along the predefined path
 */
function moveAlongPath() {
  const data = mockVehicleData.vehicle_data;
  const path = simulationConfig.followPath;

  if (!path || path.length === 0) return;

  // Get current and next points
  const currentIndex = simulationConfig.pathIndex;
  const nextIndex = (currentIndex + 1) % path.length;

  const current = path[currentIndex];
  const next = path[nextIndex];

  // Calculate heading between points
  const heading = calculateHeading(
    current.latitude,
    current.longitude,
    next.latitude,
    next.longitude
  );

  // Move towards the next point
  const distance = calculateDistance(
    current.latitude,
    current.longitude,
    next.latitude,
    next.longitude
  );

  // If we're close to the next point, move to it and advance the index
  if (distance < 0.0005) {
    // About 50 meters
    data.latitude = next.latitude;
    data.longitude = next.longitude;
    simulationConfig.pathIndex = nextIndex;

    // If we've completed the path, possibly stop or change direction
    if (nextIndex === 0) {
      // Reached the end of the path
      simulationConfig.moving = Math.random() > 0.5; // 50% chance to stop at the end

      // Sometimes start charging at the end of a journey
      if (!simulationConfig.moving && Math.random() > 0.7) {
        data.charging_state = "Charging";
      }
    }
  } else {
    // Move towards the next point
    const moveFactor = 0.0002; // How far to move each update
    const latDiff = next.latitude - data.latitude;
    const lngDiff = next.longitude - data.longitude;

    data.latitude += latDiff * moveFactor;
    data.longitude += lngDiff * moveFactor;
  }

  // Update heading and speed
  data.heading = heading;
  data.speed = simulationConfig.moving ? simulationConfig.speed : 0;
}

/**
 * Move the vehicle randomly
 */
function moveRandomly() {
  const data = mockVehicleData.vehicle_data;

  // Random direction change occasionally
  if (Math.random() > 0.9) {
    data.heading = Math.floor(Math.random() * 360);
  }

  // Random speed changes
  if (Math.random() > 0.9) {
    simulationConfig.speed = Math.floor(Math.random() * 70) + 20;
  }

  // Move in the current heading direction
  const moveFactor = 0.0001; // How far to move each update
  data.latitude += Math.cos(((90 - data.heading) * Math.PI) / 180) * moveFactor;
  data.longitude +=
    Math.sin(((90 - data.heading) * Math.PI) / 180) * moveFactor;

  // Random charging stops
  if (Math.random() > 0.995 && data.charging_state !== "Charging") {
    simulationConfig.moving = false;
    data.speed = 0;
    data.charging_state = "Charging";
  } else if (
    data.charging_state === "Charging" &&
    Math.random() > 0.9 &&
    data.battery_level > 80
  ) {
    // Stop charging and continue moving
    data.charging_state = "Disconnected";
    simulationConfig.moving = true;
  }

  data.speed = simulationConfig.moving ? simulationConfig.speed : 0;
}

/**
 * Calculate heading between two points
 * @param {number} lat1 Starting latitude
 * @param {number} lon1 Starting longitude
 * @param {number} lat2 Ending latitude
 * @param {number} lon2 Ending longitude
 * @returns {number} Heading in degrees (0-360)
 */
function calculateHeading(lat1, lon1, lat2, lon2) {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  lat1 = (lat1 * Math.PI) / 180;
  lat2 = (lat2 * Math.PI) / 180;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  let heading = (Math.atan2(y, x) * 180) / Math.PI;

  // Normalize to 0-360
  heading = (heading + 360) % 360;

  return heading;
}

/**
 * Calculate distance between two points using the Haversine formula
 * @param {number} lat1 Starting latitude
 * @param {number} lon1 Starting longitude
 * @param {number} lat2 Ending latitude
 * @param {number} lon2 Ending longitude
 * @returns {number} Distance in degrees (multiply by 111.32 for km)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km

  return distance / 111.32; // Convert to degrees
}
