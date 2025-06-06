#!/usr/bin/env node
/* eslint-disable no-undef, no-console */
/**
 * fix-map-functionality.cjs
 * 
 * This script analyzes and fixes map functionality issues in the 48 Continental USA project.
 * It checks for coordinate format inconsistencies, environment variables, and ensures proper
 * data pipeline between components.
 */

const fs = require('fs');
const path = require('path');

// ========================
// Constants and Configuration
// ========================

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const DATA_DIR = path.join(__dirname, 'src', 'data');
const SRC_DIR = path.join(__dirname, 'src');
const ENV_FILE = path.join(__dirname, '.env');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// ========================
// Utility Functions
// ========================

/**
 * Log with colors
 */
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  let prefix = '';
  let color = '';
  
  switch (type) {
    case 'error':
      prefix = '[ERROR]';
      color = COLORS.red;
      break;
    case 'warning':
      prefix = '[WARNING]';
      color = COLORS.yellow;
      break;
    case 'success':
      prefix = '[SUCCESS]';
      color = COLORS.green;
      break;
    case 'debug':
      prefix = '[DEBUG]';
      color = COLORS.dim;
      break;
    default:
      prefix = '[INFO]';
      color = COLORS.blue;
      break;
  }
  
  console.log(`${color}${prefix}${COLORS.reset} ${message}`);
}

/**
 * Validate a single coordinate pair
 */
function validateCoordinates(coords) {
  // Handle array format [lng, lat]
  if (Array.isArray(coords) && coords.length === 2) {
    const [first, second] = coords.map(v => typeof v === 'string' ? parseFloat(v) : v);
    
    // Skip if invalid numbers
    if (isNaN(first) || isNaN(second)) return null;
    
    // Longitude: -180 to 180, Latitude: -90 to 90
    const validFirst = Math.abs(first) <= 180;
    const validSecond = Math.abs(second) <= 90;
    
    if (validFirst && validSecond) {
      // If first looks like longitude and second like latitude (correct GeoJSON order)
      if (Math.abs(first) > 90 || Math.abs(second) <= 90) {
        return [first, second]; // [longitude, latitude]
      }
    }
    
    // If first looks like latitude and second like longitude (swapped)
    if (Math.abs(first) <= 90 && Math.abs(second) <= 180 && Math.abs(second) > 90) {
      log(`Fixing swapped coordinates: [${first}, ${second}] → [${second}, ${first}]`, 'debug');
      return [second, first]; // [longitude, latitude]
    }
  }
  
  // Handle object with lat/lng or latitude/longitude properties
  if (coords && typeof coords === 'object') {
    let lng, lat;
    
    // Handle latitude/longitude properties
    if (coords.latitude !== undefined && coords.longitude !== undefined) {
      lat = typeof coords.latitude === 'string' ? parseFloat(coords.latitude) : coords.latitude;
      lng = typeof coords.longitude === 'string' ? parseFloat(coords.longitude) : coords.longitude;
    }
    // Handle lat/lng properties (GeoJSON style)
    else if (coords.lat !== undefined && coords.lng !== undefined) {
      lat = typeof coords.lat === 'string' ? parseFloat(coords.lat) : coords.lat;
      lng = typeof coords.lng === 'string' ? parseFloat(coords.lng) : coords.lng;
    }
    // Handle coordinates array property
    else if (coords.coordinates && Array.isArray(coords.coordinates) && coords.coordinates.length === 2) {
      return validateCoordinates(coords.coordinates);
    }
    
    // Skip if invalid numbers
    if (lng === undefined || lat === undefined || isNaN(lng) || isNaN(lat)) return null;
    
    // Check if values are within valid ranges
    const validLng = Math.abs(lng) <= 180;
    const validLat = Math.abs(lat) <= 90;
    
    if (!validLng || !validLat) {
      // Check if they're swapped
      if (Math.abs(lng) <= 90 && Math.abs(lat) <= 180 && Math.abs(lat) > 90) {
        log(`Fixing swapped lat/lng properties: {lat: ${lat}, lng: ${lng}} → {lat: ${lng}, lng: ${lat}}`, 'debug');
        return [lat, lng]; // [longitude, latitude] with swapped values
      }
      return null;
    }
    
    return [lng, lat]; // [longitude, latitude]
  }
  
  return null;
}

/**
 * Ensure directories exist
 */
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    log(`Creating directory: ${dir}`, 'debug');
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Fix environment variables
 */
function fixEnvironmentVariables() {
  log('Checking environment variables...');
  
  try {
    let envContent = '';
    let updated = false;
    
    // Read existing .env file if it exists
    if (fs.existsSync(ENV_FILE)) {
      envContent = fs.readFileSync(ENV_FILE, 'utf8');
    }
    
    // Check for MapBox token
    if (!envContent.includes('VITE_MAPBOX_TOKEN=') && !envContent.includes('REACT_APP_MAPBOX_TOKEN=')) {
      log('MapBox token missing in .env file', 'warning');
      
      // Default MapBox token from the project
      const defaultToken = 'pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJmNXlwY2IycGdtMnFva2liaTA4enIwIn0.tU9_tLaaxXxhfcVX4WhOeA';
      envContent += `\n# MapBox token for map rendering\nVITE_MAPBOX_TOKEN=${defaultToken}\n`;
      updated = true;
      
      log('Added MapBox token to .env file', 'success');
    }
    
    // Check for Edge Worker URL
    if (!envContent.includes('VITE_EDGE_WORKER_URL=')) {
      log('Edge Worker URL missing in .env file', 'warning');
      envContent += `\n# Edge Worker URL for API access\nVITE_EDGE_WORKER_URL=http://localhost:8787\n`;
      updated = true;
      
      log('Added Edge Worker URL to .env file', 'success');
    }
    
    // Write updated .env file if changes were made
    if (updated) {
      fs.writeFileSync(ENV_FILE, envContent);
      log('Updated .env file with required variables', 'success');
    } else {
      log('Environment variables are properly configured', 'success');
    }
  } catch (error) {
    log(`Error checking environment variables: ${error.message}`, 'error');
  }
}

/**
 * Fix trip data coordinate formats
 */
function fixTripDataCoordinates() {
  log('Fixing trip data coordinate formats...');
  
  try {
    // Ensure data directory exists
    ensureDirectoryExists(DATA_DIR);
    
    // Read the itinerary file from project root
    const itineraryPath = path.join(PROJECT_ROOT, 'itinerary.json');
    if (!fs.existsSync(itineraryPath)) {
      log(`Itinerary file not found: ${itineraryPath}`, 'error');
      return false;
    }
    
    log(`Reading input file: ${itineraryPath}`);
    const data = JSON.parse(fs.readFileSync(itineraryPath, 'utf8'));
    log('File loaded successfully. Processing data...');
    
    // Process route coordinates
    let routeCoordinates = [];
    if (data.route && Array.isArray(data.route)) {
      routeCoordinates = data.route
        .map(point => {
          const normalized = validateCoordinates(point);
          if (normalized) {
            const [longitude, latitude] = normalized;
            return { latitude, longitude };
          }
          return null;
        })
        .filter(Boolean);
    }
    
    // Process stop coordinates
    let stops = [];
    if (data.stops && Array.isArray(data.stops)) {
      stops = data.stops
        .map(stop => {
          const normalized = validateCoordinates(stop);
          if (normalized) {
            const [longitude, latitude] = normalized;
            
            // Keep all original properties but update coordinates
            return {
              ...stop,
              longitude,
              latitude,
              coordinates: [longitude, latitude] // Add GeoJSON-compatible coordinates array
            };
          }
          return null;
        })
        .filter(Boolean);
    }
    
    // Create normalized trip data
    const tripData = {
      ...data,
      route: routeCoordinates,
      stops: stops
    };
    
    // Create GeoJSON format
    const geoJSON = {
      type: 'FeatureCollection',
      features: [
        // Route as LineString
        {
          type: 'Feature',
          properties: {
            type: 'route'
          },
          geometry: {
            type: 'LineString',
            coordinates: routeCoordinates.map(point => [point.longitude, point.latitude])
          }
        },
        // Stops as Points
        ...stops.map(stop => ({
          type: 'Feature',
          properties: {
            id: stop.id || `stop-${Math.random().toString(36).substr(2, 9)}`,
            name: stop.name || 'Unknown',
            description: stop.description || '',
            type: stop.type || 'waypoint',
            overnight: stop.overnight || false,
            charging: stop.charging || false,
            state: stop.state || ''
          },
          geometry: {
            type: 'Point',
            coordinates: [stop.longitude, stop.latitude]
          }
        }))
      ]
    };
    
    // Write the normalized data files
    const tripDataPath = path.join(DATA_DIR, 'trip-data.json');
    const geoJSONPath = path.join(DATA_DIR, 'trip-data.geojson');
    
    fs.writeFileSync(tripDataPath, JSON.stringify(tripData, null, 2));
    fs.writeFileSync(geoJSONPath, JSON.stringify(geoJSON, null, 2));
    
    log(`Processed ${routeCoordinates.length} route points and ${stops.length} stops`, 'success');
    log(`Normalized trip data written to: ${tripDataPath}`, 'success');
    log(`GeoJSON data written to: ${geoJSONPath}`, 'success');
    
    // Validate the generated files
    const validationResult = validateCoordinateFormats(geoJSONPath);
    if (validationResult) {
      log('Validation passed! All coordinates are in the correct format.', 'success');
    } else {
      log('Validation failed. Some coordinates may still have issues.', 'error');
    }
    
    return true;
  } catch (error) {
    log(`Error fixing trip data coordinates: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Validate coordinate formats in a GeoJSON file
 */
function validateCoordinateFormats(filePath) {
  try {
    // Read the GeoJSON file
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
      log('Invalid GeoJSON format', 'error');
      return false;
    }
    
    let isValid = true;
    
    // Check all features
    for (const feature of data.features) {
      if (!feature.geometry || !feature.geometry.coordinates) {
        log(`Feature missing geometry or coordinates: ${JSON.stringify(feature)}`, 'error');
        isValid = false;
        continue;
      }
      
      // LineString - array of [lng, lat] pairs
      if (feature.geometry.type === 'LineString') {
        for (const coord of feature.geometry.coordinates) {
          if (!Array.isArray(coord) || coord.length !== 2) {
            log(`Invalid LineString coordinate: ${JSON.stringify(coord)}`, 'error');
            isValid = false;
            continue;
          }
          
          const [lng, lat] = coord;
          
          // Validate longitude and latitude ranges
          if (typeof lng !== 'number' || isNaN(lng) || Math.abs(lng) > 180) {
            log(`Invalid longitude value: ${lng}`, 'error');
            isValid = false;
          }
          
          if (typeof lat !== 'number' || isNaN(lat) || Math.abs(lat) > 90) {
            log(`Invalid latitude value: ${lat}`, 'error');
            isValid = false;
          }
        }
      }
      
      // Point - single [lng, lat] pair
      if (feature.geometry.type === 'Point') {
        const coord = feature.geometry.coordinates;
        
        if (!Array.isArray(coord) || coord.length !== 2) {
          log(`Invalid Point coordinate: ${JSON.stringify(coord)}`, 'error');
          isValid = false;
          continue;
        }
        
        const [lng, lat] = coord;
        
        // Validate longitude and latitude ranges
        if (typeof lng !== 'number' || isNaN(lng) || Math.abs(lng) > 180) {
          log(`Invalid longitude value: ${lng}`, 'error');
          isValid = false;
        }
        
        if (typeof lat !== 'number' || isNaN(lat) || Math.abs(lat) > 90) {
          log(`Invalid latitude value: ${lat}`, 'error');
          isValid = false;
        }
      }
    }
    
    return isValid;
  } catch (error) {
    log(`Error validating coordinate formats: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Create a minimal Map test component
 */
function createMinimalMapTest() {
  log('Creating minimal map test component...');
  
  try {
    const componentDir = path.join(SRC_DIR, 'components');
    ensureDirectoryExists(componentDir);
    
    const jsxPath = path.join(componentDir, 'MinimalMapTest.jsx');
    const cssPath = path.join(componentDir, 'MinimalMapTest.css');
    
    // Create JSX file
    const jsxContent = `/**
 * MinimalMapTest.jsx
 * 
 * A minimal, standalone component to test MapBox rendering
 * without any dependencies on other components or hooks.
 */

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import './MinimalMapTest.css';

// Using direct token for testing
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJmNXlwY2IycGdtMnFva2liaTA4enIwIn0.tU9_tLaaxXxhfcVX4WhOeA';
mapboxgl.accessToken = MAPBOX_TOKEN;

const MinimalMapTest = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  // Add a log entry
  const addLog = (message) => {
    console.log(\`[MinimalMapTest] \${message}\`);
    setLogs(prev => [...prev, \`[\${new Date().toLocaleTimeString()}] \${message}\`]);
  };

  useEffect(() => {
    if (map.current) return; // Map already initialized
    
    try {
      addLog('Initializing map...');
      addLog(\`Using token: \${MAPBOX_TOKEN.substring(0, 10)}...\`);
      
      // Initialize map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-96, 37.8], // Center of US
        zoom: 3
      });
      
      // Add navigation control
      map.current.addControl(new mapboxgl.NavigationControl());
      
      // Handle map load event
      map.current.on('load', () => {
        addLog('Map loaded successfully');
        
        // Attempt to load GeoJSON data
        try {
          fetch('/src/data/trip-data.geojson')
            .then(response => {
              if (!response.ok) {
                throw new Error(\`Failed to load GeoJSON: \${response.status}\`);
              }
              return response.json();
            })
            .then(data => {
              addLog(\`Loaded GeoJSON with \${data.features?.length || 0} features\`);
              
              // Add route source and layer
              const routeFeature = data.features.find(f => 
                f.properties?.type === 'route' && f.geometry?.type === 'LineString'
              );
              
              if (routeFeature && routeFeature.geometry.coordinates.length > 0) {
                map.current.addSource('route', {
                  type: 'geojson',
                  data: {
                    type: 'FeatureCollection',
                    features: [routeFeature]
                  }
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
                    'line-color': '#0080ff',
                    'line-width': 3
                  }
                });
                
                addLog('Added route layer');
              }
              
              // Add stop markers
              const stopFeatures = data.features.filter(f => 
                f.geometry?.type === 'Point'
              );
              
              if (stopFeatures.length > 0) {
                // Add stops as a source
                map.current.addSource('stops', {
                  type: 'geojson',
                  data: {
                    type: 'FeatureCollection',
                    features: stopFeatures
                  }
                });
                
                // Add circles for stops
                map.current.addLayer({
                  id: 'stops-circles',
                  type: 'circle',
                  source: 'stops',
                  paint: {
                    'circle-radius': 6,
                    'circle-color': '#B42222',
                    'circle-stroke-width': 2,
                    'circle-stroke-color': 'white'
                  }
                });
                
                addLog(\`Added \${stopFeatures.length} stop markers\`);
              }
            })
            .catch(err => {
              addLog(\`Error loading GeoJSON: \${err.message}\`);
            });
        } catch (err) {
          addLog(\`Error in GeoJSON loading: \${err.message}\`);
        }
      });
      
      // Handle map errors
      map.current.on('error', (e) => {
        const errorMessage = e.error ? e.error.message : 'Unknown map error';
        addLog(\`Map error: \${errorMessage}\`);
        setError(errorMessage);
      });
      
    } catch (err) {
      addLog(\`Error initializing map: \${err.message}\`);
      setError(err.message);
    }
    
    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div className="minimal-map-container">
      <h2>Minimal Map Test</h2>
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}
      <div ref={mapContainer} className="map" />
      <div className="log-container">
        <h3>Log</h3>
        <div className="logs">
          {logs.map((log, i) => (
            <div key={i} className="log-entry">{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MinimalMapTest;
`;
    
    // Create CSS file
    const cssContent = `/* MinimalMapTest.css */

.minimal-map-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
}

.minimal-map-container h2 {
  margin-top: 0;
  margin-bottom: 10px;
}

.minimal-map-container .map {
  width: 100%;
  height: 400px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.minimal-map-container .error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.minimal-map-container .log-container {
  margin-top: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  background-color: #f9f9f9;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.minimal-map-container .log-container h3 {
  margin-top: 0;
  margin-bottom: 10px;
}

.minimal-map-container .logs {
  overflow-y: auto;
  background-color: #222;
  color: #fff;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  flex: 1;
  max-height: 200px;
}

.minimal-map-container .log-entry {
  margin-bottom: 5px;
  line-height: 1.4;
}
`;
    
    // Write files
    fs.writeFileSync(jsxPath, jsxContent);
    fs.writeFileSync(cssPath, cssContent);
    
    log(`Created minimal map test component at ${jsxPath}`, 'success');
  } catch (error) {
    log(`Error creating minimal map test: ${error.message}`, 'error');
  }
}

/**
 * Create a map debugging tool
 */
function createMapDebugger() {
  log('Creating map debugging component...');
  
  try {
    const componentDir = path.join(SRC_DIR, 'components');
    ensureDirectoryExists(componentDir);
    
    const jsxPath = path.join(componentDir, 'MapDebug.jsx');
    const cssPath = path.join(componentDir, 'MapDebug.css');
    
    // Create JSX file
    const jsxContent = `/**
 * MapDebug.jsx
 * 
 * A debug component for testing map functionality,
 * displaying GeoJSON data, and analyzing coordinate formats.
 */

import React, { useState, useEffect } from 'react';
import './MapDebug.css';

const MapDebug = () => {
  const [geoJSON, setGeoJSON] = useState(null);
  const [tripData, setTripData] = useState(null);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('geojson');
  const [mapboxToken, setMapboxToken] = useState('');

  // Add a log entry
  const addLog = (message) => {
    console.log(\`[MapDebug] \${message}\`);
    setLogs(prev => [...prev, \`[\${new Date().toLocaleTimeString()}] \${message}\`]);
  };

  // Load data files
  useEffect(() => {
    // Try to get Mapbox token from environment
    const envToken = import.meta.env.VITE_MAPBOX_TOKEN || import.meta.env.REACT_APP_MAPBOX_TOKEN;
    if (envToken) {
      setMapboxToken(envToken);
      addLog(\`Found Mapbox token in environment: \${envToken.substring(0, 10)}...\`);
    } else {
      addLog('No Mapbox token found in environment');
    }
    
    // Load GeoJSON file
    fetch('/src/data/trip-data.geojson')
      .then(response => {
        if (!response.ok) {
          throw new Error(\`Failed to load GeoJSON: \${response.status}\`);
        }
        return response.json();
      })
      .then(data => {
        setGeoJSON(data);
        addLog(\`Loaded GeoJSON with \${data.features?.length || 0} features\`);
      })
      .catch(err => {
        addLog(\`Error loading GeoJSON: \${err.message}\`);
        setError(err.message);
      });
    
    // Load Trip Data JSON file
    fetch('/src/data/trip-data.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(\`Failed to load trip data: \${response.status}\`);
        }
        return response.json();
      })
      .then(data => {
        setTripData(data);
        addLog(\`Loaded trip data with \${data.stops?.length || 0} stops\`);
      })
      .catch(err => {
        addLog(\`Error loading trip data: \${err.message}\`);
      });
  }, []);

  // Validate coordinates
  const validateCoordinates = (coords) => {
    if (Array.isArray(coords) && coords.length === 2) {
      const [lng, lat] = coords;
      const validLng = typeof lng === 'number' && !isNaN(lng) && lng >= -180 && lng <= 180;
      const validLat = typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90;
      
      return validLng && validLat;
    }
    return false;
  };

  // Analyze GeoJSON
  const analyzeGeoJSON = () => {
    if (!geoJSON) return null;
    
    let routeFeatures = 0;
    let pointFeatures = 0;
    let invalidCoords = 0;
    
    geoJSON.features.forEach(feature => {
      if (feature.geometry.type === 'LineString') {
        routeFeatures++;
        feature.geometry.coordinates.forEach(coord => {
          if (!validateCoordinates(coord)) {
            invalidCoords++;
          }
        });
      } else if (feature.geometry.type === 'Point') {
        pointFeatures++;
        if (!validateCoordinates(feature.geometry.coordinates)) {
          invalidCoords++;
        }
      }
    });
    
    return {
      totalFeatures: geoJSON.features.length,
      routeFeatures,
      pointFeatures,
      invalidCoords
    };
  };

  // Format the coordinates as a readable string
  const formatCoords = (coords) => {
    if (Array.isArray(coords) && coords.length === 2) {
      return \`[\${coords[0].toFixed(4)}, \${coords[1].toFixed(4)}]\`;
    }
    return JSON.stringify(coords);
  };

  // Get analysis results
  const analysis = analyzeGeoJSON();

  return (
    <div className="map-debug-container">
      <h2>Map Debug Tool</h2>
      
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div className="debug-tabs">
        <button 
          className={\`tab-button \${activeTab === 'geojson' ? 'active' : ''}\`}
          onClick={() => setActiveTab('geojson')}
        >
          GeoJSON
        </button>
        <button 
          className={\`tab-button \${activeTab === 'tripdata' ? 'active' : ''}\`}
          onClick={() => setActiveTab('tripdata')}
        >
          Trip Data
        </button>
        <button 
          className={\`tab-button \${activeTab === 'logs' ? 'active' : ''}\`}
          onClick={() => setActiveTab('logs')}
        >
          Logs
        </button>
        <button 
          className={\`tab-button \${activeTab === 'environment' ? 'active' : ''}\`}
          onClick={() => setActiveTab('environment')}
        >
          Environment
        </button>
      </div>
      
      <div className="debug-content">
        {activeTab === 'geojson' && (
          <div className="geojson-tab">
            <div className="analysis-summary">
              {analysis ? (
                <>
                  <h3>GeoJSON Analysis</h3>
                  <div className="analysis-grid">
                    <div className="analysis-item">
                      <span>Total Features:</span>
                      <span>{analysis.totalFeatures}</span>
                    </div>
                    <div className="analysis-item">
