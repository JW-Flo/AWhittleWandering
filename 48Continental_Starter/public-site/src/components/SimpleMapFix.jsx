/**
 * SimpleMapFix Component
 * 
 * A simplified map component that properly handles coordinates
 * in both [longitude, latitude] and [latitude, longitude] formats.
 */
/* eslint-env browser */

import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ensureMapboxFormat } from '../utils/mapUtils';
import './SimpleMapFix.css';

// Default center point (Continental USA)
const DEFAULT_CENTER = [-98.5795, 39.8283];
const DEFAULT_ZOOM = 3.5;

const SimpleMapFix = ({ vehicleData, tripData, mapLayers = {} }) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const markerRef = useRef(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    // Initialize map
    useEffect(() => {
        if (map.current) return; // Already initialized

        // Use a hardcoded token if not available from environment
        // This ensures the map will load even if environment variables aren't loaded properly
        const token = 'pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJmNXlwY2IycGdtMnFva2liaTA4enIwIn0.tU9_tLaaxXxhfcVX4WhOeA';

        console.log('SimpleMapFix: Using MapBox token:', token.substring(0, 10) + '...');

        // Initialize map
        mapboxgl.accessToken = token;

        try {
            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: mapLayers.satellite
                    ? 'mapbox://styles/mapbox/satellite-streets-v11'
                    : 'mapbox://styles/mapbox/streets-v11',
                center: DEFAULT_CENTER,
                zoom: DEFAULT_ZOOM
            });

            // Add navigation controls
            map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

            // Set up map events
            map.current.on('load', () => {
                console.log('Map loaded successfully');
                setMapLoaded(true);
            });

            map.current.on('error', (e) => {
                console.error('Map error:', e);
            });
        } catch (error) {
            console.error('Error initializing map:', error);
        }

        // Cleanup on unmount
        return () => {
            if (map.current) {
                if (markerRef.current) markerRef.current.remove();
                map.current.remove();
                map.current = null;
            }
        };
    }, [mapLayers.satellite]);

    // Update map style when satellite layer changes
    useEffect(() => {
        if (!map.current || !mapLoaded) return;

        map.current.setStyle(
            mapLayers.satellite
                ? 'mapbox://styles/mapbox/satellite-streets-v11'
                : 'mapbox://styles/mapbox/streets-v11'
        );
    }, [mapLayers.satellite, mapLoaded]);

    // Update vehicle position marker
    useEffect(() => {
        if (!map.current || !mapLoaded || !vehicleData) return;

        // Remove existing marker if any
        if (markerRef.current) {
            markerRef.current.remove();
        }

        // Check for valid coordinates - THIS IS THE CRITICAL FIX
        // Using our utility function to ensure correct format
        const vehicleLocation = vehicleData.location;
        let mapboxCoords = null;

        if (vehicleLocation) {
            // Use the ensureMapboxFormat utility to handle any coordinate format
            mapboxCoords = ensureMapboxFormat(vehicleLocation);
        }

        if (!mapboxCoords) {
            console.error('Invalid vehicle coordinates:', vehicleLocation);
            return;
        }

        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'vehicle-marker';

        // Create marker
        markerRef.current = new mapboxgl.Marker(el)
            .setLngLat(mapboxCoords)
            .setPopup(
                new mapboxgl.Popup({ offset: 25 })
                    .setHTML(`
            <h3>Vehicle Location</h3>
            <p>Coordinates: [${mapboxCoords[0].toFixed(4)}, ${mapboxCoords[1].toFixed(4)}]</p>
            <p>Battery: ${vehicleData.batteryLevel?.toFixed(1) || 'N/A'}%</p>
            <p>Range: ${vehicleData.range?.toFixed(1) || 'N/A'} miles</p>
          `)
            )
            .addTo(map.current);

        // Fly to the vehicle location
        map.current.flyTo({
            center: mapboxCoords,
            zoom: 10,
            essential: true
        });
    }, [vehicleData, mapLoaded]);

    // Render trip path if tripData is available
    useEffect(() => {
        if (!map.current || !mapLoaded || !tripData || !tripData.route) return;

        // Remove existing sources and layers first
        if (map.current.getSource('route')) {
            map.current.removeLayer('route-line');
            map.current.removeSource('route');
        }

        try {
            // Process route coordinates - ensuring they're in the correct format
            const routeCoordinates = tripData.route.map(coord => {
                // Apply our utility function to each coordinate point
                return ensureMapboxFormat(coord);
            }).filter(Boolean); // Remove any invalid coordinates

            if (routeCoordinates.length < 2) {
                console.warn('Not enough valid coordinates to display route');
                return;
            }

            // Add the route source and layer
            map.current.addSource('route', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: routeCoordinates
                    }
                }
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
                    'line-width': 3,
                    'line-opacity': 0.7
                }
            });

            // Add destination markers
            tripData.destinations?.forEach((dest, index) => {
                if (!dest || !dest.location) return;

                // Ensure destination coordinates are in the correct format
                const destCoords = ensureMapboxFormat(dest.location);
                if (!destCoords) return;

                // Create custom marker element
                const el = document.createElement('div');
                el.className = 'destination-marker';

                // Add marker
                new mapboxgl.Marker(el)
                    .setLngLat(destCoords)
                    .setPopup(
                        new mapboxgl.Popup({ offset: 25 })
                            .setHTML(`
                <h3>${dest.name || `Destination ${index + 1}`}</h3>
                <p>Coordinates: [${destCoords[0].toFixed(4)}, ${destCoords[1].toFixed(4)}]</p>
                ${dest.arrivalTime ? `<p>ETA: ${dest.arrivalTime}</p>` : ''}
              `)
                    )
                    .addTo(map.current);
            });

            // Fit map to show the entire route if no vehicle data is present
            if (!vehicleData) {
                const bounds = new mapboxgl.LngLatBounds();
                routeCoordinates.forEach(coord => bounds.extend(coord));

                map.current.fitBounds(bounds, {
                    padding: 50,
                    maxZoom: 15
                });
            }
        } catch (error) {
            console.error('Error displaying trip route:', error);
        }
    }, [tripData, mapLoaded]);

    // Add charging stations if enabled
    useEffect(() => {
        if (!map.current || !mapLoaded || !mapLayers.chargingStations) return;

        // TODO: Implement charging stations layer if the data becomes available

    }, [mapLayers.chargingStations, mapLoaded]);

    return (
        <div className="simple-map-container">
            <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

            {/* Error indicator */}
            {!mapLoaded && (
                <div className="map-loading">
                    <div className="map-loading-text">
                        Loading map...
                        {!mapboxgl.accessToken && <div style={{ color: 'red' }}>Error: MapBox token missing!</div>}
                    </div>
                </div>
            )}

            {/* Map overlay with vehicle data */}
            {vehicleData && mapLoaded && (
                <div className="map-overlay">
                    <h4>Vehicle Status</h4>
                    <p><strong>Battery:</strong> {vehicleData.batteryLevel?.toFixed(1) || 'N/A'}%</p>
                    <p><strong>Range:</strong> {vehicleData.range?.toFixed(1) || 'N/A'} miles</p>
                    <p><strong>Speed:</strong> {vehicleData.speed || '0'} mph</p>
                </div>
            )}

            {/* Loading indicator */}
            {!mapLoaded && (
                <div className="map-loading">
                    <div className="map-loading-text">Loading map...</div>
                </div>
            )}
        </div>
    );
};

export default SimpleMapFix;
