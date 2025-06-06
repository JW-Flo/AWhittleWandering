/**
 * SimpleMap Component
 * 
 * A streamlined map component that focuses solely on proper rendering
 * without excessive debug logic or complex error handling.
 */

/* eslint-env browser */
import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import mapboxgl from 'mapbox-gl';
import { ensureMapboxFormat, createMarkerElement, routeToGeoJSON, stopsToGeoJSON } from '../utils/mapUtils';
import './Map.css';
import './MapEnhancements.css';

const SimpleMap = ({
    vehicleData,
    tripData,
    // Keeping unused props in comments to maintain API compatibility
    // weatherData,
    // stationsData,
    fullscreen = false,
    mapLayers = {
        weather: false,
        traffic: false,
        satellite: false,
        chargingStations: false
    },
    mapboxToken
}) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const vehicleMarker = useRef(null);
    const [mapReady, setMapReady] = useState(false);

    // Initialize map on component mount
    useEffect(() => {
        // Clean up previous map instance if it exists
        if (map.current) {
            map.current.remove();
            map.current = null;
            vehicleMarker.current = null;
        }

        // Use token from props or environment variable
        const token = mapboxToken || import.meta.env.VITE_MAPBOX_TOKEN;
        mapboxgl.accessToken = token;

        // Exit if no container ref
        if (!mapContainer.current) return;

        // Initialize the map
        try {
            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/streets-v11',
                center: [-98.5795, 39.8283], // Center of continental US
                zoom: 3.5,
                attributionControl: true
            });

            // Add navigation controls
            map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

            // Set map as ready when loaded
            map.current.on('load', () => {
                setMapReady(true);

                // Initialize layers once map is loaded if data is available
                if (tripData) {
                    renderMapLayers();
                }
            });
        } catch (error) {
            console.error('Map initialization error:', error);
        }

        // Clean up on unmount
        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, []); // Only run once on mount

    // Helper function to render map layers
    const renderMapLayers = () => {
        if (!map.current || !tripData || !mapReady) return;

        // Clear existing layers and sources
        removeExistingLayers();

        // Add route line if route data exists
        if (tripData.route?.length > 1) {
            const routeGeoJSON = routeToGeoJSON(tripData.route);

            if (routeGeoJSON) {
                // Add source and layer for route
                map.current.addSource('route', {
                    type: 'geojson',
                    data: routeGeoJSON
                });

                map.current.addLayer({
                    id: 'route-line',
                    type: 'line',
                    source: 'route',
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    paint: {
                        'line-color': '#0066cc',
                        'line-width': 4,
                        'line-opacity': 0.8
                    }
                });
            }
        }

        // Add stops if stops data exists
        if (tripData.stops?.length > 0) {
            const stopsGeoJSON = stopsToGeoJSON(tripData.stops);

            if (stopsGeoJSON && stopsGeoJSON.features.length > 0) {
                // Add source for stops
                map.current.addSource('stops', {
                    type: 'geojson',
                    data: stopsGeoJSON
                });

                // Add markers for each stop
                stopsGeoJSON.features.forEach(stop => {
                    const markerType = stop.properties.overnight ? 'lodging' :
                        stop.properties.charging ? 'charging-station' : 'waypoint';

                    const el = createMarkerElement(markerType);

                    new mapboxgl.Marker({
                        element: el,
                        anchor: 'bottom'
                    })
                        .setLngLat(stop.geometry.coordinates)
                        .setPopup(
                            new mapboxgl.Popup({
                                offset: 25,
                                closeButton: false,
                                maxWidth: '300px'
                            })
                                .setHTML(`
                  <div class="map-popup">
                    <h4>${stop.properties.name}</h4>
                    <p>${stop.properties.description}</p>
                    <p class="stop-type">Type: ${stop.properties.type.charAt(0).toUpperCase() + stop.properties.type.slice(1)}</p>
                  </div>
                `)
                        )
                        .addTo(map.current);
                });
            }
        }

        // Update the vehicle marker
        updateVehicleMarker();
    };

    // Helper function to remove existing layers and sources
    const removeExistingLayers = () => {
        const layerIds = ['route-line'];
        const sourceIds = ['route', 'stops'];

        // Remove layers first
        layerIds.forEach(id => {
            if (map.current.getLayer(id)) {
                map.current.removeLayer(id);
            }
        });

        // Then remove sources
        sourceIds.forEach(id => {
            if (map.current.getSource(id)) {
                map.current.removeSource(id);
            }
        });

        // Remove any existing markers
        if (vehicleMarker.current) {
            vehicleMarker.current.remove();
            vehicleMarker.current = null;
        }
    };

    // Helper function to update vehicle marker
    const updateVehicleMarker = () => {
        if (!map.current || !vehicleData) return;

        // Get vehicle coordinates in correct format
        const coordinates = ensureMapboxFormat(vehicleData.location || vehicleData);
        if (!coordinates) return;

        // Update or create the vehicle marker
        if (vehicleMarker.current) {
            vehicleMarker.current.setLngLat(coordinates);
        } else {
            const el = createMarkerElement('vehicle');

            vehicleMarker.current = new mapboxgl.Marker({
                element: el,
                anchor: 'center'
            })
                .setLngLat(coordinates)
                .addTo(map.current);
        }
    };

    // Update map when trip data changes
    useEffect(() => {
        if (mapReady) {
            renderMapLayers();
        }
    }, [tripData, mapReady]);

    // Update vehicle marker when vehicle data changes
    useEffect(() => {
        if (mapReady && vehicleData) {
            updateVehicleMarker();
        }
    }, [vehicleData, mapReady]);

    // Update map style based on layer toggles
    useEffect(() => {
        if (!mapReady || !map.current) return;

        // Change the map style if satellite view is toggled
        const newStyle = mapLayers.satellite
            ? 'mapbox://styles/mapbox/satellite-streets-v11'
            : 'mapbox://styles/mapbox/streets-v11';

        // Store current view state
        const currentCenter = map.current.getCenter();
        const currentZoom = map.current.getZoom();

        // Only change style if it's different
        if (map.current.getStyle().name !== newStyle) {
            map.current.setStyle(newStyle);

            // Re-add layers and restore view after style changes
            map.current.once('style.load', () => {
                renderMapLayers();
                map.current.setCenter(currentCenter);
                map.current.setZoom(currentZoom);
            });
        }
    }, [mapLayers.satellite, mapReady]);

    return (
        <div className={`map-container ${fullscreen ? 'fullscreen' : ''}`}>
            <div ref={mapContainer} className="map" />
        </div>
    );
};

SimpleMap.propTypes = {
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

export default SimpleMap;
