// Interactive Route Planner with optimization and waypoint management
// Provides route planning, optimization, and Tesla Supercharger integration

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Route, 
  MapPin, 
  Zap, 
  Clock, 
  Target, 
  Plus, 
  Trash2, 
  Navigation,
  Battery,
  TrendingUp
} from 'lucide-react';
import { calculateDistance, type RoutePoint } from '@/utils/routeVisualization';

interface Waypoint {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'start' | 'destination' | 'waypoint' | 'charging' | 'attraction';
  estimatedStayDuration?: number; // minutes
  isRequired: boolean;
  notes?: string;
}

interface RouteOptimization {
  totalDistance: number;
  totalTime: number;
  totalChargingTime: number;
  estimatedCost: number;
  chargingStops: number;
  routeEfficiency: number;
}

interface RouteAlternative {
  id: string;
  name: string;
  waypoints: Waypoint[];
  optimization: RouteOptimization;
  isRecommended: boolean;
  description: string;
}

interface InteractiveRoutePlannerProps {
  onRouteChange: (waypoints: Waypoint[]) => void;
  onOptimizedRouteGenerated: (route: RouteAlternative) => void;
  currentLocation?: { lat: number; lng: number };
  vehicleRange?: number; // miles
  vehicleBatteryLevel?: number; // percentage
}

const InteractiveRoutePlanner: React.FC<InteractiveRoutePlannerProps> = ({
  onRouteChange,
  onOptimizedRouteGenerated,
  currentLocation: _currentLocation,
  vehicleRange = 300,
  vehicleBatteryLevel = 80
}) => {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [newWaypoint, setNewWaypoint] = useState({
    name: '',
    address: '',
    type: 'waypoint' as Waypoint['type']
  });
  const [routeAlternatives, setRouteAlternatives] = useState<RouteAlternative[]>([]);
  const [selectedAlternative, setSelectedAlternative] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationCriteria, setOptimizationCriteria] = useState<'time' | 'distance' | 'efficiency'>('time');

  // Predefined Tesla Supercharger locations (sample data)
  const superchargerLocations = [
    { name: "Harrisburg East SC", lat: 40.2677, lng: -76.8339, state: "PA" },
    { name: "King of Prussia SC", lat: 40.0924, lng: -75.3796, state: "PA" },
    { name: "Milford SC", lat: 41.2234, lng: -74.8015, state: "CT" },
    { name: "Darien SC", lat: 41.0789, lng: -73.4687, state: "CT" },
    { name: "Mt. Kisco SC", lat: 41.2084, lng: -73.7290, state: "NY" }
  ];

  // Add new waypoint
  const addWaypoint = async () => {
    if (!newWaypoint.name || !newWaypoint.address) return;

    // In a real implementation, you would geocode the address
    // For now, using sample coordinates
    const coordinates = await geocodeAddress(newWaypoint.address);
    
    const waypoint: Waypoint = {
      id: `waypoint-${Date.now()}`,
      name: newWaypoint.name,
      address: newWaypoint.address,
      lat: coordinates.lat,
      lng: coordinates.lng,
      type: newWaypoint.type,
      isRequired: true,
      estimatedStayDuration: newWaypoint.type === 'charging' ? 30 : 60
    };

    const updatedWaypoints = [...waypoints, waypoint];
    setWaypoints(updatedWaypoints);
    onRouteChange(updatedWaypoints);
    
    setNewWaypoint({ name: '', address: '', type: 'waypoint' });
  };

  // Remove waypoint
  const removeWaypoint = (waypointId: string) => {
    const updatedWaypoints = waypoints.filter(wp => wp.id !== waypointId);
    setWaypoints(updatedWaypoints);
    onRouteChange(updatedWaypoints);
  };

  // Optimize route
  const optimizeRoute = async () => {
    if (waypoints.length < 2) return;

    setIsOptimizing(true);
    
    try {
      // Simulate route optimization
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const alternatives = generateRouteAlternatives(waypoints);
      setRouteAlternatives(alternatives);
      
      if (alternatives.length > 0) {
        const recommended = alternatives.find(alt => alt.isRecommended) || alternatives[0];
        setSelectedAlternative(recommended.id);
        onOptimizedRouteGenerated(recommended);
      }
    } catch (error) {
      console.error('Route optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Generate route alternatives
  const generateRouteAlternatives = (waypoints: Waypoint[]): RouteAlternative[] => {
    const alternatives: RouteAlternative[] = [];

    // Direct route
    const directRoute = calculateDirectRoute(waypoints);
    alternatives.push({
      id: 'direct',
      name: 'Direct Route',
      waypoints: waypoints,
      optimization: directRoute,
      isRecommended: false,
      description: 'Fastest route with minimal stops'
    });

    // Scenic route with attractions
    const scenicRoute = addScenicWaypoints(waypoints);
    alternatives.push({
      id: 'scenic',
      name: 'Scenic Route',
      waypoints: scenicRoute,
      optimization: calculateDirectRoute(scenicRoute),
      isRecommended: false,
      description: 'Beautiful landscapes and points of interest'
    });

    // Optimized charging route
    const chargingRoute = optimizeForCharging(waypoints);
    alternatives.push({
      id: 'charging',
      name: 'Optimized Charging',
      waypoints: chargingRoute,
      optimization: calculateDirectRoute(chargingRoute),
      isRecommended: true,
      description: 'Minimal charging time with strategic stops'
    });

    return alternatives;
  };

  // Convert waypoint to route point for distance calculations
  const waypointToRoutePoint = (waypoint: Waypoint): RoutePoint => ({
    lat: waypoint.lat,
    lng: waypoint.lng,
    timestamp: new Date().toISOString()
  });

  // Calculate direct route optimization
  const calculateDirectRoute = (waypoints: Waypoint[]): RouteOptimization => {
    let totalDistance = 0;
    let totalTime = 0;
    let chargingStops = 0;
    let totalChargingTime = 0;

    for (let i = 0; i < waypoints.length - 1; i++) {
      const distance = calculateDistance(
        waypointToRoutePoint(waypoints[i]), 
        waypointToRoutePoint(waypoints[i + 1])
      );
      totalDistance += distance;
      totalTime += (distance / 60) * 60; // Assume 60 mph average
      
      if (waypoints[i].type === 'charging') {
        chargingStops++;
        totalChargingTime += waypoints[i].estimatedStayDuration || 30;
      }
    }

    return {
      totalDistance,
      totalTime,
      totalChargingTime,
      estimatedCost: totalDistance * 0.12, // $0.12 per mile estimate
      chargingStops,
      routeEfficiency: totalDistance / (totalTime / 60) // miles per hour
    };
  };

  // Add scenic waypoints
  const addScenicWaypoints = (baseWaypoints: Waypoint[]): Waypoint[] => {
    const scenicPoints: Partial<Waypoint>[] = [
      { name: "Blue Ridge Parkway", lat: 35.5951, lng: -82.5515, type: 'attraction' },
      { name: "Shenandoah National Park", lat: 38.2928, lng: -78.6796, type: 'attraction' },
      { name: "Great Smoky Mountains", lat: 35.6118, lng: -83.4895, type: 'attraction' }
    ];

    const enhanced = [...baseWaypoints];
    
    scenicPoints.forEach((point, index) => {
      enhanced.splice(index + 1, 0, {
        id: `scenic-${index}`,
        name: point.name!,
        address: point.name!,
        lat: point.lat!,
        lng: point.lng!,
        type: point.type as Waypoint['type'],
        isRequired: false,
        estimatedStayDuration: 90
      });
    });

    return enhanced;
  };

  // Optimize for charging efficiency
  const optimizeForCharging = (baseWaypoints: Waypoint[]): Waypoint[] => {
    const enhanced = [...baseWaypoints];
    let currentRange = (vehicleBatteryLevel / 100) * vehicleRange;
    
    // Add strategic charging stops
    for (let i = 0; i < enhanced.length - 1; i++) {
      const distance = calculateDistance(
        waypointToRoutePoint(enhanced[i]), 
        waypointToRoutePoint(enhanced[i + 1])
      );
      
      if (currentRange < distance + 50) { // 50 mile buffer
        // Find nearest Supercharger
        const nearestCharger = findNearestSupercharger(waypointToRoutePoint(enhanced[i]));
        
        if (nearestCharger) {
          enhanced.splice(i + 1, 0, {
            id: `charging-${i}`,
            name: nearestCharger.name,
            address: nearestCharger.name,
            lat: nearestCharger.lat,
            lng: nearestCharger.lng,
            type: 'charging',
            isRequired: true,
            estimatedStayDuration: 25,
            notes: 'Strategic charging stop'
          });
          
          currentRange = vehicleRange * 0.9; // Charge to 90%
        }
      } else {
        currentRange -= distance;
      }
    }

    return enhanced;
  };

  // Find nearest Supercharger
  const findNearestSupercharger = (location: RoutePoint) => {
    let nearest = null;
    let minDistance = Infinity;

    superchargerLocations.forEach(charger => {
      const chargerAsRoutePoint: RoutePoint = {
        lat: charger.lat,
        lng: charger.lng,
        timestamp: new Date().toISOString()
      };
      const distance = calculateDistance(location, chargerAsRoutePoint);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = charger;
      }
    });

    return nearest;
  };

  // Geocode address (placeholder implementation)
  const geocodeAddress = async (_address: string): Promise<{ lat: number; lng: number }> => {
    // In a real implementation, use a geocoding service
    // For now, return sample coordinates
    return { lat: 40.7128, lng: -74.0060 };
  };

  // Format time duration
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Route Planning Form */}
      <Card className="story-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gradient">
            <Route className="w-5 h-5" />
            Interactive Route Planner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Waypoint Form */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Location name"
              value={newWaypoint.name}
              onChange={(e) => setNewWaypoint({ ...newWaypoint, name: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <input
              type="text"
              placeholder="Address"
              value={newWaypoint.address}
              onChange={(e) => setNewWaypoint({ ...newWaypoint, address: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <select
              value={newWaypoint.type}
              onChange={(e) => setNewWaypoint({ ...newWaypoint, type: e.target.value as Waypoint['type'] })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="waypoint">Waypoint</option>
              <option value="destination">Destination</option>
              <option value="charging">Charging Stop</option>
              <option value="attraction">Attraction</option>
            </select>
            <Button onClick={addWaypoint} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>

          {/* Optimization Criteria */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Optimize for:</span>
            <div className="flex gap-2">
              {[
                { value: 'time', label: 'Time', icon: Clock },
                { value: 'distance', label: 'Distance', icon: Navigation },
                { value: 'efficiency', label: 'Efficiency', icon: TrendingUp }
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setOptimizationCriteria(value as any)}
                  className={`flex items-center gap-1 px-3 py-1 text-xs rounded ${
                    optimizationCriteria === value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Optimize Button */}
          <Button
            onClick={optimizeRoute}
            disabled={waypoints.length < 2 || isOptimizing}
            className="w-full"
          >
            {isOptimizing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Optimizing Route...
              </>
            ) : (
              <>
                <Target className="w-4 h-4 mr-2" />
                Optimize Route
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Current Waypoints */}
      {waypoints.length > 0 && (
        <Card className="story-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Current Waypoints ({waypoints.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {waypoints.map((waypoint, index) => (
                <div key={waypoint.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-500">#{index + 1}</span>
                      {waypoint.type === 'charging' && <Zap className="w-4 h-4 text-yellow-500" />}
                      {waypoint.type === 'attraction' && <Target className="w-4 h-4 text-purple-500" />}
                      {waypoint.type === 'destination' && <MapPin className="w-4 h-4 text-red-500" />}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{waypoint.name}</div>
                      <div className="text-xs text-gray-500">{waypoint.address}</div>
                      {waypoint.estimatedStayDuration && (
                        <div className="text-xs text-blue-600">
                          Stay: {formatDuration(waypoint.estimatedStayDuration)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={waypoint.isRequired ? 'default' : 'secondary'}>
                      {waypoint.isRequired ? 'Required' : 'Optional'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeWaypoint(waypoint.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Route Alternatives */}
      {routeAlternatives.length > 0 && (
        <Card className="story-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="w-5 h-5" />
              Route Alternatives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {routeAlternatives.map(alternative => (
                <div
                  key={alternative.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedAlternative === alternative.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setSelectedAlternative(alternative.id);
                    onOptimizedRouteGenerated(alternative);
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{alternative.name}</h4>
                    {alternative.isRecommended && (
                      <Badge className="bg-green-500 text-white text-xs">Recommended</Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{alternative.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Distance:</span>
                      <span className="font-medium">{alternative.optimization.totalDistance.toFixed(0)} mi</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span className="font-medium">{formatDuration(alternative.optimization.totalTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Charging:</span>
                      <span className="font-medium flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {alternative.optimization.chargingStops} stops
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Est. Cost:</span>
                      <span className="font-medium">${alternative.optimization.estimatedCost.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vehicle Status */}
      <Card className="story-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Battery className="w-5 h-5" />
            Vehicle Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{vehicleBatteryLevel}%</div>
              <div className="text-sm text-gray-500">Battery Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{Math.round((vehicleBatteryLevel / 100) * vehicleRange)}</div>
              <div className="text-sm text-gray-500">Range (mi)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{vehicleRange}</div>
              <div className="text-sm text-gray-500">Max Range (mi)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">5</div>
              <div className="text-sm text-gray-500">Nearby Chargers</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InteractiveRoutePlanner;
