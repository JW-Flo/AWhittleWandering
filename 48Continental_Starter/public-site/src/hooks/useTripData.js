/* eslint-env browser */
import { useState, useEffect, useCallback } from "react";

/**
 * US State boundaries for accurate state detection
 * Simplified bounding boxes for the continental US states
 */
const STATE_BOUNDARIES = {
  AL: { minLat: 30.2, maxLat: 35.0, minLng: -88.5, maxLng: -84.9 },
  AZ: { minLat: 31.3, maxLat: 37.0, minLng: -114.8, maxLng: -109.0 },
  AR: { minLat: 33.0, maxLat: 36.5, minLng: -94.6, maxLng: -89.6 },
  CA: { minLat: 32.5, maxLat: 42.0, minLng: -124.4, maxLng: -114.1 },
  CO: { minLat: 37.0, maxLat: 41.0, minLng: -109.1, maxLng: -102.0 },
  CT: { minLat: 40.9, maxLat: 42.1, minLng: -73.7, maxLng: -71.8 },
  DE: { minLat: 38.4, maxLat: 39.8, minLng: -75.8, maxLng: -75.0 },
  FL: { minLat: 24.4, maxLat: 31.0, minLng: -87.6, maxLng: -80.0 },
  GA: { minLat: 30.4, maxLat: 35.0, minLng: -85.6, maxLng: -80.8 },
  ID: { minLat: 42.0, maxLat: 49.0, minLng: -117.2, maxLng: -111.0 },
  IL: { minLat: 36.9, maxLat: 42.5, minLng: -91.5, maxLng: -87.0 },
  IN: { minLat: 37.8, maxLat: 41.8, minLng: -88.1, maxLng: -84.8 },
  IA: { minLat: 40.4, maxLat: 43.5, minLng: -96.6, maxLng: -90.1 },
  KS: { minLat: 37.0, maxLat: 40.0, minLng: -102.1, maxLng: -94.6 },
  KY: { minLat: 36.5, maxLat: 39.1, minLng: -89.6, maxLng: -81.9 },
  LA: { minLat: 28.9, maxLat: 33.0, minLng: -94.0, maxLng: -88.8 },
  ME: { minLat: 43.1, maxLat: 47.5, minLng: -71.1, maxLng: -66.9 },
  MD: { minLat: 37.9, maxLat: 39.7, minLng: -79.5, maxLng: -75.0 },
  MA: { minLat: 41.2, maxLat: 42.9, minLng: -73.5, maxLng: -69.9 },
  MI: { minLat: 41.7, maxLat: 48.2, minLng: -90.4, maxLng: -82.4 },
  MN: { minLat: 43.5, maxLat: 49.4, minLng: -97.2, maxLng: -89.5 },
  MS: { minLat: 30.2, maxLat: 35.0, minLng: -91.7, maxLng: -88.1 },
  MO: { minLat: 36.0, maxLat: 40.6, minLng: -95.8, maxLng: -89.1 },
  MT: { minLat: 45.0, maxLat: 49.0, minLng: -116.1, maxLng: -104.0 },
  NE: { minLat: 40.0, maxLat: 43.0, minLng: -104.1, maxLng: -95.3 },
  NV: { minLat: 35.0, maxLat: 42.0, minLng: -120.0, maxLng: -114.0 },
  NH: { minLat: 42.7, maxLat: 45.3, minLng: -72.6, maxLng: -70.6 },
  NJ: { minLat: 38.9, maxLat: 41.4, minLng: -75.6, maxLng: -73.9 },
  NM: { minLat: 31.3, maxLat: 37.0, minLng: -109.1, maxLng: -103.0 },
  NY: { minLat: 40.5, maxLat: 45.0, minLng: -79.8, maxLng: -71.9 },
  NC: { minLat: 33.8, maxLat: 36.6, minLng: -84.3, maxLng: -75.5 },
  ND: { minLat: 45.9, maxLat: 49.0, minLng: -104.1, maxLng: -96.6 },
  OH: { minLat: 38.4, maxLat: 42.3, minLng: -84.8, maxLng: -80.5 },
  OK: { minLat: 33.6, maxLat: 37.0, minLng: -103.0, maxLng: -94.4 },
  OR: { minLat: 42.0, maxLat: 46.3, minLng: -124.6, maxLng: -116.5 },
  PA: { minLat: 39.7, maxLat: 42.5, minLng: -80.5, maxLng: -74.7 },
  RI: { minLat: 41.1, maxLat: 42.0, minLng: -71.9, maxLng: -71.1 },
  SC: { minLat: 32.0, maxLat: 35.2, minLng: -83.4, maxLng: -78.5 },
  SD: { minLat: 42.5, maxLat: 45.9, minLng: -104.1, maxLng: -96.4 },
  TN: { minLat: 35.0, maxLat: 36.7, minLng: -90.3, maxLng: -81.6 },
  TX: { minLat: 25.8, maxLat: 36.5, minLng: -106.6, maxLng: -93.5 },
  UT: { minLat: 37.0, maxLat: 42.0, minLng: -114.1, maxLng: -109.0 },
  VT: { minLat: 42.7, maxLat: 45.0, minLng: -73.4, maxLng: -71.5 },
  VA: { minLat: 36.5, maxLat: 39.5, minLng: -83.7, maxLng: -75.2 },
  WA: { minLat: 45.5, maxLat: 49.0, minLng: -124.8, maxLng: -116.9 },
  WV: { minLat: 37.2, maxLat: 40.6, minLng: -82.6, maxLng: -77.7 },
  WI: { minLat: 42.5, maxLat: 47.1, minLng: -92.9, maxLng: -86.8 },
  WY: { minLat: 41.0, maxLat: 45.0, minLng: -111.1, maxLng: -104.0 },
  DC: { minLat: 38.8, maxLat: 39.0, minLng: -77.1, maxLng: -76.9 },
};

/**
 * Determine which state a coordinate is in
 */
const getStateFromCoordinates = (latitude, longitude) => {
  for (const [state, bounds] of Object.entries(STATE_BOUNDARIES)) {
    if (
      latitude >= bounds.minLat &&
      latitude <= bounds.maxLat &&
      longitude >= bounds.minLng &&
      longitude <= bounds.maxLng
    ) {
      return state;
    }
  }
  return null; // Not in any continental US state
};

/**
 * Calculate distance between two points using Haversine formula
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3959; // Earth radius in miles
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

/**
 * Hook for fetching and managing trip data
 * Enhanced with real-time state tracking and dynamic route calculation
 */
export const useTripData = ({ vehicleData, pollInterval = 60000 } = {}) => {
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visitedStates, setVisitedStates] = useState(new Set());
  const [stateHistory, setStateHistory] = useState([]);

  // Enhanced trip data generation based on vehicle location
  const generateEnhancedTripData = useCallback(
    (currentVehicleData) => {
      const now = new Date();
      const tripStartDate = new Date("2024-01-01"); // Adjust based on actual trip start
      const daysOnRoad = Math.floor(
        (now - tripStartDate) / (1000 * 60 * 60 * 24)
      );

      // Get current location
      const currentLat =
        currentVehicleData?.latitude ||
        currentVehicleData?.location?.latitude ||
        27.8006;
      const currentLng =
        currentVehicleData?.longitude ||
        currentVehicleData?.location?.longitude ||
        -97.3964;

      // Determine current state
      const currentState = getStateFromCoordinates(currentLat, currentLng);

      // Planned route stops (from the actual itinerary)
      const plannedStops = [
        {
          id: "1",
          name: "Corpus Christi",
          state: "TX",
          lat: 27.8006,
          lng: -97.3964,
          type: "start",
        },
        {
          id: "2",
          name: "Houston",
          state: "TX",
          lat: 29.7604,
          lng: -95.3698,
          type: "waypoint",
        },
        {
          id: "3",
          name: "Austin",
          state: "TX",
          lat: 30.2672,
          lng: -97.7431,
          type: "waypoint",
        },
        {
          id: "4",
          name: "Dallas",
          state: "TX",
          lat: 32.7767,
          lng: -96.797,
          type: "waypoint",
        },
        {
          id: "5",
          name: "New Orleans",
          state: "LA",
          lat: 29.9511,
          lng: -90.0715,
          type: "overnight",
        },
        {
          id: "6",
          name: "Biloxi",
          state: "MS",
          lat: 30.6944,
          lng: -88.0431,
          type: "waypoint",
        },
        {
          id: "7",
          name: "Montgomery",
          state: "AL",
          lat: 32.3617,
          lng: -86.2792,
          type: "waypoint",
        },
        {
          id: "8",
          name: "Miami",
          state: "FL",
          lat: 25.7617,
          lng: -80.1918,
          type: "overnight",
        },
        {
          id: "9",
          name: "Orlando",
          state: "FL",
          lat: 28.5383,
          lng: -81.3792,
          type: "waypoint",
        },
        {
          id: "10",
          name: "Atlanta",
          state: "GA",
          lat: 33.749,
          lng: -84.388,
          type: "overnight",
        },
        {
          id: "11",
          name: "Charlotte",
          state: "NC",
          lat: 35.2271,
          lng: -80.8431,
          type: "waypoint",
        },
        {
          id: "12",
          name: "Washington DC",
          state: "DC",
          lat: 38.9072,
          lng: -77.0369,
          type: "overnight",
        },
        {
          id: "13",
          name: "New York",
          state: "NY",
          lat: 40.7128,
          lng: -74.006,
          type: "overnight",
        },
        {
          id: "14",
          name: "Boston",
          state: "MA",
          lat: 42.3601,
          lng: -71.0589,
          type: "waypoint",
        },
        {
          id: "15",
          name: "Chicago",
          state: "IL",
          lat: 41.8781,
          lng: -87.6298,
          type: "overnight",
        },
        {
          id: "16",
          name: "Minneapolis",
          state: "MN",
          lat: 44.9778,
          lng: -93.265,
          type: "waypoint",
        },
        {
          id: "17",
          name: "Denver",
          state: "CO",
          lat: 39.7392,
          lng: -104.9903,
          type: "overnight",
        },
        {
          id: "18",
          name: "Las Vegas",
          state: "NV",
          lat: 36.1627,
          lng: -115.1731,
          type: "waypoint",
        },
        {
          id: "19",
          name: "Los Angeles",
          state: "CA",
          lat: 34.0522,
          lng: -118.2437,
          type: "overnight",
        },
        {
          id: "20",
          name: "San Francisco",
          state: "CA",
          lat: 37.7749,
          lng: -122.4194,
          type: "waypoint",
        },
        {
          id: "21",
          name: "Seattle",
          state: "WA",
          lat: 47.6062,
          lng: -122.3321,
          type: "end",
        },
      ];

      // Find the closest upcoming stop
      let nextStop = null;
      let minDistance = Infinity;
      let distanceToNext = 0;

      for (const stop of plannedStops) {
        const distance = calculateDistance(
          currentLat,
          currentLng,
          stop.lat,
          stop.lng
        );
        if (distance < minDistance && distance > 5) {
          // Must be more than 5 miles away to be "next"
          minDistance = distance;
          nextStop = stop;
          distanceToNext = Math.round(distance);
        }
      }

      // If no next stop found, use the last stop
      if (!nextStop) {
        nextStop = plannedStops[plannedStops.length - 1];
        distanceToNext = Math.round(
          calculateDistance(currentLat, currentLng, nextStop.lat, nextStop.lng)
        );
      }

      // Calculate total miles traveled (rough estimate)
      const totalMiles = 12000 + daysOnRoad * 400; // Base + daily average

      // Generate route coordinates (simplified)
      const route = plannedStops.map((stop) => ({
        latitude: stop.lat,
        longitude: stop.lng,
      }));

      // Convert planned stops to the expected format
      const stops = plannedStops.map((stop) => ({
        id: stop.id,
        name: stop.name,
        latitude: stop.lat,
        longitude: stop.lng,
        type: stop.type,
        description: `${stop.name}, ${stop.state}`,
        charging: stop.type === "overnight" || stop.type === "waypoint",
        overnight: stop.type === "overnight",
        state: stop.state,
      }));

      return {
        visitedStates: Array.from(visitedStates),
        currentState: currentState || "TX",
        currentCity: currentVehicleData?.currentCity || "Corpus Christi",
        nextStop: {
          city: nextStop.name,
          state: nextStop.state,
          eta: new Date(
            Date.now() + (distanceToNext / 60) * 60 * 60 * 1000
          ).toISOString(), // Rough ETA
        },
        distanceToNext,
        totalMiles,
        daysOnRoad,
        route,
        stops,
        // Additional trip statistics
        statesRemaining: 48 - visitedStates.size,
        routeProgress: Math.round((visitedStates.size / 48) * 100),
        averageMilesPerDay: Math.round(totalMiles / Math.max(daysOnRoad, 1)),
        // Real-time location data
        currentLocation: {
          latitude: currentLat,
          longitude: currentLng,
          state: currentState,
          city: currentVehicleData?.currentCity,
        },
        lastUpdated: new Date().toISOString(),
      };
    },
    [visitedStates]
  );

  // Update visited states when vehicle location changes
  useEffect(() => {
    if (!vehicleData?.latitude || !vehicleData?.longitude) return;

    const currentState = getStateFromCoordinates(
      vehicleData.latitude,
      vehicleData.longitude
    );

    if (currentState && !visitedStates.has(currentState)) {
      setVisitedStates((prev) => new Set([...prev, currentState]));
      setStateHistory((prev) => [
        ...prev,
        {
          state: currentState,
          timestamp: new Date().toISOString(),
          coordinates: {
            latitude: vehicleData.latitude,
            longitude: vehicleData.longitude,
          },
        },
      ]);
      console.log(`🗺️ Entered new state: ${currentState}`);
    }
  }, [vehicleData?.latitude, vehicleData?.longitude, visitedStates]);

  /**
   * Validate and normalize coordinates to ensure they are in [longitude, latitude] format
   * This ensures coordinate consistency across all data sources
   *
   * IMPORTANT: MapBox requires coordinates in [longitude, latitude] format.
   * Many data sources provide them as [latitude, longitude], causing render issues.
   *
   * @param {Array|Object} coords - Coordinates to validate and normalize
   * @returns {Array|null} - Normalized [longitude, latitude] array or null if invalid
   */
  const validateAndNormalizeCoordinates = useCallback((coords) => {
    // Already an array [lng, lat] or [lat, lng]
    if (Array.isArray(coords) && coords.length === 2) {
      const [first, second] = coords.map((v) =>
        typeof v === "string" ? parseFloat(v) : v
      );

      // Skip if invalid numbers
      if (isNaN(first) || isNaN(second)) return null;

      // Check if values are within valid ranges
      // Longitude: -180 to 180, Latitude: -90 to 90
      const isFirstLongitude =
        Math.abs(first) <= 180 &&
        (Math.abs(first) > 90 || Math.abs(second) > 90);
      const isSecondLatitude = Math.abs(second) <= 90;

      // If first is longitude and second is latitude (correct GeoJSON order)
      if (isFirstLongitude && isSecondLatitude) {
        return [first, second]; // [longitude, latitude]
      }

      // If first looks like latitude and second like longitude (swapped)
      if (
        Math.abs(first) <= 90 &&
        Math.abs(second) <= 180 &&
        Math.abs(second) > 90
      ) {
        console.log("Fixed swapped coordinates:", [first, second], "→", [
          second,
          first,
        ]);
        return [second, first]; // [longitude, latitude]
      }

      // If both values are within latitude range, make a best guess
      if (Math.abs(first) <= 90 && Math.abs(second) <= 90) {
        // In the US, longitude values are typically larger than latitude values
        if (Math.abs(first) > Math.abs(second)) {
          return [first, second]; // first is likely longitude
        } else {
          return [second, first]; // second is likely longitude
        }
      }

      // Fallback to original order if we can't determine
      return [first, second];
    }

    // Object with lat/lng or latitude/longitude properties
    if (coords && typeof coords === "object") {
      let lng, lat;

      // Handle latitude/longitude properties
      if (coords.latitude !== undefined && coords.longitude !== undefined) {
        lat =
          typeof coords.latitude === "string"
            ? parseFloat(coords.latitude)
            : coords.latitude;
        lng =
          typeof coords.longitude === "string"
            ? parseFloat(coords.longitude)
            : coords.longitude;
      }
      // Handle lat/lng properties (GeoJSON style)
      else if (coords.lat !== undefined && coords.lng !== undefined) {
        lat =
          typeof coords.lat === "string" ? parseFloat(coords.lat) : coords.lat;
        lng =
          typeof coords.lng === "string" ? parseFloat(coords.lng) : coords.lng;
      }
      // Handle coordinates array property
      else if (
        coords.coordinates &&
        Array.isArray(coords.coordinates) &&
        coords.coordinates.length === 2
      ) {
        return validateAndNormalizeCoordinates(coords.coordinates);
      }

      // Skip if invalid numbers
      if (lng === undefined || lat === undefined || isNaN(lng) || isNaN(lat))
        return null;

      // Check if values are within valid ranges
      // Longitude: -180 to 180, Latitude: -90 to 90
      const validLng = Math.abs(lng) <= 180;
      const validLat = Math.abs(lat) <= 90;

      if (!validLng || !validLat) {
        // Check if they're swapped
        if (Math.abs(lng) <= 90 && Math.abs(lat) <= 180 && Math.abs(lat) > 90) {
          console.log("Fixed swapped lat/lng properties:", { lat, lng }, "→", {
            lat: lng,
            lng: lat,
          });
          return [lat, lng]; // [longitude, latitude] with swapped values
        }
        return null;
      }

      return [lng, lat]; // [longitude, latitude]
    }

    return null;
  }, []);

  // We're now using validateAndNormalizeCoordinates directly for better coordinate handling

  const fetchTripData = useCallback(async () => {
    try {
      // Try to fetch from API first
      const apiUrl =
        import.meta.env.VITE_EDGE_WORKER_URL ||
        import.meta.env.VITE_API_BASE_URL ||
        "http://localhost:8787";

      console.log(`Fetching trip data from API: ${apiUrl}/api/itinerary`);

      const response = await fetch(`${apiUrl}/api/itinerary`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        console.log("API response received:", data);

        // Properly handle different response formats
        let extractedRoute = [];
        let extractedStops = [];

        // GeoJSON format handling
        if (data.type === "FeatureCollection" && Array.isArray(data.features)) {
          console.log("Processing GeoJSON FeatureCollection");

          // Extract route from LineString features
          const routeFeature = data.features.find(
            (f) => f.geometry && f.geometry.type === "LineString"
          );

          if (
            routeFeature &&
            Array.isArray(routeFeature.geometry.coordinates)
          ) {
            extractedRoute = routeFeature.geometry.coordinates
              .map((coord) => {
                const normalized = validateAndNormalizeCoordinates(coord);
                if (normalized) {
                  const [longitude, latitude] = normalized;
                  return {
                    longitude,
                    latitude,
                    coordinates: [longitude, latitude], // Add GeoJSON-compatible coordinates array
                  };
                }
                return null;
              })
              .filter(Boolean);
          }

          // Extract stops from Point features or properties
          const stopFeatures = data.features.filter(
            (f) => f.geometry && f.geometry.type === "Point"
          );

          if (stopFeatures.length > 0) {
            extractedStops = stopFeatures
              .map((feature, idx) => {
                const normalized = validateAndNormalizeCoordinates(
                  feature.geometry.coordinates
                );

                if (!normalized) {
                  console.warn(
                    "Invalid stop coordinates:",
                    feature.geometry.coordinates
                  );
                  return null;
                }

                const [longitude, latitude] = normalized;
                const props = feature.properties || {};

                return {
                  id: props.id || `stop-${idx}`,
                  name: props.name || props.location || `Stop ${idx}`,
                  longitude,
                  latitude,
                  coordinates: [longitude, latitude],
                  type: props.type || "waypoint",
                  description: props.description || props.name || "",
                  charging: props.charging || props.type === "charging",
                  overnight: props.overnight || props.type === "overnight",
                  state:
                    props.state ||
                    getStateFromCoordinates(latitude, longitude) ||
                    "",
                };
              })
              .filter(Boolean);
          }
          // Check for stops in properties of the first feature
          else if (
            data.features[0] &&
            data.features[0].properties &&
            Array.isArray(data.features[0].properties.stops)
          ) {
            extractedStops = data.features[0].properties.stops
              .map((stop, idx) => {
                // Try different coordinate sources
                let normalized = null;

                // Try coordinates array first
                if (stop.coordinates && Array.isArray(stop.coordinates)) {
                  normalized = validateAndNormalizeCoordinates(
                    stop.coordinates
                  );
                }

                // Then try lat/lng or latitude/longitude
                if (
                  !normalized &&
                  (stop.latitude !== undefined || stop.lat !== undefined)
                ) {
                  normalized = validateAndNormalizeCoordinates(stop);
                }

                if (!normalized) {
                  console.warn(
                    "Could not extract valid coordinates for stop:",
                    stop
                  );
                  return null;
                }

                const [longitude, latitude] = normalized;

                return {
                  id: stop.id || `${stop.name || "stop"}-${idx}`,
                  name:
                    stop.name ||
                    (stop.location
                      ? stop.location.split(",")[0].trim()
                      : `Stop ${idx}`),
                  longitude,
                  latitude,
                  coordinates: [longitude, latitude],
                  type: stop.type || "waypoint",
                  description: stop.description || stop.name || "",
                  charging: stop.charging || stop.type === "charging",
                  overnight: stop.overnight || stop.type === "overnight",
                  state:
                    stop.state ||
                    getStateFromCoordinates(latitude, longitude) ||
                    "",
                };
              })
              .filter(Boolean);
          }
        }
        // Standard JSON format handling
        else if (data.route || data.stops) {
          console.log("Processing standard JSON format");

          // Extract route data
          if (Array.isArray(data.route)) {
            extractedRoute = data.route
              .map((point) => {
                const normalized = validateAndNormalizeCoordinates(point);
                if (normalized) {
                  const [longitude, latitude] = normalized;
                  return {
                    longitude,
                    latitude,
                    coordinates: [longitude, latitude],
                  };
                }
                return null;
              })
              .filter(Boolean);
          }

          // Extract stops data
          if (Array.isArray(data.stops)) {
            extractedStops = data.stops
              .map((stop, idx) => {
                const normalized = validateAndNormalizeCoordinates(stop);
                if (!normalized) {
                  console.warn("Invalid stop data:", stop);
                  return null;
                }

                const [longitude, latitude] = normalized;

                return {
                  id: stop.id || `stop-${idx}`,
                  name: stop.name || `Stop ${idx}`,
                  longitude,
                  latitude,
                  coordinates: [longitude, latitude],
                  type: stop.type || "waypoint",
                  description: stop.description || stop.name || "",
                  charging: stop.charging || stop.type === "charging",
                  overnight: stop.overnight || stop.type === "overnight",
                  state:
                    stop.state ||
                    getStateFromCoordinates(latitude, longitude) ||
                    "",
                };
              })
              .filter(Boolean);
          }
        }

        console.log(
          `Processed API data: ${extractedRoute.length} route points, ${extractedStops.length} stops`
        );

        // Check if we extracted valid data
        if (extractedRoute.length > 0 || extractedStops.length > 0) {
          // Merge API data with our enhanced local data
          const enhancedData = generateEnhancedTripData(vehicleData);

          const mergedData = {
            ...enhancedData,
            // Only override route and stops if we extracted valid data
            ...(extractedRoute.length > 0 ? { route: extractedRoute } : {}),
            ...(extractedStops.length > 0 ? { stops: extractedStops } : {}),
            visitedStates: Array.from(visitedStates),
          };

          // Add any other fields from the API data
          if (data.currentStopIndex !== undefined) {
            mergedData.currentStopIndex = data.currentStopIndex;
          }

          setTripData(mergedData);
          setError(null);
          console.log(
            "✅ Successfully fetched and processed trip data from API"
          );
          return;
        } else {
          console.warn("API data didn't contain valid route or stops");
          throw new Error("Invalid or incomplete API data");
        }
      } else {
        console.warn(`API request failed with status: ${response.status}`);
        throw new Error(`API request failed with status: ${response.status}`);
      }
    } catch (err) {
      console.warn("⚠️ Failed to fetch trip data from API:", err.message);
    }

    // Fallback to enhanced local data
    const enhancedData = generateEnhancedTripData(vehicleData);
    setTripData(enhancedData);
    setError(null);
    console.log("📍 Using enhanced local trip data as fallback");
  }, [vehicleData, generateEnhancedTripData, validateAndNormalizeCoordinates]);

  // Fetch trip data on mount and when vehicle data changes
  useEffect(() => {
    fetchTripData();
    setLoading(false);
  }, [fetchTripData]);

  // Set up polling for trip data updates
  useEffect(() => {
    const interval = setInterval(fetchTripData, pollInterval);
    return () => clearInterval(interval);
  }, [fetchTripData, pollInterval]);

  // Manual refresh function
  const refreshTripData = useCallback(() => {
    setLoading(true);
    fetchTripData().finally(() => setLoading(false));
  }, [fetchTripData]);

  // Helper functions
  const getStateProgress = useCallback(() => {
    const totalStates = 48;
    const visited = visitedStates.size;
    return {
      visited,
      remaining: totalStates - visited,
      percentage: Math.round((visited / totalStates) * 100),
    };
  }, [visitedStates]);

  const isStateVisited = useCallback(
    (state) => {
      return visitedStates.has(state);
    },
    [visitedStates]
  );

  return {
    tripData,
    loading,
    error,
    refreshTripData,
    // State tracking helpers
    visitedStates: Array.from(visitedStates),
    stateHistory,
    getStateProgress,
    isStateVisited,
    // Real-time location helpers
    currentState: tripData?.currentState,
    currentCity: tripData?.currentCity,
    nextDestination: tripData?.nextStop,
    distanceToNext: tripData?.distanceToNext,
  };
};
