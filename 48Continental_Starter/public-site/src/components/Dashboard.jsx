/**
 * Dashboard Component
 * 
 * Main dashboard for the 48 Continental USA journey website.
 * Integrates all the components and provides the main layout.
 */

/* eslint-env browser */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import GlassPanel from './GlassPanel';
import Header from './Header';
import Map from './Map';
import VehicleStats from './VehicleStats';
import WeatherDisplay from './WeatherDisplay';
import StateCollection from './StateCollection';
import TripJourney from './TripJourney';

/**
 * Dashboard component that integrates all other components
 */
const Dashboard = ({ 
  vehicleData, 
  weatherData, 
  tripData,
  stationsData,
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
        tripName={tripData?.name}
        currentState={tripData?.currentState}
        onViewChange={switchView}
        activeView={activeView}
      />
      
      <div className="dashboard-content">
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
                    className={`layer-toggle ${mapLayers.satellite ? 'active' : ''}`}
                    onClick={() => toggleMapLayer('satellite')}
                    aria-pressed={mapLayers.satellite}
                  >
                    Satellite
                  </button>
                  <button 
                    className={`layer-toggle ${mapLayers.traffic ? 'active' : ''}`}
                    onClick={() => toggleMapLayer('traffic')}
                    aria-pressed={mapLayers.traffic}
                  >
                    Traffic
                  </button>
                  <button 
                    className={`layer-toggle ${mapLayers.weather ? 'active' : ''}`}
                    onClick={() => toggleMapLayer('weather')}
                    aria-pressed={mapLayers.weather}
                  >
                    Weather
                  </button>
                  <button 
                    className={`layer-toggle ${mapLayers.chargingStations ? 'active' : ''}`}
                    onClick={() => toggleMapLayer('chargingStations')}
                    aria-pressed={mapLayers.chargingStations}
                  >
                    Charging
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {activeView === 'journey' && (
            <div className="journey-view">
              <GlassPanel title="Trip Journey">
                <TripJourney tripData={tripData} />
              </GlassPanel>
            </div>
          )}
          
          {activeView === 'states' && (
            <div className="states-view">
              <GlassPanel title="States Collection">
                <StateCollection 
                  visitedStates={tripData?.visitedStates}
                  totalStates={48}
                />
              </GlassPanel>
            </div>
          )}
        </div>
        
        {/* Sidebar for stats and info */}
        <div className="dashboard-sidebar">
          <div className="sidebar-panel vehicle-panel">
            <GlassPanel title="Vehicle Status">
              <VehicleStats vehicleData={vehicleData} />
            </GlassPanel>
          </div>
          
          <div className="sidebar-panel weather-panel">
            <GlassPanel title="Current Weather">
              <WeatherDisplay weatherData={weatherData} />
            </GlassPanel>
          </div>
          
          <div className="sidebar-panel current-status-panel">
            <GlassPanel title="Trip Status">
              <div className="quick-status">
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
            </GlassPanel>
          </div>
          
          <div className="sidebar-panel charging-panel">
            <GlassPanel title="Charging Stations">
              <div className="quick-status">
                <div className="status-item">
                  <span className="status-label">Nearby Stations</span>
                  <span className="status-value">
                    {stationsData?.stations ? stationsData.stations.length : 'N/A'}
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">Available Stations</span>
                  <span className="status-value">
                    {stationsData?.stations 
                      ? stationsData.stations.filter(s => s.available).length 
                      : 'N/A'}
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">Search Radius</span>
                  <span className="status-value">
                    {stationsData?.radius ? `${stationsData.radius} miles` : '50 miles'}
                  </span>
                </div>
              </div>
            </GlassPanel>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="dashboard-footer">
        <p>48 Continental USA Journey Tracker</p>
        <p className="last-updated">
          Last Updated: {
            tripData?.lastUpdated 
              ? new Date(tripData.lastUpdated).toLocaleString() 
              : 'Unknown'
          }
        </p>
      </footer>
    </div>
  );
};

Dashboard.propTypes = {
  vehicleData: PropTypes.object,
  weatherData: PropTypes.object,
  tripData: PropTypes.object,
  stationsData: PropTypes.object,
  isLoading: PropTypes.bool,
  error: PropTypes.string
};

Dashboard.defaultProps = {
  isLoading: false,
  error: null
};

export default Dashboard;
