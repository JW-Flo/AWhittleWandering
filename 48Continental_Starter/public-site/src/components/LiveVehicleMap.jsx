/* eslint-disable */
/**
 * LiveVehicleMap Component
 * 
 * A real-time vehicle tracking map component that displays vehicle location,
 * trip route, and vehicle telemetry data. Supports both mock data and live data
 * from the Tessie API.
 */

import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
// mockVehicleData removed: now using real data only
import * as tessieClient from '../services/tessieClient';
import './LiveVehicleMap.css';

// Set Mapbox token from environment variable
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// Vehicle icon image
const VEHICLE_ICON = 'https://cdn-icons-png.flaticon.com/512/5771/5771832.png';
const CHARGING_ICON = 'https://cdn-icons-png.flaticon.com/512/5146/5146905.png';

const LiveVehicleMap = ({
    tripData,
    useMock = true,
    useWebSocket = false,
    pollingInterval = 5000,
    fullscreen = false,
    mapLayers = {
        weather: false,
        traffic: false,
        satellite: false,
        chargingStations: false
    }
}) => {
    // Refs
    const mapContainer = useRef(null);
    const map = useRef(null);
    const vehicleMarker = useRef(null);
    const webSocketRef = useRef(null);
    const pollingTimerRef = useRef(null);

    // State
    const [vehicleData, setVehicleData] = useState(null);
    const [routePoints, setRoutePoints] = useState([]);
    const [stopPoints, setStopPoints] = useState([]);
    const [isMapReady, setIsMapReady] = useState(false);
    const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/streets-v11');
    const [error, setError] = useState(null);

    // Process trip data to extract route and stop points
    useEffect(() => {
        if (tripData && tripData.days) {
            try {
                // Extract all route points from the trip data
                const allPoints = [];
                const stops = [];

                tripData.days.forEach(day => {
                    if (day.route && Array.isArray(day.route)) {
                        day.route.forEach(point => {
                            if (point.lat && point.lng) {
                                allPoints.push([point.lng, point.lat]);
                            }
                        });
                    }

                    if (day.stops && Array.isArray(day.stops)) {
                        day.stops.forEach(stop => {
                            if (stop.lat && stop.lng) {
                                stops.push({
                                    coordinates: [stop.lng, stop.lat],
                                    name: stop.name || 'Stop',
                                    type: stop.type || 'other'
                                });
                            }
                        });
                    }
                });

                setRoutePoints(allPoints);
                setStopPoints(stops);
            } catch (err) {
                console.error('Error processing trip data:', err);
                setError('Failed to process trip data');
            }
        }
    }, [tripData]);

    // Initialize map
    useEffect(() => {
        if (!map.current && mapContainer.current && mapboxgl.accessToken) {
            try {
                // Create new map instance
                map.current = new mapboxgl.Map({
                    container: mapContainer.current,
                    style: mapStyle,
                    center: [-98.5795, 39.8283], // Center of USA
                    zoom: 3.5,
                    attributionControl: true
                });

                // Add navigation controls
                map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

                // Add fullscreen control
                map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

                // Add geolocate control
                map.current.addControl(
                    new mapboxgl.GeolocateControl({
                        positionOptions: {
                            enableHighAccuracy: true
                        },
                        trackUserLocation: false
                    }),
                    'top-right'
                );

                // Handle map load event
                map.current.on('load', () => {
                    setIsMapReady(true);

                    // Add vehicle icon image
                    map.current.loadImage(VEHICLE_ICON, (error, image) => {
                        if (error) throw error;

                        if (!map.current.hasImage('vehicle-icon')) {
                            map.current.addImage('vehicle-icon', image);
                        }
                    });

                    // Add charging icon image
                    map.current.loadImage(CHARGING_ICON, (error, image) => {
                        if (error) throw error;

                        if (!map.current.hasImage('charging-icon')) {
                            map.current.addImage('charging-icon', image);
                        }
                    });
                });

                // Handle map errors
                map.current.on('error', (e) => {
                    console.error('Mapbox error:', e);
                    setError('Map loading error: ' + e.error?.message || 'Unknown error');
                });
            } catch (err) {
                console.error('Error initializing map:', err);
                setError('Failed to initialize map: ' + err.message);
            }
        }

        // Cleanup function
        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, [mapStyle]);

    // Toggle map layers based on props
    useEffect(() => {
        if (map.current && isMapReady) {
            // Toggle satellite view
            setMapStyle(
                mapLayers.satellite
                    ? 'mapbox://styles/mapbox/satellite-streets-v11'
                    : 'mapbox://styles/mapbox/streets-v11'
            );

            // Toggle traffic layer
            if (mapLayers.traffic) {
                if (!map.current.getLayer('traffic')) {
                    map.current.addLayer({
                        id: 'traffic',
                        type: 'raster',
                        source: {
                            type: 'raster',
                            tiles: ['https://api.mapbox.com/styles/v1/mapbox/traffic-day-v2/tiles/{z}/{x}/{y}?access_token=' + mapboxgl.accessToken],
                            tileSize: 256
                        },
                        minzoom: 0,
                        maxzoom: 22
                    });
                }
            } else if (map.current.getLayer('traffic')) {
                map.current.removeLayer('traffic');
                map.current.removeSource('traffic');
            }

            // Charging stations layer would be added here (requires additional API)
            if (mapLayers.chargingStations) {
                // This would typically use a charging station API to get locations
                console.log('Charging stations layer requested');
            }
        }
    }, [mapLayers, isMapReady]);

    // Draw route line on the map
    useEffect(() => {
        if (map.current && isMapReady && routePoints.length > 0) {
            // Add route source and layer if they don't exist
            if (!map.current.getSource('route')) {
                map.current.addSource('route', {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates: routePoints
                        }
                    }
                });

                map.current.addLayer({
                    id: 'route',
                    type: 'line',
                    source: 'route',
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    paint: {
                        'line-color': '#0066cc',
                        'line-width': 3,
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
                        coordinates: routePoints
                    }
                });
            }

            // Fit map to route bounds if we have points
            if (routePoints.length > 1) {
                const bounds = routePoints.reduce((bounds, coord) => {
                    return bounds.extend(coord);
                }, new mapboxgl.LngLatBounds(routePoints[0], routePoints[0]));

                map.current.fitBounds(bounds, {
                    padding: 50,
                    maxZoom: 15,
                    duration: 1000
                });
            }
        }
    }, [routePoints, isMapReady]);

    // Add stop points to the map
    useEffect(() => {
        if (map.current && isMapReady && stopPoints.length > 0) {
            // Add stops source and layer if they don't exist
            if (!map.current.getSource('stops')) {
                map.current.addSource('stops', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: stopPoints.map(stop => ({
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: stop.coordinates
                            },
                            properties: {
                                name: stop.name,
                                type: stop.type
                            }
                        }))
                    }
                });

                map.current.addLayer({
                    id: 'stops',
                    type: 'circle',
                    source: 'stops',
                    paint: {
                        'circle-radius': 8,
                        'circle-color': [
                            'match',
                            ['get', 'type'],
                            'charging', '#00cc66',
                            'overnight', '#cc6600',
                            'attraction', '#9933cc',
                            '#0066cc' // default color
                        ],
                        'circle-stroke-width': 2,
                        'circle-stroke-color': '#ffffff'
                    }
                });

                // Add labels for stops
                map.current.addLayer({
                    id: 'stop-labels',
                    type: 'symbol',
                    source: 'stops',
                    layout: {
                        'text-field': ['get', 'name'],
                        'text-size': 12,
                        'text-offset': [0, 1.5],
                        'text-anchor': 'top'
                    },
                    paint: {
                        'text-color': '#333',
                        'text-halo-color': '#fff',
                        'text-halo-width': 1
                    }
                });

                // Add click handler for stops
                map.current.on('click', 'stops', (e) => {
                    const coordinates = e.features[0].geometry.coordinates.slice();
                    const name = e.features[0].properties.name;
                    const type = e.features[0].properties.type;

                    new mapboxgl.Popup()
                        .setLngLat(coordinates)
                        .setHTML(`<h4>${name}</h4><p>Type: ${type}</p>`)
                        .addTo(map.current);
                });

                // Change cursor on hover
                map.current.on('mouseenter', 'stops', () => {
                    map.current.getCanvas().style.cursor = 'pointer';
                });

                map.current.on('mouseleave', 'stops', () => {
                    map.current.getCanvas().style.cursor = '';
                });
            } else {
                // Update existing stops
                map.current.getSource('stops').setData({
                    type: 'FeatureCollection',
                    features: stopPoints.map(stop => ({
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: stop.coordinates
                        },
                        properties: {
                            name: stop.name,
                            type: stop.type
                        }
                    }))
                });
            }
        }
    }, [stopPoints, isMapReady]);

    // Fetch vehicle data and setup polling/websocket
    useEffect(() => {
        let isMounted = true;

        const fetchVehicleData = async () => {
            try {
                let data;

                if (useMock) {
                    // data = await mockVehicleData.getMockVehicleData(); // removed mock, now always use real data
                } else {
                    data = await tessieClient.getVehicleData();
                }

                if (isMounted && data.vehicle_data) {
                    setVehicleData(data.vehicle_data);
                    updateVehicleMarker(data.vehicle_data);
                }
            } catch (err) {
                console.error('Error fetching vehicle data:', err);
                if (isMounted) {
                    setError('Failed to fetch vehicle data: ' + err.message);
                }
            }
        };

        // Setup websocket or polling
        const setupRealTimeUpdates = () => {
            if (useWebSocket) {
                if (webSocketRef.current) {
                    webSocketRef.current.close();
                }

                if (useMock) {
                    // webSocketRef.current = mockVehicleData.createMockWebSocket((data) => { // removed mock
                    if (isMounted && data.vehicle_data) {
                        setVehicleData(data.vehicle_data);
                        updateVehicleMarker(data.vehicle_data);
                    }
                });
} else {
    webSocketRef.current = tessieClient.createWebSocketConnection((data) => {
        if (isMounted && data.vehicle_data) {
            setVehicleData(data.vehicle_data);
            updateVehicleMarker(data.vehicle_data);
        }
    });
                }
            } else {
    // Use polling instead
    if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
    }

    // Initial fetch
    fetchVehicleData();

    // Setup interval
    pollingTimerRef.current = setInterval(fetchVehicleData, pollingInterval);
}
        };

// Initialize vehicle mock data with trip route if available
if (useMock && routePoints.length > 0) {
    const routeLatLng = routePoints.map(point => ({
        longitude: point[0],
        latitude: point[1]
    }));

    // mockVehicleData.startMockVehicleSimulation({ // removed mock
    followPath: routeLatLng,
        moving: true,
            updateInterval: pollingInterval / 2
});
        }

// Start real-time updates after map is ready
if (isMapReady) {
    setupRealTimeUpdates();
}

// Cleanup function
return () => {
    isMounted = false;

    if (webSocketRef.current) {
        webSocketRef.current.close();
        webSocketRef.current = null;
    }

    if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
    }

    if (useMock) {
        // mockVehicleData.stopMockVehicleSimulation(); // removed mock
    }
};
    }, [useMock, useWebSocket, pollingInterval, isMapReady, routePoints]);

// Update vehicle marker on the map
const updateVehicleMarker = (data) => {
    if (!map.current || !isMapReady || !data) return;

    const { latitude, longitude, heading, charging_state } = data;

    if (!latitude || !longitude) return;

    const isCharging = charging_state && charging_state !== 'Disconnected';
    const iconId = isCharging ? 'charging-icon' : 'vehicle-icon';

    // Create marker if it doesn't exist
    if (!vehicleMarker.current) {
        // Add vehicle marker source
        if (!map.current.getSource('vehicle')) {
            map.current.addSource('vehicle', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [longitude, latitude]
                    },
                    properties: {
                        heading: heading || 0,
                        isCharging: isCharging
                    }
                }
            });

            // Add vehicle layer
            map.current.addLayer({
                id: 'vehicle',
                type: 'symbol',
                source: 'vehicle',
                layout: {
                    'icon-image': iconId,
                    'icon-size': 0.5,
                    'icon-rotate': ['get', 'heading'],
                    'icon-allow-overlap': true,
                    'icon-ignore-placement': true
                }
            });

            // Create a popup but don't add to map yet
            vehicleMarker.current = new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: false
            });
        }
    } else {
        // Update existing marker position
        if (map.current.getSource('vehicle')) {
            map.current.getSource('vehicle').setData({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                },
                properties: {
                    heading: heading || 0,
                    isCharging: isCharging
                }
            });

            // Update icon based on charging state
            map.current.setLayoutProperty('vehicle', 'icon-image', iconId);
        }
    }

    // Fly to vehicle location if it's the first update or significantly changed
    if (vehicleData === null) {
        map.current.flyTo({
            center: [longitude, latitude],
            zoom: 14,
            duration: 2000
        });
    }
};

// Calculate battery display
const getBatteryDisplay = () => {
    if (!vehicleData) return null;

    const { battery_level, battery_range, charging_state } = vehicleData;
    const isCharging = charging_state && charging_state !== 'Disconnected';

    return (
        <div className={`battery-indicator ${isCharging ? 'charging' : ''}`}>
            <div className="battery-icon">
                <div
                    className="battery-level"
                    style={{ width: `${battery_level}%` }}
                />
            </div>
            <div className="battery-text">
                <span className="battery-percentage">{battery_level}%</span>
                {battery_range && (
                    <span className="battery-range">
                        {Math.round(battery_range)} mi
                    </span>
                )}
                {isCharging && <span className="charging-icon">⚡</span>}
            </div>
        </div>
    );
};

// Render speed display
const getSpeedDisplay = () => {
    if (!vehicleData || vehicleData.speed === undefined) return null;

    return (
        <div className="speed-indicator">
            <span className="speed-value">{Math.round(vehicleData.speed)}</span>
            <span className="speed-unit">mph</span>
        </div>
    );
};

// Render vehicle name/model
const getVehicleInfo = () => {
    if (!vehicleData) return null;

    return (
        <div className="vehicle-info">
            <h3>{vehicleData.display_name || 'Tesla'}</h3>
            <p className="vehicle-status">
                {vehicleData.state === 'online' ? 'Online' : 'Offline'}
            </p>
        </div>
    );
};

return (
    <div className={`live-vehicle-map ${fullscreen ? 'fullscreen' : ''}`}>
        {error && (
            <div className="map-error">
                <p>{error}</p>
            </div>
        )}

        <div className="map-container" ref={mapContainer} />

        <div className="vehicle-data-overlay">
            {getVehicleInfo()}
            {getBatteryDisplay()}
            {getSpeedDisplay()}

            {vehicleData && (
                <div className="data-timestamp">
                    Last updated: {new Date(vehicleData.timestamp).toLocaleTimeString()}
                </div>
            )}
        </div>

        <div className="data-source-indicator">
            {useMock ? 'SIMULATED DATA' : 'LIVE DATA'}
        </div>
    </div>
);
};

export default LiveVehicleMap;
