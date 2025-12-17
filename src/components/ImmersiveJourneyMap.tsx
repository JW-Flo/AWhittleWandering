import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Play, Pause, RotateCcw, MapPin, Crosshair, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFlagshipWaypoints, FlagshipWaypoint } from '@/hooks/useFlagshipWaypoints';

interface ImmersiveJourneyMapProps {
  mapboxToken: string;
  className?: string;
  showCenterButton?: boolean;
  userLocation?: { lat: number; lng: number } | null;
}

const ImmersiveJourneyMap: React.FC<ImmersiveJourneyMapProps> = ({
  mapboxToken,
  className = '',
  showCenterButton = false,
  userLocation = null
}) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const animationRef = useRef<number | null>(null);
    const vehicleMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentWaypointIndex, setCurrentWaypointIndex] = useState(0);
    const [activeWaypoint, setActiveWaypoint] = useState<FlagshipWaypoint | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  // Fetch waypoints from database
  const { data: waypoints = [], isLoading } = useFlagshipWaypoints();

  // Generate route coordinates from waypoints
  const routeCoordinates = useMemo(() => {
    return waypoints.map(wp => [wp.longitude, wp.latitude] as [number, number]);
  }, [waypoints]);

  // Initialize map
  useEffect(() => {
    console.log('[ImmersiveJourneyMap] Init effect - mapContainer:', !!mapContainer.current, 'mapboxToken:', !!mapboxToken, 'token length:', mapboxToken?.length);
    
    if (!mapContainer.current) {
      console.warn('[ImmersiveJourneyMap] No map container ref');
      return;
    }
    
    if (!mapboxToken) {
      console.warn('[ImmersiveJourneyMap] No mapbox token');
      return;
    }

    // Check container dimensions
    const rect = mapContainer.current.getBoundingClientRect();
    console.log('[ImmersiveJourneyMap] Container dimensions:', rect.width, 'x', rect.height);

    try {
      mapboxgl.accessToken = mapboxToken;
      console.log('[ImmersiveJourneyMap] Creating map...');

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: [-98.5795, 39.8283],
        zoom: 3.5,
        pitch: 30,
        bearing: 0,
        interactive: true,
        renderWorldCopies: false,
        fadeDuration: 0,
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({ visualizePitch: true }),
        'top-right'
      );

      map.current.on('load', () => {
        console.log('[ImmersiveJourneyMap] Map loaded successfully');
        setMapLoaded(true);
      });

      map.current.on('error', (e) => {
        console.error('[ImmersiveJourneyMap] Map error:', e);
      });
    } catch (error) {
      console.error('[ImmersiveJourneyMap] Failed to create map:', error);
    }

    return () => {
      markersRef.current.forEach(m => m.remove());
      vehicleMarkerRef.current?.remove();
      map.current?.remove();
      map.current = null;
      if (animationRef.current) clearTimeout(animationRef.current);
    };
  }, [mapboxToken]);

  // Add route and markers when waypoints load
  useEffect(() => {
    if (!mapLoaded || !map.current || waypoints.length === 0) return;

    addRouteLayer();
    addWaypointMarkers();
  }, [mapLoaded, waypoints]);

  const addRouteLayer = useCallback(() => {
    if (!map.current || routeCoordinates.length === 0) return;

    // Remove existing layers if they exist
    if (map.current.getLayer('journey-route-glow')) {
      map.current.removeLayer('journey-route-glow');
    }
    if (map.current.getLayer('journey-route-line')) {
      map.current.removeLayer('journey-route-line');
    }
    if (map.current.getSource('journey-route')) {
      map.current.removeSource('journey-route');
    }

    map.current.addSource('journey-route', {
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
  }, [routeCoordinates]);

  const addWaypointMarkers = useCallback(() => {
    if (!map.current || waypoints.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add markers for all waypoints
    waypoints.forEach((waypoint, index) => {
      const el = document.createElement('div');
      el.className = 'waypoint-marker';
      
      const isStart = index === 0;
      const isEnd = index === waypoints.length - 1;
      const isFriend = waypoint.waypoint_type === 'friend';
      const isPark = waypoint.waypoint_type === 'park';
      const isHighlight = waypoint.is_highlight;
      
      const size = (isStart || isEnd) ? 20 : isHighlight ? 16 : 12;
      const color = isStart ? '#22c55e' : isEnd ? '#ef4444' : isFriend ? '#8b5cf6' : isPark ? '#16a34a' : '#e65c00';
      
      el.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        cursor: pointer;
        z-index: 10;
        will-change: auto;
      `;
      
      el.addEventListener('mouseenter', () => {
        el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
        setActiveWaypoint(waypoint);
      });
      el.addEventListener('mouseleave', () => {
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
      });
      el.addEventListener('click', () => {
        setActiveWaypoint(waypoint);
        map.current?.easeTo({
          center: [waypoint.longitude, waypoint.latitude],
          zoom: 10,
          duration: 800,
        });
      });

      const peopleHtml = waypoint.people_met?.length 
        ? `<div style="font-size: 11px; color: #8b5cf6; margin-top: 4px;">👤 ${waypoint.people_met.join(', ')}</div>` 
        : '';

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center',
      })
        .setLngLat([waypoint.longitude, waypoint.latitude])
        .setPopup(
          new mapboxgl.Popup({ 
            offset: 25, 
            closeButton: false,
            className: 'waypoint-popup'
          }).setHTML(`
            <div style="font-family: system-ui; padding: 8px; max-width: 250px;">
              <strong style="color: #e65c00; font-size: 14px;">${waypoint.name}</strong>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">${waypoint.state_code || ''} • ${new Date(waypoint.arrived_at).toLocaleDateString()}</div>
              ${waypoint.description ? `<div style="font-size: 12px; color: #444; margin-top: 8px; line-height: 1.4;">${waypoint.description}</div>` : ''}
              ${peopleHtml}
            </div>
          `)
        )
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Add vehicle marker for animation
    if (!vehicleMarkerRef.current && waypoints.length > 0) {
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
        .setLngLat([waypoints[0].longitude, waypoints[0].latitude])
        .addTo(map.current!);
    }
  }, [waypoints]);

  const flyToWaypoint = useCallback((index: number, smooth = true) => {
    if (!map.current || index >= waypoints.length) return;

    const waypoint = waypoints[index];
    setCurrentWaypointIndex(index);
    setActiveWaypoint(waypoint);

    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.getElement().style.display = 'block';
      vehicleMarkerRef.current.setLngLat([waypoint.longitude, waypoint.latitude]);
    }

    const nextIndex = index + 1;
    let bearing = 0;
    if (nextIndex < waypoints.length) {
      const next = waypoints[nextIndex];
      const dLng = next.longitude - waypoint.longitude;
      const dLat = next.latitude - waypoint.latitude;
      bearing = Math.atan2(dLng, dLat) * (180 / Math.PI);
    }

    map.current.easeTo({
      center: [waypoint.longitude, waypoint.latitude],
      zoom: smooth ? 9 : 8,
      pitch: 45,
      bearing: bearing,
      duration: smooth ? 2500 : 1500,
    });
  }, [waypoints]);

  const startAnimation = useCallback(() => {
    if (waypoints.length === 0) return;
    setIsPlaying(true);
    let index = currentWaypointIndex;

    const animate = () => {
      if (index >= waypoints.length) {
        setIsPlaying(false);
        return;
      }

      flyToWaypoint(index, true);
      index++;

      const waypoint = waypoints[index - 1];
      const pauseTime = waypoint.is_highlight ? 4000 : 2500;

      animationRef.current = window.setTimeout(() => {
        animate();
      }, pauseTime) as unknown as number;
    };

    animate();
  }, [currentWaypointIndex, flyToWaypoint, waypoints]);

  const pauseAnimation = useCallback(() => {
    setIsPlaying(false);
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
  }, []);

  const skipToNext = useCallback(() => {
    const nextIndex = Math.min(currentWaypointIndex + 1, waypoints.length - 1);
    flyToWaypoint(nextIndex, false);
  }, [currentWaypointIndex, flyToWaypoint, waypoints.length]);

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

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg ${className}`}>
        <p className="text-muted-foreground">Loading waypoints...</p>
      </div>
    );
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden ${className}`} style={{ minHeight: '400px', height: '100%' }}>
      {/* Map Container - must have explicit dimensions for Mapbox */}
      <div 
        ref={mapContainer} 
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }} 
      />

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
              disabled={waypoints.length === 0}
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
              disabled={waypoints.length === 0}
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
              {currentWaypointIndex} / {waypoints.length} stops
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
                activeWaypoint.waypoint_type === 'friend' ? 'bg-violet-500' :
                activeWaypoint.waypoint_type === 'park' ? 'bg-green-600' :
                'bg-primary'
              }`} />
              <div className="min-w-0">
                <h4 className="font-semibold text-sm text-foreground truncate">
                  {activeWaypoint.name}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {activeWaypoint.state_code} • {new Date(activeWaypoint.arrived_at).toLocaleDateString()}
                </p>
                {activeWaypoint.people_met && activeWaypoint.people_met.length > 0 && (
                  <p className="text-xs text-violet-500 mt-1">
                    👤 {activeWaypoint.people_met.join(', ')}
                  </p>
                )}
                {activeWaypoint.description && (
                  <p className="text-xs text-foreground/70 mt-1 line-clamp-2">
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
            <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
            <span className="text-muted-foreground">Friends</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-600" />
            <span className="text-muted-foreground">Parks</span>
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
};

export default ImmersiveJourneyMap;
