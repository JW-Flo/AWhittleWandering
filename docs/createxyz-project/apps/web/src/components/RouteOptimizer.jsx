import React, { useState } from 'react';
import { 
  Route, 
  MapPin, 
  Zap, 
  Clock, 
  DollarSign, 
  TrendingUp,
  Brain,
  Settings,
  Navigation,
  AlertCircle
} from 'lucide-react';

export default function RouteOptimizer({ vehicleData, onRouteOptimized }) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showPlanner, setShowPlanner] = useState(false);
  const [routeData, setRouteData] = useState(null);
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
    setIsOptimizing(true);
    try {
      const response = await fetch('/api/route/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          origin: formData.origin,
          destination: formData.destination,
          vehicleData,
          preferences: formData.preferences
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRouteData(data);
        onRouteOptimized?.(data);
      } else {
        throw new Error('Failed to optimize route');
      }
    } catch (error) {
      console.error('Route optimization error:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Route className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">AI Route Optimizer</h3>
            <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
              Beta
            </span>
          </div>
          <button
            onClick={() => setShowPlanner(!showPlanner)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Route Planner Form */}
      {showPlanner && (
        <div className="p-4 border-b bg-gray-50">
          <div className="space-y-4">
            {/* Origin & Destination */}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From
                </label>
                <input
                  type="text"
                  value={formData.origin.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    origin: { ...prev.origin, name: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Starting location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To
                </label>
                <input
                  type="text"
                  value={formData.destination.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    destination: { ...prev.destination, name: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Destination"
                />
              </div>
            </div>

            {/* Preferences */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Route Preferences
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.preferences.scenic}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, scenic: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Prefer scenic routes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.preferences.fastCharging}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, fastCharging: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Minimize charging stops</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.preferences.avoidTolls}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, avoidTolls: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Avoid toll roads</span>
                </label>
              </div>
            </div>

            {/* Optimize Button */}
            <button
              onClick={handleOptimizeRoute}
              disabled={isOptimizing}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isOptimizing ? (
                <>
                  <Brain className="h-4 w-4 animate-pulse" />
                  <span>AI is optimizing...</span>
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4" />
                  <span>Optimize Route</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Optimized Route Results */}
      {routeData?.route && (
        <div className="p-4">
          <div className="space-y-4">
            {/* Route Summary */}
            <div className="grid grid-cols-3 gap-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {routeData.route.totalDistance}
                </div>
                <div className="text-xs text-gray-600">Distance</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {routeData.route.totalTime}
                </div>
                <div className="text-xs text-gray-600">Travel Time</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  {routeData.route.totalCost}
                </div>
                <div className="text-xs text-gray-600">Charging Cost</div>
              </div>
            </div>

            {/* Charging Stops */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Zap className="h-4 w-4 mr-2 text-blue-600" />
                Charging Stops ({routeData.route.chargingStops?.length || 0})
              </h4>
              <div className="space-y-2">
                {routeData.route.chargingStops?.map((stop, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{stop.name}</div>
                      <div className="text-xs text-gray-500">{stop.location}</div>
                      <div className="text-xs text-gray-500">{stop.distanceFromOrigin}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        {stop.arrivalBattery} → {stop.departureBattery}
                      </div>
                      <div className="text-xs text-gray-500">
                        {stop.chargingTime}
                      </div>
                    </div>
                  </div>
                )) || []}
              </div>
            </div>

            {/* Efficiency & Weather Impact */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Efficiency</span>
                </div>
                <div className="text-xs text-gray-600">
                  {routeData.route.routeEfficiency}
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Weather</span>
                </div>
                <div className="text-xs text-gray-600">
                  {routeData.route.weatherImpact}
                </div>
              </div>
            </div>

            {/* AI Tips */}
            {routeData.route.tips && routeData.route.tips.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Brain className="h-4 w-4 mr-2 text-purple-600" />
                  AI Tips
                </h4>
                <div className="space-y-2">
                  {routeData.route.tips.map((tip, index) => (
                    <div key={index} className="flex items-start space-x-2 text-sm">
                      <div className="h-1.5 w-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alternative Routes */}
            {routeData.route.alternativeRoutes && routeData.route.alternativeRoutes.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Alternative Routes</h4>
                <div className="space-y-1">
                  {routeData.route.alternativeRoutes.map((alt, index) => (
                    <div key={index} className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                      • {alt}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {!showPlanner && !routeData && (
        <div className="p-4">
          <div className="text-center py-6">
            <Brain className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-600 mb-4">
              Let AI plan your optimal Tesla route with smart charging stops
            </p>
            <button
              onClick={() => setShowPlanner(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Plan Route
            </button>
          </div>
        </div>
      )}
    </div>
  );
}