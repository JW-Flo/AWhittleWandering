/**
 * Vehicle Simulation Utilities
 * 
 * This module provides functions to generate simulated Tesla vehicle data
 * for testing and development of the 48 Continental USA application.
 */

/* eslint-env browser */

/**
 * Generate simulated Tesla vehicle data for testing
 * @returns {Object} Simulated vehicle data
 */
export function generateSimulatedVehicleData() {
  // Generate a random battery level between 30% and 90%
  const batteryLevel = Math.random() * 60 + 30;
  
  // Calculate range based on battery level (roughly 300 miles at 100%)
  const range = (batteryLevel / 100) * 300;
  
  // Random speed between 0 and 75 mph
  const speed = Math.random() * 75;
  
  // Random power usage between -50 (regenerating) and 50 (using) kW
  const power = (Math.random() * 100) - 50;
  
  // Temperature data
  const insideTemp = Math.round(70 + (Math.random() * 10 - 5));
  const outsideTemp = Math.round(60 + (Math.random() * 30 - 15));
  
  // Randomly determine if charging (20% chance)
  const isCharging = Math.random() < 0.2;
  
  // Randomly determine if climate is on (50% chance)
  const climateOn = Math.random() < 0.5;
  
  // Current location (somewhere in California for testing)
  const lat = 37.7749 + (Math.random() * 2 - 1);
  const lng = -122.4194 + (Math.random() * 2 - 1);
  
  // Random tire pressure between 40 and 45 PSI
  const tireFL = 40 + (Math.random() * 5);
  const tireFR = 40 + (Math.random() * 5);
  const tireRL = 40 + (Math.random() * 5);
  const tireRR = 40 + (Math.random() * 5);
  
  return {
    id: 'tesla_model_3_12345',
    name: 'Model 3 Long Range',
    batteryLevel,
    range,
    speed,
    power,
    temperature: {
      inside: insideTemp,
      outside: outsideTemp
    },
    charging: isCharging ? {
      state: 'Charging',
      chargeRate: Math.round(Math.random() * 150) + 50, // kW
      timeToFull: Math.round(((100 - batteryLevel) / 100) * 60) // minutes
    } : null,
    climate: {
      enabled: climateOn,
      temperature: 72
    },
    locked: Math.random() < 0.8, // 80% chance of being locked
    sentry_mode: Math.random() < 0.7, // 70% chance of sentry mode on
    tire_pressure: {
      front_left: tireFL,
      front_right: tireFR,
      rear_left: tireRL,
      rear_right: tireRR
    },
    location: {
      latitude: lat,
      longitude: lng,
      heading: Math.random() * 360,
      speed: speed
    },
    last_updated: new Date().toISOString()
  };
}
