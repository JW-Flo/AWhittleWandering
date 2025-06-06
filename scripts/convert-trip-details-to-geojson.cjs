#!/usr/bin/env node

/**
 * Convert Trip Details to GeoJSON
 *
 * This script converts the trip_details.rtf file to proper GeoJSON format
 * for use with MapBox GL. It ensures coordinates are in the correct
 * [longitude, latitude] format required by MapBox.
 */

/* eslint-disable no-undef */
/* eslint-disable no-console */
/* eslint-env node */

const fs = require("fs");
const path = require("path");

// File paths
const INPUT_FILE = path.join(__dirname, "../docs/trip_details.rtf");
const OUTPUT_GEOJSON = path.join(__dirname, "../itinerary-geo.json");
const OUTPUT_ITINERARY = path.join(__dirname, "../itinerary-fixed.json");

// Parse the RTF content - simple approach to extract text content
function extractTextFromRTF(rtfContent) {
  // Remove RTF formatting and extract plain text
  let plainText = rtfContent
    .replace(/\{\\rtf1.*?\\f0\\fs24/s, "") // Remove RTF header
    .replace(/\\[a-z0-9]+/g, "") // Remove control words
    .replace(/\{|\}/g, "") // Remove braces
    .replace(/\\'/g, "'") // Handle escaped quotes
    .replace(/\\\\/g, "\\") // Handle escaped backslashes
    .replace(/\\tab/g, "\t") // Convert tabs
    .replace(/\\par/g, "\n") // Convert paragraphs
    .replace(/\\line/g, "\n") // Convert line breaks
    .replace(/\\cf[0-9]+/g, "") // Remove color formatting
    .trim();

  return plainText;
}

// Convert text data to GeoJSON
function convertToGeoJSON(data) {
  // Parse header and data rows
  const lines = data.split("\n");
  const headers = lines[0].split(",");

  // Find indices for important columns
  const cityIndex = headers.indexOf("City");
  const stateIndex = headers.indexOf("State");
  const stopTypeIndex = headers.indexOf("StopType");
  const longitudeIndex = headers.indexOf("Longitude");
  const latitudeIndex = headers.indexOf("Latitude");
  const dateIndex = headers.indexOf("Date");
  const estArrivalIndex = headers.indexOf("EstimatedArrival");
  const estDepartureIndex = headers.indexOf("EstimatedDeparture");
  const milesFromPrevIndex = headers.indexOf("MilesFromPrevious");
  const cumulativeMilesIndex = headers.indexOf("CumulativeMiles");
  const locationNameIndex = headers.indexOf("LocationName");
  const addressIndex = headers.indexOf("Address");
  const chargingIndex = headers.indexOf("ChargingAvailable");
  const notesIndex = headers.indexOf("Notes");

  // Prepare GeoJSON structure
  const geoJSON = {
    type: "FeatureCollection",
    features: [],
  };

  // Prepare itinerary structure
  const itinerary = [];

  // Process data rows (skip header)
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    if (values.length <= 1) continue; // Skip empty lines

    if (values.length < headers.length) {
      console.warn(
        `Warning: Line ${i} has fewer fields than expected: ${values.length} vs ${headers.length}`
      );
      console.warn(values);
      continue;
    }

    // Extract values
    const city = values[cityIndex];
    const state = values[stateIndex];
    const stopType = values[stopTypeIndex];
    const longitude = parseFloat(values[longitudeIndex]);
    const latitude = parseFloat(values[latitudeIndex]);
    const date = values[dateIndex];
    const estimatedArrival = values[estArrivalIndex];
    const estimatedDeparture = values[estDepartureIndex];
    const milesFromPrevious = parseInt(values[milesFromPrevIndex], 10);
    const cumulativeMiles = parseInt(values[cumulativeMilesIndex], 10);
    const locationName = values[locationNameIndex];
    const address = values[addressIndex];
    const chargingAvailable = values[chargingIndex];
    const notes = values[notesIndex];

    // Create GeoJSON feature
    const feature = {
      type: "Feature",
      geometry: {
        type: "Point",
        // IMPORTANT: GeoJSON uses [longitude, latitude] format
        coordinates: [longitude, latitude],
      },
      properties: {
        city,
        state,
        stopType,
        date,
        estimatedArrival,
        estimatedDeparture,
        milesFromPrevious,
        cumulativeMiles,
        locationName,
        address,
        chargingAvailable,
        notes,
        id: `stop-${i}`,
        title: `${city}, ${state}`,
        description: locationName,
      },
    };

    // Add to GeoJSON features
    geoJSON.features.push(feature);

    // Add to itinerary array
    itinerary.push({
      id: `stop-${i}`,
      city,
      state,
      stopType,
      date,
      estimatedArrival,
      estimatedDeparture,
      milesFromPrevious,
      cumulativeMiles,
      locationName,
      address,
      chargingAvailable,
      notes,
      // IMPORTANT: Store coordinates as array in [longitude, latitude] format for GeoJSON compatibility
      coordinates: [longitude, latitude],
    });
  }

  // Create route LineString feature (connects all stops in order)
  if (geoJSON.features.length > 1) {
    const routeCoordinates = geoJSON.features.map(
      (feature) => feature.geometry.coordinates
    );

    const routeFeature = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: routeCoordinates,
      },
      properties: {
        id: "route",
        title: "Complete Route",
        description: "48 Continental USA Route",
      },
    };

    geoJSON.features.push(routeFeature);
  }

  return { geoJSON, itinerary };
}

// Parse a CSV line, handling quoted values
function parseCSVLine(line) {
  const result = [];
  let inQuotes = false;
  let currentValue = "";

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(currentValue.trim());
      currentValue = "";
    } else {
      currentValue += char;
    }
  }

  // Add the last value
  result.push(currentValue.trim());

  return result;
}

// Main function
async function main() {
  try {
    console.log("Reading trip details from:", INPUT_FILE);
    const rtfContent = fs.readFileSync(INPUT_FILE, "utf8");
    const textContent = extractTextFromRTF(rtfContent);

    // Convert to GeoJSON
    const { geoJSON, itinerary } = convertToGeoJSON(textContent);

    // Validate data
    console.log(
      `Processed ${geoJSON.features.length - 1} stops and created route`
    );

    // Write GeoJSON to file
    fs.writeFileSync(OUTPUT_GEOJSON, JSON.stringify(geoJSON, null, 2));
    console.log("GeoJSON written to:", OUTPUT_GEOJSON);

    // Write itinerary to file
    fs.writeFileSync(OUTPUT_ITINERARY, JSON.stringify({ itinerary }, null, 2));
    console.log("Itinerary written to:", OUTPUT_ITINERARY);

    console.log("Conversion completed successfully!");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
