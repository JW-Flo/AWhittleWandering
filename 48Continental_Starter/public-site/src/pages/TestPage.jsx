/**
 * Test Page for SimpleMapFix
 * 
 * This page demonstrates the fixed map component using the
 * simplified approach that properly handles coordinates.
 */

import React, { useState, useEffect } from 'react';
import SimpleMapFix from '../components/SimpleMapFix';
import { useTripData } from '../hooks/useTripData';
import './TestPage.css';

const TestPage = () => {
  // Mock vehicle data with location
  const [vehicleData, setVehicleData] = useState({
    location: {
      latitude: 39.8283,
      longitude: -98.5795
    },
    batteryLevel: 85,
    range: 267,
    speed: 0
  });
  
  // Get trip data using the hook
  const { tripData, loading, error } = useTripData({ vehicleData });
  
  // Map view options
  const [mapLayers, setMapLayers] = useState({
    satellite: false,
    chargingStations: false
  });
  
  // Update vehicle position every few seconds to simulate movement
  useEffect(() => {
    // Only simulate movement if we're not in an error state
    if (error) return;
    
    const interval = setInterval(() => {
      setVehicleData(prev => {
        // Calculate a small random offset
        const latOffset = (Math.random() - 0.5) * 0.01;
        const lngOffset = (Math.random() - 0.5) * 0.01;
        
        return {
          ...prev,
          location: {
            latitude: prev.location.latitude + latOffset,
            longitude: prev.location.longitude + lngOffset
          },
          speed: Math.floor(Math.random() * 65),
          batteryLevel: Math.max(1, prev.batteryLevel - Math.random() * 0.2),
          range: Math.max(1, prev.range - Math.random() * 0.5)
        };
      });
    }, 5000);
    
    return () => clearInterval(interval);
  }, [error]);
  
  // Toggle map layers
  const toggleLayer = (layer) => {
    setMapLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };
  
  return (
    <div className="test-page">
      <header className="test-header">
        <h1>Map Component Test</h1>
        <p>Testing the fixed map component with improved coordinate handling</p>
      </header>
      
      <div className="map-controls">
        <button
          className={mapLayers.satellite ? 'active' : ''}
          onClick={() => toggleLayer('satellite')}
        >
          {mapLayers.satellite ? 'Switch to Streets' : 'Switch to Satellite'}
        </button>
      </div>
      
      <div className="map-wrapper">
        <SimpleMapFix 
          vehicleData={vehicleData}
          tripData={tripData}
          mapLayers={mapLayers}
        />
      </div>
      
      {loading && <p className="loading-message">Loading trip data...</p>}
      
      {error && (
        <div className="error-message">
          <h3>Error Loading Trip Data</h3>
          <p>{error}</p>
        </div>
      )}
      
      <div className="vehicle-debug">
        <h3>Vehicle Data (Simulated)</h3>
        <div className="debug-data">
          <p>Location: [{vehicleData.location.latitude.toFixed(4)}, {vehicleData.location.longitude.toFixed(4)}]</p>
          <p>Battery: {vehicleData.batteryLevel.toFixed(1)}%</p>
          <p>Range: {vehicleData.range.toFixed(1)} miles</p>
          <p>Speed: {vehicleData.speed} mph</p>
        </div>
      </div>
    </div>
  );
};

export default TestPage;