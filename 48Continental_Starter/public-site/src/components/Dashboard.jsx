/**
 * Dashboard Component - Redesigned
 * 
 * Map-first design with minimal overlays for a clean, focused journey tracking experience
 */

/* eslint-env browser */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Map from './Map';
import StatesTracker from './StatesTracker';
import { useVehicleData } from '../hooks/useVehicleData';
import { useTripData } from '../hooks/useTripData';
import './Dashboard.css';

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
  const [activePanel, setActivePanel] = useState('journey'); // 'journey', 'vehicle', 'states'

  // Use hooks for enhanced data
  const { vehicleData, loading: vehicleLoading, error: vehicleError } = useVehicleData();
  const { tripData, loading: tripLoading, visitedStates, currentState } = useTripData({
    vehicleData: vehicleData || propVehicleData
  });

  // Use enhanced data if available, fallback to props
  const finalVehicleData = vehicleData || propVehicleData;
  const finalTripData = tripData || propTripData;

  if (isLoading) {
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
  if (error) {
    return (
      <div className="dashboard-fullscreen">
        <div className="loading-overlay">
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</p>
            <p>Unable to load journey data</p>
            <p style={{ fontSize: '14px', opacity: 0.7, marginTop: '10px' }}>
              {error?.message || 'Please check your connection'}
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
          <h1 className="journey-title">48 Continental</h1>
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
          </div>
        </div>
      </div>

      {/* Full Screen Map */}
      <div className="map-fullscreen">
        <Map
          vehicleData={finalVehicleData}
          tripData={finalTripData}
          stationsData={stationsData}
          fullscreen={true}
        />
      </div>

      {/* Floating Controls */}
      <div className="floating-controls">
        <button
          className="fab fab-primary"
          onClick={() => setShowDetails(!showDetails)}
          aria-label="Toggle details"
        >
          {showDetails ? '✕' : 'ℹ️'}
        </button>
      </div>

      {/* Slide-out Details Panel */}
      {showDetails && (
        <div className="details-panel">
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
                <h3>Journey Statistics</h3>

                <div className="stat-group">
                  <div className="stat-row">
                    <span className="stat-label">Total Distance</span>
                    <span className="stat-value">12,847 miles</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Days on Road</span>
                    <span className="stat-value">28 days</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Average Speed</span>
                    <span className="stat-value">458 mi/day</span>
                  </div>
                </div>

                <h4>Charging Summary</h4>
                <div className="stat-group">
                  <div className="stat-row">
                    <span className="stat-label">Total Sessions</span>
                    <span className="stat-value">47</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Energy Used</span>
                    <span className="stat-value">892 kWh</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Efficiency</span>
                    <span className="stat-value">3.8 mi/kWh</span>
                  </div>
                </div>

                <div className="charging-types">
                  <div className="charging-type">
                    <span className="type-icon">⚡</span>
                    <span className="type-count">31</span>
                    <span className="type-label">Superchargers</span>
                  </div>
                  <div className="charging-type">
                    <span className="type-icon">🔌</span>
                    <span className="type-count">16</span>
                    <span className="type-label">Destination</span>
                  </div>
                </div>
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
      )}
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
