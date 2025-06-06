/* eslint-env browser */
import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Map Debug Panel Component
 * 
 * Displays diagnostic information about map state, data loading,
 * and coordinate issues to help troubleshoot map rendering problems.
 */
const MapDebugPanel = ({ tripData, vehicleData, mapReady, onResetMap, onRefreshData }) => {
    const [expanded, setExpanded] = useState(false);

    if (!expanded) {
        return (
            <div className="map-debug-toggle" onClick={() => setExpanded(true)}>
                🔍 Debug
            </div>
        );
    }

    return (
        <div className="map-debug-panel">
            <div className="map-debug-header">
                <h3>Map Debug Panel</h3>
                <button onClick={() => setExpanded(false)}>✖</button>
            </div>

            <div className="map-debug-section">
                <h4>Map Status</h4>
                <div className="debug-item">
                    <span>Map Ready:</span>
                    <span className={mapReady ? 'status-good' : 'status-bad'}>
                        {mapReady ? '✅ Yes' : '❌ No'}
                    </span>
                </div>
                <div className="debug-item">
                    <span>Mapbox Token:</span>
                    <span className="status-info">
                        {window.mapboxTokenStatus || 'Unknown'}
                    </span>
                </div>
                <button onClick={onResetMap} className="debug-action-btn">Reset Map</button>
            </div>

            <div className="map-debug-section">
                <h4>Trip Data</h4>
                <div className="debug-item">
                    <span>Route Points:</span>
                    <span className={tripData?.route?.length > 1 ? 'status-good' : 'status-bad'}>
                        {tripData?.route?.length || 0}
                    </span>
                </div>
                <div className="debug-item">
                    <span>Stops:</span>
                    <span className={tripData?.stops?.length > 0 ? 'status-good' : 'status-bad'}>
                        {tripData?.stops?.length || 0}
                    </span>
                </div>
                <div className="debug-item">
                    <span>Data Source:</span>
                    <span className="status-info">
                        {tripData?.source || 'Local Fallback'}
                    </span>
                </div>
                <button onClick={onRefreshData} className="debug-action-btn">Refresh Data</button>
            </div>

            <div className="map-debug-section">
                <h4>Vehicle Data</h4>
                <div className="debug-item">
                    <span>Coordinates:</span>
                    <span className={vehicleData?.latitude && vehicleData?.longitude ? 'status-good' : 'status-bad'}>
                        {vehicleData?.latitude ?
                            `${vehicleData.latitude.toFixed(4)}, ${vehicleData.longitude.toFixed(4)}` :
                            'Missing'}
                    </span>
                </div>
                <div className="debug-item">
                    <span>Battery:</span>
                    <span className={vehicleData?.batteryLevel > 20 ? 'status-good' : 'status-bad'}>
                        {vehicleData?.batteryLevel ? `${Math.round(vehicleData.batteryLevel)}%` : 'Unknown'}
                    </span>
                </div>
                <div className="debug-item">
                    <span>Data Age:</span>
                    <span className="status-info">
                        {vehicleData?.lastUpdated ?
                            new Date(vehicleData.lastUpdated).toLocaleTimeString() :
                            'Unknown'}
                    </span>
                </div>
            </div>

            <div className="map-debug-section">
                <h4>Coordinate Sample Check</h4>
                <div className="coordinate-check">
                    {tripData?.route && tripData.route.length > 0 ? (
                        <>
                            <div className="debug-item">
                                <span>First Point:</span>
                                <span className="status-info">
                                    {`[${tripData.route[0].longitude}, ${tripData.route[0].latitude}]`}
                                </span>
                            </div>
                            <div className="debug-item">
                                <span>Format:</span>
                                <span className={Math.abs(tripData.route[0].longitude) > 90 ? 'status-good' : 'status-bad'}>
                                    {Math.abs(tripData.route[0].longitude) > 90 ?
                                        '✅ [lng, lat]' :
                                        '❌ Possible [lat, lng]'}
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="debug-item">
                            <span>Route Data:</span>
                            <span className="status-bad">Not Available</span>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
        .map-debug-toggle {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          z-index: 100;
        }
        
        .map-debug-panel {
          position: absolute;
          bottom: 10px;
          right: 10px;
          width: 300px;
          background: rgba(0, 0, 0, 0.85);
          color: white;
          border-radius: 6px;
          padding: 12px;
          font-size: 12px;
          z-index: 100;
          max-height: 80vh;
          overflow-y: auto;
        }
        
        .map-debug-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .map-debug-header h3 {
          margin: 0;
          font-size: 14px;
        }
        
        .map-debug-header button {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 14px;
          padding: 0;
        }
        
        .map-debug-section {
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .map-debug-section h4 {
          margin: 0 0 8px 0;
          font-size: 13px;
          color: #bbb;
        }
        
        .debug-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        
        .debug-action-btn {
          background: rgba(0, 122, 255, 0.5);
          border: none;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          margin-top: 8px;
          cursor: pointer;
          font-size: 11px;
          width: 100%;
        }
        
        .debug-action-btn:hover {
          background: rgba(0, 122, 255, 0.7);
        }
        
        .status-good {
          color: #4CAF50;
        }
        
        .status-bad {
          color: #F44336;
        }
        
        .status-info {
          color: #2196F3;
          word-break: break-all;
        }
        
        @media (max-width: 768px) {
          .map-debug-panel {
            width: 250px;
          }
        }
      `}</style>
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
