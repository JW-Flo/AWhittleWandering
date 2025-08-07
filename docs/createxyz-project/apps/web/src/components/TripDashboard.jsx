import React from "react";
import {
  Battery,
  Thermometer,
  Gauge,
  MapPin,
  Clock,
  Zap,
  Brain,
  Cloud,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Route,
} from "lucide-react";

export default function TripDashboard({
  vehicleData,
  waypoints = [],
  activeTrip,
  aiInsights,
  weatherData,
}) {
  const formatDistance = (meters) => {
    if (!meters) return "0 mi";
    const miles = meters * 0.000621371;
    return `${miles.toFixed(1)} mi`;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "0m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatDurationFromHours = (hours) => {
    if (!hours) return "0h";
    const wholeHours = Math.floor(hours);
    const minutes = Math.floor((hours % 1) * 60);
    return wholeHours > 0 ? `${wholeHours}h ${minutes}m` : `${minutes}m`;
  };

  // Use real trip statistics from Tesla API
  const tripStats = vehicleData?.tripStats || {};
  const totalMiles = tripStats.totalMiles || 0;
  const totalTime = tripStats.totalTime || 0;
  const chargingSessions = tripStats.chargingSessions || 0;
  const startDate = tripStats.startDate;

  const calculateTotalDistance = () => {
    // Use real trip data if available, otherwise fallback to waypoint calculation
    if (totalMiles > 0) {
      return totalMiles * 1609.34; // Convert miles to meters for consistent formatting
    }

    if (!waypoints.length || !vehicleData?.location) return 0;
    // Simplified distance calculation - in real app would use routing API
    let total = 0;
    let lastPoint = vehicleData.location;

    waypoints.forEach((waypoint) => {
      const distance = getDistanceBetweenPoints(
        lastPoint.latitude,
        lastPoint.longitude,
        waypoint.lat,
        waypoint.lng,
      );
      total += distance;
      lastPoint = { latitude: waypoint.lat, longitude: waypoint.lng };
    });

    return total;
  };

  const getDistanceBetweenPoints = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const estimatedRange =
    vehicleData?.estimatedRange ||
    vehicleData?.range ||
    (vehicleData?.batteryLevel ? (vehicleData.batteryLevel / 100) * 400 : 0);

  const getBatteryColor = (level) => {
    if (level > 50) return "bg-green-100 text-green-600";
    if (level > 20) return "bg-yellow-100 text-yellow-600";
    return "bg-red-100 text-red-600";
  };

  const getEfficiencyRating = (efficiency) => {
    if (!efficiency) return { rating: "Unknown", color: "gray" };
    if (efficiency < 250) return { rating: "Excellent", color: "green" };
    if (efficiency < 300) return { rating: "Good", color: "blue" };
    if (efficiency < 350) return { rating: "Average", color: "yellow" };
    return { rating: "Poor", color: "red" };
  };

  const getTripDuration = () => {
    if (totalTime > 0) {
      return formatDurationFromHours(totalTime);
    }
    // Fallback calculation
    return formatDuration((calculateTotalDistance() / 1000) * 45);
  };

  return (
    <div className="space-y-4">
      {/* Trip Overview Banner */}
      {startDate && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">
              Trip from Monroe, NC
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Started:</span>
              <div className="font-medium">
                {new Date(startDate).toLocaleDateString()}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Distance:</span>
              <div className="font-medium text-blue-700">
                {Math.round(totalMiles)} miles
              </div>
            </div>
            <div>
              <span className="text-gray-600">Duration:</span>
              <div className="font-medium">{getTripDuration()}</div>
            </div>
          </div>
        </div>
      )}

      {/* AI Insights Card */}
      {aiInsights && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Brain className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">AI Insights</h3>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-700">{aiInsights.insight}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">
                {aiInsights.recommendation}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  aiInsights.efficiency_rating === "Excellent"
                    ? "bg-green-100 text-green-700"
                    : aiInsights.efficiency_rating === "Good"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {aiInsights.efficiency_rating}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Weather Integration */}
      {weatherData && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <div className="flex items-center space-x-3">
            <Cloud className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">
                  {weatherData.location?.name}
                </span>
                <span className="text-2xl font-bold text-blue-600">
                  {weatherData.current?.temp_f}°F
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-gray-600">
                  {weatherData.current?.condition?.text}
                </span>
                <div className="text-xs text-gray-500">
                  Wind: {weatherData.current?.wind_mph} mph
                </div>
              </div>
            </div>
            {weatherData.current?.condition?.icon && (
              <img
                src={`https:${weatherData.current.condition.icon}`}
                alt="Weather"
                className="h-8 w-8"
              />
            )}
          </div>
        </div>
      )}

      {/* Vehicle Status */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Vehicle Status
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-lg ${getBatteryColor(vehicleData?.batteryLevel || 0)}`}
            >
              <Battery className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Battery</p>
              <p className="text-lg font-semibold text-gray-900">
                {vehicleData?.batteryLevel || 0}%
              </p>
              {vehicleData?.batteryLevel < 20 && (
                <p className="text-xs text-red-600 flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Low
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Gauge className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Range</p>
              <p className="text-lg font-semibold text-gray-900">
                {Math.round(estimatedRange)} mi
              </p>
              {vehicleData?.speed > 0 && (
                <p className="text-xs text-gray-500">
                  Speed: {vehicleData.speed} mph
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Thermometer className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Temperature</p>
              <p className="text-lg font-semibold text-gray-900">
                {vehicleData?.temperature ||
                  weatherData?.current?.temp_f ||
                  "--"}
                °F
              </p>
              {vehicleData?.outsideTemp && (
                <p className="text-xs text-gray-500">
                  Outside: {vehicleData.outsideTemp}°F
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-lg ${
                vehicleData?.chargingState === "Charging"
                  ? "bg-green-100"
                  : "bg-purple-100"
              }`}
            >
              <Zap
                className={`h-5 w-5 ${
                  vehicleData?.chargingState === "Charging"
                    ? "text-green-600 animate-pulse"
                    : "text-purple-600"
                }`}
              />
            </div>
            <div>
              <p className="text-sm text-gray-600">Charging</p>
              <p className="text-lg font-semibold text-gray-900">
                {vehicleData?.chargingState || "Disconnected"}
              </p>
              {vehicleData?.chargePower > 0 &&
                vehicleData.chargingState === "Charging" && (
                  <p className="text-xs text-green-600">
                    {vehicleData.chargePower} kW
                  </p>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Trip Statistics - Using Real Data */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Trip Statistics
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Route className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Total Distance</span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {Math.round(totalMiles)} miles
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Trip Duration</span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {getTripDuration()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Charging Sessions</span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {chargingSessions}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Waypoints</span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {waypoints.length}
            </span>
          </div>

          {vehicleData?.odometer && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Gauge className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Odometer</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {Math.round(vehicleData.odometer).toLocaleString()} miles
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Energy Efficiency */}
      {vehicleData?.efficiency && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Energy Efficiency
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Current Efficiency</span>
              <span className="text-sm font-medium text-gray-900">
                {vehicleData.efficiency} Wh/mi
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (300 / vehicleData.efficiency) * 100)}%`,
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">
              Lower is better. Target: &lt;300 Wh/mi
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="space-y-2">
          <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Find Superchargers
          </button>
          <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            Export Trip Data
          </button>
          <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            Generate Journal Entry
          </button>
        </div>
      </div>
    </div>
  );
}
