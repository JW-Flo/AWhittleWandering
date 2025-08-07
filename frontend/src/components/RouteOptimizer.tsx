import React, { useState } from 'react';
import { 
  Route, 
  Zap, 
  TrendingUp,
  Brain,
  Settings,
  Navigation,
  AlertCircle,
  Leaf
} from 'lucide-react';
import { backendApi } from '@/services/backendApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface VehicleData {
  batteryLevel?: number;
  range?: number;
  efficiency?: number;
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
    confidence?: number;
    realTimeTraffic?: string;
    weatherConditions?: {
      temperature: string;
      conditions: string;
      wind: string;
    };
  };
}

interface RouteOptimizerProps {
  vehicleData?: VehicleData;
  onRouteOptimized?: (data: RouteData) => void;
}

export default function RouteOptimizer({ vehicleData: _vehicleData, onRouteOptimized: _onRouteOptimized }: RouteOptimizerProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showPlanner, setShowPlanner] = useState(false);
  const [routeData] = useState<RouteData | null>(null);
  const [formData, setFormData] = useState({
    origin: { name: 'San Francisco, CA', lat: 37.7749, lng: -122.4194 },
    destination: { name: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437 },
    preferences: {
      scenic: false,
      fastCharging: true,
      avoidTolls: false,
      maxStopTime: '45 minutes'
    }
  });

  const handleOptimizeRoute = async () => {
    if (!routeForm.startLocation || !routeForm.endLocation) {
      setOptimizationResult({
        success: false,
        error: 'Please provide both start and end locations',
        route: null
      });
      return;
    }

    setIsOptimizing(true);
    try {
      // Call backend API for route optimization
      const response = await backendApi.optimizeRoute({
        startLocation: routeForm.startLocation,
        endLocation: routeForm.endLocation,
        preferences: routeForm.preferences
      });

      if (response.success) {
        setOptimizationResult({
          success: true,
          error: null,
          route: response.route
        });
      } else {
        throw new Error(response.error || 'Route optimization failed');
      }
    } catch (error) {
      console.error('Route optimization failed:', error);
      // Fallback to mock data for development
      const mockResult = generateMockRouteData(routeForm.startLocation, routeForm.endLocation);
      setOptimizationResult({
        success: true,
        error: null,
        route: mockResult
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  // Helper function to generate mock route data for fallback
  const generateMockRouteData = (start: string, end: string) => {
    const distance = Math.floor(Math.random() * 500) + 100; // 100-600 miles
    const estimatedTime = Math.floor(distance / 65 * 60); // 65 mph average
    const energyRequired = Math.floor(distance / 4); // 4 miles per kWh

    return {
      id: `route_${Date.now()}`,
      startLocation: start,
      endLocation: end,
      distance,
      estimatedTime,
      energyRequired,
      chargingStops: distance > 250 ? [
        {
          id: 'stop_1',
          name: 'Tesla Supercharger',
          location: `${Math.round(distance / 2)} miles from start`,
          estimatedChargeTime: 25,
          chargingSpeed: 150,
          amenities: ['Restroom', 'Food', 'WiFi'],
          cost: '$0.28/kWh',
          distanceFromStart: Math.round(distance / 2)
        }
      ] : [],
      environmentalMetrics: {
        energyUsed: energyRequired,
        co2Avoided: Math.round(distance * 0.89),
        gasEquivalent: Math.round((distance / 30) * 10) / 10,
        treesEquivalent: Math.round((distance * 0.89) / 48)
      },
      vehicle: {
        currentBattery: 80,
        currentRange: 300,
        estimatedRangeAfterTrip: Math.max(0, 300 - energyRequired)
      },
      optimizedAt: new Date().toISOString()
    };
  };  return (
    <Card className="border-tesla-gray-light">
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Route className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                AI Route Optimizer
                <Badge variant="secondary" className="text-xs">Beta</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">Smart charging stop planning</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPlanner(!showPlanner)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Route Planner Form */}
        {showPlanner && (
          <div className="mb-6 p-4 bg-muted/30 rounded-lg space-y-4">
            {/* Origin & Destination */}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label htmlFor="origin" className="text-sm font-medium">From</Label>
                <Input
                  id="origin"
                  value={formData.origin.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    origin: { ...prev.origin, name: e.target.value }
                  }))}
                  placeholder="Starting location"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="destination" className="text-sm font-medium">To</Label>
                <Input
                  id="destination"
                  value={formData.destination.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    destination: { ...prev.destination, name: e.target.value }
                  }))}
                  placeholder="Destination"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Preferences */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Route Preferences</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="scenic"
                    checked={formData.preferences.scenic}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, scenic: !!checked }
                    }))}
                  />
                  <Label htmlFor="scenic" className="text-sm">Prefer scenic routes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fastCharging"
                    checked={formData.preferences.fastCharging}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, fastCharging: !!checked }
                    }))}
                  />
                  <Label htmlFor="fastCharging" className="text-sm">Minimize charging stops</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="avoidTolls"
                    checked={formData.preferences.avoidTolls}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, avoidTolls: !!checked }
                    }))}
                  />
                  <Label htmlFor="avoidTolls" className="text-sm">Avoid toll roads</Label>
                </div>
              </div>
            </div>

            {/* Optimize Button */}
            <Button
              onClick={handleOptimizeRoute}
              disabled={isOptimizing}
              className="w-full"
            >
              {isOptimizing ? (
                <>
                  <Brain className="w-4 h-4 mr-2 animate-pulse" />
                  AI is optimizing...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 mr-2" />
                  Optimize Route
                </>
              )}
            </Button>
          </div>
        )}

        {/* Optimized Route Results */}
        {routeData?.route && (
          <div className="space-y-4">
            {/* Enhanced Route Summary with Environmental Impact */}
            <div className="grid grid-cols-3 gap-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {routeData.route.totalDistance}
                </div>
                <div className="text-xs text-muted-foreground">Distance</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {routeData.route.totalTime}
                </div>
                <div className="text-xs text-muted-foreground">Travel Time</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  {routeData.route.totalCost}
                </div>
                <div className="text-xs text-muted-foreground">Charging Cost</div>
              </div>
            </div>

            {/* Environmental & Efficiency Metrics */}
            {(routeData.route.carbonSaved || routeData.route.efficiency) && (
              <div className="grid grid-cols-2 gap-4 p-3 bg-green-50 rounded-lg">
                {routeData.route.carbonSaved && (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                      <Leaf className="w-4 h-4" />
                      <span className="text-sm font-medium">Carbon Saved</span>
                    </div>
                    <div className="text-sm font-bold text-green-700">
                      {routeData.route.carbonSaved}
                    </div>
                  </div>
                )}
                {routeData.route.efficiency && (
                  <div className="text-center">
                    <div className="text-sm font-medium text-green-600 mb-1">Efficiency</div>
                    <div className="text-sm font-bold text-green-700">
                      {routeData.route.efficiency}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Charging Stops */}
            <div>
              <h4 className="font-semibold text-foreground mb-3 flex items-center">
                <Zap className="w-4 h-4 mr-2 text-blue-600" />
                Charging Stops ({routeData.route.chargingStops?.length || 0})
              </h4>
              <div className="space-y-2">
                {routeData.route.chargingStops?.map((stop: ChargingStop, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{stop.name}</div>
                      <div className="text-xs text-muted-foreground">{stop.location}</div>
                      <div className="text-xs text-muted-foreground">{stop.distanceFromOrigin}</div>
                      {stop.amenities && (
                        <div className="text-xs text-blue-600 mt-1">
                          {stop.amenities.join(' • ')}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        {stop.arrivalBattery} → {stop.departureBattery}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {stop.chargingTime}
                      </div>
                      {stop.cost && (
                        <div className="text-xs text-green-600 font-medium">
                          {stop.cost}
                        </div>
                      )}
                      {stop.chargingSpeed && (
                        <div className="text-xs text-purple-600">
                          {stop.chargingSpeed}
                        </div>
                      )}
                    </div>
                  </div>
                )) || []}
              </div>
            </div>

            {/* Efficiency & Weather Impact */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Efficiency</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {routeData.route.routeEfficiency}
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Weather</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {routeData.route.weatherImpact}
                </div>
              </div>
            </div>

            {/* AI Tips */}
            {routeData.route.tips && routeData.route.tips.length > 0 && (
              <div>
                <h4 className="font-semibold text-foreground mb-3 flex items-center">
                  <Brain className="w-4 h-4 mr-2 text-purple-600" />
                  AI Tips
                </h4>
                <div className="space-y-2">
                  {routeData.route.tips.map((tip: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-muted-foreground">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alternative Routes */}
            {routeData.route.alternativeRoutes && routeData.route.alternativeRoutes.length > 0 && (
              <div>
                <h4 className="font-semibold text-foreground mb-3">Alternative Routes</h4>
                <div className="space-y-1">
                  {routeData.route.alternativeRoutes.map((alt: string, index: number) => (
                    <div key={index} className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                      • {alt}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        {!showPlanner && !routeData && (
          <div className="text-center py-6">
            <Brain className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground mb-4">
              Let AI plan your optimal Tesla route with smart charging stops
            </p>
            <Button onClick={() => setShowPlanner(true)}>
              Plan Route
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
