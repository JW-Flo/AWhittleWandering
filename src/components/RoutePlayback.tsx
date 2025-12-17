import { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { journeyWaypoints, JourneyWaypoint } from '@/data/journeyRoute';
import { Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight, MapPin, Calendar, Zap, Mountain, Route, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import WaypointDetailDrawer from './WaypointDetailDrawer';

interface RoutePlaybackProps {
  mapboxToken: string;
  className?: string;
  onWaypointChange?: (waypoint: JourneyWaypoint, index: number) => void;
}

export default function RoutePlayback({ mapboxToken, className = '', onWaypointChange }: RoutePlaybackProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const vehicleMarker = useRef<mapboxgl.Marker | null>(null);
  const animationRef = useRef<number | null>(null);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const currentWaypoint = journeyWaypoints[currentIndex];

  // Initialize map
  useEffect(() => {
    console.log('[RoutePlayback] Init - mapContainer:', !!mapContainer.current, 'mapboxToken:', !!mapboxToken, 'token length:', mapboxToken?.length);
    
    if (!mapContainer.current) {
      console.warn('[RoutePlayback] No map container');
      return;
    }
    
    if (!mapboxToken) {
      console.warn('[RoutePlayback] No mapbox token');
      return;
    }

    try {
      mapboxgl.accessToken = mapboxToken;
      console.log('[RoutePlayback] Creating map...');

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [currentWaypoint.lng, currentWaypoint.lat],
        zoom: 10,
        pitch: 45,
        bearing: -17.6,
      });

      map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');

      map.current.on('load', () => {
        console.log('[RoutePlayback] Map loaded successfully');
        setMapLoaded(true);
        addRouteLayer();
        addVehicleMarker();
      });

      map.current.on('error', (e) => {
        console.error('[RoutePlayback] Map error:', e);
      });
    } catch (error) {
      console.error('[RoutePlayback] Failed to create map:', error);
    }

    return () => {
      if (animationRef.current) clearTimeout(animationRef.current);
      vehicleMarker.current?.remove();
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  const addRouteLayer = useCallback(() => {
    if (!map.current) return;

    const coordinates = journeyWaypoints.map(wp => [wp.lng, wp.lat]);

    map.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates },
      },
    });

    // Traveled route (highlighted)
    map.current.addSource('traveled-route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: coordinates.slice(0, 1) },
      },
    });

    // Full route (muted)
    map.current.addLayer({
      id: 'route-background',
      type: 'line',
      source: 'route',
      paint: {
        'line-color': '#888888',
        'line-width': 3,
        'line-opacity': 0.4,
      },
    });

    // Traveled portion (bright)
    map.current.addLayer({
      id: 'traveled-route',
      type: 'line',
      source: 'traveled-route',
      paint: {
        'line-color': '#e65c00',
        'line-width': 5,
        'line-opacity': 1,
      },
    });
  }, []);

  const addVehicleMarker = useCallback(() => {
    if (!map.current) return;

    const el = document.createElement('div');
    el.className = 'vehicle-marker';
    el.innerHTML = `
      <div style="
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #e65c00, #ff8c00);
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      ">🚗</div>
    `;

    vehicleMarker.current = new mapboxgl.Marker(el)
      .setLngLat([currentWaypoint.lng, currentWaypoint.lat])
      .addTo(map.current);
  }, []);

  // Update traveled route when index changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const coordinates = journeyWaypoints.slice(0, currentIndex + 1).map(wp => [wp.lng, wp.lat]);
    const source = map.current.getSource('traveled-route') as mapboxgl.GeoJSONSource;
    
    if (source) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates },
      });
    }

    if (vehicleMarker.current) {
      vehicleMarker.current.setLngLat([currentWaypoint.lng, currentWaypoint.lat]);
    }

    setProgress((currentIndex / (journeyWaypoints.length - 1)) * 100);
    onWaypointChange?.(currentWaypoint, currentIndex);
  }, [currentIndex, mapLoaded, onWaypointChange]);

  const goToWaypoint = useCallback((index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, journeyWaypoints.length - 1));
    setCurrentIndex(clampedIndex);
    
    const wp = journeyWaypoints[clampedIndex];
    map.current?.flyTo({
      center: [wp.lng, wp.lat],
      zoom: 11,
      pitch: 50,
      bearing: Math.random() * 60 - 30,
      duration: 1000,
    });
  }, []);

  const handleSliderChange = useCallback((value: number[]) => {
    const index = Math.round((value[0] / 100) * (journeyWaypoints.length - 1));
    goToWaypoint(index);
  }, [goToWaypoint]);

  const startPlayback = useCallback(() => {
    setIsPlaying(true);
    
    const animate = () => {
      setCurrentIndex(prev => {
        const next = prev + 1;
        if (next >= journeyWaypoints.length) {
          setIsPlaying(false);
          return prev;
        }
        
        const wp = journeyWaypoints[next];
        map.current?.flyTo({
          center: [wp.lng, wp.lat],
          zoom: 11,
          pitch: 50,
          duration: 2000 / playbackSpeed,
        });
        
        return next;
      });
      
      animationRef.current = window.setTimeout(animate, 3000 / playbackSpeed) as unknown as number;
    };
    
    animate();
  }, [playbackSpeed]);

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    if (animationRef.current) clearTimeout(animationRef.current);
  }, []);

  const skipPrevious = () => goToWaypoint(currentIndex - 5);
  const skipNext = () => goToWaypoint(currentIndex + 5);
  const previousWaypoint = () => goToWaypoint(currentIndex - 1);
  const nextWaypoint = () => goToWaypoint(currentIndex + 1);

  if (!mapboxToken) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg ${className}`}>
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-card ${className}`}>
      {/* Map */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Gradient overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background/80 via-transparent to-transparent" />

      {/* Current Location Info */}
      <div className="absolute top-4 left-4 right-4 flex items-start gap-4">
        <div 
          className="bg-background/95 backdrop-blur-md rounded-xl px-4 py-3 shadow-lg border border-border flex-1 max-w-md cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => setDrawerOpen(true)}
        >
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">{currentWaypoint.name}</h3>
            <Badge variant="outline" className="ml-auto text-xs">
              {currentWaypoint.state}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {currentWaypoint.date}
            </span>
            {currentWaypoint.miles && (
              <span className="flex items-center gap-1">
                <Route className="w-3 h-3" />
                {currentWaypoint.miles} mi
              </span>
            )}
            {currentWaypoint.elevation && (
              <span className="flex items-center gap-1">
                <Mountain className="w-3 h-3" />
                {currentWaypoint.elevation.toLocaleString()} ft
              </span>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-5 px-1.5 text-xs ml-auto"
              onClick={(e) => { e.stopPropagation(); setDrawerOpen(true); }}
            >
              <Info className="w-3 h-3 mr-1" />
              Details
            </Button>
          </div>
          {currentWaypoint.description && (
            <p className="text-xs text-foreground/70 mt-2 line-clamp-2">{currentWaypoint.description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="bg-background/95 backdrop-blur-md rounded-xl px-3 py-2 shadow-lg border border-border">
          <div className="text-xs text-muted-foreground">Stop</div>
          <div className="font-bold text-lg text-primary">{currentIndex + 1} / {journeyWaypoints.length}</div>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="absolute bottom-4 left-4 right-4 space-y-3">
        {/* Progress Slider */}
        <div className="bg-background/95 backdrop-blur-md rounded-xl px-4 py-3 shadow-lg border border-border">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs text-muted-foreground min-w-[60px]">
              {journeyWaypoints[0]?.date}
            </span>
            <Slider
              value={[progress]}
              onValueChange={handleSliderChange}
              max={100}
              step={0.5}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground min-w-[60px] text-right">
              {journeyWaypoints[journeyWaypoints.length - 1]?.date}
            </span>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={skipPrevious}
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={previousWaypoint}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <Button
              size="icon"
              variant="default"
              className="h-10 w-10 rounded-full"
              onClick={isPlaying ? stopPlayback : startPlayback}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </Button>
            
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={nextWaypoint}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={skipNext}
            >
              <SkipForward className="w-4 h-4" />
            </Button>

            {/* Speed Toggle */}
            <div className="ml-4 flex items-center gap-1">
              {[0.5, 1, 2].map(speed => (
                <Button
                  key={speed}
                  size="sm"
                  variant={playbackSpeed === speed ? "secondary" : "ghost"}
                  className="h-6 px-2 text-xs"
                  onClick={() => setPlaybackSpeed(speed)}
                >
                  {speed}x
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Waypoint Detail Drawer */}
      <WaypointDetailDrawer
        waypoint={currentWaypoint}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        waypointIndex={currentIndex}
        totalWaypoints={journeyWaypoints.length}
      />
    </div>
  );
}
