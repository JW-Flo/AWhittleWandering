/**
 * Charging Stations Component
 * 
 * This component displays charging station information and controls
 * for the 48 Continental USA road trip tracking website.
 */

/* eslint-env browser */

import React, { useState, useEffect } from 'react';
import { useChargingStations } from '../hooks';

/**
 * Renders charging station information panel and map markers
 * @param {Object} props - Component props
 * @param {Object} props.mapRef - Reference to the map instance
 * @param {Object} props.vehicle - Current vehicle data (for location)
 * @returns {JSX.Element} ChargingStations component
 */
const ChargingStations = ({ mapRef, vehicle }) => {
  const [showStations, setShowStations] = useState(true);
  const [markersLayer, setMarkersLayer] = useState(null);
  
  // Get charging station data using our hook
  const {
    stationsData,
    stationsLoading,
    stationsError,
    refreshStationsData,
    availableStations,
    unavailableStations,
    totalStations
  } = useChargingStations({
    latitude: vehicle?.latitude,
    longitude: vehicle?.longitude,
    radius: 50,  // 50 miles radius
    pollInterval: 300000  // 5 minutes
  });

  // Toggle charging stations visibility
  const toggleStations = () => {
    setShowStations(!showStations);
    
    if (markersLayer) {
      markersLayer.style.display = !showStations ? 'block' : 'none';
    }
  };
  
  // Create markers for stations on map
  useEffect(() => {
    if (!mapRef?.current || !stationsData?.stations || !showStations) return;
    
    // Remove old markers if they exist
    const existingLayer = document.getElementById('charging-markers-layer');
    if (existingLayer) {
      existingLayer.remove();
    }
    
    // Create new markers container
    const markersContainer = document.createElement('div');
    markersContainer.id = 'charging-markers-layer';
    markersContainer.style.position = 'absolute';
    markersContainer.style.top = 0;
    markersContainer.style.left = 0;
    markersContainer.style.zIndex = 10;
    
    // Add markers container to map
    mapRef.current.appendChild(markersContainer);
    setMarkersLayer(markersContainer);
    
    // Create markers for each station
    stationsData.stations.forEach(station => {
      const marker = document.createElement('div');
      marker.className = `map-marker station-marker ${station.available ? 'available' : 'unavailable'}`;
      
      // Position the marker on the map
      const markerPos = mapProjection(station.latitude, station.longitude, mapRef.current);
      marker.style.left = `${markerPos.x}px`;
      marker.style.top = `${markerPos.y}px`;
      
      // Add an icon based on the connector type
      let icon = '⚡';
      if (station.connectorType === 'Tesla') {
        icon = '🔋';
      } else if (station.connectorType === 'CCS') {
        icon = '🔌';
      } else if (station.connectorType === 'CHAdeMO') {
        icon = '🔄';
      }
      marker.innerHTML = icon;
      
      // Show popup on click
      marker.addEventListener('click', () => {
        showStationPopup(station, marker, mapRef.current);
      });
      
      // Add to the markers container
      markersContainer.appendChild(marker);
    });
    
    // Debounce function to limit update frequency
    function debounce(fn, delay) {
      let timer = null;
      return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
      };
    }

    const debouncedUpdate = debounce(() => {
      if (stationsData && stationsData.stations) {
        updateMarkerPositions(stationsData.stations, markersContainer, mapRef.current);
      }
    }, 100);

    // Listen for map-specific events (resize, scroll, etc.)
    mapRef.current.addEventListener('resize', debouncedUpdate);
    mapRef.current.addEventListener('scroll', debouncedUpdate);

    // Optionally, listen for custom map events if your map implementation emits them
    // mapRef.current.addEventListener('move', debouncedUpdate);

    return () => {
      mapRef.current.removeEventListener('resize', debouncedUpdate);
      mapRef.current.removeEventListener('scroll', debouncedUpdate);
      // mapRef.current.removeEventListener('move', debouncedUpdate);
    };
  }, [mapRef, stationsData, showStations]);
  
  // Helper function to project coordinates to map pixels
  function mapProjection(lat, lon, mapElement) {
    // Use map's built-in projection if available (e.g., Mapbox GL)
    if (mapElement && typeof mapElement.project === 'function') {
      const point = mapElement.project([lon, lat]);
      return { x: point.x, y: point.y };
    }
    // Fallback to simple bounds-based projection
    const mapWidth = mapElement.offsetWidth;
    const mapHeight = mapElement.offsetHeight;
    const mapBounds = { north: 49.5, south: 24.5, west: -125.0, east: -66.0 };
    const x = ((lon - mapBounds.west) / (mapBounds.east - mapBounds.west)) * mapWidth;
    const y = ((mapBounds.north - lat) / (mapBounds.north - mapBounds.south)) * mapHeight;
    return { x, y };
  }
  
  // Update marker positions when map changes
  function updateMarkerPositions(stations, container, mapElement) {
    if (!container || !mapElement) return;
    
    const markers = container.querySelectorAll('.station-marker');
    markers.forEach((marker, index) => {
      if (stations[index]) {
        const station = stations[index];
        const position = mapProjection(station.latitude, station.longitude, mapElement);
        marker.style.left = `${position.x}px`;
        marker.style.top = `${position.y}px`;
      }
    });
  }
  
  // Show popup with station details
  function showStationPopup(station, marker, mapElement) {
    // Remove any existing popups
    const existingPopup = document.querySelector('.map-popup');
    if (existingPopup) {
      existingPopup.remove();
    }
    
    // Create popup
    const popup = document.createElement('div');
    popup.className = 'map-popup charging-popup';
    
    // Populate popup with station info
    popup.innerHTML = `
      <h4>${station.name}</h4>
      <p>${station.description}</p>
      <div class="station-power">${station.power} kW</div>
      <div class="station-connector">${station.connectorType}</div>
      ${station.amenities ? `<p>Amenities: ${station.amenities}</p>` : ''}
      <p>Price: ${station.pricing}</p>
      <div class="station-status ${station.available ? 'status-available' : 'status-unavailable'}">
        ${station.available ? 'Available' : 'Unavailable'}
      </div>
    `;
    
    // Position popup above the marker
    const markerRect = marker.getBoundingClientRect();
    const mapRect = mapElement.getBoundingClientRect();
    popup.style.left = `${markerRect.left - mapRect.left}px`;
    popup.style.top = `${markerRect.top - mapRect.top - popup.offsetHeight - 10}px`;
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'popup-close';
    closeButton.innerHTML = '×';
    closeButton.onclick = () => popup.remove();
    popup.appendChild(closeButton);
    
    // Add to map
    mapElement.appendChild(popup);
    
    // Adjust if popup goes out of bounds
    const popupRect = popup.getBoundingClientRect();
    if (popupRect.left < mapRect.left) {
      popup.style.left = `${mapRect.left - mapRect.left + 10}px`;
    }
    if (popupRect.right > mapRect.right) {
      popup.style.left = `${mapRect.right - popupRect.width - mapRect.left - 10}px`;
    }
    if (popupRect.top < mapRect.top) {
      popup.style.top = `${markerRect.bottom - mapRect.top + 10}px`;
    }
  }

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
                  <span className="status-value">{availableStations.length}</span>
                </div>
                <div className="status-item">
                  <span className="status-label">Unavailable</span>
                  <span className="status-value">{unavailableStations.length}</span>
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
