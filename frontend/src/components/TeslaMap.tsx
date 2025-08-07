import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { dynamicConfig } from '@/lib/dynamic-config';

interface VehicleLocation {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
}

interface TeslaMapProps {
  vehicleLocation?: VehicleLocation;
  mapboxToken?: string;
  onTokenChange?: (token: string) => void;
  routeLocations?: Array<{lat: number, lng: number, timestamp: string}>;
}

const TeslaMap = ({ vehicleLocation, mapboxToken: propsToken, onTokenChange: _onTokenChange, routeLocations }: TeslaMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const vehicleMarker = useRef<mapboxgl.Marker | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(propsToken || null);
  const [isLoadingToken, setIsLoadingToken] = useState(false);

  // Define map helper functions before they're used in effects
  const addJourneyWaypoints = useCallback(() => {
    if (!map.current || !routeLocations || routeLocations.length === 0) return;

    // Add waypoint markers for actual drive locations from real data
    routeLocations.forEach((location, _index) => {
      const el = document.createElement('div');
      el.className = 'journey-waypoint';
      
      el.innerHTML = `
        <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 hover:scale-110 bg-[hsl(var(--tesla-blue))] border-[hsl(var(--tesla-cyan))] shadow-[0_0_15px_hsl(var(--tesla-blue)/0.4)]">
          <div class="w-2 h-2 bg-white rounded-full"></div>
        </div>
      `;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([location.lng, location.lat])
        .addTo(map.current!);

      const popup = new mapboxgl.Popup({ 
        offset: 25,
        closeButton: true,
        className: 'journey-popup'
      }).setHTML(`
        <div class="bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden min-w-48">
          <div class="bg-gradient-to-r from-blue-500 to-cyan-500 p-3">
            <div class="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-white" />
              <span class="text-white font-medium text-sm">Journey Point</span>
            </div>
          </div>
          <div class="p-3 space-y-1">
            <div class="text-sm font-medium text-gray-900 dark:text-gray-100">Location</div>
            <div class="text-xs text-gray-600 dark:text-gray-400">${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}</div>
            <div class="text-xs text-gray-600 dark:text-gray-400">${new Date(location.timestamp).toLocaleDateString()}</div>
          </div>
        </div>
      `);

      marker.setPopup(popup);
    });
  }, [routeLocations]); // Dependencies for useCallback

  const addJourneyRoute = useCallback(() => {
    if (!map.current || !routeLocations || routeLocations.length === 0) return;

    // Create route line from locations
    const coordinates = routeLocations.map(loc => [loc.lng, loc.lat]);

    // Add route source
    map.current.addSource('journey-route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: coordinates
        }
      }
    });

    // Add route layer
    map.current.addLayer({
      id: 'journey-route',
      type: 'line',
      source: 'journey-route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': 'hsl(var(--tesla-blue))',
        'line-width': 4,
        'line-opacity': 0.8
      }
    });

    // Add animated route layer
    map.current.addLayer({
      id: 'journey-route-glow',
      type: 'line', 
      source: 'journey-route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': 'hsl(var(--tesla-cyan))',
        'line-width': 8,
        'line-opacity': 0.3,
        'line-blur': 4
      }
    });
  }, [routeLocations]); // Dependencies for useCallback

  // Fetch Mapbox token from backend on component mount
  useEffect(() => {
    const fetchMapboxToken = async () => {
      if (mapboxToken) return; // Already have a token
      
      setIsLoadingToken(true);
      try {
        const token = await dynamicConfig.getMapboxToken();
        setMapboxToken(token);
      } catch (error) {
        console.error('Failed to fetch Mapbox token from backend:', error);
        // Fall back to user input if backend fails
      } finally {
        setIsLoadingToken(false);
      }
    };

    fetchMapboxToken();
  }, [mapboxToken]);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // Initialize map
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-98.5795, 39.8283], // Center of continental US
      zoom: 3.5, // Show full continental US
      pitch: 0,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Wait for style to load before adding sources and layers
    map.current.on('load', () => {
      addJourneyWaypoints();
      addJourneyRoute();
    });

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, addJourneyRoute, addJourneyWaypoints]); // Include all dependencies

  useEffect(() => {
    if (!map.current || !vehicleLocation) return;

    // Remove existing marker
    if (vehicleMarker.current) {
      vehicleMarker.current.remove();
    }

    // Create Tesla vehicle marker
    const el = document.createElement('div');
    el.className = 'tesla-marker';
    el.innerHTML = `
      <div class="w-6 h-6 bg-primary rounded-full border-2 border-background shadow-lg flex items-center justify-center">
        <div class="w-2 h-2 bg-background rounded-full"></div>
      </div>
    `;

    // Add new marker
    vehicleMarker.current = new mapboxgl.Marker(el)
      .setLngLat([vehicleLocation.longitude, vehicleLocation.latitude])
      .addTo(map.current);

    // Only center on vehicle if it's the first time or user opts in
    if (!map.current.getSource('journey-route')) {
      map.current.flyTo({
        center: [vehicleLocation.longitude, vehicleLocation.latitude],
        zoom: 15,
        essential: true
      });
    }
  }, [vehicleLocation]);

  if (!mapboxToken) {
    if (isLoadingToken) {
      return (
        <Card className="w-full h-full flex items-center justify-center">
          <CardContent className="max-w-md p-6">
            <CardHeader className="text-center p-0 mb-6">
              <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
              <CardTitle>Loading Map</CardTitle>
              <CardDescription>
                Fetching map configuration from backend...
              </CardDescription>
            </CardHeader>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="w-full h-full flex items-center justify-center">
        <CardContent className="max-w-md p-6">
          <CardHeader className="text-center p-0 mb-6">
            <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
            <CardTitle>Map Configuration Issue</CardTitle>
            <CardDescription>
              Unable to load map configuration from backend. Please try refreshing the page.
            </CardDescription>
          </CardHeader>
          <div className="space-y-4">
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg shadow-lg" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-background/5 rounded-lg" />
    </div>
  );
};

export default TeslaMap;