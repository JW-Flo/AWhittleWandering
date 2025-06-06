/**
 * CoordinateFormatTest Component
 * 
 * A test utility to verify coordinate format compatibility with MapBox GL.
 * MapBox requires GeoJSON coordinates in [longitude, latitude] format.
 * This utility allows testing coordinate data conversion and validation.
 */

/* eslint-env browser */
import React, { useState, useEffect } from 'react';
import './CoordinateFormatTest.css';

const CoordinateFormatTest = () => {
    const [inputValue, setInputValue] = useState('');
    const [conversionType, setConversionType] = useState('latLngToLngLat');
    const [result, setResult] = useState(null);
    const [validationResult, setValidationResult] = useState(null);
    const [sampleData, setSampleData] = useState(null);

    // Example coordinates to demonstrate format differences
    const examples = {
        latLngToLngLat: {
            description: 'Convert from [latitude, longitude] to [longitude, latitude]',
            input: '[39.8283, -98.5795]',
            expected: '[-98.5795, 39.8283]',
            note: 'MapBox GL requires GeoJSON format: [longitude, latitude]'
        },
        lngLatToLatLng: {
            description: 'Convert from [longitude, latitude] to [latitude, longitude]',
            input: '[-98.5795, 39.8283]',
            expected: '[39.8283, -98.5795]',
            note: 'Some APIs and formats use [latitude, longitude]'
        },
        objectToArray: {
            description: 'Convert from {lat, lng} object to [longitude, latitude] array',
            input: '{"lat": 39.8283, "lng": -98.5795}',
            expected: '[-98.5795, 39.8283]',
            note: 'MapBox GL requires array format, not object'
        },
        stringToArray: {
            description: 'Convert from "lat,lng" string to [longitude, latitude] array',
            input: '39.8283,-98.5795',
            expected: '[-98.5795, 39.8283]',
            note: 'CSV data often uses comma-separated strings'
        }
    };

    // Function to attempt to load sample data
    useEffect(() => {
        const loadSampleData = async () => {
            try {
                // Try to load sample trip data
                const response = await fetch('/src/data/trip-data.json');
                if (response.ok) {
                    const data = await response.json();
                    setSampleData(data);
                }
            } catch (error) {
                console.error('Failed to load sample data:', error);
            }
        };

        loadSampleData();
    }, []);

    // Update input value when conversion type changes
    useEffect(() => {
        setInputValue(examples[conversionType].input);
        setResult(null);
        setValidationResult(null);
    }, [conversionType]);

    // Handle text input change
    const handleInputChange = (e) => {
        setInputValue(e.target.value);
        setResult(null);
        setValidationResult(null);
    };

    // Convert coordinates based on selected conversion type
    const handleConvert = () => {
        try {
            let parsedInput;
            let output;

            switch (conversionType) {
                case 'latLngToLngLat':
                    // Convert [lat, lng] to [lng, lat]
                    parsedInput = JSON.parse(inputValue);
                    if (!Array.isArray(parsedInput) || parsedInput.length !== 2) {
                        throw new Error('Input must be an array with two numbers [lat, lng]');
                    }
                    output = [parsedInput[1], parsedInput[0]];
                    break;

                case 'lngLatToLatLng':
                    // Convert [lng, lat] to [lat, lng]
                    parsedInput = JSON.parse(inputValue);
                    if (!Array.isArray(parsedInput) || parsedInput.length !== 2) {
                        throw new Error('Input must be an array with two numbers [lng, lat]');
                    }
                    output = [parsedInput[1], parsedInput[0]];
                    break;

                case 'objectToArray':
                    // Convert {lat, lng} to [lng, lat]
                    parsedInput = JSON.parse(inputValue);
                    if (!parsedInput.lat || !parsedInput.lng) {
                        throw new Error('Input must be an object with lat and lng properties');
                    }
                    output = [parsedInput.lng, parsedInput.lat];
                    break;

                case 'stringToArray':
                    // Convert "lat,lng" to [lng, lat]
                    parsedInput = inputValue.split(',').map(n => parseFloat(n.trim()));
                    if (parsedInput.length !== 2 || parsedInput.some(isNaN)) {
                        throw new Error('Input must be a string with two comma-separated numbers');
                    }
                    output = [parsedInput[1], parsedInput[0]];
                    break;

                default:
                    throw new Error('Unknown conversion type');
            }

            // Validate the output
            validateCoordinates(output);

            // Set the result
            setResult({
                input: parsedInput,
                output: output,
                outputString: JSON.stringify(output)
            });

        } catch (error) {
            setResult({
                error: error.message
            });
        }
    };

    // Validate the coordinates (longitude and latitude in proper ranges)
    const validateCoordinates = (coords) => {
        try {
            const [lng, lat] = coords;

            const validationIssues = [];

            if (typeof lng !== 'number' || isNaN(lng)) {
                validationIssues.push('Longitude must be a number');
            } else if (lng < -180 || lng > 180) {
                validationIssues.push('Longitude must be between -180 and 180');
            }

            if (typeof lat !== 'number' || isNaN(lat)) {
                validationIssues.push('Latitude must be a number');
            } else if (lat < -90 || lat > 90) {
                validationIssues.push('Latitude must be between -90 and 90');
            }

            if (validationIssues.length > 0) {
                setValidationResult({
                    valid: false,
                    issues: validationIssues
                });
            } else {
                setValidationResult({
                    valid: true,
                    message: 'Coordinates are valid for MapBox GL'
                });
            }
        } catch (error) {
            setValidationResult({
                valid: false,
                issues: [error.message]
            });
        }
    };

    // Load sample data into the input
    const handleLoadSample = (sampleType) => {
        if (!sampleData) return;

        let sampleValue;

        switch (sampleType) {
            case 'itinerary':
                // Get first stop from itinerary if available
                if (sampleData.itinerary && sampleData.itinerary.length > 0) {
                    const stop = sampleData.itinerary[0];
                    if (stop.coordinates) {
                        sampleValue = JSON.stringify(stop.coordinates);
                        setConversionType('lngLatToLatLng'); // Assuming GeoJSON format in the data
                    }
                }
                break;

            case 'vehicle':
                // Get vehicle location if available
                if (sampleData.vehicle && sampleData.vehicle.location) {
                    const location = sampleData.vehicle.location;
                    if (location.lat && location.lng) {
                        sampleValue = JSON.stringify(location);
                        setConversionType('objectToArray');
                    }
                }
                break;

            case 'current':
                // Get current location if available
                if (sampleData.currentLocation) {
                    sampleValue = JSON.stringify(sampleData.currentLocation);
                    setConversionType(Array.isArray(sampleData.currentLocation) ? 'lngLatToLatLng' : 'objectToArray');
                }
                break;

            default:
                return;
        }

        if (sampleValue) {
            setInputValue(sampleValue);
            setResult(null);
            setValidationResult(null);
        }
    };

    // Generate GeoJSON for testing
    const generateTestGeoJSON = () => {
        if (!result || result.error) return;

        const [lng, lat] = result.output;

        const geoJSON = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    },
                    properties: {
                        title: 'Test Point',
                        description: 'A point for testing coordinate formats'
                    }
                }
            ]
        };

        setResult({
            ...result,
            geoJSON: JSON.stringify(geoJSON, null, 2)
        });
    };

    return (
        <div className="coordinate-format-test">
            <div className="test-header">
                <h2>Coordinate Format Test</h2>
                <p>
                    Verify coordinate data format compatibility with MapBox GL,
                    which requires GeoJSON [longitude, latitude] format
                </p>
            </div>

            <div className="conversion-selector">
                <label htmlFor="conversion-type">Conversion Type:</label>
                <select
                    id="conversion-type"
                    value={conversionType}
                    onChange={(e) => setConversionType(e.target.value)}
                >
                    {Object.keys(examples).map(key => (
                        <option key={key} value={key}>{examples[key].description}</option>
                    ))}
                </select>
            </div>

            <div className="test-content">
                <div className="input-section">
                    <label htmlFor="coordinate-input">Input Coordinates:</label>
                    <textarea
                        id="coordinate-input"
                        value={inputValue}
                        onChange={handleInputChange}
                        placeholder="Enter coordinates"
                        rows={3}
                    />
                    <div className="input-actions">
                        <button className="convert-button" onClick={handleConvert}>
                            Convert &amp; Validate
                        </button>

                        {sampleData && (
                            <div className="sample-buttons">
                                <button onClick={() => handleLoadSample('itinerary')}>
                                    Load Itinerary Sample
                                </button>
                                <button onClick={() => handleLoadSample('vehicle')}>
                                    Load Vehicle Sample
                                </button>
                                <button onClick={() => handleLoadSample('current')}>
                                    Load Current Location
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="example-note">
                    <strong>Example:</strong> {examples[conversionType].input} →{' '}
                    {examples[conversionType].expected}
                    <p className="note">{examples[conversionType].note}</p>
                </div>

                {result && (
                    <div className={`result-section ${result.error ? 'error' : 'success'}`}>
                        {result.error ? (
                            <div className="error-message">
                                <h3>Error</h3>
                                <p>{result.error}</p>
                            </div>
                        ) : (
                            <>
                                <h3>Conversion Result</h3>
                                <div className="result-content">
                                    <div className="result-item">
                                        <span className="label">Input Format:</span>
                                        <span className="value">{JSON.stringify(result.input)}</span>
                                    </div>
                                    <div className="result-item">
                                        <span className="label">Output Format (for MapBox):</span>
                                        <span className="value code">{result.outputString}</span>
                                    </div>

                                    {validationResult && (
                                        <div className={`validation-result ${validationResult.valid ? 'valid' : 'invalid'}`}>
                                            {validationResult.valid ? (
                                                <p className="valid-message">✅ {validationResult.message}</p>
                                            ) : (
                                                <div className="validation-issues">
                                                    <p>Validation issues:</p>
                                                    <ul>
                                                        {validationResult.issues.map((issue, index) => (
                                                            <li key={index}>{issue}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {validationResult && validationResult.valid && (
                                        <button
                                            className="generate-json-button"
                                            onClick={generateTestGeoJSON}
                                        >
                                            Generate Test GeoJSON
                                        </button>
                                    )}

                                    {result.geoJSON && (
                                        <div className="geojson-result">
                                            <h4>Test GeoJSON</h4>
                                            <pre>{result.geoJSON}</pre>
                                            <p className="note">
                                                This GeoJSON can be used to test with MapBox GL.
                                                Copy it and use it in your map component.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="coordinate-info">
                <h3>About Coordinate Formats</h3>
                <p>
                    Different systems use different coordinate formats:
                </p>
                <ul>
                    <li>
                        <strong>MapBox GL and GeoJSON:</strong> Require [longitude, latitude] format
                    </li>
                    <li>
                        <strong>Google Maps, Leaflet:</strong> Often use [latitude, longitude] format
                    </li>
                    <li>
                        <strong>Object format:</strong> {`{lat: 39.8283, lng: -98.5795}`} is common in many APIs
                    </li>
                    <li>
                        <strong>String format:</strong> "39.8283,-98.5795" is often used in CSV data
                    </li>
                </ul>
                <p className="important-note">
                    ⚠️ Using the wrong coordinate format is a common source of map rendering issues!
                    Always ensure coordinates are in the correct format for the mapping library you're using.
                </p>
            </div>
        </div>
    );
};

export default CoordinateFormatTest;
