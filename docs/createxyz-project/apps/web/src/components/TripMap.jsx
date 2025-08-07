import React, { useState, useCallback } from "react";
import { Map, AdvancedMarker, InfoWindow } from "@vis.gl/react-google-maps";
import {
  MapPin,
  Zap,
  Navigation,
  Cloud,
  Thermometer,
  Wind,
  Brain,
  Star,
} from "lucide-react";

export default function TripMap({
  waypoints = [],
  vehicleData,
  weatherData,
  onWaypointAdd,
}) {
  const [selectedWaypoint, setSelectedWaypoint] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 35.0001, lng: -80.5493 }); // Monroe, NC
  const [showWeatherOverlay, setShowWeatherOverlay] = useState(true);

  // Update map center when vehicle data is available
  React.useEffect(() => {
    if (vehicleData?.location) {
      setMapCenter({
        lat: vehicleData.location.latitude,
        lng: vehicleData.location.longitude,
      });
    }
  }, [vehicleData]);

  const handleMapClick = useCallback(
    (event) => {
      if (event.detail.latLng) {
        const newWaypoint = {
          id: Date.now(),
          lat: event.detail.latLng.lat,
          lng: event.detail.latLng.lng,
          name: `Waypoint ${waypoints.length + 1}`,
          type: "custom",
          timestamp: new Date().toISOString(),
        };
        onWaypointAdd?.(newWaypoint);
      }
    },
    [waypoints.length, onWaypointAdd],
  );

  const getMarkerColor = (waypoint) => {
    switch (waypoint.type) {
      case "supercharger":
        return "bg-blue-600 text-white";
      case "charging":
        return "bg-green-600 text-white";
      case "custom":
        return "bg-purple-600 text-white";
      case "waypoint":
        return "bg-gray-600 text-white";
      default:
        return "bg-orange-600 text-white";
    }
  };

  return (
    <div className="w-full h-full relative">
      <Map
        defaultCenter={mapCenter}
        center={mapCenter}
        defaultZoom={12}
        gestureHandling="greedy"
        disableDefaultUI={false}
        onClick={handleMapClick}
        mapTypeId="roadmap"
        style={{ width: "100%", height: "100%" }}
      >
        {/* Vehicle Current Location */}
        {vehicleData?.location && (
          <AdvancedMarker
            position={{
              lat: vehicleData.location.latitude,
              lng: vehicleData.location.longitude,
            }}
            title="Current Tesla Location"
          >
            <div className="bg-red-600 text-white p-3 rounded-full shadow-lg border-2 border-white">
              <Navigation className="h-6 w-6" />
            </div>
          </AdvancedMarker>
        )}

        {/* Waypoints */}
        {waypoints.map((waypoint) => (
          <AdvancedMarker
            key={waypoint.id}
            position={{ lat: waypoint.lat, lng: waypoint.lng }}
            onClick={() => setSelectedWaypoint(waypoint)}
            title={waypoint.name}
          >
            <div
              className={`p-2 rounded-full shadow-lg border-2 border-white ${getMarkerColor(waypoint)}`}
            >
              {waypoint.type === "supercharger" ||
              waypoint.type === "charging" ? (
                <Zap className="h-4 w-4" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
            </div>
          </AdvancedMarker>
        ))}

        {/* Enhanced Info Window */}
        {selectedWaypoint && (
          <InfoWindow
            position={{ lat: selectedWaypoint.lat, lng: selectedWaypoint.lng }}
            onClose={() => setSelectedWaypoint(null)}
          >
            <div className="p-3 min-w-48">
              <div className="flex items-center space-x-2 mb-2">
                {selectedWaypoint.type === "supercharger" ||
                selectedWaypoint.type === "charging" ? (
                  <Zap className="h-4 w-4 text-blue-600" />
                ) : (
                  <MapPin className="h-4 w-4 text-green-600" />
                )}
                <h3 className="font-semibold text-gray-900">
                  {selectedWaypoint.name}
                </h3>
              </div>

              <p className="text-sm text-gray-600 mb-2">
                {selectedWaypoint.type === "supercharger"
                  ? "Tesla Supercharger"
                  : selectedWaypoint.type === "charging"
                    ? "Charging Stop"
                    : selectedWaypoint.type === "custom"
                      ? "Custom Waypoint"
                      : "Trip Location"}
              </p>

              {selectedWaypoint.address && (
                <p className="text-xs text-gray-500 mb-2">
                  {selectedWaypoint.address}
                </p>
              )}

              {selectedWaypoint.timestamp && (
                <p className="text-xs text-gray-500 mb-2">
                  {new Date(selectedWaypoint.timestamp).toLocaleDateString()} at{" "}
                  {new Date(selectedWaypoint.timestamp).toLocaleTimeString()}
                </p>
              )}

              {/* Duration info for stops */}
              {selectedWaypoint.duration && (
                <div className="text-xs text-gray-600 mb-2">
                  <span className="font-medium">
                    Duration: {selectedWaypoint.duration} minutes
                  </span>
                </div>
              )}

              {/* Supercharger Details */}
              {selectedWaypoint.type === "supercharger" && (
                <div className="space-y-1 text-xs text-gray-600">
                  {selectedWaypoint.available_stalls && (
                    <div className="flex justify-between">
                      <span>Available:</span>
                      <span className="font-medium">
                        {selectedWaypoint.available_stalls}/
                        {selectedWaypoint.total_stalls} stalls
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Charging Status */}
              {selectedWaypoint.isCharging && (
                <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                  <div className="flex items-center space-x-1">
                    <Zap className="h-3 w-3 text-green-600" />
                    <span className="font-medium text-green-800">
                      Charging Session
                    </span>
                  </div>
                </div>
              )}
            </div>
          </InfoWindow>
        )}
      </Map>

      {/* Enhanced Map Controls */}
      <div className="absolute top-4 right-4 space-y-2">
        {/* Center on Tesla Control */}
        <div className="bg-white rounded-lg shadow-lg p-2">
          <button
            onClick={() => {
              if (vehicleData?.location) {
                setMapCenter({
                  lat: vehicleData.location.latitude,
                  lng: vehicleData.location.longitude,
                });
              }
            }}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md w-full"
            disabled={!vehicleData?.location}
          >
            <Navigation className="h-4 w-4" />
            <span>Center on Tesla</span>
          </button>
        </div>

        {/* Weather Toggle */}
        {weatherData && (
          <div className="bg-white rounded-lg shadow-lg p-2">
            <button
              onClick={() => setShowWeatherOverlay(!showWeatherOverlay)}
              className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md w-full transition-colors ${
                showWeatherOverlay
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Cloud className="h-4 w-4" />
              <span>Weather</span>
            </button>
          </div>
        )}
      </div>

      {/* Weather Overlay */}
      {showWeatherOverlay && weatherData && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
          <div className="flex items-center space-x-3 mb-2">
            <Cloud className="h-5 w-5 text-blue-600" />
            <div>
              <h4 className="font-semibold text-gray-900">
                {weatherData.location?.name}
              </h4>
              <p className="text-sm text-gray-600">
                {weatherData.current?.condition?.text}
              </p>
            </div>
            {weatherData.current?.condition?.icon && (
              <img
                src={`https:${weatherData.current.condition.icon}`}
                alt="Weather"
                className="h-8 w-8"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <Thermometer className="h-3 w-3" />
              <span>{weatherData.current?.temp_f}°F</span>
            </div>
            <div className="flex items-center space-x-1">
              <Wind className="h-3 w-3" />
              <span>{weatherData.current?.wind_mph} mph</span>
            </div>
            <div>Humidity: {weatherData.current?.humidity}%</div>
            {weatherData.current?.uv && (
              <div>UV Index: {weatherData.current?.uv}</div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Instructions */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
        <div className="flex items-center space-x-2 mb-2">
          <Brain className="h-4 w-4 text-purple-600" />
          <span className="font-medium text-sm">Smart Map</span>
        </div>
        <div className="space-y-1 text-xs text-gray-600">
          <p>• Click anywhere to add a waypoint</p>
          <p>• Click markers for detailed info</p>
          <p>• Red marker shows current Tesla location</p>
        </div>
      </div>

      {/* Real-time Status Badge */}
      {vehicleData && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-lg px-4 py-2">
          <div className="flex items-center space-x-3 text-sm">
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="font-medium">Live</span>
            </div>
            <div className="text-gray-500">|</div>
            <div className="flex items-center space-x-1">
              <span>{vehicleData.speed || 0} mph</span>
            </div>
            <div className="text-gray-500">|</div>
            <div className="flex items-center space-x-1">
              <span>{vehicleData.batteryLevel || 0}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
