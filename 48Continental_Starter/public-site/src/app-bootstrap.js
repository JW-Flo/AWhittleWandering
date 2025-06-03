/**
 * App Bootstrap for 48 Continental USA
 * 
 * This is the main entry point for the 48 Continental USA application.
 * It initializes the map, data sources, and UI components.
 */

/* eslint-env browser */
/* eslint-disable no-unused-vars */

import MapInitializer from './mapInitializer.js';
import { fetchTeslaData } from './dataSources/teslaApi.js';
import { fetchWeatherData } from './dataSources/weatherApi.js';
import { loadItinerary, getCurrentProgress } from './dataSources/itineraryLoader.js';

// Global state
window.TRIP_DATA = {
  vehicle: null,
  weather: null,
  itinerary: null,
  progress: null,
  lastUpdated: null
};

// Edge worker domain for The Wandering Whittle
window.EDGE_WORKER_DOMAIN = 'https://thewanderingwhittle-edge.workers.dev';

// Mapbox token from meta tag
window.MAPBOX_TOKEN = document.querySelector('meta[name="mapbox-token"]')?.getAttribute('content');

// Core DOM elements
const loadingScreen = document.getElementById('loading-screen');
const mapContainer = document.getElementById('map-container');
const currentStatePanel = document.getElementById('current-state-panel');
const vehiclePanel = document.getElementById('vehicle-panel');
const weatherPanel = document.getElementById('weather-panel');
const journeyPanel = document.getElementById('journey-panel');
const stateCollection = document.getElementById('state-collection');

// Update intervals
const FAST_UPDATE_INTERVAL = 30 * 1000; // 30 seconds
const SLOW_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Map instance
let mapInitializer = null;

/**
 * Initialize the application
 */
async function initializeApp() {
  console.log('Initializing 48 Continental USA application...');
  
  // Show loading screen
  if (loadingScreen) {
    loadingScreen.style.display = 'flex';
  }
  
  try {
    // Initialize the map
    await initializeMap();
    
    // Load initial data
    await loadInitialData();
    
    // Set up UI components
    initializeUI();
    
    // Set up update intervals
    setupUpdateIntervals();
    
    // Hide loading screen with animation
    if (loadingScreen) {
      loadingScreen.style.opacity = '0';
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 500);
    }
    
    console.log('48 Continental USA application initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    
    // Show error message
    if (loadingScreen) {
      const loadingContent = loadingScreen.querySelector('.loading-content');
      if (loadingContent) {
        loadingContent.innerHTML = `
          <h1>Initialization Error</h1>
          <p>Failed to initialize application. Please refresh the page.</p>
          <p class="error-details">${error.message}</p>
        `;
      }
    }
  }
}

/**
 * Initialize the map
 */
async function initializeMap() {
  if (!window.MAPBOX_TOKEN) {
    throw new Error('Mapbox token not found. Please make sure it is defined in a meta tag.');
  }
  
  if (!mapContainer) {
    throw new Error('Map container element not found.');
  }
  
  // Create map initializer
  mapInitializer = new MapInitializer({
    mapElementId: 'map-container',
    mapboxToken: window.MAPBOX_TOKEN,
    initialZoom: 4,
    showRoute: true,
    showStops: true,
    showCurrentLocation: true,
    animateMovement: true,
    clusterStops: true
  });
  
  // Initialize the map
  mapInitializer.initialize();
  
  // Return a promise that resolves when the map is ready
  return new Promise((resolve) => {
    document.addEventListener('48continental:mapReady', () => {
      console.log('Map initialized and ready.');
      resolve();
    });
  });
}

/**
 * Load initial data from all sources
 */
async function loadInitialData() {
  try {
    console.log('Loading initial data...');
    
    // Fetch data in parallel
    const [teslaData, weatherData, itineraryData, progressData] = await Promise.allSettled([
      fetchTeslaData(),
      fetchWeatherData(),
      loadItinerary(),
      getCurrentProgress()
    ]);
    
    // Process Tesla data
    if (teslaData.status === 'fulfilled') {
      window.TRIP_DATA.vehicle = teslaData.value;
      updateVehicleUI(teslaData.value);
    } else {
      console.error('Failed to load Tesla data:', teslaData.reason);
    }
    
    // Process weather data
    if (weatherData.status === 'fulfilled') {
      window.TRIP_DATA.weather = weatherData.value;
      updateWeatherUI(weatherData.value);
    } else {
      console.error('Failed to load weather data:', weatherData.reason);
    }
    
    // Process itinerary data
    if (itineraryData.status === 'fulfilled') {
      window.TRIP_DATA.itinerary = itineraryData.value;
      updateItineraryUI(itineraryData.value);
    } else {
      console.error('Failed to load itinerary data:', itineraryData.reason);
    }
    
    // Process progress data
    if (progressData.status === 'fulfilled') {
      window.TRIP_DATA.progress = progressData.value;
      updateProgressUI(progressData.value);
    } else {
      console.error('Failed to load progress data:', progressData.reason);
    }
    
    // Update last updated timestamp
    window.TRIP_DATA.lastUpdated = new Date();
    updateLastUpdatedUI();
    
    console.log('Initial data loaded successfully.');
  } catch (error) {
    console.error('Failed to load initial data:', error);
    throw error;
  }
}

/**
 * Set up update intervals for data refreshing
 */
function setupUpdateIntervals() {
  // Fast update interval for vehicle and weather data
  setInterval(async () => {
    try {
      // Update Tesla data
      const teslaData = await fetchTeslaData();
      window.TRIP_DATA.vehicle = teslaData;
      updateVehicleUI(teslaData);
      
      // Update weather data
      const weatherData = await fetchWeatherData();
      window.TRIP_DATA.weather = weatherData;
      updateWeatherUI(weatherData);
      
      // Update timestamp
      window.TRIP_DATA.lastUpdated = new Date();
      updateLastUpdatedUI();
    } catch (error) {
      console.error('Failed to update fast-changing data:', error);
    }
  }, FAST_UPDATE_INTERVAL);
  
  // Slow update interval for itinerary and progress data
  setInterval(async () => {
    try {
      // Update itinerary data
      const itineraryData = await loadItinerary();
      window.TRIP_DATA.itinerary = itineraryData;
      updateItineraryUI(itineraryData);
      
      // Update progress data
      const progressData = await getCurrentProgress();
      window.TRIP_DATA.progress = progressData;
      updateProgressUI(progressData);
    } catch (error) {
      console.error('Failed to update slow-changing data:', error);
    }
  }, SLOW_UPDATE_INTERVAL);
  
  // Update when document becomes visible again
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Force an immediate update when tab becomes visible
      (async () => {
        try {
          const [teslaData, weatherData] = await Promise.all([
            fetchTeslaData(),
            fetchWeatherData()
          ]);
          
          window.TRIP_DATA.vehicle = teslaData;
          updateVehicleUI(teslaData);
          
          window.TRIP_DATA.weather = weatherData;
          updateWeatherUI(weatherData);
          
          window.TRIP_DATA.lastUpdated = new Date();
          updateLastUpdatedUI();
        } catch (error) {
          console.error('Failed to update data on visibility change:', error);
        }
      })();
    }
  });
}

/**
 * Initialize UI components and event handlers
 */
function initializeUI() {
  // Initialize panel toggle handlers
  initializePanelToggles();
  
  // Initialize state collection UI
  initializeStateCollection();
  
  // Initialize timeline UI
  initializeTimeline();
  
  // Initialize vehicle visualization
  initializeVehicleVisualization();
  
  // Initialize event listeners for map-related UI updates
  initializeMapEventListeners();
}

/**
 * Initialize panel toggle handlers
 */
function initializePanelToggles() {
  // Navigation controls
  const navControls = document.querySelectorAll('.nav-control');
  navControls.forEach(control => {
    control.addEventListener('click', () => {
      const panelId = control.getAttribute('data-panel');
      togglePanel(panelId);
    });
  });
  
  // Close buttons
  const closeButtons = document.querySelectorAll('.close-panel');
  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const panel = button.closest('.glass-panel');
      if (panel) {
        panel.classList.remove('visible');
      }
    });
  });
  
  // Weather toggle
  const weatherToggle = document.getElementById('weather-toggle');
  if (weatherToggle) {
    weatherToggle.addEventListener('click', () => {
      togglePanel('weather-panel');
    });
  }
  
  // States toggle
  const statesToggle = document.getElementById('states-toggle');
  if (statesToggle) {
    statesToggle.addEventListener('click', () => {
      togglePanel('state-collection');
    });
  }
  
  // Escape key to close panels
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.glass-panel:not(.always-visible).visible').forEach(panel => {
        panel.classList.remove('visible');
      });
    }
  });
}

/**
 * Toggle a panel's visibility
 * @param {string} panelId - ID of the panel to toggle
 */
function togglePanel(panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  
  if (panel.classList.contains('visible')) {
    panel.classList.remove('visible');
  } else {
    // Hide all other non-persistent panels
    document.querySelectorAll('.glass-panel:not(.always-visible)').forEach(p => {
      p.classList.remove('visible');
    });
    
    // Show this panel
    panel.classList.add('visible');
  }
}

/**
 * Initialize the state collection UI
 */
function initializeStateCollection() {
  const statesGrid = document.getElementById('states-grid');
  if (!statesGrid) return;
  
  // All 48 continental states
  const states = [
    'Alabama', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'Florida', 'Georgia', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts',
    'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska',
    'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
    'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
    'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah',
    'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];
  
  // Create the state grid
  states.forEach(state => {
    const stateElement = document.createElement('div');
    stateElement.className = 'state-badge';
    stateElement.setAttribute('data-state', state);
    
    // Get state abbreviation (first 2 letters)
    const abbr = state.substring(0, 2).toUpperCase();
    
    stateElement.innerHTML = `
      <div class="state-abbr">${abbr}</div>
      <div class="state-name">${state}</div>
    `;
    
    statesGrid.appendChild(stateElement);
    
    // Add click handler to focus on state when clicked
    stateElement.addEventListener('click', () => {
      if (window.TRIP_DATA.itinerary) {
        const stateData = window.TRIP_DATA.itinerary.states.find(s => 
          s.name.toLowerCase() === state.toLowerCase()
        );
        
        if (stateData && mapInitializer) {
          // Find a stop in this state
          const stateStop = window.TRIP_DATA.itinerary.stops.find(stop => 
            stop.state && stop.state.toLowerCase() === state.toLowerCase()
          );
          
          if (stateStop) {
            // Fly to the state
            mapInitializer.flyToLocation(stateStop.longitude, stateStop.latitude, 6);
            
            // Show state info
            showStateInfo(state, stateData, stateStop);
          }
        }
      }
    });
  });
}

/**
 * Show information about a specific state
 * @param {string} stateName - Name of the state
 * @param {Object} stateData - State data from the itinerary
 * @param {Object} stateStop - A stop in the state
 */
function showStateInfo(stateName, stateData, stateStop) {
  // Create or get the state info panel
  let stateInfoPanel = document.getElementById('state-info-panel');
  
  if (!stateInfoPanel) {
    stateInfoPanel = document.createElement('div');
    stateInfoPanel.id = 'state-info-panel';
    stateInfoPanel.className = 'glass-panel';
    document.getElementById('immersive-container').appendChild(stateInfoPanel);
  }
  
  // Format visited date if available
  let visitedDate = 'Not yet visited';
  if (stateData.visited) {
    const date = new Date(stateData.visitedDate || stateStop.arrivalTime);
    visitedDate = date.toLocaleDateString();
  } else if (stateData.plannedDate) {
    const date = new Date(stateData.plannedDate);
    visitedDate = `Planned: ${date.toLocaleDateString()}`;
  }
  
  // Populate the panel
  stateInfoPanel.innerHTML = `
    <div class="panel-header">
      <h2>${stateName}</h2>
      <button class="close-panel">&times;</button>
    </div>
    <div class="panel-body">
      <div class="state-info-content">
        <p><strong>Status:</strong> ${stateData.visited ? 'Visited' : 'Not visited'}</p>
        <p><strong>Date:</strong> ${visitedDate}</p>
        ${stateStop ? `
          <h3>Key Stop</h3>
          <p><strong>Location:</strong> ${stateStop.name}</p>
          <p><strong>Description:</strong> ${stateStop.description || 'No description available'}</p>
          <p><strong>Arrival:</strong> ${new Date(stateStop.arrivalTime).toLocaleString()}</p>
          ${stateStop.notes ? `<p><strong>Notes:</strong> ${stateStop.notes}</p>` : ''}
        ` : ''}
      </div>
    </div>
  `;
  
  // Add close handler
  stateInfoPanel.querySelector('.close-panel').addEventListener('click', () => {
    stateInfoPanel.classList.remove('visible');
  });
  
  // Show the panel
  stateInfoPanel.classList.add('visible');
}

/**
 * Initialize the timeline UI
 */
function initializeTimeline() {
  const timelineContainer = document.getElementById('timeline-entries');
  if (!timelineContainer) return;
  
  // We'll populate this when we have timeline data
}

/**
 * Initialize the vehicle visualization
 */
function initializeVehicleVisualization() {
  const teslaModel = document.getElementById('tesla-model');
  if (!teslaModel) return;
  
  // Simple SVG representation of a Tesla
  teslaModel.innerHTML = `
    <svg width="100%" height="100%" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M20,20 C20,12 35,5 50,5 C65,5 80,12 80,20 L90,20 C90,20 95,20 95,25 L95,30 C95,30 95,35 90,35 L10,35 C10,35 5,35 5,30 L5,25 C5,25 5,20 10,20 Z" fill="#007bff" />
      <circle cx="25" cy="35" r="5" fill="#333" />
      <circle cx="75" cy="35" r="5" fill="#333" />
      <path d="M30,20 L70,20 C70,15 60,10 50,10 C40,10 30,15 30,20 Z" fill="#eee" />
    </svg>
  `;
}

/**
 * Initialize map event listeners
 */
function initializeMapEventListeners() {
  // Listen for vehicle location updates
  document.addEventListener('48continental:vehicleLocationUpdated', (e) => {
    // Update current state panel with location data
    updateLocationUI(e.detail.data);
  });
  
  // Listen for route updates
  document.addEventListener('48continental:routeUpdated', () => {
    // Nothing specific to do here yet
  });
  
  // Listen for stops updates
  document.addEventListener('48continental:stopsUpdated', () => {
    // Nothing specific to do here yet
  });
  
  // Listen for stop selection
  document.addEventListener('48continental:stopSelected', (e) => {
    const { stopId, properties } = e.detail;
    
    // Show stop info in a panel or update UI
    showStopInfo(stopId, properties);
  });
}

/**
 * Show information about a specific stop
 * @param {string} stopId - ID of the stop
 * @param {Object} properties - Properties of the stop
 */
function showStopInfo(stopId, properties) {
  // Similar implementation as showStateInfo
  let stopInfoPanel = document.getElementById('stop-info-panel');
  
  if (!stopInfoPanel) {
    stopInfoPanel = document.createElement('div');
    stopInfoPanel.id = 'stop-info-panel';
    stopInfoPanel.className = 'glass-panel';
    document.getElementById('immersive-container').appendChild(stopInfoPanel);
  }
  
  // Format dates
  const arrivalTime = properties.arrivalTime 
    ? new Date(properties.arrivalTime).toLocaleString() 
    : 'N/A';
  
  const departureTime = properties.departureTime 
    ? new Date(properties.departureTime).toLocaleString() 
    : 'N/A';
  
  // Populate the panel
  stopInfoPanel.innerHTML = `
    <div class="panel-header">
      <h2>${properties.name}</h2>
      <button class="close-panel">&times;</button>
    </div>
    <div class="panel-body">
      <div class="stop-info-content">
        <p>${properties.description || 'No description available'}</p>
        <p><strong>State:</strong> ${properties.state}</p>
        <p><strong>Arrival:</strong> ${arrivalTime}</p>
        <p><strong>Departure:</strong> ${departureTime}</p>
        ${properties.charging ? '<p><strong>Charging Available</strong></p>' : ''}
        ${properties.supercharger ? '<p><strong>Tesla Supercharger</strong></p>' : ''}
        ${properties.overnight ? '<p><strong>Overnight Stay</strong></p>' : ''}
        ${properties.notes ? `<p><strong>Notes:</strong> ${properties.notes}</p>` : ''}
      </div>
    </div>
  `;
  
  // Add close handler
  stopInfoPanel.querySelector('.close-panel').addEventListener('click', () => {
    stopInfoPanel.classList.remove('visible');
  });
  
  // Show the panel
  stopInfoPanel.classList.add('visible');
}

/**
 * Update vehicle UI with new data
 * @param {Object} vehicleData - Vehicle data
 */
function updateVehicleUI(vehicleData) {
  if (!vehicleData) return;
  
  // Update battery level visual and text
  const batteryLevel = vehicleData.batteryLevel || 0;
  const batteryVisual = document.getElementById('battery-level-visual');
  const batteryText = document.getElementById('battery-level-text');
  const miniBatteryText = document.getElementById('battery-level');
  
  if (batteryVisual) {
    batteryVisual.style.width = `${batteryLevel}%`;
    
    // Change color based on level
    if (batteryLevel < 20) {
      batteryVisual.style.backgroundColor = 'var(--alert-color)';
    } else if (batteryLevel < 40) {
      batteryVisual.style.backgroundColor = 'var(--warning-color)';
    } else {
      batteryVisual.style.backgroundColor = 'var(--accent-color)';
    }
  }
  
  if (batteryText) batteryText.textContent = `${batteryLevel}%`;
  if (miniBatteryText) miniBatteryText.textContent = `${batteryLevel}%`;
  
  // Update range
  const range = document.getElementById('range');
  if (range) range.textContent = `${Math.round(vehicleData.range || 0)} mi`;
  
  // Update speed
  const speed = document.getElementById('speed');
  const speedExtended = document.getElementById('speed-extended');
  
  if (speed) speed.textContent = `${vehicleData.speed || 0}`;
  if (speedExtended) speedExtended.textContent = `${vehicleData.speed || 0} mph`;
  
  // Update power
  const power = document.getElementById('power');
  if (power) power.textContent = `${vehicleData.power || 0} kW`;
  
  // Animate Tesla model based on speed
  const teslaModel = document.getElementById('tesla-model');
  if (teslaModel) {
    if (vehicleData.speed > 5) {
      teslaModel.classList.add('moving');
    } else {
      teslaModel.classList.remove('moving');
    }
  }
}

/**
 * Update weather UI with new data
 * @param {Object} weatherData - Weather data
 */
function updateWeatherUI(weatherData) {
  if (!weatherData) return;
  
  // Update weather icon
  const weatherIcon = document.getElementById('weather-icon');
  if (weatherIcon && weatherData.icon) {
    weatherIcon.src = `https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`;
    weatherIcon.alt = weatherData.description || 'Weather icon';
  }
  
  // Update temperature displays
  const temperature = document.getElementById('temperature');
  const temperatureExtended = document.getElementById('temperature-extended');
  
  if (temperature) temperature.textContent = `${Math.round(weatherData.temperature || 0)}°F`;
  if (temperatureExtended) temperatureExtended.textContent = `${Math.round(weatherData.temperature || 0)}°F`;
  
  // Update condition
  const condition = document.getElementById('weather-condition');
  if (condition) condition.textContent = weatherData.condition || 'Unknown';
  
  // Update humidity
  const humidity = document.getElementById('humidity');
  if (humidity) humidity.textContent = `${weatherData.humidity || 0}%`;
  
  // Update wind speed
  const windSpeed = document.getElementById('wind-speed');
  if (windSpeed) windSpeed.textContent = `${weatherData.windSpeed || 0} mph`;
}

/**
 * Update itinerary UI with new data
 * @param {Object} itineraryData - Itinerary data
 */
function updateItineraryUI(itineraryData) {
  if (!itineraryData) return;
  
  // Update journey progress
  const journeyProgress = (itineraryData.stats?.statesVisited / 48) * 100 || 0;
  const progressBar = document.getElementById('journey-progress-bar');
  const statesCount = document.getElementById('states-count');
  
  if (progressBar) progressBar.style.width = `${journeyProgress}%`;
  if (statesCount) statesCount.textContent = `${itineraryData.stats?.statesVisited || 0}/48`;
  
  // Update states collection
  updateStatesCollection(itineraryData.states || []);
  
  // Update charging stops
  const chargingStops = document.getElementById('charging-stops');
  if (chargingStops) chargingStops.textContent = itineraryData.stats?.chargingStops || '0';
  
  // Update timeline entries
  updateTimelineEntries(itineraryData.timeline || []);
}

/**
 * Update states collection UI with visited states
 * @param {Array} states - Array of state data
 */
function updateStatesCollection(states) {
  // Find visited states
  const visitedStates = states.filter(state => state.visited).map(state => state.name);
  
  // Update state badges
  document.querySelectorAll('.state-badge').forEach(badge => {
    const stateName = badge.getAttribute('data-state');
    if (visitedStates.includes(stateName)) {
      badge.classList.add('collected');
    } else {
      badge.classList.remove('collected');
    }
  });
}

/**
 * Update timeline entries
 * @param {Array} timeline - Array of timeline entries
 */
function updateTimelineEntries(timeline) {
  const timelineContainer = document.getElementById('timeline-entries');
  if (!timelineContainer) return;
  
  // Clear existing entries
  timelineContainer.innerHTML = '';
  
  // Add timeline entries
  timeline.forEach((entry, index) => {
    const timelineEntry = document.createElement('div');
    timelineEntry.className = 'timeline-entry';
    
    // Mark the first entry as current
    if (index === 0) timelineEntry.classList.add('current');
    
    // Format date
    const date = new Date(entry.date);
    const formattedDate = date.toLocaleDateString();
    
    timelineEntry.innerHTML = `
      <div class="timeline-dot"></div>
      <div class="timeline-content">
        <h4>${entry.location}</h4>
        <p class="timeline-date">${formattedDate}</p>
        <p>${entry.description || ''}</p>
      </div>
    `;
    
    timelineContainer.appendChild(timelineEntry);
  });
}

/**
 * Update progress UI with new data
 * @param {Object} progressData - Progress data
 */
function updateProgressUI(progressData) {
  if (!progressData) return;
  
  // Update current/next locations in the current state panel
  updateLocationUI(progressData);
}

/**
 * Update location UI elements
 * @param {Object} data - Location data
 */
function updateLocationUI(data) {
  if (!data) return;
  
  // Try to get location info from progress data
  let currentLocation = data.currentStop ? data.currentStop : 'Unknown';
  let nextLocation = data.nextStop ? data.nextStop : 'Unknown';
  let eta = null;
  
  // If we have a vehicle object, use coordinates
  if (window.TRIP_DATA.vehicle && window.TRIP_DATA.itinerary) {
    const vehicle = window.TRIP_DATA.vehicle;
    const itinerary = window.TRIP_DATA.itinerary;
    
    // Find the closest stop to current location
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
      
      // Closest stop is current location
      if (stops[0]) {
        currentLocation = stops[0].name;
        
        // Next stop is the next one in the itinerary
        const currentIndex = itinerary.stops.findIndex(stop => stop.id === stops[0].id);
        if (currentIndex >= 0 && currentIndex < itinerary.stops.length - 1) {
          const next = itinerary.stops[currentIndex + 1];
          nextLocation = next.name;
          eta = next.arrivalTime;
        }
      }
    }
  }
  
  // Update current location
  const currentElem = document.getElementById('current');
  if (currentElem) currentElem.textContent = currentLocation;
  
  // Update next location
  const nextElem = document.getElementById('next');
  if (nextElem) nextElem.textContent = nextLocation;
  
  // Update ETA
  const etaElem = document.getElementById('eta');
  if (etaElem && eta) {
    const etaDate = new Date(eta);
    const now = new Date();
    
    // If today, just show time
    if (etaDate.toDateString() === now.toDateString()) {
      etaElem.textContent = etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      // Otherwise show date and time
      etaElem.textContent = etaDate.toLocaleString([], { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  } else if (etaElem) {
    etaElem.textContent = '--:--';
  }
}

/**
 * Update the last updated timestamp
 */
function updateLastUpdatedUI() {
  const lastUpdated = document.getElementById('last-updated');
  if (lastUpdated && window.TRIP_DATA.lastUpdated) {
    const date = window.TRIP_DATA.lastUpdated;
    lastUpdated.textContent = `Last updated: ${date.toLocaleString()}`;
  }
}

/**
 * Calculate distance between two points in km using the Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

// Initialize the application when the DOM content is loaded
document.addEventListener('DOMContentLoaded', initializeApp);
