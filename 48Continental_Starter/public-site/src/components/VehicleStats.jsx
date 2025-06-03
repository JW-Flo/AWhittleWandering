/**
 * Vehicle Stats Component
 * 
 * Displays detailed information about the Tesla vehicle
 * including battery level, range, speed, and other metrics.
 */

/* eslint-env browser */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Vehicle stats display component
 */
const VehicleStats = ({ vehicleData }) => {
  if (!vehicleData) {
    return (
      <div className="no-data-message">
        <p>Vehicle data not available</p>
      </div>
    );
  }
  
  const { 
    batteryLevel, 
    range, 
    speed, 
    power, 
    temperature, 
    charging, 
    climate,
    locked,
    sentry_mode,
    tire_pressure,
    last_updated
  } = vehicleData;
  
  // Format the last updated time
  const formattedTime = last_updated 
    ? new Date(last_updated).toLocaleString() 
    : 'Unknown';
  
  // Battery level color class
  const getBatteryColorClass = (level) => {
    if (level < 20) return 'critical';
    if (level < 40) return 'warning';
    return 'good';
  };
  
  return (
    <div className="vehicle-stats">
      {/* Main stats */}
      <div className="main-stats">
        <div className="stat-group battery-stats">
          <div className="battery-visual-container">
            <div 
              className={`battery-visual ${getBatteryColorClass(batteryLevel)}`} 
              style={{ width: `${batteryLevel}%` }}
            />
          </div>
          <div className="battery-info">
            <span className="battery-percentage">{Math.round(batteryLevel)}%</span>
            <span className="battery-range">~{Math.round(range)} mi</span>
          </div>
          {charging && (
            <div className="charging-indicator">
              <span className="charging-icon">⚡</span>
              <span>Charging</span>
            </div>
          )}
        </div>
        
        <div className="stat-row">
          <div className="stat-item">
            <span className="stat-label">Speed</span>
            <span className="stat-value">{Math.round(speed)} mph</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Power</span>
            <span className="stat-value">{Math.round(power)} kW</span>
          </div>
        </div>
      </div>
      
      {/* Temperature section */}
      <div className="section">
        <h3>Temperature</h3>
        <div className="stat-row">
          <div className="stat-item">
            <span className="stat-label">Inside</span>
            <span className="stat-value">{Math.round(temperature?.inside || 0)}°F</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Outside</span>
            <span className="stat-value">{Math.round(temperature?.outside || 0)}°F</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Climate</span>
            <span className="stat-value">
              {climate?.enabled ? 'On' : 'Off'}
              {climate?.enabled && climate?.temperature && ` (${climate.temperature}°F)`}
            </span>
          </div>
        </div>
      </div>
      
      {/* Vehicle status section */}
      <div className="section">
        <h3>Vehicle Status</h3>
        <div className="status-grid">
          <div className="status-item">
            <span className="status-icon">{locked ? '🔒' : '🔓'}</span>
            <span className="status-label">{locked ? 'Locked' : 'Unlocked'}</span>
          </div>
          <div className="status-item">
            <span className="status-icon">{sentry_mode ? '👁️' : '⚪'}</span>
            <span className="status-label">Sentry Mode: {sentry_mode ? 'On' : 'Off'}</span>
          </div>
        </div>
      </div>
      
      {/* Tire pressure section */}
      {tire_pressure && (
        <div className="section">
          <h3>Tire Pressure (PSI)</h3>
          <div className="tire-grid">
            <div className="tire-item">
              <span className="tire-value">{Math.round(tire_pressure.front_left)}</span>
              <span className="tire-label">Front Left</span>
            </div>
            <div className="tire-item">
              <span className="tire-value">{Math.round(tire_pressure.front_right)}</span>
              <span className="tire-label">Front Right</span>
            </div>
            <div className="tire-item">
              <span className="tire-value">{Math.round(tire_pressure.rear_left)}</span>
              <span className="tire-label">Rear Left</span>
            </div>
            <div className="tire-item">
              <span className="tire-value">{Math.round(tire_pressure.rear_right)}</span>
              <span className="tire-label">Rear Right</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Last updated */}
      <div className="last-updated">
        Last updated: {formattedTime}
      </div>
    </div>
  );
};

VehicleStats.propTypes = {
  vehicleData: PropTypes.shape({
    batteryLevel: PropTypes.number,
    range: PropTypes.number,
    speed: PropTypes.number,
    power: PropTypes.number,
    temperature: PropTypes.shape({
      inside: PropTypes.number,
      outside: PropTypes.number
    }),
    charging: PropTypes.bool,
    climate: PropTypes.shape({
      enabled: PropTypes.bool,
      temperature: PropTypes.number
    }),
    locked: PropTypes.bool,
    sentry_mode: PropTypes.bool,
    tire_pressure: PropTypes.shape({
      front_left: PropTypes.number,
      front_right: PropTypes.number,
      rear_left: PropTypes.number,
      rear_right: PropTypes.number
    }),
    last_updated: PropTypes.string
  })
};

export default VehicleStats;
