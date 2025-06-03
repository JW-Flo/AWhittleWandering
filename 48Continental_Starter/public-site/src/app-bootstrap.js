/**
 * 48 Continental USA Application Bootstrap
 * 
 * This module initializes all components and data sources for the application,
 * orchestrating the flow of real-time data between different modules.
 */

/* eslint-env browser */
/* global mapboxgl */

// Import data sources
import { fetchVehicleData, streamVehicleUpdates } from './dataSources/teslaApi.js';
import { fetchWeatherData } from './dataSources/weatherApi.js';
import { loadItinerary, getCurrentProgress } from './dataSources/itineraryLoader.js';
import { initializeMap, updateMapWithVehicle, updateMapWithRoute } from './mapInitializer.js';

// Core UI elements
let loadingScreen, mapContainer, floatingHeader, currentStatePanel, infoFooter;
let vehiclePanel, weatherPanel, journeyPanel, galleryPanel, logsPanel, commentsPanel;
let stateCollection, subscribePanel;
let weatherToggle, audioToggle, statesToggle, subscribeToggle, navControls, closePanelButtons;

// Application state
let tripData = null;
let vehicleData = null;
let weatherData = null;
let itineraryData = null;
let progressData = null;
let audioEnabled = false;
let ambientAudio = null;
let visitedStates = [];
let stateElements = {};
let journeyProgress = 0;

// Polling intervals (in milliseconds)
const VEHICLE_POLL_INTERVAL = 30 * 1000; // 30 seconds
const WEATHER_POLL_INTERVAL = 10 * 60 * 1000; // 10 minutes
const PROGRESS_POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Initialize the application
 */
async function initialize() {
  console.log('Initializing 48 Continental USA application...');
  
  // Store references to DOM elements
  cacheElements();
  
  // Start loading sequence
  initializeLoadingSequence();
  
  // Initialize UI components
  initializePanelManagement();
  initializeLightbox();
  initializeLogsManagement();
  initializeCommentsManagement();
  initializeAmbientAudio();
  
  try {
    // Initialize map (wait for initialization to complete)
    await initializeMap('map-container');
    
    // Load initial data in parallel
    const [itinerary, vehicle, weather, progress] = await Promise.allSettled([
      loadItinerary(),
      fetchVehicleData(),
      fetchWeatherData(),
      getCurrentProgress()
    ]);
    
    // Store data in global variables
    itineraryData = itinerary.status === 'fulfilled' ? itinerary.value : null;
    vehicleData = vehicle.status === 'fulfilled' ? vehicle.value : null;
    weatherData = weather.status === 'fulfilled' ? weather.value : null;
    progressData = progress.status === 'fulfilled' ? progress.value : null;
    
    // Store global data for other modules to access
    window.TRIP_DATA = {
      itinerary: itineraryData,
      vehicle: vehicleData,
      weather: weatherData,
      progress: progressData
    };
    
    // Update UI with data
    updateAll();
    
    // Set up data refresh intervals
    setupPolling();
    
    // Set up real-time vehicle updates if available
    if (typeof streamVehicleUpdates === 'function') {
      streamVehicleUpdates(handleVehicleUpdate);
    }
    
    // Hide loading screen
    hideLoadingScreen();
    
  } catch (error) {
    console.error('Error initializing application:', error);
    showErrorScreen('Failed to initialize application', error.message);
  }
}

/**
 * Cache references to DOM elements for performance
 */
function cacheElements() {
  // Core elements
  loadingScreen = document.getElementById('loading-screen');
  mapContainer = document.getElementById('map-container');
  floatingHeader = document.getElementById('floating-header');
  currentStatePanel = document.getElementById('current-state-panel');
  infoFooter = document.getElementById('info-footer');
  
  // Panel elements
  vehiclePanel = document.getElementById('vehicle-panel');
  weatherPanel = document.getElementById('weather-panel');
  journeyPanel = document.getElementById('journey-panel');
  galleryPanel = document.getElementById('gallery-panel');
  logsPanel = document.getElementById('logs-panel');
  commentsPanel = document.getElementById('comments-panel');
  stateCollection = document.getElementById('state-collection');
  subscribePanel = document.getElementById('subscribe-panel');
  
  // Control buttons
  weatherToggle = document.getElementById('weather-toggle');
  audioToggle = document.getElementById('audio-toggle');
  statesToggle = document.getElementById('states-toggle');
  subscribeToggle = document.getElementById('subscribe-toggle');
  navControls = document.querySelectorAll('.nav-control');
  closePanelButtons = document.querySelectorAll('.close-panel');
}

/**
 * Initialize loading sequence
 */
function initializeLoadingSequence() {
  // Show loading screen
  if (loadingScreen) {
    loadingScreen.style.display = 'flex';
  }
}

/**
 * Hide loading screen with animation
 */
function hideLoadingScreen() {
  if (!loadingScreen) return;
  
  // Fade out loading screen
  loadingScreen.style.opacity = 0;
  
  // Hide loading screen after animation completes
  setTimeout(() => {
    loadingScreen.style.display = 'none';
    
    // Initialize animation for header content
    const headerContent = document.querySelector('.header-content');
    if (headerContent) {
      headerContent.classList.add('fade-in');
    }
  }, 500);
}

/**
 * Show error screen
 * @param {string} title - Error title
 * @param {string} message - Error message
 */
function showErrorScreen(title, message) {
  if (!loadingScreen) return;
  
  const loadingContent = loadingScreen.querySelector('.loading-content');
  if (loadingContent) {
    loadingContent.innerHTML = `
      <h1>${title || 'Something went wrong'}</h1>
      <p>We encountered an error while loading the application.</p>
      <p class="error-details">${message || 'Unknown error'}</p>
      <button onclick="location.reload()">Try Again</button>
    `;
  }
  
  // Ensure loading screen is visible
  loadingScreen.style.display = 'flex';
  loadingScreen.style.opacity = 1;
}

/**
 * Setup data polling
 */
function setupPolling() {
  // Poll for vehicle data
  setInterval(async () => {
    try {
      const data = await fetchVehicleData();
      if (data) {
        vehicleData = data;
        window.TRIP_DATA.vehicle = data;
        updateVehicleVisualization(data);
        updateMapWithVehicle(data);
      }
    } catch (error) {
      console.error('Error polling vehicle data:', error);
    }
  }, VEHICLE_POLL_INTERVAL);
  
  // Poll for weather data
  setInterval(async () => {
    try {
      const data = await fetchWeatherData();
      if (data) {
        weatherData = data;
        window.TRIP_DATA.weather = data;
        updateWeatherVisualization(data);
      }
    } catch (error) {
      console.error('Error polling weather data:', error);
    }
  }, WEATHER_POLL_INTERVAL);
  
  // Poll for trip progress
  setInterval(async () => {
    try {
      const data = await getCurrentProgress();
      if (data) {
        progressData = data;
        window.TRIP_DATA.progress = data;
        updateTripInfo();
      }
    } catch (error) {
      console.error('Error polling progress data:', error);
    }
  }, PROGRESS_POLL_INTERVAL);
}

/**
 * Handle real-time vehicle updates from streaming API
 * @param {Object} data - Vehicle data
 */
function handleVehicleUpdate(data) {
  if (!data) return;
  
  // Update vehicle data
  vehicleData = data;
  window.TRIP_DATA.vehicle = data;
  
  // Update UI
  updateVehicleVisualization(data);
  updateMapWithVehicle(data);
}

/**
 * Update all visualizations
 */
function updateAll() {
  // Update map with route if available
  if (itineraryData && itineraryData.stops) {
    const routeCoordinates = itineraryData.stops.map(stop => [stop.longitude, stop.latitude]);
    updateMapWithRoute({
      type: 'LineString',
      coordinates: routeCoordinates
    });
  }
  
  // Update vehicle visualization
  if (vehicleData) {
    updateVehicleVisualization(vehicleData);
    updateMapWithVehicle(vehicleData);
  }
  
  // Update weather visualization
  if (weatherData) {
    updateWeatherVisualization(weatherData);
  }
  
  // Update trip info
  updateTripInfo();
  
  // Update state collection
  if (itineraryData && itineraryData.states) {
    itineraryData.states.forEach(state => {
      if (state.visited) {
        addStateToCollection(state.name);
      }
    });
  }
  
  // Update timeline
  if (itineraryData && itineraryData.timeline) {
    updateTimelineEntries(itineraryData.timeline);
  }
}

/**
 * Update vehicle visualization
 * @param {Object} data - Vehicle data
 */
function updateVehicleVisualization(data) {
  if (!data) return;
  
  // Update battery level visual
  const batteryLevel = data.batteryLevel || 0;
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
  if (range) range.textContent = `${Math.round(data.range || 0)} mi`;
  
  // Update speed
  const speed = document.getElementById('speed');
  if (speed) speed.textContent = `${data.speed || 0}`;
  
  const speedExtended = document.getElementById('speed-extended');
  if (speedExtended) speedExtended.textContent = `${data.speed || 0} mph`;
  
  // Update power
  const power = document.getElementById('power');
  if (power) power.textContent = `${data.power || 0} kW`;
  
  // Animate Tesla model based on speed
  const teslaModel = document.getElementById('tesla-model');
  if (teslaModel) {
    // Simple pulse animation based on vehicle movement
    if (data.speed > 5) {
      teslaModel.classList.add('pulse');
    } else {
      teslaModel.classList.remove('pulse');
    }
  }
}

/**
 * Update weather visualization
 * @param {Object} data - Weather data
 */
function updateWeatherVisualization(data) {
  if (!data) return;
  
  // Update weather icon
  const weatherIcon = document.getElementById('weather-icon');
  if (weatherIcon && data.icon) {
    weatherIcon.src = `https://openweathermap.org/img/wn/${data.icon}@2x.png`;
  }
  
  // Update temperature
  const temperature = document.getElementById('temperature');
  if (temperature) temperature.textContent = `${Math.round(data.temperature || 0)}°F`;
  
  const tempExtended = document.getElementById('temperature-extended');
  if (tempExtended) tempExtended.textContent = `${Math.round(data.temperature || 0)}°F`;
  
  // Update condition
  const condition = document.getElementById('weather-condition');
  if (condition) condition.textContent = data.condition || 'Unknown';
  
  // Update humidity
  const humidity = document.getElementById('humidity');
  if (humidity) humidity.textContent = `${data.humidity || 0}%`;
  
  // Update wind speed
  const windSpeed = document.getElementById('wind-speed');
  if (windSpeed) windSpeed.textContent = `${data.windSpeed || 0} mph`;
}

/**
 * Update trip information
 */
function updateTripInfo() {
  // If we have progress data, use it
  if (progressData) {
    // Update current location info
    const currentLocation = document.getElementById('current');
    if (currentLocation) currentLocation.textContent = progressData.currentStop || 'Unknown';
    
    const nextLocation = document.getElementById('next');
    if (nextLocation) nextLocation.textContent = progressData.nextStop || 'Unknown';
    
    const eta = document.getElementById('eta');
    if (eta && progressData.eta) {
      const etaDate = new Date(progressData.eta);
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
    
    // Update distance to next
    const distanceToNext = document.getElementById('distance-to-next');
    if (distanceToNext) distanceToNext.textContent = `${Math.round(progressData.distanceToNext || 0)} mi`;
    
    // Update duration to next
    const durationToNext = document.getElementById('duration-to-next');
    if (durationToNext) {
      const minutes = Math.round(progressData.durationToNext || 0);
      let formattedDuration = `${minutes} min`;
      
      // Convert to hours and minutes if more than 60 minutes
      if (minutes > 60) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        formattedDuration = `${hours} hr ${remainingMinutes} min`;
      }
      
      durationToNext.textContent = formattedDuration;
    }
    
    // Add current state to collection if available
    if (progressData.currentState) {
      addStateToCollection(progressData.currentState);
    }
  }
  
  // If we have itinerary data, use it for additional trip info
  if (itineraryData && itineraryData.stats) {
    // Update charging stops
    const chargingStops = document.getElementById('charging-stops');
    if (chargingStops) chargingStops.textContent = itineraryData.stats.chargingStops || '0';
    
    // Update states visited
    const statesVisitedElem = document.getElementById('states-visited');
    if (statesVisitedElem) statesVisitedElem.textContent = `${visitedStates.length || 0}/48`;
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

/**
 * Update journey progress visualization
 */
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

/**
 * Add a state to the collection
 * @param {string} state - State name
 */
function addStateToCollection(state) {
  // Skip if already in collection
  if (visitedStates.includes(state)) return;
  
  // Add to visited states
  visitedStates.push(state);
  
  // Update state collection UI
  updateStateCollection();
}

/**
 * Update state collection UI
 */
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

/**
 * Update timeline entries
 * @param {Array} timeline - Timeline entries
 */
function updateTimelineEntries(timeline) {
  if (!timeline) return;
  
  const timelineContainer = document.getElementById('timeline-entries');
  if (!timelineContainer) return;
  
  // Clear existing entries
  timelineContainer.innerHTML = '';
  
  // Add timeline entries
  timeline.forEach((entry, index) => {
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
  if (weatherToggle) weatherToggle.addEventListener('click', () => togglePanel('weather-panel'));
  if (statesToggle) statesToggle.addEventListener('click', () => togglePanel('state-collection'));
  if (subscribeToggle) subscribeToggle.addEventListener('click', () => togglePanel('subscribe-panel'));
  if (audioToggle) audioToggle.addEventListener('click', toggleAmbientAudio);
  
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
  if (floatingHeader) {
    if (scrollPosition > 50) {
      floatingHeader.classList.add('scrolled');
    } else {
      floatingHeader.classList.remove('scrolled');
    }
  }
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
    if (audioToggle) audioToggle.querySelector('.control-icon').textContent = '🔇';
  } else {
    ambientAudio.play().catch(e => console.log('Audio autoplay blocked', e));
    if (audioToggle) audioToggle.querySelector('.control-icon').textContent = '🔊';
  }
  
  audioEnabled = !audioEnabled;
}

// --------------------------
// LIGHTBOX
// --------------------------
function initializeLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');
  
  if (!lightbox || !lightboxImg || !lightboxClose) return;
  
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

// Subscribe form handling
document.addEventListener('DOMContentLoaded', () => {
  const subscribeForm = document.getElementById('subscribe-form');
  if (subscribeForm) {
    subscribeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const emailInput = subscribeForm.querySelector('input[name="email"]');
