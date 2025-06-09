/**
 * Itinerary Loader Module for The Wandering Whittle
 * 
 * Handles loading and processing trip itinerary data
 */

/* eslint-env browser */

// Default start date for the trip (two weeks from now)
const DEFAULT_START_DATE = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

// Sample itinerary data for development/fallback - kept for reference
// eslint-disable-next-line no-unused-vars
const SAMPLE_ITINERARY = {
  name: "The Wandering Whittle Road Trip",
  description: "Epic journey through all 48 continental states",
  startDate: DEFAULT_START_DATE,
  duration: 60, // days
  totalDistance: 14500, // miles
  stops: [
    {
      id: "stop-1",
      name: "New York City, NY",
      description: "Starting point of our journey",
      latitude: 40.7128,
      longitude: -74.006,
      state: "New York",
      arrivalTime: new Date(DEFAULT_START_DATE).toISOString(),
      departureTime: new Date(new Date(DEFAULT_START_DATE).getTime() + 8 * 60 * 60 * 1000).toISOString(),
      overnight: true,
      charging: false,
      supercharger: false,
      notes: "Kickoff event at Times Square"
    },
    {
      id: "stop-2",
      name: "Philadelphia, PA",
      description: "Historic city of brotherly love",
      latitude: 39.9526,
      longitude: -75.1652,
      state: "Pennsylvania",
      arrivalTime: new Date(new Date(DEFAULT_START_DATE).getTime() + 10 * 60 * 60 * 1000).toISOString(),
      departureTime: new Date(new Date(DEFAULT_START_DATE).getTime() + 14 * 60 * 60 * 1000).toISOString(),
      overnight: false,
      charging: true,
      supercharger: true,
      notes: "Visit the Liberty Bell"
    },
    {
      id: "stop-3",
      name: "Washington DC",
      description: "The nation's capital",
      latitude: 38.9072,
      longitude: -77.0369,
      state: "District of Columbia",
      arrivalTime: new Date(new Date(DEFAULT_START_DATE).getTime() + 16 * 60 * 60 * 1000).toISOString(),
      departureTime: new Date(new Date(DEFAULT_START_DATE).getTime() + 24 * 60 * 60 * 1000).toISOString(),
      overnight: true,
      charging: true,
      supercharger: false,
      notes: "Tour the National Mall"
    }
    // More stops would be defined for a real trip...
  ],
  states: [
    { name: "New York", visited: true, visitedDate: new Date(DEFAULT_START_DATE).toISOString() },
    { name: "Pennsylvania", visited: true, visitedDate: new Date(new Date(DEFAULT_START_DATE).getTime() + 10 * 60 * 60 * 1000).toISOString() },
    { name: "District of Columbia", visited: true, visitedDate: new Date(new Date(DEFAULT_START_DATE).getTime() + 16 * 60 * 60 * 1000).toISOString() },
    { name: "Maryland", visited: true, visitedDate: new Date(new Date(DEFAULT_START_DATE).getTime() + 15 * 60 * 60 * 1000).toISOString() },
    { name: "Virginia", plannedDate: new Date(new Date(DEFAULT_START_DATE).getTime() + 24 * 60 * 60 * 1000).toISOString() },
    // More states would be defined...
  ],
  timeline: [
    { 
      location: "New York, NY", 
      date: new Date(DEFAULT_START_DATE).toISOString(), 
      description: "Starting our epic journey across America!" 
    },
    { 
      location: "Philadelphia, PA", 
      date: new Date(new Date(DEFAULT_START_DATE).getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(), 
      description: "Exploring historic Philadelphia" 
    },
    { 
      location: "Washington DC", 
      date: new Date(new Date(DEFAULT_START_DATE).getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), 
      description: "Touring the nation's capital" 
    }
    // More timeline entries would be added...
  ],
  stats: {
    statesVisited: 4,
    milesCompleted: 225,
    daysElapsed: 2,
    daysRemaining: 58,
    chargingStops: 15,
    overnightStops: 30
  }
};

// Generate a more extensive sample itinerary with all 48 states
function generateCompleteItinerary() {
  const startDate = new Date(DEFAULT_START_DATE);
  
  // Define all 48 continental states - keeping the list for reference
  // eslint-disable-next-line no-unused-vars
  const allStates = [
    "Alabama", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
    "Delaware", "Florida", "Georgia", "Idaho", "Illinois", "Indiana", "Iowa",
    "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts",
    "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska",
    "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York",
    "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
    "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah",
    "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
  ];
  
  // Major cities in each state (simplified for this example)
  const stateCities = {
    "Alabama": { name: "Birmingham", lat: 33.5186, lng: -86.8104 },
    "Arizona": { name: "Phoenix", lat: 33.4484, lng: -112.0740 },
    "Arkansas": { name: "Little Rock", lat: 34.7465, lng: -92.2896 },
    "California": { name: "Los Angeles", lat: 34.0522, lng: -118.2437 },
    "Colorado": { name: "Denver", lat: 39.7392, lng: -104.9903 },
    "Connecticut": { name: "Hartford", lat: 41.7658, lng: -72.6734 },
    "Delaware": { name: "Wilmington", lat: 39.7447, lng: -75.5484 },
    "Florida": { name: "Miami", lat: 25.7617, lng: -80.1918 },
    "Georgia": { name: "Atlanta", lat: 33.7490, lng: -84.3880 },
    "Idaho": { name: "Boise", lat: 43.6150, lng: -116.2023 },
    "Illinois": { name: "Chicago", lat: 41.8781, lng: -87.6298 },
    "Indiana": { name: "Indianapolis", lat: 39.7684, lng: -86.1581 },
    "Iowa": { name: "Des Moines", lat: 41.5868, lng: -93.6250 },
    "Kansas": { name: "Wichita", lat: 37.6872, lng: -97.3301 },
    "Kentucky": { name: "Louisville", lat: 38.2527, lng: -85.7585 },
    "Louisiana": { name: "New Orleans", lat: 29.9511, lng: -90.0715 },
    "Maine": { name: "Portland", lat: 43.6591, lng: -70.2568 },
    "Maryland": { name: "Baltimore", lat: 39.2904, lng: -76.6122 },
    "Massachusetts": { name: "Boston", lat: 42.3601, lng: -71.0589 },
    "Michigan": { name: "Detroit", lat: 42.3314, lng: -83.0458 },
    "Minnesota": { name: "Minneapolis", lat: 44.9778, lng: -93.2650 },
    "Mississippi": { name: "Jackson", lat: 32.2988, lng: -90.1848 },
    "Missouri": { name: "Kansas City", lat: 39.0997, lng: -94.5786 },
    "Montana": { name: "Billings", lat: 45.7833, lng: -108.5007 },
    "Nebraska": { name: "Omaha", lat: 41.2565, lng: -95.9345 },
    "Nevada": { name: "Las Vegas", lat: 36.1699, lng: -115.1398 },
    "New Hampshire": { name: "Manchester", lat: 42.9956, lng: -71.4548 },
    "New Jersey": { name: "Newark", lat: 40.7357, lng: -74.1724 },
    "New Mexico": { name: "Albuquerque", lat: 35.0844, lng: -106.6504 },
    "New York": { name: "New York City", lat: 40.7128, lng: -74.006 },
    "North Carolina": { name: "Charlotte", lat: 35.2271, lng: -80.8431 },
    "North Dakota": { name: "Fargo", lat: 46.8772, lng: -96.7898 },
    "Ohio": { name: "Columbus", lat: 39.9612, lng: -82.9988 },
    "Oklahoma": { name: "Oklahoma City", lat: 35.4676, lng: -97.5164 },
    "Oregon": { name: "Portland", lat: 45.5051, lng: -122.6750 },
    "Pennsylvania": { name: "Philadelphia", lat: 39.9526, lng: -75.1652 },
    "Rhode Island": { name: "Providence", lat: 41.8240, lng: -71.4128 },
    "South Carolina": { name: "Charleston", lat: 32.7765, lng: -79.9311 },
    "South Dakota": { name: "Sioux Falls", lat: 43.5446, lng: -96.7311 },
    "Tennessee": { name: "Nashville", lat: 36.1627, lng: -86.7816 },
    "Texas": { name: "Austin", lat: 30.2672, lng: -97.7431 },
    "Utah": { name: "Salt Lake City", lat: 40.7608, lng: -111.8910 },
    "Vermont": { name: "Burlington", lat: 44.4759, lng: -73.2121 },
    "Virginia": { name: "Richmond", lat: 37.5407, lng: -77.4360 },
    "Washington": { name: "Seattle", lat: 47.6062, lng: -122.3321 },
    "West Virginia": { name: "Charleston", lat: 38.3498, lng: -81.6326 },
    "Wisconsin": { name: "Milwaukee", lat: 43.0389, lng: -87.9065 },
    "Wyoming": { name: "Cheyenne", lat: 41.1400, lng: -104.8202 }
  };
  
  // Create a route that visits all states
  const routeOrder = [
    "New York", "New Jersey", "Pennsylvania", "Delaware", "Maryland", 
    "Virginia", "North Carolina", "South Carolina", "Georgia", "Florida", 
    "Alabama", "Mississippi", "Louisiana", "Texas", "Oklahoma", 
    "Arkansas", "Tennessee", "Kentucky", "West Virginia", "Ohio", 
    "Michigan", "Indiana", "Illinois", "Wisconsin", "Minnesota", 
    "Iowa", "Missouri", "Kansas", "Nebraska", "South Dakota", 
    "North Dakota", "Montana", "Idaho", "Washington", "Oregon", 
    "California", "Nevada", "Arizona", "New Mexico", "Colorado", 
    "Utah", "Wyoming", "Vermont", "New Hampshire", "Maine", 
    "Massachusetts", "Rhode Island", "Connecticut"
  ];
  
  // Generate stops for each state
  const stops = [];
  const states = [];
  const timeline = [];
  let currentDate = new Date(startDate);
  let totalDistance = 0;
  let statesVisited = 0;
  let chargingStops = 0;
  let overnightStops = 0;
  
  routeOrder.forEach((state, index) => {
    const city = stateCities[state];
    const isOvernight = index % 2 === 0; // Every other stop is overnight
    const needsCharging = index % 3 === 0; // Every third stop has charging
    const isSupercharger = index % 6 === 0; // Every sixth stop is a supercharger
    
    // Calculate arrival and departure times
    const arrivalTime = new Date(currentDate);
    let departureTime;
    
    if (isOvernight) {
      // For overnight stays, depart the next morning
      departureTime = new Date(currentDate);
      departureTime.setDate(departureTime.getDate() + 1);
      departureTime.setHours(9, 0, 0, 0);
      
      // Update current date to the next day
      currentDate = new Date(departureTime);
      overnightStops++;
    } else {
      // For non-overnight stops, stay for a few hours
      departureTime = new Date(arrivalTime);
      departureTime.setHours(departureTime.getHours() + 3);
      
      // Update current date
      currentDate = new Date(departureTime);
    }
    
    // Create stop
    stops.push({
      id: `stop-${index + 1}`,
      name: `${city.name}, ${state}`,
      description: `Visit to ${city.name}`,
      latitude: city.lat,
      longitude: city.lng,
      state: state,
      arrivalTime: arrivalTime.toISOString(),
      departureTime: departureTime.toISOString(),
      overnight: isOvernight,
      charging: needsCharging,
      supercharger: isSupercharger,
      notes: index === 0 ? "Starting point of our journey" : 
             index === routeOrder.length - 1 ? "Final destination of our journey" : ""
    });
    
    // Add to timeline (but not every stop to keep it manageable)
    if (index % 4 === 0) {
      timeline.push({
        location: `${city.name}, ${state}`,
        date: arrivalTime.toISOString(),
        description: `Exploring ${city.name}, ${state}`
      });
    }
    
    // Add state
    const daysPassed = Math.floor((arrivalTime - startDate) / (24 * 60 * 60 * 1000));
    
    // Only count states as visited if they're in the past or today
    const isVisited = daysPassed <= 0;
    
    states.push({
      name: state,
      visited: isVisited,
      visitedDate: isVisited ? arrivalTime.toISOString() : null,
      plannedDate: !isVisited ? arrivalTime.toISOString() : null
    });
    
    if (isVisited) statesVisited++;
    if (needsCharging) chargingStops++;
    
    // Add approximate distance
    if (index > 0) {
      const prevCity = stateCities[routeOrder[index - 1]];
      const distance = calculateDistance(
        prevCity.lat, prevCity.lng,
        city.lat, city.lng
      );
      totalDistance += distance;
    }
    
    // Move to next location (add travel time)
    currentDate.setHours(currentDate.getHours() + 4);
  });
  
  // Calculate remaining statistics
  const totalDays = Math.ceil((currentDate - startDate) / (24 * 60 * 60 * 1000));
  const daysElapsed = 0; // Assuming we haven't started yet
  const daysRemaining = totalDays;
  
  return {
    name: "The Wandering Whittle Road Trip",
    description: "Epic journey through all 48 continental states",
    startDate: startDate.toISOString(),
    duration: totalDays,
    totalDistance: Math.round(totalDistance),
    stops,
    states,
    timeline,
    stats: {
      statesVisited,
      milesCompleted: 0, // Haven't started yet
      daysElapsed,
      daysRemaining,
      chargingStops,
      overnightStops
    }
  };
}

/**
 * Calculate distance between two points in miles using the Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in miles
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Load the trip itinerary
 * @returns {Promise<Object>} Itinerary data
 */
export async function loadItinerary() {
  try {
    // Edge worker domain
    const EDGE_WORKER_DOMAIN = window.EDGE_WORKER_DOMAIN || 'https://thewanderingwhittle-edge.workers.dev';
    
    // Attempt to fetch real itinerary data from the edge worker
    const response = await fetch(`${EDGE_WORKER_DOMAIN}/itinerary`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(5000)
    });
    
    // If the request was successful, return the real data
    if (response.ok) {
      const data = await response.json();
      console.log('Itinerary data fetched successfully:', data);
      return data;
    }
    
    // If we got an error response, log it and fall back to sample data
    console.warn('Failed to fetch itinerary data, using sample data:', await response.text());
    return generateCompleteItinerary();
  } catch (error) {
    // If there was a network error or other exception, log it and fall back to sample data
    console.warn('Error fetching itinerary data, using sample data:', error);
    return generateCompleteItinerary();
  }
}

/**
 * Get the current progress of the trip
 * @returns {Promise<Object>} Progress data
 */
export async function getCurrentProgress() {
  try {
    // Edge worker domain
    const EDGE_WORKER_DOMAIN = window.EDGE_WORKER_DOMAIN || 'https://thewanderingwhittle-edge.workers.dev';
    
    // Attempt to fetch real progress data from the edge worker
    const response = await fetch(`${EDGE_WORKER_DOMAIN}/itinerary/progress`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(5000)
    });
    
    // If the request was successful, return the real data
    if (response.ok) {
      const data = await response.json();
      console.log('Progress data fetched successfully:', data);
      return data;
    }
    
    // If we got an error response, log it and fall back to generated data
    console.warn('Failed to fetch progress data, generating data:', await response.text());
    return generateCurrentProgress();
  } catch (error) {
    // If there was a network error or other exception, log it and fall back to generated data
    console.warn('Error fetching progress data, generating data:', error);
    return generateCurrentProgress();
  }
}

/**
 * Generate current progress data based on Tesla location and itinerary
 * @returns {Object} Progress data
 */
function generateCurrentProgress() {
  // If we have the Tesla location and itinerary, we can calculate the current progress
  if (window.TRIP_DATA && window.TRIP_DATA.vehicle && window.TRIP_DATA.itinerary) {
    const vehicle = window.TRIP_DATA.vehicle;
    const itinerary = window.TRIP_DATA.itinerary;
    
    // Find the closest stop to the current location
    if (vehicle.latitude && vehicle.longitude && itinerary.stops && itinerary.stops.length > 0) {
      // Sort stops by distance to current location
      const stops = [...itinerary.stops].sort((a, b) => {
        const distA = calculateDistance(
          vehicle.latitude, vehicle.longitude, 
          a.latitude, a.longitude
        );
        const distB = calculateDistance(
          vehicle.latitude, vehicle.longitude, 
          b.latitude, b.longitude
        );
        return distA - distB;
      });
      
      // Closest stop
      const currentStop = stops[0];
      
      // Find the next stop in the itinerary
      const currentIndex = itinerary.stops.findIndex(stop => stop.id === currentStop.id);
      let nextStop = null;
      let eta = null;
      
      if (currentIndex >= 0 && currentIndex < itinerary.stops.length - 1) {
        nextStop = itinerary.stops[currentIndex + 1];
        
        // Calculate ETA to next stop
        const distance = calculateDistance(
          vehicle.latitude, vehicle.longitude,
          nextStop.latitude, nextStop.longitude
        );
        
        // Assuming average speed of 60 mph
        const hoursToNext = distance / 60;
        const now = new Date();
        eta = new Date(now.getTime() + hoursToNext * 60 * 60 * 1000).toISOString();
      }
      
      // Calculate distance to next stop
      const distanceToNext = nextStop ? 
        calculateDistance(
          vehicle.latitude, vehicle.longitude,
          nextStop.latitude, nextStop.longitude
        ) : 0;
      
      // Calculate duration to next stop (in minutes)
      const durationToNext = distanceToNext > 0 ? 
        Math.round((distanceToNext / 60) * 60) : 0; // Convert hours to minutes
      
      return {
        currentStop: currentStop.name,
        currentStopId: currentStop.id,
        currentState: currentStop.state,
        nextStop: nextStop ? nextStop.name : "End of journey",
        nextStopId: nextStop ? nextStop.id : null,
        distanceToNext: Math.round(distanceToNext),
        durationToNext,
        eta,
        currentLat: vehicle.latitude,
        currentLng: vehicle.longitude
      };
    }
  }
  
  // Fallback data if we don't have enough information
  return {
    currentStop: "New York City, NY",
    currentStopId: "stop-1",
    currentState: "New York",
    nextStop: "Philadelphia, PA",
    nextStopId: "stop-2",
    distanceToNext: 95,
    durationToNext: 120,
    eta: new Date(Date.now() + 120 * 60 * 1000).toISOString(),
    currentLat: 40.7128,
    currentLng: -74.006
  };
}
