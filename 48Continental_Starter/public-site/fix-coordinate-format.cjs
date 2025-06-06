#!/usr/bin/env node

/* eslint-disable */
/* eslint-env node */

/**
 * Coordinate Format Fix Utility
 *
 * This script validates and fixes coordinate format issues in trip data.
 * It ensures all coordinates are in the proper [longitude, latitude] format
 * required by MapBox and GeoJSON.
 */

const fs = require("fs");
const path = require("path");

// Configuration
const CONFIG = {
  inputFiles: [
    "./src/data/trip-data.json",
    "../itinerary.json",
    "../itinerary-full.json",
  ],
  outputDir: "./src/data",
  backupDir: "./src/data/backups",
  validateOnly: false, // Set to true to just validate without saving
};

// Create backup directory if it doesn't exist
if (!fs.existsSync(CONFIG.backupDir)) {
  console.log(`Creating backup directory: ${CONFIG.backupDir}`);
  fs.mkdirSync(CONFIG.backupDir, { recursive: true });
}

// Create output directory if it doesn't exist
if (!fs.existsSync(CONFIG.outputDir)) {
  console.log(`Creating output directory: ${CONFIG.outputDir}`);
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

/**
 * Validate and normalize coordinates to [longitude, latitude] format
 * @param {*} coords - Coordinates in various formats
 * @returns {Array|null} Normalized [longitude, latitude] coordinates or null if invalid
 */
function validateCoordinates(coords) {
  // Skip invalid input
  if (!coords) return null;

  // If coordinates are already an array [lng, lat] or [lat, lng]
  if (Array.isArray(coords) && coords.length === 2) {
    const [first, second] = coords.map((v) =>
      typeof v === "string" ? parseFloat(v) : v
    );

    // Skip if invalid numbers
    if (isNaN(first) || isNaN(second)) return null;

    // If first value looks like latitude and second like longitude (swapped)
    if (
      Math.abs(first) <= 90 &&
      Math.abs(second) <= 180 &&
      Math.abs(second) > 90
    ) {
      console.log(
        "  ⚠️ Fixing swapped array coordinates:",
        [first, second],
        "→",
        [second, first]
      );
      return [second, first]; // [longitude, latitude]
    }

    return [first, second]; // [longitude, latitude]
  }

  // Handle if point has lat/lng properties
  if (coords.latitude !== undefined && coords.longitude !== undefined) {
    const lat =
      typeof coords.latitude === "string"
        ? parseFloat(coords.latitude)
        : coords.latitude;
    const lng =
      typeof coords.longitude === "string"
        ? parseFloat(coords.longitude)
        : coords.longitude;

    // Skip invalid values
    if (isNaN(lat) || isNaN(lng)) return null;

    return [lng, lat]; // [longitude, latitude]
  }

  // Handle if point has lng/lat properties (GeoJSON style)
  if (coords.lng !== undefined && coords.lat !== undefined) {
    const lng =
      typeof coords.lng === "string" ? parseFloat(coords.lng) : coords.lng;
    const lat =
      typeof coords.lat === "string" ? parseFloat(coords.lat) : coords.lat;

    // Skip invalid values
    if (isNaN(lat) || isNaN(lng)) return null;

    return [lng, lat]; // [longitude, latitude]
  }

  // Handle if point has coordinates array property
  if (
    coords.coordinates &&
    Array.isArray(coords.coordinates) &&
    coords.coordinates.length === 2
  ) {
    return validateCoordinates(coords.coordinates);
  }

  return null;
}

/**
 * Process a trip data object to fix coordinate formats
 * @param {Object} data - Trip data object with route and stops
 * @returns {Object} Processed data with fixed coordinates
 */
function processTripData(data) {
  console.log("Processing trip data...");
  const result = { ...data };
  let fixedCoordinates = 0;
  let totalCoordinates = 0;

  // Process route coordinates
  if (data.route && Array.isArray(data.route)) {
    console.log("Processing route coordinates...");
    result.route = data.route
      .map((point) => {
        totalCoordinates++;
        const coords = validateCoordinates(point);
        if (coords) {
          // Only count as fixed if the original was not an array or was swapped
          if (
            !Array.isArray(point) ||
            (Array.isArray(point) && point[0] !== coords[0]) ||
            point[1] !== coords[1]
          ) {
            fixedCoordinates++;
          }
          return coords;
        }
        console.log("  ❌ Invalid route coordinate:", point);
        return null;
      })
      .filter(Boolean);
    console.log(
      `  ✅ Processed ${result.route.length} route coordinates (${
        data.route.length - result.route.length
      } invalid)`
    );
  }

  // Process stop coordinates
  if (data.stops && Array.isArray(data.stops)) {
    console.log("Processing stop coordinates...");
    result.stops = data.stops
      .map((stop) => {
        totalCoordinates++;
        let coords;

        // Extract coordinates based on format
        if (Array.isArray(stop)) {
          coords = validateCoordinates(stop);
          if (coords) {
            return { coordinates: coords };
          }
        } else if (typeof stop === "object") {
          coords = validateCoordinates(stop);
          if (coords) {
            // Preserve other properties and update coordinates
            const newStop = { ...stop };

            // Remove old coordinate properties
            delete newStop.latitude;
            delete newStop.longitude;
            delete newStop.lat;
            delete newStop.lng;
            if (newStop.coordinates) delete newStop.coordinates;

            // Add standardized coordinates
            newStop.coordinates = coords;

            if (
              !Array.isArray(stop) ||
              !stop.coordinates ||
              stop.coordinates[0] !== coords[0] ||
              stop.coordinates[1] !== coords[1]
            ) {
              fixedCoordinates++;
            }

            return newStop;
          }
        }

        console.log("  ❌ Invalid stop coordinate:", stop);
        return null;
      })
      .filter(Boolean);
    console.log(
      `  ✅ Processed ${result.stops.length} stop coordinates (${
        data.stops.length - result.stops.length
      } invalid)`
    );
  }

  // Process waypoints if present
  if (data.waypoints && Array.isArray(data.waypoints)) {
    console.log("Processing waypoint coordinates...");
    result.waypoints = data.waypoints
      .map((point) => {
        totalCoordinates++;
        const coords = validateCoordinates(point);
        if (coords) {
          if (
            !Array.isArray(point) ||
            point[0] !== coords[0] ||
            point[1] !== coords[1]
          ) {
            fixedCoordinates++;
          }
          return coords;
        }
        console.log("  ❌ Invalid waypoint coordinate:", point);
        return null;
      })
      .filter(Boolean);
    console.log(
      `  ✅ Processed ${result.waypoints.length} waypoint coordinates (${
        data.waypoints.length - result.waypoints.length
      } invalid)`
    );
  }

  console.log(`Total coordinates processed: ${totalCoordinates}`);
  console.log(`Coordinates fixed: ${fixedCoordinates}`);

  return result;
}

/**
 * Validate and fix coordinates in a GeoJSON object
 * @param {Object} geojson - GeoJSON object
 * @returns {Object} Fixed GeoJSON object
 */
function processGeoJSON(geojson) {
  console.log("Processing GeoJSON data...");
  const result = { ...geojson };
  let fixedCoordinates = 0;
  let totalCoordinates = 0;

  // Process features
  if (geojson.features && Array.isArray(geojson.features)) {
    result.features = geojson.features.map((feature) => {
      const newFeature = { ...feature };

      if (feature.geometry) {
        // Handle Point geometries
        if (feature.geometry.type === "Point" && feature.geometry.coordinates) {
          totalCoordinates++;
          const coords = validateCoordinates(feature.geometry.coordinates);
          if (coords) {
            if (
              feature.geometry.coordinates[0] !== coords[0] ||
              feature.geometry.coordinates[1] !== coords[1]
            ) {
              fixedCoordinates++;
              console.log(
                "  ⚠️ Fixing Point coordinates:",
                feature.geometry.coordinates,
                "→",
                coords
              );
            }
            newFeature.geometry = { ...feature.geometry, coordinates: coords };
          }
        }

        // Handle LineString geometries
        if (
          feature.geometry.type === "LineString" &&
          Array.isArray(feature.geometry.coordinates)
        ) {
          const newCoords = feature.geometry.coordinates.map((coord) => {
            totalCoordinates++;
            const fixedCoord = validateCoordinates(coord);
            if (fixedCoord) {
              if (coord[0] !== fixedCoord[0] || coord[1] !== fixedCoord[1]) {
                fixedCoordinates++;
                console.log(
                  "  ⚠️ Fixing LineString coordinate:",
                  coord,
                  "→",
                  fixedCoord
                );
              }
              return fixedCoord;
            }
            return coord;
          });
          newFeature.geometry = { ...feature.geometry, coordinates: newCoords };
        }

        // Handle Polygon geometries
        if (
          feature.geometry.type === "Polygon" &&
          Array.isArray(feature.geometry.coordinates)
        ) {
          const newPolygonCoords = feature.geometry.coordinates.map((ring) => {
            return ring.map((coord) => {
              totalCoordinates++;
              const fixedCoord = validateCoordinates(coord);
              if (fixedCoord) {
                if (coord[0] !== fixedCoord[0] || coord[1] !== fixedCoord[1]) {
                  fixedCoordinates++;
                  console.log(
                    "  ⚠️ Fixing Polygon coordinate:",
                    coord,
                    "→",
                    fixedCoord
                  );
                }
                return fixedCoord;
              }
              return coord;
            });
          });
          newFeature.geometry = {
            ...feature.geometry,
            coordinates: newPolygonCoords,
          };
        }
      }

      return newFeature;
    });
  }

  console.log(`Total GeoJSON coordinates processed: ${totalCoordinates}`);
  console.log(`GeoJSON coordinates fixed: ${fixedCoordinates}`);

  return result;
}

/**
 * Main function to process all input files
 */
function main() {
  console.log("Starting coordinate format fix utility...");
  console.log("Current directory:", process.cwd());

  CONFIG.inputFiles.forEach((inputFile) => {
    try {
      console.log(`\nProcessing file: ${inputFile}`);

      // Check if file exists
      if (!fs.existsSync(inputFile)) {
        console.log(`  ❌ File not found: ${inputFile}`);
        return;
      }

      // Read the file
      const fileContent = fs.readFileSync(inputFile, "utf8");
      let data;

      try {
        data = JSON.parse(fileContent);
      } catch (parseError) {
        console.error(
          `  ❌ Error parsing JSON from ${inputFile}:`,
          parseError.message
        );
        return;
      }

      // Create backup
      const backupFileName = path.join(
        CONFIG.backupDir,
        `${path.basename(inputFile, ".json")}-backup-${new Date()
          .toISOString()
          .replace(/[:.]/g, "-")}.json`
      );
      fs.writeFileSync(backupFileName, fileContent);
      console.log(`  📦 Created backup: ${backupFileName}`);

      // Process data based on type
      let processedData;

      // Check if it's GeoJSON format
      if (data.type === "FeatureCollection" && Array.isArray(data.features)) {
        processedData = processGeoJSON(data);
      } else if (data.route || data.stops || data.waypoints) {
        // Trip data format
        processedData = processTripData(data);
      } else {
        console.log("  ⚠️ Unknown data format, skipping processing");
        processedData = data;
      }

      // Save processed data if not in validate-only mode
      if (!CONFIG.validateOnly) {
        const outputFileName = path.join(
          CONFIG.outputDir,
          path.basename(inputFile, ".json") + "-fixed.json"
        );
        fs.writeFileSync(
          outputFileName,
          JSON.stringify(processedData, null, 2)
        );
        console.log(`  💾 Saved processed data to: ${outputFileName}`);
      } else {
        console.log("  ℹ️ Validate-only mode, not saving changes");
      }
    } catch (error) {
      console.error(`  ❌ Error processing ${inputFile}:`, error);
    }
  });

  console.log("\nCoordinate format fix utility completed!");
  console.log(
    'To use fixed data in the application, copy or rename the "-fixed.json" files to replace the originals.'
  );
}

// Run the main function
main();
