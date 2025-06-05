/**
 * Trip Companion Card Component
 * 
 * A simplified, immersive display showing key vehicle telemetry
 * to make viewers feel like they're on the journey.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { FaRoad, FaBatteryThreeQuarters, FaMapMarkerAlt, FaTachometerAlt } from 'react-icons/fa';

const TripCompanionCard = ({ vehicleData }) => {
  if (!vehicleData) {
    return (
      <div className="trip-companion-card">
        <div className="companion-header">
          <h3>🚗 Riding with Joe</h3>
        </div>
        <div className="companion-content">
          <div className="status-message">Waiting for vehicle connection...</div>
        </div>
      </div>
    );
  }

  // Extract the most immersive data points
  const speed = vehicleData.speed || vehicleData.drive_state?.speed || 0;
  const batteryLevel = vehicleData.batteryLevel || vehicleData.charge_state?.battery_level || 0;
  const location = vehicleData.location || {
    latitude: vehicleData.drive_state?.latitude,
    longitude: vehicleData.drive_state?.longitude
  };
  const odometer = vehicleData.odometer || vehicleData.vehicle_state?.odometer || 0;
  
  // Determine current activity
  const getCurrentActivity = () => {
    if (speed > 50) return "Cruising on the highway";
    if (speed > 25) return "Driving through town";
    if (speed > 0) return "Moving slowly";
    if (vehicleData.charge_state?.charging_state === 'Charging') return "Charging up";
    return "Taking a break";
  };

  // Format odometer for trip progress
  const formatOdometer = (miles) => {
    return Math.round(miles).toLocaleString();
  };

  return (
    <div className="trip-companion-card">
      <div className="companion-header">
        <h3>🚗 Riding with Joe</h3>
        <span className="live-indicator">● LIVE</span>
      </div>
      
      <div className="companion-content">
        {/* Current Activity */}
        <div className="activity-status">
          <p className="activity-text">{getCurrentActivity()}</p>
        </div>

        {/* Key Metrics */}
        <div className="trip-metrics">
          {/* Speed - The most immersive metric */}
          <div className="metric-item primary">
            <FaTachometerAlt className="metric-icon" />
            <div className="metric-value">
              <span className="big-number">{Math.round(speed)}</span>
              <span className="unit">mph</span>
            </div>
          </div>

          {/* Battery - Important for EV journey */}
          <div className="metric-item">
            <FaBatteryThreeQuarters className="metric-icon" />
            <div className="metric-value">
              <span className="number">{Math.round(batteryLevel)}%</span>
              <div className="battery-bar">
                <div 
                  className="battery-fill" 
                  style={{ width: `${batteryLevel}%` }}
                />
              </div>
            </div>
          </div>

          {/* Miles Traveled */}
          <div className="metric-item">
            <FaRoad className="metric-icon" />
            <div className="metric-value">
              <span className="number">{formatOdometer(odometer)}</span>
              <span className="label">miles traveled</span>
            </div>
          </div>
        </div>

        {/* Location Context */}
        {location.latitude && location.longitude && (
          <div className="location-context">
            <FaMapMarkerAlt className="location-icon" />
            <span className="location-text">
              Currently near coordinates {location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

TripCompanionCard.propTypes = {
  vehicleData: PropTypes.object
};

export default TripCompanionCard;
