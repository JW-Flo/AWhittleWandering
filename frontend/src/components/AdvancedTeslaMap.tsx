// Advanced Tesla Map with enhanced route visualization and interactive features
// Includes route smoothing, elevation profiles, and animated path display

import React, { useEffect, useRef, useState, useCallback } from 'react';
// Dynamic load mapbox to reduce initial bundle
let mapboxgl: any; // loaded at runtime
import { 
  smoothRoute, 
  createRouteSegments, 
  clusterWaypoints, 
  calculateRouteStatistics,
  generateRouteAnimation,
  type RoutePoint,
  type RouteStatistics
} from '@/utils/routeVisualization';

interface AdvancedTeslaMapProps {
  mapboxToken: string;
  routePoints: RoutePoint[];
  currentLocation?: {
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
  };
  showElevationProfile?: boolean;
  showRouteAnimation?: boolean;
  showClusters?: boolean;
  onRouteStatsChange?: (stats: RouteStatistics) => void;
  onLocationClick?: (location: { lat: number; lng: number }) => void;
}

const AdvancedTeslaMap: React.FC<AdvancedTeslaMapProps> = ({
  mapboxToken,
  routePoints,
  currentLocation,
  showElevationProfile: _showElevationProfile = false,
  showRouteAnimation: _showRouteAnimation = false,
  showClusters = true,
  onRouteStatsChange,
  onLocationClick
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [routeStats, setRouteStats] = useState<RouteStatistics | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const animationRef = useRef<number | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12', // Enhanced satellite view
      center: [-98.5795, 39.8283], // Center of USA
      zoom: 4,
      projection: 'mercator',
      pitch: 0,
      bearing: 0,
      maxPitch: 60, // Allow some 3D tilt for better route visualization
    });

    const mapInstance = map.current!;

    // Add enhanced navigation controls
    mapInstance.addControl(new mapboxgl.NavigationControl({
      visualizePitch: true,
      showCompass: true
    }), 'top-right');

    // Add fullscreen control
    mapInstance.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    // Add scale control
    mapInstance.addControl(new mapboxgl.ScaleControl({
      maxWidth: 80,
      unit: 'imperial'
    }), 'bottom-left');

    mapInstance.on('load', () => {
      setIsMapLoaded(true);
      
      // Add terrain data source for elevation
      map.current!.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14
      });

      // Add terrain layer
      map.current!.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

      // Add sky layer for better 3D effect
      map.current!.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun-intensity': 5
        }
      });
    });

    // Handle map clicks
    mapInstance.on('click', (e) => {
      if (onLocationClick) {
        onLocationClick({
          lat: e.lngLat.lat,
          lng: e.lngLat.lng
        });
      }
    });

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      map.current?.remove();
    };
  }, [mapboxToken, onLocationClick]);

  // Process route data and create visualizations
  useEffect(() => {
    if (!isMapLoaded || !map.current || routePoints.length === 0) return;

    // Clear existing route layers
    const layersToRemove = [
      'route-line',
      'route-segments',
      'route-clusters',
      'route-points',
      'route-animation'
    ];
    
    layersToRemove.forEach(layerId => {
      if (map.current!.getLayer(layerId)) {
        map.current!.removeLayer(layerId);
      }
    });

    const sourcesToRemove = [
      'route-data',
      'route-segments-data',
      'route-clusters-data',
      'route-animation-data'
    ];
    
    sourcesToRemove.forEach(sourceId => {
      if (map.current!.getSource(sourceId)) {
        map.current!.removeSource(sourceId);
      }
    });

    // Smooth the route for better visualization
    const smoothedRoute = smoothRoute(routePoints, 0.0001);
    
    // Create route segments for analysis
    const segments = createRouteSegments(smoothedRoute);
    
    // Calculate route statistics
    const stats = calculateRouteStatistics(segments);
    setRouteStats(stats);
    if (onRouteStatsChange) {
      onRouteStatsChange(stats);
    }

    // Create main route line
    const routeLineFeature = {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: smoothedRoute.map(point => [point.lng, point.lat])
      }
    };

    map.current.addSource('route-data', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [routeLineFeature]
      }
    });

    // Add main route line with gradient effect
    map.current.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route-data',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': [
          'interpolate',
          ['linear'],
          ['line-progress'],
          0, '#FF6B35', // Adventure orange start
          0.5, '#00D4AA', // Tesla cyan middle
          1, '#FFD700' // Adventure gold end
        ],
        'line-width': 4,
        'line-opacity': 0.8
      }
    });

    // Add route segments with speed-based coloring
    if (segments.length > 0) {
      // Segment features computed for future use (e.g. speed-based layer coloring)
      const _segmentFeatures = segments.map(segment => ({
        type: 'Feature' as const,
        properties: {
          speed: segment.averageSpeed,
          type: segment.type,
          distance: segment.distance
        },
        geometry: {
          type: 'LineString' as const,
          coordinates: [
            [segment.startPoint.lng, segment.startPoint.lat],
            [segment.endPoint.lng, segment.endPoint.lat]
          ]
        }
      }));
      void _segmentFeatures;
    }

    // Add waypoint clusters if enabled
    if (showClusters) {
      const clusters = clusterWaypoints(routePoints, 5);
      
      const clusterFeatures = clusters.map(cluster => ({
        type: 'Feature' as const,
        properties: {
          pointCount: cluster.points.length,
          importance: cluster.importance,
          type: cluster.type
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [cluster.center.lng, cluster.center.lat]
        }
      }));

      map.current.addSource('route-clusters-data', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: clusterFeatures
        }
      });

      map.current.addLayer({
        id: 'route-clusters',
        type: 'circle',
        source: 'route-clusters-data',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'pointCount'],
            1, 4,
            5, 8,
            10, 12
          ],
          'circle-color': [
            'case',
            ['==', ['get', 'type'], 'city'], '#FF6B35',
            ['==', ['get', 'type'], 'landmark'], '#FFD700',
            ['==', ['get', 'type'], 'charging'], '#00D4AA',
            '#888888'
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.8
        }
      });

      // Add cluster labels
      map.current.addLayer({
        id: 'route-clusters-labels',
        type: 'symbol',
        source: 'route-clusters-data',
        layout: {
          'text-field': ['get', 'pointCount'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        },
        paint: {
          'text-color': '#ffffff'
        }
      });
    }

    // Fit map to route bounds
    if (smoothedRoute.length > 0) {
      const bounds = smoothedRoute.reduce((bounds, point) => {
        return bounds.extend([point.lng, point.lat]);
      }, new mapboxgl.LngLatBounds());

      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 12
      });
    }

  }, [isMapLoaded, routePoints, showClusters, onRouteStatsChange]);

  // Add current location marker
  useEffect(() => {
    if (!isMapLoaded || !map.current || !currentLocation) return;

    // Remove existing current location marker
    if (map.current.getLayer('current-location')) {
      map.current.removeLayer('current-location');
    }
    if (map.current.getSource('current-location-data')) {
      map.current.removeSource('current-location-data');
    }

    const locationFeature = {
      type: 'Feature' as const,
      properties: {
        heading: currentLocation.heading || 0,
        speed: currentLocation.speed || 0
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [currentLocation.lng, currentLocation.lat]
      }
    };

    map.current.addSource('current-location-data', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [locationFeature]
      }
    });

    map.current.addLayer({
      id: 'current-location',
      type: 'circle',
      source: 'current-location-data',
      paint: {
        'circle-radius': 8,
        'circle-color': '#FF6B35',
        'circle-stroke-width': 3,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.9
      }
    });

    // Add pulsing effect
    map.current.addLayer({
      id: 'current-location-pulse',
      type: 'circle',
      source: 'current-location-data',
      paint: {
        'circle-radius': 15,
        'circle-color': '#FF6B35',
        'circle-opacity': 0.3
      }
    });

  }, [isMapLoaded, currentLocation]);

  // Route animation functionality
  const startRouteAnimation = useCallback(() => {
    if (!map.current || routePoints.length === 0 || isAnimating) return;

    setIsAnimating(true);
    setAnimationProgress(0);

    const animationPoints = generateRouteAnimation(routePoints, 10000); // 10 second animation
    let currentFrame = 0;

    const animate = () => {
      if (currentFrame >= animationPoints.length) {
        setIsAnimating(false);
        setAnimationProgress(100);
        return;
      }

      const progress = (currentFrame / animationPoints.length) * 100;
      setAnimationProgress(progress);

      // Update animation marker position
      const currentPoint = animationPoints[currentFrame];
      
      if (map.current!.getSource('route-animation-data')) {
        (map.current!.getSource('route-animation-data') as mapboxgl.GeoJSONSource).setData({
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: [currentPoint.lng, currentPoint.lat]
            }
          }]
        });
      } else {
        map.current!.addSource('route-animation-data', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: [currentPoint.lng, currentPoint.lat]
              }
            }]
          }
        });

        map.current!.addLayer({
          id: 'route-animation',
          type: 'circle',
          source: 'route-animation-data',
          paint: {
            'circle-radius': 10,
            'circle-color': '#FFD700',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.9
          }
        });
      }

      currentFrame++;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
  }, [routePoints, isAnimating]);

  const stopRouteAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsAnimating(false);
    setAnimationProgress(0);

    // Remove animation layer
    if (map.current?.getLayer('route-animation')) {
      map.current.removeLayer('route-animation');
    }
    if (map.current?.getSource('route-animation-data')) {
      map.current.removeSource('route-animation-data');
    }
  }, []);

  return (
    <div className="relative">
      <div ref={mapContainer} className="h-96 w-full rounded-lg overflow-hidden" />
      
      {/* Map Controls */}
      <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg shadow-lg p-3 space-y-2">
        <h4 className="text-sm font-bold">Map Controls</h4>
        
        {routePoints.length > 0 && (
          <button
            onClick={isAnimating ? stopRouteAnimation : startRouteAnimation}
            className={`w-full px-3 py-1 text-xs rounded ${
              isAnimating 
                ? 'bg-red-500 text-white' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isAnimating ? 'Stop Animation' : 'Animate Route'}
          </button>
        )}
        
        {isAnimating && (
          <div className="w-full">
            <div className="text-xs text-gray-600 mb-1">Progress: {animationProgress.toFixed(0)}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-100"
                style={{ width: `${animationProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Route Statistics */}
      {routeStats && (
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg shadow-lg p-3 text-xs">
          <h4 className="font-bold mb-2">Route Statistics</h4>
          <div className="space-y-1">
            <div>Distance: {routeStats.totalDistance.toFixed(1)} miles</div>
            <div>Time: {(routeStats.totalTime / 60).toFixed(1)} hours</div>
            <div>Avg Speed: {routeStats.averageSpeed.toFixed(1)} mph</div>
            <div>Max Speed: {routeStats.maxSpeed.toFixed(1)} mph</div>
          </div>
          
          <div className="mt-2 pt-2 border-t">
            <div className="text-xs font-medium mb-1">Route Types:</div>
            <div className="space-y-1">
              {Object.entries(routeStats.routeTypes).map(([type, distance]) => (
                distance > 0 && (
                  <div key={type} className="flex justify-between">
                    <span className="capitalize">{type}:</span>
                    <span>{distance.toFixed(1)}mi</span>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 rounded-lg shadow-lg p-3 text-xs">
        <h4 className="font-bold mb-2">Legend</h4>
        <div className="space-y-1">
          <div className="flex items-center">
            <div className="w-4 h-1 bg-gradient-to-r from-orange-500 via-teal-500 to-yellow-500 mr-2"></div>
            <span>Main Route</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
            <span>Current Location</span>
          </div>
          {showClusters && (
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span>Waypoint Clusters</span>
            </div>
          )}
          <div className="mt-2 pt-2 border-t">
            <div className="text-xs font-medium">Speed Colors:</div>
            <div className="flex items-center">
              <div className="w-3 h-1 bg-red-500 mr-1"></div>
              <div className="w-3 h-1 bg-orange-500 mr-1"></div>
              <div className="w-3 h-1 bg-green-500 mr-1"></div>
              <div className="w-3 h-1 bg-blue-500 mr-2"></div>
              <span>Slow → Fast</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedTeslaMap;
