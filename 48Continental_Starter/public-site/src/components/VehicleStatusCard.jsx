/**
 * Vehicle Status Card Component
 * 
 * Displays vehicle status information in a Tessie-like UI.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { FaCar, FaBatteryThreeQuarters, FaThermometerHalf, FaLocationArrow } from 'react-icons/fa';

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

  // Extract vehicle data
  const { 
    name, 
    model, 
    battery,
    location,
    climate,
    status
  } = vehicleData;

  // Calculate battery level percentage for visualization
  const batteryLevelPercent = battery?.level || 0;
  
  // Determine vehicle status text
  const vehicleStatusText = status?.locked 
    ? 'Parked & Locked' 
    : status?.is_user_present
      ? 'In Use'
      : 'Parked';
  
  return (
    <div className="dashboard-card vehicle-status-card">
      <div className="card-header">
        <h3 className="card-title">Vehicle Status</h3>
      </div>
      <div className="card-content">
        {/* Vehicle primary info */}
        <div className="vehicle-primary-info">
          <div className="vehicle-icon">
            <FaCar size={24} />
          </div>
          <div>
            <h4 className="vehicle-name">{name || `${model} ${new Date().getFullYear()}`}</h4>
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
            <div className="stat-value">{battery?.range || 0} mi</div>
          </div>
          
          {/* Interior Temperature */}
          <div className="stat-group">
            <div className="stat-label">
              <FaThermometerHalf size={14} style={{ marginRight: '4px' }} />
              INTERIOR
            </div>
            <div className="stat-value">{climate?.insideTemp || 72}°F</div>
          </div>
          
          {/* Exterior Temperature */}
          <div className="stat-group">
            <div className="stat-label">
              <FaThermometerHalf size={14} style={{ marginRight: '4px' }} />
              EXTERIOR
            </div>
            <div className="stat-value">{climate?.outsideTemp || 68}°F</div>
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
              <span className="stat-value">{location?.speed || 0}</span>
              <span className="stat-unit" style={{ fontSize: '0.9rem', marginLeft: '4px' }}>mph</span>
            </div>
            {location?.heading && (
              <div className="heading-indicator" style={{ marginTop: '5px' }}>
                Direction: {getDirectionFromHeading(location.heading)}
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
