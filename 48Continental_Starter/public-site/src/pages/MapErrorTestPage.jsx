/**
 * MapErrorTestPage
 * 
 * A test page that demonstrates the robust error handling capabilities
 * of the EnhancedMap component with the MapErrorBoundary.
 * 
 * This page allows testing various error conditions to see how they are handled.
 */

/* eslint-env browser */
import React, { useState, Suspense, lazy } from 'react';
import { useTripData } from '../hooks/useTripData';
import './MapErrorTestPage.css';

// Lazy load the map component
const EnhancedMap = lazy(() => import('../components/EnhancedMap'));

// Loading component for the map
const MapLoadingFallback = () => (
    <div className="loading">Loading map component...</div>
);

const MapErrorTestPage = () => {
    const [errorType, setErrorType] = useState(null);
    const [mapLayers, setMapLayers] = useState({
        weather: false,
        traffic: false,
        satellite: false,
        chargingStations: false
    });

    // Use our hook to get real trip data
    const { tripData, loading, error: tripDataError } = useTripData();

    // Generate bad data for testing error handling
    const generateBadData = (type) => {
        switch (type) {
            case 'token':
                // Return an invalid token to trigger token errors
                return {
                    mapboxToken: 'invalid.token.that.will.fail'
                };

            case 'coordinates':
                // Create trip data with invalid coordinates
                return {
                    tripData: {
                        ...tripData,
                        route: [
                            { lat: 999, lng: 999 },  // Invalid coordinates
                            { lat: 'string', lng: {} },  // Type errors
                            [555, null],  // Out of bounds
                            null,  // Null
                            undefined  // Undefined
                        ],
                        stops: [
                            { lat: NaN, lng: NaN, name: 'Invalid Stop' },
                            { latitude: Infinity, longitude: -Infinity, name: 'Another Bad Stop' }
                        ]
                    }
                };

            case 'network':
                // We'll use a valid token but make requests fail via other means
                return {
                    mapboxToken: 'pk.mock.token.that.has.correct.format.but.is.not.registered.and.will.fail',
                    networkBlockMode: true
                };

            case 'render':
                // Create a scenario where rendering will fail
                return {
                    tripData: {
                        ...tripData,
                        // Circular reference to cause rendering issues
                        circular: {}
                    }
                };

            case 'none':
            default:
                return {};
        }
    };

    // Handle error type selection
    const handleErrorTypeChange = (e) => {
        setErrorType(e.target.value);
    };

    // Get props based on selected error type
    const getMapProps = () => {
        const baseProps = {
            tripData: tripData,
            vehicleData: {
                latitude: 39.8283,
                longitude: -98.5795,
                batteryLevel: 75,
                range: 250,
                speed: 0
            },
            mapLayers: mapLayers
        };

        // If no error type is selected, return normal props
        if (!errorType || errorType === 'none') {
            return baseProps;
        }

        // Otherwise, add error-causing props
        return {
            ...baseProps,
            ...generateBadData(errorType)
        };
    };

    // Toggle map layers
    const toggleLayer = (layer) => {
        setMapLayers(prev => ({
            ...prev,
            [layer]: !prev[layer]
        }));
    };

    return (
        <div className="map-error-test-page">
            <h1>Map Error Handling Test</h1>

            <div className="control-panel">
                <div className="error-controls">
                    <h3>Test Error Conditions</h3>
                    <div className="radio-group">
                        <label>
                            <input
                                type="radio"
                                name="errorType"
                                value="none"
                                checked={errorType === 'none' || !errorType}
                                onChange={handleErrorTypeChange}
                            />
                            Normal (No Errors)
                        </label>

                        <label>
                            <input
                                type="radio"
                                name="errorType"
                                value="token"
                                checked={errorType === 'token'}
                                onChange={handleErrorTypeChange}
                            />
                            Invalid Token Error
                        </label>

                        <label>
                            <input
                                type="radio"
                                name="errorType"
                                value="coordinates"
                                checked={errorType === 'coordinates'}
                                onChange={handleErrorTypeChange}
                            />
                            Invalid Coordinates Error
                        </label>

                        <label>
                            <input
                                type="radio"
                                name="errorType"
                                value="network"
                                checked={errorType === 'network'}
                                onChange={handleErrorTypeChange}
                            />
                            Network Error
                        </label>

                        <label>
                            <input
                                type="radio"
                                name="errorType"
                                value="render"
                                checked={errorType === 'render'}
                                onChange={handleErrorTypeChange}
                            />
                            Render Error
                        </label>
                    </div>
                </div>

                <div className="layer-controls">
                    <h3>Map Layers</h3>
                    <div className="checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={mapLayers.satellite}
                                onChange={() => toggleLayer('satellite')}
                            />
                            Satellite
                        </label>

                        <label>
                            <input
                                type="checkbox"
                                checked={mapLayers.weather}
                                onChange={() => toggleLayer('weather')}
                            />
                            Weather
                        </label>

                        <label>
                            <input
                                type="checkbox"
                                checked={mapLayers.traffic}
                                onChange={() => toggleLayer('traffic')}
                            />
                            Traffic
                        </label>

                        <label>
                            <input
                                type="checkbox"
                                checked={mapLayers.chargingStations}
                                onChange={() => toggleLayer('chargingStations')}
                            />
                            Charging Stations
                        </label>
                    </div>
                </div>
            </div>

            <div className="map-container">
                {loading ? (
                    <div className="loading">Loading trip data...</div>
                ) : tripDataError ? (
                    <div className="error">Error loading trip data: {tripDataError.message}</div>
                ) : (
                    <Suspense fallback={<MapLoadingFallback />}>
                        <EnhancedMap {...getMapProps()} />
                    </Suspense>
                )}
            </div>

            <div className="explanation">
                <h3>About Error Handling</h3>
                <p>
                    This page demonstrates how our <code>EnhancedMap</code> component (with <code>MapErrorBoundary</code>)
                    gracefully handles various error conditions that can occur when working with maps.
                </p>
                <p>
                    Select different error types above to see how the system responds. Even when errors occur,
                    the application remains functional and provides helpful troubleshooting information.
                </p>
                <h4>Error Types Demonstrated:</h4>
                <ul>
                    <li><strong>Token Errors:</strong> Issues with the Mapbox access token</li>
                    <li><strong>Coordinate Errors:</strong> Invalid or malformed location data</li>
                    <li><strong>Network Errors:</strong> Problems loading map resources</li>
                    <li><strong>Render Errors:</strong> Issues rendering the map component</li>
                </ul>
                <p>
                    The <code>MapErrorBoundary</code> component catches these errors, displays useful troubleshooting
                    information, and even provides a static map fallback when possible.
                </p>
            </div>
        </div>
    );
};

export default MapErrorTestPage;
