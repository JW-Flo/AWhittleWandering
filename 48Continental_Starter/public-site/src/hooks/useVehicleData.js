/* eslint-env browser */
import { useState, useEffect, useCallback } from "react";

/**
 * Hook for fetching and managing vehicle data
 * Enhanced with real Tessie API integration and WebSocket streaming
 */
export const useVehicleData = ({
  enableStreaming = true,
  pollInterval = 30000,
} = {}) => {
  const [vehicleData, setVehicleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [lastUpdated, setLastUpdated] = useState(null);

  // Enhanced vehicle data with more realistic simulation
  const generateEnhancedSimulatedData = useCallback(() => {
    const now = new Date();
    const timeOfDay = now.getHours();
    const dayOfYear = Math.floor(
      (now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
    );

    // Simulate movement along the 48 continental states route
    // Starting from Texas and moving through the planned itinerary
    const routeProgress = (dayOfYear % 60) / 60; // 60-day cycle

    // Route coordinates (simplified version of the actual itinerary)
    const routePoints = [
      { lat: 27.8006, lng: -97.3964, state: "TX", city: "Corpus Christi" },
      { lat: 29.7604, lng: -95.3698, state: "TX", city: "Houston" },
      { lat: 30.2672, lng: -97.7431, state: "TX", city: "Austin" },
      { lat: 32.7767, lng: -96.797, state: "TX", city: "Dallas" },
      { lat: 29.9511, lng: -90.0715, state: "LA", city: "New Orleans" },
      { lat: 30.6944, lng: -88.0431, state: "MS", city: "Biloxi" },
      { lat: 32.3617, lng: -86.2792, state: "AL", city: "Montgomery" },
      { lat: 25.7617, lng: -80.1918, state: "FL", city: "Miami" },
      { lat: 28.5383, lng: -81.3792, state: "FL", city: "Orlando" },
      { lat: 33.749, lng: -84.388, state: "GA", city: "Atlanta" },
      { lat: 35.2271, lng: -80.8431, state: "NC", city: "Charlotte" },
      { lat: 38.9072, lng: -77.0369, state: "DC", city: "Washington" },
      { lat: 40.7128, lng: -74.006, state: "NY", city: "New York" },
      { lat: 42.3601, lng: -71.0589, state: "MA", city: "Boston" },
      { lat: 41.8781, lng: -87.6298, state: "IL", city: "Chicago" },
      { lat: 44.9778, lng: -93.265, state: "MN", city: "Minneapolis" },
      { lat: 39.7392, lng: -104.9903, state: "CO", city: "Denver" },
      { lat: 36.1627, lng: -115.1731, state: "NV", city: "Las Vegas" },
      { lat: 34.0522, lng: -118.2437, state: "CA", city: "Los Angeles" },
      { lat: 37.7749, lng: -122.4194, state: "CA", city: "San Francisco" },
      { lat: 47.6062, lng: -122.3321, state: "WA", city: "Seattle" },
    ];

    // Calculate current position based on route progress
    const currentIndex = Math.floor(routeProgress * (routePoints.length - 1));
    const nextIndex = Math.min(currentIndex + 1, routePoints.length - 1);
    const segmentProgress =
      routeProgress * (routePoints.length - 1) - currentIndex;

    const currentPoint = routePoints[currentIndex];
    const nextPoint = routePoints[nextIndex];

    // Interpolate between current and next point
    const latitude =
      currentPoint.lat + (nextPoint.lat - currentPoint.lat) * segmentProgress;
    const longitude =
      currentPoint.lng + (nextPoint.lng - currentPoint.lng) * segmentProgress;

    // Battery level varies throughout the day (charging cycles)
    let batteryLevel;
    if (timeOfDay >= 6 && timeOfDay <= 8) {
      batteryLevel = 85 + Math.random() * 10; // Morning charge
    } else if (timeOfDay >= 12 && timeOfDay <= 14) {
      batteryLevel = 60 + Math.random() * 25; // Midday
    } else if (timeOfDay >= 18 && timeOfDay <= 22) {
      batteryLevel = 70 + Math.random() * 25; // Evening charge
    } else {
      batteryLevel = 30 + Math.random() * 40; // Night/travel
    }

    // Speed varies by time of day and location
    let speed = 0;
    if (timeOfDay >= 7 && timeOfDay <= 19) {
      // Driving hours - vary speed based on location type
      if (
        currentPoint.city.includes("Los Angeles") ||
        currentPoint.city.includes("New York")
      ) {
        speed = 25 + Math.random() * 35; // City traffic
      } else {
        speed = 55 + Math.random() * 25; // Highway speeds
      }
    }

    // Charging status
    const isCharging = batteryLevel > 90 || (batteryLevel < 20 && speed === 0);

    // Calculate range based on battery level and conditions
    const baseRange = 358; // Model 3 Long Range EPA rating
    const rangeMultiplier = batteryLevel / 100;
    const weatherImpact = 0.85 + Math.random() * 0.3; // Weather affects range
    const range = Math.round(baseRange * rangeMultiplier * weatherImpact);

    return {
      id: "tessie-vehicle-12345",
      name: "The Wandering Whittle",
      model: "Model 3 Long Range",
      batteryLevel: Math.round(batteryLevel),
      range: range,
      speed: Math.round(speed),
      power: isCharging
        ? -(50 + Math.random() * 200) // Negative when charging
        : speed > 0
        ? 15 + Math.random() * 25 // Positive when driving
        : 0, // Zero when parked
      charging: isCharging,
      location: {
        latitude: latitude,
        longitude: longitude,
        heading: Math.round(Math.random() * 360),
      },
      // For backward compatibility
      latitude: latitude,
      longitude: longitude,
      currentState: currentPoint.state,
      currentCity: currentPoint.city,
      climate: {
        insideTemp: 72 + Math.random() * 6 - 3, // 69-75°F
        outsideTemp: 45 + Math.random() * 40, // 45-85°F
        enabled: Math.random() > 0.3, // Climate on 70% of the time
        temperature: 72,
      },
      odometer: 45123 + Math.round(routeProgress * 15000), // Accumulating miles
      locked: !isCharging && speed === 0,
      sentry_mode: speed === 0 && !isCharging && Math.random() > 0.5,
      tire_pressure: {
        front_left: 42 + Math.random() * 2 - 1,
        front_right: 42 + Math.random() * 2 - 1,
        rear_left: 42 + Math.random() * 2 - 1,
        rear_right: 42 + Math.random() * 2 - 1,
      },
      last_updated: new Date().toISOString(),
      // Trip context
      tripDay: Math.floor(routeProgress * 60) + 1,
      routeProgress: Math.round(routeProgress * 100),
      visitedStates: routePoints
        .slice(0, currentIndex + 1)
        .map((point) => point.state)
        .filter((state, index, self) => self.indexOf(state) === index),
    };
  }, []);

  const fetchVehicleData = useCallback(async () => {
    try {
      setConnectionStatus("connecting");

      // Try to fetch from the edge worker API
      const apiUrl =
        import.meta.env.VITE_EDGE_WORKER_URL ||
        import.meta.env.VITE_API_BASE_URL ||
        "http://localhost:8787";

      const response = await fetch(`${apiUrl}/api/vehicle`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Add timeout
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();

      // Check if we got an error response
      if (data.error) {
        throw new Error(data.message || data.error);
      }

      // Transform the data to ensure consistent format
      const transformedData = {
        ...data,
        // Ensure location data is properly formatted
        location: data.location || {
          latitude: data.latitude,
          longitude: data.longitude,
          heading: data.heading || 0,
        },
        // Ensure we have both formats for backward compatibility
        latitude: data.location?.latitude || data.latitude,
        longitude: data.location?.longitude || data.longitude,
        last_updated: data.last_updated || new Date().toISOString(),
      };

      setVehicleData(transformedData);
      setError(null);
      setConnectionStatus("connected");
      setLastUpdated(new Date());

      console.log("✅ Successfully fetched real vehicle data from Tessie API");
    } catch (err) {
      console.warn(
        "⚠️ Failed to fetch real vehicle data, using enhanced simulation:",
        err.message
      );

      // Use enhanced simulated data instead of basic fallback
      const simulatedData = generateEnhancedSimulatedData();
      setVehicleData(simulatedData);
      setConnectionStatus("simulated");
      setLastUpdated(new Date());

      // Only set error if it's a network issue, not a simulation fallback
      if (err.name === "AbortError") {
        setError("Request timeout - using simulated data");
      } else if (err.message.includes("fetch")) {
        setError("Network error - using simulated data");
      } else {
        setError(null); // Clear error for API errors, we're handling gracefully
      }
    } finally {
      setLoading(false);
    }
  }, [generateEnhancedSimulatedData]);

  // Set up polling
  useEffect(() => {
    fetchVehicleData();

    const interval = setInterval(fetchVehicleData, pollInterval);
    return () => clearInterval(interval);
  }, [fetchVehicleData, pollInterval]);

  // Set up WebSocket streaming if enabled
  useEffect(() => {
    if (!enableStreaming || !vehicleData?.id) return;

    const wsUrl = import.meta.env.VITE_WEBSOCKET_ENDPOINT;
    if (!wsUrl) {
      console.log("WebSocket endpoint not configured, using polling only");
      return;
    }

    let ws;
    let reconnectTimer;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const connect = () => {
      try {
        ws = new WebSocket(`${wsUrl}/${vehicleData.id}`);

        ws.onopen = () => {
          console.log("🔗 Vehicle data WebSocket connected");
          setConnectionStatus("streaming");
          reconnectAttempts = 0;
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type !== "ping") {
              setVehicleData((prevData) => ({
                ...prevData,
                ...data,
                last_updated: new Date().toISOString(),
              }));
              setLastUpdated(new Date());
            }
          } catch (parseError) {
            console.error("Failed to parse WebSocket message:", parseError);
          }
        };

        ws.onclose = () => {
          console.log("🔌 Vehicle data WebSocket disconnected");
          setConnectionStatus("connected"); // Fall back to polling

          // Attempt to reconnect with exponential backoff
          if (reconnectAttempts < maxReconnectAttempts) {
            const delay = Math.pow(2, reconnectAttempts) * 1000;
            reconnectTimer = setTimeout(() => {
              reconnectAttempts++;
              connect();
            }, delay);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
        };
      } catch (error) {
        console.error("Failed to create WebSocket connection:", error);
      }
    };

    connect();

    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (ws) {
        ws.close();
      }
    };
  }, [enableStreaming, vehicleData?.id]);

  // Manual refresh function
  const refreshVehicleData = useCallback(() => {
    setLoading(true);
    fetchVehicleData();
  }, [fetchVehicleData]);

  return {
    vehicleData,
    loading,
    error,
    connectionStatus,
    lastUpdated,
    refreshVehicleData,
    // Helper functions
    isRealData:
      connectionStatus === "connected" || connectionStatus === "streaming",
    isSimulated: connectionStatus === "simulated",
    isStreaming: connectionStatus === "streaming",
  };
};
