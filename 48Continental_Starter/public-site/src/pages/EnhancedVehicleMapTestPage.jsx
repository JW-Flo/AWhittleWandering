/* eslint-disable */
/**
 * EnhancedVehicleMapTestPage
 * 
 * A test page for the EnhancedVehicleMap component that demonstrates
 * the improved vehicle data management using our custom hook.
 */

import React, { useState, useEffect } from 'react';
import EnhancedVehicleMap from '../components/EnhancedVehicleMap';
import './LiveVehicleMapTestPage.css'; // Reuse the same CSS

const EnhancedVehicleMapTestPage = () => {
    // Get URL params to check for coordinate format test mode
    const urlParams = new URLSearchParams(window.location.search);
    const isCoordinateTest = urlParams.get('test') === 'coordinates';

    // Special test data for coordinate format testing
    const coordinateFormatTest = {
        days: [
            {
                day: 1,
                route: [
                    { lat: 39.7392, lng: -104.9903 }, // Denver (standard format)
                    { latitude: 40.7608, longitude: -111.8910 }, // Salt Lake City (alternate property names)
                    [-118.2437, 34.0522], // Los Angeles (longitude, latitude array)
                    [37.7749, -122.4194], // San Francisco (latitude, longitude array - swapped)
                    { coordinates: [47.6062, -122.3321] } // Seattle (nested coordinates array - swapped)
                ],
                stops: [
                    {
                        name: "Denver, CO",
                        lat: 39.7392,
                        lng: -104.9903,
                        type: "overnight"
                    },
                    {
                        name: "Salt Lake City, UT",
                        latitude: 40.7608,
                        longitude: -111.8910,
                        type: "charging"
                    },
                    {
                        name: "Los Angeles, CA",
                        coordinates: [-118.2437, 34.0522], // Array format
                        type: "attraction"
                    }
                ]
            }
        ]
    };
    // Component state
    const [useMock, setUseMock] = useState(true);
    const [useWebSocket, setUseWebSocket] = useState(false);
    const [pollingInterval, setPollingInterval] = useState(3000);
    const [fullscreen, setFullscreen] = useState(false);
    const [mapLayers, setMapLayers] = useState({
        weather: false,
        traffic: false,
        satellite: false,
        chargingStations: false
    });
    const [tripData, setTripData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load trip data for the map
    useEffect(() => {
        const fetchTripData = async () => {
            try {
                setLoading(true);
                // Attempt to load trip data from the data directory
                const response = await fetch('/src/data/trip-data.json');
                if (!response.ok) {
                    throw new Error(`Failed to load trip data: ${response.status} ${response.statusText}`);
                }
                const data = await response.json();
                setTripData(data);
                setError(null);
            } catch (err) {
                console.error('Error loading trip data:', err);
                setError('Could not load trip data. Using default route.');

                // Set fallback data with a simple route
                setTripData({
                    days: [
                        {
                            day: 1,
                            date: '2025-06-06',
                            route: [
                                { lat: 37.7749, lng: -122.4194, name: 'San Francisco' },
                                { lat: 38.5816, lng: -121.4944, name: 'Sacramento' },
                                { lat: 39.5296, lng: -119.8138, name: 'Reno' },
                                { lat: 40.7608, lng: -111.8910, name: 'Salt Lake City' },
                                { lat: 41.8781, lng: -87.6298, name: 'Chicago' }
                            ],
                            stops: [
                                { lat: 37.7749, lng: -122.4194, name: 'San Francisco', type: 'start' },
                                { lat: 38.5816, lng: -121.4944, name: 'Sacramento', type: 'stop' },
                                { lat: 39.5296, lng: -119.8138, name: 'Reno', type: 'charging' },
                                { lat: 40.7608, lng: -111.8910, name: 'Salt Lake City', type: 'overnight' },
                                { lat: 41.8781, lng: -87.6298, name: 'Chicago', type: 'end' }
                            ]
                        }
                    ]
                });
            } finally {
                setLoading(false);
            }
        };

        fetchTripData();
    }, []);

    // Handle layer toggle
    const handleLayerToggle = (layer) => {
        setMapLayers(prev => ({
            ...prev,
            [layer]: !prev[layer]
        }));
    };

    // Handle fullscreen toggle
    const toggleFullscreen = () => {
        setFullscreen(!fullscreen);
    };

    // Handle polling interval change
    const handlePollingChange = (e) => {
        setPollingInterval(Number(e.target.value));
    };

    return (
        <div className="live-vehicle-map-test-page">
            <header>
                <h1>Enhanced Vehicle Tracker</h1>
                <p className="subtitle">
                    Demo of the enhanced vehicle tracking functionality with useVehicleData hook
                </p>
            </header>

            <div className="test-container">
                <div className="map-controls">
                    <div className="control-section">
                        <h3>Data Source</h3>
                        <div className="toggle-control">
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={!useMock}
                                    onChange={() => setUseMock(!useMock)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                            <span className="toggle-label">
                                {useMock ? 'Using Mock Data' : 'Using Tessie API'}
                            </span>
                        </div>

                        <div className="toggle-control">
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={useWebSocket}
                                    onChange={() => setUseWebSocket(!useWebSocket)}
                                    disabled={!useMock && !import.meta.env.VITE_TESSIE_TOKEN}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                            <span className="toggle-label">
                                {useWebSocket ? 'WebSocket Updates' : 'Polling Updates'}
                            </span>
                        </div>

                        {!useWebSocket && (
                            <div className="range-control">
                                <label>
                                    Polling Interval: {pollingInterval / 1000}s
                                    <input
                                        type="range"
                                        min="1000"
                                        max="10000"
                                        step="500"
                                        value={pollingInterval}
                                        onChange={handlePollingChange}
                                    />
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="control-section">
                        <h3>Map Layers</h3>
                        <div className="checkbox-control">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={mapLayers.satellite}
                                    onChange={() => handleLayerToggle('satellite')}
                                />
                                Satellite View
                            </label>
                        </div>

                        <div className="checkbox-control">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={mapLayers.traffic}
                                    onChange={() => handleLayerToggle('traffic')}
                                />
                                Traffic Layer
                            </label>
                        </div>

                        <div className="checkbox-control">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={mapLayers.chargingStations}
                                    onChange={() => handleLayerToggle('chargingStations')}
                                />
                                Charging Stations
                            </label>
                        </div>
                    </div>

                    <div className="control-section">
                        <h3>Display</h3>
                        <button
                            className="fullscreen-button"
                            onClick={toggleFullscreen}
                        >
                            {fullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                        </button>
                    </div>

                    <div className="info-section">
                        <h3>Enhanced Features</h3>
                        <p>
                            This page demonstrates the enhanced vehicle tracking functionality
                            using the <code>EnhancedVehicleMap</code> component and <code>useVehicleData</code> hook.
                        </p>
                        <p>Key improvements:</p>
                        <ul>
                            <li>Cleaner separation of data and UI concerns</li>
                            <li>More responsive vehicle updates</li>
                            <li>Better error handling</li>
                            <li>Interactive vehicle controls</li>
                        </ul>
                        {!useMock && !import.meta.env.VITE_TESSIE_TOKEN && (
                            <div className="warning-message">
                                <strong>Note:</strong> To use live data, you need to set a Tessie API
                                token in the <code>.env</code> file.
                            </div>
                        )}
                    </div>
                </div>

                <div className="map-container">
                    {loading ? (
                        <div className="loading-indicator">Loading trip data...</div>
                    ) : (
                        <>
                            {isCoordinateTest && (
                                <div className="coordinate-test-banner">
                                    <h3>🧪 Coordinate Format Test Mode</h3>
                                    <p>Testing various coordinate formats with the ensureMapboxFormat utility</p>
                                </div>
                            )}
                            <EnhancedVehicleMap
                                tripData={isCoordinateTest ? coordinateFormatTest : tripData}
                                useMock={useMock}
                                useWebSocket={useWebSocket}
                                pollingInterval={pollingInterval}
                                fullscreen={fullscreen}
                                mapLayers={mapLayers}
                            />
                            {error && (
                                <div className="error-banner">
                                    {error}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <footer>
                <p>
                    This vehicle tracker is part of the 48 Continental USA Project, which tracks a 60-day
                    Tesla road trip through all 48 contiguous U.S. states.
                </p>
            </footer>
        </div>
    );
};

export default EnhancedVehicleMapTestPage;
