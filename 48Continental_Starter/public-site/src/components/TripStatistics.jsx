/**
 * Trip Statistics Component
 * 
 * This component displays personalized trip statistics and journey data
 * for the 48 Continental USA road trip tracking website.
 */

/* eslint-env browser */

import React, { useState, useEffect } from 'react';
import { useChargingStations } from '../hooks';
import mapboxgl from 'mapbox-gl';

/**
 * Renders trip statistics panel and optional charging station markers
 * @param {Object} props - Component props
 * @param {Object} props.mapRef - Reference to the map instance
 * @param {Object} props.vehicle - Current vehicle data (for location)
 * @returns {JSX.Element} Trip statistics component
 */
const TripStatistics = ({ mapRef, vehicle }) => {
    const [showStations, setShowStations] = useState(false);
    const [activeView, setActiveView] = useState('stats'); // 'stats' or 'stations'
    const [markers, setMarkers] = useState([]);

    const {
        stationsData,
        stationsLoading,
        stationsError,
        refreshStationsData,
        availableStations,
        unavailableStations,
        totalStations
    } = useChargingStations({
        latitude: vehicle?.location?.latitude || vehicle?.latitude,
        longitude: vehicle?.location?.longitude || vehicle?.longitude,
        radius: 50,
        pollInterval: 300000
    });

    // Calculate trip statistics (these would come from real data in production)
    const tripStats = {
        totalMiles: 12847,
        milesCharged: 3421,
        chargingSessions: 47,
        statesVisited: 23,
        daysOnRoad: 28,
        avgMilesPerDay: 458,
        totalKwhUsed: 892,
        avgEfficiency: 3.8, // miles per kWh
        superchargersUsed: 31,
        destinationChargers: 16
    };

    useEffect(() => {
        if (!mapRef?.current || !stationsData?.stations || !Array.isArray(stationsData.stations)) return;

        // Remove existing markers
        markers.forEach(marker => marker.remove());

        if (!showStations || activeView !== 'stations') {
            setMarkers([]);
            return;
        }

        // Create new markers
        const newMarkers = stationsData.stations.map(station => {
            const el = document.createElement('div');
            el.className = `station-marker ${station.available ? 'available' : 'unavailable'}`;

            // Add icon based on connector type
            let icon = '⚡';
            if (station.connectorType === 'Tesla') {
                icon = '🔋';
            } else if (station.connectorType === 'CCS') {
                icon = '🔌';
            } else if (station.connectorType === 'CHAdeMO') {
                icon = '🔄';
            }
            el.innerHTML = icon;

            // Create Mapbox marker
            const marker = new mapboxgl.Marker(el)
                .setLngLat([station.longitude, station.latitude])
                .setPopup(
                    new mapboxgl.Popup({ offset: 25 })
                        .setHTML(`
              <div class="map-popup charging-popup">
                <h4>${station.name}</h4>
                <p>${station.description || 'Tesla Supercharger'}</p>
                <div class="station-power">${station.power || 'Unknown'} kW</div>
                <div class="station-connector">${station.connectorType || 'Tesla'}</div>
                ${station.amenities ? `<p>Amenities: ${station.amenities.join(', ')}</p>` : ''}
                <div class="station-status ${station.available ? 'status-available' : 'status-unavailable'}">
                  ${station.available ? 'Available' : 'Unavailable'}
                </div>
              </div>
            `)
                )
                .addTo(mapRef.current);

            return marker;
        });

        setMarkers(newMarkers);

        return () => {
            newMarkers.forEach(marker => marker.remove());
        };
    }, [mapRef, stationsData, showStations, activeView]);

    const toggleStations = () => {
        setShowStations(!showStations);
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-US').format(num);
    };

    return (
        <div className="charging-stations-container">
            {/* View toggle buttons */}
            <div className="view-toggle-container">
                <button
                    className={`view-toggle ${activeView === 'stats' ? 'active' : ''}`}
                    onClick={() => setActiveView('stats')}
                >
                    Trip Stats
                </button>
                <button
                    className={`view-toggle ${activeView === 'stations' ? 'active' : ''}`}
                    onClick={() => setActiveView('stations')}
                >
                    Charging Stations
                </button>
            </div>

            {/* Trip Statistics View */}
            {activeView === 'stats' && (
                <div className="charging-panel trip-stats-panel">
                    <h3>Journey Statistics</h3>

                    <div className="stats-grid">
                        <div className="stat-item primary">
                            <span className="stat-value">{formatNumber(tripStats.totalMiles)}</span>
                            <span className="stat-label">Total Miles</span>
                        </div>

                        <div className="stat-item primary">
                            <span className="stat-value">{tripStats.statesVisited}/48</span>
                            <span className="stat-label">States Visited</span>
                        </div>

                        <div className="stat-item">
                            <span className="stat-value">{formatNumber(tripStats.milesCharged)}</span>
                            <span className="stat-label">Miles Charged</span>
                        </div>

                        <div className="stat-item">
                            <span className="stat-value">{tripStats.chargingSessions}</span>
                            <span className="stat-label">Charging Sessions</span>
                        </div>

                        <div className="stat-item">
                            <span className="stat-value">{tripStats.daysOnRoad}</span>
                            <span className="stat-label">Days on Road</span>
                        </div>

                        <div className="stat-item">
                            <span className="stat-value">{tripStats.avgMilesPerDay}</span>
                            <span className="stat-label">Avg Miles/Day</span>
                        </div>

                        <div className="stat-item">
                            <span className="stat-value">{formatNumber(tripStats.totalKwhUsed)}</span>
                            <span className="stat-label">kWh Used</span>
                        </div>

                        <div className="stat-item">
                            <span className="stat-value">{tripStats.avgEfficiency}</span>
                            <span className="stat-label">Mi/kWh</span>
                        </div>
                    </div>

                    <div className="charging-breakdown">
                        <h4>Charging Breakdown</h4>
                        <div className="breakdown-stats">
                            <div className="breakdown-item">
                                <span className="breakdown-icon">⚡</span>
                                <span className="breakdown-value">{tripStats.superchargersUsed}</span>
                                <span className="breakdown-label">Superchargers</span>
                            </div>
                            <div className="breakdown-item">
                                <span className="breakdown-icon">🔌</span>
                                <span className="breakdown-value">{tripStats.destinationChargers}</span>
                                <span className="breakdown-label">Destination</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Charging Stations View */}
            {activeView === 'stations' && (
                <>
                    {/* Layer toggle control */}
                    <button
                        className={`layer-toggle ${showStations ? 'active' : ''}`}
                        onClick={toggleStations}
                    >
                        {showStations ? 'Hide Stations on Map' : 'Show Stations on Map'}
                    </button>

                    <div className="charging-panel">
                        <h3>Nearby Charging</h3>

                        {stationsLoading ? (
                            <div className="loading-indicator">Loading charging stations...</div>
                        ) : stationsError ? (
                            <div className="error-message">
                                Error loading charging stations: {stationsError}
                                <button onClick={refreshStationsData}>Retry</button>
                            </div>
                        ) : (
                            <>
                                <div className="quick-status">
                                    <div className="status-item">
                                        <span className="status-label">Total Stations</span>
                                        <span className="status-value">{totalStations}</span>
                                    </div>
                                    <div className="status-item">
                                        <span className="status-label">Available</span>
                                        <span className="status-value">{availableStations?.length || 0}</span>
                                    </div>
                                    <div className="status-item">
                                        <span className="status-label">Unavailable</span>
                                        <span className="status-value">{unavailableStations?.length || 0}</span>
                                    </div>
                                    <div className="status-item">
                                        <span className="status-label">Search Radius</span>
                                        <span className="status-value">{stationsData?.radius || 50} mi</span>
                                    </div>
                                </div>

                                <div className="last-updated">
                                    Last updated: {stationsData?.lastUpdated ? new Date(stationsData.lastUpdated).toLocaleTimeString() : 'Unknown'}
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default TripStatistics;
