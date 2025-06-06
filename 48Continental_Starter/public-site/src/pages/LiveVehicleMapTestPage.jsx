/* eslint-disable */
/**
 * LiveVehicleMapTestPage
 * 
 * A test page for the LiveVehicleMap component that allows testing different
 * configurations and data sources.
 */

import React, { useState, useEffect } from 'react';
import LiveVehicleMap from '../components/LiveVehicleMap';
import './LiveVehicleMapTestPage.css';

const LiveVehicleMapTestPage = () => {
    // Component state
    const [useMock, setUseMock] = useState(true);
    const [useWebSocket, setUseWebSocket] = useState(false);
    const [pollingInterval, setPollingInterval] = useState(5000);
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
                                { lat: 39.5296, lng: -119.8138, name: 'Reno' }
                            ],
                            stops: [
                                { lat: 37.7749, lng: -122.4194, name: 'San Francisco', type: 'start' },
                                { lat: 38.5816, lng: -121.4944, name: 'Sacramento', type: 'stop' },
                                { lat: 39.5296, lng: -119.8138, name: 'Reno', type: 'overnight' }
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
                <h1>Vehicle Tracker Test</h1>
                <p className="subtitle">
                    Test the real-time vehicle tracking functionality
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
                                {useMock ? 'Using Mock Data' : 'Using Live Data'}
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
                                        max="20000"
                                        step="1000"
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
                        <h3>Information</h3>
                        <p>
                            This page demonstrates the live vehicle tracking functionality
                            using the <code>LiveVehicleMap</code> component.
                        </p>
                        <p>
                            When using mock data, the vehicle will follow the route defined in the
                            trip data or move randomly if no route is provided.
                        </p>
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
                        <LiveVehicleMap
                            tripData={tripData}
                            useMock={useMock}
                            useWebSocket={useWebSocket}
                            pollingInterval={pollingInterval}
                            fullscreen={fullscreen}
                            mapLayers={mapLayers}
                        />
                    )}

                    {error && (
                        <div className="error-banner">
                            {error}
                        </div>
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

export default LiveVehicleMapTestPage;
