import React, { useState } from 'react';
import { 
  Route, 
  Zap, 
  TrendingUp,
  Brain,
  Settings,
  Navigation,
  AlertCircle,
  Leaf,
  Target,
  Plus,
  Trash2,
  Battery
} from 'lucide-react';
import { backendApi } from '@/services/backendApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface VehicleData {
  batteryLevel?: number;
  range?: number;
  efficiency?: number;
}

interface Waypoint {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'start' | 'destination' | 'waypoint' | 'charging' | 'attraction';
  estimatedStayDuration?: number;
  isRequired: boolean;
  notes?: string;
}

interface ChargingStop {
  name: string;
  location: string;
  arrivalBattery: string;
  chargingTime: string;
  departureBattery: string;
  distanceFromOrigin: string;
  cost?: string;
  chargingSpeed?: string;
  amenities?: string[];
}

interface RouteData {
  route: {
    totalDistance: string;
    totalTime: string;
    totalCost: string;
    efficiency?: string;
    energyUsed?: string;
    carbonSaved?: string;
    chargingStops?: ChargingStop[];
    routeEfficiency: string;
    weatherImpact: string;
    elevationProfile?: string;
    tips: string[];
    alternativeRoutes: string[];
  };
  environmental: {
    carbonSaved: string;
    energyUsed: string;
    efficiency: string;
  };
}

interface ConsolidatedRouteOptimizerProps {
  vehicleData?: VehicleData;
  onRouteOptimized?: (routeData: RouteData) => void;
  className?: string;
}

export default function ConsolidatedRouteOptimizer({ 
  vehicleData, 
  onRouteOptimized, 
  className 
}: ConsolidatedRouteOptimizerProps) {
  // Route planning state
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [preferences, setPreferences] = useState({
    prioritizeCharging: true,
    avoidTolls: false,
    preferScenic: false,
    minimizeTime: false,
    maximizeRange: true
  });

  // Results state
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<RouteData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Add waypoint
  const addWaypoint = () => {
    const newWaypoint: Waypoint = {
      id: `waypoint-${Date.now()}`,
      name: '',
      address: '',
      lat: 0,
      lng: 0,
      type: 'waypoint',
      isRequired: false
    };
    setWaypoints([...waypoints, newWaypoint]);
  };

  // Remove waypoint
  const removeWaypoint = (id: string) => {
    setWaypoints(waypoints.filter(w => w.id !== id));
  };

  // Update waypoint
  const updateWaypoint = (id: string, updates: Partial<Waypoint>) => {
    setWaypoints(waypoints.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  // Handle route optimization
  const handleOptimizeRoute = async () => {
    if (!origin || !destination) {
      setError('Please provide both origin and destination');
      return;
    }

    setIsOptimizing(true);
    setError(null);

    try {
      const routeRequest = {
        origin,
        destination,
        waypoints,
        preferences,
        vehicleData: {
          batteryLevel: vehicleData?.batteryLevel || 80,
          range: vehicleData?.range || 300,
          efficiency: vehicleData?.efficiency || 4.2
        }
      };

      const result = await backendApi.optimizeRoute(routeRequest);
      
      if (result.success) {
        setOptimizedRoute(result.data);
        onRouteOptimized?.(result.data);
      } else {
        setError(result.error || 'Failed to optimize route');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to optimize route');
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Route className="w-5 h-5 text-blue-500" />
              Intelligent Route Optimizer
            </CardTitle>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              AI-Powered
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="planning" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="planning">Route Planning</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="results">Optimization Results</TabsTrigger>
            </TabsList>

            <TabsContent value="planning" className="space-y-4">
              {/* Origin and Destination */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="origin">Origin</Label>
                  <Input
                    id="origin"
                    placeholder="Enter starting location"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination"
                    placeholder="Enter destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
              </div>

              {/* Waypoints */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Waypoints</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addWaypoint}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Waypoint
                  </Button>
                </div>
                
                {waypoints.map((waypoint, index) => (
                  <div key={waypoint.id} className="flex items-center gap-2 p-2 border rounded">
                    <span className="text-sm font-medium">{index + 1}</span>
                    <Input
                      placeholder="Waypoint address"
                      value={waypoint.address}
                      onChange={(e) => updateWaypoint(waypoint.id, { address: e.target.value })}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeWaypoint(waypoint.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Vehicle Status */}
              {vehicleData && (
                <Card className="bg-slate-50">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <Battery className="w-4 h-4 mx-auto mb-1 text-green-600" />
                        <p className="text-sm text-muted-foreground">Battery</p>
                        <p className="font-semibold">{vehicleData.batteryLevel}%</p>
                      </div>
                      <div>
                        <Navigation className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                        <p className="text-sm text-muted-foreground">Range</p>
                        <p className="font-semibold">{vehicleData.range} mi</p>
                      </div>
                      <div>
                        <TrendingUp className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                        <p className="text-sm text-muted-foreground">Efficiency</p>
                        <p className="font-semibold">{vehicleData.efficiency} mi/kWh</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="preferences" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-base font-medium">Route Preferences</Label>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="prioritizeCharging"
                      checked={preferences.prioritizeCharging}
                      onCheckedChange={(checked) => 
                        setPreferences({ ...preferences, prioritizeCharging: !!checked })
                      }
                    />
                    <Label htmlFor="prioritizeCharging">Prioritize charging infrastructure</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="avoidTolls"
                      checked={preferences.avoidTolls}
                      onCheckedChange={(checked) => 
                        setPreferences({ ...preferences, avoidTolls: !!checked })
                      }
                    />
                    <Label htmlFor="avoidTolls">Avoid toll roads</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="preferScenic"
                      checked={preferences.preferScenic}
                      onCheckedChange={(checked) => 
                        setPreferences({ ...preferences, preferScenic: !!checked })
                      }
                    />
                    <Label htmlFor="preferScenic">Prefer scenic routes</Label>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">Optimization Goals</Label>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="minimizeTime"
                      checked={preferences.minimizeTime}
                      onCheckedChange={(checked) => 
                        setPreferences({ ...preferences, minimizeTime: !!checked })
                      }
                    />
                    <Label htmlFor="minimizeTime">Minimize travel time</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="maximizeRange"
                      checked={preferences.maximizeRange}
                      onCheckedChange={(checked) => 
                        setPreferences({ ...preferences, maximizeRange: !!checked })
                      }
                    />
                    <Label htmlFor="maximizeRange">Maximize range efficiency</Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              {optimizedRoute ? (
                <div className="space-y-4">
                  {/* Route Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-green-500" />
                        Optimized Route Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Distance</p>
                          <p className="text-lg font-semibold">{optimizedRoute.route.totalDistance}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Time</p>
                          <p className="text-lg font-semibold">{optimizedRoute.route.totalTime}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Cost</p>
                          <p className="text-lg font-semibold">{optimizedRoute.route.totalCost}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Efficiency</p>
                          <p className="text-lg font-semibold">{optimizedRoute.route.routeEfficiency}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Environmental Impact */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Leaf className="w-5 h-5 text-green-500" />
                        Environmental Impact
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Carbon Saved</p>
                          <p className="text-lg font-semibold text-green-600">
                            {optimizedRoute.environmental.carbonSaved}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Energy Used</p>
                          <p className="text-lg font-semibold">
                            {optimizedRoute.environmental.energyUsed}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Efficiency</p>
                          <p className="text-lg font-semibold">
                            {optimizedRoute.environmental.efficiency}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Charging Stops */}
                  {optimizedRoute.route.chargingStops && optimizedRoute.route.chargingStops.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-yellow-500" />
                          Charging Stops ({optimizedRoute.route.chargingStops.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {optimizedRoute.route.chargingStops.map((stop, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded">
                              <div>
                                <p className="font-medium">{stop.name}</p>
                                <p className="text-sm text-muted-foreground">{stop.location}</p>
                              </div>
                              <div className="text-right text-sm">
                                <p>Arrival: {stop.arrivalBattery}</p>
                                <p>Charging: {stop.chargingTime}</p>
                                <p>Departure: {stop.departureBattery}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* AI Tips */}
                  {optimizedRoute.route.tips && optimizedRoute.route.tips.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Brain className="w-5 h-5 text-purple-500" />
                          AI Optimization Tips
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {optimizedRoute.route.tips.map((tip, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Route className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No optimized route yet. Plan your route in the first tab.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Optimize Button */}
          <div className="mt-6 flex gap-3">
            <Button 
              onClick={handleOptimizeRoute} 
              disabled={isOptimizing || !origin || !destination}
              className="flex-1"
            >
              {isOptimizing ? (
                <>
                  <Settings className="w-4 h-4 mr-2 animate-spin" />
                  Optimizing Route...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Optimize Route with AI
                </>
              )}
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
