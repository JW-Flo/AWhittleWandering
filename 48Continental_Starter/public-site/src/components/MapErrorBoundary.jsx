/**
 * MapErrorBoundary Component
 * 
 * This component provides error handling specifically for map components.
 * It catches errors that occur during map rendering and displays a 
 * user-friendly fallback interface with troubleshooting steps.
 */

/* eslint-env browser */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './MapErrorBoundary.css';

class MapErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorType: 'unknown' // Can be: token, network, coordinates, render, unknown
        };
    }

    // Lifecycle method for catching errors
    static getDerivedStateFromError() {
        // We don't need to use the error parameter
        return { hasError: true };
    }

    // Log error details when they occur
    componentDidCatch(error, errorInfo) {
        // Log the error to console
        console.error('Map Error:', error);
        console.error('Component Stack:', errorInfo.componentStack);

        // Determine error type based on error message
        let errorType = 'unknown';
        const errorMessage = error.message || '';

        if (errorMessage.includes('access token') || errorMessage.includes('token')) {
            errorType = 'token';
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
            errorType = 'network';
        } else if (errorMessage.includes('coordinates') || errorMessage.includes('longitude') || errorMessage.includes('latitude')) {
            errorType = 'coordinates';
        } else if (errorMessage.includes('render') || errorMessage.includes('component')) {
            errorType = 'render';
        }

        // Update state with error information
        this.setState({
            error,
            errorInfo,
            errorType
        });

        // Report error to any error tracking service
        if (this.props.onError) {
            this.props.onError(error, errorInfo, errorType);
        }
    }

    // Provide troubleshooting steps based on error type
    getTroubleshootingSteps() {
        const { errorType } = this.state;

        switch (errorType) {
            case 'token':
                return [
                    'Check if the MapBox access token is valid',
                    'Verify the token is correctly set in your .env file',
                    'Make sure the token has the correct permissions',
                    'Try refreshing the page to reload environment variables'
                ];

            case 'network':
                return [
                    'Check your internet connection',
                    'Verify that MapBox services are accessible from your network',
                    'Check if any network firewall or proxy is blocking map resources',
                    'Try refreshing the page or coming back later'
                ];

            case 'coordinates':
                return [
                    'Verify that coordinate data is in the correct format',
                    'Check if coordinate values are within valid ranges',
                    'Ensure all locations have valid latitude/longitude values',
                    'Check the trip data source for any corrupt location data'
                ];

            case 'render':
                return [
                    'Clear your browser cache and reload',
                    'Try using a different browser',
                    'Check for any JavaScript console errors',
                    'Ensure your device meets the minimum requirements for MapBox'
                ];

            default:
                return [
                    'Refresh the page to try again',
                    'Clear your browser cache',
                    'Try using a different browser',
                    'Check your internet connection'
                ];
        }
    }

    // Allow retry
    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        if (this.props.onRetry) {
            this.props.onRetry();
        }
    }

    // Render either children or fallback UI
    render() {
        const { hasError, error, errorType } = this.state;
        const { fallback, children } = this.props;

        // If there's no error, render children normally
        if (!hasError) {
            return children;
        }

        // If custom fallback is provided, use it
        if (fallback) {
            return typeof fallback === 'function'
                ? fallback(error, this.handleRetry)
                : fallback;
        }

        // Default fallback UI
        return (
            <div className="map-error-boundary">
                <div className="map-error-content">
                    <h3>
                        <span className="map-error-icon">🗺️</span>
                        Map Could Not Be Displayed
                    </h3>

                    <p className="map-error-message">
                        {errorType === 'token' && 'There was a problem with the map access token.'}
                        {errorType === 'network' && 'There was a problem connecting to the map services.'}
                        {errorType === 'coordinates' && 'There was a problem with the location coordinates.'}
                        {errorType === 'render' && 'There was a problem rendering the map.'}
                        {errorType === 'unknown' && 'An unexpected error occurred while loading the map.'}
                    </p>

                    <p className="map-error-details">
                        {error?.message}
                    </p>

                    <div className="map-troubleshooting">
                        <h4>Troubleshooting Steps:</h4>
                        <ul>
                            {this.getTroubleshootingSteps().map((step, index) => (
                                <li key={index}>{step}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="map-error-actions">
                        <button onClick={this.handleRetry} className="retry-button">
                            Try Again
                        </button>

                        <button
                            onClick={() => window.location.reload()}
                            className="reload-button"
                        >
                            Reload Page
                        </button>
                    </div>

                    {this.props.showStaticMap && (
                        <div className="map-static-fallback">
                            <h4>Static Map View</h4>
                            <img
                                src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/-98.5795,39.8283,3.5,0,0/800x500?access_token=${this.props.mapboxToken}`}
                                alt="Static map of the United States"
                                className="static-map-image"
                            />
                            <p className="static-map-caption">
                                Interactive map is unavailable. Showing static view instead.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

MapErrorBoundary.propTypes = {
    children: PropTypes.node.isRequired,
    fallback: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    onError: PropTypes.func,
    onRetry: PropTypes.func,
    showStaticMap: PropTypes.bool,
    mapboxToken: PropTypes.string
};

MapErrorBoundary.defaultProps = {
    showStaticMap: true,
    mapboxToken: 'pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJmNXlwY2IycGdtMnFva2liaTA4enIwIn0.tU9_tLaaxXxhfcVX4WhOeA'
};

export default MapErrorBoundary;
