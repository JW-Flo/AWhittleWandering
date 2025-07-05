#!/usr/bin/env node
/**
 * Coordinate Format Validation and Fixing Tool
 *
 * This script validates and fixes coordinate formats in GeoJSON and JSON data,
 * ensuring they are in the correct [longitude, latitude] format required by
 * MapBox GL JS.
 *
 * Usage:
 * node scripts/validate-and-fix-coordinates.cjs [input-file] [output-file]
 */

const fs = require("fs");
const path = require("path");

// Configuration
const DEFAULT_INPUT = path.join(__dirname, "..", "itinerary.json");
const DEFAULT_OUTPUT = path.join(__dirname, "..", "itinerary-fixed.json");

// ANSI color codes for terminal output
const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

// Get command line arguments
const args = process.argv.slice(2);
const inputFile = args[0] || DEFAULT_INPUT;
const outputFile = args[1] || DEFAULT_OUTPUT;

console.log(
  `${COLORS.blue}Coordinate Format Validation and Fixing Tool${COLORS.reset}`
);
console.log(
  `${COLORS.blue}==========================================${COLORS.reset}`
);
console.log(`Input file: ${COLORS.cyan}${inputFile}${COLORS.reset}`);
console.log(`Output file: ${COLORS.cyan}${outputFile}${COLORS.reset}\n`);

/**
 * Validate and fix coordinate format
 * Ensures coordinates are in [longitude, latitude] format
 * @param {Array|Object} coords - Coordinates to validate and normalize
 * @returns {Array|null} - Normalized [longitude, latitude] array or null if invalid
 */
function validateAndFixCoordinates(coords) {
  // Handle array coordinates [x, y]
  if (Array.isArray(coords) && coords.length === 2) {
    const [first, second] = coords.map((v) =>
      typeof v === "string" ? parseFloat(v) : v
    );

    // Skip if invalid numbers
    if (isNaN(first) || isNaN(second)) {
      console.log(
        `${COLORS.red}Invalid coordinates: ${JSON.stringify(
          coords
        )} - Not numbers${COLORS.reset}`
      );
      return null;
    }

    // Check if values are within valid ranges
    // Longitude: -180 to 180, Latitude: -90 to 90
    const isFirstLongitude =
      Math.abs(first) <= 180 && (Math.abs(first) > 90 || Math.abs(second) > 90);
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
      console.log(
        `${COLORS.yellow}Fixed swapped coordinates: [${first}, ${second}] → [${second}, ${first}]${COLORS.reset}`
      );
      return [second, first]; // [longitude, latitude]
    }

    // If both values are within latitude range, make a best guess
    if (Math.abs(first) <= 90 && Math.abs(second) <= 90) {
      // In the US, longitude values are typically larger than latitude values
      if (Math.abs(first) > Math.abs(second)) {
        return [first, second]; // first is likely longitude
      } else {
        console.log(
          `${COLORS.yellow}Best guess swap: [${first}, ${second}] → [${second}, ${first}]${COLORS.reset}`
        );
        return [second, first]; // second is likely longitude
      }
    }

    // Fallback to original order if we can't determine
    console.log(
      `${COLORS.yellow}Using original order for: [${first}, ${second}]${COLORS.reset}`
    );
    return [first, second];
  }

  // Handle object with lat/lng or latitude/longitude properties
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
      console.log(
        `${COLORS.green}Extracted from lat/lng properties: [${lng}, ${lat}]${COLORS.reset}`
      );
    }
    // Handle lat/lng properties (GeoJSON style)
    else if (coords.lat !== undefined && coords.lng !== undefined) {
      lat =
        typeof coords.lat === "string" ? parseFloat(coords.lat) : coords.lat;
      lng =
        typeof coords.lng === "string" ? parseFloat(coords.lng) : coords.lng;
      console.log(
        `${COLORS.green}Extracted from lat/lng properties: [${lng}, ${lat}]${COLORS.reset}`
      );
    }
    // Handle coordinates array property
    else if (
      coords.coordinates &&
      Array.isArray(coords.coordinates) &&
      coords.coordinates.length === 2
    ) {
      return validateAndFixCoordinates(coords.coordinates);
    }

    // Skip if invalid numbers
    if (lng === undefined || lat === undefined || isNaN(lng) || isNaN(lat)) {
      console.log(
        `${COLORS.red}Invalid object coordinates: ${JSON.stringify(coords)}${
          COLORS.reset
        }`
      );
      return null;
    }

    // Check if values are within valid ranges
    const validLng = Math.abs(lng) <= 180;
    const validLat = Math.abs(lat) <= 90;

    if (!validLng || !validLat) {
      // Check if they're swapped
      if (Math.abs(lng) <= 90 && Math.abs(lat) <= 180 && Math.abs(lat) > 90) {
        console.log(
          `${COLORS.yellow}Fixed swapped lat/lng properties: { lat: ${lat}, lng: ${lng} } → [${lat}, ${lng}]${COLORS.reset}`
        );
        return [lat, lng]; // [longitude, latitude] with swapped values
      }
      console.log(
        `${COLORS.red}Out of range coordinates: { lat: ${lat}, lng: ${lng} }${COLORS.reset}`
      );
      return null;
    }

    return [lng, lat]; // [longitude, latitude]
  }

  return null;
}

/**
 * Process GeoJSON data recursively to fix coordinate formats
 * @param {Object} data - GeoJSON data to process
 * @returns {Object} - Processed GeoJSON data with fixed coordinates
 */
function processGeoJSON(data) {
  let fixCount = 0;

  // Process a GeoJSON feature
  function processFeature(feature) {
    if (!feature || !feature.geometry) return feature;

    const geometry = feature.geometry;

    // Process Point geometry
    if (geometry.type === "Point" && Array.isArray(geometry.coordinates)) {
      const fixed = validateAndFixCoordinates(geometry.coordinates);
      if (fixed) {
        if (
          fixed[0] !== geometry.coordinates[0] ||
          fixed[1] !== geometry.coordinates[1]
        ) {
          fixCount++;
        }
        geometry.coordinates = fixed;
      }
    }

    // Process LineString geometry
    else if (
      geometry.type === "LineString" &&
      Array.isArray(geometry.coordinates)
    ) {
      geometry.coordinates = geometry.coordinates
        .map((coord) => validateAndFixCoordinates(coord))
        .filter(Boolean);
      fixCount += geometry.coordinates.length;
    }

    // Process Polygon geometry
    else if (
      geometry.type === "Polygon" &&
      Array.isArray(geometry.coordinates)
    ) {
      geometry.coordinates = geometry.coordinates.map((ring) =>
        ring.map((coord) => validateAndFixCoordinates(coord)).filter(Boolean)
      );
      fixCount += geometry.coordinates.flat().length;
    }

    // Process MultiPoint geometry
    else if (
      geometry.type === "MultiPoint" &&
      Array.isArray(geometry.coordinates)
    ) {
      geometry.coordinates = geometry.coordinates
        .map((coord) => validateAndFixCoordinates(coord))
        .filter(Boolean);
      fixCount += geometry.coordinates.length;
    }

    // Process MultiLineString geometry
    else if (
      geometry.type === "MultiLineString" &&
      Array.isArray(geometry.coordinates)
    ) {
      geometry.coordinates = geometry.coordinates.map((line) =>
        line.map((coord) => validateAndFixCoordinates(coord)).filter(Boolean)
      );
      fixCount += geometry.coordinates.flat().length;
    }

    // Process MultiPolygon geometry
    else if (
      geometry.type === "MultiPolygon" &&
      Array.isArray(geometry.coordinates)
    ) {
      geometry.coordinates = geometry.coordinates.map((polygon) =>
        polygon.map((ring) =>
          ring.map((coord) => validateAndFixCoordinates(coord)).filter(Boolean)
        )
      );
      fixCount += geometry.coordinates.flat(2).length;
    }

    return feature;
  }

  // Handle direct feature
  if (data.type === "Feature") {
    data = processFeature(data);
  }

  // Handle FeatureCollection
  else if (data.type === "FeatureCollection" && Array.isArray(data.features)) {
    data.features = data.features.map((feature) => processFeature(feature));
  }

  // Handle route/stops format
  else {
    // Process route coordinates
    if (Array.isArray(data.route)) {
      const fixedRoute = [];

      for (const point of data.route) {
        let coordinates;

        // Handle different coordinate formats
        if (point.latitude !== undefined && point.longitude !== undefined) {
          coordinates = validateAndFixCoordinates({
            latitude: point.latitude,
            longitude: point.longitude,
          });

          if (coordinates) {
            fixedRoute.push({
              ...point,
              longitude: coordinates[0],
              latitude: coordinates[1],
              coordinates, // Add GeoJSON-compatible coordinates array
            });
            fixCount++;
          }
        } else if (Array.isArray(point)) {
          coordinates = validateAndFixCoordinates(point);

          if (coordinates) {
            fixedRoute.push({
              longitude: coordinates[0],
              latitude: coordinates[1],
              coordinates,
            });
            fixCount++;
          }
        } else if (point.coordinates && Array.isArray(point.coordinates)) {
          coordinates = validateAndFixCoordinates(point.coordinates);

          if (coordinates) {
            fixedRoute.push({
              ...point,
              longitude: coordinates[0],
              latitude: coordinates[1],
              coordinates,
            });
            fixCount++;
          }
        } else if (point.lat !== undefined && point.lng !== undefined) {
          coordinates = validateAndFixCoordinates({
            lat: point.lat,
            lng: point.lng,
          });

          if (coordinates) {
            fixedRoute.push({
              ...point,
              longitude: coordinates[0],
              latitude: coordinates[1],
              coordinates,
            });
            fixCount++;
          }
        } else {
          // Can't fix this format, keep as-is
          fixedRoute.push(point);
        }
      }

      data.route = fixedRoute;
    }

    // Process stops coordinates
    if (Array.isArray(data.stops)) {
      const fixedStops = [];

      for (const stop of data.stops) {
        let coordinates;

        // Handle different coordinate formats
        if (stop.latitude !== undefined && stop.longitude !== undefined) {
          coordinates = validateAndFixCoordinates({
            latitude: stop.latitude,
            longitude: stop.longitude,
          });

          if (coordinates) {
            fixedStops.push({
              ...stop,
              longitude: coordinates[0],
              latitude: coordinates[1],
              coordinates, // Add GeoJSON-compatible coordinates array
            });
            fixCount++;
          } else {
            fixedStops.push(stop); // Keep original if we can't fix
          }
        } else if (Array.isArray(stop.coordinates)) {
          coordinates = validateAndFixCoordinates(stop.coordinates);

          if (coordinates) {
            fixedStops.push({
              ...stop,
              longitude: coordinates[0],
              latitude: coordinates[1],
              coordinates,
            });
            fixCount++;
          } else {
            fixedStops.push(stop); // Keep original if we can't fix
          }
        } else if (stop.lat !== undefined && stop.lng !== undefined) {
          coordinates = validateAndFixCoordinates({
            lat: stop.lat,
            lng: stop.lng,
          });

          if (coordinates) {
            fixedStops.push({
              ...stop,
              longitude: coordinates[0],
              latitude: coordinates[1],
              coordinates,
            });
            fixCount++;
          } else {
            fixedStops.push(stop); // Keep original if we can't fix
          }
        } else {
          // Can't fix this format, keep as-is
          fixedStops.push(stop);
        }
      }

      data.stops = fixedStops;
    }
  }

  console.log(
    `${COLORS.green}Fixed ${fixCount} coordinate sets${COLORS.reset}`
  );
  return data;
}

// Main execution
try {
  // Read input file
  console.log(`${COLORS.blue}Reading input file...${COLORS.reset}`);
  const rawData = fs.readFileSync(inputFile, "utf8");
  let data;

  try {
    data = JSON.parse(rawData);
  } catch (parseError) {
    console.error(
      `${COLORS.red}Error parsing JSON: ${parseError.message}${COLORS.reset}`
    );
    process.exit(1);
  }

  // Process and fix coordinates
  console.log(`${COLORS.blue}Processing coordinates...${COLORS.reset}`);
  const fixedData = processGeoJSON(data);

  // Write output file
  console.log(
    `${COLORS.blue}Writing fixed data to output file...${COLORS.reset}`
  );
  fs.writeFileSync(outputFile, JSON.stringify(fixedData, null, 2), "utf8");

  console.log(
    `\n${COLORS.green}✓ Success! Fixed coordinates saved to ${outputFile}${COLORS.reset}`
  );

  // Create a GeoJSON version for easy visualization
  const geoJsonOutputFile = outputFile.replace(".json", "-geo.json");

  // Convert to GeoJSON if not already in that format
  let geoJsonData;

  if (fixedData.type === "FeatureCollection" || fixedData.type === "Feature") {
    // Already GeoJSON
    geoJsonData = fixedData;
  } else {
    // Convert route to GeoJSON
    const features = [];

    // Add route as LineString if it exists
    if (Array.isArray(fixedData.route) && fixedData.route.length > 1) {
      const routeCoordinates = fixedData.route
        .map((point) => {
          if (Array.isArray(point.coordinates)) {
            return point.coordinates;
          } else if (
            point.longitude !== undefined &&
            point.latitude !== undefined
          ) {
            return [point.longitude, point.latitude];
          }
          return null;
        })
        .filter(Boolean);

      if (routeCoordinates.length > 1) {
        features.push({
          type: "Feature",
          properties: {
            name: "Route",
            description: "48 Continental USA Road Trip Route",
          },
          geometry: {
            type: "LineString",
            coordinates: routeCoordinates,
          },
        });
      }
    }

    // Add stops as Points if they exist
    if (Array.isArray(fixedData.stops)) {
      fixedData.stops.forEach((stop, idx) => {
        let coordinates;

        if (Array.isArray(stop.coordinates)) {
          coordinates = stop.coordinates;
        } else if (
          stop.longitude !== undefined &&
          stop.latitude !== undefined
        ) {
          coordinates = [stop.longitude, stop.latitude];
        }

        if (coordinates) {
          features.push({
            type: "Feature",
            properties: {
              id: stop.id || `stop-${idx}`,
              name: stop.name || `Stop ${idx}`,
              description: stop.description || stop.name || "",
              type: stop.type || "waypoint",
              overnight: stop.overnight || false,
              charging: stop.charging || false,
              state: stop.state || "",
            },
            geometry: {
              type: "Point",
              coordinates,
            },
          });
        }
      });
    }

    geoJsonData = {
      type: "FeatureCollection",
      features,
    };
  }

  // Write GeoJSON file
  fs.writeFileSync(
    geoJsonOutputFile,
    JSON.stringify(geoJsonData, null, 2),
    "utf8"
  );
  console.log(
    `${COLORS.green}✓ GeoJSON version saved to ${geoJsonOutputFile}${COLORS.reset}`
  );
} catch (error) {
  console.error(`${COLORS.red}Error: ${error.message}${COLORS.reset}`);
  process.exit(1);
}
