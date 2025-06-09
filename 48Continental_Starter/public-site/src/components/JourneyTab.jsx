/* eslint-env browser */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTripData } from '../hooks/useTripData';
import ErrorBoundary from './ErrorBoundary';
import './JourneyTab.css';

const StateItem = ({ state, visited, current }) => {
    return (
        <div
            className={`state-item ${visited ? 'visited' : ''} ${current ? 'current' : ''}`}
            title={`${state}${visited ? ' - Visited' : ''}${current ? ' - Current' : ''}`}
        >
            <div className="state-code">{state}</div>
            {visited && <div className="visited-indicator">✓</div>}
            {current && <div className="current-indicator">📍</div>}
        </div>
    );
};

StateItem.propTypes = {
    state: PropTypes.string.isRequired,
    visited: PropTypes.bool,
    current: PropTypes.bool
};

const JourneyTimeline = ({ stops, currentLocation }) => {
    // Find the closest stop to current location
    const findCurrentStop = () => {
        if (!currentLocation || !stops || stops.length === 0) return 0;

        let closestIdx = 0;
        let minDistance = Number.MAX_VALUE;

        stops.forEach((stop, index) => {
            const distance = Math.sqrt(
                Math.pow(stop.latitude - currentLocation.latitude, 2) +
                Math.pow(stop.longitude - currentLocation.longitude, 2)
            );

            if (distance < minDistance) {
                minDistance = distance;
                closestIdx = index;
            }
        });

        return closestIdx;
    };

    const currentStopIndex = findCurrentStop();

    return (
        <div className="journey-timeline">
            <h3>Journey Timeline</h3>
            <div className="timeline-container">
                <div className="timeline-line"></div>

                {stops.map((stop, index) => (
                    <div
                        key={stop.id}
                        className={`timeline-stop ${index <= currentStopIndex ? 'completed' : ''} ${index === currentStopIndex ? 'current' : ''}`}
                        style={{ top: `${(index / (stops.length - 1)) * 100}%` }}
                    >
                        <div className="timeline-marker"></div>
                        <div className="timeline-content">
                            <div className="stop-name">{stop.name}</div>
                            <div className="stop-state">{stop.state}</div>
                            {stop.overnight && <div className="stop-overnight">🏨 Overnight</div>}
                            {stop.charging && <div className="stop-charging">⚡ Charging</div>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

JourneyTimeline.propTypes = {
    stops: PropTypes.arrayOf(PropTypes.object),
    currentLocation: PropTypes.shape({
        latitude: PropTypes.number,
        longitude: PropTypes.number
    })
};

const StatsCard = ({ icon, value, label, highlighted }) => (
    <div className={`stats-card ${highlighted ? 'highlighted' : ''}`}>
        <div className="stats-icon">{icon}</div>
        <div className="stats-value">{value}</div>
        <div className="stats-label">{label}</div>
    </div>
);

StatsCard.propTypes = {
    icon: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string.isRequired,
    highlighted: PropTypes.bool
};

const JourneyTab = ({ vehicleData }) => {
    const { tripData, loading, error, visitedStates, currentState } = useTripData({ vehicleData });
    const [journeyStats, setJourneyStats] = useState({
        totalDistance: 0,
        daysOnRoad: 0,
        statesVisited: 0,
        milesPerDay: 0,
        remainingStates: 0,
        percentComplete: 0
    });

    // Process data for stats display
    useEffect(() => {
        if (tripData) {
            setJourneyStats({
                totalDistance: Math.round(tripData.totalMiles || 12000),
                daysOnRoad: tripData.daysOnRoad || 28,
                statesVisited: visitedStates.length,
                milesPerDay: Math.round((tripData.totalMiles || 12000) / (tripData.daysOnRoad || 28)),
                remainingStates: 48 - visitedStates.length,
                percentComplete: Math.round((visitedStates.length / 48) * 100)
            });
        }
    }, [tripData, visitedStates]);

    // All continental US states
    const allStates = [
        'AL', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY',
        'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY',
        'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA',
        'WV', 'WI', 'WY'
    ];

    if (loading) {
        return <div className="journey-tab loading">Loading journey data...</div>;
    }

    if (error) {
        return (
            <div className="journey-tab error">
                <h3>Error loading journey data</h3>
                <p>{error.toString()}</p>
                <button onClick={() => window.location.reload()}>Retry</button>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div className="journey-tab">
                <div className="journey-header">
                    <h2>The Wandering Whittle Journey</h2>
                    <div className="progress-container">
                        <div className="progress-text">
                            {journeyStats.statesVisited} of 48 states visited
                            <span className="percentage-text">({journeyStats.percentComplete}%)</span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${journeyStats.percentComplete}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                <div className="journey-content">
                    <div className="stats-grid">
                        <StatsCard
                            icon="🛣️"
                            value={`${journeyStats.totalDistance.toLocaleString()} mi`}
                            label="Total Distance"
                        />
                        <StatsCard
                            icon="📅"
                            value={journeyStats.daysOnRoad}
                            label="Days on Road"
                        />
                        <StatsCard
                            icon="🏁"
                            value={journeyStats.statesVisited}
                            label="States Visited"
                            highlighted={true}
                        />
                        <StatsCard
                            icon="⏱️"
                            value={`${journeyStats.milesPerDay.toLocaleString()} mi`}
                            label="Miles per Day"
                        />
                    </div>

                    <div className="journey-details">
                        <div className="states-grid">
                            <h3>States Tracker</h3>
                            <div className="states-container">
                                {allStates.map(state => (
                                    <StateItem
                                        key={state}
                                        state={state}
                                        visited={visitedStates.includes(state)}
                                        current={state === currentState}
                                    />
                                ))}
                            </div>
                        </div>

                        {tripData && tripData.stops && (
                            <JourneyTimeline
                                stops={tripData.stops}
                                currentLocation={vehicleData?.location || {
                                    latitude: vehicleData?.latitude,
                                    longitude: vehicleData?.longitude
                                }}
                            />
                        )}
                    </div>

                    {tripData && tripData.nextStop && (
                        <div className="next-destination">
                            <h3>Next Destination</h3>
                            <div className="destination-card">
                                <div className="destination-icon">🏁</div>
                                <div className="destination-details">
                                    <div className="destination-name">
                                        {tripData.nextStop.city}, {tripData.nextStop.state}
                                    </div>
                                    <div className="destination-eta">
                                        Estimated arrival: {new Date(tripData.nextStop.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="destination-distance">
                                        {tripData.distanceToNext} miles to go
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ErrorBoundary>
    );
};

JourneyTab.propTypes = {
    vehicleData: PropTypes.shape({
        latitude: PropTypes.number,
        longitude: PropTypes.number,
        location: PropTypes.shape({
            latitude: PropTypes.number,
            longitude: PropTypes.number
        })
    })
};

export default JourneyTab;
