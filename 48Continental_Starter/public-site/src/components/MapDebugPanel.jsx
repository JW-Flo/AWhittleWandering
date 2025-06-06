/**
 * Map Debug Panel Component
 * 
 * A utility panel for debugging map issues and providing information
 * about the map data, layers, and performance.
 * 
 * This panel is hidden by default and can be toggled with Ctrl+Shift+D
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
    const [expandedSection, setExpandedSection] = useState('trip');

    // Toggle section expansion
    const toggleSection = (section) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    return (
        <div className="map-debug-panel">
            <div className="debug-header">
                <h3>Map Debug Panel</h3>
                <div className="debug-actions">
                    <button
                        className="debug-button"
                        onClick={onResetMap}
                        title="Reset map instance"
                    >
                        Reset Map
                    </button>
                    <button
                        className="debug-button"
                        onClick={onRefreshData}
                        title="Refresh map data"
                    >
                        Refresh Data
                    </button>
                </div>
            </div>

            <div className="debug-status">
                <span className={`status-indicator ${mapReady ? 'status-ok' : 'status-error'}`}></span>
                Map Status: {mapReady ? 'Ready' : 'Not Ready'}
            </div>

            {/* Trip Data Section */}
            <div className="debug-section">
                <div
                    className="section-header"
                    onClick={() => toggleSection('trip')}
                >
                    <h4>Trip Data</h4>
                    <span className="toggle-icon">{expandedSection === 'trip' ? '▼' : '►'}</span>
                </div>

                {expandedSection === 'trip' && (
                    <div className="section-content">
                        <div className="data-item">
                            <span className="data-label">Stops:</span>
                            <span className="data-value">{tripData?.stops?.length || 0}</span>
                        </div>
                        <div className="data-item">
                            <span className="data-label">Route Points:</span>
                            <span className="data-value">{tripData?.route?.length || 0}</span>
                        </div>
                        <div className="data-item">
                            <span className="data-label">Data Source:</span>
                            <span className="data-value">{tripData?.source || 'Unknown'}</span>
                        </div>

                        {tripData?.stops && tripData.stops.length > 0 && (
                            <div className="nested-data">
                                <h5>First Stop:</h5>
                                <pre>
                                    {JSON.stringify(tripData.stops[0], null, 2)}
                                </pre>

                                <h5>Last Stop:</h5>
                                <pre>
                                    {JSON.stringify(tripData.stops[tripData.stops.length - 1], null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Vehicle Data Section */}
            <div className="debug-section">
                <div
                    className="section-header"
                    onClick={() => toggleSection('vehicle')}
                >
                    <h4>Vehicle Data</h4>
                    <span className="toggle-icon">{expandedSection === 'vehicle' ? '▼' : '►'}</span>
                </div>

                {expandedSection === 'vehicle' && (
                    <div className="section-content">
                        {vehicleData ? (
                            <>
                                <div className="data-item">
                                    <span className="data-label">Coordinates:</span>
                                    <span className="data-value">
                                        [{vehicleData.longitude || 'N/A'}, {vehicleData.latitude || 'N/A'}]
                                    </span>
                                </div>
                                <div className="data-item">
                                    <span className="data-label">Heading:</span>
                                    <span className="data-value">{vehicleData.heading || 'N/A'}°</span>
                                </div>
                                <div className="data-item">
                                    <span className="data-label">Speed:</span>
                                    <span className="data-value">{vehicleData.speed || 0} mph</span>
                                </div>
                                <div className="data-item">
                                    <span className="data-label">Battery:</span>
                                    <span className="data-value">
                                        {vehicleData.batteryLevel || 0}% ({vehicleData.range || 0} mi)
                                    </span>
                                </div>
                                <div className="data-item">
                                    <span className="data-label">Timestamp:</span>
                                    <span className="data-value">
                                        {vehicleData.timestamp ? new Date(vehicleData.timestamp).toLocaleString() : 'N/A'}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="no-data">No vehicle data available</div>
                        )}
                    </div>
                )}
            </div>

            {/* Map Events Section */}
            <div className="debug-section">
                <div
                    className="section-header"
                    onClick={() => toggleSection('events')}
                >
                    <h4>Map Events</h4>
                    <span className="toggle-icon">{expandedSection === 'events' ? '▼' : '►'}</span>
                </div>

                {expandedSection === 'events' && (
                    <div className="section-content">
                        <div className="event-logger">
                            <div className="event-item">Map initialized at {new Date().toLocaleTimeString()}</div>
                            {mapReady && <div className="event-item">Map ready event fired</div>}
                            <div className="event-item">Data loaded: {tripData ? 'Success' : 'Pending'}</div>
                            <div className="event-item">Vehicle marker: {vehicleData ? 'Added' : 'Not added'}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Tips Section */}
            <div className="debug-section">
                <div
                    className="section-header"
                    onClick={() => toggleSection('tips')}
                >
                    <h4>Debugging Tips</h4>
                    <span className="toggle-icon">{expandedSection === 'tips' ? '▼' : '►'}</span>
                </div>

                {expandedSection === 'tips' && (
                    <div className="section-content">
                        <ul className="tips-list">
                            <li>Check browser console for MapBox errors</li>
                            <li>Verify coordinates are in [longitude, latitude] format (GeoJSON standard)</li>
                            <li>Ensure MapBox token is valid</li>
                            <li>Check network requests for API data</li>
                            <li>Try resetting the map if layers don't appear</li>
                            <li>Verify map container has a defined height</li>
                        </ul>
                    </div>
                )}
            </div>

            <div className="debug-footer">
                <p>Press Ctrl+Shift+D to hide this panel</p>
            </div>
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
