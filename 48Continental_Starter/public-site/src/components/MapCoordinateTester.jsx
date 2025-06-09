/**
 * MapCoordinateTester Component
 * 
 * A visual tool to test different coordinate formats with MapboxGL
 * and diagnose coordinate-related rendering issues.
 */
/* eslint-env browser */

import React, { useState, useEffect, useRef } from 'react';
import { ensureMapboxFormat } from '../utils/mapUtils';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapCoordinateTester.css';

// Default map center (Wandering Whittle)
const DEFAULT_CENTER = [-98.5795, 39.8283];
const DEFAULT_ZOOM = 3.5;

// Example coordinate formats
const EXAMPLE_FORMATS = {
    latLngArray: '[39.8283, -98.5795]',
    lngLatArray: '[-98.5795, 39.8283]',
    objectLatLng: '{ "latitude": 39.8283, "longitude": -98.5795 }',
    objectLngLat: '{ "lng": -98.5795, "lat": 39.8283 }',
    objectCoords: '{ "coordinates": [-98.5795, 39.8283] }'
};

// This functionality is now handled by the ensureMapboxFormat utility

// Function removed as it's replaced by the ensureMapboxFormat utility

const MapCoordinateTester = () => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const markersRef = useRef([]);

    const [coordinateInput, setCoordinateInput] = useState('');
    const [coordinateType, setCoordinateType] = useState('auto');
    // State used for storing validation results and displaying in UI
    const [validationResult, setValidationResult] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [testResults, setTestResults] = useState([]);
    const [showDataSummary, setShowDataSummary] = useState(false);

    // Initialize map
    useEffect(() => {
        if (map.current) return; // Map already initialized

        // Get Mapbox token from environment if available
        let token = import.meta.env.VITE_MAPBOX_TOKEN || '';

        // Check for mapbox token
        if (!token) {
            setErrorMessage('Mapbox token not found. Add VITE_MAPBOX_TOKEN to your .env file.');
            return;
        }

        // Initialize map
        mapboxgl.accessToken = token;

        try {
            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/streets-v11',
                center: DEFAULT_CENTER,
                zoom: DEFAULT_ZOOM
            });

            // Add navigation controls
            map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

            // Add event listeners
            map.current.on('load', () => {
                console.log('Map loaded successfully');
            });

            map.current.on('error', (e) => {
                console.error('Map error:', e);
                setErrorMessage(`Map error: ${e.error?.message || 'Unknown error'}`);
            });
        } catch (error) {
            console.error('Error initializing map:', error);
            setErrorMessage(`Error initializing map: ${error.message}`);
        }

        // Cleanup on unmount
        return () => {
            if (map.current) {
                clearMarkers();
                map.current.remove();
                map.current = null;
            }
        };
    }, []);

    // Clear all markers from the map
    const clearMarkers = () => {
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
    };

    // Add a marker to the map
    const addMarker = (coordinates, color = '#0066cc') => {
        if (!map.current) return;

        // Create marker element
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.backgroundColor = color;
        el.style.width = '15px';
        el.style.height = '15px';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.3)';

        // Add marker to map
        const marker = new mapboxgl.Marker(el)
            .setLngLat(coordinates)
            .addTo(map.current);

        // Store reference for later removal
        markersRef.current.push(marker);

        return marker;
    };

    // Handle coordinate input change
    const handleCoordinateInputChange = (e) => {
        setCoordinateInput(e.target.value);
    };

    // Handle coordinate type change
    const handleCoordinateTypeChange = (e) => {
        setCoordinateType(e.target.value);
    };

    // Handle coordinate validation
    const validateCoordinates = () => {
        if (!coordinateInput.trim()) {
            setErrorMessage('Please enter coordinates to validate');
            return;
        }

        // Try to parse the input in various ways
        let parsedInput;
        let mapboxCoords;

        try {
            // First try to parse as JSON
            try {
                parsedInput = JSON.parse(coordinateInput.trim());
            } catch (e) {
                // If it's not valid JSON, try to parse as an array
                if (coordinateInput.includes(',') && (coordinateInput.includes('[') || coordinateInput.includes('('))) {
                    // Extract numbers from formats like [lat, lng] or (lat, lng)
                    const matches = coordinateInput.match(/-?\d+\.?\d*/g);
                    if (matches && matches.length >= 2) {
                        parsedInput = matches.slice(0, 2).map(Number);
                    }
                }
            }

            // If parsing succeeded, use our utility function
            if (parsedInput) {
                // If user explicitly selected a format
                if (coordinateType === 'latLng' && Array.isArray(parsedInput) && parsedInput.length === 2) {
                    // Swap for lat,lng format
                    mapboxCoords = ensureMapboxFormat([parsedInput[1], parsedInput[0]]);
                } else {
                    // Use the utility to figure out the format
                    mapboxCoords = ensureMapboxFormat(parsedInput);
                }
            }
        } catch (error) {
            console.error('Error parsing coordinates:', error);
        }

        // Generate a result object in the expected format
        const result = mapboxCoords ? {
            valid: true,
            format: Array.isArray(parsedInput) ?
                (coordinateType === 'latLng' ? 'latLng' : 'lngLat') :
                'object',
            swapped: coordinateType === 'latLng',
            original: parsedInput,
            mapboxFormat: mapboxCoords,
            message: coordinateType === 'latLng' ?
                'Converted from [latitude, longitude] to [longitude, latitude]' :
                'Coordinates properly formatted for MapBox'
        } : {
            valid: false,
            message: 'Invalid or unsupported coordinate format'
        };

        setValidationResult(result);

        if (result.valid) {
            setErrorMessage('');

            // Add test result to history
            setTestResults(prev => [
                {
                    id: Date.now(),
                    input: coordinateInput,
                    type: coordinateType,
                    result
                },
                ...prev
            ]);

            // Add marker and fly to location
            if (map.current) {
                clearMarkers();
                addMarker(result.mapboxFormat);
                map.current.flyTo({
                    center: result.mapboxFormat,
                    zoom: 10,
                    speed: 1.5
                });
            }
        } else {
            setErrorMessage(result.message);
        }
    };

    // Reset the form
    const handleReset = () => {
        setCoordinateInput('');
        setCoordinateType('auto');
        setValidationResult(null);
        setErrorMessage('');

        // Reset map view
        if (map.current) {
            clearMarkers();
            map.current.flyTo({
                center: DEFAULT_CENTER,
                zoom: DEFAULT_ZOOM
            });
        }
    };

    // Insert example format
    const insertExample = (formatKey) => {
        setCoordinateInput(EXAMPLE_FORMATS[formatKey]);
    };

    // Toggle data summary visibility
    const toggleDataSummary = () => {
        setShowDataSummary(!showDataSummary);
    };

    return (
        <div className="map-coordinate-tester">
            <div className="tester-header">
                <h2>MapBox Coordinate Format Tester</h2>
                <p>Test and validate different coordinate formats for proper map display</p>
            </div>

            <div className="tester-grid">
                {/* Map container */}
                <div className="map-container" ref={mapContainer} />

                {/* Controls container */}
                <div className="controls-container">
                    {/* Coordinate input form */}
                    <div className="form-group">
                        <div className="header-row">
                            <h3>Coordinate Input</h3>
                            <button className="toggle-button" onClick={toggleDataSummary}>
                                {showDataSummary ? 'Hide Data Summary' : 'Show Data Summary'}
                            </button>
                        </div>

                        {showDataSummary && (
                            <div className="data-summary">
                                <div className="data-section">
                                    <h4>MapBox/GeoJSON Format</h4>
                                    <pre>[longitude, latitude]</pre>
                                </div>
                                <div className="data-section">
                                    <h4>Common API Formats</h4>
                                    <pre>
                                        [latitude, longitude] - Google Maps, many APIs{"\n"}
                                        {"{lat: latitude, lng: longitude}"} - Google Maps{"\n"}
                                        {"{latitude: lat, longitude: lng}"} - Many APIs{"\n"}
                                        {"GeoJSON: { type: 'Point', coordinates: [lng, lat] }"}
                                    </pre>
                                </div>
                            </div>
                        )}

                        <div className="example-formats">
                            <span>Examples:</span>
                            <button onClick={() => insertExample('latLngArray')}>LatLng Array</button>
                            <button onClick={() => insertExample('lngLatArray')}>LngLat Array</button>
                            <button onClick={() => insertExample('objectLatLng')}>Lat/Lng Object</button>
                            <button onClick={() => insertExample('objectLngLat')}>Lng/Lat Object</button>
                            <button onClick={() => insertExample('objectCoords')}>Coordinates Object</button>
                        </div>

                        <div className="input-row">
                            <select
                                className="coord-type-select"
                                value={coordinateType}
                                onChange={handleCoordinateTypeChange}
                            >
                                <option value="auto">Auto-detect Format</option>
                                <option value="lngLat">[longitude, latitude]</option>
                                <option value="latLng">[latitude, longitude]</option>
                            </select>

                            <textarea
                                className="coord-input"
                                value={coordinateInput}
                                onChange={handleCoordinateInputChange}
                                placeholder="Enter coordinates in any format"
                            />
                        </div>

                        {errorMessage && <div className="error-message">{errorMessage}</div>}

                        <div className="button-row">
                            <button className="add-button" onClick={validateCoordinates}>Validate & Plot</button>
                            <button className="reset-button" onClick={handleReset}>Reset</button>
                        </div>

                        {/* Current validation result */}
                        {validationResult && (
                            <div className={`current-result ${validationResult.valid ? 'valid' : 'invalid'}`}>
                                <h4>Current Result:</h4>
                                <p><strong>Valid:</strong> {validationResult.valid ? 'Yes' : 'No'}</p>
                                {validationResult.valid && (
                                    <>
                                        <p><strong>Format:</strong> {validationResult.format || 'Unknown'}</p>
                                        <p><strong>MapBox Format:</strong> <code>{JSON.stringify(validationResult.mapboxFormat)}</code></p>
                                        <p><strong>Message:</strong> {validationResult.message}</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Previous validation results */}
                    {testResults.length > 0 && (
                        <div className="form-group">
                            <h3>Validation Results</h3>
                            <div className="validation-results">
                                <div className="validation-section">
                                    <h5>Recent Tests</h5>
                                    <ul>
                                        {testResults.slice(0, 5).map(test => (
                                            <li
                                                key={test.id}
                                                className={test.result.swapped ? 'swapped' : ''}
                                            >
                                                <strong>Input:</strong> <code>{test.input}</code>
                                                <br />
                                                <strong>Format:</strong> {test.result.format || 'Unknown'}
                                                {test.result.swapped && <span className="warning"> (Swapped)</span>}
                                                <br />
                                                <strong>MapBox Format:</strong> <code>{JSON.stringify(test.result.mapboxFormat)}</code>
                                                <br />
                                                <strong>Message:</strong> {test.result.message}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="tester-footer">
                <p>Note: MapBox GL and GeoJSON require coordinates in <strong>[longitude, latitude]</strong> format.</p>
                <p>Common APIs like Google Maps often use <strong>[latitude, longitude]</strong> format instead.</p>
                <p>Use this tool to debug coordinate format issues in your application.</p>
            </div>
        </div>
    );
};

export default MapCoordinateTester;
