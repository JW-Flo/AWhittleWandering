#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-env node */

/**
 * Coordinate Format Fix Script
 *
 * This script ensures that all coordinates in the itinerary data files follow the correct format:
 * - GeoJSON requires [longitude, latitude] format for coordinates arrays
 * - Individual properties should have separate latitude and longitude properties
 * - All coordinate values must be within valid ranges (-180 to 180 for longitude, -90 to 90 for latitude)
 *
 * The script processes:
 * 1. itinerary.json - Simplified format
 * 2. itinerary-full.json - GeoJSON format
 * 3. edge-worker/trip-data.json - KV storage format
 */

const fs = require("fs");
const path = require("path");

// File paths
const ROOT_DIR = path.resolve(__dirname, "..");
const ITINERARY_FILE = path.resolve(ROOT_DIR, "itinerary.json");
const FULL_ITINERARY_FILE = path.resolve(ROOT_DIR, "itinerary-full.json");
const EDGE_WORKER_DATA_FILE = path.resolve(
  ROOT_DIR,
  "edge-worker/trip-data.json"
);

// Helper to check if a file exists
const fileExists = (filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
};

// Validate coordinate values
const isValidCoordinate = (lng, lat) => {
  return (
    typeof lng === "number" &&
    typeof lat === "number" &&
    !isNaN(lng) &&
    !isNaN(lat) &&
    Math.abs(lng) <= 180 &&
    Math.abs(lat) <= 90
  );
};

// Swap coordinates if they appear to be in the wrong order
// Logic: If the first value looks like latitude and second like longitude
const fixCoordinateOrder = (coord) => {
  if (!Array.isArray(coord) || coord.length !== 2) {
    return null;
  }

  const [first, second] = coord;

  // Both values should be numbers
  if (typeof first !== "number" || typeof second !== "number") {
    return null;
  }

  // If coordinates look correct (longitude, latitude)
  if (Math.abs(first) <= 180 && Math.abs(second) <= 90) {
    return [first, second]; // Already in correct GeoJSON order
  }
  // If coordinates seem swapped (latitude, longitude)
  else if (Math.abs(first) <= 90 && Math.abs(second) <= 180) {
    console.log(
      `Swapping coordinates from [${first}, ${second}] to [${second}, ${first}]`
    );
    return [second, first]; // Swap to correct GeoJSON order
  }

  // Invalid coordinates
  return null;
};

// Process simplified itinerary file
const fixSimplifiedItinerary = () => {
  if (!fileExists(ITINERARY_FILE)) {
    console.log(`${ITINERARY_FILE} not found. Skipping.`);
    return false;
  }

  try {
    console.log(`Processing ${path.basename(ITINERARY_FILE)}...`);

    const data = JSON.parse(fs.readFileSync(ITINERARY_FILE, "utf8"));
    let fixedCount = 0;

    if (!data.stops || !Array.isArray(data.stops)) {
      console.log(
        `Invalid format in ${path.basename(
          ITINERARY_FILE
        )}: missing or invalid 'stops' array.`
      );
      return false;
    }

    // Fix each stop
    for (const stop of data.stops) {
      // Fix individual latitude/longitude properties
      if (
        stop.latitude !== undefined &&
        stop.longitude !== undefined &&
        !isValidCoordinate(stop.longitude, stop.latitude)
      ) {
        // If values are swapped (longitude in latitude field and vice versa)
        if (isValidCoordinate(stop.latitude, stop.longitude)) {
          console.log(
            `Fixing swapped latitude/longitude in stop: ${stop.location}`
          );
          const tempLat = stop.latitude;
          stop.latitude = stop.longitude;
          stop.longitude = tempLat;
          fixedCount++;
        }
      }

      // Fix or create coordinates array
      if (Array.isArray(stop.coordinates) && stop.coordinates.length === 2) {
        const fixedCoords = fixCoordinateOrder(stop.coordinates);
        if (fixedCoords) {
          if (
            fixedCoords[0] !== stop.coordinates[0] ||
            fixedCoords[1] !== stop.coordinates[1]
          ) {
            stop.coordinates = fixedCoords;
            fixedCount++;
          }

          // Make sure coordinates match individual properties
          if (
            stop.coordinates[0] !== stop.longitude ||
            stop.coordinates[1] !== stop.latitude
          ) {
            stop.coordinates = [stop.longitude, stop.latitude];
            fixedCount++;
          }
        }
      } else if (stop.latitude !== undefined && stop.longitude !== undefined) {
        // Create coordinates array if it doesn't exist
        stop.coordinates = [stop.longitude, stop.latitude]; // GeoJSON format: [lng, lat]
        fixedCount++;
      }
    }

    if (fixedCount > 0) {
      fs.writeFileSync(ITINERARY_FILE, JSON.stringify(data, null, 2));
      console.log(
        `✓ Fixed ${fixedCount} coordinate issues in ${path.basename(
          ITINERARY_FILE
        )}`
      );
    } else {
      console.log(`✓ No issues found in ${path.basename(ITINERARY_FILE)}`);
    }

    return true;
  } catch (error) {
    console.error(
      `Error processing ${path.basename(ITINERARY_FILE)}: ${error.message}`
    );
    return false;
  }
};

// Process GeoJSON itinerary file
const fixGeoJSONItinerary = () => {
  if (!fileExists(FULL_ITINERARY_FILE)) {
    console.log(`${FULL_ITINERARY_FILE} not found. Skipping.`);
    return false;
  }

  try {
    console.log(`Processing ${path.basename(FULL_ITINERARY_FILE)}...`);

    const data = JSON.parse(fs.readFileSync(FULL_ITINERARY_FILE, "utf8"));
    let fixedCount = 0;

    if (
      !data.features ||
      !Array.isArray(data.features) ||
      data.features.length === 0
    ) {
      console.log(
        `Invalid format in ${path.basename(
          FULL_ITINERARY_FILE
        )}: missing or invalid 'features' array.`
      );
      return false;
    }

    const feature = data.features[0];

    // Fix geometry coordinates (GeoJSON format: [longitude, latitude])
    if (
      feature.geometry &&
      feature.geometry.type === "LineString" &&
      Array.isArray(feature.geometry.coordinates)
    ) {
      const coordinates = feature.geometry.coordinates;

      for (let i = 0; i < coordinates.length; i++) {
        const fixedCoords = fixCoordinateOrder(coordinates[i]);
        if (
          fixedCoords &&
          (fixedCoords[0] !== coordinates[i][0] ||
            fixedCoords[1] !== coordinates[i][1])
        ) {
          coordinates[i] = fixedCoords;
          fixedCount++;
        }
      }
    }

    // Fix stops in properties
    if (
      feature.properties &&
      feature.properties.stops &&
      Array.isArray(feature.properties.stops)
    ) {
      const stops = feature.properties.stops;

      for (const stop of stops) {
        // Fix individual latitude/longitude properties
        if (
          stop.latitude !== undefined &&
          stop.longitude !== undefined &&
          !isValidCoordinate(stop.longitude, stop.latitude)
        ) {
          // If values are swapped (longitude in latitude field and vice versa)
          if (isValidCoordinate(stop.latitude, stop.longitude)) {
            console.log(
              `Fixing swapped latitude/longitude in stop: ${stop.location}`
            );
            const tempLat = stop.latitude;
            stop.latitude = stop.longitude;
            stop.longitude = tempLat;
            fixedCount++;
          }
        }

        // Fix or create coordinates array
        if (Array.isArray(stop.coordinates) && stop.coordinates.length === 2) {
          const fixedCoords = fixCoordinateOrder(stop.coordinates);
          if (fixedCoords) {
            if (
              fixedCoords[0] !== stop.coordinates[0] ||
              fixedCoords[1] !== stop.coordinates[1]
            ) {
              stop.coordinates = fixedCoords;
              fixedCount++;
            }

            // Make sure coordinates match individual properties
            if (
              stop.coordinates[0] !== stop.longitude ||
              stop.coordinates[1] !== stop.latitude
            ) {
              stop.coordinates = [stop.longitude, stop.latitude];
              fixedCount++;
            }
          }
        } else if (
          stop.latitude !== undefined &&
          stop.longitude !== undefined
        ) {
          // Create coordinates array if it doesn't exist
          stop.coordinates = [stop.longitude, stop.latitude]; // GeoJSON format: [lng, lat]
          fixedCount++;
        }
      }
    }

    if (fixedCount > 0) {
      fs.writeFileSync(FULL_ITINERARY_FILE, JSON.stringify(data, null, 2));
      console.log(
        `✓ Fixed ${fixedCount} coordinate issues in ${path.basename(
          FULL_ITINERARY_FILE
        )}`
      );
    } else {
      console.log(`✓ No issues found in ${path.basename(FULL_ITINERARY_FILE)}`);
    }

    return true;
  } catch (error) {
    console.error(
      `Error processing ${path.basename(FULL_ITINERARY_FILE)}: ${error.message}`
    );
    return false;
  }
};

// Process KV data file
const fixKVData = () => {
  if (!fileExists(EDGE_WORKER_DATA_FILE)) {
    console.log(`${EDGE_WORKER_DATA_FILE} not found. Skipping.`);
    return false;
  }

  try {
    console.log(`Processing ${path.basename(EDGE_WORKER_DATA_FILE)}...`);

    const data = JSON.parse(fs.readFileSync(EDGE_WORKER_DATA_FILE, "utf8"));
    let fixedCount = 0;

    if (!Array.isArray(data) || data.length === 0) {
      console.log(
        `Invalid format in ${path.basename(
          EDGE_WORKER_DATA_FILE
        )}: expected array of KV objects.`
      );
      return false;
    }

    for (const item of data) {
      if (typeof item.key === "string" && typeof item.value === "string") {
        try {
          // Try to parse the value as JSON
          const parsedValue = JSON.parse(item.value);

          // If it's GeoJSON, fix the coordinates
          if (
            parsedValue &&
            parsedValue.type === "FeatureCollection" &&
            Array.isArray(parsedValue.features)
          ) {
            let valueFixedCount = 0;

            for (const feature of parsedValue.features) {
              // Fix geometry coordinates
              if (
                feature.geometry &&
                feature.geometry.type === "LineString" &&
                Array.isArray(feature.geometry.coordinates)
              ) {
                const coordinates = feature.geometry.coordinates;

                for (let i = 0; i < coordinates.length; i++) {
                  const fixedCoords = fixCoordinateOrder(coordinates[i]);
                  if (
                    fixedCoords &&
                    (fixedCoords[0] !== coordinates[i][0] ||
                      fixedCoords[1] !== coordinates[i][1])
                  ) {
                    coordinates[i] = fixedCoords;
                    valueFixedCount++;
                  }
                }
              }

              // Fix stops in properties
              if (
                feature.properties &&
                feature.properties.stops &&
                Array.isArray(feature.properties.stops)
              ) {
                const stops = feature.properties.stops;

                for (const stop of stops) {
                  // Fix individual latitude/longitude properties
                  if (
                    stop.latitude !== undefined &&
                    stop.longitude !== undefined &&
                    !isValidCoordinate(stop.longitude, stop.latitude)
                  ) {
                    // If values are swapped (longitude in latitude field and vice versa)
                    if (isValidCoordinate(stop.latitude, stop.longitude)) {
                      console.log(
                        `Fixing swapped latitude/longitude in KV stop: ${stop.location}`
                      );
                      const tempLat = stop.latitude;
                      stop.latitude = stop.longitude;
                      stop.longitude = tempLat;
                      valueFixedCount++;
                    }
                  }

                  // Fix or create coordinates array
                  if (
                    Array.isArray(stop.coordinates) &&
                    stop.coordinates.length === 2
                  ) {
                    const fixedCoords = fixCoordinateOrder(stop.coordinates);
                    if (fixedCoords) {
                      if (
                        fixedCoords[0] !== stop.coordinates[0] ||
                        fixedCoords[1] !== stop.coordinates[1]
                      ) {
                        stop.coordinates = fixedCoords;
                        valueFixedCount++;
                      }

                      // Make sure coordinates match individual properties
                      if (
                        stop.coordinates[0] !== stop.longitude ||
                        stop.coordinates[1] !== stop.latitude
                      ) {
                        stop.coordinates = [stop.longitude, stop.latitude];
                        valueFixedCount++;
                      }
                    }
                  } else if (
                    stop.latitude !== undefined &&
                    stop.longitude !== undefined
                  ) {
                    // Create coordinates array if it doesn't exist
                    stop.coordinates = [stop.longitude, stop.latitude]; // GeoJSON format: [lng, lat]
                    valueFixedCount++;
                  }
                }
              }
            }

            if (valueFixedCount > 0) {
              item.value = JSON.stringify(parsedValue);
              fixedCount += valueFixedCount;
            }
          }
        } catch (error) {
          console.log(
            `Error parsing KV value for key ${item.key}: ${error.message}`
          );
        }
      }
    }

    if (fixedCount > 0) {
      fs.writeFileSync(EDGE_WORKER_DATA_FILE, JSON.stringify(data, null, 2));
      console.log(
        `✓ Fixed ${fixedCount} coordinate issues in ${path.basename(
          EDGE_WORKER_DATA_FILE
        )}`
      );
    } else {
      console.log(
        `✓ No issues found in ${path.basename(EDGE_WORKER_DATA_FILE)}`
      );
    }

    return true;
  } catch (error) {
    console.error(
      `Error processing ${path.basename(EDGE_WORKER_DATA_FILE)}: ${
        error.message
      }`
    );
    return false;
  }
};

// Run the coordinate fixes
console.log("🌍 Coordinate Format Fix Utility");
console.log("=============================");

const simplifiedFixed = fixSimplifiedItinerary();
const geoJSONFixed = fixGeoJSONItinerary();
const kvDataFixed = fixKVData();

console.log("\nSummary:");
console.log("========");
console.log(
  `Simplified itinerary: ${simplifiedFixed ? "✓ Processed" : "✗ Failed"}`
);
console.log(`GeoJSON itinerary: ${geoJSONFixed ? "✓ Processed" : "✗ Failed"}`);
console.log(`KV data: ${kvDataFixed ? "✓ Processed" : "✗ Failed"}`);
console.log("\nCoordinate format fix complete!");
