/**
 * US State Coordinates for Geographic Calculations
 * Contains latitude and longitude coordinates for all US states
 */

export const STATE_COORDINATES = {
  'Oregon': { lat: 43.8041, lng: -120.5542 },
  'Washington': { lat: 47.7511, lng: -120.7401 },
  'Idaho': { lat: 44.0682, lng: -114.7420 },
  'Montana': { lat: 47.0527, lng: -109.6333 },
  'Wyoming': { lat: 43.0759, lng: -107.2903 },
  'Nebraska': { lat: 41.4925, lng: -99.9018 },
  'South Dakota': { lat: 43.9695, lng: -99.9018 },
  'North Dakota': { lat: 47.6201, lng: -100.5407 },
  'Minnesota': { lat: 46.3544, lng: -94.6859 },
  'Wisconsin': { lat: 43.7844, lng: -88.7879 },
  'Ohio': { lat: 40.2732, lng: -82.7937 },
  'Pennsylvania': { lat: 41.2033, lng: -77.1945 },
  'New York': { lat: 42.1657, lng: -74.9481 },
  'Vermont': { lat: 44.0459, lng: -72.7107 },
  'New Hampshire': { lat: 43.4525, lng: -71.5639 },
  'Massachusetts': { lat: 42.2352, lng: -71.0275 },
  'Connecticut': { lat: 41.5978, lng: -72.7554 },
  'Rhode Island': { lat: 41.6809, lng: -71.5118 }
};

/**
 * Get coordinates for a given state
 * @param {string} state - State name
 * @returns {Object|null} Coordinates object with lat/lng or null if not found
 */
export function getCoordinatesForState(state) {
  return STATE_COORDINATES[state] || { lat: 39.8283, lng: -98.5795 }; // US center as fallback
}
