/* eslint-env browser */
/* global mapboxgl */

// --------------------------
// INITIALIZATION & GLOBALS
// --------------------------
// MapBox token from meta tag
mapboxgl.accessToken = document.querySelector('meta[name="mapbox-token"]').getAttribute('content');

// API endpoint for the trip data
// For local development, we need to use a proxy or relative path to our Function
const ENDPOINT = window.location.hostname === 'localhost' ? '/route' : '/functions/route';

// Core elements
const loadingScreen = document.getElementById('loading-screen');
const mapContainer = document.getElementById('map-container');
const floatingHeader = document.getElementById('floating-header');
const currentStatePanel = document.getElementById('current-state-panel');
const infoFooter = document.getElementById('info-footer');

// Panel elements
const vehiclePanel = document.getElementById('vehicle-panel');
const weatherPanel = document.getElementById('weather-panel');
const journeyPanel = document.getElementById('journey-panel');
const galleryPanel = document.getElementById('gallery-panel');
const logsPanel = document.getElementById('logs-panel');
const commentsPanel = document.getElementById('comments-panel');
const stateCollection = document.getElementById('state-collection');
const subscribePanel = document.getElementById('subscribe-panel');

// Control buttons
const weatherToggle = document.getElementById('weather-toggle');
const audioToggle = document.getElementById('audio-toggle');
const statesToggle = document.getElementById('states-toggle');
const subscribeToggle = document.getElementById('subscribe-toggle');
const navControls = document.querySelectorAll('.nav-control');
const closePanelButtons = document.querySelectorAll('.close-panel');

// Map and state tracking
let map, vehicleMarker, visitedStates = [], stateMarkers = [];
let audioEnabled = false;
let ambientAudio = null;
let routeLineDrawn = false;
let stateElements = {};
let journeyProgress = 0;
let currentData = null;

// --------------------------
// LOADING SEQUENCE
// --------------------------
function initializeLoadingSequence() {
  // Show loading screen while resources load
  loadingScreen.style.display = 'flex';
  
  // After all resources are loaded, hide loading screen with animation
  window.addEventListener('load', () => {
    setTimeout(() => {
      loadingScreen.style.opacity = 0;
      setTimeout(() => {
        loadingScreen.style.display = 'none';
        // Initialize animation for header content
        document.querySelector('.header-content').classList.add('fade-in');
      }, 500);
    }, 1000); // Extra delay for dramatic effect
  });
}

// --------------------------
// MAP INITIALIZATION
// --------------------------
function initializeMap() {
  // Create map instance with dark style
  map = new mapboxgl.Map({
    container: 'map-container',
    style: 'mapbox://styles/mapbox/dark-v11', // Use dark style by default
    center: [-98.5795, 39.8283], // Center of US
    zoom: 3.5,
    attributionControl: false,
    logoPosition: 'bottom-right'
  });

  // Add minimal Mapbox attribution
  map.addControl(new mapboxgl.AttributionControl({
    compact: true,
    customAttribution: '© 48Continental 2025'
  }), 'bottom-right');

  // Add zoom controls
  map.addControl(new mapboxgl.NavigationControl({
    showCompass: false,
    showZoom: true,
    visualizePitch: false
  }), 'bottom-right');

  // Create vehicle marker
  vehicleMarker = new mapboxgl.Marker({
    color: '#00a67e', // Tesla green
    scale: 1.2
  }).setLngLat([-98.5795, 39.8283]).addTo(map);

  // When map loads, prepare for route drawing
  map.on('load', () => {
    prepareMapLayers();
  });
}

function prepareMapLayers() {
  // Add source for route line (will be populated later)
  map.addSource('route', {
    type: 'geojson',
    data: {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: []
      }
    }
  });

  // Add main route line layer
  map.addLayer({
    id: 'route-line',
    type: 'line',
    source: 'route',
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#00a67e', // Tesla green
      'line-width': 5,
      'line-opacity': 0.8
    }
  });

  // Add animated route progress layer
  map.addLayer({
    id: 'route-progress',
    type: 'line',
    source: 'route',
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#ffffff',
      'line-width': 2,
      'line-opacity': 0.9,
      'line-dasharray': [0, 4, 3]
    }
  });

  // Add source for state markers
  map.addSource('states-visited', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: []
    }
  });

  // Add layer for state markers
  map.addLayer({
    id: 'states-markers',
    type: 'circle',
    source: 'states-visited',
    paint: {
      'circle-radius': 8,
      'circle-color': '#00a67e',
      'circle-opacity': 0.8,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff'
    }
  });
}

function updateMapWithRoute(routeData) {
  if (!map || !map.loaded()) return;
  
  // If we have route coordinates, update the route line
  if (routeData && routeData.coordinates && routeData.coordinates.length > 0) {
    map.getSource('route').setData({
      type: 'Feature',
      properties: {},
      geometry: routeData
    });
    
    // If this is the first time drawing the route, fit bounds
    if (!routeLineDrawn) {
      const bounds = new mapboxgl.LngLatBounds();
      routeData.coordinates.forEach(coord => {
        bounds.extend(coord);
      });
      map.fitBounds(bounds, { padding: 100 });
      routeLineDrawn = true;
      
      // Animate the route line
      animateRouteLine();
    }
  }
}

function animateRouteLine() {
  // Animate the route progress line
  let step = 0;
  const dashArraySequence = [
    [0, 4, 3],
    [1, 3, 3],
    [2, 2, 3],
    [3, 1, 3],
    [4, 0, 3],
    [3, 1, 3],
    [2, 2, 3],
    [1, 3, 3]
  ];
  
  const animate = () => {
    step = (step + 1) % dashArraySequence.length;
    map.setPaintProperty('route-progress', 'line-dasharray', dashArraySequence[step]);
    requestAnimationFrame(animate);
  };
  
  animate();
}

function updateMapLocation(lat, lng) {
  if (!map) return;
  
  // Update vehicle marker position
  vehicleMarker.setLngLat([lng, lat]);
  
  // Smooth transition to new position
  map.flyTo({
    center: [lng, lat],
    zoom: 6,
    speed: 0.3,
    curve: 1,
    essential: true
  });
}

function addStateMarker(state, lat, lng) {
  if (!map || !map.loaded() || !map.getSource('states-visited')) return;
  
  // Check if we already have this state
  if (visitedStates.includes(state)) return;
  
  // Add to visited states
  visitedStates.push(state);
  
  // Get current state markers
  const currentFeatures = map.getSource('states-visited')._data.features || [];
  
  // Add new state marker
  currentFeatures.push({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [lng, lat]
    },
    properties: {
      state: state
    }
  });
  
  // Update the source
  map.getSource('states-visited').setData({
    type: 'FeatureCollection',
    features: currentFeatures
  });
  
  // Update state collection UI
  updateStateCollection();
}

// --------------------------
// UI PANEL MANAGEMENT
// --------------------------
function initializePanelManagement() {
  // Handle nav control clicks
  navControls.forEach(control => {
    control.addEventListener('click', () => {
      const panelId = control.getAttribute('data-panel');
      togglePanel(panelId);
    });
  });
  
  // Handle close buttons
  closePanelButtons.forEach(button => {
    button.addEventListener('click', () => {
      const panel = button.closest('.glass-panel');
      if (panel) hidePanel(panel.id);
    });
  });
  
  // Control overlay buttons
  weatherToggle.addEventListener('click', () => togglePanel('weather-panel'));
  statesToggle.addEventListener('click', () => togglePanel('state-collection'));
  subscribeToggle.addEventListener('click', () => togglePanel('subscribe-panel'));
  audioToggle.addEventListener('click', toggleAmbientAudio);
  
  // Handle scroll for header minimization
  window.addEventListener('scroll', handleScroll);
  
  // Keyboard controls
  window.addEventListener('keydown', handleKeyPress);
}

function togglePanel(panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  
  if (panel.classList.contains('visible')) {
    hidePanel(panelId);
  } else {
    showPanel(panelId);
  }
}

function showPanel(panelId) {
  // Hide all panels except always-visible ones
  document.querySelectorAll('.glass-panel:not(.always-visible)').forEach(panel => {
    panel.classList.remove('visible');
  });
  
  // Show the requested panel
  const panel = document.getElementById(panelId);
  if (panel) panel.classList.add('visible');
}

function hidePanel(panelId) {
  const panel = document.getElementById(panelId);
  if (panel) panel.classList.remove('visible');
}

function handleScroll() {
  const scrollPosition = window.scrollY;
  
  // Header minimization based on scroll
  if (scrollPosition > 50) {
    floatingHeader.classList.add('scrolled');
  } else {
    floatingHeader.classList.remove('scrolled');
  }
  
  // Show/hide footer based on scroll direction
  // Implementation details would depend on your scrolling behavior
}

function handleKeyPress(e) {
  // Escape key closes all panels
  if (e.key === 'Escape') {
    document.querySelectorAll('.glass-panel:not(.always-visible).visible').forEach(panel => {
      panel.classList.remove('visible');
    });
  }
  
  // Other keyboard shortcuts
  if (e.key === 'm' && e.ctrlKey) togglePanel('map-panel');
  if (e.key === 'v' && e.ctrlKey) togglePanel('vehicle-panel');
  if (e.key === 'w' && e.ctrlKey) togglePanel('weather-panel');
}

// --------------------------
// AMBIENT AUDIO
// --------------------------
function initializeAmbientAudio() {
  // Create audio element for ambient sounds
  ambientAudio = new Audio();
  ambientAudio.src = 'https://assets.mixkit.co/sfx/preview/mixkit-forest-stream-ambience-loop-1230.mp3';
  ambientAudio.loop = true;
  ambientAudio.volume = 0.4;
}

function toggleAmbientAudio() {
  if (!ambientAudio) {
    initializeAmbientAudio();
  }
  
  if (audioEnabled) {
    ambientAudio.pause();
    audioToggle.querySelector('.control-icon').textContent = '🔇';
  } else {
    ambientAudio.play().catch(e => console.log('Audio autoplay blocked', e));
    audioToggle.querySelector('.control-icon').textContent = '🔊';
  }
  
  audioEnabled = !audioEnabled;
}

// --------------------------
// DATA VISUALIZATION
// --------------------------
function updateVehicleVisualization(vehicleData) {
  if (!vehicleData) return;
  
  // Update battery level visual
  const batteryLevel = vehicleData.batteryLevel || 0;
  const batteryVisual = document.getElementById('battery-level-visual');
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
  
  // Update battery text
  const batteryText = document.getElementById('battery-level-text');
  if (batteryText) batteryText.textContent = `${batteryLevel}%`;
  
  // Update mini battery indicator
  const miniBattery = document.getElementById('battery-level');
  if (miniBattery) miniBattery.textContent = `${batteryLevel}%`;
  
  // Update range
  const range = document.getElementById('range');
  if (range) range.textContent = `${Math.round(vehicleData.range || 0)} mi`;
  
  // Update speed
  const speed = document.getElementById('speed');
  if (speed) speed.textContent = `${vehicleData.speed || 0}`;
  
  const speedExtended = document.getElementById('speed-extended');
  if (speedExtended) speedExtended.textContent = `${vehicleData.speed || 0} mph`;
  
  // Update power
  const power = document.getElementById('power');
  if (power) power.textContent = `${vehicleData.power || 0} kW`;
  
  // Animate Tesla model based on speed
  const teslaModel = document.getElementById('tesla-model');
  if (teslaModel) {
    // Simple pulse animation based on vehicle movement
    if (vehicleData.speed > 5) {
      teslaModel.classList.add('pulse');
    } else {
      teslaModel.classList.remove('pulse');
    }
  }
}

function updateWeatherVisualization(weatherData) {
  if (!weatherData) return;
  
  // Update weather icon
  const weatherIcon = document.getElementById('weather-icon');
  if (weatherIcon && weatherData.icon) {
    weatherIcon.src = `https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`;
  }
  
  // Update temperature
  const temperature = document.getElementById('temperature');
  if (temperature) temperature.textContent = `${Math.round(weatherData.temperature || 0)}°F`;
  
  const tempExtended = document.getElementById('temperature-extended');
  if (tempExtended) tempExtended.textContent = `${Math.round(weatherData.temperature || 0)}°F`;
  
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

function updateTripInfo(tripData, locationData) {
  if (!tripData) return;
  
  // Update distance to next
  const distanceToNext = document.getElementById('distance-to-next');
  if (distanceToNext) distanceToNext.textContent = `${Math.round(tripData.distanceToNext || 0)} mi`;
  
  // Update duration to next
  const durationToNext = document.getElementById('duration-to-next');
  if (durationToNext) {
    const minutes = Math.round(tripData.durationToNext || 0);
    let formattedDuration = `${minutes} min`;
    
    // Convert to hours and minutes if more than 60 minutes
    if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      formattedDuration = `${hours} hr ${remainingMinutes} min`;
    }
    
    durationToNext.textContent = formattedDuration;
  }
  
  // Update charging stops
  const chargingStops = document.getElementById('charging-stops');
  if (chargingStops) chargingStops.textContent = tripData.chargingStops || '0';
  
  // Update states visited
  const statesVisitedElem = document.getElementById('states-visited');
  if (statesVisitedElem) statesVisitedElem.textContent = `${visitedStates.length || 0}/48`;
  
  // Update current location info
  if (locationData) {
    const currentLocation = document.getElementById('current');
    if (currentLocation) currentLocation.textContent = locationData.current || 'Unknown';
    
    const nextLocation = document.getElementById('next');
    if (nextLocation) nextLocation.textContent = locationData.next || 'Unknown';
    
    const eta = document.getElementById('eta');
    if (eta && locationData.eta) {
      const etaDate = new Date(locationData.eta);
      const now = new Date();
      
      // If today, just show time
      if (etaDate.toDateString() === now.toDateString()) {
        eta.textContent = etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        // Otherwise show date and time
        eta.textContent = etaDate.toLocaleString([], { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
    }
    
    // Update journey progress if we have a current state
    if (locationData.current) {
      // Check if this is a new state to add to our collection
      if (locationData.currentLat && locationData.currentLng) {
        const stateName = locationData.current.split(',')[1]?.trim() || locationData.current;
        addStateMarker(stateName, locationData.currentLat, locationData.currentLng);
      }
    }
  }
  
  // Update journey progress
  updateJourneyProgress();
  
  // Update last updated timestamp
  const lastUpdated = document.getElementById('last-updated');
  if (lastUpdated) {
    const now = new Date();
    lastUpdated.textContent = `Last updated: ${now.toLocaleString()}`;
  }
}

function updateJourneyProgress() {
  // Calculate progress based on states visited
  journeyProgress = (visitedStates.length / 48) * 100;
  
  // Update progress bar
  const progressBar = document.getElementById('journey-progress-bar');
  if (progressBar) progressBar.style.width = `${journeyProgress}%`;
  
  // Update states count
  const statesCount = document.getElementById('states-count');
  if (statesCount) statesCount.textContent = `${visitedStates.length}/48`;
}

function updateStateCollection() {
  // Get the states grid
  const statesGrid = document.getElementById('states-grid');
  if (!statesGrid) return;
  
  // If we haven't created the state elements yet, do so
  if (Object.keys(stateElements).length === 0) {
    // All 48 continental states with abbreviations
    const states = [
      { abbr: 'AL', name: 'Alabama' },
      { abbr: 'AZ', name: 'Arizona' },
      { abbr: 'AR', name: 'Arkansas' },
      { abbr: 'CA', name: 'California' },
      { abbr: 'CO', name: 'Colorado' },
      { abbr: 'CT', name: 'Connecticut' },
      { abbr: 'DE', name: 'Delaware' },
      { abbr: 'FL', name: 'Florida' },
      { abbr: 'GA', name: 'Georgia' },
      { abbr: 'ID', name: 'Idaho' },
      { abbr: 'IL', name: 'Illinois' },
      { abbr: 'IN', name: 'Indiana' },
      { abbr: 'IA', name: 'Iowa' },
      { abbr: 'KS', name: 'Kansas' },
      { abbr: 'KY', name: 'Kentucky' },
      { abbr: 'LA', name: 'Louisiana' },
      { abbr: 'ME', name: 'Maine' },
      { abbr: 'MD', name: 'Maryland' },
      { abbr: 'MA', name: 'Massachusetts' },
      { abbr: 'MI', name: 'Michigan' },
      { abbr: 'MN', name: 'Minnesota' },
      { abbr: 'MS', name: 'Mississippi' },
      { abbr: 'MO', name: 'Missouri' },
      { abbr: 'MT', name: 'Montana' },
      { abbr: 'NE', name: 'Nebraska' },
      { abbr: 'NV', name: 'Nevada' },
      { abbr: 'NH', name: 'New Hampshire' },
      { abbr: 'NJ', name: 'New Jersey' },
      { abbr: 'NM', name: 'New Mexico' },
      { abbr: 'NY', name: 'New York' },
      { abbr: 'NC', name: 'North Carolina' },
      { abbr: 'ND', name: 'North Dakota' },
      { abbr: 'OH', name: 'Ohio' },
      { abbr: 'OK', name: 'Oklahoma' },
      { abbr: 'OR', name: 'Oregon' },
      { abbr: 'PA', name: 'Pennsylvania' },
      { abbr: 'RI', name: 'Rhode Island' },
      { abbr: 'SC', name: 'South Carolina' },
      { abbr: 'SD', name: 'South Dakota' },
      { abbr: 'TN', name: 'Tennessee' },
      { abbr: 'TX', name: 'Texas' },
      { abbr: 'UT', name: 'Utah' },
      { abbr: 'VT', name: 'Vermont' },
      { abbr: 'VA', name: 'Virginia' },
      { abbr: 'WA', name: 'Washington' },
      { abbr: 'WV', name: 'West Virginia' },
      { abbr: 'WI', name: 'Wisconsin' },
      { abbr: 'WY', name: 'Wyoming' }
    ];
    
    // Create elements for each state
    states.forEach(state => {
      const stateElement = document.createElement('div');
      stateElement.className = 'state-badge';
      stateElement.innerHTML = `
        <div class="state-abbr">${state.abbr}</div>
        <div class="state-name">${state.name}</div>
      `;
      statesGrid.appendChild(stateElement);
      stateElements[state.name] = stateElement;
    });
  }
  
  // Update the state elements based on visited states
  visitedStates.forEach(state => {
    if (stateElements[state]) {
      stateElements[state].classList.add('collected');
    }
  });
}

function updateTimelineEntries(tripData) {
  if (!tripData || !tripData.timeline) return;
  
  const timelineContainer = document.getElementById('timeline-entries');
  if (!timelineContainer) return;
  
  // Clear existing entries
  timelineContainer.innerHTML = '';
  
  // Add timeline entries
  tripData.timeline.forEach((entry, index) => {
    const timelineEntry = document.createElement('div');
    timelineEntry.className = 'timeline-entry';
    if (index === 0) timelineEntry.classList.add('current');
    
    timelineEntry.innerHTML = `
      <h4>${entry.location}</h4>
      <p>${new Date(entry.date).toLocaleDateString()}</p>
      <p>${entry.description || ''}</p>
    `;
    
    timelineContainer.appendChild(timelineEntry);
  });
}

// --------------------------
// DATA FETCHING
// --------------------------
async function fetchTripData() {
  try {
    const response = await fetch(ENDPOINT);
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Save current data
    currentData = data;
    
    // Handle errors
    if (data.error) {
      console.error('API Error:', data.error);
      return;
    }
    
    // Update all visualizations
    updateVehicleVisualization(data.vehicle || {});
    updateWeatherVisualization(data.weather || {});
    updateTripInfo(data.trip || {}, data.location || {});
    
    // Update map with location and route
    if (data.location && data.location.currentLat && data.location.currentLng) {
      updateMapLocation(data.location.currentLat, data.location.currentLng);
    }
    
    // Update map with route
    if (data.trip && data.trip.route) {
      updateMapWithRoute(data.trip.route);
    }
    
    // Update timeline
    if (data.trip && data.trip.timeline) {
      updateTimelineEntries(data.trip);
    }
    
  } catch (err) {
    console.error('Failed to fetch trip data', err);
    
    // Show error state in UI
    document.getElementById('current').textContent = 'Connection error';
    document.getElementById('next').textContent = 'Connection error';
    document.getElementById('eta').textContent = '--:--';
  }
}

// --------------------------
// LIGHTBOX
// --------------------------
function initializeLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');
  
  // Close lightbox when clicking close button or outside the image
  lightboxClose.addEventListener('click', () => {
    lightbox.setAttribute('aria-hidden', 'true');
  });
  
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      lightbox.setAttribute('aria-hidden', 'true');
    }
  });
  
  // Open lightbox when clicking gallery items
  const galleryItems = document.querySelectorAll('.gallery-item');
  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      lightboxImg.src = item.src;
      lightboxImg.alt = item.alt;
      lightbox.setAttribute('aria-hidden', 'false');
    });
    
    // Keyboard accessibility
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        lightboxImg.src = item.src;
        lightboxImg.alt = item.alt;
        lightbox.setAttribute('aria-hidden', 'false');
      }
    });
  });
}

// --------------------------
// LOGS AND COMMENTS MANAGEMENT
// --------------------------
function initializeLogsManagement() {
  const logForm = document.getElementById('log-form');
  const logList = document.getElementById('log-list');
  
  if (!logForm || !logList) return;
  
  let logs = JSON.parse(localStorage.getItem('tripLogs') || '[]');
  
  function renderLogs() {
    logList.innerHTML = '';
    logs.forEach((log, index) => {
      const entry = document.createElement('article');
      entry.className = 'log-entry';
      
      entry.innerHTML = `
        <h3>${log.title}</h3>
        <p>${log.content}</p>
        <button aria-label="Delete log" data-index="${index}">&times;</button>
      `;
      
      logList.appendChild(entry);
    });
    
    // Add delete handlers
    logList.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        logs.splice(index, 1);
        localStorage.setItem('tripLogs', JSON.stringify(logs));
        renderLogs();
      });
    });
  }
  
  logForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = logForm.querySelector('#log-title').value.trim();
    const content = logForm.querySelector('#log-content').value.trim();
    
    if (title && content) {
      logs.push({
        title,
        content,
        date: new Date().toISOString()
      });
      
      localStorage.setItem('tripLogs', JSON.stringify(logs));
      logForm.reset();
      renderLogs();
    }
  });
  
  // Initial render
  renderLogs();
}

function initializeCommentsManagement() {
  const commentForm = document.getElementById('comment-form');
  const commentList = document.getElementById('comment-list');
  
  if (!commentForm || !commentList) return;
  
  let comments = JSON.parse(localStorage.getItem('tripComments') || '[]');
  
  function renderComments() {
    commentList.innerHTML = '';
    comments.forEach(comment => {
      const li = document.createElement('li');
      li.textContent = comment;
      commentList.appendChild(li);
    });
  }
  
  commentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const text = commentForm.querySelector('input[name="comment-text"]').value.trim();
    
    if (text) {
      comments.push(text);
      localStorage.setItem('tripComments', JSON.stringify(comments));
      commentForm.reset();
      renderComments();
    }
  });
  
  // Initial render
  renderComments();
}

// --------------------------
// INITIALIZATION
// --------------------------
function initialize() {
  // Start loading sequence
  initializeLoadingSequence();
  
  // Initialize map
  initializeMap();
  
  // Initialize UI components
  initializePanelManagement();
  initializeLightbox();
  initializeLogsManagement();
  initializeCommentsManagement();
  
  // Fetch initial data
  fetchTripData();
  
  // Set up data refresh interval
  setInterval(fetchTripData, 30 * 1000); // Refresh every 30 seconds
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initialize);

// Track page visibility for optimal refresh
document.addEventListener('visibilitychange', () => {
  // Pause refresh when page is hidden, resume when visible
  if (document.visibilityState === 'visible') {
    fetchTripData(); // Fetch fresh data immediately when returning to tab
  }
});
