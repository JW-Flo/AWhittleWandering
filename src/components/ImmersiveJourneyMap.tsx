import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { journeyWaypoints, generateRouteCoordinates, JourneyWaypoint } from '@/data/journeyRoute';
import { Play, Pause, RotateCcw, MapPin, Crosshair, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImmersiveJourneyMapProps {
  mapboxToken: string;
  className?: string;
  showCenterButton?: boolean;
  userLocation?: { lat: number; lng: number } | null;
}

export default function ImmersiveJourneyMap({ 
  mapboxToken, 
  className = '',
  showCenterButton = false,
  userLocation = null
}: ImmersiveJourneyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const animationRef = useRef<number | null>(null);
  const vehicleMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(0);
  const [activeWaypoint, setActiveWaypoint] = useState<JourneyWaypoint | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [-98.5795, 39.8283],
      zoom: 3.5,
      pitch: 30,
      bearing: 0,
      interactive: true,
      renderWorldCopies: false, // Prevents duplicate markers
      fadeDuration: 0, // Reduces wobble during transitions
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      'top-right'
    );

    map.current.on('load', () => {
      setMapLoaded(true);
      addRouteLayer();
      addWaypointMarkers();
    });

    return () => {
      markersRef.current.forEach(m => m.remove());
      vehicleMarkerRef.current?.remove();
      map.current?.remove();
      if (animationRef.current) clearTimeout(animationRef.current);
    };
  }, [mapboxToken]);

  const addRouteLayer = useCallback(() => {
    if (!map.current) return;

    const coordinates = generateRouteCoordinates();

    // Add route source
    map.current.addSource('journey-route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates,
        },
      },
    });

    // Add route glow (background)
    map.current.addLayer({
      id: 'journey-route-glow',
      type: 'line',
      source: 'journey-route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#e65c00',
        'line-width': 8,
        'line-opacity': 0.3,
        'line-blur': 3,
      },
    });

    // Add main route line
    map.current.addLayer({
      id: 'journey-route-line',
      type: 'line',
      source: 'journey-route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#e65c00',
        'line-width': 4,
        'line-opacity': 0.9,
      },
    });
  }, []);

  const addWaypointMarkers = useCallback(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add markers for highlights only (to avoid clutter)
    const highlights = journeyWaypoints.filter(wp => 
      wp.type === 'highlight' || wp.type === 'start' || wp.type === 'stop'
    );

    highlights.forEach((waypoint) => {
      const el = document.createElement('div');
      el.className = 'waypoint-marker';
      
      const isStart = waypoint.type === 'start';
      const isEnd = waypoint.type === 'stop';
      const size = (isStart || isEnd) ? 20 : 14;
      
      el.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background-color: ${isStart ? '#22c55e' : isEnd ? '#ef4444' : '#e65c00'};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        cursor: pointer;
        transition: transform 0.2s ease;
        z-index: 10;
      `;
      
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.3)';
        setActiveWaypoint(waypoint);
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });
      el.addEventListener('click', () => {
        setActiveWaypoint(waypoint);
        map.current?.easeTo({
          center: [waypoint.lng, waypoint.lat],
          zoom: 10,
          duration: 800,
        });
      });

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center',
      })
        .setLngLat([waypoint.lng, waypoint.lat])
        .setPopup(
          new mapboxgl.Popup({ 
            offset: 25, 
            closeButton: false,
            className: 'waypoint-popup'
          }).setHTML(`
            <div style="font-family: system-ui; padding: 8px; max-width: 250px;">
              <strong style="color: #e65c00; font-size: 14px;">${waypoint.name}</strong>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">${waypoint.state} • ${waypoint.date}</div>
              ${waypoint.description ? `<div style="font-size: 12px; color: #444; margin-top: 8px; line-height: 1.4;">${waypoint.description}</div>` : ''}
            </div>
          `)
        )
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Add vehicle marker for animation
    const vehicleEl = document.createElement('div');
    vehicleEl.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#22c55e" stroke="white" stroke-width="2"/>
        <path d="M8 12h8M12 8l4 4-4 4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    vehicleEl.style.cssText = 'z-index: 100; display: none;';
    
    vehicleMarkerRef.current = new mapboxgl.Marker({
      element: vehicleEl,
      anchor: 'center',
    })
      .setLngLat([journeyWaypoints[0].lng, journeyWaypoints[0].lat])
      .addTo(map.current!);
  }, []);

  const flyToWaypoint = useCallback((index: number, smooth = true) => {
    if (!map.current || index >= journeyWaypoints.length) return;

    const waypoint = journeyWaypoints[index];
    setCurrentWaypointIndex(index);
    setActiveWaypoint(waypoint);

    // Show vehicle marker
    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.getElement().style.display = 'block';
      vehicleMarkerRef.current.setLngLat([waypoint.lng, waypoint.lat]);
    }

    // Calculate bearing to next waypoint for smooth camera
    const nextIndex = index + 1;
    let bearing = 0;
    if (nextIndex < journeyWaypoints.length) {
      const next = journeyWaypoints[nextIndex];
      const dLng = next.lng - waypoint.lng;
      const dLat = next.lat - waypoint.lat;
      bearing = Math.atan2(dLng, dLat) * (180 / Math.PI);
    }

    map.current.easeTo({
      center: [waypoint.lng, waypoint.lat],
      zoom: smooth ? 9 : 8,
      pitch: 45,
      bearing: bearing,
      duration: smooth ? 2500 : 1500,
    });
  }, []);

  const startAnimation = useCallback(() => {
    setIsPlaying(true);
    let index = currentWaypointIndex;

    const animate = () => {
      if (index >= journeyWaypoints.length) {
        setIsPlaying(false);
        return;
      }

      flyToWaypoint(index, true);
      index++;

      // Longer pause at special waypoints
      const waypoint = journeyWaypoints[index - 1];
      const pauseTime = waypoint.type === 'highlight' ? 4000 : 2500;

      animationRef.current = window.setTimeout(() => {
        animate();
      }, pauseTime) as unknown as number;
    };

    animate();
  }, [currentWaypointIndex, flyToWaypoint]);

  const pauseAnimation = useCallback(() => {
    setIsPlaying(false);
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
  }, []);

  const skipToNext = useCallback(() => {
    const nextIndex = Math.min(currentWaypointIndex + 1, journeyWaypoints.length - 1);
    flyToWaypoint(nextIndex, false);
  }, [currentWaypointIndex, flyToWaypoint]);

  const resetAnimation = useCallback(() => {
    pauseAnimation();
    setCurrentWaypointIndex(0);
    setActiveWaypoint(null);
    
    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.getElement().style.display = 'none';
    }
    
    if (map.current) {
      map.current.easeTo({
        center: [-98.5795, 39.8283],
        zoom: 3.5,
        pitch: 30,
        bearing: 0,
        duration: 1500,
      });
    }
  }, [pauseAnimation]);

  const centerOnUser = useCallback(() => {
    if (!map.current || !userLocation) return;
    
    map.current.easeTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 12,
      duration: 1000,
    });
  }, [userLocation]);

  if (!mapboxToken) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg ${className}`}>
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden ${className}`}>
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background/60 via-transparent to-transparent" />

      {/* Controls */}
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
        {/* Playback Controls */}
        <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-border">
          {!isPlaying ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full hover:bg-primary/20"
              onClick={startAnimation}
            >
              <Play className="w-4 h-4 text-primary" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full hover:bg-primary/20"
              onClick={pauseAnimation}
            >
              <Pause className="w-4 h-4 text-primary" />
            </Button>
          )}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full hover:bg-muted"
              onClick={skipToNext}
              title="Skip to next"
            >
              <SkipForward className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full hover:bg-muted"
              onClick={resetAnimation}
            >
              <RotateCcw className="w-4 h-4 text-muted-foreground" />
            </Button>
            <span className="text-xs text-muted-foreground ml-2">
              {currentWaypointIndex} / {journeyWaypoints.length} stops
            </span>
          </div>

          {/* Center on Me button */}
          {showCenterButton && userLocation && (
            <Button
              size="sm"
              variant="outline"
              className="bg-background/90 backdrop-blur-sm"
              onClick={centerOnUser}
            >
              <Crosshair className="w-4 h-4 mr-1" />
              Center on Me
            </Button>
          )}

        {/* Active Waypoint Info */}
        {activeWaypoint && (
          <div className="flex-1 max-w-xs bg-background/90 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg border border-border animate-fade-in">
            <div className="flex items-start gap-3">
              <div className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${
                activeWaypoint.type === 'start' ? 'bg-green-500' :
                activeWaypoint.type === 'charging' ? 'bg-yellow-500' :
                'bg-primary'
              }`} />
              <div className="min-w-0">
                <h4 className="font-semibold text-sm text-foreground truncate">
                  {activeWaypoint.name}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {activeWaypoint.state} • {activeWaypoint.date}
                </p>
                {activeWaypoint.description && (
                  <p className="text-xs text-foreground/70 mt-1 line-clamp-1">
                    {activeWaypoint.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-border">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Start</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-muted-foreground">Highlights</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-primary rounded" />
            <span className="text-muted-foreground">Route</span>
          </div>
        </div>
      </div>

      {/* Stats Badge */}
      <div className="absolute top-4 right-16 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-border">
        <div className="flex items-center gap-2 text-xs">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span className="font-medium">48 States</span>
          <span className="text-muted-foreground">•</span>
          <span className="font-medium">15,847 mi</span>
        </div>
      </div>
    </div>
  );
}
