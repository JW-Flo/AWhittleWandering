/* eslint-env browser */
import { useState, useEffect, useCallback, useRef } from "react";

// Request throttling/batching configuration
const BATCH_INTERVAL = 5000; // 5 seconds between batches
const THROTTLE_LIMIT = 10; // Max number of requests per batch

// The batching logic is now inside the hook, using refs for per-instance state.

// Cache for route points
const ROUTE_POINTS = [
  { lat: 27.8006, lng: -97.3964, state: "TX", city: "Corpus Christi" },
  { lat: 29.7604, lng: -95.3698, state: "TX", city: "Houston" },
  { lat: 30.2672, lng: -97.7431, state: "TX", city: "Austin" },
  { lat: 32.7767, lng: -96.797, state: "TX", city: "Dallas" },
  { lat: 29.9511, lng: -90.0715, state: "LA", city: "New Orleans" },
  { lat: 30.6944, lng: -88.0431, state: "MS", city: "Biloxi" },
  { lat: 32.3617, lng: -86.2792, state: "AL", city: "Montgomery" },
  { lat: 25.7617, lng: -80.1918, state: "FL", city: "Miami" },
];

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

  // Per-hook-instance batching state
  const batchQueueRef = useRef([]);
  const batchTimeoutRef = useRef(null);
  const requestCountRef = useRef(0);

  // Enhanced caching with TTL - extended to 30 seconds for stability
  const cache = useRef({
    simulated: null,
    lastUpdate: 0,
    ttl: 30000, // 30 seconds TTL to prevent excessive API calls
    pending: false,
  });

  // Process batched requests (per instance)
  const processBatch = useCallback(() => {
    if (batchQueueRef.current.length > 0) {
      const currentBatch = batchQueueRef.current.splice(0, THROTTLE_LIMIT);
      currentBatch.forEach((callback) => callback());
    }
    batchTimeoutRef.current = null;
    requestCountRef.current = 0;
  }, []);

  // Throttle/batch requests (per instance)
  const throttleRequest = useCallback(
    (callback) => {
      batchQueueRef.current.push(callback);

      if (!batchTimeoutRef.current) {
        batchTimeoutRef.current = setTimeout(processBatch, BATCH_INTERVAL);
      }

      if (++requestCountRef.current >= THROTTLE_LIMIT) {
        processBatch();
      }
    },
    [processBatch]
  );

  // Enhanced vehicle data with more realistic simulation
  const generateEnhancedSimulatedData = useCallback(() => {
    const now = Date.now();

    // Return cached data if within TTL
    if (
      cache.current.simulated &&
      now - cache.current.lastUpdate < cache.current.ttl
    ) {
      return cache.current.simulated;
    }

    const date = new Date(now);
    const timeOfDay = date.getHours();
    const dayOfYear = Math.floor(
      (date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
    );

    // Calculate route progress (0 to 1)
    const routeProgress = (dayOfYear % 60) / 60; // 60-day cycle

    // Calculate current position
    const currentIndex = Math.floor(routeProgress * (ROUTE_POINTS.length - 1));
    const nextIndex = Math.min(currentIndex + 1, ROUTE_POINTS.length - 1);
    const segmentProgress =
      routeProgress * (ROUTE_POINTS.length - 1) - currentIndex;

    const currentPoint = ROUTE_POINTS[currentIndex];
    const nextPoint = ROUTE_POINTS[nextIndex];

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

    const simulatedData = {
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
      latitude: latitude,
      longitude: longitude,
      currentState: currentPoint.state,
      currentCity: currentPoint.city,
      climate: {
        insideTemp: 72 + Math.random() * 6 - 3,
        outsideTemp: 45 + Math.random() * 40,
        enabled: Math.random() > 0.3,
        temperature: 72,
      },
      odometer: 45123 + Math.round(routeProgress * 15000),
      locked: !isCharging && speed === 0,
      sentry_mode: speed === 0 && !isCharging && Math.random() > 0.5,
      tire_pressure: {
        front_left: 42 + Math.random() * 2 - 1,
        front_right: 42 + Math.random() * 2 - 1,
        rear_left: 42 + Math.random() * 2 - 1,
        rear_right: 42 + Math.random() * 2 - 1,
      },
      last_updated: new Date().toISOString(),
      tripDay: Math.floor(routeProgress * 60) + 1,
      routeProgress: Math.round(routeProgress * 100),
      visitedStates: ROUTE_POINTS.slice(0, currentIndex + 1)
        .map((point) => point.state)
        .filter((state, index, self) => self.indexOf(state) === index),
    };

    // Update cache
    cache.current = {
      ...cache.current,
      simulated: simulatedData,
      lastUpdate: now,
    };

    return simulatedData;
  }, []);

  const fetchVehicleData = useCallback(
    async (force = false) => {
      // Return cached data if within TTL
      if (
        !force &&
        cache.current.simulated &&
        Date.now() - cache.current.lastUpdate < cache.current.ttl
      ) {
        return;
      }

      // Prevent multiple simultaneous requests
      if (cache.current.pending) {
        return;
      }
      cache.current.pending = true;

      try {
        setConnectionStatus("connecting");

        const apiUrl =
          import.meta.env.VITE_EDGE_WORKER_URL ||
          import.meta.env.VITE_API_BASE_URL ||
          "http://localhost:8787";

        const response = await fetch(`${apiUrl}/api/vehicle`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();
        if (data.error) {
          throw new Error(data.message || data.error);
        }

        const transformedData = {
          ...data,
          location: data.location || {
            latitude: data.latitude,
            longitude: data.longitude,
            heading: data.heading || 0,
          },
          latitude: data.location?.latitude || data.latitude,
          longitude: data.location?.longitude || data.longitude,
          last_updated: data.last_updated || new Date().toISOString(),
        };

        setVehicleData(transformedData);
        setError(null);
        setConnectionStatus("connected");
        setLastUpdated(new Date());

        console.log("✅ Successfully fetched real vehicle data");
      } catch (err) {
        console.warn("⚠️ Using simulation:", err.message);

        throttleRequest(() => {
          const simulatedData = generateEnhancedSimulatedData();
          setVehicleData(simulatedData);
        });

        setConnectionStatus("simulated");
        setLastUpdated(new Date());

        if (err.name === "AbortError") {
          setError("Request timeout - using simulated data");
        } else if (err.message.includes("fetch")) {
          setError("Network error - using simulated data");
        } else {
          setError(null);
        }
      } finally {
        cache.current.pending = false;
        setLoading(false);
      }
    },
    [generateEnhancedSimulatedData]
  );

  useEffect(() => {
    fetchVehicleData();
    const interval = setInterval(fetchVehicleData, pollInterval);
    return () => clearInterval(interval);
  }, [fetchVehicleData, pollInterval]);

  useEffect(() => {
    if (!enableStreaming || !vehicleData?.id) return;

    const wsUrl = import.meta.env.VITE_WEBSOCKET_ENDPOINT;
    if (!wsUrl) {
      console.log("Using polling only - WebSocket not configured");
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
          console.log("🔗 WebSocket connected");
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
            console.error("WebSocket message parse error:", parseError);
          }
        };

        ws.onclose = () => {
          setConnectionStatus("connected");
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
        console.error("WebSocket connection failed:", error);
      }
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [enableStreaming, vehicleData?.id]);

  const refreshVehicleData = useCallback(() => {
    setLoading(true);
    fetchVehicleData(true);
  }, [fetchVehicleData]);

  return {
    vehicleData,
    loading,
    error,
    connectionStatus,
    lastUpdated,
    refreshVehicleData,
    isRealData:
      connectionStatus === "connected" || connectionStatus === "streaming",
    isSimulated: connectionStatus === "simulated",
    isStreaming: connectionStatus === "streaming",
  };
};
