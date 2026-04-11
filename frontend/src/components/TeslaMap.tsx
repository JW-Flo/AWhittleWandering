import { useEffect, useRef, useState } from 'react';
import type mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Dynamic mapbox-gl module loading (bundle stays lazy; CSS is already injected above)
let mapboxModulePromise: Promise<typeof mapboxgl> | null = null;
async function getMapbox(): Promise<typeof mapboxgl> {
  if (!mapboxModulePromise) {
    mapboxModulePromise = import('mapbox-gl').then(m => m.default || m);
  }
  return mapboxModulePromise;
}
import { Button } from '@/components/ui/button';
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
  // Keep route data in a ref so it never causes map re-initialization
  const routeLocationsRef = useRef(routeLocations);
  routeLocationsRef.current = routeLocations;

  const hasRouteData = routeLocations && routeLocations.length > 0;
  const hasVehicle = vehicleLocation && (vehicleLocation.latitude !== 0 || vehicleLocation.longitude !== 0);

  const addJourneyWaypoints = () => {
    const locs = routeLocationsRef.current;
    if (!map.current || !locs || locs.length === 0) return;

    // Only add start/end markers for each drive (every pair of points), not every single point
    const markerPoints = locs.length <= 20
      ? locs
      : [locs[0], locs[locs.length - 1]];

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
  };

  const addJourneyRoute = () => {
    const locs = routeLocationsRef.current;
    if (!map.current || !locs || locs.length === 0) return;

    const coordinates = locs.map(loc => [loc.lng, loc.lat]);

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
  };

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
  }, []); // Only run on mount — token won't change

  // Initialize map only when token + container are ready. Never recreate for route data changes.
  useEffect(() => {
    if (!mapboxToken || !mapContainer.current) return;
    if (map.current) return; // Map already initialized — don't recreate

    let cancelled = false;
    (async () => {
      const mapboxgl = await getMapbox();
      if (cancelled || !mapContainer.current) return;
      mapboxglRef.current = mapboxgl;
      mapboxgl.accessToken = mapboxToken;

      const locs = routeLocationsRef.current;

      // Determine initial center: prefer vehicle, then last route point, then USA center
      let center: [number, number] = [-98.5795, 39.8283];
      let zoom = 3.5;
      if (vehicleLocation && (vehicleLocation.latitude !== 0 || vehicleLocation.longitude !== 0)) {
        center = [vehicleLocation.longitude, vehicleLocation.latitude];
        zoom = 8;
      } else if (locs && locs.length > 0) {
        const last = locs[locs.length - 1];
        center = [last.lng, last.lat];
        zoom = 6;
      }

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle || 'mapbox://styles/mapbox/dark-v11',
        center,
        zoom,
        pitch: 0,
        interactive: true,
      });

      if (!readOnly) {
        map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
      }

      map.current.on('load', () => {
        if (cancelled) return;
        addJourneyRoute();
        addJourneyWaypoints();

        // Fit bounds to show the entire route
        const currentLocs = routeLocationsRef.current;
        if (currentLocs && currentLocs.length > 1) {
          const lngs = currentLocs.map(l => l.lng);
          const lats = currentLocs.map(l => l.lat);
          const bounds: [[number, number], [number, number]] = [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)]
          ];
          map.current!.fitBounds(bounds, { padding: 60, maxZoom: 12 });
        }
      });
    })();
    return () => {
      cancelled = true;
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
    // Only depends on token + style — NOT on route data or callbacks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapboxToken, mapStyle]);

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


  // Always render the map container so the ref persists across route-data state changes.
  // Show overlays conditionally on top instead of early-returning different JSX.
  return (
    <div className="relative w-full h-full">
      {/* Persistent map container — MUST be the same DOM node throughout the component lifecycle */}
      <div ref={mapContainer} className="absolute inset-0 rounded-lg shadow-lg" />

      {/* Loading token overlay */}
      {isLoadingToken && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg z-10">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-primary mx-auto mb-2 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading map…</p>
          </div>
        </div>
      )}

      {/* No token overlay */}
      {!isLoadingToken && !mapboxToken && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg z-10">
          <div className="text-center px-6">
            <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">Mapbox Token Required</p>
            <p className="text-xs text-muted-foreground mt-1">Configure MAPBOX_API_TOKEN as a Wrangler secret.</p>
          </div>
        </div>
      )}

      {/* No data overlay */}
      {mapboxToken && !hasRouteData && !hasVehicle && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg z-10">
          <div className="text-center px-6">
            <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No journey data yet</p>
            <p className="text-xs text-muted-foreground mt-1">Route will appear once drive data is imported</p>
          </div>
        </div>
      )}

      {/* Route gradient overlay */}
      {(hasRouteData || hasVehicle) && (
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-background/5 rounded-lg z-[1]" />
      )}
    </div>
  );
};

export default TeslaMap;
