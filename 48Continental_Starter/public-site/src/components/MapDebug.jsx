import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './MapDebug.css';

/**
 * MapDebug component - Provides a debug interface for map functionality
 * This helps diagnose coordinate issues, layer problems, and API integration
 */
const MapDebug = ({ mapInstance, tripData, onClose }) => {
    const [activeTab, setActiveTab] = useState('general');
    const [mapCenter, setMapCenter] = useState(null);
    const [mapZoom, setMapZoom] = useState(null);
    const [mapLayers, setMapLayers] = useState([]);
    const [mapSources, setMapSources] = useState([]);
    const [mapErrors, setMapErrors] = useState([]);
    const [coordinateIssues, setCoordinateIssues] = useState([]);

    // Update debug information when map changes
    useEffect(() => {
        if (!mapInstance) return;

        try {
            // Get current map state
            setMapCenter(mapInstance.getCenter());
            setMapZoom(mapInstance.getZoom());

            // Get layers and sources
            const layers = mapInstance.getStyle().layers || [];
            const sources = Object.keys(mapInstance.getStyle().sources || {});

            setMapLayers(layers);
            setMapSources(sources);

            // Listen for map move events to update center/zoom
            const updateMapInfo = () => {
                setMapCenter(mapInstance.getCenter());
                setMapZoom(mapInstance.getZoom());
            };

            mapInstance.on('move', updateMapInfo);

            // Listen for map errors
            const errorHandler = (e) => {
                setMapErrors(prev => [...prev, {
                    time: new Date().toISOString(),
                    message: e.error ? e.error.message : 'Unknown map error'
                }]);
            };

            mapInstance.on('error', errorHandler);

            // Check for coordinate issues in tripData
            if (tripData) {
                const issues = [];

                // Check route points
                if (tripData.route) {
                    tripData.route.forEach((point, idx) => {
                        if (!point.longitude || !point.latitude) {
                            issues.push(`Route point ${idx} missing coordinates`);
                        } else if (Math.abs(point.longitude) < Math.abs(point.latitude) && Math.abs(point.longitude) < 90) {
                            issues.push(`Route point ${idx} likely has swapped coordinates: [${point.longitude}, ${point.latitude}]`);
                        }

                        // Check if coordinates array exists and matches lat/lng values
                        if (point.coordinates && Array.isArray(point.coordinates) && point.coordinates.length === 2) {
                            const [lng, lat] = point.coordinates;
                            if (lng !== point.longitude || lat !== point.latitude) {
                                issues.push(`Route point ${idx} has inconsistent coordinates: obj[${point.longitude}, ${point.latitude}] vs array[${lng}, ${lat}]`);
                            }
                        }
                    });
                }

                // Check stop points
                if (tripData.stops) {
                    tripData.stops.forEach((stop, idx) => {
                        if (!stop.longitude || !stop.latitude) {
                            issues.push(`Stop ${idx} (${stop.name || 'unnamed'}) missing coordinates`);
                        } else if (Math.abs(stop.longitude) < Math.abs(stop.latitude) && Math.abs(stop.longitude) < 90) {
                            issues.push(`Stop ${idx} (${stop.name || 'unnamed'}) likely has swapped coordinates: [${stop.longitude}, ${stop.latitude}]`);
                        }

                        // Check if coordinates array exists and matches lat/lng values
                        if (stop.coordinates && Array.isArray(stop.coordinates) && stop.coordinates.length === 2) {
                            const [lng, lat] = stop.coordinates;
                            if (lng !== stop.longitude || lat !== stop.latitude) {
                                issues.push(`Stop ${idx} (${stop.name || 'unnamed'}) has inconsistent coordinates: obj[${stop.longitude}, ${stop.latitude}] vs array[${lng}, ${lat}]`);
                            }
                        }
                    });
                }

                // Check GeoJSON
                if (tripData.geoJSON) {
                    try {
                        const features = tripData.geoJSON.features || [];
                        features.forEach((feature, idx) => {
                            if (feature.geometry.type === 'LineString') {
                                const coords = feature.geometry.coordinates;
                                coords.forEach((coord, coordIdx) => {
                                    if (!Array.isArray(coord) || coord.length !== 2) {
                                        issues.push(`GeoJSON feature ${idx} has invalid coordinates at index ${coordIdx}`);
                                    } else if (Math.abs(coord[0]) < Math.abs(coord[1]) && Math.abs(coord[0]) < 90) {
                                        issues.push(`GeoJSON feature ${idx} likely has swapped coordinates at index ${coordIdx}: [${coord[0]}, ${coord[1]}]`);
                                    }
                                });
                            }
                        });
                    } catch (e) {
                        issues.push(`Error validating GeoJSON: ${e.message}`);
                    }
                }

                setCoordinateIssues(issues);
            }

            return () => {
                // Cleanup listeners
                mapInstance.off('move', updateMapInfo);
                mapInstance.off('error', errorHandler);
            };
        } catch (error) {
            console.error('Error in MapDebug component:', error);
        }
    }, [mapInstance, tripData]);

    const forceLayerRefresh = () => {
        if (!mapInstance || !tripData) return;

        try {
            // Remove existing layers and sources
            if (mapInstance.getLayer('route-line')) {
                mapInstance.removeLayer('route-line');
            }

            if (mapInstance.getSource('route')) {
                mapInstance.removeSource('route');
            }

            if (mapInstance.getLayer('stops-markers')) {
                mapInstance.removeLayer('stops-markers');
            }

            if (mapInstance.getSource('stops')) {
                mapInstance.removeSource('stops');
            }

            // Create GeoJSON for route
            if (tripData.route && tripData.route.length > 1) {
                const coordinates = tripData.route.map(point => {
                    // Ensure coordinates are in [longitude, latitude] format
                    if (point.coordinates && Array.isArray(point.coordinates) && point.coordinates.length === 2) {
                        return point.coordinates;
                    }
                    return [point.longitude, point.latitude];
                });

                // Add route source and layer
                mapInstance.addSource('route', {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates
                        }
                    }
                });

                mapInstance.addLayer({
                    id: 'route-line',
                    type: 'line',
                    source: 'route',
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    paint: {
                        'line-color': '#0066cc',
                        'line-width': 4,
                        'line-opacity': 0.8
                    }
                });
            }

            // Create GeoJSON for stops
            if (tripData.stops && tripData.stops.length > 0) {
                const features = tripData.stops.map(stop => {
                    // Ensure coordinates are in [longitude, latitude] format
                    let coordinates;
                    if (stop.coordinates && Array.isArray(stop.coordinates) && stop.coordinates.length === 2) {
                        coordinates = stop.coordinates;
                    } else {
                        coordinates = [stop.longitude, stop.latitude];
                    }

                    return {
                        type: 'Feature',
                        properties: {
                            id: stop.id,
                            name: stop.name,
                            description: stop.description,
                            type: stop.type,
                            charging: stop.charging,
                            overnight: stop.overnight
                        },
                        geometry: {
                            type: 'Point',
                            coordinates
                        }
                    };
                });

                // Add stops source
                mapInstance.addSource('stops', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features
                    }
                });

                // For simplicity in debug mode, just use circles
                mapInstance.addLayer({
                    id: 'stops-markers',
                    type: 'circle',
                    source: 'stops',
                    paint: {
                        'circle-radius': 6,
                        'circle-color': [
                            'match',
                            ['get', 'type'],
                            'start', '#00ff00',
                            'end', '#ff0000',
                            'overnight', '#0000ff',
                            '#ffaa00'
                        ],
                        'circle-stroke-width': 2,
                        'circle-stroke-color': '#ffffff'
                    }
                });
            }

            // Update lists
            setMapLayers(mapInstance.getStyle().layers || []);
            setMapSources(Object.keys(mapInstance.getStyle().sources || {}));

        } catch (error) {
            console.error('Error refreshing layers in debug mode:', error);
            setMapErrors(prev => [...prev, {
                time: new Date().toISOString(),
                message: `Error refreshing layers: ${error.message}`
            }]);
        }
    };

    return (
        <div className="map-debug-overlay">
            <div className="map-debug-header">
                <h3>Map Debugger</h3>
                <div className="map-debug-tabs">
                    <button
                        className={activeTab === 'general' ? 'active' : ''}
                        onClick={() => setActiveTab('general')}
                    >
                        General
                    </button>
                    <button
                        className={activeTab === 'coordinates' ? 'active' : ''}
                        onClick={() => setActiveTab('coordinates')}
                    >
                        Coordinates
                    </button>
                    <button
                        className={activeTab === 'layers' ? 'active' : ''}
                        onClick={() => setActiveTab('layers')}
                    >
                        Layers
                    </button>
                    <button
                        className={activeTab === 'errors' ? 'active' : ''}
                        onClick={() => setActiveTab('errors')}
                    >
                        Errors
                    </button>
                </div>
                <button className="map-debug-close" onClick={onClose}>×</button>
            </div>

            <div className="map-debug-content">
                {activeTab === 'general' && (
                    <div className="map-debug-panel">
                        <h4>Map Information</h4>
                        <table>
                            <tbody>
                                <tr>
                                    <td>Center:</td>
                                    <td>
                                        {mapCenter ? `${mapCenter.lng.toFixed(4)}, ${mapCenter.lat.toFixed(4)}` : 'Unknown'}
                                    </td>
                                </tr>
                                <tr>
                                    <td>Zoom:</td>
                                    <td>{mapZoom !== null ? mapZoom.toFixed(2) : 'Unknown'}</td>
                                </tr>
                                <tr>
                                    <td>Route Points:</td>
                                    <td>{tripData?.route?.length || 0}</td>
                                </tr>
                                <tr>
                                    <td>Stops:</td>
                                    <td>{tripData?.stops?.length || 0}</td>
                                </tr>
                            </tbody>
                        </table>

                        <h4>Sources ({mapSources.length})</h4>
                        <ul className="map-debug-list">
                            {mapSources.map(source => (
                                <li key={source}>{source}</li>
                            ))}
                        </ul>

                        <button className="map-debug-button" onClick={forceLayerRefresh}>
                            Force Layer Refresh
                        </button>
                    </div>
                )}

                {activeTab === 'coordinates' && (
                    <div className="map-debug-panel">
                        <h4>Coordinate Issues ({coordinateIssues.length})</h4>
                        {coordinateIssues.length > 0 ? (
                            <ul className="map-debug-list map-debug-issues">
                                {coordinateIssues.map((issue, idx) => (
                                    <li key={idx}>{issue}</li>
                                ))}
                            </ul>
                        ) : (
                            <p>No coordinate issues detected</p>
                        )}

                        <h4>Route Coordinates (First 5)</h4>
                        <table className="map-debug-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Longitude</th>
                                    <th>Latitude</th>
                                    <th>Coordinates Array</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tripData?.route?.slice(0, 5).map((point, idx) => (
                                    <tr key={idx}>
                                        <td>{idx}</td>
                                        <td>{point.longitude}</td>
                                        <td>{point.latitude}</td>
                                        <td>
                                            {point.coordinates
                                                ? `[${point.coordinates[0]}, ${point.coordinates[1]}]`
                                                : 'Missing'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <h4>Stop Coordinates (First 5)</h4>
                        <table className="map-debug-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Name</th>
                                    <th>Longitude</th>
                                    <th>Latitude</th>
                                    <th>Coordinates Array</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tripData?.stops?.slice(0, 5).map((stop, idx) => (
                                    <tr key={idx}>
                                        <td>{idx}</td>
                                        <td>{stop.name}</td>
                                        <td>{stop.longitude}</td>
                                        <td>{stop.latitude}</td>
                                        <td>
                                            {stop.coordinates
                                                ? `[${stop.coordinates[0]}, ${stop.coordinates[1]}]`
                                                : 'Missing'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'layers' && (
                    <div className="map-debug-panel">
                        <h4>Map Layers ({mapLayers.length})</h4>
                        <table className="map-debug-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Type</th>
                                    <th>Source</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mapLayers.map(layer => (
                                    <tr key={layer.id}>
                                        <td>{layer.id}</td>
                                        <td>{layer.type}</td>
                                        <td>{layer.source || 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'errors' && (
                    <div className="map-debug-panel">
                        <h4>Map Errors ({mapErrors.length})</h4>
                        {mapErrors.length > 0 ? (
                            <ul className="map-debug-list map-debug-errors">
                                {mapErrors.map((error, idx) => (
                                    <li key={idx}>
                                        <span className="map-debug-time">
                                            {new Date(error.time).toLocaleTimeString()}
                                        </span>
                                        {error.message}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No errors recorded</p>
                        )}
                        <button
                            className="map-debug-button"
                            onClick={() => setMapErrors([])}
                        >
                            Clear Errors
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

MapDebug.propTypes = {
    mapInstance: PropTypes.object,
    tripData: PropTypes.object,
    onClose: PropTypes.func.isRequired
};

export default MapDebug;
