#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-env node */

/**
 * Fix Coordinate Format Script
 *
 * This script addresses coordinate format inconsistencies between
 * itinerary data and map rendering by ensuring all coordinate data
 * follows a consistent pattern. It processes both itinerary files
 * and ensures they use the correct GeoJSON format for MapBox.
 */

const fs = require("fs");
const path = require("path");

console.log("🔄 Starting coordinate format fix operation...");

// Paths to the itinerary files
const itineraryFullPath = path.resolve(__dirname, "../itinerary-full.json");
const itinerarySimplePath = path.resolve(__dirname, "../itinerary.json");
const kvDataPath = path.resolve(__dirname, "../edge-worker/trip-data.json");

// Load the files if they exist
let itineraryFull, itinerarySimple, kvData;

try {
  console.log(`Loading itinerary-full.json...`);
  itineraryFull = JSON.parse(fs.readFileSync(itineraryFullPath, "utf8"));
  console.log(`✅ Loaded itinerary-full.json successfully`);
} catch (error) {
  console.error(`❌ Error loading itinerary-full.json: ${error.message}`);
}

try {
  console.log(`Loading itinerary.json...`);
  itinerarySimple = JSON.parse(fs.readFileSync(itinerarySimplePath, "utf8"));
  console.log(`✅ Loaded itinerary.json successfully`);
} catch (error) {
  console.error(`❌ Error loading itinerary.json: ${error.message}`);
}

try {
  console.log(`Loading edge-worker/trip-data.json...`);
  kvData = JSON.parse(fs.readFileSync(kvDataPath, "utf8"));
  console.log(`✅ Loaded edge-worker/trip-data.json successfully`);
} catch (error) {
  console.error(
    `❌ Error loading edge-worker/trip-data.json: ${error.message}`
  );
}

// Validation helper function
const validateCoordinate = (lng, lat) => {
  const validLng =
    typeof lng === "number" && !isNaN(lng) && lng >= -180 && lng <= 180;
  const validLat =
    typeof lat === "number" && !isNaN(lat) && lat >= -90 && lat <= 90;

  if (!validLng || !validLat) {
    return null;
  }

  return { lng, lat };
};

// Fix itinerary-full.json
if (itineraryFull) {
  console.log("\n🔧 Fixing itinerary-full.json format...");

  try {
    // Fix LineString coordinates (should be [longitude, latitude] for GeoJSON)
    const coordinates = itineraryFull.features[0].geometry.coordinates;
    let fixedCount = 0;

    if (Array.isArray(coordinates)) {
      for (let i = 0; i < coordinates.length; i++) {
        const coord = coordinates[i];

        // If array has correct length but might be swapped
        if (Array.isArray(coord) && coord.length === 2) {
          const [first, second] = coord;

          // Check if they might be swapped
          if (
            Math.abs(second) <= 180 &&
            Math.abs(second) > 90 &&
            Math.abs(first) <= 90
          ) {
            // This looks like [lat, lng] instead of [lng, lat]
            console.log(
              `  Fixed swapped coordinate at index ${i}: [${first}, ${second}] -> [${second}, ${first}]`
            );
            coordinates[i] = [second, first];
            fixedCount++;
          }
        }
      }
    }

    // Fix stop coordinates in properties
    const stops = itineraryFull.features[0].properties.stops;
    let stopsFixed = 0;

    if (Array.isArray(stops)) {
      for (let i = 0; i < stops.length; i++) {
        const stop = stops[i];

        // Ensure coordinates property is in GeoJSON format [longitude, latitude]
        if (Array.isArray(stop.coordinates) && stop.coordinates.length === 2) {
          // If it looks like [lat, lng] instead of [lng, lat]
          const [first, second] = stop.coordinates;
          if (
            Math.abs(first) <= 90 &&
            Math.abs(second) <= 180 &&
            Math.abs(second) > 90
          ) {
            console.log(
              `  Fixed swapped coordinates property in stop ${i}: [${first}, ${second}] -> [${second}, ${first}]`
            );
            stop.coordinates = [second, first];
            stopsFixed++;
          }
        }

        // Ensure latitude/longitude properties match the coordinates
        if (Array.isArray(stop.coordinates) && stop.coordinates.length === 2) {
          const [lng, lat] = stop.coordinates; // Should be [lng, lat] in GeoJSON

          if (stop.latitude !== lat || stop.longitude !== lng) {
            console.log(`  Fixed mismatched lat/lng properties in stop ${i}`);
            stop.longitude = lng;
            stop.latitude = lat;
            stopsFixed++;
          }
        }
      }
    }

    console.log(
      `✅ Fixed ${fixedCount} coordinates and ${stopsFixed} stops in itinerary-full.json`
    );

    // Write the fixed data back to the file
    fs.writeFileSync(itineraryFullPath, JSON.stringify(itineraryFull, null, 2));
    console.log(`✅ Saved fixed itinerary-full.json`);
  } catch (error) {
    console.error(`❌ Error fixing itinerary-full.json: ${error.message}`);
  }
}

// Fix itinerary.json
if (itinerarySimple) {
  console.log("\n🔧 Fixing itinerary.json format...");

  try {
    const stops = itinerarySimple.stops;
    let stopsFixed = 0;

    if (Array.isArray(stops)) {
      for (let i = 0; i < stops.length; i++) {
        const stop = stops[i];

        // Ensure coordinates property is in GeoJSON format [longitude, latitude]
        if (Array.isArray(stop.coordinates) && stop.coordinates.length === 2) {
          // If it looks like [lat, lng] instead of [lng, lat]
          const [first, second] = stop.coordinates;
          if (
            Math.abs(first) <= 90 &&
            Math.abs(second) <= 180 &&
            Math.abs(second) > 90
          ) {
            console.log(
              `  Fixed swapped coordinates property in stop ${i}: [${first}, ${second}] -> [${second}, ${first}]`
            );
            stop.coordinates = [second, first];
            stopsFixed++;
          }
        }

        // Ensure latitude/longitude properties are set correctly
        // In simplified format, these should match their names (not GeoJSON format)
        const validLatLng = validateCoordinate(stop.longitude, stop.latitude);

        if (!validLatLng) {
          // Try to fix by swapping
          const validSwapped = validateCoordinate(
            stop.latitude,
            stop.longitude
          );

          if (validSwapped) {
            console.log(`  Fixed swapped lat/lng properties in stop ${i}`);
            const temp = stop.latitude;
            stop.latitude = stop.longitude;
            stop.longitude = temp;
            stopsFixed++;
          }
        }

        // Ensure coordinates and lat/lng properties are in sync
        if (Array.isArray(stop.coordinates) && stop.coordinates.length === 2) {
          const [lng, lat] = stop.coordinates; // Should be [lng, lat] in GeoJSON

          if (stop.longitude !== lng || stop.latitude !== lat) {
            console.log(`  Fixed mismatched coordinates in stop ${i}`);
            // Update only the lat/lng properties to match coordinates
            stop.longitude = lng;
            stop.latitude = lat;
            stopsFixed++;
          }
        }
      }
    }

    console.log(`✅ Fixed ${stopsFixed} stops in itinerary.json`);

    // Write the fixed data back to the file
    fs.writeFileSync(
      itinerarySimplePath,
      JSON.stringify(itinerarySimple, null, 2)
    );
    console.log(`✅ Saved fixed itinerary.json`);
  } catch (error) {
    console.error(`❌ Error fixing itinerary.json: ${error.message}`);
  }
}

// Fix KV data
if (kvData) {
  console.log("\n🔧 Fixing edge-worker/trip-data.json format...");

  try {
    // The KV data is an array with objects containing 'key' and 'value' properties
    // We need to parse the 'value' property of the 'itinerary' key, fix it, and stringify it back

    for (let i = 0; i < kvData.length; i++) {
      if (kvData[i].key === "itinerary") {
        let itineraryData;

        try {
          // Parse the value
          itineraryData = JSON.parse(kvData[i].value);

          // Fix the coordinates
          const coordinates = itineraryData.features[0].geometry.coordinates;
          let fixedCount = 0;

          if (Array.isArray(coordinates)) {
            for (let j = 0; j < coordinates.length; j++) {
              const coord = coordinates[j];

              // If array has correct length but might be swapped
              if (Array.isArray(coord) && coord.length === 2) {
                const [first, second] = coord;

                // Check if they might be swapped
                if (
                  Math.abs(second) <= 180 &&
                  Math.abs(second) > 90 &&
                  Math.abs(first) <= 90
                ) {
                  // This looks like [lat, lng] instead of [lng, lat]
                  console.log(
                    `  Fixed swapped coordinate at index ${j}: [${first}, ${second}] -> [${second}, ${first}]`
                  );
                  coordinates[j] = [second, first];
                  fixedCount++;
                }
              }
            }
          }

          // Fix stop coordinates in properties
          const stops = itineraryData.features[0].properties.stops;
          let stopsFixed = 0;

          if (Array.isArray(stops)) {
            for (let j = 0; j < stops.length; j++) {
              const stop = stops[j];

              // Ensure coordinates property is in GeoJSON format [longitude, latitude]
              if (
                Array.isArray(stop.coordinates) &&
                stop.coordinates.length === 2
              ) {
                // If it looks like [lat, lng] instead of [lng, lat]
                const [first, second] = stop.coordinates;
                if (
                  Math.abs(first) <= 90 &&
                  Math.abs(second) <= 180 &&
                  Math.abs(second) > 90
                ) {
                  console.log(
                    `  Fixed swapped coordinates property in KV stop ${j}: [${first}, ${second}] -> [${second}, ${first}]`
                  );
                  stop.coordinates = [second, first];
                  stopsFixed++;
                }
              }

              // Ensure latitude/longitude properties match the coordinates
              if (
                Array.isArray(stop.coordinates) &&
                stop.coordinates.length === 2
              ) {
                const [lng, lat] = stop.coordinates; // Should be [lng, lat] in GeoJSON

                if (stop.latitude !== lat || stop.longitude !== lng) {
                  console.log(
                    `  Fixed mismatched lat/lng properties in KV stop ${j}`
                  );
                  stop.longitude = lng;
                  stop.latitude = lat;
                  stopsFixed++;
                }
              }
            }
          }

          console.log(
            `✅ Fixed ${fixedCount} coordinates and ${stopsFixed} stops in KV data`
          );

          // Update the value with the fixed data
          kvData[i].value = JSON.stringify(itineraryData);
        } catch (parseError) {
          console.error(
            `❌ Error parsing itinerary data in KV: ${parseError.message}`
          );
        }
      }
    }

    // Write the fixed data back to the file
    fs.writeFileSync(kvDataPath, JSON.stringify(kvData, null, 2));
    console.log(`✅ Saved fixed edge-worker/trip-data.json`);
  } catch (error) {
    console.error(
      `❌ Error fixing edge-worker/trip-data.json: ${error.message}`
    );
  }
}

console.log("\n🏁 Coordinate format fix operation complete.");
console.log("Next step: Run the following command to upload fixed KV data:");
console.log(
  "cd edge-worker && npx wrangler kv bulk put trip-data.json --binding=ITINERARY_KV"
);
