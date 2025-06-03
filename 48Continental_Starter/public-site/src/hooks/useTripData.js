/**
 * Trip Data Hook
 * 
 * This hook provides access to trip-related data including the route,
 * visited states, and overall progress for the 48 Continental USA journey.
 */

/* eslint-env browser */
import { useState, useEffect, useCallback } from 'react';

// Default polling interval in milliseconds
const DEFAULT_POLL_INTERVAL = 600000; // 10 minutes

/**
 * Hook for accessing trip data
 * @param {Object} options - Configuration options
 * @param {number} options.pollInterval - Data refresh interval in ms
 * @returns {Object} Trip data, loading state, and error
 */
export const useTripData = (options = {}) => {
  const {
    pollInterval = DEFAULT_POLL_INTERVAL
  } = options;
  
  // State for trip data
  const [tripData, setTripData] = useState(null);
  const [tripLoading, setTripLoading] = useState(true);
  const [tripError, setTripError] = useState(null);
  
  // Function to fetch trip data from API
  const fetchTripData = useCallback(async () => {
    setTripLoading(true);
    
    try {
      // In a real implementation, this would call your trip API service
      // For now, using simulated data for the prototype
      const response = await fetch('/api/trip');
      
      if (!response.ok) {
        throw new Error(`Trip API error: ${response.status}`);
      }
      
      const data = await response.json();
      setTripData(data);
      setTripError(null);
    } catch (error) {
      console.error('Error fetching trip data:', error);
      setTripError(error.message);
      
      // If we don't have data yet, use simulated data
      if (!tripData) {
        setTripData(generateSimulatedTripData());
      }
    } finally {
      setTripLoading(false);
    }
  }, [tripData]);
  
  // Initial data fetch and polling setup
  useEffect(() => {
    fetchTripData();
    
    // Set up polling
    const pollTimer = setInterval(fetchTripData, pollInterval);
    
    return () => {
      clearInterval(pollTimer);
    };
  }, [fetchTripData, pollInterval]);
  
  return { 
    tripData, 
    tripLoading, 
    tripError,
    refreshTripData: fetchTripData
  };
};

/**
 * Generate simulated trip data for testing
 * @returns {Object} Simulated trip data
 */
function generateSimulatedTripData() {
  // Generate state coordinates (approximate centers)
  const stateCoordinates = {
    'Alabama': { latitude: 32.7794, longitude: -86.8287 },
    'Arizona': { latitude: 34.2744, longitude: -111.6602 },
    'Arkansas': { latitude: 34.8938, longitude: -92.4426 },
    'California': { latitude: 37.1841, longitude: -119.4696 },
    'Colorado': { latitude: 38.9972, longitude: -105.5478 },
    'Connecticut': { latitude: 41.6219, longitude: -72.7273 },
    'Delaware': { latitude: 38.9896, longitude: -75.5050 },
    'Florida': { latitude: 28.6305, longitude: -82.4497 },
    'Georgia': { latitude: 32.6415, longitude: -83.4426 },
    'Idaho': { latitude: 44.3509, longitude: -114.6130 },
    'Illinois': { latitude: 40.0417, longitude: -89.1965 },
    'Indiana': { latitude: 39.8942, longitude: -86.2816 },
    'Iowa': { latitude: 42.0751, longitude: -93.4960 },
    'Kansas': { latitude: 38.4937, longitude: -98.3804 },
    'Kentucky': { latitude: 37.5347, longitude: -85.3021 },
    'Louisiana': { latitude: 31.0689, longitude: -91.9968 },
    'Maine': { latitude: 45.3695, longitude: -69.2428 },
    'Maryland': { latitude: 39.0550, longitude: -76.7909 },
    'Massachusetts': { latitude: 42.2596, longitude: -71.8083 },
    'Michigan': { latitude: 44.3467, longitude: -85.4102 },
    'Minnesota': { latitude: 46.2807, longitude: -94.3053 },
    'Mississippi': { latitude: 32.7364, longitude: -89.6678 },
    'Missouri': { latitude: 38.3566, longitude: -92.4580 },
    'Montana': { latitude: 47.0527, longitude: -109.6333 },
    'Nebraska': { latitude: 41.5378, longitude: -99.7951 },
    'Nevada': { latitude: 39.3289, longitude: -116.6312 },
    'New Hampshire': { latitude: 43.6805, longitude: -71.5811 },
    'New Jersey': { latitude: 40.1907, longitude: -74.6728 },
    'New Mexico': { latitude: 34.4071, longitude: -106.1126 },
    'New York': { latitude: 42.9538, longitude: -75.5268 },
    'North Carolina': { latitude: 35.5557, longitude: -79.3877 },
    'North Dakota': { latitude: 47.4501, longitude: -100.4659 },
    'Ohio': { latitude: 40.2862, longitude: -82.7937 },
    'Oklahoma': { latitude: 35.5889, longitude: -97.4943 },
    'Oregon': { latitude: 43.9336, longitude: -120.5583 },
    'Pennsylvania': { latitude: 40.8781, longitude: -77.7996 },
    'Rhode Island': { latitude: 41.6762, longitude: -71.5562 },
    'South Carolina': { latitude: 33.9169, longitude: -80.8964 },
    'South Dakota': { latitude: 44.4443, longitude: -100.2263 },
    'Tennessee': { latitude: 35.8580, longitude: -86.3505 },
    'Texas': { latitude: 31.4757, longitude: -99.3312 },
    'Utah': { latitude: 39.3055, longitude: -111.6703 },
    'Vermont': { latitude: 44.0687, longitude: -72.6658 },
    'Virginia': { latitude: 37.5215, longitude: -78.8537 },
    'Washington': { latitude: 47.3826, longitude: -120.4472 },
    'West Virginia': { latitude: 38.6409, longitude: -80.6227 },
    'Wisconsin': { latitude: 44.6243, longitude: -89.9941 },
    'Wyoming': { latitude: 42.9957, longitude: -107.5512 }
  };
  
  // Generate random route (simplified - in reality this would be more complex)
  const generateRandomRoute = () => {
    // Start from center of US
    const startPoint = { latitude: 39.8283, longitude: -98.5795 };
    
    // Create a series of random points that generally move around the country
    const points = [startPoint];
    
    // Add 20 random points
    for (let i = 0; i < 20; i++) {
      const lastPoint = points[points.length - 1];
      
      // Create a point that's not too far from the last one
      const newPoint = {
        latitude: lastPoint.latitude + (Math.random() - 0.5) * 5,
        longitude: lastPoint.longitude + (Math.random() - 0.5) * 5
      };
      
      // Ensure point is within continental US bounds (roughly)
      newPoint.latitude = Math.min(49, Math.max(25, newPoint.latitude));
      newPoint.longitude = Math.min(-67, Math.max(-125, newPoint.longitude));
      
      points.push(newPoint);
    }
    
    return points;
  };
  
  // Generate a list of visited states (random sample for prototype)
  const allStates = Object.keys(stateCoordinates);
  const visitedStatesCount = Math.floor(Math.random() * 20) + 5; // Between 5 and 25 states
  const visitedStates = [];
  
  for (let i = 0; i < visitedStatesCount; i++) {
    const randomIndex = Math.floor(Math.random() * allStates.length);
    const state = allStates[randomIndex];
    
    if (!visitedStates.includes(state)) {
      visitedStates.push(state);
    }
    
    // Remove the state to avoid duplicates
    allStates.splice(randomIndex, 1);
  }
  
  // Generate trip stops (combination of charging stops and overnight stays)
  const generateStops = () => {
    const stops = [];
    const routePoints = generateRandomRoute();
    
    routePoints.forEach((point, index) => {
      // Create a stop at each route point
      const isCharging = Math.random() > 0.3; // 70% chance of being a charging stop
      const isOvernight = index % 3 === 0; // Every 3rd stop is overnight
      
      // Find closest state to this point (simplified)
      let closestState = 'Unknown';
      let minDistance = Number.MAX_VALUE;
      
      Object.entries(stateCoordinates).forEach(([state, coords]) => {
        const distance = Math.sqrt(
          Math.pow(point.latitude - coords.latitude, 2) + 
          Math.pow(point.longitude - coords.longitude, 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          closestState = state;
        }
      });
      
      // Create arrival and departure times
      const now = new Date();
      const arrivalTime = new Date(now.getTime() + (index * 3 * 3600000)); // 3 hours per stop
      const departureTime = new Date(arrivalTime.getTime() + (isOvernight ? 8 * 3600000 : 1 * 3600000)); // 8 hours for overnight, 1 hour for regular
      
      stops.push({
        id: `stop-${index}`,
        name: `${closestState} ${isCharging ? 'Supercharger' : 'Stop'} ${index + 1}`,
        latitude: point.latitude,
        longitude: point.longitude,
        state: closestState,
        type: isOvernight ? 'overnight' : (isCharging ? 'charging' : 'waypoint'),
        charging: isCharging,
        supercharger: isCharging && Math.random() > 0.3,
        overnight: isOvernight,
        arrivalTime: arrivalTime.toISOString(),
        departureTime: departureTime.toISOString(),
        description: `${isOvernight ? 'Overnight stay' : 'Quick stop'} in ${closestState}`,
        notes: isCharging ? 'Charging available' : ''
      });
    });
    
    return stops;
  };
  
  // Generate timeline entries
  const generateTimeline = (stops) => {
    return stops.map((stop, index) => ({
      date: stop.arrivalTime,
      location: stop.name,
      description: stop.description,
      completed: index < stops.length / 2 // Half the stops are completed
    }));
  };
  
  // Generate the stops
  const stops = generateStops();
  
  // Create the simulated trip data
  return {
    id: 'trip-48-continental',
    name: '48 Continental USA Road Trip',
    description: 'Epic journey through all 48 continental states',
    startDate: new Date(Date.now() - 86400000 * 10).toISOString(), // Started 10 days ago
    endDate: new Date(Date.now() + 86400000 * 50).toISOString(), // Ends in 50 days
    currentState: visitedStates[visitedStates.length - 1] || 'Starting Soon',
    currentStop: stops[Math.floor(stops.length / 2)].name,
    nextStop: stops[Math.floor(stops.length / 2) + 1]?.name || 'Destination',
    distanceToNext: Math.floor(Math.random() * 200) + 50, // 50-250 miles
    durationToNext: Math.floor(Math.random() * 180) + 30, // 30-210 minutes
    route: generateRandomRoute(),
    stops: stops,
    visitedStates: visitedStates,
    stateCoordinates: stateCoordinates,
    stats: {
      totalDistance: Math.floor(Math.random() * 10000) + 5000, // 5000-15000 miles
      daysOnRoad: Math.floor(Math.random() * 20) + 5, // 5-25 days
      chargingStops: Math.floor(Math.random() * 50) + 20, // 20-70 charging stops
      statesVisited: visitedStates.length
    },
    timeline: generateTimeline(stops),
    lastUpdated: new Date().toISOString()
  };
}
