/**
 * Dashboard Component - Redesigned
 * 
 * Map-first design with minimal overlays for a clean, focused journey tracking experience
 */

/* eslint-env browser */
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import PropTypes from 'prop-types';
import StatesTracker from './StatesTracker';
import JourneyTab from './JourneyTab';
import { useVehicleData } from '../hooks/useVehicleData';
import { useTripData } from '../hooks/useTripData';
import './Dashboard.css';

// Lazy load the map component
const EnhancedMap = lazy(() => import('./EnhancedMap'));

// Loading component for the map
const MapLoadingFallback = () => (
  <div className="map-loading-fallback">
    <div className="loading-spinner"></div>
    <p>Loading map...</p>
  </div>
);

const Dashboard = ({
  vehicleData: propVehicleData,
  weatherData,
  tripData: propTripData,
  stationsData,
  connectionStatus,
  isLoading,
  error
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);
  const [activePanel, setActivePanel] = useState('journey'); // 'journey', 'vehicle', 'states'
  const [mapLayers, setMapLayers] = useState({
    weather: false,
    traffic: false,
    satellite: false,
    chargingStations: true
  });

  // Use hooks for enhanced data with combined loading and error states
  const { vehicleData, loading: vehicleLoading, error: vehicleError } = useVehicleData();
  const { tripData, loading: tripLoading, visitedStates, currentState } = useTripData({
    vehicleData: vehicleData || propVehicleData
  });

  // Combine loading and error states
  const isCurrentlyLoading = isLoading || vehicleLoading || tripLoading;
  const currentError = error || vehicleError;

  // Handle keyboard shortcuts and touch gestures for panel toggle
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'i' || e.key === 'I') {
        setShowDetails(prev => !prev);
        setPanelVisible(prev => !prev);
      }

      if (showDetails) {
        // Number keys for panel switching
        if (e.key === '1') setActivePanel('journey');
        if (e.key === '2') setActivePanel('vehicle');
        if (e.key === '3') setActivePanel('states');
      }
    };

    // Listen for map swipe events
    const handleSwipeLeft = () => {
      if (!showDetails) {
        setShowDetails(true);
        setPanelVisible(true);
      }
    };

    const handleSwipeRight = () => {
      if (showDetails) {
        setShowDetails(false);
        setPanelVisible(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('map:swipe:left', handleSwipeLeft);
    document.addEventListener('map:swipe:right', handleSwipeRight);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('map:swipe:left', handleSwipeLeft);
      document.removeEventListener('map:swipe:right', handleSwipeRight);
    };
  }, [showDetails]);

  // Toggle map layers
  const toggleMapLayer = useCallback((layer) => {
    setMapLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  }, []);

  // Use enhanced data if available, fallback to props
  const finalVehicleData = vehicleData || propVehicleData;
  const finalTripData = tripData || propTripData;

  if (isCurrentlyLoading) {
    return (
      <div className="dashboard-fullscreen">
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading your journey...</p>
        </div>
      </div>
    );
  }

  // Error handling
  if (currentError) {
    return (
      <div className="dashboard-fullscreen">
        <div className="loading-overlay">
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</p>
            <p>Unable to load journey data</p>
            <p style={{ fontSize: '14px', opacity: 0.7, marginTop: '10px' }}>
              {currentError?.message || 'Please check your connection'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                background: '#007AFF',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate journey progress using enhanced data
  const statesVisited = visitedStates?.length || finalTripData?.visitedStates?.length || 23;
  const progressPercentage = (statesVisited / 48) * 100;

  return (
    <div className="dashboard-fullscreen" data-testid="dashboard-component">
      {/* Minimal Header Bar */}
      <div className="header-overlay">
        <div className="header-left">
          <h1 className="journey-title">The Wandering Whittle</h1>
          <div className="journey-progress">
            <span className="progress-text">{statesVisited} of 48 states</span>
            <div className="progress-bar-mini">
              <div
                className="progress-fill-mini"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="vehicle-stats">
            <div className="stat-badge">
              <span className="stat-icon">🔋</span>
              <span className="stat-value">{finalVehicleData?.batteryLevel || 72}%</span>
            </div>
            <div className="stat-badge">
              <span className="stat-icon">⚡</span>
              <span className="stat-value">{finalVehicleData?.range || 218} mi</span>
            </div>
            {finalVehicleData?.speed > 0 && (
              <div className="stat-badge">
                <span className="stat-icon">💨</span>
                <span className="stat-value">{finalVehicleData.speed} mph</span>
              </div>
            )}

            {/* Connection status indicator */}
            <div className={`connection-status ${connectionStatus || 'unknown'}`}>
              <span className="status-dot"></span>
              <span className="status-text">
                {connectionStatus === 'connected' && 'Live'}
                {connectionStatus === 'connecting' && 'Connecting...'}
                {connectionStatus === 'disconnected' && 'Offline'}
                {!connectionStatus && 'Status: Unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Map */}
      <div className="map-fullscreen">
        <Suspense fallback={<MapLoadingFallback />}>
          <EnhancedMap
            vehicleData={finalVehicleData}
            tripData={finalTripData}
            stationsData={stationsData}
            weatherData={weatherData}
            fullscreen={true}
            mapLayers={mapLayers}
            mapboxToken={import.meta.env.VITE_MAPBOX_TOKEN}
          />
        </Suspense>
      </div>

      {/* Floating Controls */}
      <div className="floating-controls">
        <button
          className="fab fab-primary"
          onClick={() => {
            setShowDetails(!showDetails);
            setPanelVisible(!showDetails);
          }}
          aria-label="Toggle details"
        >
          {showDetails ? '✕' : 'ℹ️'}
        </button>

        {/* Map Layer Controls */}
        <div className="map-layer-controls">
          <button
            className={`map-layer-button ${mapLayers.chargingStations ? 'active' : ''}`}
            onClick={() => toggleMapLayer('chargingStations')}
            aria-label="Toggle charging stations"
            title="Show/hide charging stations"
          >
            🔌
          </button>

          <button
            className={`map-layer-button ${mapLayers.satellite ? 'active' : ''}`}
            onClick={() => toggleMapLayer('satellite')}
            aria-label="Toggle satellite view"
            title="Toggle satellite view"
          >
            🛰️
          </button>

          {weatherData && (
            <button
              className={`map-layer-button ${mapLayers.weather ? 'active' : ''}`}
              onClick={() => toggleMapLayer('weather')}
              aria-label="Toggle weather overlay"
              title="Show/hide weather overlay"
            >
              ☁️
            </button>
          )}
        </div>
      </div>

      {/* Slide-out Details Panel - Always in DOM but controlled by visibility */}
      <div className={`details-panel ${showDetails && panelVisible ? 'panel-visible' : ''}`}>
        <div className="panel-tabs">
          <button
            className={`panel-tab ${activePanel === 'journey' ? 'active' : ''}`}
            onClick={() => setActivePanel('journey')}
          >
            Journey
          </button>
          <button
            className={`panel-tab ${activePanel === 'vehicle' ? 'active' : ''}`}
            onClick={() => setActivePanel('vehicle')}
          >
            Vehicle
          </button>
          <button
            className={`panel-tab ${activePanel === 'states' ? 'active' : ''}`}
            onClick={() => setActivePanel('states')}
          >
            States
          </button>
        </div>

        <div className="panel-content">
          {activePanel === 'journey' && (
            <div className="journey-details">
              <JourneyTab vehicleData={finalVehicleData} />
            </div>
          )}

          {activePanel === 'vehicle' && (
            <div className="vehicle-details">
              <h3>Vehicle Status</h3>

              <div className="battery-display">
                <div className="battery-icon">
                  <div
                    className="battery-fill"
                    style={{ width: `${finalVehicleData?.batteryLevel || 72}%` }}
                  />
                </div>
                <span className="battery-text">{finalVehicleData?.batteryLevel || 72}%</span>
              </div>

              <div className="stat-group">
                <div className="stat-row">
                  <span className="stat-label">Range</span>
                  <span className="stat-value">{finalVehicleData?.range || 218} miles</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Odometer</span>
                  <span className="stat-value">{finalVehicleData?.odometer?.toLocaleString() || '45,123'} mi</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Location</span>
                  <span className="stat-value">{finalTripData?.currentCity || 'Corpus Christi'}, {currentState || 'TX'}</span>
                </div>
              </div>

              {finalVehicleData?.climate && (
                <>
                  <h4>Climate</h4>
                  <div className="stat-group">
                    <div className="stat-row">
                      <span className="stat-label">Interior</span>
                      <span className="stat-value">{finalVehicleData.climate.insideTemp}°F</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Exterior</span>
                      <span className="stat-value">{finalVehicleData.climate.outsideTemp}°F</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activePanel === 'states' && (
            <div className="states-details">
              <StatesTracker
                visitedStates={visitedStates || finalTripData?.visitedStates || ['TX', 'LA', 'MS', 'AL', 'FL']}
                currentState={currentState || finalTripData?.currentState || 'TX'}
                tripData={finalTripData}
                vehicleData={finalVehicleData}
                compact={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

Dashboard.propTypes = {
  vehicleData: PropTypes.shape({
    batteryLevel: PropTypes.number,
    range: PropTypes.number,
    speed: PropTypes.number,
    location: PropTypes.shape({
      latitude: PropTypes.number,
      longitude: PropTypes.number
    }),
    climate: PropTypes.shape({
      insideTemp: PropTypes.number,
      outsideTemp: PropTypes.number
    }),
    odometer: PropTypes.number
  }),
  weatherData: PropTypes.object,
  tripData: PropTypes.shape({
    visitedStates: PropTypes.arrayOf(PropTypes.string),
    currentState: PropTypes.string,
    nextStop: PropTypes.shape({
      city: PropTypes.string,
      state: PropTypes.string,
      eta: PropTypes.string
    }),
    distanceToNext: PropTypes.number,
    route: PropTypes.arrayOf(
      PropTypes.shape({
        latitude: PropTypes.number,
        longitude: PropTypes.number
      })
    ),
    stops: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        latitude: PropTypes.number,
        longitude: PropTypes.number,
        type: PropTypes.string,
        description: PropTypes.string,
        charging: PropTypes.bool,
        overnight: PropTypes.bool
      })
    )
  }),
  stationsData: PropTypes.shape({
    stations: PropTypes.arrayOf(PropTypes.object)
  }),
  connectionStatus: PropTypes.string,
  isLoading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.object, PropTypes.string])
};

export default Dashboard;
