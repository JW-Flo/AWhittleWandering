/**
 * API Handler Functions for A Whittle Wandering Edge Worker
 * Contains simulated data generation functions for vehicle, weather, trip, and charging data
 */

/**
 * Generate simulated vehicle data
 * @returns {Object} Simulated Tesla vehicle data
 */
export function generateSimulatedVehicleData() {
  const now = new Date();
  const timeOfDay = now.getHours();

  // Simulate current location: somewhere in Texas (from the screenshot)
  const baseLatitude = 27.741777; // Corpus Christi, TX
  const baseLongitude = -97.388844;

  // Add some random movement
  const latitude = baseLatitude + (Math.random() - 0.5) * 0.1;
  const longitude = baseLongitude + (Math.random() - 0.5) * 0.1;

  // Battery level varies throughout the day
  let batteryLevel;
  if (timeOfDay >= 6 && timeOfDay <= 8) {
    batteryLevel = 85 + Math.random() * 10; // Morning charge
  } else if (timeOfDay >= 12 && timeOfDay <= 14) {
    batteryLevel = 60 + Math.random() * 25; // Midday
  } else if (timeOfDay >= 18 && timeOfDay <= 22) {
    batteryLevel = 70 + Math.random() * 25; // Evening
  } else {
    batteryLevel = 30 + Math.random() * 40; // Night/early morning
  }

  // Speed varies by time of day
  let speed = 0;
  if (timeOfDay >= 7 && timeOfDay <= 19) {
    speed = 45 + Math.random() * 35; // 45-80 mph during day
  }

  const isCharging = batteryLevel < 40 && speed === 0;

  // Calculate power usage based on state
  let power = 0;
  if (isCharging) {
    power = -(50 + Math.random() * 150); // Negative when charging
  } else if (speed > 0) {
    power = 15 + Math.random() * 25; // Positive when driving
  }

  return {
    id: "wandering-whittle-tesla",
    name: "The Wandering Whittle",
    model: "Model Y Long Range",
    batteryLevel: Math.round(batteryLevel),
    range: Math.round(batteryLevel * 3.5),
    speed: Math.round(speed),
    power: power,
    charging: isCharging,
    location: {
      latitude: latitude,
      longitude: longitude,
      heading: Math.round(Math.random() * 360),
    },
    temperature: {
      inside: 72,
      outside: 68 + Math.round((Math.random() - 0.5) * 20),
    },
    climate: {
      enabled: true,
      temperature: 72,
    },
    locked: !isCharging && speed === 0,
    sentry_mode: speed === 0 && !isCharging,
    odometer: 15420 + Math.round(Math.random() * 100),
    last_updated: new Date().toISOString(),
  };
}

/**
 * Generate weather forecast
 * @returns {Array} Array of forecast objects
 */
export function generateWeatherForecast() {
  const forecast = [];
  for (let i = 0; i < 5; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    forecast.push({
      date: date.toISOString().split("T")[0],
      high: 70 + Math.round(Math.random() * 20),
      low: 50 + Math.round(Math.random() * 20),
      condition: ["clear", "clouds", "rain"][Math.floor(Math.random() * 3)],
      precipitation: Math.round(Math.random() * 100),
    });
  }
  return forecast;
}

/**
 * Generate simulated weather data
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Object} Simulated weather data
 */
export function generateSimulatedWeatherData(lat, lon) {
  const conditions = ["clear", "clouds", "rain", "snow", "thunderstorm"];
  const condition = conditions[Math.floor(Math.random() * conditions.length)];

  return {
    location: {
      latitude: lat,
      longitude: lon,
      city: "Current Location",
      state: "TX",
    },
    current: {
      temperature: 68 + Math.round((Math.random() - 0.5) * 30),
      condition: condition,
      humidity: 40 + Math.round(Math.random() * 40),
      wind_speed: Math.round(Math.random() * 20),
      wind_direction: Math.round(Math.random() * 360),
      visibility: 10,
      uv_index: Math.round(Math.random() * 10),
    },
    forecast: generateWeatherForecast(),
    last_updated: new Date().toISOString(),
  };
}

/**
 * Generate simulated trip data
 * @returns {Object} Simulated trip progress data
 */
export function generateSimulatedTripData() {
  return {
    trip_id: "wandering-whittle-2025",
    name: "The Wandering Whittle - 48 States Road Trip",
    start_date: "2025-06-01T00:00:00Z",
    end_date: "2025-08-01T23:59:59Z",
    current_state: "Texas",
    states_visited: [
      "California",
      "Nevada",
      "Utah",
      "Colorado",
      "New Mexico",
      "Texas",
    ],
    states_remaining: 42,
    total_distance: 15420,
    distance_remaining: 8000,
    progress_percentage: 35,
    next_destination: {
      city: "Austin",
      state: "Texas",
      arrival_estimate: "2025-06-28T15:00:00Z",
    },
    last_updated: new Date().toISOString(),
  };
}

/**
 * Generate simulated charging station data
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} radius - Search radius in miles
 * @returns {Object} Simulated charging station data
 */
export function generateSimulatedChargingData(lat, lon, radius) {
  const stations = [];
  const stationNames = [
    "Tesla Supercharger",
    "Electrify America",
    "ChargePoint",
    "EVgo",
    "Blink",
  ];

  for (let i = 0; i < 5; i++) {
    // Generate random locations within radius
    const randomLat = lat + (Math.random() - 0.5) * (radius / 69); // Rough conversion
    const randomLon = lon + (Math.random() - 0.5) * (radius / 69);

    stations.push({
      id: `station_${i + 1}`,
      name: stationNames[Math.floor(Math.random() * stationNames.length)],
      location: {
        latitude: randomLat,
        longitude: randomLon,
        address: `${Math.floor(Math.random() * 9999)} Main St, Anytown, TX`,
      },
      connectors: [
        {
          type: "Tesla Supercharger",
          power: 150 + Math.floor(Math.random() * 100),
          available: Math.floor(Math.random() * 8),
          total: 8,
        },
      ],
      distance: Math.round(Math.random() * radius),
      status: Math.random() > 0.1 ? "operational" : "maintenance",
    });
  }

  return {
    stations: stations,
    total_count: stations.length,
    search_radius: radius,
    center: { latitude: lat, longitude: lon },
    last_updated: new Date().toISOString(),
  };
}
