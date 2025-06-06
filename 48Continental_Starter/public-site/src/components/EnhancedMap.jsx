/**
 * EnhancedMap Component
 * 
 * A wrapper component that adds robust error handling to the Map component
 * using MapErrorBoundary. This provides graceful fallbacks for various error 
 * conditions that can occur during map rendering.
 */

/* eslint-env browser */
import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import Map from './Map';
import MapErrorBoundary from './MapErrorBoundary';
import './EnhancedMap.css';

const EnhancedMap = (props) => {
    const [errorCount, setErrorCount] = useState(0);
    const [lastError, setLastError] = useState(null);

    // Handler for MapErrorBoundary errors
    const handleMapError = useCallback((error, errorInfo, errorType) => {
        setErrorCount(prev => prev + 1);
        setLastError({ error, errorInfo, errorType, time: new Date().toISOString() });

        // Log errors to console with additional context
        console.error('Map Error Details:', {
            error: error?.message,
            stack: error?.stack,
            errorInfo,
            errorType,
            errorCount: errorCount + 1,
            props: {
                hasTripData: !!props.tripData,
                hasVehicleData: !!props.vehicleData,
                mapLayers: props.mapLayers
            }
        });

        // You could also send this to an error tracking service
    }, [errorCount, props]);

    // Handler for retrying after an error
    const handleRetry = useCallback(() => {
        console.log('Retrying map render after error');

        // Reset error counts only after 3+ errors to prevent infinite loops
        if (errorCount > 3) {
            setErrorCount(1); // Don't fully reset to prevent cascading failures
        }

        // Additional cleanup logic could be added here
    }, [errorCount]);

    // Extract mapbox token from props or use default
    const mapboxToken = props.mapboxToken ||
        (window.ENV && window.ENV.MAPBOX_TOKEN) ||
        'pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJmNXlwY2IycGdtMnFva2liaTA4enIwIn0.tU9_tLaaxXxhfcVX4WhOeA';

    return (
        <div className="enhanced-map-container">
            <MapErrorBoundary
                onError={handleMapError}
                onRetry={handleRetry}
                mapboxToken={mapboxToken}
                showStaticMap={true}
            >
                <Map {...props} />
            </MapErrorBoundary>

            {/* Add a subtle error indicator for debugging */}
            {lastError && (
                <div className="map-error-indicator" title={`Last error: ${lastError.error?.message}`}>
                    <span className="error-count">{errorCount}</span>
                </div>
            )}
        </div>
    );
};

EnhancedMap.propTypes = {
    vehicleData: PropTypes.object,
    tripData: PropTypes.object,
    weatherData: PropTypes.object,
    stationsData: PropTypes.object,
    fullscreen: PropTypes.bool,
    mapLayers: PropTypes.shape({
        weather: PropTypes.bool,
        traffic: PropTypes.bool,
        satellite: PropTypes.bool,
        chargingStations: PropTypes.bool
    }),
    mapboxToken: PropTypes.string
};

export default EnhancedMap;
