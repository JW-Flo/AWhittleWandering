/**
 * MapBox Component for 48 Continental USA Trip
 * 
 * This module provides enhanced map functionality using our MapBox service,
 * including advanced routing, weather overlays, and state boundary highlighting.
 * 
 * Weather Integration Interface:
 * This component exposes methods for weather overlay integration:
 * - registerOverlayLayer(layer): Registers a new overlay layer with the map
 * - setLayerVisibility(layerId, visible): Sets visibility of a specific layer
 * - setLayerOpacity(layerId, opacity): Sets opacity of a specific layer
 * - getCurrentViewport(): Returns current map viewport (bounds, zoom, etc.)
 * - getRouteCoordinates(): Returns current route coordinates for weather along route
 * - addRouteAlert(alert, position): Adds an alert marker at a specific position on the route
 */

/* eslint-env browser */
/* global mapboxgl */

import mapService from '../../../shared/mapbox/mapService.js';
import mapboxConfig from '../../../shared/mapbox/mapboxConfig.js';

class MapboxComponent {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = {
      style: mapboxConfig.mapStyles.dark,
      center: [-98.5795, 39.8283], // Center of US
      zoom: 3.5,
      pitch: 0,
      bearing: 0,
      ...options
    };
    
    this.map = null;
    this.vehicleMarker = null;
    this.routeLineDrawn = false;
    this.weatherOverlay = false;
    this.stateHighlights = {};
    this.currentStateLayer = null;
    this.isMapLoaded = false;
    this.visitedStates = [];
    this.stateMarkers = [];
    this.routeAnimationId = null;
    this.tripData = null;
    this.weatherData = null;
    this.currentVehiclePosition = null;
    
    // Overlay layers registry
    this.overlayLayers = {};
    this.weatherAlertMarkers = [];
    
    // Bind methods to this instance
    this.initialize = this.initialize.bind(this);
    this.updateMap = this.updateMap.bind(this);
    this.updateVehiclePosition = this.updateVehiclePosition.bind(this);
    this.updateRoute = this.updateRoute.bind(this);
    this.toggleWeatherOverlay = this.toggleWeatherOverlay.bind(this);
    this.toggleStateHighlights = this.toggleStateHighlights.bind(this);
    this.toggleTrafficLayer = this.toggleTrafficLayer.bind(this);
    this.toggleSatelliteView = this.toggleSatelliteView.bind(this);
    this.flyToState = this.flyToState.bind(this);
    this.flyToCoordinates = this.flyToCoordinates.bind(this);
    this.addStateMarker = this.addStateMarker.bind(this);
    this.updateRouteInfo = this.updateRouteInfo.bind(this);
    this.setTripData = this.setTripData.bind(this);
    this.setWeatherData = this.setWeatherData.bind(this);
    this.createWeatherMarker = this.createWeatherMarker.bind(this);
    this.animateRoute = this.animateRoute.bind(this);
    
    // Weather overlay integration methods
    this.registerOverlayLayer = this.registerOverlayLayer.bind(this);
    this.setLayerVisibility = this.setLayerVisibility.bind(this);
    this.setLayerOpacity = this.setLayerOpacity.bind(this);
    this.getCurrentViewport = this.getCurrentViewport.bind(this);
    this.getRouteCoordinates = this.getRouteCoordinates.bind(this);
    this.addRouteAlert = this.addRouteAlert.bind(this);
    this.removeRouteAlert = this.removeRouteAlert.bind(this);
    this.addWeatherOverlay = this.addWeatherOverlay.bind(this);
  }

  /**
   * Initialize the map
   */
  initialize() {
    // Check if mapboxgl is available
    if (!mapboxgl) {
      console.error('MapBox GL JS is not loaded');
      return;
    }
    
    // Get MapBox token
    mapboxgl.accessToken = mapboxConfig.getMapboxToken() || 
      document.querySelector('meta[name="mapbox-token"]')?.getAttribute('content');
    
    if (!mapboxgl.accessToken) {
      console.error('MapBox token is not available');
      return;
    }
    
    // Create map instance
    this.map = new mapboxgl.Map({
      container: this.containerId,
      style: this.options.style,
      center: this.options.center,
      zoom: this.options.zoom,
      pitch: this.options.pitch,
      bearing: this.options.bearing,
      attributionControl: false,
      logoPosition: 'bottom-right'
    });
    
    // Add minimal attribution
    this.map.addControl(new mapboxgl.AttributionControl({
      compact: true,
      customAttribution: '© 48Continental 2025'
    }), 'bottom-right');
    
    // Add navigation controls
    this.map.addControl(new mapboxgl.NavigationControl({
      showCompass: true,
      showZoom: true,
      visualizePitch: true
    }), 'bottom-right');
    
    // Add scale control
    this.map.addControl(new mapboxgl.ScaleControl({
      maxWidth: 100,
      unit: 'imperial'
    }), 'bottom-left');
    
    // Add geolocate control
    this.map.addControl(new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: false,
      showUserHeading: true
    }), 'bottom-right');
    
    // Create vehicle marker with custom Tesla icon
    this.vehicleMarker = new mapboxgl.Marker({
      color: '#00a67e', // Tesla green
      scale: 1.2
    }).setLngLat(this.options.center).addTo(this.map);
    
    // Set up map layers when map loads
    this.map.on('load', () => {
      this.isMapLoaded = true;
      this.setupMapLayers();
      
      // Emit loaded event
      const event = new CustomEvent('mapboxComponent:loaded', {
        detail: { map: this.map }
      });
      document.dispatchEvent(event);
    });
    
    // Handle map interactions
    this.map.on('click', this.handleMapClick.bind(this));
  }
  
  /**
   * Set up map layers
   */
  setupMapLayers() {
    if (!this.map || !this.isMapLoaded) return;
    
    // Add source for route line
    this.map.addSource('route', {
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
    this.map.addLayer({
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
    
    // Add route glow effect
    this.map.addLayer({
      id: 'route-glow',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#ffffff',
        'line-width': 9,
        'line-opacity': 0.1
      }
    }, 'route-line');
    
    // Add animated route progress layer
    this.map.addLayer({
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
    
    // Add elevation profile if available in mapbox-gl-js
    if (mapboxgl.TerrainControl) {
      this.map.addControl(new mapboxgl.TerrainControl());
    }
    
    // Add source for state markers
    this.map.addSource('states-visited', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
    
    // Add layer for state markers
    this.map.addLayer({
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
    
    // Add layer for state labels
    this.map.addLayer({
      id: 'states-labels',
      type: 'symbol',
      source: 'states-visited',
      layout: {
        'text-field': ['get', 'state'],
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 12,
        'text-offset': [0, 1.5],
        'text-anchor': 'top'
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#000000',
        'text-halo-width': 1
      }
    });
    
    // Add empty weather source (will be populated later)
    this.map.addSource('weather-data', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
    
    // Add weather marker layer
    this.map.addLayer({
      id: 'weather-markers',
      type: 'symbol',
      source: 'weather-data',
      layout: {
        'icon-image': ['get', 'icon'],
        'icon-size': 0.75,
        'icon-allow-overlap': true
      }
    });
  }
  
  /**
   * Update the map with new trip data
   * @param {Object} data - Trip data including vehicle, weather, location and route info
   */
  updateMap(data) {
    if (!this.map || !this.isMapLoaded) return;
    
    this.tripData = data;
    
    // Update vehicle position
    if (data.location && data.location.currentLat && data.location.currentLng) {
      this.updateVehiclePosition(data.location.currentLat, data.location.currentLng);
    }
    
    // Update route
    if (data.trip && data.trip.route) {
      this.updateRoute(data.trip.route);
    }
    
    // Update weather data
    if (data.weather) {
      this.setWeatherData(data.weather, data.location);
    }
    
    // Track visited states
    if (data.trip && data.trip.visitedStates) {
      this.updateVisitedStates(data.trip.visitedStates, data.location);
    }
  }
  
  /**
   * Update vehicle position on the map
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {Object} options - Options for updating position
   */
  updateVehiclePosition(lat, lng, options = {}) {
    if (!this.map || !this.vehicleMarker) return;
    
    const defaultOptions = {
      animate: true,
      duration: 2000,
      zoom: null,
      fitBounds: false
    };
    
    const opts = { ...defaultOptions, ...options };
    this.currentVehiclePosition = [lng, lat];
    
    // Update marker position
    this.vehicleMarker.setLngLat([lng, lat]);
    
    // Animate map to new position
    if (opts.animate) {
      this.map.flyTo({
        center: [lng, lat],
        zoom: opts.zoom || this.map.getZoom(),
        speed: 0.3,
        curve: 1,
        essential: true,
        duration: opts.duration
      });
    } else {
      // Set position without animation
      this.map.setCenter([lng, lat]);
      if (opts.zoom) {
        this.map.setZoom(opts.zoom);
      }
    }
    
    // Emit position updated event
    const event = new CustomEvent('mapboxComponent:positionUpdated', {
      detail: { position: [lng, lat] }
    });
    document.dispatchEvent(event);
  }
  
  /**
   * Update route line on the map
   * @param {Object} routeData - GeoJSON route data
   */
  updateRoute(routeData) {
    if (!this.map || !this.isMapLoaded) return;
    
    // If we have route coordinates, update the route line
    if (routeData && routeData.coordinates && routeData.coordinates.length > 0) {
      this.map.getSource('route').setData({
        type: 'Feature',
        properties: {},
        geometry: routeData
      });
      
      // If this is the first time drawing the route, fit bounds
      if (!this.routeLineDrawn) {
        const bounds = new mapboxgl.LngLatBounds();
        routeData.coordinates.forEach(coord => {
          bounds.extend(coord);
        });
        this.map.fitBounds(bounds, { padding: 100 });
        this.routeLineDrawn = true;
        
        // Animate the route line
        this.animateRoute();
      }
      
      // Emit route updated event
      const event = new CustomEvent('mapboxComponent:routeUpdated', {
        detail: { route: routeData }
      });
      document.dispatchEvent(event);
    }
  }
  
  /**
   * Animate the route line with a moving dash array
   */
  animateRoute() {
    // Cancel any existing animation
    if (this.routeAnimationId) {
      cancelAnimationFrame(this.routeAnimationId);
    }
    
    // Define dash array sequence for animation
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
    
    let step = 0;
    const animate = () => {
      step = (step + 1) % dashArraySequence.length;
      this.map.setPaintProperty('route-progress', 'line-dasharray', dashArraySequence[step]);
      this.routeAnimationId = requestAnimationFrame(animate);
    };
    
    animate();
  }
  
  /**
   * Toggle weather overlay on the map
   * @param {boolean} show - Whether to show or hide the overlay
   */
  toggleWeatherOverlay(show = true) {
    this.weatherOverlay = show;
    
    if (!this.map || !this.isMapLoaded) return;
    
    // Toggle visibility of weather markers layer
    this.map.setLayoutProperty(
      'weather-markers',
      'visibility',
      show ? 'visible' : 'none'
    );
    
    // Emit weather overlay toggled event
    const event = new CustomEvent('mapboxComponent:weatherOverlayToggled', {
      detail: { visible: show }
    });
    document.dispatchEvent(event);
    
    // If showing and we have weather data, update it
    if (show && this.weatherData && this.currentVehiclePosition) {
      this.setWeatherData(this.weatherData);
    }
  }
  
  /**
   * Set weather data for overlay
   * @param {Object} weatherData - Weather data to display
   * @param {Object} locationData - Current location data
   */
  setWeatherData(weatherData, locationData) {
    this.weatherData = weatherData;
    
    if (!this.map || !this.isMapLoaded || !this.weatherOverlay) return;
    
    // Create GeoJSON for weather overlay
    const weatherFeatures = [];
    
    // Add current location weather
    if (locationData && locationData.currentLat && locationData.currentLng) {
      weatherFeatures.push(this.createWeatherMarker(
        locationData.currentLng,
        locationData.currentLat,
        weatherData
      ));
    }
    
    // Update weather data source
    this.map.getSource('weather-data').setData({
      type: 'FeatureCollection',
      features: weatherFeatures
    });
  }
  
  /**
   * Create a weather marker feature
   * @param {number} lng - Longitude
   * @param {number} lat - Latitude
   * @param {Object} weatherData - Weather data
   * @returns {Object} GeoJSON Feature
   */
  createWeatherMarker(lng, lat, weatherData) {
    // Map weather condition to icon
    const getWeatherIcon = (condition, iconCode) => {
      if (iconCode) {
        return iconCode;
      }
      
      // Map condition to icon if no code provided
      const conditionMap = {
        'Clear': 'clear-day',
        'Sunny': 'clear-day',
        'Partly Cloudy': 'partly-cloudy-day',
        'Cloudy': 'cloudy',
        'Rain': 'rain',
        'Snow': 'snow',
        'Thunderstorm': 'thunderstorm',
        'Fog': 'fog'
      };
      
      return conditionMap[condition] || 'clear-day';
    };
    
    // Create weather feature
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      properties: {
        temperature: weatherData.temperature,
        condition: weatherData.condition,
        icon: getWeatherIcon(weatherData.condition, weatherData.icon),
        humidity: weatherData.humidity,
        windSpeed: weatherData.windSpeed
      }
    };
  }
  
  /**
   * Toggle state boundaries highlighting
   * @param {boolean} show - Whether to show or hide state boundaries
   */
  toggleStateHighlights(show = true) {
    if (!this.map || !this.isMapLoaded) return;
    
    // Implementation depends on having state boundary GeoJSON data
    // For now, just toggle visibility of our state markers
    this.map.setLayoutProperty(
      'states-markers',
      'visibility',
      show ? 'visible' : 'none'
    );
    
    this.map.setLayoutProperty(
      'states-labels',
      'visibility',
      show ? 'visible' : 'none'
    );
  }
  
  /**
   * Toggle traffic layer on the map
   * @param {boolean} show - Whether to show or hide traffic
   */
  toggleTrafficLayer(show = true) {
    if (!this.map || !this.isMapLoaded) return;
    
    const trafficLayerId = 'mapbox-traffic';
    
    // Check if layer already exists
    if (show && !this.map.getLayer(trafficLayerId)) {
      // Add traffic layer
      this.map.addLayer({
        id: trafficLayerId,
        type: 'line',
        source: {
          type: 'vector',
          url: 'mapbox://mapbox.mapbox-traffic-v1'
        },
        'source-layer': 'traffic',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-width': 1.5,
          'line-color': [
            'match',
            ['get', 'congestion'],
            'low', '#4CE62A',        // Green for low congestion
            'moderate', '#F8C429',   // Yellow for moderate congestion
            'heavy', '#FF7F00',      // Orange for heavy congestion
            'severe', '#E6230E',     // Red for severe congestion
            '#4CE62A'                // Default to green
          ]
        },
        metadata: {
          'custom-layer': 'traffic'
        }
      }, 'road-label');
    } else if (!show && this.map.getLayer(trafficLayerId)) {
      // Remove traffic layer
      this.map.removeLayer(trafficLayerId);
    }
  }
  
  /**
   * Toggle satellite view
   * @param {boolean} show - Whether to show satellite imagery
   */
  toggleSatelliteView(show = true) {
    if (!this.map || !this.isMapLoaded) return;
    
    // Change map style
    this.map.setStyle(show ? mapboxConfig.mapStyles.satellite : mapboxConfig.mapStyles.dark);
    
    // When style changes, we need to re-add layers when the style loads
    this.map.once('style.load', () => {
      this.setupMapLayers();
      
      // Re-add any data we had
      if (this.tripData) {
        this.updateMap(this.tripData);
      }
    });
  }
  
  /**
   * Fly to a specific state
   * @param {string} stateName - Name of the state to fly to
   */
  async flyToState(stateName) {
    if (!this.map) return;
    
    try {
      // Use geocoding to find state coordinates
      const response = await mapService.geocode(stateName, {
        types: 'region',
        country: 'us'
      });
      
      if (response.features && response.features.length > 0) {
        const feature = response.features[0];
        
        // Fly to state
        this.map.fitBounds([
          [feature.bbox[0], feature.bbox[1]], // SW corner
          [feature.bbox[2], feature.bbox[3]]  // NE corner
        ], { padding: 50 });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error flying to state', error);
      return false;
    }
  }
  
  /**
   * Fly to specific coordinates
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} zoom - Zoom level
   */
  flyToCoordinates(lng, lat, zoom = 10) {
    if (!this.map) return;
    
    this.map.flyTo({
      center: [lng, lat],
      zoom: zoom,
      speed: 0.6,
      curve: 1,
      essential: true
    });
  }
  
  /**
   * Add a marker for a visited state
   * @param {string} state - State name
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   */
  addStateMarker(state, lat, lng) {
    if (!this.map || !this.isMapLoaded || !this.map.getSource('states-visited')) return;
    
    // Check if we already have this state
    if (this.visitedStates.includes(state)) return;
    
    // Add to visited states
    this.visitedStates.push(state);
    
    // Get current state markers
    const currentFeatures = this.map.getSource('states-visited')._data.features || [];
    
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
    this.map.getSource('states-visited').setData({
      type: 'FeatureCollection',
      features: currentFeatures
    });
    
    // Emit state visited event
    const event = new CustomEvent('mapboxComponent:stateVisited', {
      detail: { state, position: [lng, lat] }
    });
    document.dispatchEvent(event);
  }
  
  /**
   * Register a new overlay layer with the map
   * @param {Object} layer - Layer configuration
   * @returns {string} - Layer ID
   */
  registerOverlayLayer(layer) {
    if (!this.map || !this.isMapLoaded) return null;
    
    const layerId = layer.id || `overlay-${Date.now()}`;
    
    // Check if source exists, create if not
    if (!this.map.getSource(layer.source.id)) {
      this.map.addSource(layer.source.id, layer.source.config);
    }
    
    // Add layer to map
    this.map.addLayer({
      id: layerId,
      type: layer.type,
      source: layer.source.id,
      layout: layer.layout || {},
      paint: layer.paint || {},
      minzoom: layer.minzoom,
      maxzoom: layer.maxzoom
    });
    
    // Store in registry
    this.overlayLayers[layerId] = layer;
    
    // Emit event
    const event = new CustomEvent('mapboxComponent:overlayAdded', {
      detail: { layerId, layer }
    });
    document.dispatchEvent(event);
    
    return layerId;
  }
  
  /**
   * Set visibility of a specific layer
   * @param {string} layerId - ID of the layer
   * @param {boolean} visible - Whether the layer should be visible
   */
  setLayerVisibility(layerId, visible) {
    if (!this.map || !this.isMapLoaded) return;
    
    const visibility = visible ? 'visible' : 'none';
    this.map.setLayoutProperty(layerId, 'visibility', visibility);
  }
  
  /**
   * Set opacity of a specific layer
   * @param {string} layerId - ID of the layer
   * @param {number} opacity - Opacity value (0-1)
   */
  setLayerOpacity(layerId, opacity) {
    if (!this.map || !this.isMapLoaded) return;
    
    // Determine layer type to set the right property
    const layer = this.map.getLayer(layerId);
    if (!layer) return;
    
    const opacityProp = {
      'fill': 'fill-opacity',
      'line': 'line-opacity',
      'circle': 'circle-opacity',
      'symbol': 'icon-opacity',
      'raster': 'raster-opacity',
      'heatmap': 'heatmap-opacity'
    }[layer.type] || 'opacity';
    
    this.map.setPaintProperty(layerId, opacityProp, opacity);
  }
  
  /**
   * Get current map viewport
   * @returns {Object} Viewport information
   */
  getCurrentViewport() {
    if (!this.map) return null;
    
    const bounds = this.map.getBounds();
    return {
      bounds: [
        [bounds.getWest(), bounds.getSouth()],
        [bounds.getEast(), bounds.getNorth()]
      ],
      zoom: this.map.getZoom(),
      center: this.map.getCenter().toArray(),
      bearing: this.map.getBearing(),
      pitch: this.map.getPitch()
    };
  }
  
  /**
   * Get current route coordinates
   * @returns {Array} Array of coordinates
   */
  getRouteCoordinates() {
    if (!this.map || !this.isMapLoaded) return [];
    
    const routeSource = this.map.getSource('route');
    if (!routeSource || !routeSource._data) return [];
    
    return routeSource._data.geometry.coordinates || [];
  }
  
  /**
   * Add a weather alert marker to the route
   * @param {Object} alert - Alert information
   * @param {Array} position - [lng, lat] coordinates
   * @returns {Object} Marker reference
   */
  addRouteAlert(alert, position) {
    if (!this.map) return null;
    
    // Create marker element
    const el = document.createElement('div');
    el.className = `weather-alert-marker severity-${alert.severity}`;
    el.innerHTML = `<div class="alert-icon">${alert.icon || '⚠️'}</div>`;
    
    // Create popup
    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: true,
      closeOnClick: true
    }).setHTML(`
      <div class="weather-alert-popup">
        <h3>${alert.type}</h3>
        <p>${alert.message}</p>
      </div>
    `);
    
    // Create and add marker
    const marker = new mapboxgl.Marker(el)
      .setLngLat(position)
      .setPopup(popup)
      .addTo(this.map);
    
    // Store marker reference
    this.weatherAlertMarkers.push({
      id: alert.id || `alert-${Date.now()}`,
      marker
    });
    
    return marker;
  }
  
  /**
   * Remove a weather alert marker
   * @param {string} alertId - ID of the alert to remove
   */
  removeRouteAlert(alertId) {
    const alertIndex = this.weatherAlertMarkers.findIndex(alert => alert.id === alertId);
    
    if (alertIndex >= 0) {
      // Remove marker from map
      this.weatherAlertMarkers[alertIndex].marker.remove();
      
      // Remove from array
      this.weatherAlertMarkers.splice(alertIndex, 1);
    }
  }
  
  /**
   * Add a weather overlay to the map
   * @param {string} type - Type of overlay ('radar', 'temperature', 'precipitation', etc.)
   * @param {Object} data - Overlay data
   * @param {Object} options - Display options
   * @returns {string} Layer ID
   */
  addWeatherOverlay(type, data, options = {}) {
    if (!this.map || !this.isMapLoaded) return null;
    
    const sourceId = `weather-${type}`;
    const layerId = `weather-${type}-layer`;
    
    // Set up source and layer based on overlay type
    switch (type) {
      case 'radar':
        // Add radar as raster layer
        if (!this.map.getSource(sourceId)) {
          this.map.addSource(sourceId, {
            type: 'raster',
            tiles: data.tiles,
            tileSize: 256,
            attribution: data.attribution
          });
        }
        
        if (!this.map.getLayer(layerId)) {
          this.map.addLayer({
            id: layerId,
            type: 'raster',
            source: sourceId,
            paint: {
              'raster-opacity': options.opacity || 0.7,
              'raster-fade-duration': 0
            }
          });
        }
        break;
        
      case 'temperature':
        // Add temperature as fill layer with data-driven styling
        if (!this.map.getSource(sourceId)) {
          this.map.addSource(sourceId, {
            type: 'geojson',
            data: data
          });
        } else {
          this.map.getSource(sourceId).setData(data);
        }
        
        if (!this.map.getLayer(layerId)) {
          this.map.addLayer({
            id: layerId,
            type: 'fill',
            source: sourceId,
            paint: {
              'fill-color': [
                'interpolate',
                ['linear'],
                ['get', 'temperature'],
                -20, '#0022FF',  // Very cold (deep blue)
                0, '#00AAFF',    // Freezing (light blue)
                32, '#FFFFFF',   // Freezing point (white)
                50, '#FFFF00',   // Cool (yellow)
                70, '#FF7700',   // Warm (orange)
                90, '#FF0000',   // Hot (red)
                110, '#990000'   // Very hot (dark red)
              ],
              'fill-opacity': options.opacity || 0.6
            }
          });
        }
        break;
        
      case 'precipitation':
        // Add precipitation as circle layer
        if (!this.map.getSource(sourceId)) {
          this.map.addSource(sourceId, {
            type: 'geojson',
            data: data
          });
        } else {
          this.map.getSource(sourceId).setData(data);
        }
        
        if (!this.map.getLayer(layerId)) {
          this.map.addLayer({
            id: layerId,
            type: 'circle',
            source: sourceId,
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['get', 'intensity'],
                0, 3,
                1, 15
              ],
              'circle-color': [
                'interpolate',
                ['linear'],
                ['get', 'intensity'],
                0, 'rgba(0, 255, 255, 0.5)',
                0.5, 'rgba(0, 0, 255, 0.5)',
                1, 'rgba(128, 0, 128, 0.5)'
              ],
              'circle-opacity': options.opacity || 0.7
            }
          });
        }
        break;
        
      default:
        // Generic GeoJSON overlay
        if (!this.map.getSource(sourceId)) {
          this.map.addSource(sourceId, {
            type: 'geojson',
            data: data
          });
        } else {
          this.map.getSource(sourceId).setData(data);
        }
        
        if (!this.map.getLayer(layerId)) {
          this.map.addLayer({
            id: layerId,
            type: options.layerType || 'fill',
            source: sourceId,
            paint: options.paint || {
              'fill-color': '#00FF00',
              'fill-opacity': 0.5
            }
          });
        }
    }
    
    // Store in registry
    this.overlayLayers[layerId] = {
      id: layerId,
      type: type,
      sourceId
    };
    
    // Return layer ID for future reference
    return layerId;
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    // Cancel animations
    if (this.routeAnimationId) {
      cancelAnimationFrame(this.routeAnimationId);
    }
    
    // Remove all weather alert markers
    this.weatherAlertMarkers.forEach(alert => {
      alert.marker.remove();
    });
    this.weatherAlertMarkers = [];
    
    // Remove map
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
  
  /**
   * Update route information from MapBox Directions API
   * @param {[number, number][]} waypoints - Array of waypoint coordinates [lng, lat]
   */
  async updateRouteInfo(waypoints) {
    if (!waypoints || waypoints.length < 2) return;
    
    try {
      // Get directions from MapBox API
      const response = await mapService.getDirections(waypoints, {
        profile: 'driving',
        geometries: 'geojson',
        steps: true,
        overview: 'full',
        annotations: 'duration,distance,speed'
      });
      
      if (response.routes && response.routes.length > 0) {
        const route = response.routes[0];
        
        // Update map with route
        this.updateRoute({
          type: 'LineString',
          coordinates: route.geometry.coordinates
        });
        
        // Return route information
        return {
          distance: route.distance,
          duration: route.duration,
          geometry: route.geometry,
          legs: route.legs
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting directions', error);
      return null;
    }
  }
  
  /**
   * Set trip data
   * @param {Object} data - Trip data
   */
  setTripData(data) {
    this.tripData = data;
    this.updateMap(data);
  }
  
  /**
   * Handle map click events
   * @param {Object} e - Click event
   */
  handleMapClick(e) {
    // Emit clicked event
    const event = new CustomEvent('mapboxComponent:clicked', {
      detail: { 
        lngLat: e.lngLat,
        point: e.point
      }
    });
    document.dispatchEvent(event);
  }
  
}

export default MapboxComponent;
