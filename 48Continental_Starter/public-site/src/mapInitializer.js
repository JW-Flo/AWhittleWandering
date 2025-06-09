/**
 * Map Initializer for The Wandering Whittle
 * 
 * This module provides the MapInitializer class responsible for
 * setting up and managing the interactive map display.
 */

/* eslint-env browser */
/* global mapboxgl */

import { fetchTeslaData } from './dataSources/teslaApi.js';
import { loadItinerary } from './dataSources/itineraryLoader.js';

/**
 * MapInitializer class for setting up and managing the Mapbox map
 */
export default class MapInitializer {
  /**
   * Create a new MapInitializer instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    // Configuration options with defaults
    this.options = {
      mapElementId: 'map-container',
      mapboxToken: options.mapboxToken || window.MAPBOX_TOKEN,
      initialZoom: options.initialZoom || 5,
      maxZoom: options.maxZoom || 16,
      minZoom: options.minZoom || 3,
      refreshInterval: options.refreshInterval || 30000, // 30 seconds
      showRoute: options.showRoute !== false,
      showStops: options.showStops !== false,
      showCurrentLocation: options.showCurrentLocation !== false,
      animateMovement: options.animateMovement !== false,
      clusterStops: options.clusterStops !== false,
      ...options
    };
    
    // State properties
    this.map = null;
    this.vehicleMarker = null;
    this.routeSource = null;
    this.stopsSource = null;
    this.refreshTimer = null;
    this.currentLocation = null;
    this.routeData = null;
    this.stopData = null;
    this.isMapReady = false;
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.updateVehicleLocation = this.updateVehicleLocation.bind(this);
    this.updateRoute = this.updateRoute.bind(this);
    this.updateStops = this.updateStops.bind(this);
    this.refreshMapData = this.refreshMapData.bind(this);
    this.setupEventListeners = this.setupEventListeners.bind(this);
    this.flyToLocation = this.flyToLocation.bind(this);
    this.setMapStyle = this.setMapStyle.bind(this);
    this.toggleLayer = this.toggleLayer.bind(this);
    this.centerOnVehicle = this.centerOnVehicle.bind(this);
  }
  
  /**
   * Initialize the map and all related components
   */
  initialize() {
    // Check if mapboxgl is available
    if (!window.mapboxgl) {
      console.error('Mapbox GL JS is not available. Please include the library.');
      return;
    }
    
    // Check if we have a token
    if (!this.options.mapboxToken) {
      console.error('Mapbox token is required. Please provide a valid token.');
      return;
    }
    
    // Set the access token
    mapboxgl.accessToken = this.options.mapboxToken;
    
    // Create the map
    this.map = new mapboxgl.Map({
      container: this.options.mapElementId,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-98.5795, 39.8283], // Center of USA
      zoom: this.options.initialZoom,
      maxZoom: this.options.maxZoom,
      minZoom: this.options.minZoom,
      trackResize: true,
      attributionControl: true
    });
    
    // Add controls
    this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    this.map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    this.map.addControl(new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: false
    }), 'top-right');
    
    // Wait for map to load
    this.map.on('load', async () => {
      this.isMapReady = true;
      console.log('Map initialized successfully');
      
      // Add custom map layers and sources
      this.setupMapLayers();
      
      // Initial data load
      await this.refreshMapData();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Start refresh timer
      this.startRefreshTimer();
      
      // Dispatch event for other components
      const event = new CustomEvent('48continental:mapReady', {
        detail: { map: this.map, mapInitializer: this }
      });
      document.dispatchEvent(event);
    });
  }
  
  /**
   * Set up map layers and sources
   */
  setupMapLayers() {
    if (!this.isMapReady) return;
    
    // Add route source and layer
    this.map.addSource('route', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
    
    this.map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#007cbf',
        'line-width': 5,
        'line-opacity': 0.8
      }
    });
    
    // Add stops source and layers
    this.map.addSource('stops', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      },
      cluster: this.options.clusterStops,
      clusterMaxZoom: 12,
      clusterRadius: 40
    });
    
    // Add clustered stops layer
    if (this.options.clusterStops) {
      this.map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'stops',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            10,
            '#f1f075',
            30,
            '#f28cb1'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            10,
            25,
            30,
            30
          ]
        }
      });
      
      this.map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'stops',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        }
      });
    }
    
    // Add unclustered stops layer
    this.map.addLayer({
      id: 'unclustered-stops',
      type: 'circle',
      source: 'stops',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': [
          'match',
          ['get', 'type'],
          'supercharger', '#ff0000',
          'charging', '#ff9900',
          'overnight', '#00ccff',
          'major', '#00ff00',
          'waypoint', '#999999',
          '#7F7F7F' // default color
        ],
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });
    
    // Add stop labels
    this.map.addLayer({
      id: 'stop-labels',
      type: 'symbol',
      source: 'stops',
      filter: ['!', ['has', 'point_count']],
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12,
        'text-offset': [0, 1.5],
        'text-anchor': 'top'
      },
      paint: {
        'text-color': '#333333',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1
      }
    });
    
    // Create a custom vehicle marker
    const el = document.createElement('div');
    el.className = 'vehicle-marker';
    el.innerHTML = '<div class="vehicle-marker-icon">🚗</div>';
    
    // Add vehicle marker if showing current location
    if (this.options.showCurrentLocation) {
      this.vehicleMarker = new mapboxgl.Marker(el)
        .setLngLat([-98.5795, 39.8283]) // Start at center of USA
        .addTo(this.map);
    }
    
    // Add a popup for the vehicle marker
    if (this.vehicleMarker) {
      this.vehicleMarker.setPopup(new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        closeOnClick: true
      }).setHTML('<div class="vehicle-popup">Current Location</div>'));
    }
    
    // Get references to the sources for easier updates
    this.routeSource = this.map.getSource('route');
    this.stopsSource = this.map.getSource('stops');
  }
  
  /**
   * Start the refresh timer for real-time updates
   */
  startRefreshTimer() {
    // Clear any existing timer
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    // Set up new timer
    this.refreshTimer = setInterval(this.refreshMapData, this.options.refreshInterval);
  }
  
  /**
   * Refresh all map data (vehicle location, route, stops)
   */
  async refreshMapData() {
    try {
      // Fetch data in parallel
      const [teslaData, itineraryData] = await Promise.allSettled([
        fetchTeslaData(),
        loadItinerary()
      ]);
      
      // Update vehicle location if data is available
      if (teslaData.status === 'fulfilled' && teslaData.value) {
        this.updateVehicleLocation(teslaData.value);
      }
      
      // Update route and stops if data is available
      if (itineraryData.status === 'fulfilled' && itineraryData.value) {
        this.routeData = itineraryData.value;
        
        if (this.options.showRoute) {
          this.updateRoute(this.routeData);
        }
        
        if (this.options.showStops) {
          this.updateStops(this.routeData);
        }
      }
    } catch (error) {
      console.error('Error refreshing map data:', error);
    }
  }
  
  /**
   * Update the vehicle location marker
   * @param {Object} teslaData - Vehicle data from the Tesla API
   */
  updateVehicleLocation(teslaData) {
    if (!this.isMapReady || !this.vehicleMarker) return;
    
    // Get vehicle coordinates
    const { latitude, longitude } = teslaData;
    
    if (!latitude || !longitude) {
      console.warn('Invalid coordinates for vehicle location');
      return;
    }
    
    // Store current location
    this.currentLocation = [longitude, latitude];
    
    // Animate movement to new position
    if (this.options.animateMovement) {
      this.vehicleMarker.setLngLat(this.currentLocation);
    } else {
      this.vehicleMarker.setLngLat(this.currentLocation);
    }
    
    // Update popup content with more vehicle info
    const popupContent = `
      <div class="vehicle-popup">
        <h3>Current Location</h3>
        <p>Battery: ${teslaData.batteryLevel}%</p>
        <p>Range: ${Math.round(teslaData.range)} mi</p>
        <p>Speed: ${teslaData.speed} mph</p>
      </div>
    `;
    
    this.vehicleMarker.getPopup().setHTML(popupContent);
    
    // Dispatch event for other components
    const event = new CustomEvent('48continental:vehicleLocationUpdated', {
      detail: { 
        location: this.currentLocation, 
        data: teslaData 
      }
    });
    document.dispatchEvent(event);
  }
  
  /**
   * Update the route line
   * @param {Object} itineraryData - Itinerary data including stops
   */
  updateRoute(itineraryData) {
    if (!this.isMapReady || !this.routeSource) return;
    
    // Extract coordinates from stops for route drawing
    const { stops } = itineraryData;
    
    if (!stops || !stops.length) {
      console.warn('No stops available for route');
      return;
    }
    
    // Create a linestring from the stop coordinates
    const routeCoordinates = stops.map(stop => [stop.longitude, stop.latitude]);
    
    // Update the route source
    this.routeSource.setData({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: routeCoordinates
      }
    });
    
    // Dispatch event for other components
    const event = new CustomEvent('48continental:routeUpdated', {
      detail: { 
        route: routeCoordinates, 
        data: itineraryData 
      }
    });
    document.dispatchEvent(event);
  }
  
  /**
   * Update the stops on the map
   * @param {Object} itineraryData - Itinerary data including stops
   */
  updateStops(itineraryData) {
    if (!this.isMapReady || !this.stopsSource) return;
    
    const { stops } = itineraryData;
    
    if (!stops || !stops.length) {
      console.warn('No stops available');
      return;
    }
    
    // Convert stops to GeoJSON features
    const features = stops.map(stop => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [stop.longitude, stop.latitude]
      },
      properties: {
        id: stop.id,
        name: stop.name,
        type: stop.charging ? (stop.supercharger ? 'supercharger' : 'charging') 
          : (stop.overnight ? 'overnight' : (stop.type === 'major' ? 'major' : 'waypoint')),
        description: stop.description,
        state: stop.state,
        arrivalTime: stop.arrivalTime,
        departureTime: stop.departureTime,
        charging: stop.charging,
        supercharger: stop.supercharger,
        overnight: stop.overnight,
        notes: stop.notes
      }
    }));
    
    // Update the stops source
    this.stopsSource.setData({
      type: 'FeatureCollection',
      features
    });
    
    // Store stop data for future reference
    this.stopData = features;
    
    // Dispatch event for other components
    const event = new CustomEvent('48continental:stopsUpdated', {
      detail: { 
        stops: features, 
        data: itineraryData 
      }
    });
    document.dispatchEvent(event);
  }
  
  /**
   * Set up event listeners for map interactions
   */
  setupEventListeners() {
    if (!this.isMapReady) return;
    
    // Click handler for stops
    this.map.on('click', 'unclustered-stops', (e) => {
      const properties = e.features[0].properties;
      const coordinates = e.features[0].geometry.coordinates.slice();
      
      // Format arrival/departure times
      const arrivalTime = properties.arrivalTime ? new Date(properties.arrivalTime).toLocaleString() : 'N/A';
      const departureTime = properties.departureTime ? new Date(properties.departureTime).toLocaleString() : 'N/A';
      
      // Build popup content
      const popupContent = `
        <div class="stop-popup">
          <h3>${properties.name}</h3>
          <p>${properties.description}</p>
          <p><strong>State:</strong> ${properties.state}</p>
          <p><strong>Arrival:</strong> ${arrivalTime}</p>
          <p><strong>Departure:</strong> ${departureTime}</p>
          ${properties.charging ? '<p><strong>Charging Available</strong></p>' : ''}
          ${properties.supercharger ? '<p><strong>Tesla Supercharger</strong></p>' : ''}
          ${properties.overnight ? '<p><strong>Overnight Stay</strong></p>' : ''}
          ${properties.notes ? `<p><strong>Notes:</strong> ${properties.notes}</p>` : ''}
        </div>
      `;
      
      // Create popup
      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(popupContent)
        .addTo(this.map);
      
      // Dispatch event for other components
      const event = new CustomEvent('48continental:stopSelected', {
        detail: { 
          stopId: properties.id, 
          properties,
          coordinates
        }
      });
      document.dispatchEvent(event);
    });
    
    // Change cursor on hover over stops
    this.map.on('mouseenter', 'unclustered-stops', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });
    
    this.map.on('mouseleave', 'unclustered-stops', () => {
      this.map.getCanvas().style.cursor = '';
    });
    
    // Handle cluster clicks
    if (this.options.clusterStops) {
      this.map.on('click', 'clusters', (e) => {
        const features = this.map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = features[0].properties.cluster_id;
        
        this.stopsSource.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          
          this.map.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom
          });
        });
      });
      
      this.map.on('mouseenter', 'clusters', () => {
        this.map.getCanvas().style.cursor = 'pointer';
      });
      
      this.map.on('mouseleave', 'clusters', () => {
        this.map.getCanvas().style.cursor = '';
      });
    }
    
    // Listen for vehicle click event
    if (this.vehicleMarker && this.vehicleMarker.getElement()) {
      this.vehicleMarker.getElement().addEventListener('click', () => {
        if (this.currentLocation) {
          this.map.flyTo({
            center: this.currentLocation,
            zoom: 14,
            speed: 1.5,
            curve: 1.5
          });
          
          this.vehicleMarker.togglePopup();
        }
      });
    }
    
    // Listen for custom map control events
    document.addEventListener('48continental:mapControlCommand', (e) => {
      const { command, payload } = e.detail;
      
      switch (command) {
        case 'flyTo':
          this.flyToLocation(payload.longitude, payload.latitude, payload.zoom, payload.options);
          break;
        case 'setStyle':
          this.setMapStyle(payload.style);
          break;
        case 'toggleLayer':
          this.toggleLayer(payload.layerId, payload.visible);
          break;
        case 'centerOnVehicle':
          this.centerOnVehicle(payload.zoom);
          break;
        default:
          console.warn(`Unknown map command: ${command}`);
      }
    });
  }
  
  /**
   * Fly to a specific location on the map
   * @param {number} lng - Longitude
   * @param {number} lat - Latitude
   * @param {number} zoom - Zoom level
   * @param {Object} options - Additional flyTo options
   */
  flyToLocation(lng, lat, zoom = 12, options = {}) {
    if (!this.isMapReady) return;
    
    this.map.flyTo({
      center: [lng, lat],
      zoom,
      speed: 1.5,
      curve: 1.5,
      ...options
    });
  }
  
  /**
   * Set the map style
   * @param {string} style - Mapbox style URL or predefined style name
   */
  setMapStyle(style) {
    if (!this.isMapReady) return;
    
    // Map of predefined styles
    const styleMap = {
      streets: 'mapbox://styles/mapbox/streets-v12',
      outdoors: 'mapbox://styles/mapbox/outdoors-v12',
      light: 'mapbox://styles/mapbox/light-v11',
      dark: 'mapbox://styles/mapbox/dark-v11',
      satellite: 'mapbox://styles/mapbox/satellite-v9',
      satelliteStreets: 'mapbox://styles/mapbox/satellite-streets-v12',
      navigation: 'mapbox://styles/mapbox/navigation-day-v1',
      navigationNight: 'mapbox://styles/mapbox/navigation-night-v1'
    };
    
    // Determine the style URL
    const styleUrl = styleMap[style] || style;
    
    // Set the style
    this.map.setStyle(styleUrl);
  }
  
  /**
   * Toggle the visibility of a map layer
   * @param {string} layerId - ID of the layer to toggle
   * @param {boolean} visible - Whether the layer should be visible
   */
  toggleLayer(layerId, visible) {
    if (!this.isMapReady) return;
    
    const visibility = visible ? 'visible' : 'none';
    this.map.setLayoutProperty(layerId, 'visibility', visibility);
  }
  
  /**
   * Center the map on the vehicle's current location
   * @param {number} zoom - Zoom level
   */
  centerOnVehicle(zoom = 14) {
    if (!this.isMapReady || !this.currentLocation) return;
    
    this.map.flyTo({
      center: this.currentLocation,
      zoom,
      speed: 1.5,
      curve: 1.5
    });
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    // Clear the refresh timer
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    // Remove the map
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    
    // Reset state
    this.isMapReady = false;
    this.vehicleMarker = null;
    this.routeSource = null;
    this.stopsSource = null;
    this.currentLocation = null;
    this.routeData = null;
    this.stopData = null;
  }
}
