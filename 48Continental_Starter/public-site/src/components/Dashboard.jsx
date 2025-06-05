/**
 * Dashboard Component
 * 
 * Main dashboard for The Wandering Whittle journey website.
 * Integrates all the components and provides the main layout.
 * Styled after Tessie dashboard design for improved user experience.
 */

/* eslint-env browser */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Header from './Header';
import Map from './Map';
import TripCompanionCard from './TripCompanionCard';
import './TripCompanionCard.css';
import WeatherDisplay from './WeatherDisplay';
import StateCollection from './StateCollection';
import TripJourney from './TripJourney';
import { FaSatellite, FaCloudRain, FaRoad, FaChargingStation } from 'react-icons/fa';

// Import component styles
import './Dashboard.css';
import './DarkTheme.css'; // Import the new dark theme

/**
 * Dashboard component that integrates all other components
 */
const Dashboard = ({ 
  vehicleData, 
  weatherData, 
  tripData,
  stationsData,
  connectionStatus,
  isLoading,
  error 
}) => {
  const [activeView, setActiveView] = useState('map');
  const [mapLayers, setMapLayers] = useState({
    weather: false,
    traffic: false,
    satellite: false,
    chargingStations: false
  });
  
  // Handle map layer toggle
  const toggleMapLayer = (layer) => {
    setMapLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };
  
  // Handle view switching
  const switchView = (view) => {
    setActiveView(view);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="dashboard loading-state">
        <Header />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading journey data...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="dashboard error-state">
        <Header />
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2 className="error-title">Something went wrong</h2>
          <p className="error-message">{error}</p>
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="dashboard">
        <Header 
        tripName="The Wandering Whittle"
        currentState={tripData?.currentState}
        onViewChange={switchView}
        activeView={activeView}
      />
      
      <div className="dashboard-content">
        {/* Left sidebar for vehicle status and stats */}
        <div className="dashboard-sidebar">
          {/* Vehicle Status Card */}
          <TripCompanionCard vehicleData={vehicleData} />
          
          {/* Weather Card */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3 className="card-title">Current Weather</h3>
            </div>
            <div className="card-content">
              <WeatherDisplay weatherData={weatherData} />
            </div>
          </div>
          
          {/* Trip Status Card */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3 className="card-title">Trip Status</h3>
            </div>
            <div className="card-content">
              <div className="trip-status">
                <div className="status-item">
                  <span className="status-label">Current State</span>
                  <span className="status-value">{tripData?.currentState || 'N/A'}</span>
                </div>
                <div className="status-item">
                  <span className="status-label">Next Stop</span>
                  <span className="status-value">{tripData?.nextStop || 'N/A'}</span>
                </div>
                <div className="status-item">
                  <span className="status-label">Distance to Next</span>
                  <span className="status-value">
                    {tripData?.distanceToNext ? `${tripData.distanceToNext} miles` : 'N/A'}
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">States Visited</span>
                  <span className="status-value">
                    {tripData?.visitedStates ? `${tripData.visitedStates.length}/48` : '0/48'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main content area */}
        <div className="main-content">
          {activeView === 'map' && (
            <div className="map-view">
              <div className="map-container-wrapper">
                <Map 
                  vehicleData={vehicleData}
                  tripData={tripData}
                  weatherData={weatherData}
                  stationsData={stationsData}
                  mapLayers={mapLayers}
                />
                
                <div className="map-controls">
                  <button 
                    className={`control-button ${mapLayers.satellite ? 'active' : ''}`}
                    onClick={() => toggleMapLayer('satellite')}
                    aria-pressed={mapLayers.satellite}
                    title="Satellite View"
                  >
                    <FaSatellite />
                  </button>
                  <button 
                    className={`control-button ${mapLayers.traffic ? 'active' : ''}`}
                    onClick={() => toggleMapLayer('traffic')}
                    aria-pressed={mapLayers.traffic}
                    title="Traffic"
                  >
                    <FaRoad />
                  </button>
                  <button 
                    className={`control-button ${mapLayers.weather ? 'active' : ''}`}
                    onClick={() => toggleMapLayer('weather')}
                    aria-pressed={mapLayers.weather}
                    title="Weather"
                  >
                    <FaCloudRain />
                  </button>
                  <button 
                    className={`control-button ${mapLayers.chargingStations ? 'active' : ''}`}
                    onClick={() => toggleMapLayer('chargingStations')}
                    aria-pressed={mapLayers.chargingStations}
                    title="Charging Stations"
                  >
                    <FaChargingStation />
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {activeView === 'journey' && (
            <div className="journey-view">
              <div className="dashboard-card">
                <div className="card-header">
                  <h3 className="card-title">Trip Journey</h3>
                </div>
                <div className="card-content">
                  <TripJourney tripData={tripData} />
                </div>
              </div>
            </div>
          )}
          
          {activeView === 'states' && (
            <div className="states-view" role="tabpanel" id="states-panel" aria-labelledby="tab-states">
              <div className="dashboard-card">
                <div className="card-header">
                  <h3 className="card-title">States Collection</h3>
                </div>
                <div className="card-content">
                  <StateCollection 
                    visitedStates={tripData?.visitedStates}
                    totalStates={48}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <footer className="dashboard-footer">
        <p>The Wandering Whittle &copy; 2025</p>
        <div className="footer-status-info">
          <p className="last-updated">
            Last Updated: {
              tripData?.lastUpdated 
                ? new Date(tripData.lastUpdated).toLocaleString() 
                : 'Unknown'
            }
          </p>
          <div className="connection-status">
            <span 
              className={`status-indicator ${connectionStatus}`}
              title={`Connection: ${connectionStatus}`}
            ></span>
            <span className="status-text">
              {connectionStatus === 'connected' ? 'Live Data' : 
               connectionStatus === 'connecting' ? 'Connecting...' :
               connectionStatus === 'reconnecting' ? 'Reconnecting...' :
               'Offline Mode'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

Dashboard.propTypes = {
  vehicleData: PropTypes.object,
  weatherData: PropTypes.object,
  tripData: PropTypes.object,
  stationsData: PropTypes.object,
  connectionStatus: PropTypes.string,
  isLoading: PropTypes.bool,
  error: PropTypes.string
};

Dashboard.defaultProps = {
  isLoading: false,
  error: null
};

export default Dashboard;
