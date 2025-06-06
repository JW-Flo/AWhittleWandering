/**
 * Trip Statistics Component
 * 
 * Displays trip information including:
 * - Trip progress 
 * - States visited
 * - Vehicle status
 * - Journey logs/notes
 * 
 * The component provides a drawer-like interface that can be expanded/collapsed
 * and shows different information cards.
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './TripStatistics.css';

// List of all continental US states with abbreviations
const US_STATES = {
    'AL': 'Alabama',
    'AZ': 'Arizona',
    'AR': 'Arkansas',
    'CA': 'California',
    'CO': 'Colorado',
    'CT': 'Connecticut',
    'DE': 'Delaware',
    'FL': 'Florida',
    'GA': 'Georgia',
    'ID': 'Idaho',
    'IL': 'Illinois',
    'IN': 'Indiana',
    'IA': 'Iowa',
    'KS': 'Kansas',
    'KY': 'Kentucky',
    'LA': 'Louisiana',
    'ME': 'Maine',
    'MD': 'Maryland',
    'MA': 'Massachusetts',
    'MI': 'Michigan',
    'MN': 'Minnesota',
    'MS': 'Mississippi',
    'MO': 'Missouri',
    'MT': 'Montana',
    'NE': 'Nebraska',
    'NV': 'Nevada',
    'NH': 'New Hampshire',
    'NJ': 'New Jersey',
    'NM': 'New Mexico',
    'NY': 'New York',
    'NC': 'North Carolina',
    'ND': 'North Dakota',
    'OH': 'Ohio',
    'OK': 'Oklahoma',
    'OR': 'Oregon',
    'PA': 'Pennsylvania',
    'RI': 'Rhode Island',
    'SC': 'South Carolina',
    'SD': 'South Dakota',
    'TN': 'Tennessee',
    'TX': 'Texas',
    'UT': 'Utah',
    'VT': 'Vermont',
    'VA': 'Virginia',
    'WA': 'Washington',
    'WV': 'West Virginia',
    'WI': 'Wisconsin',
    'WY': 'Wyoming'
};

// Helper to format dates
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
};

// Helper to format times
const formatTime = (dateString) => {
    if (!dateString) return 'N/A';

    try {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting time:', error);
        return dateString;
    }
};

// Calculate distance between two coordinates
const calculateDistance = (lon1, lat1, lon2, lat2) => {
    // Haversine formula to calculate distance between two points
    const R = 3958.8; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance);
};

// Helper to calculate total distance of a route
const calculateTotalDistance = (route) => {
    if (!route || !Array.isArray(route) || route.length < 2) return 0;

    let totalDistance = 0;

    for (let i = 0; i < route.length - 1; i++) {
        const point1 = route[i];
        const point2 = route[i + 1];

        // Skip invalid points
        if (!point1 || !point2) continue;

        // Extract coordinates
        const lon1 = point1.longitude || (Array.isArray(point1) ? point1[0] : null);
        const lat1 = point1.latitude || (Array.isArray(point1) ? point1[1] : null);
        const lon2 = point2.longitude || (Array.isArray(point2) ? point2[0] : null);
        const lat2 = point2.latitude || (Array.isArray(point2) ? point2[1] : null);

        // Skip if coordinates are invalid
        if (lon1 === null || lat1 === null || lon2 === null || lat2 === null) continue;

        totalDistance += calculateDistance(lon1, lat1, lon2, lat2);
    }

    return Math.round(totalDistance);
};

// Helper to calculate trip progress
const calculateProgress = (tripData) => {
    if (!tripData || !tripData.stops || !tripData.stops.length) return { percent: 0, completed: 0, total: 0 };

    const total = tripData.stops.length;
    const completed = tripData.currentStopIndex || 0;
    const percent = Math.round((completed / total) * 100);

    return { percent, completed, total };
};

// Helper to extract visited states from trip data
const extractVisitedStates = (tripData) => {
    if (!tripData || !tripData.stops) return [];

    const visitedStates = new Set();

    // Extract states from stop data
    tripData.stops.forEach(stop => {
        if (stop.state) {
            visitedStates.add(stop.state);
        }
    });

    return Array.from(visitedStates);
};

const TripStatistics = ({ tripData, vehicleData, expanded = false }) => {
    const [isExpanded, setIsExpanded] = useState(expanded);
    const [activeTab, setActiveTab] = useState('progress');
    const [progress, setProgress] = useState({ percent: 0, completed: 0, total: 0 });
    const [totalDistance, setTotalDistance] = useState(0);
    const [visitedStates, setVisitedStates] = useState([]);
    const [remainingStates, setRemainingStates] = useState([]);
    const [journeyLogs, setJourneyLogs] = useState([]);

    // Calculate trip statistics when data changes
    useEffect(() => {
        if (tripData) {
            // Calculate progress
            const tripProgress = calculateProgress(tripData);
            setProgress(tripProgress);

            // Calculate total distance
            const distance = calculateTotalDistance(tripData.route);
            setTotalDistance(distance);

            // Extract visited states
            const visited = extractVisitedStates(tripData);
            setVisitedStates(visited);

            // Calculate remaining states
            const remaining = Object.keys(US_STATES).filter(state => !visited.includes(state));
            setRemainingStates(remaining);

            // Extract journey logs (if available)
            if (tripData.logs && Array.isArray(tripData.logs)) {
                setJourneyLogs(tripData.logs);
            } else if (tripData.notes && Array.isArray(tripData.notes)) {
                setJourneyLogs(tripData.notes);
            } else {
                // Generate some sample logs based on stops
                const generatedLogs = tripData.stops
                    .filter((stop, index) => index <= (tripData.currentStopIndex || 0))
                    .map(stop => ({
                        id: stop.id || Math.random().toString(36).substr(2, 9),
                        date: stop.arrivalDate || new Date().toISOString(),
                        title: `Arrived at ${stop.name || 'unknown location'}`,
                        content: stop.description || `Visited ${stop.name || 'this location'}.`,
                        type: stop.overnight ? 'overnight' : (stop.charging ? 'charging' : 'waypoint')
                    }));

                setJourneyLogs(generatedLogs);
            }
        }
    }, [tripData]);

    // Toggle expanded state
    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    // Set active tab
    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    return (
        <div className={`trip-stats-container ${isExpanded ? 'expanded' : 'collapsed'}`}>
            <div className="trip-stats-toggle" onClick={toggleExpanded}>
                <div className="toggle-icon">
                    {isExpanded ? '◀' : '▶'}
                </div>
                <span className="toggle-label">
                    {isExpanded ? 'Hide Stats' : 'Show Stats'}
                </span>
            </div>

            {isExpanded && (
                <div className="trip-stats-content">
                    <div className="trip-stats-header">
                        <h2>The Wandering Whittle</h2>
                        <div className="trip-tabs">
                            <button
                                className={`tab-button ${activeTab === 'progress' ? 'active' : ''}`}
                                onClick={() => handleTabClick('progress')}
                            >
                                Progress
                            </button>
                            <button
                                className={`tab-button ${activeTab === 'vehicle' ? 'active' : ''}`}
                                onClick={() => handleTabClick('vehicle')}
                            >
                                Vehicle
                            </button>
                            <button
                                className={`tab-button ${activeTab === 'states' ? 'active' : ''}`}
                                onClick={() => handleTabClick('states')}
                            >
                                States
                            </button>
                            <button
                                className={`tab-button ${activeTab === 'logs' ? 'active' : ''}`}
                                onClick={() => handleTabClick('logs')}
                            >
                                Journey
                            </button>
                        </div>
                    </div>

                    <div className="trip-stats-body">
                        {/* Progress Tab */}
                        {activeTab === 'progress' && (
                            <div className="trip-progress-tab">
                                <div className="progress-overview">
                                    <div className="progress-card">
                                        <h3>Trip Progress</h3>
                                        <div className="progress-bar-container">
                                            <div
                                                className="progress-bar"
                                                style={{ width: `${progress.percent}%` }}
                                            >
                                                <span className="progress-text">{progress.percent}%</span>
                                            </div>
                                        </div>
                                        <div className="progress-details">
                                            <div className="progress-stat">
                                                <span className="stat-label">Stops Completed</span>
                                                <span className="stat-value">{progress.completed} of {progress.total}</span>
                                            </div>
                                            <div className="progress-stat">
                                                <span className="stat-label">Distance Covered</span>
                                                <span className="stat-value">{totalDistance} miles</span>
                                            </div>
                                            <div className="progress-stat">
                                                <span className="stat-label">States Visited</span>
                                                <span className="stat-value">{visitedStates.length} of 48</span>
                                            </div>
                                        </div>
                                    </div>

                                    {tripData && tripData.stops && tripData.currentStopIndex !== undefined && (
                                        <div className="current-stop-card">
                                            <h3>Current Location</h3>
                                            <div className="current-stop-details">
                                                {tripData.stops[tripData.currentStopIndex] ? (
                                                    <>
                                                        <h4>{tripData.stops[tripData.currentStopIndex].name || 'Unknown Location'}</h4>
                                                        <p className="stop-description">
                                                            {tripData.stops[tripData.currentStopIndex].description || 'No description available.'}
                                                        </p>
                                                        <div className="stop-meta">
                                                            <div className="meta-item">
                                                                <span className="meta-label">Arrival:</span>
                                                                <span className="meta-value">
                                                                    {formatDate(tripData.stops[tripData.currentStopIndex].arrivalDate)}
                                                                </span>
                                                            </div>
                                                            <div className="meta-item">
                                                                <span className="meta-label">Departure:</span>
                                                                <span className="meta-value">
                                                                    {formatDate(tripData.stops[tripData.currentStopIndex].departureDate)}
                                                                </span>
                                                            </div>
                                                            <div className="meta-item">
                                                                <span className="meta-label">Type:</span>
                                                                <span className="meta-value stop-type">
                                                                    {tripData.stops[tripData.currentStopIndex].overnight ? 'Overnight Stay' :
                                                                        tripData.stops[tripData.currentStopIndex].charging ? 'Charging Stop' : 'Waypoint'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <p className="no-data">No current stop information available</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="next-stops-section">
                                    <h3>Upcoming Stops</h3>
                                    {tripData && tripData.stops && tripData.currentStopIndex !== undefined && (
                                        <div className="upcoming-stops-list">
                                            {tripData.stops
                                                .slice(tripData.currentStopIndex + 1, tripData.currentStopIndex + 4)
                                                .map((stop, index) => (
                                                    <div className="upcoming-stop-item" key={stop.id || index}>
                                                        <div className="stop-indicator">{index + 1}</div>
                                                        <div className="stop-details">
                                                            <h4>{stop.name || 'Unknown Location'}</h4>
                                                            <div className="stop-meta-row">
                                                                <span className="arrival-date">{formatDate(stop.arrivalDate)}</span>
                                                                <span className="stop-type-badge">
                                                                    {stop.overnight ? 'Overnight' :
                                                                        stop.charging ? 'Charging' : 'Waypoint'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            {tripData.stops.length <= tripData.currentStopIndex + 1 && (
                                                <p className="no-data">No upcoming stops</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Vehicle Tab */}
                        {activeTab === 'vehicle' && (
                            <div className="vehicle-stats-tab">
                                {vehicleData ? (
                                    <>
                                        <div className="vehicle-status-card">
                                            <h3>Tesla Status</h3>
                                            <div className="vehicle-main-stats">
                                                <div className="vehicle-stat battery">
                                                    <div className="stat-icon">🔋</div>
                                                    <div className="stat-value">{vehicleData.batteryLevel || 0}%</div>
                                                    <div className="stat-label">Battery</div>
                                                </div>
                                                <div className="vehicle-stat range">
                                                    <div className="stat-icon">⚡</div>
                                                    <div className="stat-value">{vehicleData.range || 0}</div>
                                                    <div className="stat-label">Range (mi)</div>
                                                </div>
                                                <div className="vehicle-stat speed">
                                                    <div className="stat-icon">🚗</div>
                                                    <div className="stat-value">{vehicleData.speed || 0}</div>
                                                    <div className="stat-label">Speed (mph)</div>
                                                </div>
                                            </div>

                                            <div className="vehicle-details-grid">
                                                <div className="vehicle-detail">
                                                    <span className="detail-label">Status</span>
                                                    <span className="detail-value">
                                                        {vehicleData.status || (vehicleData.speed > 0 ? 'Driving' : 'Parked')}
                                                    </span>
                                                </div>
                                                <div className="vehicle-detail">
                                                    <span className="detail-label">Temperature</span>
                                                    <span className="detail-value">
                                                        {vehicleData.temperature ? `${vehicleData.temperature}°F` : 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="vehicle-detail">
                                                    <span className="detail-label">Charging</span>
                                                    <span className="detail-value">
                                                        {vehicleData.charging ? 'Yes' : 'No'}
                                                    </span>
                                                </div>
                                                <div className="vehicle-detail">
                                                    <span className="detail-label">Climate</span>
                                                    <span className="detail-value">
                                                        {vehicleData.climate ? 'On' : 'Off'}
                                                    </span>
                                                </div>
                                                <div className="vehicle-detail">
                                                    <span className="detail-label">Sentry Mode</span>
                                                    <span className="detail-value">
                                                        {vehicleData.sentryMode ? 'On' : 'Off'}
                                                    </span>
                                                </div>
                                                <div className="vehicle-detail">
                                                    <span className="detail-label">Locked</span>
                                                    <span className="detail-value">
                                                        {vehicleData.locked ? 'Yes' : 'No'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="vehicle-location">
                                                <h4>Current Location</h4>
                                                <p className="location-coordinates">
                                                    {vehicleData.latitude && vehicleData.longitude
                                                        ? `${vehicleData.latitude.toFixed(6)}, ${vehicleData.longitude.toFixed(6)}`
                                                        : 'Location data unavailable'}
                                                </p>
                                                <p className="location-update">
                                                    Last updated: {vehicleData.timestamp
                                                        ? formatTime(vehicleData.timestamp)
                                                        : 'Unknown'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="charging-history-card">
                                            <h3>Recent Charging</h3>
                                            {vehicleData.chargingHistory && vehicleData.chargingHistory.length > 0 ? (
                                                <div className="charging-history-list">
                                                    {vehicleData.chargingHistory.map((session, index) => (
                                                        <div className="charging-session" key={session.id || index}>
                                                            <div className="session-header">
                                                                <span className="session-date">{formatDate(session.date)}</span>
                                                                <span className="session-location">{session.location || 'Unknown Location'}</span>
                                                            </div>
                                                            <div className="session-details">
                                                                <div className="session-stat">
                                                                    <span className="stat-label">Added</span>
                                                                    <span className="stat-value">{session.energy || 0} kWh</span>
                                                                </div>
                                                                <div className="session-stat">
                                                                    <span className="stat-label">Range</span>
                                                                    <span className="stat-value">+{session.rangeAdded || 0} mi</span>
                                                                </div>
                                                                <div className="session-stat">
                                                                    <span className="stat-label">Duration</span>
                                                                    <span className="stat-value">{session.duration || 0} min</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="no-data">No recent charging sessions</p>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="no-vehicle-data">
                                        <p>No vehicle data available</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* States Tab */}
                        {activeTab === 'states' && (
                            <div className="states-tab">
                                <div className="states-overview">
                                    <div className="states-progress-card">
                                        <h3>States Progress</h3>
                                        <div className="states-progress-bar">
                                            <div
                                                className="states-progress"
                                                style={{ width: `${(visitedStates.length / 48) * 100}%` }}
                                            >
                                                <span className="states-progress-text">
                                                    {visitedStates.length} of 48
                                                </span>
                                            </div>
                                        </div>
                                        <div className="states-count-summary">
                                            <div className="states-count visited">
                                                <span className="count-value">{visitedStates.length}</span>
                                                <span className="count-label">Visited</span>
                                            </div>
                                            <div className="states-count remaining">
                                                <span className="count-value">{48 - visitedStates.length}</span>
                                                <span className="count-label">Remaining</span>
                                            </div>
                                            <div className="states-count percentage">
                                                <span className="count-value">
                                                    {Math.round((visitedStates.length / 48) * 100)}%
                                                </span>
                                                <span className="count-label">Complete</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="states-lists">
                                    <div className="visited-states-list">
                                        <h3>Visited States</h3>
                                        <div className="states-grid">
                                            {visitedStates.length > 0 ? (
                                                visitedStates.map(stateCode => (
                                                    <div className="state-item visited" key={stateCode}>
                                                        <span className="state-code">{stateCode}</span>
                                                        <span className="state-name">{US_STATES[stateCode] || stateCode}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="no-data">No states visited yet</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="remaining-states-list">
                                        <h3>Remaining States</h3>
                                        <div className="states-grid">
                                            {remainingStates.length > 0 ? (
                                                remainingStates.map(stateCode => (
                                                    <div className="state-item remaining" key={stateCode}>
                                                        <span className="state-code">{stateCode}</span>
                                                        <span className="state-name">{US_STATES[stateCode] || stateCode}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="completed-message">All 48 continental states visited! 🎉</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Journey Logs Tab */}
                        {activeTab === 'logs' && (
                            <div className="journey-logs-tab">
                                <h3>Journey Notes</h3>
                                {journeyLogs && journeyLogs.length > 0 ? (
                                    <div className="journey-logs-timeline">
                                        {journeyLogs.map((log, index) => (
                                            <div className={`log-entry ${log.type || 'waypoint'}`} key={log.id || index}>
                                                <div className="log-date">{formatDate(log.date)}</div>
                                                <div className="log-content">
                                                    <h4 className="log-title">{log.title}</h4>
                                                    <p className="log-text">{log.content}</p>
                                                    {log.imageUrl && (
                                                        <div className="log-image">
                                                            <img src={log.imageUrl} alt={log.title} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="no-data">No journey logs available</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

TripStatistics.propTypes = {
    tripData: PropTypes.object,
    vehicleData: PropTypes.object,
    expanded: PropTypes.bool
};

export default TripStatistics;
