/**
 * Coordinate Format Fixer
 *
 * This script ensures that all coordinates in the itinerary data follow the
 * GeoJSON standard format of [longitude, latitude] and are consistently formatted
 * across all data sources. It fixes common issues like swapped coordinates,
 * string vs number formats, and inconsistent property naming.
 *
 * Usage: node scripts/fix-coordinate-format.cjs
 */

const fs = require("fs");
const path = require("path");

// Paths to the data files
const ITINERARY_FULL_PATH = path.join(__dirname, "..", "itinerary-full.json");
const ITINERARY_PATH = path.join(__dirname, "..", "itinerary.json");
const EDGE_WORKER_ITINERARY_PATH = path.join(
  __dirname,
  "..",
  "edge-worker",
  "itinerary-data.json"
);
const EDGE_WORKER_TRIP_PATH = path.join(
  __dirname,
  "..",
  "edge-worker",
  "trip-data.json"
);

/**
 * Validate and normalize coordinates to ensure they are in [longitude, latitude] format
 * @param {number|string} lng - Longitude value
 * @param {number|string} lat - Latitude value
 * @returns {Array|null} - Normalized [longitude, latitude] array or null if invalid
 */
function validateAndNormalizeCoordinates(lng, lat) {
  // Convert string values to numbers
  if (typeof lng === "string") lng = parseFloat(lng);
  if (typeof lat === "string") lat = parseFloat(lat);

  // Check if values are valid numbers and within range
  // Longitude: -180 to 180, Latitude: -90 to 90
  const validLng =
    typeof lng === "number" && !isNaN(lng) && lng >= -180 && lng <= 180;
  const validLat =
    typeof lat === "number" && !isNaN(lat) && lat >= -90 && lat <= 90;

  if (!validLng || !validLat) {
    return null;
  }

  return [lng, lat];
}

/**
 * Detect and fix potentially swapped coordinates
 * @param {Object|Array} point - Point data with lat/lng or coordinates array
 * @returns {Array|null} - Fixed [longitude, latitude] array or null if invalid
 */
function fixCoordinateFormat(point) {
  if (!point) return null;

  // Handle if point is already an array
  if (Array.isArray(point) && point.length === 2) {
    const [first, second] = point.map((p) =>
      typeof p === "string" ? parseFloat(p) : p
    );

    // Skip invalid values
    if (isNaN(first) || isNaN(second)) return null;

    // If first value looks like latitude and second like longitude
    if (
      Math.abs(first) <= 90 &&
      Math.abs(second) <= 180 &&
      Math.abs(second) > 90
    ) {
      console.log("Fixing swapped array coordinates:", [first, second], "→", [
        second,
        first,
      ]);
      return validateAndNormalizeCoordinates(second, first);
    }

    return validateAndNormalizeCoordinates(first, second);
  }

  // Handle if point has lat/lng properties
  if (point.latitude !== undefined && point.longitude !== undefined) {
    const lat =
      typeof point.latitude === "string"
        ? parseFloat(point.latitude)
        : point.latitude;
    const lng =
      typeof point.longitude === "string"
        ? parseFloat(point.longitude)
        : point.longitude;

    // Skip invalid values
    if (isNaN(lat) || isNaN(lng)) return null;

    // If longitude looks like it might be a latitude value and vice versa
    if (Math.abs(lng) <= 90 && Math.abs(lat) > 90) {
      console.log("Fixing swapped lat/lng properties:", { lat, lng }, "→", {
        lat: lng,
        lng: lat,
      });
      return validateAndNormalizeCoordinates(lat, lng);
    }

    return validateAndNormalizeCoordinates(lng, lat);
  }

  // Handle if point has lng/lat properties (GeoJSON style)
  if (point.lng !== undefined && point.lat !== undefined) {
    const lng =
      typeof point.lng === "string" ? parseFloat(point.lng) : point.lng;
    const lat =
      typeof point.lat === "string" ? parseFloat(point.lat) : point.lat;
    return validateAndNormalizeCoordinates(lng, lat);
  }

  // Handle if point has coordinates array property
  if (
    point.coordinates &&
    Array.isArray(point.coordinates) &&
    point.coordinates.length === 2
  ) {
    return fixCoordinateFormat(point.coordinates);
  }

  return null;
}

/**
 * Fix stop coordinates in an itinerary
 * @param {Object} stop - The stop object to fix
 * @returns {Object} - The fixed stop object
 */
function fixStopCoordinates(stop) {
  if (!stop) return stop;

  let coordinates = null;

  // First try standard format
  if (
    typeof stop.longitude !== "undefined" &&
    typeof stop.latitude !== "undefined"
  ) {
    coordinates = validateAndNormalizeCoordinates(
      stop.longitude,
      stop.latitude
    );
  }

  // If that fails, try GeoJSON coordinates array if available
  if (
    !coordinates &&
    stop.coordinates &&
    Array.isArray(stop.coordinates) &&
    stop.coordinates.length === 2
  ) {
    coordinates = validateAndNormalizeCoordinates(
      stop.coordinates[0],
      stop.coordinates[1]
    );
  }

  // Last resort - try to fix potential format issues
  if (!coordinates) {
    coordinates = fixCoordinateFormat(stop);
  }

  // If we successfully fixed/validated coordinates, update the stop object
  if (coordinates) {
    const [longitude, latitude] = coordinates;

    // Update with consistent format
    const updatedStop = {
      ...stop,
      longitude,
      latitude,
      coordinates: [longitude, latitude], // Also add GeoJSON-compatible coordinates array
    };

    return updatedStop;
  }

  // If we couldn't fix coordinates, return the original stop
  console.warn(
    `WARNING: Could not fix coordinates for stop: ${stop.name || "Unknown"}`
  );
  return stop;
}

/**
 * Fix route coordinates in an itinerary
 * @param {Array} route - Array of route points
 * @returns {Array} - Fixed route array
 */
function fixRouteCoordinates(route) {
  if (!Array.isArray(route)) return route;

  const fixedRoute = route
    .map((point) => {
      // Skip null/undefined points
      if (!point) return null;

      let coordinates = null;

      // First try with standard format
      if (
        typeof point.longitude !== "undefined" &&
        typeof point.latitude !== "undefined"
      ) {
        coordinates = validateAndNormalizeCoordinates(
          point.longitude,
          point.latitude
        );
      }

      // If that fails, try to fix potential format issues
      if (!coordinates) {
        coordinates = fixCoordinateFormat(point);
      }

      if (coordinates) {
        const [longitude, latitude] = coordinates;

        // Return a consistent format for route points
        return {
          longitude,
          latitude,
          coordinates: [longitude, latitude],
        };
      }

      return null;
    })
    .filter((point) => point !== null); // Remove any null points

  return fixedRoute;
}

/**
 * Fix itinerary data by normalizing all coordinates
 * @param {Object} itinerary - The itinerary object to fix
 * @returns {Object} - The fixed itinerary object
 */
function fixItineraryData(itinerary) {
  if (!itinerary) return itinerary;

  const fixedItinerary = { ...itinerary };

  // Fix stops
  if (Array.isArray(itinerary.stops)) {
    fixedItinerary.stops = itinerary.stops.map(fixStopCoordinates);
  }

  // Fix route
  if (Array.isArray(itinerary.route)) {
    fixedItinerary.route = fixRouteCoordinates(itinerary.route);
  }

  // Fix vehicle location if present
  if (itinerary.vehicle) {
    const { vehicle } = itinerary;
    if (
      typeof vehicle.longitude !== "undefined" &&
      typeof vehicle.latitude !== "undefined"
    ) {
      const coordinates = validateAndNormalizeCoordinates(
        vehicle.longitude,
        vehicle.latitude
      );
      if (coordinates) {
        const [longitude, latitude] = coordinates;
        fixedItinerary.vehicle = {
          ...vehicle,
          longitude,
          latitude,
          coordinates: [longitude, latitude],
        };
      }
    }
  }

  return fixedItinerary;
}

/**
 * Fix GeoJSON data (for trip data and route visualization)
 * @param {Object} geoJson - The GeoJSON object to fix
 * @returns {Object} - The fixed GeoJSON object
 */
function fixGeoJsonData(geoJson) {
  if (!geoJson || typeof geoJson !== "object") return geoJson;

  const fixedGeoJson = { ...geoJson };

  // Fix Feature Collection
  if (geoJson.type === "FeatureCollection" && Array.isArray(geoJson.features)) {
    fixedGeoJson.features = geoJson.features.map((feature) => {
      if (!feature || !feature.geometry) return feature;

      const fixedFeature = { ...feature };

      // Fix Point geometry
      if (
        feature.geometry.type === "Point" &&
        Array.isArray(feature.geometry.coordinates)
      ) {
        const coordinates = fixCoordinateFormat(feature.geometry.coordinates);
        if (coordinates) {
          fixedFeature.geometry = {
            ...feature.geometry,
            coordinates,
          };
        }
      }

      // Fix LineString geometry
      if (
        feature.geometry.type === "LineString" &&
        Array.isArray(feature.geometry.coordinates)
      ) {
        fixedFeature.geometry = {
          ...feature.geometry,
          coordinates: feature.geometry.coordinates
            .map((coords) => fixCoordinateFormat(coords))
            .filter((coords) => coords !== null),
        };
      }

      return fixedFeature;
    });
  }

  // Fix Feature
  if (geoJson.type === "Feature" && geoJson.geometry) {
    const fixedFeature = { ...geoJson };

    // Fix Point geometry
    if (
      geoJson.geometry.type === "Point" &&
      Array.isArray(geoJson.geometry.coordinates)
    ) {
      const coordinates = fixCoordinateFormat(geoJson.geometry.coordinates);
      if (coordinates) {
        fixedFeature.geometry = {
          ...geoJson.geometry,
          coordinates,
        };
      }
    }

    // Fix LineString geometry
    if (
      geoJson.geometry.type === "LineString" &&
      Array.isArray(geoJson.geometry.coordinates)
    ) {
      fixedFeature.geometry = {
        ...geoJson.geometry,
        coordinates: geoJson.geometry.coordinates
          .map((coords) => fixCoordinateFormat(coords))
          .filter((coords) => coords !== null),
      };
    }

    return fixedFeature;
  }

  return fixedGeoJson;
}

/**
 * Process and fix all itinerary data files
 */
async function processFiles() {
  try {
    // Process itinerary-full.json
    if (fs.existsSync(ITINERARY_FULL_PATH)) {
      console.log(`Processing: ${ITINERARY_FULL_PATH}`);
      const itineraryFullData = JSON.parse(
        fs.readFileSync(ITINERARY_FULL_PATH, "utf8")
      );
      const fixedItineraryFullData = fixItineraryData(itineraryFullData);
      fs.writeFileSync(
        ITINERARY_FULL_PATH,
        JSON.stringify(fixedItineraryFullData, null, 2)
      );
      console.log(`Fixed coordinates in: ${ITINERARY_FULL_PATH}`);
    }

    // Process itinerary.json
    if (fs.existsSync(ITINERARY_PATH)) {
      console.log(`Processing: ${ITINERARY_PATH}`);
      const itineraryData = JSON.parse(fs.readFileSync(ITINERARY_PATH, "utf8"));
      const fixedItineraryData = fixItineraryData(itineraryData);
      fs.writeFileSync(
        ITINERARY_PATH,
        JSON.stringify(fixedItineraryData, null, 2)
      );
      console.log(`Fixed coordinates in: ${ITINERARY_PATH}`);
    }

    // Process edge-worker/itinerary-data.json
    if (fs.existsSync(EDGE_WORKER_ITINERARY_PATH)) {
      console.log(`Processing: ${EDGE_WORKER_ITINERARY_PATH}`);
      const edgeWorkerItinerary = JSON.parse(
        fs.readFileSync(EDGE_WORKER_ITINERARY_PATH, "utf8")
      );
      const fixedEdgeWorkerItinerary = fixItineraryData(edgeWorkerItinerary);
      fs.writeFileSync(
        EDGE_WORKER_ITINERARY_PATH,
        JSON.stringify(fixedEdgeWorkerItinerary, null, 2)
      );
      console.log(`Fixed coordinates in: ${EDGE_WORKER_ITINERARY_PATH}`);
    }

    // Process edge-worker/trip-data.json (may be GeoJSON format)
    if (fs.existsSync(EDGE_WORKER_TRIP_PATH)) {
      console.log(`Processing: ${EDGE_WORKER_TRIP_PATH}`);
      const tripData = JSON.parse(
        fs.readFileSync(EDGE_WORKER_TRIP_PATH, "utf8")
      );
      const fixedTripData = fixGeoJsonData(tripData);
      fs.writeFileSync(
        EDGE_WORKER_TRIP_PATH,
        JSON.stringify(fixedTripData, null, 2)
      );
      console.log(`Fixed coordinates in: ${EDGE_WORKER_TRIP_PATH}`);
    }

    console.log("All coordinates fixed successfully!");
    console.log(
      "NOTE: Map should now correctly display all locations with proper GeoJSON [longitude, latitude] format."
    );
  } catch (error) {
    console.error("Error processing files:", error);
  }
}

// Run the processing function
processFiles();
