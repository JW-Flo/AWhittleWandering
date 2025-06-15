/**
 * Validation utilities for vehicle telemetry data
 *
 * @module validators
 */

/**
 * Validates a telemetry packet to ensure it contains all required fields
 * and that values are within expected ranges
 *
 * @param {import('../services/VehicleTelemetryService').TelemetryPacket} packet - The telemetry packet to validate
 * @returns {boolean} True if the packet is valid, false otherwise
 */
export function validateTelemetryPacket(packet) {
  try {
    // Check for required fields
    if (!packet || typeof packet !== "object") {
      console.error("Invalid packet: must be an object");
      return false;
    }

    // Check vehicle ID
    if (!packet.vehicleId || typeof packet.vehicleId !== "string") {
      console.error("Invalid packet: missing or invalid vehicleId");
      return false;
    }

    // Check timestamp
    if (
      !packet.timestamp ||
      typeof packet.timestamp !== "number" ||
      packet.timestamp <= 0
    ) {
      console.error("Invalid packet: missing or invalid timestamp");
      return false;
    }

    // Ensure timestamp is not in the future (with 1 minute allowance for clock skew)
    const maxAllowedTime = Date.now() + 60000; // current time + 1 minute
    if (packet.timestamp > maxAllowedTime) {
      console.error("Invalid packet: timestamp is in the future");
      return false;
    }

    // Check position
    if (!validatePosition(packet.position)) {
      return false;
    }

    // Check metrics
    if (!validateMetrics(packet.metrics)) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error validating telemetry packet:", error);
    return false;
  }
}

/**
 * Validates the position object within a telemetry packet
 *
 * @param {Object} position - The position object to validate
 * @param {number} position.lat - Latitude coordinate
 * @param {number} position.lng - Longitude coordinate
 * @param {number} [position.accuracy] - Position accuracy in meters (if available)
 * @returns {boolean} True if the position is valid, false otherwise
 */
function validatePosition(position) {
  if (!position || typeof position !== "object") {
    console.error("Invalid position: must be an object");
    return false;
  }

  // Check latitude
  if (
    position.lat === undefined ||
    position.lat === null ||
    typeof position.lat !== "number" ||
    position.lat < -90 ||
    position.lat > 90
  ) {
    console.error("Invalid position: latitude must be between -90 and 90");
    return false;
  }

  // Check longitude
  if (
    position.lng === undefined ||
    position.lng === null ||
    typeof position.lng !== "number" ||
    position.lng < -180 ||
    position.lng > 180
  ) {
    console.error("Invalid position: longitude must be between -180 and 180");
    return false;
  }

  // Check accuracy if provided
  if (
    position.accuracy !== undefined &&
    (typeof position.accuracy !== "number" || position.accuracy <= 0)
  ) {
    console.error("Invalid position: accuracy must be a positive number");
    return false;
  }

  // Ensure position is within the continental United States
  if (!isWithinContinentalUS(position.lat, position.lng)) {
    console.warn("Warning: Position is outside the continental United States");
    // Not returning false here as we want to allow some margin for GPS errors
  }

  return true;
}

/**
 * Validates the metrics object within a telemetry packet
 *
 * @param {Object} metrics - The metrics object to validate
 * @param {number} metrics.batteryLevel - Current battery level percentage
 * @param {number} metrics.speed - Current speed in mph
 * @param {number} metrics.temperature - Current cabin temperature in °F
 * @returns {boolean} True if the metrics are valid, false otherwise
 */
function validateMetrics(metrics) {
  if (!metrics || typeof metrics !== "object") {
    console.error("Invalid metrics: must be an object");
    return false;
  }

  // Check battery level
  if (
    metrics.batteryLevel === undefined ||
    typeof metrics.batteryLevel !== "number" ||
    metrics.batteryLevel < 0 ||
    metrics.batteryLevel > 100
  ) {
    console.error("Invalid metrics: batteryLevel must be between 0 and 100");
    return false;
  }

  // Check speed
  if (
    metrics.speed === undefined ||
    typeof metrics.speed !== "number" ||
    metrics.speed < 0
  ) {
    console.error("Invalid metrics: speed must be a non-negative number");
    return false;
  }

  // Allow reasonable maximum speed (200 mph is well beyond Tesla's capabilities)
  if (metrics.speed > 200) {
    console.error("Invalid metrics: speed exceeds maximum reasonable value");
    return false;
  }

  // Check temperature
  if (
    metrics.temperature === undefined ||
    typeof metrics.temperature !== "number"
  ) {
    console.error("Invalid metrics: temperature must be a number");
    return false;
  }

  // Allow reasonable temperature range for a car interior (-20°F to 140°F)
  if (metrics.temperature < -20 || metrics.temperature > 140) {
    console.warn("Warning: Temperature is outside the normal range");
    // Not treating this as an error since extreme temperatures are possible
  }

  return true;
}

/**
 * Checks if coordinates are within the rough boundaries of the continental United States
 *
 * @param {number} lat - Latitude coordinate
 * @param {number} lng - Longitude coordinate
 * @returns {boolean} True if the coordinates are within the continental US
 */
export function isWithinContinentalUS(lat, lng) {
  // Rough boundaries of the continental US
  // This is an approximation and may need refinement
  const bounds = {
    north: 49.384358, // Northern border with Canada
    south: 24.396308, // Southern tip of Florida
    east: -66.93457, // Eastern tip of Maine
    west: -124.848974, // Western coast of Washington/Oregon/California
  };

  return (
    lat <= bounds.north &&
    lat >= bounds.south &&
    lng >= bounds.west &&
    lng <= bounds.east
  );
}

/**
 * Calculates the distance between two coordinates in kilometers
 * using the Haversine formula
 *
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Validates that a new telemetry point is physically possible given the
 * time elapsed and maximum speed capabilities of the vehicle
 *
 * @param {Object} prevPosition - Previous position
 * @param {number} prevPosition.lat - Previous latitude
 * @param {number} prevPosition.lng - Previous longitude
 * @param {number} prevTimestamp - Previous timestamp in milliseconds
 * @param {Object} newPosition - New position
 * @param {number} newPosition.lat - New latitude
 * @param {number} newPosition.lng - New longitude
 * @param {number} newTimestamp - New timestamp in milliseconds
 * @param {number} [maxSpeedKph=200] - Maximum possible speed in kilometers per hour
 * @returns {boolean} True if the movement is physically possible
 */
export function validateMovement(
  prevPosition,
  prevTimestamp,
  newPosition,
  newTimestamp,
  maxSpeedKph = 200
) {
  // Calculate time elapsed in hours
  const timeElapsedMs = newTimestamp - prevTimestamp;

  // Ignore if timestamps are invalid or newTimestamp is earlier
  if (timeElapsedMs <= 0) {
    return false;
  }

  const timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);

  // Calculate distance traveled in kilometers
  const distanceKm = calculateDistance(
    prevPosition.lat,
    prevPosition.lng,
    newPosition.lat,
    newPosition.lng
  );

  // Calculate speed in kph
  const speedKph = distanceKm / timeElapsedHours;

  // Check if speed is within maximum possible speed
  return speedKph <= maxSpeedKph;
}

/**
 * Converts degrees to radians
 *
 * @private
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}
