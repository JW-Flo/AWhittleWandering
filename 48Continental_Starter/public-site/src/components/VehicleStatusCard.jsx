/**
 * Vehicle Status Card Component
 * 
 * Displays vehicle status information in a Tessie-like UI.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { FaBatteryThreeQuarters, FaThermometerHalf, FaLocationArrow } from 'react-icons/fa';

/**
 * Vehicle Status Card component
 */
const VehicleStatusCard = ({ vehicleData }) => {
  if (!vehicleData) {
    return (
      <div className="dashboard-card vehicle-status-card">
        <div className="card-header">
          <h3 className="card-title">Vehicle Status</h3>
        </div>
        <div className="card-content">
          <div className="no-data-message">No vehicle data available</div>
        </div>
      </div>
    );
  }

  // Extract vehicle data with proper fallbacks
  const batteryLevelPercent = vehicleData.batteryLevel || 0;
  const range = vehicleData.range || 0;
  const speed = vehicleData.speed || 0;
  const heading = vehicleData.location?.heading;
  const insideTemp = vehicleData.temperature?.inside || 72;
  const outsideTemp = vehicleData.temperature?.outside || 68;
  
  // Determine vehicle status text
  const vehicleStatusText = vehicleData.locked 
    ? 'Parked & Locked' 
    : speed > 0
      ? 'In Use'
      : 'Parked';
  
  return (
    <div className="dashboard-card vehicle-status-card">
      <div className="card-header">
        <h3 className="card-title">Whittle Wagon Status</h3>
      </div>
      <div className="card-content">
        {/* Vehicle primary info */}
        <div className="vehicle-primary-info">
          <div className="vehicle-icon">
            <img src="/whittle-wagon-icon.png" alt="Whittle Wagon Icon" />
          </div>
          <div>
            <h4 className="vehicle-name">Whittle Wagon</h4>
            <p className="vehicle-status">{vehicleStatusText}</p>
          </div>
        </div>
        
        {/* Vehicle stats */}
        <div className="vehicle-stats">
          {/* Battery */}
          <div className="stat-group">
            <div className="stat-label">
              <FaBatteryThreeQuarters size={14} style={{ marginRight: '4px' }} />
              BATTERY
            </div>
          <div className="stat-value battery">{batteryLevelPercent}%</div>
          <div className="battery-graphic">
            <div className="battery-level" style={{ width: `${batteryLevelPercent}%` }}></div>
          </div>
        </div>
        
        {/* Range */}
        <div className="stat-group">
          <div className="stat-label">RANGE</div>
          <div className="stat-value">{range} mi</div>
        </div>
        
        {/* Interior Temperature */}
        <div className="stat-group">
          <div className="stat-label">
            <FaThermometerHalf size={14} style={{ marginRight: '4px' }} />
            INTERIOR
          </div>
          <div className="stat-value">{insideTemp}°F</div>
        </div>
        
        {/* Exterior Temperature */}
        <div className="stat-group">
          <div className="stat-label">
            <FaThermometerHalf size={14} style={{ marginRight: '4px' }} />
            EXTERIOR
          </div>
          <div className="stat-value">{outsideTemp}°F</div>
        </div>
      </div>
      
      {/* Location & Speed */}
      <div className="vehicle-location-info" style={{ marginTop: '20px' }}>
        <div className="stat-label" style={{ marginBottom: '10px' }}>
          <FaLocationArrow size={14} style={{ marginRight: '4px' }} />
          LOCATION
        </div>
        <div className="location-details">
          <div className="speed-heading">
            <span className="stat-value">{speed}</span>
              <span className="stat-unit" style={{ fontSize: '0.9rem', marginLeft: '4px' }}>mph</span>
            </div>
            {heading && (
              <div className="heading-indicator" style={{ marginTop: '5px' }}>
                Heading: {getDirectionFromHeading(heading)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Convert heading in degrees to cardinal direction
 */
function getDirectionFromHeading(heading) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
  return directions[Math.round(heading / 45) % 8];
}

VehicleStatusCard.propTypes = {
  vehicleData: PropTypes.object
};

export default VehicleStatusCard;
