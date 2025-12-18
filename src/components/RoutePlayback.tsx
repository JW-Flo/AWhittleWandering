import { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { journeyWaypoints, JourneyWaypoint } from '@/data/journeyRoute';
import { Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight, MapPin, Calendar, Zap, Mountain, Route, Info, RefreshCw, AlertCircle } from 'lucide-react';
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
  const [mapError, setMapError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const currentWaypoint = journeyWaypoints[currentIndex];

  // Initialize map
  useEffect(() => {
    console.log('[RoutePlayback] Init - mapContainer:', !!mapContainer.current, 'mapboxToken:', !!mapboxToken, 'token length:', mapboxToken?.length);
    
    if (!mapContainer.current) {
      console.warn('[RoutePlayback] No map container');
      return;
    }
    
    if (!mapboxToken) {
      console.warn('[RoutePlayback] No mapbox token yet');
      return;
    }

    // Reset error state on new attempt
    setMapError(null);

    // Ensure container has dimensions before creating map
    const initMap = () => {
      if (!mapContainer.current) return;
      
      const rect = mapContainer.current.getBoundingClientRect();
      console.log('[RoutePlayback] Container dimensions:', rect.width, 'x', rect.height);
      
      // If container has no dimensions, retry after layout
      if (rect.width === 0 || rect.height === 0) {
        console.log('[RoutePlayback] Container has no dimensions, will retry...');
        const retryTimeout = setTimeout(() => setRetryCount(prev => prev + 1), 200);
        return () => clearTimeout(retryTimeout);
      }

      // Don't create a new map if one already exists
      if (map.current) {
        console.log('[RoutePlayback] Map already exists, skipping init');
        return;
      }

      try {
        mapboxgl.accessToken = mapboxToken;
        console.log('[RoutePlayback] Creating map with token:', mapboxToken.substring(0, 20) + '...');
        
        // Ensure waypoint data exists
        const waypoint = journeyWaypoints[0] || { lng: -97.388860, lat: 27.741570 };
        console.log('[RoutePlayback] Initial center:', waypoint.lng, waypoint.lat);

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/satellite-streets-v12',
          center: [waypoint.lng, waypoint.lat],
          zoom: 10,
          pitch: 45,
          bearing: -17.6,
          attributionControl: true,
          preserveDrawingBuffer: true,
        });

        map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');

        map.current.on('load', () => {
          console.log('[RoutePlayback] Map loaded successfully');
          setMapLoaded(true);
          setMapError(null);
          addRouteLayer();
          addVehicleMarker();
        });

        map.current.on('error', (e) => {
          console.error('[RoutePlayback] Map error:', e);
          setMapError('Failed to load map. Please check your connection.');
        });
        
        map.current.on('idle', () => {
          console.log('[RoutePlayback] Map idle');
        });
      } catch (error: any) {
        console.error('[RoutePlayback] Failed to create map:', error?.message || error);
        setMapError(`Failed to initialize map: ${error?.message || 'Unknown error'}`);
      }
    };

    // Small delay to ensure DOM is ready
    const initTimeout = setTimeout(initMap, 100);

    return () => {
      clearTimeout(initTimeout);
      if (animationRef.current) clearTimeout(animationRef.current);
      if (vehicleMarker.current) {
        vehicleMarker.current.remove();
        vehicleMarker.current = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken, retryCount]);

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

  const handleRetry = () => {
    setMapError(null);
    setMapLoaded(false);
    setRetryCount(prev => prev + 1);
  };

  // Show error/loading state only when there's an actual error
  if (mapError) {
    const isCspError = mapError.includes('Content Security Policy') || mapError.includes('Worker');
    return (
      <div className={`flex flex-col items-center justify-center bg-muted/50 rounded-2xl ${className}`} style={{ minHeight: '400px' }}>
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2 text-center px-4">
          {isCspError ? 'Map preview unavailable in sandbox' : mapError}
        </p>
        <p className="text-xs text-muted-foreground/60 mb-4 text-center px-4">
          {isCspError 
            ? 'The map will work correctly on the deployed site (awhittlewandering.com)' 
            : 'Please try again'}
        </p>
        {!isCspError && (
          <Button variant="outline" size="sm" onClick={handleRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  // Show loading state while waiting for token
  if (!mapboxToken) {
    return (
      <div className={`flex flex-col items-center justify-center bg-muted/50 rounded-2xl ${className}`} style={{ minHeight: '400px' }}>
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-card ${className}`} style={{ minHeight: '400px' }}>
      {/* Map */}
      <div ref={mapContainer} className="absolute inset-0" style={{ minHeight: '400px' }} />

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
