import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useVehicleData } from '../hooks/useVehicleData';

// Set Mapbox token directly (fallback to direct token if environment variables are not available)
// This is a public token, safe to embed in code
mapboxgl.accessToken = 'pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJteHA0cjYwYXRjMm1weGgwdnk5YWw2In0.0Bj4LWRpeefn0qPj_2VHcA';

export default function TripMapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Fetch vehicle data (current location, route history)
  const { currentLocation, routeHistory, isLoading, error } = useVehicleData();
  
  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-98.5795, 39.8283], // Center of USA
      zoom: 3.5
    });
    
    map.current.on('load', () => {
      setMapLoaded(true);
    });
    
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);
  
  // Add vehicle marker and route line when data is loaded
  useEffect(() => {
    if (!mapLoaded || !map.current || isLoading || error) return;
    
    // If we have current location data, add a marker
    if (currentLocation) {
      // Add vehicle marker
      const el = document.createElement('div');
      el.className = 'vehicle-marker';
      
      // Create a marker for the current location
      new mapboxgl.Marker(el)
        .setLngLat([currentLocation.longitude, currentLocation.latitude])
        .addTo(map.current);
      
      // Center map on current location
      map.current.flyTo({
        center: [currentLocation.longitude, currentLocation.latitude],
        zoom: 8,
        speed: 1.5
      });
    }
    
    // Add the route line if we have route history
    if (routeHistory && routeHistory.length > 0) {
      // Check if the 'route' source already exists
      if (map.current.getSource('route')) {
        // If it exists, update its data
        (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: routeHistory.map(point => [point.longitude, point.latitude])
          }
        });
      } else {
        // Add the route line source
        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: routeHistory.map(point => [point.longitude, point.latitude])
            }
          }
        });

        // Add the route line layer
        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3887be',
            'line-width': 5,
            'line-opacity': 0.75
          }
        });
      }
    }
  }, [mapLoaded, currentLocation, routeHistory, isLoading, error]);
  
  return (
    <div className="trip-map-page">
      <div className="map-header">
        <h1>Live Trip Map</h1>
        <p>Follow our journey in real-time as we travel across the United States</p>
        
        {error && (
          <div className="error-message">
            Unable to load map data. Please try again later.
          </div>
        )}
        
        {currentLocation && (
          <div className="current-location-info">
            <h2>Current Location</h2>
            <p>
              <strong>State:</strong> {currentLocation.state || 'Unknown'}<br />
              <strong>Last Updated:</strong> {new Date(currentLocation.timestamp).toLocaleString()}<br />
              {currentLocation.charging && <span className="charging-indicator">Currently Charging</span>}
            </p>
          </div>
        )}
      </div>
      
      <div className="map-container" ref={mapContainer}>
        {isLoading && (
          <div className="map-loading">
            <div className="loader"></div>
            <p>Loading map data...</p>
          </div>
        )}
      </div>
      
      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-color route-color"></div>
          <span>Route traveled</span>
        </div>
        <div className="legend-item">
          <div className="legend-icon vehicle-icon"></div>
          <span>Current location</span>
        </div>
        <div className="legend-item">
          <div className="legend-color planned-route-color"></div>
          <span>Planned route</span>
        </div>
      </div>
    </div>
  );
}
