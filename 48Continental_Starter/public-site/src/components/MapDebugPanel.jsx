/**
 * Map Debug Panel Component
 * 
 * Displays diagnostic information about the map state, data, and coordinate formats
 * to help debug rendering issues. Only shown in development mode.
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './MapDebugPanel.css';

const MapDebugPanel = ({
    tripData,
    vehicleData,
    mapReady,
    onResetMap,
    onRefreshData
}) => {
    const [expanded, setExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState('vehicle');

    // Extract diagnostic information
    const mapStatus = {
        mapInitialized: mapReady ? 'Yes' : 'No',
        dataLoaded: tripData ? 'Yes' : 'No',
        vehicleDataAvailable: vehicleData ? 'Yes' : 'No',
        routePointCount: tripData?.route?.length || 0,
        stopsCount: tripData?.stops?.length || 0,
        visitedStates: tripData?.visitedStates?.length || 0
    };

    // Extract a few route points and stops for format checking
    const routeSample = tripData?.route?.slice(0, 3) || [];
    const stopsSample = tripData?.stops?.slice(0, 3) || [];

    // Format coordinates for display
    const formatCoordinate = (coord) => {
        if (!coord) return 'N/A';
        if (Array.isArray(coord)) {
            return `[${coord[0].toFixed(4)}, ${coord[1].toFixed(4)}]`;
        }
        if (coord.latitude !== undefined && coord.longitude !== undefined) {
            return `lat: ${coord.latitude.toFixed(4)}, lng: ${coord.longitude.toFixed(4)}`;
        }
        return 'Invalid format';
    };

    // Perform coordinate validation
    const validateCoordinate = (coord) => {
        if (!coord) return { valid: false, message: 'Missing coordinate' };

        // Check array format (GeoJSON expected format: [longitude, latitude])
        if (Array.isArray(coord) && coord.length === 2) {
            const [first, second] = coord;
            if (typeof first !== 'number' || typeof second !== 'number') {
                return { valid: false, message: 'Non-numeric values' };
            }

            if (Math.abs(first) <= 90 && Math.abs(second) > 90) {
                // This looks like [lat, lng] instead of [lng, lat]
                return { valid: false, message: 'Swapped [lat,lng] format' };
            }

            if (Math.abs(first) > 180 || Math.abs(second) > 90) {
                return { valid: false, message: 'Out of range values' };
            }

            return { valid: true, message: 'Valid [lng,lat] format' };
        }

        // Check object format
        if (coord.latitude !== undefined && coord.longitude !== undefined) {
            if (typeof coord.latitude !== 'number' || typeof coord.longitude !== 'number') {
                return { valid: false, message: 'Non-numeric values' };
            }

            if (Math.abs(coord.latitude) > 90 || Math.abs(coord.longitude) > 180) {
                return { valid: false, message: 'Out of range values' };
            }

            return { valid: true, message: 'Valid {lat,lng} format' };
        }

        return { valid: false, message: 'Unknown format' };
    };

    // Count coordinate format issues
    const countFormatIssues = () => {
        let issues = 0;

        // Check route coordinates
        tripData?.route?.forEach(coord => {
            if (!validateCoordinate(coord).valid) issues++;
        });

        // Check stop coordinates
        tripData?.stops?.forEach(stop => {
            if (!validateCoordinate([stop.longitude, stop.latitude]).valid) issues++;
            if (stop.coordinates && !validateCoordinate(stop.coordinates).valid) issues++;
        });

        return issues;
    };

    const formatIssueCount = countFormatIssues();

    return (
        <div className={`map-debug-panel ${expanded ? 'expanded' : 'collapsed'}`}>
            <div className="debug-header" onClick={() => setExpanded(!expanded)}>
                <h3>Map Debug {formatIssueCount > 0 ? `(${formatIssueCount} issues)` : ''}</h3>
                <span className="toggle-icon">{expanded ? '▼' : '▲'}</span>
            </div>

            {expanded && (
                <div className="debug-content">
                    <div className="debug-tabs">
                        <button
                            className={activeTab === 'vehicle' ? 'active' : ''}
                            onClick={() => setActiveTab('vehicle')}
                        >
                            Vehicle
                        </button>
                        <button
                            className={activeTab === 'route' ? 'active' : ''}
                            onClick={() => setActiveTab('route')}
                        >
                            Route
                        </button>
                        <button
                            className={activeTab === 'stops' ? 'active' : ''}
                            onClick={() => setActiveTab('stops')}
                        >
                            Stops
                        </button>
                        <button
                            className={activeTab === 'map' ? 'active' : ''}
                            onClick={() => setActiveTab('map')}
                        >
                            Map
                        </button>
                    </div>

                    <div className="debug-panel">
                        {activeTab === 'vehicle' && (
                            <div className="debug-section">
                                <h4>Vehicle Data</h4>
                                {vehicleData ? (
                                    <div className="debug-data">
                                        <div className="data-row">
                                            <span className="label">Position:</span>
                                            <span className="value">
                                                lat: {vehicleData.latitude?.toFixed(4) || 'N/A'},
                                                lng: {vehicleData.longitude?.toFixed(4) || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="data-row">
                                            <span className="label">Battery:</span>
                                            <span className="value">{vehicleData.batteryLevel || 0}%</span>
                                        </div>
                                        <div className="data-row">
                                            <span className="label">Speed:</span>
                                            <span className="value">{vehicleData.speed || 0} mph</span>
                                        </div>
                                        <div className="data-row">
                                            <span className="label">Heading:</span>
                                            <span className="value">{vehicleData.heading || 0}°</span>
                                        </div>
                                        <div className="data-row">
                                            <span className="label">Range:</span>
                                            <span className="value">{vehicleData.range || 0} miles</span>
                                        </div>
                                        <div className="data-row">
                                            <span className="label">Validation:</span>
                                            <span className={`value ${validateCoordinate({
                                                latitude: vehicleData.latitude,
                                                longitude: vehicleData.longitude
                                            }).valid ? 'valid' : 'invalid'}`}>
                                                {validateCoordinate({
                                                    latitude: vehicleData.latitude,
                                                    longitude: vehicleData.longitude
                                                }).message}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="no-data">No vehicle data available</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'route' && (
                            <div className="debug-section">
                                <h4>Route Data</h4>
                                {tripData?.route?.length > 0 ? (
                                    <div className="debug-data">
                                        <div className="data-row">
                                            <span className="label">Total Points:</span>
                                            <span className="value">{tripData.route.length}</span>
                                        </div>
                                        <div className="data-row">
                                            <span className="label">Format Issues:</span>
                                            <span className={`value ${formatIssueCount > 0 ? 'invalid' : 'valid'}`}>
                                                {formatIssueCount > 0 ? `${formatIssueCount} issues found` : 'No issues'}
                                            </span>
                                        </div>
                                        <h5>Sample Points (first 3)</h5>
                                        {routeSample.map((point, idx) => (
                                            <div key={idx} className="coordinate-sample">
                                                <div className="data-row">
                                                    <span className="label">Point {idx + 1}:</span>
                                                    <span className="value">{formatCoordinate(point)}</span>
                                                </div>
                                                <div className="data-row">
                                                    <span className="label">Validation:</span>
                                                    <span className={`value ${validateCoordinate(point).valid ? 'valid' : 'invalid'}`}>
                                                        {validateCoordinate(point).message}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="no-data">No route data available</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'stops' && (
                            <div className="debug-section">
                                <h4>Stops Data</h4>
                                {tripData?.stops?.length > 0 ? (
                                    <div className="debug-data">
                                        <div className="data-row">
                                            <span className="label">Total Stops:</span>
                                            <span className="value">{tripData.stops.length}</span>
                                        </div>
                                        <h5>Sample Stops (first 3)</h5>
                                        {stopsSample.map((stop, idx) => (
                                            <div key={idx} className="coordinate-sample">
                                                <div className="data-row">
                                                    <span className="label">Stop {idx + 1}:</span>
                                                    <span className="value">{stop.name || 'Unnamed'}</span>
                                                </div>
                                                <div className="data-row">
                                                    <span className="label">lat/lng Props:</span>
                                                    <span className="value">
                                                        lat: {stop.latitude?.toFixed(4) || 'N/A'},
                                                        lng: {stop.longitude?.toFixed(4) || 'N/A'}
                                                    </span>
                                                </div>
                                                {stop.coordinates && (
                                                    <div className="data-row">
                                                        <span className="label">coordinates Prop:</span>
                                                        <span className="value">{formatCoordinate(stop.coordinates)}</span>
                                                    </div>
                                                )}
                                                <div className="data-row">
                                                    <span className="label">Validation:</span>
                                                    <span className={`value ${validateCoordinate([
                                                        stop.longitude, stop.latitude
                                                    ]).valid ? 'valid' : 'invalid'}`}>
                                                        {validateCoordinate([stop.longitude, stop.latitude]).message}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="no-data">No stops data available</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'map' && (
                            <div className="debug-section">
                                <h4>Map Status</h4>
                                <div className="debug-data">
                                    {Object.entries(mapStatus).map(([key, value]) => (
                                        <div key={key} className="data-row">
                                            <span className="label">{key}:</span>
                                            <span className="value">{value}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="debug-actions">
                                    <button onClick={onResetMap} className="debug-button">
                                        Reset Map
                                    </button>
                                    <button onClick={onRefreshData} className="debug-button">
                                        Refresh Data
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

MapDebugPanel.propTypes = {
    tripData: PropTypes.object,
    vehicleData: PropTypes.object,
    mapReady: PropTypes.bool,
    onResetMap: PropTypes.func,
    onRefreshData: PropTypes.func
};

export default MapDebugPanel;
