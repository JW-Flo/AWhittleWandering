// Advanced route visualization utilities for enhanced map display
// Provides route smoothing, waypoint clustering, and path optimization

export interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: string;
  speed?: number;
  heading?: number;
  elevation?: number;
  city?: string;
  state?: string;
  address?: string;
}

export interface RouteSegment {
  id: string;
  startPoint: RoutePoint;
  endPoint: RoutePoint;
  distance: number;
  duration: number;
  averageSpeed: number;
  type: 'highway' | 'city' | 'rural' | 'unknown';
  surface: 'smooth' | 'rough' | 'unknown';
}

export interface ClusteredWaypoint {
  id: string;
  center: { lat: number; lng: number };
  points: RoutePoint[];
  radius: number;
  importance: 'high' | 'medium' | 'low';
  type: 'city' | 'landmark' | 'stop' | 'charging';
}

// Calculate distance between two points using Haversine formula
export const calculateDistance = (point1: RoutePoint, point2: RoutePoint): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLon = (point2.lng - point1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Calculate bearing between two points
export const calculateBearing = (point1: RoutePoint, point2: RoutePoint): number => {
  const dLon = (point2.lng - point1.lng) * Math.PI / 180;
  const lat1 = point1.lat * Math.PI / 180;
  const lat2 = point2.lat * Math.PI / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  
  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
};

// Smooth route points using Douglas-Peucker algorithm
export const smoothRoute = (points: RoutePoint[], tolerance: number = 0.001): RoutePoint[] => {
  if (points.length <= 2) return points;
  
  // Find the point with maximum distance from the line segment
  let maxDistance = 0;
  let maxIndex = 0;
  
  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }
  
  // If max distance is greater than tolerance, recursively simplify
  if (maxDistance > tolerance) {
    const leftPart = smoothRoute(points.slice(0, maxIndex + 1), tolerance);
    const rightPart = smoothRoute(points.slice(maxIndex), tolerance);
    
    // Combine results, removing duplicate point
    return [...leftPart.slice(0, -1), ...rightPart];
  } else {
    // If max distance is less than tolerance, return simplified line
    return [points[0], points[points.length - 1]];
  }
};

// Calculate perpendicular distance from point to line segment
const perpendicularDistance = (point: RoutePoint, lineStart: RoutePoint, lineEnd: RoutePoint): number => {
  const A = point.lat - lineStart.lat;
  const B = point.lng - lineStart.lng;
  const C = lineEnd.lat - lineStart.lat;
  const D = lineEnd.lng - lineStart.lng;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) return Math.sqrt(A * A + B * B);
  
  const param = dot / lenSq;
  
  let xx, yy;
  if (param < 0) {
    xx = lineStart.lat;
    yy = lineStart.lng;
  } else if (param > 1) {
    xx = lineEnd.lat;
    yy = lineEnd.lng;
  } else {
    xx = lineStart.lat + param * C;
    yy = lineStart.lng + param * D;
  }
  
  const dx = point.lat - xx;
  const dy = point.lng - yy;
  return Math.sqrt(dx * dx + dy * dy);
};

// Create route segments from points
export const createRouteSegments = (points: RoutePoint[]): RouteSegment[] => {
  const segments: RouteSegment[] = [];
  
  for (let i = 0; i < points.length - 1; i++) {
    const startPoint = points[i];
    const endPoint = points[i + 1];
    
    const distance = calculateDistance(startPoint, endPoint);
    const startTime = new Date(startPoint.timestamp).getTime();
    const endTime = new Date(endPoint.timestamp).getTime();
    const duration = (endTime - startTime) / (1000 * 60); // minutes
    
    const averageSpeed = duration > 0 ? (distance / duration) * 60 : 0; // mph
    
    // Determine route type based on speed
    let type: RouteSegment['type'] = 'unknown';
    if (averageSpeed > 55) type = 'highway';
    else if (averageSpeed > 25) type = 'rural';
    else type = 'city';
    
    segments.push({
      id: `segment-${i}`,
      startPoint,
      endPoint,
      distance,
      duration,
      averageSpeed,
      type,
      surface: 'unknown'
    });
  }
  
  return segments;
};

// Cluster nearby waypoints for cleaner visualization
export const clusterWaypoints = (points: RoutePoint[], maxDistance: number = 10): ClusteredWaypoint[] => {
  const clusters: ClusteredWaypoint[] = [];
  const processed = new Set<number>();
  
  for (let i = 0; i < points.length; i++) {
    if (processed.has(i)) continue;
    
    const clusterPoints: RoutePoint[] = [points[i]];
    processed.add(i);
    
    // Find nearby points
    for (let j = i + 1; j < points.length; j++) {
      if (processed.has(j)) continue;
      
      const distance = calculateDistance(points[i], points[j]);
      if (distance <= maxDistance) {
        clusterPoints.push(points[j]);
        processed.add(j);
      }
    }
    
    // Calculate cluster center
    const centerLat = clusterPoints.reduce((sum, p) => sum + p.lat, 0) / clusterPoints.length;
    const centerLng = clusterPoints.reduce((sum, p) => sum + p.lng, 0) / clusterPoints.length;
    
    // Determine cluster importance
    let importance: ClusteredWaypoint['importance'] = 'low';
    if (clusterPoints.length >= 5) importance = 'high';
    else if (clusterPoints.length >= 3) importance = 'medium';
    
    // Determine cluster type
    let type: ClusteredWaypoint['type'] = 'stop';
    if (clusterPoints.some(p => p.city)) type = 'city';
    
    clusters.push({
      id: `cluster-${clusters.length}`,
      center: { lat: centerLat, lng: centerLng },
      points: clusterPoints,
      radius: Math.max(...clusterPoints.map(p => calculateDistance(points[i], p))),
      importance,
      type
    });
  }
  
  return clusters;
};

// Generate elevation profile for route
export const generateElevationProfile = async (points: RoutePoint[]): Promise<RoutePoint[]> => {
  // For now, return points as-is. In a real implementation, you would:
  // 1. Call an elevation API (Google Elevation API, MapBox Elevation API)
  // 2. Add elevation data to each point
  // 3. Calculate grade/slope between points
  
  return points.map(point => ({
    ...point,
    elevation: 0 // Placeholder - would be actual elevation in feet/meters
  }));
};

// Calculate route statistics
export interface RouteStatistics {
  totalDistance: number;
  totalTime: number;
  averageSpeed: number;
  maxSpeed: number;
  minSpeed: number;
  elevationGain: number;
  elevationLoss: number;
  routeTypes: Record<RouteSegment['type'], number>;
}

export const calculateRouteStatistics = (segments: RouteSegment[]): RouteStatistics => {
  const totalDistance = segments.reduce((sum, seg) => sum + seg.distance, 0);
  const totalTime = segments.reduce((sum, seg) => sum + seg.duration, 0);
  const speeds = segments.map(seg => seg.averageSpeed).filter(speed => speed > 0);
  
  const routeTypes: Record<RouteSegment['type'], number> = {
    highway: 0,
    city: 0,
    rural: 0,
    unknown: 0
  };
  
  segments.forEach(seg => {
    routeTypes[seg.type] += seg.distance;
  });
  
  return {
    totalDistance,
    totalTime,
    averageSpeed: totalTime > 0 ? (totalDistance / totalTime) * 60 : 0,
    maxSpeed: speeds.length > 0 ? Math.max(...speeds) : 0,
    minSpeed: speeds.length > 0 ? Math.min(...speeds) : 0,
    elevationGain: 0, // Would calculate from elevation data
    elevationLoss: 0, // Would calculate from elevation data
    routeTypes
  };
};

// Generate route animation keyframes
export const generateRouteAnimation = (points: RoutePoint[], duration: number = 10000): RoutePoint[] => {
  if (points.length < 2) return points;
  
  const totalDistance = points.reduce((sum, point, index) => {
    if (index === 0) return 0;
    return sum + calculateDistance(points[index - 1], point);
  }, 0);
  
  const keyframes: RoutePoint[] = [];
  let currentDistance = 0;
  
  for (let i = 0; i < points.length - 1; i++) {
    const segmentDistance = calculateDistance(points[i], points[i + 1]);
    const segmentDuration = (segmentDistance / totalDistance) * duration;
    
    // Add interpolated points for smooth animation
    const steps = Math.max(1, Math.floor(segmentDuration / 100)); // One point every 100ms
    
    for (let step = 0; step <= steps; step++) {
      const progress = step / steps;
      const lat = points[i].lat + (points[i + 1].lat - points[i].lat) * progress;
      const lng = points[i].lng + (points[i + 1].lng - points[i].lng) * progress;
      
      keyframes.push({
        lat,
        lng,
        timestamp: new Date(Date.now() + (currentDistance / totalDistance) * duration).toISOString(),
        heading: calculateBearing(points[i], points[i + 1])
      });
    }
    
    currentDistance += segmentDistance;
  }
  
  return keyframes;
};
