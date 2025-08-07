import React, { useState, useEffect, useCallback } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import TripMap from "../components/TripMap";
import TripDashboard from "../components/TripDashboard";
import JourneyJournal from "../components/JourneyJournal";
import RouteOptimizer from "../components/RouteOptimizer";
import {
  Car,
  MapPin,
  BookOpen,
  Battery,
  Brain,
  Cloud,
  Route,
  AlertTriangle,
} from "lucide-react";

export default function HomePage() {
  const [activeTrip, setActiveTrip] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  const [vehicleData, setVehicleData] = useState(null);
  const [journalEntries, setJournalEntries] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [isGeneratingEntry, setIsGeneratingEntry] = useState(false);
  const [previousVehicleData, setPreviousVehicleData] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, journal, route

  // Check if Google Maps API key is available
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Fetch Tesla data from enhanced API
  useEffect(() => {
    fetchTeslaData();
    const interval = setInterval(fetchTeslaData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Auto-generate journal entries based on vehicle state changes
  useEffect(() => {
    if (vehicleData && previousVehicleData) {
      checkForAutoJournalEvents();
    }
    setPreviousVehicleData(vehicleData);
  }, [vehicleData]);

  const fetchTeslaData = async () => {
    try {
      const response = await fetch("/api/tesla/data");
      if (response.ok) {
        const data = await response.json();
        setVehicleData(data.vehicle);
        setWaypoints(data.waypoints || []);
        setAiInsights(data.insights);
        setWeatherData(data.weather);
      }
    } catch (error) {
      console.error("Failed to fetch Tesla data:", error);
    }
  };

  const checkForAutoJournalEvents = useCallback(async () => {
    if (!vehicleData || !previousVehicleData || isGeneratingEntry) return;

    let eventType = null;
    let eventData = null;

    // Check for charging events
    if (
      vehicleData.chargingState === "Charging" &&
      previousVehicleData.chargingState !== "Charging"
    ) {
      eventType = "charging_started";
    } else if (
      vehicleData.chargingState !== "Charging" &&
      previousVehicleData.chargingState === "Charging"
    ) {
      eventType = "charging_completed";
    }
    // Check for significant location change
    else if (vehicleData.location && previousVehicleData.location) {
      const distance = calculateDistance(
        vehicleData.location,
        previousVehicleData.location,
      );
      if (distance > 10) {
        // 10 miles
        eventType = "location_change";
      }
    }
    // Check for efficiency milestones
    else if (
      vehicleData.efficiency &&
      vehicleData.efficiency < 250 &&
      Math.random() > 0.95
    ) {
      eventType = "efficiency_milestone";
    }
    // Check for low battery warnings
    else if (
      vehicleData.batteryLevel < 20 &&
      previousVehicleData.batteryLevel >= 20
    ) {
      eventType = "low_battery_warning";
    }

    if (eventType) {
      await generateAutoJournalEntry(eventType, eventData);
    }
  }, [vehicleData, previousVehicleData, isGeneratingEntry]);

  const generateAutoJournalEntry = async (eventType, eventData) => {
    if (isGeneratingEntry) return;

    setIsGeneratingEntry(true);
    try {
      const response = await fetch("/api/journal/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vehicleData,
          location: eventData?.location || {
            name: "Current Location",
            lat: vehicleData.location?.latitude,
            lng: vehicleData.location?.longitude,
          },
          eventType,
          previousLocation: eventData?.previousLocation,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setJournalEntries((prev) => [data.entry, ...prev]);
      }
    } catch (error) {
      console.error("Failed to generate auto journal entry:", error);
    } finally {
      setIsGeneratingEntry(false);
    }
  };

  const calculateDistance = (loc1, loc2) => {
    const R = 3959; // Earth's radius in miles
    const dLat = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
    const dLon = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((loc1.latitude * Math.PI) / 180) *
        Math.cos((loc2.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const addJournalEntry = (entry) => {
    setJournalEntries((prev) => [entry, ...prev]);
  };

  const handleRouteOptimized = (routeData) => {
    // Add optimized route waypoints to the map
    if (routeData.waypoints) {
      setWaypoints((prev) => [...prev, ...routeData.waypoints]);
    }

    // Generate a journal entry about the route optimization
    if (routeData.route) {
      const optimizationEntry = {
        id: `route-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "route_optimization",
        autoGenerated: true,
        title: "Route Optimized",
        content: `AI has optimized your route! Total distance: ${routeData.route.totalDistance}, estimated time: ${routeData.route.totalTime} with ${routeData.route.chargingStops?.length || 0} charging stops. ${routeData.route.tips?.[0] || "Have a great trip!"}`,
        mood: "excited",
        tags: ["ai", "route", "optimization"],
      };
      setJournalEntries((prev) => [optimizationEntry, ...prev]);
    }
  };

  // Map component with API key check
  const MapSection = () => {
    if (!googleMapsApiKey) {
      return (
        <div className="h-96 lg:h-[600px] bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Google Maps API Key Required
            </h3>
            <p className="text-sm text-gray-600 max-w-md">
              To view the interactive map, please configure your Google Maps API
              key in the environment variables as
              NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
            </p>
            <div className="mt-4 bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">
                Current Trip Data:
              </h4>
              <div className="text-left text-sm space-y-1">
                {vehicleData?.location && (
                  <p>
                    📍 Location: {vehicleData.location.latitude.toFixed(4)},{" "}
                    {vehicleData.location.longitude.toFixed(4)}
                  </p>
                )}
                <p>🔋 Battery: {vehicleData?.batteryLevel || 0}%</p>
                <p>📊 Range: {vehicleData?.range || 0} miles</p>
                <p>📍 Waypoints: {waypoints.length}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <APIProvider apiKey={googleMapsApiKey}>
        <div className="h-96 lg:h-[600px]">
          <TripMap
            waypoints={waypoints}
            vehicleData={vehicleData}
            weatherData={weatherData}
            onWaypointAdd={(waypoint) =>
              setWaypoints((prev) => [...prev, waypoint])
            }
          />
        </div>
      </APIProvider>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header with Status Indicators */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Car className="h-8 w-8 text-red-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Tesla Roadtrip Tracker
              </h1>
            </div>
            <div className="flex items-center space-x-6">
              {/* AI Status */}
              {aiInsights && (
                <div className="flex items-center space-x-2 text-sm text-purple-600">
                  <Brain className="h-4 w-4" />
                  <span>AI Active</span>
                </div>
              )}
              {/* Weather Status */}
              {weatherData && (
                <div className="flex items-center space-x-2 text-sm text-blue-600">
                  <Cloud className="h-4 w-4" />
                  <span>{weatherData.current?.temp_f}°F</span>
                </div>
              )}
              {/* Battery Status */}
              {vehicleData && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Battery className="h-4 w-4" />
                  <span>{vehicleData.batteryLevel}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* AI Insights Banner */}
      {aiInsights && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center space-x-3">
              <Brain className="h-5 w-5" />
              <div>
                <p className="font-medium">{aiInsights.insight}</p>
                <p className="text-sm opacity-90">
                  {aiInsights.recommendation}
                </p>
              </div>
              <div className="ml-auto">
                <span className="px-2 py-1 bg-white bg-opacity-20 rounded text-xs">
                  {aiInsights.efficiency_rating}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      Live Trip Map
                    </h2>
                  </div>
                  {isGeneratingEntry && (
                    <div className="flex items-center space-x-2 text-sm text-purple-600">
                      <Brain className="h-4 w-4 animate-pulse" />
                      <span>AI Writing...</span>
                    </div>
                  )}
                </div>
              </div>
              <MapSection />
            </div>
          </div>

          {/* Enhanced Sidebar with Tabs */}
          <div className="space-y-6">
            {/* Sidebar Tab Navigation */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`flex-1 px-4 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
                    activeTab === "dashboard"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Battery className="h-4 w-4" />
                    <span>Dashboard</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("journal")}
                  className={`flex-1 px-4 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
                    activeTab === "journal"
                      ? "border-green-600 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <BookOpen className="h-4 w-4" />
                    <span>Journal</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("route")}
                  className={`flex-1 px-4 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
                    activeTab === "route"
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Route className="h-4 w-4" />
                    <span>Route AI</span>
                  </div>
                </button>
              </div>

              {/* Tab Content */}
              <div className="min-h-96">
                {activeTab === "dashboard" && (
                  <div className="p-4">
                    <TripDashboard
                      vehicleData={vehicleData}
                      waypoints={waypoints}
                      activeTrip={activeTrip}
                      aiInsights={aiInsights}
                      weatherData={weatherData}
                    />
                  </div>
                )}

                {activeTab === "journal" && (
                  <div>
                    <div className="p-4 border-b">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-5 w-5 text-green-600" />
                        <h2 className="text-lg font-semibold text-gray-900">
                          Smart Journey Journal
                        </h2>
                        <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded-full">
                          AI Powered
                        </span>
                      </div>
                    </div>
                    <JourneyJournal
                      entries={journalEntries}
                      onAddEntry={addJournalEntry}
                      currentLocation={vehicleData?.location}
                      isAutoGenerating={isGeneratingEntry}
                      onGenerateEntry={(eventType) =>
                        generateAutoJournalEntry(eventType, null)
                      }
                    />
                  </div>
                )}

                {activeTab === "route" && (
                  <RouteOptimizer
                    vehicleData={vehicleData}
                    onRouteOptimized={handleRouteOptimized}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
