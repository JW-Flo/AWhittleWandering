// Enhanced map component with real-time Tessie API route data
// Displays actual driven paths, charging stops, and extended stays

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useUnifiedTessieApi } from '@/hooks/useUnifiedTessieApi';

interface EnhancedTeslaMapProps {
  vehicleId: string;
  apiKey: string;
  mapboxToken: string;
  startDate?: string;
  endDate?: string;
  onLocationData?: (locations: Array<{lat: number, lng: number, timestamp: string}>) => void;
}

const EnhancedTeslaMap: React.FC<EnhancedTeslaMapProps> = ({
  vehicleId,
  apiKey,
  mapboxToken,
  startDate = '2025-06-03',
  endDate = '2025-07-26',
  onLocationData
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  
  const {
    historicalDrives: driveHistory,
    historicalCharges: chargeHistory,
    isLoading,
    error,
    refreshHistoricalData: loadJourneyData,
  } = useUnifiedTessieApi(apiKey);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-98.5795, 39.8283], // Center of USA
      zoom: 4,
      projection: 'mercator' as any,
      pitch: 0,
      bearing: 0,
      maxPitch: 0,
    });

    map.current.addControl(new mapboxgl.NavigationControl({
      visualizePitch: false,
      showCompass: false
    }), 'top-right');

    map.current.on('load', () => {
      setIsMapLoaded(true);
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Load journey data on mount
  useEffect(() => {
    if (vehicleId && apiKey) {
      loadJourneyData();
    }
  }, [vehicleId, apiKey, startDate, endDate, loadJourneyData]);

  // Update parent with location data
  useEffect(() => {
    if (locationHistory.length > 0 && onLocationData) {
      onLocationData(locationHistory);
    }
  }, [onLocationData]); // locationHistory removed - it's mutated, not a dependency

  // Add drive routes to map
  useEffect(() => {
    if (!isMapLoaded || !map.current || driveHistory.length === 0) return;

    // Remove existing route layers
    if (map.current.getLayer('drive-routes')) {
      map.current.removeLayer('drive-routes');
    }
    if (map.current.getSource('drive-routes')) {
      map.current.removeSource('drive-routes');
    }

    // Create route lines from drive history
    const routeFeatures = driveHistory.map((drive, index) => ({
      type: 'Feature' as const,
      properties: {
        id: drive.id,
        distance: drive.distance_miles,
        duration: drive.duration_minutes,
        date: drive.start_date,
        startLocation: drive.start_location_name,
        endLocation: drive.end_location_name,
        routeIndex: index
      },
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [drive.start_longitude, drive.start_latitude],
          [drive.end_longitude, drive.end_latitude]
        ]
      }
    }));

    map.current.addSource('drive-routes', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: routeFeatures
      }
    });

    map.current.addLayer({
      id: 'drive-routes',
      type: 'line',
      source: 'drive-routes',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#FF6B35', // Adventure orange
        'line-width': 3,
        'line-opacity': 0.8
      }
    });

    // Add route popup on click
    map.current.on('click', 'drive-routes', (e) => {
      if (!e.features?.[0]) return;

      const feature = e.features[0];
      const props = feature.properties;
      
      new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`
          <div class="p-3">
            <h3 class="font-bold text-sm mb-2">🚗 Drive Segment</h3>
            <p class="text-xs mb-1"><strong>From:</strong> ${props?.startLocation}</p>
            <p class="text-xs mb-1"><strong>To:</strong> ${props?.endLocation}</p>
            <p class="text-xs mb-1"><strong>Distance:</strong> ${props?.distance?.toFixed(1)} miles</p>
            <p class="text-xs mb-1"><strong>Duration:</strong> ${Math.floor((props?.duration || 0) / 60)}h ${(props?.duration || 0) % 60}m</p>
            <p class="text-xs"><strong>Date:</strong> ${new Date(props?.date).toLocaleDateString()}</p>
          </div>
        `)
        .addTo(map.current!);
    });

    // Change cursor on hover
    map.current.on('mouseenter', 'drive-routes', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });

    map.current.on('mouseleave', 'drive-routes', () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
    });

  }, [isMapLoaded, driveHistory]);

  // Add charging stations to map
  useEffect(() => {
    if (!isMapLoaded || !map.current || chargeHistory.length === 0) return;

    // Remove existing charge layers
    if (map.current.getLayer('charge-stations')) {
      map.current.removeLayer('charge-stations');
    }
    if (map.current.getSource('charge-stations')) {
      map.current.removeSource('charge-stations');
    }

    // Create charging station points
    const chargeFeatures = chargeHistory.map(charge => ({
      type: 'Feature' as const,
      properties: {
        id: charge.id,
        location: charge.location_name,
        city: charge.city,
        state: charge.state,
        energyAdded: charge.energy_added,
        cost: charge.cost,
        duration: charge.duration_minutes,
        date: charge.start_date,
        batteryStart: charge.start_battery_level,
        batteryEnd: charge.end_battery_level
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [charge.longitude, charge.latitude]
      }
    }));

    map.current.addSource('charge-stations', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: chargeFeatures
      }
    });

    map.current.addLayer({
      id: 'charge-stations',
      type: 'circle',
      source: 'charge-stations',
      paint: {
        'circle-radius': 8,
        'circle-color': '#00D4AA', // Tesla cyan
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.9
      }
    });

    // Add charging station popup on click
    map.current.on('click', 'charge-stations', (e) => {
      if (!e.features?.[0]) return;

      const feature = e.features[0];
      const props = feature.properties;
      
      new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`
          <div class="p-3">
            <h3 class="font-bold text-sm mb-2">⚡ Charging Station</h3>
            <p class="text-xs mb-1"><strong>Location:</strong> ${props?.location}</p>
            ${props?.city && props?.state ? `<p class="text-xs mb-1"><strong>City:</strong> ${props.city}, ${props.state}</p>` : ''}
            <p class="text-xs mb-1"><strong>Energy Added:</strong> ${props?.energyAdded?.toFixed(1)} kWh</p>
            <p class="text-xs mb-1"><strong>Cost:</strong> $${props?.cost?.toFixed(2)}</p>
            <p class="text-xs mb-1"><strong>Duration:</strong> ${Math.floor((props?.duration || 0) / 60)}h ${(props?.duration || 0) % 60}m</p>
            <p class="text-xs mb-1"><strong>Battery:</strong> ${props?.batteryStart}% → ${props?.batteryEnd}%</p>
            <p class="text-xs"><strong>Date:</strong> ${new Date(props?.date).toLocaleDateString()}</p>
          </div>
        `)
        .addTo(map.current!);
    });

    // Change cursor on hover
    map.current.on('mouseenter', 'charge-stations', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });

    map.current.on('mouseleave', 'charge-stations', () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
    });

  }, [isMapLoaded, chargeHistory]);

  // Add extended stays to map
  useEffect(() => {
    if (!isMapLoaded || !map.current || extendedStays.length === 0) return;

    // Remove existing stay layers
    if (map.current.getLayer('extended-stays')) {
      map.current.removeLayer('extended-stays');
    }
    if (map.current.getSource('extended-stays')) {
      map.current.removeSource('extended-stays');
    }

    // Create extended stay points
    const stayFeatures = extendedStays.map(stay => ({
      type: 'Feature' as const,
      properties: {
        id: stay.id,
        location: stay.location,
        city: stay.city,
        state: stay.state,
        duration: stay.durationHours,
        days: stay.durationDays,
        reason: stay.reason,
        startDate: stay.startDate,
        endDate: stay.endDate,
        chargingSessions: stay.chargingSessions?.length || 0
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [stay.coordinates.lng, stay.coordinates.lat]
      }
    }));

    map.current.addSource('extended-stays', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: stayFeatures
      }
    });

    map.current.addLayer({
      id: 'extended-stays',
      type: 'circle',
      source: 'extended-stays',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'days'],
          1, 6,
          7, 12
        ],
        'circle-color': [
          'case',
          ['==', ['get', 'reason'], 'multi_day_stay'], '#8B5CF6', // Purple
          ['==', ['get', 'reason'], 'extended_visit'], '#3B82F6', // Blue
          ['==', ['get', 'reason'], 'charging'], '#F59E0B', // Yellow
          '#6B7280' // Gray default
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.8
      }
    });

    // Add extended stay popup on click
    map.current.on('click', 'extended-stays', (e) => {
      if (!e.features?.[0]) return;

      const feature = e.features[0];
      const props = feature.properties;
      
      const reasonEmoji = {
        'multi_day_stay': '🏨',
        'extended_visit': '🏛️',
        'charging': '⚡',
        'overnight': '🌙'
      }[props?.reason as string] || '📍';
      
      new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`
          <div class="p-3">
            <h3 class="font-bold text-sm mb-2">${reasonEmoji} Extended Stay</h3>
            <p class="text-xs mb-1"><strong>Location:</strong> ${props?.location}</p>
            <p class="text-xs mb-1"><strong>City:</strong> ${props?.city}, ${props?.state}</p>
            <p class="text-xs mb-1"><strong>Duration:</strong> ${props?.days?.toFixed(1)} days (${props?.duration?.toFixed(1)} hours)</p>
            <p class="text-xs mb-1"><strong>Reason:</strong> ${props?.reason?.replace('_', ' ')}</p>
            <p class="text-xs mb-1"><strong>Start:</strong> ${new Date(props?.startDate).toLocaleDateString()}</p>
            <p class="text-xs mb-1"><strong>End:</strong> ${new Date(props?.endDate).toLocaleDateString()}</p>
            ${props?.chargingSessions > 0 ? `<p class="text-xs"><strong>Charging Sessions:</strong> ${props.chargingSessions}</p>` : ''}
          </div>
        `)
        .addTo(map.current!);
    });

    // Change cursor on hover
    map.current.on('mouseenter', 'extended-stays', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });

    map.current.on('mouseleave', 'extended-stays', () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
    });

  }, [isMapLoaded, extendedStays]);

  // Fit map to show all data points
  useEffect(() => {
    if (!isMapLoaded || !map.current) return;
    
    const allCoordinates = [
      ...driveHistory.flatMap(drive => [
        [drive.start_longitude, drive.start_latitude],
        [drive.end_longitude, drive.end_latitude]
      ]),
      ...chargeHistory.map(charge => [charge.longitude, charge.latitude]),
      ...extendedStays.map(stay => [stay.coordinates.lng, stay.coordinates.lat])
    ];

    if (allCoordinates.length > 0) {
      const bounds = allCoordinates.reduce((bounds, coord) => {
        return bounds.extend(coord as [number, number]);
      }, new mapboxgl.LngLatBounds());

      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 10
      });
    }
  }, [isMapLoaded, driveHistory, chargeHistory, extendedStays]);

  if (error) {
    return (
      <div className="h-96 w-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="text-red-500 text-2xl mb-2">⚠️</div>
          <p className="text-gray-600">Error loading map data</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapContainer} className="h-96 w-full rounded-lg overflow-hidden" />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
          <div className="flex items-center space-x-2 text-white">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            <span>Loading journey data...</span>
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-lg text-xs">
        <h4 className="font-bold mb-2">Legend</h4>
        <div className="space-y-1">
          <div className="flex items-center">
            <div className="w-4 h-0.5 bg-orange-500 mr-2"></div>
            <span>Drive Routes</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-teal-500 rounded-full mr-2"></div>
            <span>Charging Stations</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
            <span>Multi-day Stays</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span>Extended Visits</span>
          </div>
        </div>
      </div>

      {/* Data Summary */}
      {(driveHistory.length > 0 || chargeHistory.length > 0) && (
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-lg text-xs">
          <h4 className="font-bold mb-2">Journey Data</h4>
          <div className="space-y-1">
            {driveHistory.length > 0 && (
              <div>🚗 {driveHistory.length} drives</div>
            )}
            {chargeHistory.length > 0 && (
              <div>⚡ {chargeHistory.length} charges</div>
            )}
            {extendedStays.length > 0 && (
              <div>🏨 {extendedStays.length} extended stays</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedTeslaMap;
