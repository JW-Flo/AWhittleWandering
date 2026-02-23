import { useEffect, useRef, useState, useCallback } from 'react';
import type mapboxgl from 'mapbox-gl';

// Dynamic mapbox-gl loading to shrink initial bundle. Only loads when token present & component mounted.
let mapboxModulePromise: Promise<typeof mapboxgl> | null = null;
async function getMapbox(): Promise<typeof mapboxgl> {
  if (!mapboxModulePromise) {
    mapboxModulePromise = import('mapbox-gl').then(m => {
      import('mapbox-gl/dist/mapbox-gl.css'); // side-effect CSS load
      return m.default || m;
    });
  }
  return mapboxModulePromise;
}
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
  mapStyle?: string;
  /** If true, hide navigation controls for a cleaner read-only embed */
  readOnly?: boolean;
}

const TeslaMap = ({ vehicleLocation, mapboxToken: propsToken, onTokenChange: _onTokenChange, routeLocations, mapStyle, readOnly }: TeslaMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const vehicleMarker = useRef<mapboxgl.Marker | null>(null);
  const mapboxglRef = useRef<typeof mapboxgl | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(propsToken || null);
  const [isLoadingToken, setIsLoadingToken] = useState(false);

  const hasRouteData = routeLocations && routeLocations.length > 0;
  const hasVehicle = vehicleLocation && (vehicleLocation.latitude !== 0 || vehicleLocation.longitude !== 0);

  // Define map helper functions before they're used in effects
  const addJourneyWaypoints = useCallback(() => {
    if (!map.current || !routeLocations || routeLocations.length === 0) return;

    // Only add start/end markers for each drive (every pair of points), not every single point
    const markerPoints = routeLocations.length <= 20
      ? routeLocations
      : [routeLocations[0], routeLocations[routeLocations.length - 1]];

    markerPoints.forEach((location) => {
      const el = document.createElement('div');
      el.className = 'journey-waypoint';

      el.innerHTML = `
        <div style="width:24px;height:24px;border-radius:50%;border:2px solid hsl(var(--tesla-cyan));background:hsl(var(--tesla-blue));display:flex;align-items:center;justify-content:center;box-shadow:0 0 15px hsla(var(--tesla-blue),0.4);transition:transform 0.3s;">
          <div style="width:8px;height:8px;background:white;border-radius:50%;"></div>
        </div>
      `;

      const mb = mapboxglRef.current;
      if (!mb) return;
      const marker = new mb.Marker(el)
        .setLngLat([location.lng, location.lat])
        .addTo(map.current!);

      const popup = new mb.Popup({
        offset: 25,
        closeButton: true,
        className: 'journey-popup'
      }).setHTML(`
        <div style="background:var(--background,#fff);border-radius:8px;overflow:hidden;min-width:180px;border:1px solid var(--border,#e5e7eb);">
          <div style="background:linear-gradient(135deg,hsl(var(--tesla-blue)),hsl(var(--tesla-cyan)));padding:10px 12px;">
            <span style="color:white;font-weight:500;font-size:13px;">Journey Point</span>
          </div>
          <div style="padding:10px 12px;">
            <div style="font-size:13px;font-weight:500;">${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}</div>
            <div style="font-size:12px;opacity:0.7;margin-top:2px;">${new Date(location.timestamp).toLocaleDateString()}</div>
          </div>
        </div>
      `);

      marker.setPopup(popup);
    });
  }, [routeLocations]);

  const addJourneyRoute = useCallback(() => {
    if (!map.current || !routeLocations || routeLocations.length === 0) return;

    const coordinates = routeLocations.map(loc => [loc.lng, loc.lat]);

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

    // Glow layer (behind)
    map.current.addLayer({
      id: 'journey-route-glow',
      type: 'line',
      source: 'journey-route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#22d3ee',
        'line-width': 8,
        'line-opacity': 0.3,
        'line-blur': 4
      }
    });

    // Main route line
    map.current.addLayer({
      id: 'journey-route',
      type: 'line',
      source: 'journey-route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#3b82f6',
        'line-width': 4,
        'line-opacity': 0.85
      }
    });
  }, [routeLocations]);

  // Fetch Mapbox token from backend on component mount
  useEffect(() => {
    const fetchMapboxToken = async () => {
      if (mapboxToken) return;

      setIsLoadingToken(true);
      try {
        const token = await dynamicConfig.getMapboxToken();
        setMapboxToken(token);
      } catch (error) {
        console.error('Failed to fetch Mapbox token from backend:', error);
      } finally {
        setIsLoadingToken(false);
      }
    };

    fetchMapboxToken();
  }, [mapboxToken]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!mapContainer.current || !mapboxToken) return;
      const mapboxgl = await getMapbox();
      if (cancelled) return;
      mapboxglRef.current = mapboxgl;
      mapboxgl.accessToken = mapboxToken;

      // Determine initial center: prefer vehicle, then last route point, then USA center
      let center: [number, number] = [-98.5795, 39.8283];
      let zoom = 3.5;
      if (vehicleLocation && (vehicleLocation.latitude !== 0 || vehicleLocation.longitude !== 0)) {
        center = [vehicleLocation.longitude, vehicleLocation.latitude];
        zoom = 8;
      } else if (routeLocations && routeLocations.length > 0) {
        const last = routeLocations[routeLocations.length - 1];
        center = [last.lng, last.lat];
        zoom = 6;
      }

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle || 'mapbox://styles/mapbox/dark-v11',
        center,
        zoom,
        pitch: 0,
        interactive: !readOnly || true, // still allow pan/zoom in read-only
      });

      if (!readOnly) {
        map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
      }

      map.current.on('load', () => {
        addJourneyRoute();
        addJourneyWaypoints();

        // Fit bounds to show the entire route
        if (routeLocations && routeLocations.length > 1) {
          const lngs = routeLocations.map(l => l.lng);
          const lats = routeLocations.map(l => l.lat);
          const bounds: [[number, number], [number, number]] = [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)]
          ];
          map.current!.fitBounds(bounds, { padding: 60, maxZoom: 12 });
        }
      });
    })();
    return () => { cancelled = true; if (map.current) map.current.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapboxToken, mapStyle, addJourneyRoute, addJourneyWaypoints]);

  useEffect(() => {
    if (!map.current || !vehicleLocation) return;

    // Remove existing marker
    if (vehicleMarker.current) { vehicleMarker.current.remove(); }

    // Create Tesla vehicle marker with heading indicator
    const el = document.createElement('div');
    el.className = 'tesla-marker';
    const rotation = vehicleLocation.heading ?? 0;
    el.innerHTML = `
      <div style="position:relative;">
        <div style="width:32px;height:32px;background:hsl(var(--primary));border-radius:50%;border:2px solid hsl(var(--background));box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
          <div style="width:12px;height:12px;background:hsl(var(--background));border-radius:50%;"></div>
        </div>
        <div style="position:absolute;top:-4px;left:50%;transform:translateX(-50%) rotate(${rotation}deg);transform-origin:center bottom;width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:8px solid hsl(var(--primary));"></div>
      </div>
    `;

    if (mapboxglRef.current) {
      vehicleMarker.current = new mapboxglRef.current.Marker(el)
          .setLngLat([vehicleLocation.longitude, vehicleLocation.latitude])
          .addTo(map.current);
    }

    // Fit bounds to include vehicle and route, or fly to vehicle if no route
    if (!map.current.getSource('journey-route')) {
      map.current.flyTo({
        center: [vehicleLocation.longitude, vehicleLocation.latitude],
        zoom: 10,
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
            <CardTitle>Mapbox Token Required</CardTitle>
            <CardDescription>
              No Mapbox token found. Set <code className="bg-secondary/60 px-1.5 py-0.5 rounded text-xs font-mono">VITE_MAPBOX_TOKEN</code> in{' '}
              <code className="bg-secondary/60 px-1.5 py-0.5 rounded text-xs font-mono">frontend/.env.local</code>{' '}
              or configure <code className="bg-secondary/60 px-1.5 py-0.5 rounded text-xs font-mono">MAPBOX_API_TOKEN</code> as a Wrangler secret.
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

  // No data overlay — show when token is ready but no route/vehicle data
  if (!hasRouteData && !hasVehicle) {
    return (
      <div className="relative w-full h-full">
        <div ref={mapContainer} className="absolute inset-0 rounded-lg shadow-lg" />
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg">
          <div className="text-center px-6">
            <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No journey data yet</p>
            <p className="text-xs text-muted-foreground mt-1">Route will appear once drive data is imported</p>
          </div>
        </div>
      </div>
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
