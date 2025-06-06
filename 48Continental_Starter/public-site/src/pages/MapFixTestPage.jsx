/**
 * MapFixTestPage
 * 
 * A test page to verify our coordinate format fixes work properly
 * with different coordinate input formats.
 */
/* eslint-env browser */

import React, { useState } from 'react';
import SimpleMapFix from '../components/SimpleMapFix';
import './MapFixTestPage.css';

const MapFixTestPage = () => {
    // Test data with different coordinate formats
    const testCases = [
        {
            name: "Standard Format [lng, lat]",
            vehicleData: {
                location: [-98.5795, 39.8283],
                batteryLevel: 75,
                range: 250,
                speed: 65
            }
        },
        {
            name: "Reversed Format [lat, lng]",
            vehicleData: {
                location: [39.8283, -98.5795],
                batteryLevel: 80,
                range: 275,
                speed: 70
            }
        },
        {
            name: "Object Format {lat, lng}",
            vehicleData: {
                location: { lat: 39.8283, lng: -98.5795 },
                batteryLevel: 65,
                range: 225,
                speed: 55
            }
        },
        {
            name: "Object Format {latitude, longitude}",
            vehicleData: {
                location: { latitude: 39.8283, longitude: -98.5795 },
                batteryLevel: 90,
                range: 300,
                speed: 75
            }
        }
    ];

    // Sample trip data with mixed coordinate formats
    const tripData = {
        route: [
            [-98.5795, 39.8283], // Denver [lng, lat]
            [39.7392, -104.9903], // Intentionally reversed [lat, lng]
            { lat: 40.7608, lng: -111.8910 }, // Salt Lake City as object
            { longitude: -118.2437, latitude: 34.0522 } // Los Angeles as object
        ],
        destinations: [
            {
                name: "Denver, CO",
                location: [-104.9903, 39.7392],
                arrivalTime: "Day 1"
            },
            {
                name: "Salt Lake City, UT",
                location: [40.7608, -111.8910], // Intentionally reversed
                arrivalTime: "Day 3"
            },
            {
                name: "Los Angeles, CA",
                location: { lat: 34.0522, lng: -118.2437 },
                arrivalTime: "Day 5"
            }
        ]
    };

    // State for the current test case and map layers
    const [currentTestCase, setCurrentTestCase] = useState(0);
    const [mapLayers, setMapLayers] = useState({
        satellite: false,
        chargingStations: false
    });

    // Toggle map layers
    const toggleLayer = (layer) => {
        setMapLayers({
            ...mapLayers,
            [layer]: !mapLayers[layer]
        });
    };

    // Change test case
    const changeTestCase = (index) => {
        setCurrentTestCase(index);
    };

    return (
        <div className="map-fix-test-page">
            <div className="test-header">
                <h2>Map Coordinate Format Fix Test</h2>
                <p>Testing different coordinate input formats with our coordinate format normalization utility</p>
            </div>

            <div className="test-controls">
                <div className="test-case-buttons">
                    {testCases.map((testCase, index) => (
                        <button
                            key={index}
                            className={currentTestCase === index ? 'active' : ''}
                            onClick={() => changeTestCase(index)}
                        >
                            {testCase.name}
                        </button>
                    ))}
                </div>

                <div className="layer-toggles">
                    <label>
                        <input
                            type="checkbox"
                            checked={mapLayers.satellite}
                            onChange={() => toggleLayer('satellite')}
                        />
                        Satellite View
                    </label>
                </div>
            </div>

            <div className="test-case-details">
                <h3>Current Test: {testCases[currentTestCase].name}</h3>
                <pre>{JSON.stringify(testCases[currentTestCase].vehicleData.location, null, 2)}</pre>
            </div>

            {/* SimpleMapFix component using the current test case */}
            <div className="map-container-wrapper">
                <SimpleMapFix
                    vehicleData={testCases[currentTestCase].vehicleData}
                    tripData={tripData}
                    mapLayers={mapLayers}
                />
            </div>

            <div className="test-explanation">
                <h3>How This Works</h3>
                <p>
                    Our utility function <code>ensureMapboxFormat</code> automatically detects and converts
                    coordinates to the required MapBox [longitude, latitude] format, regardless of the input format.
                </p>
                <p>
                    This page tests various coordinate formats to demonstrate the utility's ability to handle them correctly.
                    The utility accommodates:
                </p>
                <ul>
                    <li>Standard [longitude, latitude] arrays</li>
                    <li>Reversed [latitude, longitude] arrays (common in many APIs)</li>
                    <li>Object format: <code>{"{lat: 39.8283, lng: -98.5795}"}</code></li>
                    <li>Object format: <code>{"{latitude: 39.8283, longitude: -98.5795}"}</code></li>
                    <li>GeoJSON format: <code>{"{type: 'Point', coordinates: [lng, lat]}"}</code></li>
                </ul>
            </div>
        </div>
    );
};

export default MapFixTestPage;
