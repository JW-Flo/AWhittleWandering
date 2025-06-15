/**
 * Map Component
 * 
 * Displays an interactive map of A Whittle Wandering journey
 * with route, stops, and current vehicle location.
 * 
 * This version includes enhanced token management, coordinate validation,
 * improved error handling, and integration with the MapDebugPanel.
 */

/* eslint-env browser */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
// IMPORTANT: Import MapboxGL CSS first to ensure it's included in the bundle
import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';
import Hammer from 'hammerjs';
import TripStatistics from './TripStatistics';
import MapDebugPanel from './MapDebugPanel';
import './Map.css';
import './MapEnhancements.css';
import { ensureMapboxFormat } from "../utils/mapUtils";

// Import the centralized MapBox configuration
import { getMapboxToken } from '../shared/mapbox/mapboxConfig.ts';

/**
 * Import the mapbox diagnostics utilities to ensure token availability
 */
import { reportTokenStatus, synchronizeTokens } from '../utils/mapboxDiagnostics';

/**
 * Enhanced Mapbox Token Initialization and Validation
 * Uses the diagnostic utility to ensure token is properly initialized
 * and available in all contexts.
 */
(function initializeAndValidateMapboxToken() {
  // Synchronize the token across all contexts (window, mapboxgl, etc)
  const success = synchronizeTokens();

  // Set token on mapboxgl directly as well
  const token = getMapboxToken();
  if (token && window.mapboxgl) {
    window.mapboxgl.accessToken = token;
  }

  // Run diagnostics to identify any issues
  if (import.meta.env.DEV || window.__MAP_DEBUG__) {
    console.log('[MapboxGL] Token initialization attempt completed', {
      success,
      tokenSet: !!token,
      tokenPreview: token ? `${token.substring(0, 10)}...` : 'Missing',
      mapboxVersion: window.mapboxgl ? window.mapboxgl.version : 'Not loaded'
    });

    // Run full diagnostics report
    reportTokenStatus();
  }

  if (!token || !token.startsWith('pk.')) {
    console.error('[MapboxGL] Token missing or invalid format!', {
      tokenExists: !!token,
      tokenLength: token ? token.length : 0
    });
  }
})();

// SVG icons for map markers
const SVG_ICONS = {
  'charging-station': `
    <svg viewBox="0 0 24 24" width="24" height="24">
      <path fill="#4CAF50" d="M14.5,11l-1.5,-3h2l3,7h-5v4l-6,-8h3l1.5,-3h3z"/>
    </svg>
  `,
  'lodging': `
    <svg viewBox="0 0 24 24" width="24" height="24">
      <path fill="#2196F3" d="M19,7h-8v7H3V5H1v15h2v-3h18v3h2v-9C23,8.79,21.21,7,19,7z M15,13.5A1.5,1.5,0,1,1,16.5,12,1.5,1.5,0,0,1,15,13.5z"/>
    </svg>
  `,
  'waypoint': `
    <svg viewBox="0 0 24 24" width="24" height="24">
      <path fill="#FFC107" d="M12,2C8.13,2,5,5.13,5,9c0,5.25,7,13,7,13s7-7.75,7-13C19,5.13,15.87,2,12,2z M12,11.5c-1.38,0-2.5-1.12-2.5-2.5s1.12-2.5,2.5-2.5s2.5,1.12,2.5,2.5S13.38,11.5,12,11.5z"/>
    </svg>
  `
};

// Create SVG marker element
const createMarkerElement = (type) => {
  const el = document.createElement('div');
  el.className = `marker-icon marker-${type}`;
  el.innerHTML = SVG_ICONS[type] || SVG_ICONS['waypoint'];
  return el;
};

// We've replaced the custom coordinate validation functions with the centralized
// ensureMapboxFormat utility from mapUtils.js

// Log to confirm we're using the centralized utility
console.log('Map component using centralized coordinate format utility from mapUtils.js');

/**
 * Initialize map markers and layers with enhanced error handling and coordinate validation
 * This function is responsible for creating all visual elements on the map based on trip data
 */
const initializeMapLayers = async (map, tripData) => {
  if (!map || !tripData) {
    console.warn('Cannot initialize map layers: map or tripData is missing', {
      mapExists: !!map,
      tripDataExists: !!tripData
    });
    return;
  }

  console.log('Initializing map layers with trip data', {
    routePoints: tripData.route?.length || 0,
    stops: tripData.stops?.length || 0
  });

  try {
    // Clear existing layers if they exist
    ['route-line', 'stops-markers'].forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    });

    ['route', 'stops'].forEach(sourceId => {
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    });

    // Add route layer if route data exists and has enough points
    if (tripData.route?.length > 1) {
      // Filter out invalid coordinates and fix any format issues
      const validRoutePoints = [];

      tripData.route.forEach(point => {
        // Use the centralized ensureMapboxFormat utility to handle all coordinate formats
        const coords = ensureMapboxFormat(point);

        if (coords) {
          validRoutePoints.push(coords);
        } else {
          console.warn('Invalid coordinate point skipped:', point);
        }
      });

      if (validRoutePoints.length > 1) {
        console.log(`Successfully validated ${validRoutePoints.length} route points`);

        const routeGeoJSON = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: validRoutePoints
          }
        };

        // Safe add source with error handling
        try {
          map.addSource('route', {
            type: 'geojson',
            data: routeGeoJSON
          });

          map.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#0066cc',
              'line-width': 4,
              'line-opacity': 0.8
            }
          });
          console.log('Successfully added route layer with', validRoutePoints.length, 'points');
        } catch (error) {
          console.error('Error adding route layer:', error);
        }
      } else {
        console.warn('Not enough valid route points to render route line');
      }
    }

    // Add stops layer if stop data exists
    if (tripData.stops?.length > 0) {
      // Process stops with enhanced validation
      const validStops = [];

      tripData.stops.forEach(stop => {
        if (!stop) return;

        // Determine the location to validate
        let locationToValidate = stop;

        // If stop has a dedicated location property, use that instead
        if (stop.location) {
          locationToValidate = stop.location;
        }

        // Use the centralized ensureMapboxFormat utility
        const coords = ensureMapboxFormat(locationToValidate);

        if (coords) {
          validStops.push({
            ...stop,
            _validatedCoordinates: coords
          });
        } else {
          console.warn('Invalid stop skipped:', stop);
        }
      });

      if (validStops.length > 0) {
        console.log(`Successfully validated ${validStops.length} stops`);

        const stopsGeoJSON = {
          type: 'FeatureCollection',
          features: validStops.map(stop => ({
            type: 'Feature',
            properties: {
              id: stop.id || 'stop-' + Math.random().toString(36).substring(2, 9),
              name: stop.name || 'Unknown',
              description: stop.description || 'No description',
              type: stop.type || 'waypoint',
              charging: !!stop.charging,
              overnight: !!stop.overnight
            },
            geometry: {
              type: 'Point',
              coordinates: stop._validatedCoordinates
            }
          }))
        };

        // Safe add source with error handling
        try {
          map.addSource('stops', {
            type: 'geojson',
            data: stopsGeoJSON
          });

          // Add markers for each stop
          stopsGeoJSON.features.forEach(stop => {
            try {
              const markerType = stop.properties.overnight ? 'lodging' :
                stop.properties.charging ? 'charging-station' : 'waypoint';

              const el = createMarkerElement(markerType);

              new mapboxgl.Marker({
                element: el,
                anchor: 'bottom'
              })
                .setLngLat(stop.geometry.coordinates)
                .setPopup(
                  new mapboxgl.Popup({
                    offset: 25,
                    closeButton: false,
                    maxWidth: '300px'
                  })
                    .setHTML(`
                  <div class="map-popup">
                    <h4>${stop.properties.name}</h4>
                    <p>${stop.properties.description}</p>
                    <p class="stop-type">Type: ${stop.properties.type.charAt(0).toUpperCase() + stop.properties.type.slice(1)}</p>
                  </div>
                `)
                )
                .addTo(map);
            } catch (markerError) {
              console.error('Error adding marker for stop:', stop.properties.name, markerError);
            }
          });
          console.log('Successfully added', validStops.length, 'stop markers');
        } catch (error) {
          console.error('Error adding stops layer:', error);
        }
      } else {
        console.warn('No valid stops to render on map');
      }
    }
  } catch (error) {
    console.error('Error initializing map layers:', error);
  }
};

/**
 * Interactive map component using Mapbox GL
 */
const Map = ({ vehicleData, tripData, weatherData, displayMode }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const vehicleMarker = useRef(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [debugVisible, setDebugVisible] = useState(false);
  const [mapInitAttempted, setMapInitAttempted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  // State to hold charging stations data for the map overlay.
  // This should be populated with an object containing a 'stations' array of station objects,
  // typically fetched from an API or passed via props. Used for rendering charging station markers.
  const [stationsData, setStationsData] = useState({ stations: [] });

  // Map layer visibility control
  const [mapLayers, setMapLayers] = useState({
    route: true,
    stops: true,
    vehicle: true,
    weather: true,
    chargingStations: false,
  });

  /**
   * Map initialization with enhanced error handling and token verification
   * Ensures map loads reliably in production environments
   */
  useEffect(() => {
    // Check if map is already initialized
    if (map.current) return;

    // Verify token one more time before map initialization
    try {
      // Get token and verify it's valid
      const token = getMapboxToken();
      if (!token || !token.startsWith('pk.')) {
        throw new Error('Invalid Mapbox token format');
      }

      // Ensure token is set on mapboxgl
      if (window.mapboxgl) {
        window.mapboxgl.accessToken = token;
      } else {
        throw new Error('Mapbox GL JS not loaded');
      }

      // Create map instance with error handling
      map.current = new window.mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-98.5795, 39.8283], // USA center
        zoom: 3.5,
        attributionControl: true
      });

      // Setup map event handlers
      map.current.on('load', () => {
        console.log('[Map] Mapbox map loaded successfully');
        setMapInitialized(true);

        // After map is loaded, add layers
        if (tripData) {
          initializeMapLayers(map.current, tripData);
        }
      });

      // Error handling for map initialization
      map.current.on('error', (e) => {
        console.error('[Map] Mapbox error:', e);
        setMapError(`Map error: ${e.error?.message || 'Unknown error'}`);
      });

      // Setup mobile touch handlers
      if (mapContainer.current && typeof Hammer !== "undefined") {
        const hammer = new Hammer(mapContainer.current);
        hammer.get('pinch').set({ enable: true });

        hammer.on('pinchout', () => {
          map.current.zoomIn();
        });

        hammer.on('pinchin', () => {
          map.current.zoomOut();
        });
      } else if (mapContainer.current) {
        console.warn('[Map] Hammer.js is not available. Touch gestures will be disabled.');
      }

    } catch (error) {
      console.error('[Map] Critical initialization error:', error);
      setMapError(`Failed to initialize map: ${error.message}`);

      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js';
      script.onload = () => {
        console.log('[Map] Attempted to reload Mapbox GL JS');
        // Force page reload after 2 seconds if user permits
        if (window.confirm('Map failed to load. Reload page to try again?')) {
          window.location.reload();
        }
      };
      script.onerror = (e) => {
        console.error('[Map] Failed to load Mapbox GL JS script:', e);
        setMapError('Failed to load Mapbox GL JS. Please check your network connection or try again later.');
        // Optionally, notify monitoring systems here
      };
      document.head.appendChild(script);
    }

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [tripData]);

  // Update map style based on layer toggles
  useEffect(() => {
    if (!mapInitialized || !map.current) return;

    try {
      // Store current view state
      const currentCenter = map.current.getCenter();
      const currentZoom = map.current.getZoom();

      // Handle style changes
      const newStyle = displayMode === 'satellite'
        ? 'mapbox://styles/mapbox/satellite-streets-v11'
        : 'mapbox://styles/mapbox/streets-v11';

      // Only change style if it's different
      if (map.current.getStyle().name !== newStyle) {
        map.current.once('style.load', () => {
          try {
            // Re-initialize all layers after style change
            initializeMapLayers(map.current, tripData)
              .catch(error => console.error('Error reinitializing layers after style change:', error));

            // Restore the previous view
            map.current.setCenter(currentCenter);
            map.current.setZoom(currentZoom);
          } catch (e) {
            console.error('Error in style.load handler:', e);
          }
        });

        map.current.setStyle(newStyle);
      }

      // Handle weather overlay (placeholder for now)
      if (mapLayers.weather && weatherData) {
        console.log('Weather overlay would show data:', weatherData);
      }
    } catch (error) {
      console.error('Error updating map style:', error);
    }
  }, [displayMode, mapInitialized, weatherData, tripData]);

  // Add and update charging stations on the map
  useEffect(() => {
    if (!mapInitialized || !map.current) return;

    try {
      // Handle charging stations layer
      const sourceId = 'charging-stations';
      const layerId = 'charging-stations-layer';

      // Remove existing layer and source if they exist
      if (map.current.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }

      if (map.current.getSource(sourceId)) {
        map.current.removeSource(sourceId);
      }

      // Only add the layer if it's enabled and we have data
      if (mapLayers.chargingStations && stationsData?.stations?.length > 0) {
        console.log(`Adding ${stationsData.stations.length} charging stations to map`);
        // Convert stations to GeoJSON
        const stationsGeoJSON = {
          type: 'FeatureCollection',
          features: stationsData.stations
            .filter(station => station && station.latitude && station.longitude)
            .map(station => ({
              type: 'Feature',
              properties: {
                id: station.id || `station-${Math.random().toString(36).substring(2, 9)}`,
                name: station.name || 'Unknown Station',
                available: !!station.available,
                power: station.power || 0,
                connectorType: station.connectorType || 'Unknown',
                description: station.description || ''
              },
              geometry: {
                type: 'Point',
                coordinates: [station.longitude, station.latitude]
              }
            }))
        };

        // Add stations source
        map.current.addSource(sourceId, {
          type: 'geojson',
          data: stationsGeoJSON
        });

        // Add a symbol layer for stations
        map.current.addLayer({
          id: layerId,
          type: 'symbol',
          source: sourceId,
          layout: {
            'icon-image': 'charging-station',
            'icon-size': 1.2,
            'icon-allow-overlap': true,
            'text-field': ['get', 'name'],
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-offset': [0, 1.2],
            'text-anchor': 'top',
            'text-size': 12,
            'text-optional': true
          },
          paint: {
            'text-color': '#333',
            'text-halo-color': '#fff',
            'text-halo-width': 1,
            'icon-color': [
              'case',
              ['get', 'available'],
              '#4CAF50', // Available (green)
              '#F44336'  // Unavailable (red)
            ]
          }
        });

        // Add click handler for stations
        map.current.on('click', layerId, (e) => {
          if (!e.features || !e.features[0]) return;

          const coordinates = e.features[0].geometry.coordinates.slice();
          const { name, available, power, connectorType, description } = e.features[0].properties;

          // Create popup content
          const statusText = available ? 'Available' : 'In Use';
          const statusClass = available ? 'status-available' : 'status-unavailable';

          const popupContent = `
            <div class="map-popup charging-popup">
              <h4>${name || 'Charging Station'}</h4>
              <p>${description || 'Tesla Supercharger'}</p>
              <p class="station-power">Power: ${power || 'Unknown'} kW</p>
              <p class="station-connector">Connector: ${connectorType || 'Tesla'}</p>
              <p class="station-status ${statusClass}">Status: ${statusText}</p>
            </div>
          `;

          // Create popup
          new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(popupContent)
            .addTo(map.current);
        });

        // Change cursor on hover
        map.current.on('mouseenter', layerId, () => {
          map.current.getCanvas().style.cursor = 'pointer';
        });

        map.current.on('mouseleave', layerId, () => {
          map.current.getCanvas().style.cursor = '';
        });
      }
    } catch (error) {
      console.error('Error updating charging stations:', error);
    }
  }, [mapLayers.chargingStations, stationsData, mapInitialized]);

  // Update map data when tripData changes - with improved load handling
  useEffect(() => {
    if (!map.current || !tripData) return;

    console.log('Trip data changed, updating map layers', {
      hasRoute: !!tripData.route,
      hasStops: !!tripData.stops,
      mapReady: mapInitialized
    });

    try {
      // Only add layers if map is already loaded
      if (mapInitialized) {
        console.log('Map is ready, initializing layers immediately');
        // Re-initialize layers with new data
        initializeMapLayers(map.current, tripData)
          .catch(error => {
            console.error('Error updating map data:', error);
            setMapError('Failed to update map data, but map is still functional');
          });
      } else {
        // If map is not ready yet, set up an event listener for the load event
        console.log('Map not ready, waiting for load event to initialize layers');
        const handleMapLoad = () => {
          console.log('Map load event fired, initializing layers');
          initializeMapLayers(map.current, tripData)
            .catch(error => {
              console.error('Error initializing map layers on delayed load:', error);
              setMapError('Failed to initialize map data, but map is still functional');
            });

          // Remove this event listener after it fires
          map.current.off('load', handleMapLoad);
        };

        // Add the load event listener
        map.current.on('load', handleMapLoad);

        return () => {
          // Clean up the event listener if the component unmounts before the map loads
          if (map.current) {
            map.current.off('load', handleMapLoad);
          }
        };
      }
    } catch (error) {
      console.error('Error in tripData effect:', error);
    }
  }, [tripData, mapInitialized]);

  // Add and update vehicle marker
  useEffect(() => {
    if (!mapInitialized || !map.current || !vehicleData) return;

    try {
      // Use our ensureMapboxFormat utility to handle any coordinate format
      // This will work whether vehicleData.location is an array, object, etc.
      const coordinates = ensureMapboxFormat(vehicleData.location || vehicleData);

      if (!coordinates) {
        console.warn('Invalid vehicle coordinates:', vehicleData.location || vehicleData);
        return;
      }

      // Function to create/update the vehicle marker
      const updateVehicleMarker = () => {
        try {
          if (!vehicleMarker.current) {
            // Create a vehicle marker element
            const el = document.createElement('div');
            el.className = 'vehicle-marker';

            // Use a better SVG car icon for better visibility
            const batteryLevel = vehicleData.batteryLevel || 100;
            el.innerHTML = `
              <svg viewBox="0 0 24 24" width="36" height="36" fill="${batteryLevel < 20 ? '#f44336' : '#4CAF50'}">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
              </svg>
            `;

            // Add pulse effect if car is moving
            if (vehicleData.speed > 0) {
              el.classList.add('vehicle-moving');
            }

            // Add vehicle marker to map
            vehicleMarker.current = new mapboxgl.Marker({
              element: el,
              anchor: 'center',
              rotation: vehicleData.heading || 0,
              rotationAlignment: 'map'
            })
              .setLngLat(coordinates)
              .addTo(map.current);

            // Add popup for vehicle with better formatting
            const batteryClass = vehicleData.batteryLevel < 20 ? 'battery-low' :
              vehicleData.batteryLevel > 80 ? 'battery-high' : '';

            // Create and attach popup to the marker
            new mapboxgl.Popup({
              offset: 25,
              closeButton: false,
              closeOnClick: false,
              maxWidth: '300px',
              className: 'vehicle-marker-popup'
            })
              .setHTML(`
                <div class="vehicle-popup">
                  <h4>Whittle Wagon</h4>
                  <div class="vehicle-popup-stats">
                    <div class="popup-stat">
                      <span class="popup-stat-icon">🔋</span>
                      <span class="popup-stat-value ${batteryClass}">${Math.round(vehicleData.batteryLevel || 0)}%</span>
                    </div>
              <div class="popup-stat">
                <span class="popup-stat-icon">⚡</span>
                <span class="popup-stat-value">${Math.round(vehicleData.range || 0)} mi</span>
              </div>
              <div class="popup-stat">
                <span class="popup-stat-icon">🚗</span>
                <span class="popup-stat-value">${Math.round(vehicleData.speed || 0)} mph</span>
              </div>
            </div>
          </div>
        `)
              .addTo(map.current);

          } else {
            // Update existing marker
            vehicleMarker.current
              .setLngLat(coordinates)
              .setRotation(vehicleData.heading || 0);

            // Update marker appearance based on battery level
            const markerElement = vehicleMarker.current.getElement();
            if (markerElement) {
              const batteryLevel = vehicleData.batteryLevel || 100;
              const batteryColor = batteryLevel < 20 ? '#f44336' : '#4CAF50';

              const svgElement = markerElement.querySelector('svg');
              if (svgElement) {
                svgElement.setAttribute('fill', batteryColor);
              }

              // Update pulse effect based on movement
              if (vehicleData.speed > 0) {
                markerElement.classList.add('vehicle-moving');
              } else {
                markerElement.classList.remove('vehicle-moving');
              }
            }
          }
        } catch (error) {
          console.error('Error updating vehicle marker:', error);
        }
      };

      // Update the marker
      updateVehicleMarker();
    } catch (error) {
      console.error('Error in vehicle data effect:', error);
    }
  }, [vehicleData, mapInitialized]);

  // Debug keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle debug panel with Ctrl+Shift+D
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setDebugVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Map health monitor to auto-reset if needed
  useEffect(() => {
    if (!mapInitialized || !map.current) return;

    // Variables to track map health
    let consecutiveFailures = 0;
    const MAX_FAILURES = 3;

    const healthCheck = () => {
      try {
        // Try to perform an operation that would fail if the map is broken
        const center = map.current.getCenter();
        const zoom = map.current.getZoom();

        // If we get here, the map is still responsive
        consecutiveFailures = 0;
        console.log("Map health check: OK", { center, zoom });
      } catch (error) {
        consecutiveFailures++;
        console.warn(`Map health check failed (${consecutiveFailures}/${MAX_FAILURES})`, error);

        // If multiple consecutive failures, attempt auto-recovery
        if (consecutiveFailures >= MAX_FAILURES) {
          console.error("Map appears to be unresponsive. Triggering auto-recovery...");
          handleResetMap();
          consecutiveFailures = 0;
        }
      }
    };

    // Run health check every 45 seconds
    const healthCheckInterval = setInterval(healthCheck, 45000);

    return () => {
      clearInterval(healthCheckInterval);
    };
  }, [mapInitialized]);

  // Handle reset map for auto-recovery or debug panel
  const handleResetMap = useCallback(() => {
    try {
      console.log("Resetting map instance...");

      if (map.current) {
        map.current.remove();
        map.current = null;
      }

      if (vehicleMarker.current) {
        vehicleMarker.current = null;
      }

      setMapInitialized(false);
      setMapError(null);
      setLoading(true);

      // Force a repaint of the map container
      if (mapContainer.current) {
        const oldContainer = mapContainer.current;
        const parent = oldContainer.parentNode;
        if (parent) {
          const newContainer = document.createElement('div');
          newContainer.className = 'map';
          mapContainer.current = newContainer;
          parent.replaceChild(newContainer, oldContainer);
        }
      }

      console.log("Map reset complete. Will re-initialize.");
    } catch (error) {
      console.error('Error resetting map:', error);
    }
  }, []);

  // Handle map container click to reset errors
  const handleMapContainerClick = () => {
    if (mapError) {
      setMapError(null);
      setMapInitAttempted(false);
    }
  };

  // Reset map handler for debug panel
  const handleDebugResetMap = () => {
    handleResetMap();
  };

  // Refresh data handler for debug panel
  const handleRefreshData = () => {
    console.log('Data refresh requested from debug panel');
    // This would normally call a function passed via props to refresh the data
    // For now, we'll just log it and re-initialize with current data
    if (map.current && mapInitialized && tripData) {
      initializeMapLayers(map.current, tripData)
        .catch(error => console.error('Error refreshing map data:', error));
    }
  };

  return (
    <div
      className={`map-container ${fullscreen ? 'fullscreen' : ''}`}
      onClick={handleMapContainerClick}
    >
      {loading && (
        <div className="map-loading">
          <div className="spinner"></div>
          <p>Loading map...</p>
        </div>
      )}

      {mapError && (
        <div className="map-error">
          <h3>Map Error</h3>
          <p>{mapError}</p>
          <button onClick={() => {
            setMapError(null);
            setMapInitAttempted(false);
          }}>Try Again</button>
        </div>
      )}

      <div ref={mapContainer} className="map" />

      {tripData && <TripStatistics tripData={tripData} />}

      {debugVisible && (
        <MapDebugPanel
          tripData={tripData}
          vehicleData={vehicleData}
          mapReady={mapInitialized}
          onResetMap={handleDebugResetMap}
          onRefreshData={handleRefreshData}
        />
      )}
    </div>
  );
};

Map.propTypes = {
  vehicleData: PropTypes.object,
  tripData: PropTypes.object,
  weatherData: PropTypes.object,
  stationsData: PropTypes.object,
  fullscreen: PropTypes.bool,
  mapLayers: PropTypes.shape({
    weather: PropTypes.bool,
    traffic: PropTypes.bool,
    satellite: PropTypes.bool,
    chargingStations: PropTypes.bool
  })
};

export default Map;
