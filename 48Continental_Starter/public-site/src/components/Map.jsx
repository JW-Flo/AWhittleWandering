/**
 * Map Component
 * 
 * Displays an interactive map of the 48 Continental USA journey
 * with route, stops, and current vehicle location.
 */

/* eslint-env browser */
import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import mapboxgl from 'mapbox-gl';

// Mapbox token (in a real app, this would be in an environment variable)
// This is a placeholder token - replace with a valid one for production
mapboxgl.accessToken = 'pk.placeholder-token-replace-in-production';

/**
 * Interactive map component using Mapbox GL
 */
const Map = ({ 
  vehicleData, 
  tripData, 
  weatherData,
  mapLayers = { 
    weather: false, 
    traffic: false, 
    satellite: false 
  } 
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const vehicleMarker = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  
  // Initialize map on component mount
  useEffect(() => {
    if (map.current) return; // Map already initialized
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-98.5795, 39.8283], // Center of continental US
      zoom: 3.5,
      minZoom: 2,
      maxZoom: 18
    });
    
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    map.current.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: false
    }), 'top-right');
    
    // Add scale control
    map.current.addControl(new mapboxgl.ScaleControl({
      maxWidth: 100,
      unit: 'imperial'
    }), 'bottom-left');
    
    // Mark map as ready when loaded
    map.current.on('load', () => {
      setMapReady(true);
    });
    
    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);
  
  // Update map style based on layer toggles
  useEffect(() => {
    if (!mapReady || !map.current) return;
    
    // Handle satellite view toggle
    if (mapLayers.satellite) {
      map.current.setStyle('mapbox://styles/mapbox/satellite-streets-v11');
    } else {
      map.current.setStyle('mapbox://styles/mapbox/streets-v11');
    }
    
    // Note: Traffic and weather layers would be added here
    // For traffic, you'd use Mapbox's traffic layers
    // For weather, you'd need to integrate with a weather API that provides tile overlays
    
    // Placeholder for future weather overlay implementation
    if (mapLayers.weather && weatherData) {
      // Weather overlay would be implemented here
      console.log('Weather overlay would show data:', weatherData);
    }
  }, [mapLayers, mapReady, weatherData]);
  
  // Add and update route on the map
  useEffect(() => {
    if (!mapReady || !map.current || !tripData?.route) return;
    
    // Check if route layer already exists
    if (!map.current.getSource('route')) {
      // Convert route format to GeoJSON
      const routeGeoJSON = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: tripData.route.map(point => [point.longitude, point.latitude])
        }
      };
      
      // Add route source and layer
      map.current.addSource('route', {
        type: 'geojson',
        data: routeGeoJSON
      });
      
      map.current.addLayer({
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
    } else {
      // Update existing route
      map.current.getSource('route').setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: tripData.route.map(point => [point.longitude, point.latitude])
        }
      });
    }
    
    // Add stop markers
    if (tripData.stops && !map.current.getSource('stops')) {
      const stopsGeoJSON = {
        type: 'FeatureCollection',
        features: tripData.stops.map(stop => ({
          type: 'Feature',
          properties: {
            id: stop.id,
            name: stop.name,
            description: stop.description,
            type: stop.type,
            charging: stop.charging,
            overnight: stop.overnight
          },
          geometry: {
            type: 'Point',
            coordinates: [stop.longitude, stop.latitude]
          }
        }))
      };
      
      map.current.addSource('stops', {
        type: 'geojson',
        data: stopsGeoJSON
      });
      
      // Add a symbol layer for stops
      map.current.addLayer({
        id: 'stops-markers',
        type: 'symbol',
        source: 'stops',
        layout: {
          'icon-image': [
            'match',
            ['get', 'type'],
            'overnight', 'lodging',
            'charging', 'charging-station',
            'waypoint'
          ],
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
          'text-halo-width': 1
        }
      });
      
      // Add click handler for stops
      map.current.on('click', 'stops-markers', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const { name, description, type } = e.features[0].properties;
        
        // Create popup content
        const popupContent = `
          <div class="map-popup">
            <h4>${name}</h4>
            <p>${description}</p>
            <p class="stop-type">Type: ${type.charAt(0).toUpperCase() + type.slice(1)}</p>
          </div>
        `;
        
        // Create popup
        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(popupContent)
          .addTo(map.current);
      });
      
      // Change cursor on hover
      map.current.on('mouseenter', 'stops-markers', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });
      
      map.current.on('mouseleave', 'stops-markers', () => {
        map.current.getCanvas().style.cursor = '';
      });
    } else if (tripData.stops && map.current.getSource('stops')) {
      // Update existing stops
      const stopsGeoJSON = {
        type: 'FeatureCollection',
        features: tripData.stops.map(stop => ({
          type: 'Feature',
          properties: {
            id: stop.id,
            name: stop.name,
            description: stop.description,
            type: stop.type,
            charging: stop.charging,
            overnight: stop.overnight
          },
          geometry: {
            type: 'Point',
            coordinates: [stop.longitude, stop.latitude]
          }
        }))
      };
      
      map.current.getSource('stops').setData(stopsGeoJSON);
    }
  }, [tripData, mapReady]);
  
  // Add and update vehicle marker
  useEffect(() => {
    if (!mapReady || !map.current || !vehicleData) return;
    
    const { latitude, longitude } = vehicleData;
    
    if (!vehicleMarker.current) {
      // Create a vehicle marker element
      const el = document.createElement('div');
      el.className = 'vehicle-marker';
      el.innerHTML = '🚗';
      el.style.fontSize = '24px';
      
      // Add vehicle marker to map
      vehicleMarker.current = new mapboxgl.Marker(el)
        .setLngLat([longitude, latitude])
        .addTo(map.current);
      
      // Add popup for vehicle
      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setHTML(`
          <div class="vehicle-popup">
            <h4>${vehicleData.name}</h4>
            <p>Battery: ${Math.round(vehicleData.batteryLevel)}%</p>
            <p>Range: ~${Math.round(vehicleData.range)} mi</p>
            <p>Speed: ${Math.round(vehicleData.speed)} mph</p>
          </div>
        `);
      
      vehicleMarker.current.setPopup(popup);
    } else {
      // Update marker position
      vehicleMarker.current.setLngLat([longitude, latitude]);
      
      // Update popup content
      if (vehicleMarker.current.getPopup()) {
        vehicleMarker.current.getPopup().setHTML(`
          <div class="vehicle-popup">
            <h4>${vehicleData.name}</h4>
            <p>Battery: ${Math.round(vehicleData.batteryLevel)}%</p>
            <p>Range: ~${Math.round(vehicleData.range)} mi</p>
            <p>Speed: ${Math.round(vehicleData.speed)} mph</p>
          </div>
        `);
      }
    }
  }, [vehicleData, mapReady]);
  
  // Center map on vehicle location when asked
  const centerMapOnVehicle = () => {
    if (!map.current || !vehicleData) return;
    
    map.current.flyTo({
      center: [vehicleData.longitude, vehicleData.latitude],
      zoom: 12,
      essential: true
    });
  };
  
  return (
    <div className="map-container">
      <div ref={mapContainer} className="map" />
      
      {vehicleData && (
        <button 
          className="center-vehicle-btn"
          onClick={centerMapOnVehicle}
          aria-label="Center map on vehicle"
        >
          <span className="center-icon">🎯</span>
        </button>
      )}
    </div>
  );
};

Map.propTypes = {
  vehicleData: PropTypes.shape({
    latitude: PropTypes.number,
    longitude: PropTypes.number,
    batteryLevel: PropTypes.number,
    range: PropTypes.number,
    speed: PropTypes.number,
    name: PropTypes.string
  }),
  tripData: PropTypes.shape({
    route: PropTypes.arrayOf(
      PropTypes.shape({
        latitude: PropTypes.number,
        longitude: PropTypes.number
      })
    ),
    stops: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        latitude: PropTypes.number,
        longitude: PropTypes.number,
        type: PropTypes.string,
        description: PropTypes.string,
        charging: PropTypes.bool,
        overnight: PropTypes.bool
      })
    )
  }),
  weatherData: PropTypes.object,
  mapLayers: PropTypes.shape({
    weather: PropTypes.bool,
    traffic: PropTypes.bool,
    satellite: PropTypes.bool
  })
};

export default Map;
