/**
 * States Tracker Component
 * 
 * Interactive visualization of the 48 continental states journey
 * Shows visited states, current location, and trip progress
 */

/* eslint-env browser */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './StatesTracker.css';

/**
 * US States data with coordinates and info
 */
const US_STATES = {
    AL: { name: 'Alabama', x: 86.8, y: 32.8, visited: false },
    AZ: { name: 'Arizona', x: 111.1, y: 34.0, visited: false },
    AR: { name: 'Arkansas', x: 92.2, y: 34.7, visited: false },
    CA: { name: 'California', x: 119.4, y: 36.8, visited: false },
    CO: { name: 'Colorado', x: 105.5, y: 39.0, visited: false },
    CT: { name: 'Connecticut', x: 72.7, y: 41.6, visited: false },
    DE: { name: 'Delaware', x: 75.5, y: 39.3, visited: false },
    FL: { name: 'Florida', x: 81.5, y: 27.8, visited: false },
    GA: { name: 'Georgia', x: 83.5, y: 33.2, visited: false },
    ID: { name: 'Idaho', x: 114.7, y: 44.3, visited: false },
    IL: { name: 'Illinois', x: 89.4, y: 40.3, visited: false },
    IN: { name: 'Indiana', x: 86.1, y: 39.8, visited: false },
    IA: { name: 'Iowa', x: 93.6, y: 42.0, visited: false },
    KS: { name: 'Kansas', x: 96.7, y: 38.5, visited: false },
    KY: { name: 'Kentucky', x: 84.9, y: 37.7, visited: false },
    LA: { name: 'Louisiana', x: 91.8, y: 31.2, visited: false },
    ME: { name: 'Maine', x: 69.8, y: 44.3, visited: false },
    MD: { name: 'Maryland', x: 76.5, y: 39.0, visited: false },
    MA: { name: 'Massachusetts', x: 71.5, y: 42.2, visited: false },
    MI: { name: 'Michigan', x: 84.5, y: 43.3, visited: false },
    MN: { name: 'Minnesota', x: 95.0, y: 45.7, visited: false },
    MS: { name: 'Mississippi', x: 89.7, y: 32.7, visited: false },
    MO: { name: 'Missouri', x: 92.6, y: 38.4, visited: false },
    MT: { name: 'Montana', x: 110.5, y: 47.0, visited: false },
    NE: { name: 'Nebraska', x: 99.9, y: 41.1, visited: false },
    NV: { name: 'Nevada', x: 117.0, y: 38.3, visited: false },
    NH: { name: 'New Hampshire', x: 71.5, y: 43.4, visited: false },
    NJ: { name: 'New Jersey', x: 74.5, y: 40.3, visited: false },
    NM: { name: 'New Mexico', x: 106.2, y: 34.8, visited: false },
    NY: { name: 'New York', x: 74.9, y: 42.2, visited: false },
    NC: { name: 'North Carolina', x: 79.8, y: 35.6, visited: false },
    ND: { name: 'North Dakota', x: 99.8, y: 47.5, visited: false },
    OH: { name: 'Ohio', x: 82.8, y: 40.4, visited: false },
    OK: { name: 'Oklahoma', x: 96.9, y: 35.5, visited: false },
    OR: { name: 'Oregon', x: 122.1, y: 44.6, visited: false },
    PA: { name: 'Pennsylvania', x: 77.2, y: 40.3, visited: false },
    RI: { name: 'Rhode Island', x: 71.5, y: 41.7, visited: false },
    SC: { name: 'South Carolina', x: 80.9, y: 33.8, visited: false },
    SD: { name: 'South Dakota', x: 99.9, y: 44.3, visited: false },
    TN: { name: 'Tennessee', x: 86.7, y: 35.7, visited: false },
    TX: { name: 'Texas', x: 97.6, y: 31.1, visited: false },
    UT: { name: 'Utah', x: 111.9, y: 40.2, visited: false },
    VT: { name: 'Vermont', x: 72.6, y: 44.0, visited: false },
    VA: { name: 'Virginia', x: 78.2, y: 37.8, visited: false },
    WA: { name: 'Washington', x: 121.5, y: 47.4, visited: false },
    WV: { name: 'West Virginia', x: 80.9, y: 38.5, visited: false },
    WI: { name: 'Wisconsin', x: 89.6, y: 44.3, visited: false },
    WY: { name: 'Wyoming', x: 107.3, y: 42.8, visited: false },
    DC: { name: 'Washington DC', x: 77.0, y: 38.9, visited: false },
};

/**
 * States Tracker Component
 */
const StatesTracker = ({
    visitedStates = [],
    currentState = null,
    tripData = null,
    vehicleData = null,
    compact = false
}) => {
    const [hoveredState, setHoveredState] = useState(null);
    const [animationPhase, setAnimationPhase] = useState(0);

    // Update animation phase for visual effects
    useEffect(() => {
        const interval = setInterval(() => {
            setAnimationPhase(prev => (prev + 1) % 4);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Calculate progress statistics
    const totalStates = 48;
    const visitedCount = visitedStates.length;
    const progressPercentage = Math.round((visitedCount / totalStates) * 100);
    const remainingStates = totalStates - visitedCount;

    // Create state status map
    const stateStatus = {};
    Object.keys(US_STATES).forEach(code => {
        stateStatus[code] = {
            ...US_STATES[code],
            visited: visitedStates.includes(code),
            current: currentState === code,
        };
    });

    const formatStateList = (states) => {
        if (states.length === 0) return 'None';
        if (states.length <= 5) {
            return states.map(code => US_STATES[code]?.name || code).join(', ');
        }
        const first = states.slice(0, 3).map(code => US_STATES[code]?.name || code);
        return `${first.join(', ')} and ${states.length - 3} more`;
    };

    if (compact) {
        return (
            <div className="states-tracker-compact">
                <div className="progress-summary">
                    <div className="progress-circle">
                        <svg viewBox="0 0 36 36" className="circular-chart">
                            <path
                                className="circle-bg"
                                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                                className="circle"
                                strokeDasharray={`${progressPercentage}, 100`}
                                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <text x="18" y="20.35" className="percentage">
                                {visitedCount}
                            </text>
                            <text x="18" y="24" className="label">
                                of 48
                            </text>
                        </svg>
                    </div>
                    <div className="progress-details">
                        <h4>States Progress</h4>
                        <p className="current-location">
                            Currently in: <strong>{US_STATES[currentState]?.name || 'Unknown'}</strong>
                        </p>
                        <p className="remaining">
                            {remainingStates} states remaining
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="states-tracker">
            <div className="tracker-header">
                <h3>The Wandering Whittle States Journey</h3>
                <div className="progress-stats">
                    <div className="stat-item">
                        <span className="stat-number">{visitedCount}</span>
                        <span className="stat-label">Visited</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">{remainingStates}</span>
                        <span className="stat-label">Remaining</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">{progressPercentage}%</span>
                        <span className="stat-label">Complete</span>
                    </div>
                </div>
            </div>

            <div className="progress-bar">
                <div
                    className="progress-fill"
                    style={{ width: `${progressPercentage}%` }}
                />
                <span className="progress-text">
                    {visitedCount} of 48 states visited
                </span>
            </div>

            <div className="states-grid">
                {Object.entries(stateStatus).map(([code, state]) => (
                    <div
                        key={code}
                        className={`state-item ${state.visited ? 'visited' : ''} ${state.current ? 'current' : ''
                            } ${hoveredState === code ? 'hovered' : ''}`}
                        onMouseEnter={() => setHoveredState(code)}
                        onMouseLeave={() => setHoveredState(null)}
                        title={`${state.name} ${state.visited ? '✓ Visited' : '○ Not visited'} ${state.current ? '📍 Current location' : ''
                            }`}
                    >
                        <span className="state-code">{code}</span>
                        <span className="state-name">{state.name}</span>
                        {state.current && (
                            <span className={`current-indicator pulse-${animationPhase}`}>
                                📍
                            </span>
                        )}
                        {state.visited && !state.current && (
                            <span className="visited-indicator">✓</span>
                        )}
                    </div>
                ))}
            </div>

            <div className="tracker-details">
                <div className="detail-section">
                    <h4>Current Location</h4>
                    <p>
                        <strong>{US_STATES[currentState]?.name || 'Unknown'}</strong>
                        {tripData?.currentCity && ` - ${tripData.currentCity}`}
                    </p>
                    {tripData?.nextStop && (
                        <p className="next-destination">
                            Next: {tripData.nextStop.city}, {tripData.nextStop.state}
                            {tripData.distanceToNext && ` (${tripData.distanceToNext} mi)`}
                        </p>
                    )}
                </div>

                <div className="detail-section">
                    <h4>Recently Visited</h4>
                    <p>{formatStateList(visitedStates.slice(-5))}</p>
                </div>

                {tripData?.stateHistory && tripData.stateHistory.length > 0 && (
                    <div className="detail-section">
                        <h4>State Entry History</h4>
                        <div className="state-history">
                            {tripData.stateHistory.slice(-3).reverse().map((entry, index) => (
                                <div key={index} className="history-item">
                                    <span className="history-state">
                                        {US_STATES[entry.state]?.name || entry.state}
                                    </span>
                                    <span className="history-time">
                                        {new Date(entry.timestamp).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="detail-section">
                    <h4>Trip Statistics</h4>
                    <div className="trip-stats">
                        {tripData?.daysOnRoad && (
                            <p>Days on road: <strong>{tripData.daysOnRoad}</strong></p>
                        )}
                        {tripData?.totalMiles && (
                            <p>Total miles: <strong>{tripData.totalMiles.toLocaleString()}</strong></p>
                        )}
                        {tripData?.averageMilesPerDay && (
                            <p>Avg miles/day: <strong>{tripData.averageMilesPerDay}</strong></p>
                        )}
                    </div>
                </div>
            </div>

            {hoveredState && (
                <div className="state-tooltip">
                    <h5>{US_STATES[hoveredState]?.name}</h5>
                    <p>
                        Status: {stateStatus[hoveredState].visited ? 'Visited ✓' : 'Not visited ○'}
                    </p>
                    {stateStatus[hoveredState].current && (
                        <p className="current-location-tooltip">📍 Current location</p>
                    )}
                </div>
            )}
        </div>
    );
};

StatesTracker.propTypes = {
    visitedStates: PropTypes.arrayOf(PropTypes.string),
    currentState: PropTypes.string,
    tripData: PropTypes.object,
    vehicleData: PropTypes.object,
    compact: PropTypes.bool,
};

export default StatesTracker;
