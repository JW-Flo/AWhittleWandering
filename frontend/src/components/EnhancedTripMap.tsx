import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '../styles/EnhancedTripMap.css';
import { useVehicleData } from '../hooks/useVehicleData';
import { usePerformanceMonitor } from '../utils/performanceMonitor';

// Set Mapbox token
mapboxgl.accessToken = 'pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJteHA0cjYwYXRjMm1weGgwdnk5YWw2In0.0Bj4LWRpeefn0qPj_2VHcA';

interface MapState {
  zoom: number;
  center: [number, number];
  bearing: number;
  pitch: number;
}

interface TeslaMarkerProps {
  position: [number, number];
  bearing?: number;
  isCharging?: boolean;
  batteryLevel?: number;
}

const TeslaMarker: React.FC<TeslaMarkerProps> = ({ 
  position, 
  bearing = 0, 
  isCharging = false, 
  batteryLevel = 0 
}) => {
  return (
    <div 
      className="tesla-marker"
      style={{
        transform: `rotate(${bearing}deg)`,
        '--battery-level': `${batteryLevel}%`
      } as React.CSSProperties}
    >
      <div className={`tesla-icon ${isCharging ? 'charging' : ''}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L13.09 8.26L20 9L14 12L15.09 18.26L12 22L8.91 18.26L10 12L4 9L10.91 8.26L12 2Z"
            fill="currentColor"
          />
        </svg>
      </div>
      {isCharging && (
        <div className="charging-indicator">
          <div className="charging-bolt">⚡</div>
        </div>
      )}
      <div className="battery-indicator">
        <div className="battery-fill" style={{ width: `${batteryLevel}%` }} />
      </div>
    </div>
  );
};

export default function EnhancedTripMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const teslaMarker = useRef<mapboxgl.Marker | null>(null);
  const animationFrame = useRef<number | null>(null);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapState, setMapState] = useState<MapState>({
    zoom: 3.5,
    center: [-98.5795, 39.8283],
    bearing: 0,
    pitch: 0
  });
  
  const { currentLocation, routeHistory, isLoading, error } = useVehicleData();
  const { startTiming, trackMapMetrics, trackApiRequest } = usePerformanceMonitor();

  // Initialize map with performance tracking
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    const endTiming = startTiming('mapInitialization');
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: mapState.center,
      zoom: mapState.zoom,
      bearing: mapState.bearing,
      pitch: mapState.pitch,
      antialias: true
    });
    
    // Add map controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    map.current.addControl(new mapboxgl.ScaleControl({ maxWidth: 100 }), 'bottom-left');
    
    // Track performance metrics
    trackMapMetrics(map.current);
    
    map.current.on('load', () => {
      setMapLoaded(true);
      endTiming();
      
      // Add custom map layers for enhanced visualization
      addCustomLayers();
      
      // Add smooth transitions
      map.current!.easeTo({
        duration: 2000,
        easing: (t) => t * (2 - t) // easeOutQuad
      });
    });
    
    // Handle map state changes
    map.current.on('move', () => {
      if (map.current) {
        setMapState({
          zoom: map.current.getZoom(),
          center: map.current.getCenter().toArray() as [number, number],
          bearing: map.current.getBearing(),
          pitch: map.current.getPitch()
        });
      }
    });
    
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Add custom map layers for enhanced visualization
  const addCustomLayers = useCallback(() => {
    if (!map.current || !mapLoaded) return;

    // Add 3D terrain
    map.current.addSource('mapbox-dem', {
      type: 'raster-dem',
      url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
      tileSize: 512,
      maxzoom: 14
    });
    
    map.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

    // Add atmospheric lighting
    map.current.setFog({
      color: 'rgb(186, 210, 235)',
      'high-color': 'rgb(36, 92, 223)',
      'horizon-blend': 0.02,
      'space-color': 'rgb(11, 11, 25)',
      'star-intensity': 0.6
    });

    // Add highway layer for better route visualization
    map.current.addLayer({
      id: 'highway-glow',
      type: 'line',
      source: {
        type: 'vector',
        url: 'mapbox://mapbox.mapbox-streets-v8'
      },
      'source-layer': 'road',
      filter: ['==', 'class', 'motorway'],
      paint: {
        'line-color': '#4264fb',
        'line-width': ['interpolate', ['linear'], ['zoom'], 5, 1, 14, 6],
        'line-opacity': 0.6,
        'line-blur': 2
      }
    });
  }, [mapLoaded]);

  // Animate Tesla marker position with smooth transitions
  const animateTeslaPosition = useCallback((
    newPosition: [number, number], 
    bearing: number = 0,
    duration: number = 2000
  ) => {
    if (!teslaMarker.current || !map.current) return;

    const startPosition = teslaMarker.current.getLngLat().toArray() as [number, number];
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth easing function
      const easeProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      
      // Interpolate position
      const currentLng = startPosition[0] + (newPosition[0] - startPosition[0]) * easeProgress;
      const currentLat = startPosition[1] + (newPosition[1] - startPosition[1]) * easeProgress;
      
      teslaMarker.current!.setLngLat([currentLng, currentLat]);
      
      // Update marker rotation
      const markerElement = teslaMarker.current!.getElement();
      if (markerElement) {
        markerElement.style.transform = `rotate(${bearing}deg)`;
      }
      
      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      }
    };
    
    animationFrame.current = requestAnimationFrame(animate);
  }, []);

  // Update Tesla marker when location changes
  useEffect(() => {
    if (!mapLoaded || !map.current || !currentLocation) return;

    const position: [number, number] = [currentLocation.longitude, currentLocation.latitude];
    
    if (!teslaMarker.current) {
      // Create Tesla marker with custom element
      const el = document.createElement('div');
      el.innerHTML = `
        <div class="tesla-marker ${currentLocation.charging ? 'charging' : ''}">
          <div class="tesla-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L13.09 8.26L20 9L14 12L15.09 18.26L12 22L8.91 18.26L10 12L4 9L10.91 8.26L12 2Z" fill="#1a73e8"/>
            </svg>
          </div>
          ${currentLocation.charging ? '<div class="charging-indicator">⚡</div>' : ''}
          <div class="battery-indicator">
            <div class="battery-fill" style="width: ${currentLocation.batteryLevel || 0}%"></div>
          </div>
        </div>
      `;
      
      teslaMarker.current = new mapboxgl.Marker(el)
        .setLngLat(position)
        .addTo(map.current);
      
      // Center map on Tesla location with smooth animation
      map.current.flyTo({
        center: position,
        zoom: 10,
        speed: 1.2,
        curve: 1.42,
        easing: (t) => t
      });
    } else {
      // Animate to new position
      animateTeslaPosition(position, 0, 2000);
    }
  }, [mapLoaded, currentLocation, animateTeslaPosition]);

  // Add route visualization with enhanced styling
  useEffect(() => {
    if (!mapLoaded || !map.current || !routeHistory || routeHistory.length === 0) return;

    const routeCoordinates = routeHistory.map(point => [point.longitude, point.latitude]);
    
    // Remove existing route if it exists
    if (map.current.getSource('route')) {
      map.current.removeLayer('route-glow');
      map.current.removeLayer('route');
      map.current.removeSource('route');
    }

    // Add route source
    map.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: routeCoordinates
        }
      }
    });

    // Add route glow effect
    map.current.addLayer({
      id: 'route-glow',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#ffffff',
        'line-width': ['interpolate', ['linear'], ['zoom'], 5, 8, 14, 16],
        'line-opacity': 0.4,
        'line-blur': 4
      }
    }, 'highway-glow');

    // Add main route line
    map.current.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#1a73e8',
        'line-width': ['interpolate', ['linear'], ['zoom'], 5, 4, 14, 8],
        'line-opacity': 0.9
      }
    });

    // Add route animation
    let animationCounter = 0;
    const animateRoute = () => {
      const dashArray = [
        animationCounter,
        1.5
      ];
      
      if (map.current && map.current.getLayer('route')) {
        map.current.setPaintProperty('route', 'line-dasharray', dashArray);
        animationCounter = animationCounter + 0.01;
        if (animationCounter > 1.5) animationCounter = 0;
        requestAnimationFrame(animateRoute);
      }
    };
    
    animateRoute();
  }, [mapLoaded, routeHistory]);

  // Add real-time stats overlay
  const StatsOverlay = () => (
    <div className="map-stats-overlay">
      {currentLocation && (
        <>
          <div className="stat-item">
            <span className="stat-label">Battery</span>
            <span className="stat-value">{currentLocation.batteryLevel || 0}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Speed</span>
            <span className="stat-value">{currentLocation.speed || 0} mph</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">State</span>
            <span className="stat-value">{currentLocation.state || 'Unknown'}</span>
          </div>
          {currentLocation.charging && (
            <div className="stat-item charging">
              <span className="stat-label">Status</span>
              <span className="stat-value">⚡ Charging</span>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="enhanced-trip-map">
      <div className="map-header">
        <h1>Live Tesla Journey</h1>
        <p>Real-time tracking across the Continental United States</p>
        
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            Unable to load tracking data. Retrying...
          </div>
        )}
      </div>
      
      <div className="map-container" ref={mapContainer}>
        {isLoading && (
          <div className="map-loading">
            <div className="loading-spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
            </div>
            <p>Loading journey data...</p>
          </div>
        )}
        
        <StatsOverlay />
        
        <div className="map-controls">
          <button 
            className="control-btn"
            onClick={() => {
              if (map.current && currentLocation) {
                map.current.flyTo({
                  center: [currentLocation.longitude, currentLocation.latitude],
                  zoom: 12,
                  speed: 1.5
                });
              }
            }}
          >
            📍 Follow Tesla
          </button>
          
          <button 
            className="control-btn"
            onClick={() => {
              if (map.current && routeHistory && routeHistory.length > 0) {
                const bounds = new mapboxgl.LngLatBounds();
                routeHistory.forEach(point => {
                  bounds.extend([point.longitude, point.latitude]);
                });
                map.current.fitBounds(bounds, { padding: 50 });
              }
            }}
          >
            🗺️ View Route
          </button>
        </div>
      </div>
      
      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-icon tesla-icon-small">⭐</div>
          <span>Current Tesla Location</span>
        </div>
        <div className="legend-item">
          <div className="legend-color route-color"></div>
          <span>Journey Route</span>
        </div>
        <div className="legend-item">
          <div className="legend-color highway-color"></div>
          <span>Major Highways</span>
        </div>
      </div>
    </div>
  );
}
