import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { journeyTimeline } from '@/data/journeyData';
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
  }, [mapboxToken, addJourneyRoute]); // Include addJourneyRoute in dependencies

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

  const addJourneyWaypoints = () => {
    if (!map.current) return;

    // Add waypoint markers for each state
    journeyTimeline.forEach((event, index) => {
      if (!event.location) return;

      const el = document.createElement('div');
      el.className = 'journey-waypoint';
      
      const isCompleted = !event.current && index < journeyTimeline.length - 1;
      const isCurrent = event.current;
      
      el.innerHTML = `
        <div class="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          isCurrent 
            ? 'bg-[hsl(var(--adventure-orange))] border-[hsl(var(--adventure-gold))] shadow-[0_0_20px_hsl(var(--adventure-orange)/0.6)] animate-pulse' 
            : isCompleted 
              ? 'bg-[hsl(var(--tesla-blue))] border-[hsl(var(--tesla-cyan))] shadow-[0_0_15px_hsl(var(--tesla-blue)/0.4)]' 
              : 'bg-[hsl(var(--tesla-gray))] border-[hsl(var(--tesla-gray-light))]'
        }">
          ${isCurrent ? '<div class="w-3 h-3 bg-white rounded-full"></div>' : 
            isCompleted ? '<div class="w-2 h-2 bg-white rounded-full"></div>' : 
            '<div class="w-2 h-2 bg-[hsl(var(--muted-foreground))] rounded-full"></div>'}
        </div>
      `;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([event.location.lng, event.location.lat])
        .addTo(map.current!);

      // Calculate correct state number - count unique states up to this index
      const uniqueStatesUpToIndex = journeyTimeline
        .slice(0, index + 1)
        .filter((e, i, arr) => arr.findIndex(state => state.state === e.state) === i)
        .length;
      
      const daysSinceStart = Math.floor((new Date(event.date).getTime() - new Date('2025-01-01').getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const typeEmoji = {
        'milestone': '🏆',
        'scenic': '🏞️', 
        'adventure': '⛰️',
        'cultural': '🏛️'
      }[event.type] || '📍';
      
      const popup = new mapboxgl.Popup({ 
        offset: 25,
        closeButton: true,
        className: 'journey-popup'
      }).setHTML(`
        <div class="bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden min-w-72">
          <div class="bg-gradient-to-r from-blue-500 to-cyan-500 p-3">
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-white text-lg flex items-center gap-2">
                ${typeEmoji} ${event.state}
              </h3>
              <span class="text-xs bg-white/20 text-white px-2 py-1 rounded-full font-medium">
                State #${uniqueStatesUpToIndex}
              </span>
            </div>
          </div>
          
          <div class="p-4">
            <div class="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mb-3">
              <span class="flex items-center gap-1">📅 ${event.date}</span>
              <span class="flex items-center gap-1">🗓️ Day ${daysSinceStart}</span>
            </div>
            
            <div class="mb-3">
              <span class="inline-block capitalize px-3 py-1 rounded-full text-xs font-semibold ${
                event.type === 'milestone' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                event.type === 'scenic' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                event.type === 'adventure' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              }">
                ${event.type}
              </span>
            </div>
            
            <div class="space-y-2">
              ${event.highlights.map(h => `
                <div class="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                  <span class="text-blue-500 mt-1 font-bold">•</span>
                  <span>${h}</span>
                </div>
              `).join('')}
            </div>
            
            ${isCurrent ? `
              <div class="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div class="text-sm font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-2">
                  📍 Current Location 
                  <span class="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                </div>
              </div>
            ` : ''}
            
            ${isCompleted ? `
              <div class="mt-3 text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-2">
                ✓ Conquered
              </div>
            ` : ''}
          </div>
        </div>
      `);

      marker.setPopup(popup);
    });
  };

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