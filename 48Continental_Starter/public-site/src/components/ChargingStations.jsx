/**
 * Charging Stations Component
 * 
 * This component displays charging station information and controls
 * for the 48 Continental USA road trip tracking website.
 */

/* eslint-env browser */

import React, { useState, useEffect } from 'react';
import { useChargingStations } from '../hooks';
import mapboxgl from 'mapbox-gl';

/**
 * Renders charging station information panel and map markers
 * @param {Object} props - Component props
 * @param {Object} props.mapRef - Reference to the map instance
 * @param {Object} props.vehicle - Current vehicle data (for location)
 * @returns {JSX.Element} ChargingStations component
 */
const ChargingStations = ({ mapRef, vehicle }) => {
  const [showStations, setShowStations] = useState(true);
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

  useEffect(() => {
    if (!mapRef?.current || !stationsData?.stations || !Array.isArray(stationsData.stations)) return;

    // Remove existing markers
    markers.forEach(marker => marker.remove());

    if (!showStations) {
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
  }, [mapRef, stationsData, showStations]);

  const toggleStations = () => {
    setShowStations(!showStations);
  };


  return (
    <div className="charging-stations-container">
      {/* Layer toggle control */}
      <button
        className={`layer-toggle ${showStations ? 'active' : ''}`}
        onClick={toggleStations}
      >
        {showStations ? 'Hide Charging Stations' : 'Show Charging Stations'}
      </button>

      {/* Charging stations info panel */}
      {showStations && (
        <div className="charging-panel">
          <h3>Charging Stations</h3>

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
      )}
    </div>
  );
};

export default ChargingStations;
