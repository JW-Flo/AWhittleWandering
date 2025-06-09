/**
 * Trip Journey Component
 * 
 * Displays detailed information about the The Wandering Whittle journey,
 * including the trip timeline, stops, and statistics.
 */

/* eslint-env browser */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './TripJourney.css';

/**
 * Trip journey display component
 */
const TripJourney = ({ tripData }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  if (!tripData) {
    return (
      <div className="no-data-message">
        <p>Trip data not available</p>
      </div>
    );
  }
  
  const { 
    name,
    description,
    startDate,
    endDate,
    currentState,
    currentStop,
    nextStop,
    distanceToNext,
    durationToNext,
    stops,
    stats,
    timeline,
    lastUpdated
  } = tripData;
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Format the last updated time
  const formattedUpdateTime = lastUpdated 
    ? new Date(lastUpdated).toLocaleString() 
    : 'Unknown';
  
  // Convert minutes to hours and minutes
  const formatDuration = (minutes) => {
    if (!minutes) return 'Unknown';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours} hr`;
    return `${hours} hr ${mins} min`;
  };
  
  return (
    <div className="trip-journey">
      {/* Tab navigation */}
      <div className="journey-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          Timeline
        </button>
        <button 
          className={`tab-button ${activeTab === 'stops' ? 'active' : ''}`}
          onClick={() => setActiveTab('stops')}
        >
          Stops
        </button>
        <button 
          className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </button>
      </div>
      
      {/* Tab content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="tab-panel overview-panel">
            <div className="trip-header">
              <h3>{name}</h3>
              <p className="trip-description">{description}</p>
            </div>
            
            <div className="trip-dates">
              <div className="date-item">
                <span className="date-label">Start Date:</span>
                <span className="date-value">{formatDate(startDate)}</span>
              </div>
              <div className="date-item">
                <span className="date-label">End Date:</span>
                <span className="date-value">{formatDate(endDate)}</span>
              </div>
            </div>
            
            <div className="current-journey-status">
              <div className="status-header">
                <h4>Current Status</h4>
              </div>
              
              <div className="status-details">
                <div className="status-row">
                  <span className="status-label">Current State:</span>
                  <span className="status-value">{currentState}</span>
                </div>
                <div className="status-row">
                  <span className="status-label">Current Stop:</span>
                  <span className="status-value">{currentStop}</span>
                </div>
                <div className="status-row">
                  <span className="status-label">Next Stop:</span>
                  <span className="status-value">{nextStop}</span>
                </div>
                <div className="status-row">
                  <span className="status-label">Distance to Next:</span>
                  <span className="status-value">{distanceToNext} miles</span>
                </div>
                <div className="status-row">
                  <span className="status-label">Time to Next:</span>
                  <span className="status-value">{formatDuration(durationToNext)}</span>
                </div>
              </div>
            </div>
            
            <div className="journey-summary">
              <div className="summary-stat">
                <span className="stat-number">{stats?.totalDistance.toLocaleString()}</span>
                <span className="stat-label">Total Miles</span>
              </div>
              <div className="summary-stat">
                <span className="stat-number">{stats?.daysOnRoad}</span>
                <span className="stat-label">Days on Road</span>
              </div>
              <div className="summary-stat">
                <span className="stat-number">{stats?.statesVisited}/48</span>
                <span className="stat-label">States Visited</span>
              </div>
              <div className="summary-stat">
                <span className="stat-number">{stats?.chargingStops}</span>
                <span className="stat-label">Charging Stops</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <div className="tab-panel timeline-panel">
            <h3>Trip Timeline</h3>
            
            <div className="timeline-container">
              {timeline && timeline.length > 0 ? (
                <div className="timeline">
                  {timeline.map((event, index) => (
                    <div 
                      key={index} 
                      className={`timeline-item ${event.completed ? 'completed' : 'upcoming'}`}
                    >
                      <div className="timeline-marker"></div>
                      <div className="timeline-content">
                        <span className="timeline-date">{formatDate(event.date)}</span>
                        <h4 className="timeline-location">{event.location}</h4>
                        <p className="timeline-description">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data-message">No timeline events available</p>
              )}
            </div>
          </div>
        )}
        
        {/* Stops Tab */}
        {activeTab === 'stops' && (
          <div className="tab-panel stops-panel">
            <h3>Trip Stops</h3>
            
            <div className="stops-filter">
              <button className="filter-button active">All</button>
              <button className="filter-button">Overnight</button>
              <button className="filter-button">Charging</button>
              <button className="filter-button">Waypoints</button>
            </div>
            
            <div className="stops-list">
              {stops && stops.length > 0 ? (
                stops.map((stop, index) => (
                  <div 
                    key={stop.id || index} 
                    className={`stop-item ${stop.type}`}
                  >
                    <div className="stop-icon">
                      {stop.type === 'overnight' ? '🏨' : 
                       stop.type === 'charging' ? '⚡' : '📍'}
                    </div>
                    <div className="stop-content">
                      <h4 className="stop-name">{stop.name}</h4>
                      <p className="stop-description">{stop.description}</p>
                      <div className="stop-details">
                        <span className="stop-time">
                          {new Date(stop.arrivalTime).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {stop.state && (
                          <span className="stop-state">{stop.state}</span>
                        )}
                        {stop.notes && (
                          <span className="stop-notes">{stop.notes}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-data-message">No stops available</p>
              )}
            </div>
          </div>
        )}
        
        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div className="tab-panel stats-panel">
            <h3>Trip Statistics</h3>
            
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-value">{stats?.totalDistance.toLocaleString()}</span>
                <span className="stat-label">Total Miles</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{stats?.daysOnRoad}</span>
                <span className="stat-label">Days on Road</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{stats?.statesVisited}</span>
                <span className="stat-label">States Visited</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{stats?.chargingStops}</span>
                <span className="stat-label">Charging Stops</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">
                  {stats?.totalDistance && stats?.chargingStops 
                    ? Math.round(stats.totalDistance / stats.chargingStops) 
                    : 'N/A'}
                </span>
                <span className="stat-label">Miles per Charge</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">
                  {stats?.daysOnRoad && stats?.statesVisited 
                    ? (stats.statesVisited / stats.daysOnRoad).toFixed(1) 
                    : 'N/A'}
                </span>
                <span className="stat-label">States per Day</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">
                  {stats?.totalDistance && stats?.daysOnRoad 
                    ? Math.round(stats.totalDistance / stats.daysOnRoad) 
                    : 'N/A'}
                </span>
                <span className="stat-label">Miles per Day</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">
                  {stats?.statesVisited ? ((stats.statesVisited / 48) * 100).toFixed(0) + '%' : '0%'}
                </span>
                <span className="stat-label">Completion</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Last updated */}
      <div className="last-updated">
        Last updated: {formattedUpdateTime}
      </div>
    </div>
  );
};

TripJourney.propTypes = {
  tripData: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    currentState: PropTypes.string,
    currentStop: PropTypes.string,
    nextStop: PropTypes.string,
    distanceToNext: PropTypes.number,
    durationToNext: PropTypes.number,
    route: PropTypes.array,
    stops: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        latitude: PropTypes.number,
        longitude: PropTypes.number,
        state: PropTypes.string,
        type: PropTypes.string,
        charging: PropTypes.bool,
        overnight: PropTypes.bool,
        arrivalTime: PropTypes.string,
        departureTime: PropTypes.string,
        description: PropTypes.string,
        notes: PropTypes.string
      })
    ),
    visitedStates: PropTypes.arrayOf(PropTypes.string),
    stats: PropTypes.shape({
      totalDistance: PropTypes.number,
      daysOnRoad: PropTypes.number,
      chargingStops: PropTypes.number,
      statesVisited: PropTypes.number
    }),
    timeline: PropTypes.arrayOf(
      PropTypes.shape({
        date: PropTypes.string,
        location: PropTypes.string,
        description: PropTypes.string,
        completed: PropTypes.bool
      })
    ),
    lastUpdated: PropTypes.string
  })
};

export default TripJourney;
