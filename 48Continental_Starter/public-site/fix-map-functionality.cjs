#!/usr/bin/env node
/**
 * Map Functionality Fix Script
 *
 * This script applies the coordinate format fix to the main application code.
 * It ensures that the map can handle different coordinate formats consistently.
 */

const fs = require("fs");
const path = require("path");

// Paths to key files
const ROOT_DIR = path.resolve(__dirname);
const SRC_DIR = path.join(ROOT_DIR, "src");
const COMPONENTS_DIR = path.join(SRC_DIR, "components");
const UTILS_DIR = path.join(SRC_DIR, "utils");

// Ensure the utils directory exists
if (!fs.existsSync(UTILS_DIR)) {
  fs.mkdirSync(UTILS_DIR, { recursive: true });
  console.log("Created utils directory");
}

// Function to validate and fix coordinates in a file
const fixCoordinateHandling = () => {
  console.log("Applying coordinate format fix to the application...");

  // 1. Ensure mapUtils.js exists with our format correction utility
  const mapUtilsPath = path.join(UTILS_DIR, "mapUtils.js");
  if (!fs.existsSync(mapUtilsPath)) {
    console.log("Creating mapUtils.js with coordinate format utility...");
    const mapUtilsContent = `/* eslint-env browser */
/**
 * Map Utilities
 *
 * Standardized functions for handling map coordinates and common MapBox operations
 */

/**
 * Ensures coordinates are in the [longitude, latitude] format required by MapBox
 *
 * @param {Array|Object} coords - Coordinates to format
 * @returns {Array|null} - [longitude, latitude] array or null if invalid
 */
export const ensureMapboxFormat = (coords) => {
  // Handle null or undefined
  if (!coords) return null;

  // Already an array [?, ?]
  if (Array.isArray(coords) && coords.length === 2) {
    const [first, second] = coords.map((v) =>
      typeof v === "string" ? parseFloat(v) : v
    );

    // Skip if invalid numbers
    if (isNaN(first) || isNaN(second)) return null;

    // Check if values are within valid ranges
    // Longitude: -180 to 180, Latitude: -90 to 90
    const firstIsValidLng = Math.abs(first) <= 180;
    const secondIsValidLat = Math.abs(second) <= 90;

    // If both are valid in their current positions, return as is
    if (firstIsValidLng && secondIsValidLat) {
      return [first, second]; // Already [longitude, latitude]
    }

    // If first looks like latitude and second like longitude (swapped)
    if (Math.abs(first) <= 90 && Math.abs(second) <= 180) {
      return [second, first]; // Swap to [longitude, latitude]
    }

    // If both are out of range, return null
    return null;
  }

  // Object with lat/lng or latitude/longitude properties
  if (typeof coords === "object") {
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
      return ensureMapboxFormat(coords.coordinates);
    }

    // Skip if invalid numbers
    if (lng === undefined || lat === undefined || isNaN(lng) || isNaN(lat))
      return null;

    // Check if values are within valid ranges
    if (Math.abs(lng) <= 180 && Math.abs(lat) <= 90) {
      return [lng, lat]; // [longitude, latitude]
    }

    // Check if they're swapped
    if (Math.abs(lng) <= 90 && Math.abs(lat) <= 180) {
      return [lat, lng]; // [longitude, latitude] with swapped values
    }

    return null;
  }

  return null;
};

/**
 * Converts stops data to GeoJSON format
 *
 * @param {Array} stops - Array of stop objects
 * @returns {Object} - GeoJSON FeatureCollection
 */
export const stopsToGeoJSON = (stops) => {
  if (!stops || !Array.isArray(stops)) return null;

  const features = stops
    .map((stop) => {
      const coords = ensureMapboxFormat(stop.location || stop);

      // Skip stops with invalid coordinates
      if (!coords) return null;

      return {
        type: "Feature",
        properties: {
          id: stop.id || \`stop-\${Math.random().toString(36).substring(2, 9)}\`,
          name: stop.name || "Unknown",
          description: stop.description || "No description",
          type: stop.type || "waypoint",
          charging: !!stop.charging,
          overnight: !!stop.overnight,
          state: stop.state,
        },
        geometry: {
          type: "Point",
          coordinates: coords,
        },
      };
    })
    .filter(Boolean);

  return {
    type: "FeatureCollection",
    features,
  };
};

/**
 * Converts route data to GeoJSON format
 *
 * @param {Array} route - Array of route points
 * @returns {Object} - GeoJSON Feature with LineString geometry
 */
export const routeToGeoJSON = (route) => {
  if (!route || !Array.isArray(route) || route.length < 2) return null;

  const coordinates = route
    .map((point) => ensureMapboxFormat(point))
    .filter(Boolean);

  if (coordinates.length < 2) return null;

  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates,
    },
  };
};`;

    fs.writeFileSync(mapUtilsPath, mapUtilsContent);
    console.log("Created mapUtils.js utility file.");
  } else {
    console.log("mapUtils.js already exists, skipping creation.");
  }

  // 2. Modify the main Map component to use the coordinate format utility
  const mapComponentPath = path.join(COMPONENTS_DIR, "Map.jsx");
  if (fs.existsSync(mapComponentPath)) {
    console.log("Updating Map.jsx to use the coordinate format utility...");

    let mapContent = fs.readFileSync(mapComponentPath, "utf8");

    // Check if we need to add the import
    if (!mapContent.includes("ensureMapboxFormat")) {
      // Add import at the top of the file, after other imports
      mapContent = mapContent.replace(
        /(import\s+.*;\s*)(\/\*\*|\n\n|const|function|class|export)/,
        '$1import { ensureMapboxFormat } from "../utils/mapUtils";\n\n$2'
      );

      // Fix coordinate usage in marker creation
      mapContent = mapContent.replace(
        /\.setLngLat\(\s*vehicleLocation\s*\)/g,
        ".setLngLat(ensureMapboxFormat(vehicleLocation) || [-98.5795, 39.8283])"
      );

      // Fix coordinate usage in route rendering
      mapContent = mapContent.replace(
        /(const\s+coordinates\s*=\s*routeData\s*\.\s*map\s*\(\s*\([^)]*\)\s*=>\s*)\[[^]]+\]/g,
        "$1ensureMapboxFormat(coord) || null"
      );

      // Fix coordinate usage in destination markers
      mapContent = mapContent.replace(
        /(\.setLngLat\(\s*)\[\s*dest\.longitude\s*,\s*dest\.latitude\s*\](\s*\))/g,
        "$1ensureMapboxFormat(dest.location || { longitude: dest.longitude, latitude: dest.latitude }) || [-98.5795, 39.8283]$2"
      );

      fs.writeFileSync(mapComponentPath, mapContent);
      console.log("Updated Map.jsx with coordinate format fixes.");
    } else {
      console.log(
        "Map.jsx already uses the ensureMapboxFormat utility, skipping modification."
      );
    }
  } else {
    console.log("Warning: Map.jsx not found in components directory.");
  }

  // 3. Apply the fixes to MapTester component if it exists
  const mapTesterPath = path.join(COMPONENTS_DIR, "MapTester.jsx");
  if (fs.existsSync(mapTesterPath)) {
    console.log("Updating MapTester.jsx with coordinate format fixes...");

    let testerContent = fs.readFileSync(mapTesterPath, "utf8");

    if (!testerContent.includes("ensureMapboxFormat")) {
      // Add import
      testerContent = testerContent.replace(
        /(import\s+.*;\s*)(\/\*\*|\n\n|const|function|class|export)/,
        '$1import { ensureMapboxFormat } from "../utils/mapUtils";\n\n$2'
      );

      // Fix coordinate handling in the component
      testerContent = testerContent.replace(
        /\.setLngLat\(\s*(\[[^\]]*\]|{[^}]*})\s*\)/g,
        ".setLngLat(ensureMapboxFormat($1) || [-98.5795, 39.8283])"
      );

      fs.writeFileSync(mapTesterPath, testerContent);
      console.log("Updated MapTester.jsx with coordinate format fixes.");
    } else {
      console.log(
        "MapTester.jsx already uses the ensureMapboxFormat utility, skipping modification."
      );
    }
  }

  console.log("\nCoordinate format fix applied successfully!");
  console.log("\nTo test the fixed functionality:");
  console.log('1. Run "npm run dev" to start the development server');
  console.log("2. Open http://localhost:5173/map-fix-test in your browser");
  console.log("3. Try different coordinate formats using the test buttons");
};

// Execute the fix
try {
  fixCoordinateHandling();
} catch (error) {
  console.error("Error applying coordinate format fix:", error);
  process.exit(1);
}
