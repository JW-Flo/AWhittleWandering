/**
 * SimpleMapTestPage
 * 
 * A minimal test page that renders the simplified map component
 * with real trip data but without complex error handling.
 */

import React, { useState, useEffect } from 'react';
import SimpleMap from '../components/SimpleMap';
import { useTripData } from '../hooks/useTripData';
import './TestPage.css';

const SimpleMapTestPage = () => {
    const { tripData, loading, error } = useTripData();
    const [mapLayers, setMapLayers] = useState({
        satellite: false,
        weather: false,
        traffic: false,
        chargingStations: false
    });

    // Example vehicle data (normally this would come from an API)
    const [vehicleData, setVehicleData] = useState(null);

    // Initialize vehicle data based on first stop of the trip
    useEffect(() => {
        if (tripData && tripData.stops && tripData.stops.length > 0) {
            // Use the first stop as the current vehicle location
            const firstStop = tripData.stops[0];
            setVehicleData({
                location: firstStop,
                batteryLevel: 85,
                range: 320,
                speed: 0,
                heading: 0
            });
        }
    }, [tripData]);

    // Toggle map layers
    const toggleLayer = (layer) => {
        setMapLayers(prev => ({
            ...prev,
            [layer]: !prev[layer]
        }));
    };

    return (
        <div className="test-page">
            <header className="test-header">
                <h1>Simple Map Test</h1>
                <div className="layer-toggles">
                    <button
                        className={mapLayers.satellite ? 'active' : ''}
                        onClick={() => toggleLayer('satellite')}
                    >
                        Satellite
                    </button>
                </div>
            </header>

            <main className="test-content">
                {loading && <p className="loading">Loading trip data...</p>}

                {error && (
                    <div className="error-message">
                        <h3>Error Loading Data</h3>
                        <p>{error}</p>
                    </div>
                )}

                {!loading && !error && tripData && vehicleData && (
                    <div className="map-container-wrapper">
                        <SimpleMap
                            tripData={tripData}
                            vehicleData={vehicleData}
                            mapLayers={mapLayers}
                            mapboxToken="pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJmNXlwY2IycGdtMnFva2liaTA4enIwIn0.tU9_tLaaxXxhfcVX4WhOeA"
                        />
                    </div>
                )}
            </main>

            <footer className="test-footer">
                <p>
                    Using simplified map component with direct token handling and
                    streamlined coordinate processing.
                </p>
            </footer>
        </div>
    );
};

export default SimpleMapTestPage;
