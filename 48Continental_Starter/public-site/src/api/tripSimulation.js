/**
 * Trip Simulation Utilities
 * 
 * This module provides functions to generate simulated trip data
 * for testing and development of the 48 Continental USA application.
 */

/* eslint-env browser */

// Basic coordinates for each state (approximate center points)
const STATE_COORDINATES = {
  'AL': { lat: 32.806671, lng: -86.791130 },
  'AZ': { lat: 33.729759, lng: -111.431221 },
  'AR': { lat: 34.969704, lng: -92.373123 },
  'CA': { lat: 36.116203, lng: -119.681564 },
  'CO': { lat: 39.059811, lng: -105.311104 },
  'CT': { lat: 41.597782, lng: -72.755371 },
  'DE': { lat: 39.318523, lng: -75.507141 },
  'FL': { lat: 27.766279, lng: -81.686783 },
  'GA': { lat: 33.040619, lng: -83.643074 },
  'ID': { lat: 44.240459, lng: -114.478828 },
  'IL': { lat: 40.349457, lng: -88.986137 },
  'IN': { lat: 39.849426, lng: -86.258278 },
  'IA': { lat: 42.011539, lng: -93.210526 },
  'KS': { lat: 38.526600, lng: -96.726486 },
  'KY': { lat: 37.668140, lng: -84.670067 },
  'LA': { lat: 31.169546, lng: -91.867805 },
  'ME': { lat: 44.693947, lng: -69.381927 },
  'MD': { lat: 39.063946, lng: -76.802101 },
  'MA': { lat: 42.230171, lng: -71.530106 },
  'MI': { lat: 43.326618, lng: -84.536095 },
  'MN': { lat: 45.694454, lng: -93.900192 },
  'MS': { lat: 32.741646, lng: -89.678696 },
  'MO': { lat: 38.456085, lng: -92.288368 },
  'MT': { lat: 46.921925, lng: -110.454353 },
  'NE': { lat: 41.125370, lng: -98.268082 },
  'NV': { lat: 38.313515, lng: -117.055374 },
  'NH': { lat: 43.452492, lng: -71.563896 },
  'NJ': { lat: 40.298904, lng: -74.521011 },
  'NM': { lat: 34.840515, lng: -106.248482 },
  'NY': { lat: 42.165726, lng: -74.948051 },
  'NC': { lat: 35.630066, lng: -79.806419 },
  'ND': { lat: 47.528912, lng: -99.784012 },
  'OH': { lat: 40.388783, lng: -82.764915 },
  'OK': { lat: 35.565342, lng: -96.928917 },
  'OR': { lat: 44.572021, lng: -122.070938 },
  'PA': { lat: 40.590752, lng: -77.209755 },
  'RI': { lat: 41.680893, lng: -71.511780 },
  'SC': { lat: 33.856892, lng: -80.945007 },
  'SD': { lat: 44.299782, lng: -99.438828 },
  'TN': { lat: 35.747845, lng: -86.692345 },
  'TX': { lat: 31.054487, lng: -97.563461 },
  'UT': { lat: 40.150032, lng: -111.862434 },
  'VT': { lat: 44.045876, lng: -72.710686 },
  'VA': { lat: 37.769337, lng: -78.169968 },
  'WA': { lat: 47.400902, lng: -121.490494 },
  'WV': { lat: 38.491226, lng: -80.954453 },
  'WI': { lat: 44.268543, lng: -89.616508 },
  'WY': { lat: 42.755966, lng: -107.302490 }
};

// A selection of US states to simulate the journey through
const US_STATES = [
  { name: 'Washington', abbr: 'WA', visited: true },
  { name: 'Oregon', abbr: 'OR', visited: true },
  { name: 'California', abbr: 'CA', visited: true },
  { name: 'Nevada', abbr: 'NV', visited: true },
  { name: 'Idaho', abbr: 'ID', visited: true },
  { name: 'Montana', abbr: 'MT', visited: true },
  { name: 'Wyoming', abbr: 'WY', visited: true },
  { name: 'Utah', abbr: 'UT', visited: false },
  { name: 'Arizona', abbr: 'AZ', visited: false },
  { name: 'Colorado', abbr: 'CO', visited: false },
  { name: 'New Mexico', abbr: 'NM', visited: false },
  { name: 'Texas', abbr: 'TX', visited: false },
  { name: 'Oklahoma', abbr: 'OK', visited: false },
  { name: 'Kansas', abbr: 'KS', visited: false },
  { name: 'Nebraska', abbr: 'NE', visited: false },
  { name: 'South Dakota', abbr: 'SD', visited: false },
  { name: 'North Dakota', abbr: 'ND', visited: false },
  { name: 'Minnesota', abbr: 'MN', visited: false },
  { name: 'Iowa', abbr: 'IA', visited: false },
  { name: 'Missouri', abbr: 'MO', visited: false },
  { name: 'Arkansas', abbr: 'AR', visited: false },
  { name: 'Louisiana', abbr: 'LA', visited: false },
  { name: 'Mississippi', abbr: 'MS', visited: false },
  { name: 'Alabama', abbr: 'AL', visited: false },
  { name: 'Georgia', abbr: 'GA', visited: false },
  { name: 'Florida', abbr: 'FL', visited: false },
  { name: 'South Carolina', abbr: 'SC', visited: false },
  { name: 'North Carolina', abbr: 'NC', visited: false },
  { name: 'Tennessee', abbr: 'TN', visited: false },
  { name: 'Kentucky', abbr: 'KY', visited: false },
  { name: 'Virginia', abbr: 'VA', visited: false },
  { name: 'West Virginia', abbr: 'WV', visited: false },
  { name: 'Maryland', abbr: 'MD', visited: false },
  { name: 'Delaware', abbr: 'DE', visited: false },
  { name: 'Pennsylvania', abbr: 'PA', visited: false },
  { name: 'New Jersey', abbr: 'NJ', visited: false },
  { name: 'New York', abbr: 'NY', visited: false },
  { name: 'Connecticut', abbr: 'CT', visited: false },
  { name: 'Rhode Island', abbr: 'RI', visited: false },
  { name: 'Massachusetts', abbr: 'MA', visited: false },
  { name: 'Vermont', abbr: 'VT', visited: false },
  { name: 'New Hampshire', abbr: 'NH', visited: false },
  { name: 'Maine', abbr: 'ME', visited: false },
  { name: 'Ohio', abbr: 'OH', visited: false },
  { name: 'Michigan', abbr: 'MI', visited: false },
  { name: 'Indiana', abbr: 'IN', visited: false },
  { name: 'Illinois', abbr: 'IL', visited: false },
  { name: 'Wisconsin', abbr: 'WI', visited: false }
];

// Sample checkpoints for the trip
const CHECKPOINTS = [
  { id: 'cp1', name: 'Seattle, WA', completed: true, date: '2025-06-01' },
  { id: 'cp2', name: 'Portland, OR', completed: true, date: '2025-06-02' },
  { id: 'cp3', name: 'San Francisco, CA', completed: true, date: '2025-06-04' },
  { id: 'cp4', name: 'Los Angeles, CA', completed: false, date: '2025-06-06' },
  { id: 'cp5', name: 'Las Vegas, NV', completed: false, date: '2025-06-08' },
  { id: 'cp6', name: 'Salt Lake City, UT', completed: false, date: '2025-06-10' }
];

/**
 * Generate simulated trip data for testing
 * @returns {Object} Simulated trip data
 */
export function generateSimulatedTripData() {
  const visitedStates = US_STATES.filter(state => state.visited).map(state => state.abbr);
  const remainingStates = US_STATES.filter(state => !state.visited).map(state => state.abbr);
  
  return {
    name: '48 Continental USA Road Trip',
    description: 'A Tesla road trip across all 48 contiguous United States',
    startDate: '2025-06-01',
    endDate: '2025-08-01',
    currentState: 'CA',
    nextState: 'NV',
    totalMiles: 12500,
    milesDriven: 1250,
    milesRemaining: 11250,
    averageSpeed: 65,
    currentLocation: {
      latitude: 36.1699,
      longitude: -115.1398,
      city: 'San Francisco',
      state: 'CA'
    },
    nextStop: 'Los Angeles, CA',
    distanceToNext: 382,
    estimatedArrival: '2025-06-06T18:30:00',
    visitedStates,
    remainingStates,
    stateCoordinates: STATE_COORDINATES,
    checkpoints: CHECKPOINTS,
    stats: {
      superchargersVisited: 14,
      daysOnRoad: 3,
      statesVisited: visitedStates.length,
      statesRemaining: remainingStates.length,
      percentComplete: Math.round((visitedStates.length / 48) * 100),
      hoursOfDriving: 22,
      gallonsOfGasSaved: 85,
      co2Saved: 1650 // in pounds
    },
    route: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [-122.3321, 47.6062], // Seattle
              [-122.6765, 45.5152], // Portland
              [-122.4194, 37.7749], // San Francisco
              // More coordinates would be here in a real implementation
            ]
          },
          properties: {}
        }
      ]
    },
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Generate a random route path for testing
 * @param {number} numPoints - Number of points to generate
 * @returns {Array} Array of [lng, lat] coordinates
 */
export function generateRandomRoute(numPoints = 10) {
  // Base coordinates (somewhere in the US)
  const baseLat = 39.8283;
  const baseLng = -98.5795;
  
  const coordinates = [];
  for (let i = 0; i < numPoints; i++) {
    // Generate random offsets
    const latOffset = (Math.random() - 0.5) * 10;
    const lngOffset = (Math.random() - 0.5) * 20;
    
    coordinates.push([baseLng + lngOffset, baseLat + latOffset]);
  }
  
  return coordinates;
}
