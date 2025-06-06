/**
 * Map Component
 * 
 * Displays an interactive map of the 48 Continental USA journey
 * with route, stops, and current vehicle location.
 * 
 * This version includes enhanced coordinate validation and formatting,
 * improved error handling, and integration with the MapDebugPanel.
 */

/* eslint-env browser */
import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import mapboxgl from 'mapbox-gl';
import Hammer from 'hammerjs';
import TripStatistics from './TripStatistics';
import MapDebugPanel from './MapDebugPanel';
import './Map.css';
import './MapEnhancements.css';

// Set MapBox token from environment variables with robust fallback handling
// Using public token (pk.) for client-side application
const MAPBOX_FALLBACK_TOKEN = 'pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJmNXlwY2IycGdtMnFva2liaTA4enIwIn0.tU9_tLaaxXxhfcVX4WhOeA';

// Safely retrieve the token with enhanced error handling
try {
  // More verbose logging to track what's happening
  console.log('Environment variables available:', import.meta.env ? 'Yes' : 'No');

  // Check if VITE_MAPBOX_TOKEN exists and log its status
  const envToken = import.meta.env.VITE_MAPBOX_TOKEN;
  console.log('VITE_MAPBOX_TOKEN status:',
    envToken ? `Found (starts with ${envToken.substring(0, 10)}...)` : 'Not found or empty');

  // Set the token with improved validation
  if (envToken && envToken !== 'undefined' && envToken.startsWith('pk.')) {
    mapboxgl.accessToken = envToken;
    console.log('Using Mapbox token from environment variables');
  } else {
    console.warn('Environment token invalid or missing, using fallback token');
    mapboxgl.accessToken = MAPBOX_FALLBACK_TOKEN;
  }

  // Log the final token being used (first 10 chars only for security)
  console.log('Final Mapbox token in use:', mapboxgl.accessToken.substring(0, 10) + '...');
} catch (error) {
  console.error('Error setting Mapbox token:', error);
  console.log('Falling back to hardcoded token');
  mapboxgl.accessToken = MAPBOX_FALLBACK_TOKEN;
}

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

// Validate and normalize GeoJSON coordinates
const validateGeoJSONCoordinates = (lng, lat) => {
  // Check if values are valid numbers and within range
  // Longitude: -180 to 180, Latitude: -90 to 90
  const validLng = typeof lng === 'number' && !isNaN(lng) && lng >= -180 && lng <= 180;
  const validLat = typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90;

  if (!validLng || !validLat) {
    return null;
  }

  return [lng, lat];
};

// Attempt to fix potentially swapped coordinates
const fixCoordinateFormat = (point) => {
  if (!point) return null;

  // Check if values might be swapped (lat, lng instead of lng, lat)
  if (point.latitude && point.longitude) {
    const lat = point.latitude;
    const lng = point.longitude;

    // If longitude looks like it might be a latitude value and vice versa
    if (Math.abs(lng) <= 90 && Math.abs(lat) > 90) {
      console.warn('Detected swapped coordinates, fixing:', { original: [lng, lat], fixed: [lat, lng] });
      return validateGeoJSONCoordinates(lat, lng);
    }

    return validateGeoJSONCoordinates(lng, lat);
  }

  // If we have an array instead of lat/lng properties
  if (Array.isArray(point) && point.length === 2) {
    const [first, second] = point;

    // If first value looks like latitude and second like longitude
    if (Math.abs(first) <= 90 && Math.abs(second) <= 180 && Math.abs(second) > 90) {
      return validateGeoJSONCoordinates(second, first);
    }

    return validateGeoJSONCoordinates(first, second);
  }

  return null;
};

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
        // First try to validate with expected format
        let coords = null;

        if (point && typeof point.longitude === 'number' && typeof point.latitude === 'number') {
          coords = validateGeoJSONCoordinates(point.longitude, point.latitude);
        }

        // If validation failed, try to fix potential format issues
        if (!coords) {
          coords = fixCoordinateFormat(point);
        }

        if (coords) {
          validRoutePoints.push(coords);
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

        let coords = null;

        // First try standard format
        if (typeof stop.longitude === 'number' && typeof stop.latitude === 'number' &&
          !isNaN(stop.longitude) && !isNaN(stop.latitude)) {
          coords = validateGeoJSONCoordinates(stop.longitude, stop.latitude);
        }

        // If that fails, try GeoJSON coordinates array if available
        if (!coords && stop.coordinates && Array.isArray(stop.coordinates) && stop.coordinates.length === 2) {
          coords = validateGeoJSONCoordinates(stop.coordinates[0], stop.coordinates[1]);
        }

        // Last resort - try to fix potential format issues
        if (!coords) {
          coords = fixCoordinateFormat(stop);
        }

        if (coords) {
          validStops.push({
            ...stop,
            _validatedCoordinates: coords
          });
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
const Map = ({
  vehicleData,
  tripData,
  weatherData,
  stationsData,
  fullscreen = false,
  mapLayers = {
    weather: false,
    traffic: false,
    satellite: false,
    chargingStations: false
  }
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const vehicleMarker = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(null);
  const [mapInitAttempted, setMapInitAttempted] = useState(false);

  // Initialize map on component mount
  useEffect(() => {
    if (map.current || mapInitAttempted) return; // Map already initialized or attempt made

    console.log('Initializing map with token:', mapboxgl.accessToken.substring(0, 10) + '...');
    setMapInitAttempted(true);

    // Verify token is valid
    if (!mapboxgl.accessToken || mapboxgl.accessToken === 'pk.placeholder') {
      console.error('Mapbox token is invalid or missing');
      setMapError('Mapbox access token is missing. Please check your configuration.');
      setLoading(false);
      return;
    }

    // Safely check if map container exists
    if (!mapContainer.current) {
      console.error('Map container ref is missing');
      setMapError('Map container not found. Please refresh the page.');
      setLoading(false);
      return;
    }

    try {
      // Initialize map with safe defaults
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-98.5795, 39.8283], // Center of continental US
        zoom: 3.5,
        minZoom: 2,
        maxZoom: 18,
        failIfMajorPerformanceCaveat: false, // Try to load even on low-performance devices
        attributionControl: false, // We'll add it manually in a better position
        preserveDrawingBuffer: true // Required for screenshot functionality
      });

      // Add map error handler
      map.current.on('error', (e) => {
        console.error('Mapbox map error:', e);
      });

      // Safely add controls one by one with error handling
      try {
        map.current.addControl(new mapboxgl.AttributionControl({
          compact: true
        }), 'bottom-left');
      } catch (e) {
        console.warn('Failed to add attribution control:', e);
      }

      try {
        map.current.addControl(new mapboxgl.NavigationControl({
          visualizePitch: true,
          showCompass: true
        }), 'top-right');
      } catch (e) {
        console.warn('Failed to add navigation control:', e);
      }

      try {
        map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
      } catch (e) {
        console.warn('Failed to add fullscreen control:', e);
      }

      try {
        map.current.addControl(new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: false,
          showUserHeading: true
        }), 'top-right');
      } catch (e) {
        console.warn('Failed to add geolocate control:', e);
      }

      try {
        map.current.addControl(new mapboxgl.ScaleControl({
          maxWidth: 100,
          unit: 'imperial'
        }), 'bottom-left');
      } catch (e) {
        console.warn('Failed to add scale control:', e);
      }

      // Setup touch gesture listeners for mobile
      try {
        if (typeof Hammer !== 'undefined') {
          const hammer = new Hammer(mapContainer.current);
          hammer.get('swipe').set({ direction: Hammer.DIRECTION_ALL });

          hammer.on('swipeleft', () => {
            document.dispatchEvent(new CustomEvent('map:swipe:left'));
          });

          hammer.on('swiperight', () => {
            document.dispatchEvent(new CustomEvent('map:swipe:right'));
          });
        }
      } catch (e) {
        console.warn('Failed to initialize touch gestures, continuing without them:', e);
      }

      // Mark map as ready when loaded and initialize layers
      map.current.on('load', () => {
        console.log('Map loaded successfully');
        setMapReady(true);
        setLoading(false);

        // Initialize layers if we have trip data
        if (tripData) {
          console.log('Initializing map layers with tripData on load');
          initializeMapLayers(map.current, tripData)
            .catch(error => console.error('Error initializing map layers on load:', error));
        } else {
          console.log('No tripData available yet, will initialize layers when data arrives');
        }
      });

      // Add a timeout to set map as ready even if load event doesn't fire
      setTimeout(() => {
        if (!mapReady && map.current) {
          console.warn('Map load event did not fire within timeout, forcing mapReady=true');
          setMapReady(true);
          setLoading(false);
        }
      }, 5000);

    } catch (error) {
      console.error('Fatal error initializing map:', error);
      setMapError(`Could not initialize map: ${error.message}`);
      setLoading(false);
    }

    // Cleanup on unmount
    return () => {
      try {
        if (map.current) {
          map.current.remove();
          map.current = null;
        }
      } catch (e) {
        console.error('Error cleaning up map:', e);
      }
    };
  }, []);

  // Update map style based on layer toggles
  useEffect(() => {
    if (!mapReady || !map.current) return;

    try {
      // Store current view state
      const currentCenter = map.current.getCenter();
      const currentZoom = map.current.getZoom();

      // Handle style changes
      const newStyle = mapLayers.satellite
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
  }, [mapLayers, mapReady, weatherData, tripData]);

  // Add and update charging stations on the map
  useEffect(() => {
    if (!mapReady || !map.current) return;

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
  }, [mapLayers.chargingStations, stationsData, mapReady]);

  // Update map data when tripData changes
  useEffect(() => {
    if (!mapReady || !map.current || !tripData) return;

    console.log('Trip data changed, updating map layers', {
      hasRoute: !!tripData.route,
      hasStops: !!tripData.stops
    });

    try {
      // Re-initialize layers with new data
      initializeMapLayers(map.current, tripData)
        .catch(error => {
          console.error('Error updating map data:', error);
          setMapError('Failed to update map data, but map is still functional');
        });
    } catch (error) {
      console.error('Error in tripData effect:', error);
    }
  }, [tripData, mapReady]);

  // Add and update vehicle marker
  useEffect(() => {
    if (!mapReady || !map.current || !vehicleData) return;

    try {
      // Extract coordinates with proper fallbacks
      const latitude = vehicleData.location?.latitude || vehicleData.latitude;
      const longitude = vehicleData.location?.longitude || vehicleData.longitude;

      if (latitude == null || longitude == null || isNaN(latitude) || isNaN(longitude)) {
        console.warn('Invalid vehicle coordinates:', { latitude, longitude });
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
              .setLngLat([longitude, latitude])
              .addTo(map.current);

            // Add popup for vehicle with better formatting
            const batteryClass = vehicleData.batteryLevel < 20 ? 'battery-low' :
              vehicleData.batteryLevel > 80 ? 'battery-high' : '';

            const popup = new mapboxgl.Popup({
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
                      <span class="popup-stat-icon">🚀</span>
                      <span class="popup-stat-value">${Math.round(vehicleData.speed || 0)} mph</span>
                    </div>
                  </div>
                </div>
              `);

            vehicleMarker.current.setPopup(popup);
          } else {
            // Update marker position and rotation
            vehicleMarker.current.setLngLat([longitude, latitude]);

            // Update rotation if heading is available
            if (vehicleData.heading !== undefined) {
              const markerEl = vehicleMarker.current.getElement();
              vehicleMarker.current.setRotation(vehicleData.heading);

              // Update moving state
              if (vehicleData.speed > 0) {
                markerEl.classList.add('vehicle-moving');
              } else {
                markerEl.classList.remove('vehicle-moving');
              }

              // Update car color based on battery
              const svgPath = markerEl.querySelector('svg');
              if (svgPath) {
                svgPath.style.fill = vehicleData.batteryLevel <
