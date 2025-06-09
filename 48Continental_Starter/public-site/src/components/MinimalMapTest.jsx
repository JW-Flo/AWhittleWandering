/**
 * MinimalMapTest Component
 * 
 * A minimal implementation of MapBox GL JS for isolating and diagnosing
 * map rendering issues without the complexity of the full application.
 */

/* eslint-env browser */
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MinimalMapTest.css';

<<<<<<< HEAD
// Use the same token as the main Map component for consistency
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
=======
// Import the centralized MapBox configuration
import mapboxConfig from '@shared/mapbox/mapboxConfig.ts';

// Use the token from the centralized config
const MAPBOX_TOKEN = mapboxConfig.getMapboxToken();
>>>>>>> 98fd9db (Update dependencies and devDependencies for credential-manager and shared packages)
mapboxgl.accessToken = MAPBOX_TOKEN;

const MinimalMapTest = () => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const marker = useRef(null);
    const popup = useRef(null);

    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapError, setMapError] = useState(null);
    const [logs, setLogs] = useState([]);
    const [customCoords, setCustomCoords] = useState({ lat: 39.8283, lng: -98.5795 });

    // Add a log entry with timestamp
    const addLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { timestamp, message, type }]);
    };

    // Initialize map on component mount
    useEffect(() => {
        if (map.current) return; // Already initialized

        try {
            addLog('Initializing minimal map test');

            // Create the map instance
            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/streets-v11',
                center: [-98.5795, 39.8283], // Center of US in [longitude, latitude] format
                zoom: 3.5,
                minZoom: 2,
                maxZoom: 18
            });

            // Add navigation controls
            map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

            // Set up event handlers
            map.current.on('load', () => {
                addLog('Map loaded successfully', 'success');
                setMapLoaded(true);

                // Add basic GeoJSON source and layer
                try {
                    map.current.addSource('test-source', {
                        type: 'geojson',
                        data: {
                            type: 'FeatureCollection',
                            features: [
                                {
                                    type: 'Feature',
                                    geometry: {
                                        type: 'Point',
                                        coordinates: [-98.5795, 39.8283] // [longitude, latitude]
                                    },
                                    properties: {
                                        title: 'Center Point',
                                        description: 'Center of the continental US'
                                    }
                                }
                            ]
                        }
                    });

                    map.current.addLayer({
                        id: 'test-layer',
                        type: 'circle',
                        source: 'test-source',
                        paint: {
                            'circle-radius': 8,
                            'circle-color': '#3887be'
                        }
                    });

                    addLog('Added test GeoJSON source and layer', 'success');
                } catch (error) {
                    addLog(`Error adding GeoJSON: ${error.message}`, 'error');
                }

                // Add a marker at the center
                marker.current = new mapboxgl.Marker({ color: '#FF0000' })
                    .setLngLat([-98.5795, 39.8283])
                    .addTo(map.current);

                // Add a popup to the marker
                popup.current = new mapboxgl.Popup({ offset: 25 })
                    .setHTML('<h3>Center of US</h3><p>This is a test marker</p>')
                    .setLngLat([-98.5795, 39.8283])
                    .addTo(map.current);
            });

            map.current.on('error', (e) => {
                const errorMessage = e.error ? e.error.message : 'Unknown map error';
                addLog(`Map error: ${errorMessage}`, 'error');
                setMapError(errorMessage);
            });

            // Log when style loads
            map.current.on('styledata', () => {
                addLog('Map style loaded');
            });

            // Log when map moves
            map.current.on('moveend', () => {
                const center = map.current.getCenter();
                addLog(`Map moved to: [${center.lng.toFixed(4)}, ${center.lat.toFixed(4)}]`);
            });

        } catch (error) {
            addLog(`Fatal error initializing map: ${error.message}`, 'error');
            setMapError(error.message);
        }

        // Cleanup on unmount
        return () => {
            if (map.current) {
                addLog('Cleaning up map');
                map.current.remove();
                map.current = null;
            }
        };
    }, []);

    // Update marker position when custom coordinates change
    const updateMarkerPosition = () => {
        if (!map.current || !marker.current) return;

        try {
            // Format coordinates properly for MapBox [longitude, latitude]
            const lngLat = [customCoords.lng, customCoords.lat];

            // Validate coordinates
            if (isNaN(lngLat[0]) || isNaN(lngLat[1])) {
                addLog('Invalid coordinates, must be numbers', 'error');
                return;
            }

            if (Math.abs(lngLat[0]) > 180 || Math.abs(lngLat[1]) > 90) {
                addLog('Coordinates out of range (lng: -180 to 180, lat: -90 to 90)', 'error');
                return;
            }

            // Update marker and popup
            marker.current.setLngLat(lngLat);
            if (popup.current) {
                popup.current.setLngLat(lngLat);
            }

            // Fly to location
            map.current.flyTo({
                center: lngLat,
                zoom: 5,
                essential: true
            });

            addLog(`Updated marker position to [${lngLat[0]}, ${lngLat[1]}]`, 'success');
        } catch (error) {
            addLog(`Error updating marker: ${error.message}`, 'error');
        }
    };

    // Add a GeoJSON test line
    const addTestLine = () => {
        if (!map.current || !mapLoaded) return;

        try {
            // Remove existing line if it exists
            if (map.current.getSource('test-line')) {
                map.current.removeLayer('test-line-layer');
                map.current.removeSource('test-line');
                addLog('Removed existing test line');
            }

            // Create a simple line from marker to a few points
            const markerPosition = marker.current.getLngLat();
            const testLineData = {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        [markerPosition.lng, markerPosition.lat],
                        [markerPosition.lng + 5, markerPosition.lat + 2],
                        [markerPosition.lng + 10, markerPosition.lat - 3],
                        [markerPosition.lng + 15, markerPosition.lat + 1]
                    ]
                }
            };

            // Add the source and layer
            map.current.addSource('test-line', {
                type: 'geojson',
                data: testLineData
            });

            map.current.addLayer({
                id: 'test-line-layer',
                type: 'line',
                source: 'test-line',
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

            // Fit the map to show the full line
            const bounds = new mapboxgl.LngLatBounds();
            testLineData.geometry.coordinates.forEach(coord => {
                bounds.extend(coord);
            });

            map.current.fitBounds(bounds, {
                padding: 50,
                maxZoom: 8
            });

            addLog('Added test line feature', 'success');
        } catch (error) {
            addLog(`Error adding test line: ${error.message}`, 'error');
        }
    };

    // Toggle satellite/street style
    const toggleMapStyle = () => {
        if (!map.current) return;

        try {
            const currentStyle = map.current.getStyle().name;
            const newStyle = currentStyle.includes('Satellite')
                ? 'mapbox://styles/mapbox/streets-v11'
                : 'mapbox://styles/mapbox/satellite-streets-v11';

            map.current.setStyle(newStyle);
            addLog(`Changed map style to ${newStyle.includes('satellite') ? 'Satellite' : 'Streets'}`);
        } catch (error) {
            addLog(`Error changing map style: ${error.message}`, 'error');
        }
    };

    // Reset map to initial state
    const resetMap = () => {
        if (!map.current) return;

        try {
            // Reset zoom and center
            map.current.flyTo({
                center: [-98.5795, 39.8283],
                zoom: 3.5,
                essential: true
            });

            // Reset marker
            if (marker.current) {
                marker.current.setLngLat([-98.5795, 39.8283]);
            }

            // Reset popup
            if (popup.current) {
                popup.current.setLngLat([-98.5795, 39.8283]);
            }

            // Reset coordinates input
            setCustomCoords({ lat: 39.8283, lng: -98.5795 });

            // Remove test line if it exists
            if (map.current.getSource('test-line')) {
                map.current.removeLayer('test-line-layer');
                map.current.removeSource('test-line');
            }

            addLog('Reset map to initial state', 'success');
        } catch (error) {
            addLog(`Error resetting map: ${error.message}`, 'error');
        }
    };

    // Clear logs
    const clearLogs = () => {
        setLogs([]);
    };

    return (
        <div className="minimal-map-test">
            <div className="test-header">
                <h2>Minimal Map Test</h2>
                <p>A simplified map implementation for isolating rendering issues</p>
            </div>

            <div className="test-controls">
                <div className="coordinate-inputs">
                    <div className="input-group">
                        <label>Latitude:</label>
                        <input
                            type="number"
                            step="0.0001"
                            value={customCoords.lat}
                            onChange={(e) => setCustomCoords(prev => ({ ...prev, lat: parseFloat(e.target.value) }))}
                        />
                    </div>
                    <div className="input-group">
                        <label>Longitude:</label>
                        <input
                            type="number"
                            step="0.0001"
                            value={customCoords.lng}
                            onChange={(e) => setCustomCoords(prev => ({ ...prev, lng: parseFloat(e.target.value) }))}
                        />
                    </div>
                    <button onClick={updateMarkerPosition}>Update Position</button>
                </div>

                <div className="map-actions">
                    <button onClick={addTestLine} disabled={!mapLoaded}>Add Test Line</button>
                    <button onClick={toggleMapStyle} disabled={!mapLoaded}>Toggle Satellite</button>
                    <button onClick={resetMap} disabled={!mapLoaded}>Reset Map</button>
                </div>
            </div>

            <div className="map-container-wrapper">
                {mapError && (
                    <div className="map-error-overlay">
                        <div className="error-content">
                            <h3>Map Error</h3>
                            <p>{mapError}</p>
                        </div>
                    </div>
                )}

                <div ref={mapContainer} className="map-container"></div>
            </div>

            <div className="log-panel">
                <div className="log-header">
                    <h3>Map Event Log</h3>
                    <button className="clear-logs" onClick={clearLogs}>Clear Logs</button>
                </div>
                <div className="log-content">
                    {logs.length === 0 ? (
                        <p className="no-logs">No events logged yet</p>
                    ) : (
                        logs.map((log, index) => (
                            <div key={index} className={`log-entry ${log.type}`}>
                                <span className="log-time">{log.timestamp}</span>
                                <span className="log-message">{log.message}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="map-info">
                <h3>About This Test</h3>
                <p>
                    This minimal implementation helps isolate MapBox GL rendering issues from
                    the complexity of the full application. It provides a clean environment to test:
                </p>
                <ul>
                    <li>Basic map initialization and rendering</li>
                    <li>Coordinate format handling ([longitude, latitude] for GeoJSON)</li>
                    <li>Marker and popup placement</li>
                    <li>GeoJSON source and layer creation</li>
                </ul>
                <p>
                    Current MapBox token: <code>{MAPBOX_TOKEN.substring(0, 8)}...{MAPBOX_TOKEN.substring(MAPBOX_TOKEN.length - 4)}</code>
                </p>
            </div>
        </div>
    );
};

export default MinimalMapTest;
