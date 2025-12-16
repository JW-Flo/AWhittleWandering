import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapPoint {
  lat: number;
  lng: number;
  timestamp?: string;
  battery?: number;
  speed?: number;
}

interface JourneyMapProps {
  points?: MapPoint[];
  chargingStops?: { lat: number; lng: number; name?: string }[];
  interactive?: boolean;
  className?: string;
  mapboxToken: string;
}

export default function JourneyMap({ 
  points = [], 
  chargingStops = [],
  interactive = true,
  className = '',
  mapboxToken
}: JourneyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [-98.5795, 39.8283], // Center of US
      zoom: 3.5,
      pitch: 0,
      interactive,
    });

    if (interactive) {
      map.current.addControl(
        new mapboxgl.NavigationControl({ visualizePitch: true }),
        'top-right'
      );
    }

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, interactive]);

  useEffect(() => {
    if (!map.current || !mapLoaded || points.length === 0) return;

    // Create route line
    const routeCoordinates = points.map(p => [p.lng, p.lat]);

    if (map.current.getSource('route')) {
      (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: routeCoordinates,
        },
      });
    } else {
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: routeCoordinates,
          },
        },
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#e65c00',
          'line-width': 4,
          'line-opacity': 0.8,
        },
      });
    }

    // Fit bounds to route
    if (routeCoordinates.length > 1) {
      const bounds = routeCoordinates.reduce(
        (bounds, coord) => bounds.extend(coord as [number, number]),
        new mapboxgl.LngLatBounds(
          routeCoordinates[0] as [number, number],
          routeCoordinates[0] as [number, number]
        )
      );
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [points, mapLoaded]);

  useEffect(() => {
    if (!map.current || !mapLoaded || chargingStops.length === 0) return;

    // Add charging markers
    chargingStops.forEach((stop, index) => {
      const el = document.createElement('div');
      el.className = 'charging-marker';
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.backgroundColor = '#22c55e';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';

      new mapboxgl.Marker(el)
        .setLngLat([stop.lng, stop.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div class="font-body"><strong>${stop.name || `Charging Stop ${index + 1}`}</strong></div>`
          )
        )
        .addTo(map.current!);
    });
  }, [chargingStops, mapLoaded]);

  if (!mapboxToken) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg ${className}`}>
        <p className="text-muted-foreground">Mapbox token required</p>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
}
