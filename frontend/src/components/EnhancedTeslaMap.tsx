// Enhanced map component with real-time Tessie API route data
// Displays actual driven paths, charging stops, and extended stays

import React, { useEffect, useRef, useState } from 'react';
// Dynamic load to reduce initial bundle size
import { loadMapbox } from '@/lib/mapbox-loader';
let mapboxgl: any; // loaded at runtime
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
    let cancelled = false;
    (async () => {
      if (!mapboxgl) {
        mapboxgl = await loadMapbox();
      }
      if (cancelled) return;
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
    })();

    return () => {
      cancelled = true;
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Load journey data on mount
  useEffect(() => {
    if (vehicleId && apiKey) {
      loadJourneyData();
    }
  }, [vehicleId, apiKey, startDate, endDate, loadJourneyData]);

  // Removed locationHistory effect (no real-time location streaming implemented yet)

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
        duration: drive.duration_hours * 60, // minutes
        date: drive.start_time,
        startLocation: drive.start_address,
        endLocation: drive.end_address,
        routeIndex: index
      },
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [drive.start_coordinates.lng, drive.start_coordinates.lat],
          [drive.end_coordinates.lng, drive.end_coordinates.lat]
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
    location: charge.location,
    energyAdded: charge.energy_added_kwh,
        cost: charge.cost,
    duration: (new Date(charge.end_time).getTime() - new Date(charge.start_time).getTime()) / 60000,
    date: charge.start_time,
        batteryStart: charge.start_battery_level,
        batteryEnd: charge.end_battery_level
      },
      geometry: {
        type: 'Point' as const,
    coordinates: [charge.coordinates.lng, charge.coordinates.lat]
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
  // Extended stays visualization removed (no data model yet)

  // Fit map to show all data points
  useEffect(() => {
    if (!isMapLoaded || !map.current) return;
    
    const allCoordinates = [
      ...driveHistory.flatMap(drive => [
        [drive.start_coordinates.lng, drive.start_coordinates.lat],
        [drive.end_coordinates.lng, drive.end_coordinates.lat]
      ]),
      ...chargeHistory.map(charge => [charge.coordinates.lng, charge.coordinates.lat])
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
  }, [isMapLoaded, driveHistory, chargeHistory]);

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
      {/* Future: extended stays / visits */}
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
            {/* Extended stays summary omitted */}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedTeslaMap;
