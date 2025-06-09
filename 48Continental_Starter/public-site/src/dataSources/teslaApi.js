/**
 * Tesla API Module for The Wandering Whittle
 * 
 * Handles fetching vehicle data from the Tesla API via edge worker
 */

/* eslint-env browser */

// Sample data for development/fallback
const SAMPLE_DATA = {
  batteryLevel: 78,
  range: 267.5,
  speed: 65,
  power: 18,
  latitude: 40.7128,
  longitude: -74.006,
  isCharging: false,
  chargeRate: 0,
  outsideTemp: 72,
  insideTemp: 68,
  timestamp: new Date().toISOString()
};

/**
 * Fetch the latest Tesla vehicle data
 * @returns {Promise<Object>} Vehicle data
 */
export async function fetchTeslaData() {
  try {
    // Edge worker domain
    const EDGE_WORKER_DOMAIN = window.EDGE_WORKER_DOMAIN || 'https://thewanderingwhittle-edge.workers.dev';
    
    // Attempt to fetch real data from the Tesla API via edge worker
    const response = await fetch(`${EDGE_WORKER_DOMAIN}/tesla/current`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      // Short timeout to avoid blocking UI
      signal: AbortSignal.timeout(5000)
    });
    
    // If the request was successful, return the real data
    if (response.ok) {
      const data = await response.json();
      
      // Set timestamp if not provided
      if (!data.timestamp) {
        data.timestamp = new Date().toISOString();
      }
      
      console.log('Tesla data fetched successfully:', data);
      return data;
    }
    
    // If we got an error response, log it and fall back to sample data
    console.warn('Failed to fetch Tesla data, using sample data:', await response.text());
    return generateDynamicData();
  } catch (error) {
    // If there was a network error or other exception, log it and fall back to sample data
    console.warn('Error fetching Tesla data, using sample data:', error);
    return generateDynamicData();
  }
}

/**
 * Generate dynamic sample data to simulate movement and battery depletion
 * @returns {Object} Dynamically generated sample data
 */
function generateDynamicData() {
  // Create a copy of the sample data
  const data = { ...SAMPLE_DATA };
  
  // Update timestamp
  data.timestamp = new Date().toISOString();
  
  // Generate dynamic speed (50-75 mph)
  data.speed = Math.floor(50 + Math.random() * 25);
  
  // Adjust power based on speed (more speed = more power usage)
  data.power = Math.floor(15 + (data.speed - 50) / 5);
  
  // Slowly decrease battery level over time (1% every ~15 minutes of simulated time)
  const now = new Date();
  const hourOfDay = now.getHours();
  
  // Simulate charging at night (between 11pm and 6am)
  if (hourOfDay >= 23 || hourOfDay < 6) {
    data.isCharging = true;
    data.chargeRate = 30; // kW
    
    // Increase battery level while charging
    const prevBatteryLevel = localStorage.getItem('teslaSimBatteryLevel');
    if (prevBatteryLevel) {
      data.batteryLevel = Math.min(100, parseFloat(prevBatteryLevel) + 0.5);
    }
  } else {
    data.isCharging = false;
    data.chargeRate = 0;
    
    // Decrease battery based on speed and time
    const prevBatteryLevel = localStorage.getItem('teslaSimBatteryLevel');
    if (prevBatteryLevel) {
      // Higher speeds deplete battery faster
      const depletionRate = 0.05 * (1 + (data.speed - 50) / 100);
      data.batteryLevel = Math.max(5, parseFloat(prevBatteryLevel) - depletionRate);
    }
  }
  
  // Store current battery level for next time
  localStorage.setItem('teslaSimBatteryLevel', data.batteryLevel.toString());
  
  // Update range based on battery level (max range ~350 miles)
  data.range = (data.batteryLevel / 100) * 350;
  
  // Simulate movement along predetermined route
  simulateMovement(data);
  
  return data;
}

/**
 * Simulate vehicle movement along a route
 * @param {Object} data - Vehicle data to update with new coordinates
 */
function simulateMovement(data) {
  // Get or initialize route progress
  let routeProgress = parseFloat(localStorage.getItem('teslaSimRouteProgress') || '0');
  
  // Sample route coordinates (simplified route across US)
  const route = [
    { lat: 40.7128, lng: -74.006 }, // New York
    { lat: 39.9526, lng: -75.1652 }, // Philadelphia
    { lat: 38.9072, lng: -77.0369 }, // Washington DC
    { lat: 35.7796, lng: -78.6382 }, // Raleigh
    { lat: 33.7490, lng: -84.3880 }, // Atlanta
    { lat: 30.3322, lng: -81.6557 }, // Jacksonville
    { lat: 25.7617, lng: -80.1918 }, // Miami
    { lat: 29.7604, lng: -95.3698 }, // Houston
    { lat: 32.7767, lng: -96.7970 }, // Dallas
    { lat: 35.4676, lng: -97.5164 }, // Oklahoma City
    { lat: 39.0997, lng: -94.5786 }, // Kansas City
    { lat: 41.2565, lng: -95.9345 }, // Omaha
    { lat: 44.9778, lng: -93.2650 }, // Minneapolis
    { lat: 41.8781, lng: -87.6298 }, // Chicago
    { lat: 39.7684, lng: -86.1581 }, // Indianapolis
    { lat: 38.2527, lng: -85.7585 }, // Louisville
    { lat: 39.1031, lng: -84.5120 }, // Cincinnati
    { lat: 40.4406, lng: -79.9959 }, // Pittsburgh
    { lat: 42.3601, lng: -71.0589 }, // Boston
    { lat: 40.7128, lng: -74.006 }, // New York (loop)
    { lat: 39.2904, lng: -76.6122 }, // Baltimore
    { lat: 37.5407, lng: -77.4360 }, // Richmond
    { lat: 35.2271, lng: -80.8431 }, // Charlotte
    { lat: 32.0809, lng: -81.0912 }, // Savannah
    { lat: 30.4383, lng: -84.2807 }, // Tallahassee
    { lat: 30.3674, lng: -88.5268 }, // Biloxi
    { lat: 29.9511, lng: -90.0715 }, // New Orleans
    { lat: 32.5007, lng: -93.7474 }, // Shreveport
    { lat: 35.4676, lng: -97.5164 }, // Oklahoma City
    { lat: 35.0844, lng: -106.6504 }, // Albuquerque
    { lat: 33.4484, lng: -112.0740 }, // Phoenix
    { lat: 32.7157, lng: -117.1611 }, // San Diego
    { lat: 34.0522, lng: -118.2437 }, // Los Angeles
    { lat: 37.7749, lng: -122.4194 }, // San Francisco
    { lat: 40.7608, lng: -111.8910 }, // Salt Lake City
    { lat: 39.7392, lng: -104.9903 }, // Denver
    { lat: 41.2565, lng: -95.9345 }, // Omaha
    { lat: 43.0731, lng: -89.4012 }, // Madison
    { lat: 42.3314, lng: -83.0458 }, // Detroit
    { lat: 41.4993, lng: -81.6944 }, // Cleveland
    { lat: 42.8864, lng: -78.8784 }, // Buffalo
    { lat: 43.0481, lng: -76.1474 }, // Syracuse
    { lat: 42.6526, lng: -73.7562 }, // Albany
    { lat: 40.7128, lng: -74.006 } // New York (complete loop)
  ];
  
  // Increment progress based on speed (faster speed = more progress)
  const increment = data.speed * 0.0001;
  routeProgress += increment;
  
  // Loop around if we reach the end
  if (routeProgress >= route.length - 1) {
    routeProgress = 0;
  }
  
  // Find the current segment
  const currentIndex = Math.floor(routeProgress);
  const nextIndex = (currentIndex + 1) % route.length;
  
  // Calculate position between points
  const segmentProgress = routeProgress - currentIndex;
  
  // Interpolate between current and next point
  data.latitude = route[currentIndex].lat + 
    (route[nextIndex].lat - route[currentIndex].lat) * segmentProgress;
  
  data.longitude = route[currentIndex].lng + 
    (route[nextIndex].lng - route[currentIndex].lng) * segmentProgress;
  
  // Save progress for next time
  localStorage.setItem('teslaSimRouteProgress', routeProgress.toString());
}
