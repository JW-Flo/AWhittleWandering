/* eslint-env browser */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './MapDebugPanel.css';

/**
 * MapDebugPanel Component
 * 
 * A debugging panel that displays information about the current state
 * of the map and provides controls for resetting and refreshing map data.
 */
const MapDebugPanel = ({
    tripData,
    vehicleData,
    mapReady,
    onResetMap,
    onRefreshData
}) => {
    const [showRawData, setShowRawData] = useState(false);
    const [activeTab, setActiveTab] = useState('map');

    // Format raw data for display
    const formatData = (data) => {
        if (!data) return 'No data available';

        try {
            return JSON.stringify(data, null, 2);
        } catch (e) {
            return `Error formatting data: ${e.message}`;
        }
    };

    // Get coordinate information in a readable format
    const getCoordinateInfo = () => {
        if (!vehicleData) return 'No vehicle data';

        const lat = vehicleData.latitude || vehicleData.location?.latitude;
        const lng = vehicleData.longitude || vehicleData.location?.longitude;

        if (!lat || !lng) return 'No coordinates available';

        return `[${lng.toFixed(6)}, ${lat.toFixed(6)}] (longitude, latitude)`;
    };

    // Get route information
    const getRouteInfo = () => {
        if (!tripData || !tripData.route) return 'No route data';

        return `${tripData.route.length} points`;
    };

    // Get stops information
    const getStopsInfo = () => {
        if (!tripData || !tripData.stops) return 'No stops data';

        return `${tripData.stops.length} stops`;
    };

    return (
        <div className="map-debug-panel">
            <h3>Map Debug Panel</h3>

            <div className="debug-tabs">
                <button
                    className={activeTab === 'map' ? 'active' : ''}
                    onClick={() => setActiveTab('map')}
                >
                    Map
                </button>
                <button
                    className={activeTab === 'data' ? 'active' : ''}
                    onClick={() => setActiveTab('data')}
                >
                    Data
                </button>
                <button
                    className={activeTab === 'coords' ? 'active' : ''}
                    onClick={() => setActiveTab('coords')}
                >
                    Coords
                </button>
            </div>

            {activeTab === 'map' && (
                <div className="debug-section">
                    <h4>Map Status</h4>
                    <div className="debug-info">
                        <div className="info-row">
                            <span className="info-label">Map Ready:</span>
                            <span className={`info-value ${mapReady ? 'success' : 'error'}`}>
                                {mapReady ? 'Yes' : 'No'}
                            </span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Vehicle:</span>
                            <span className="info-value">
                                {vehicleData ? 'Available' : 'Not Available'}
                            </span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Trip Data:</span>
                            <span className="info-value">
                                {tripData ? 'Available' : 'Not Available'}
                            </span>
                        </div>
                    </div>

                    <div className="debug-action-buttons">
                        <button onClick={onResetMap} className="reset">
                            Reset Map
                        </button>
                        <button onClick={onRefreshData}>
                            Refresh Data
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'data' && (
                <div className="debug-section">
                    <h4>Trip Data</h4>
                    <div className="debug-info">
                        <div className="info-row">
                            <span className="info-label">Route:</span>
                            <span className="info-value">{getRouteInfo()}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Stops:</span>
                            <span className="info-value">{getStopsInfo()}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">States:</span>
                            <span className="info-value">
                                {tripData?.visitedStates ? tripData.visitedStates.join(', ') : 'None'}
                            </span>
                        </div>
                    </div>

                    <div style={{ marginTop: '10px' }}>
                        <label className="toggle-raw-data">
                            <input
                                type="checkbox"
                                checked={showRawData}
                                onChange={() => setShowRawData(!showRawData)}
                            />
                            Show Raw Data
                        </label>
                    </div>

                    {showRawData && (
                        <div className="raw-data-container">
                            <h5>Raw Trip Data</h5>
                            <pre className="raw-data">{formatData(tripData)}</pre>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'coords' && (
                <div className="debug-section">
                    <h4>Coordinate Data</h4>
                    <div className="debug-info">
                        <div className="info-row">
                            <span className="info-label">Current:</span>
                            <span className="info-value">{getCoordinateInfo()}</span>
                        </div>
                        {vehicleData && (
                            <>
                                <div className="info-row">
                                    <span className="info-label">Format:</span>
                                    <span className="info-value">
                                        {vehicleData.latitude && vehicleData.longitude
                                            ? 'lat/lng properties'
                                            : vehicleData.location
                                                ? 'location object'
                                                : 'unknown'}
                                    </span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Heading:</span>
                                    <span className="info-value">
                                        {vehicleData.heading !== undefined
                                            ? `${vehicleData.heading}°`
                                            : 'Not available'}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    <h5>First/Last Route Points</h5>
                    <div className="coords-list">
                        {tripData?.route && tripData.route.length > 0 ? (
                            <>
                                <div className="coord-item">
                                    <span className="coord-label">Start:</span>
                                    <span className="coord-value">
                                        [{tripData.route[0].longitude}, {tripData.route[0].latitude}]
                                    </span>
                                </div>
                                {tripData.route.length > 1 && (
                                    <div className="coord-item">
                                        <span className="coord-label">End:</span>
                                        <span className="coord-value">
                                            [{tripData.route[tripData.route.length - 1].longitude},
                                            {tripData.route[tripData.route.length - 1].latitude}]
                                        </span>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="no-data">No route points available</div>
                        )}
                    </div>

                    <h5>First/Last Stop Points</h5>
                    <div className="coords-list">
                        {tripData?.stops && tripData.stops.length > 0 ? (
                            <>
                                <div className="coord-item">
                                    <span className="coord-label">First:</span>
                                    <span className="coord-value">
                                        [{tripData.stops[0].longitude}, {tripData.stops[0].latitude}]
                                        <small>{tripData.stops[0].name}</small>
                                    </span>
                                </div>
                                {tripData.stops.length > 1 && (
                                    <div className="coord-item">
                                        <span className="coord-label">Last:</span>
                                        <span className="coord-value">
                                            [{tripData.stops[tripData.stops.length - 1].longitude},
                                            {tripData.stops[tripData.stops.length - 1].latitude}]
                                            <small>{tripData.stops[tripData.stops.length - 1].name}</small>
                                        </span>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="no-data">No stop points available</div>
                        )}
                    </div>
                </div>
            )}

            <div className="debug-footer">
                <small>
                    Press Ctrl+Shift+D to toggle debug panel
                </small>
            </div>
        </div>
    );
};

MapDebugPanel.propTypes = {
    tripData: PropTypes.object,
    vehicleData: PropTypes.object,
    mapReady: PropTypes.bool,
    onResetMap: PropTypes.func.isRequired,
    onRefreshData: PropTypes.func.isRequired
};

export default MapDebugPanel;
