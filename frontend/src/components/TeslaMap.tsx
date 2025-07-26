import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation } from 'lucide-react';

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
}

const TeslaMap = ({ vehicleLocation, mapboxToken, onTokenChange }: TeslaMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const vehicleMarker = useRef<mapboxgl.Marker | null>(null);
  const [tokenInput, setTokenInput] = useState(mapboxToken || '');

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // Initialize map
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      zoom: 10,
      center: vehicleLocation ? [vehicleLocation.longitude, vehicleLocation.latitude] : [-122.4194, 37.7749],
      pitch: 0,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

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

    // Center map on vehicle
    map.current.flyTo({
      center: [vehicleLocation.longitude, vehicleLocation.latitude],
      zoom: 15,
      essential: true
    });
  }, [vehicleLocation]);

  const handleTokenSubmit = () => {
    onTokenChange?.(tokenInput);
  };

  if (!mapboxToken) {
    return (
      <Card className="w-full h-full flex items-center justify-center">
        <CardContent className="max-w-md p-6">
          <CardHeader className="text-center p-0 mb-6">
            <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
            <CardTitle>Setup Map</CardTitle>
            <CardDescription>
              Enter your Mapbox public token to display the interactive map
            </CardDescription>
          </CardHeader>
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="pk.eyJ1IjoieW91cnVzZXJuYW1lIi..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="font-mono text-sm"
            />
            <Button 
              onClick={handleTokenSubmit} 
              className="w-full"
              disabled={!tokenInput.trim()}
            >
              <Navigation className="w-4 h-4 mr-2" />
              Initialize Map
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Get your token at{' '}
              <a 
                href="https://mapbox.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                mapbox.com
              </a>
            </p>
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