#!/usr/bin/env node

/**
 * Convert Trip Details to GeoJSON - Improved Version
 *
 * This script converts the trip_details.rtf file to proper GeoJSON format
 * for use with MapBox GL. It ensures coordinates are in the correct
 * [longitude, latitude] format required by MapBox.
 *
 * Handles the RTF format issues with special characters and escapes.
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

// Improved RTF content extraction
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
    .replace(/\\\d+/g, "") // Remove other RTF control sequences
    .replace(/\\[a-z]+\d*/g, "") // Remove any remaining RTF commands
    .replace(/92s/g, "'s") // Fix common apostrophe issue
    .trim();

  return plainText;
}

// Convert text data to GeoJSON with better CSV handling
function convertToGeoJSON(data) {
  // Parse header and data rows
  const lines = data.split("\n").filter((line) => line.trim() !== "");
  const headers = lines[0].split(",").map((h) => h.trim());

  // Column indices
  const columnIndices = {
    city: headers.indexOf("City"),
    state: headers.indexOf("State"),
    stopType: headers.indexOf("StopType"),
    longitude: headers.indexOf("Longitude"),
    latitude: headers.indexOf("Latitude"),
    date: headers.indexOf("Date"),
    estimatedArrival: headers.indexOf("EstimatedArrival"),
    estimatedDeparture: headers.indexOf("EstimatedDeparture"),
    milesFromPrevious: headers.indexOf("MilesFromPrevious"),
    cumulativeMiles: headers.indexOf("CumulativeMiles"),
    locationName: headers.indexOf("LocationName"),
    address: headers.indexOf("Address"),
    chargingAvailable: headers.indexOf("ChargingAvailable"),
    notes: headers.indexOf("Notes"),
  };

  // Check for required columns
  const requiredColumns = ["City", "State", "Longitude", "Latitude"];
  const missingColumns = requiredColumns.filter(
    (col) => headers.indexOf(col) === -1
  );
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(", ")}`);
  }

  // Prepare GeoJSON structure
  const geoJSON = {
    type: "FeatureCollection",
    features: [],
  };

  // Prepare itinerary structure
  const itinerary = [];

  // Process all rows (skip header)
  for (let i = 1; i < lines.length; i++) {
    // Handle RTF specific issues - fix escaped apostrophes
    let line = lines[i].replace(/92s/g, "'s");

    // Handle special case with quotes
    let values;
    try {
      values = parseCSVLineWithSpecialCases(line);
    } catch (err) {
      console.warn(`Error parsing line ${i}:`, err.message);
      console.warn(`Problematic line: ${line}`);
      continue;
    }

    // If parsing failed or empty line, skip
    if (!values || values.length === 0) continue;

    // Extract values (safely)
    function safeGetValue(index) {
      return index >= 0 && index < values.length ? values[index] : null;
    }

    // Get basic location info - required fields
    const city = safeGetValue(columnIndices.city);
    const state = safeGetValue(columnIndices.state);
    let longitude = parseFloat(safeGetValue(columnIndices.longitude));
    let latitude = parseFloat(safeGetValue(columnIndices.latitude));

    // Skip if essential coordinate data is missing or invalid
    if (!city || !state || isNaN(longitude) || isNaN(latitude)) {
      console.warn(`Skipping line ${i} due to missing essential data:`, {
        city,
        state,
        longitude,
        latitude,
      });
      continue;
    }

    // Extract other fields (optional)
    const stopType = safeGetValue(columnIndices.stopType) || "stop";
    const date = safeGetValue(columnIndices.date) || "";
    const estimatedArrival = safeGetValue(columnIndices.estimatedArrival) || "";
    const estimatedDeparture =
      safeGetValue(columnIndices.estimatedDeparture) || "";

    // Try to parse numeric values, default to 0 if invalid
    const milesFromPrevious = parseInt(
      safeGetValue(columnIndices.milesFromPrevious) || "0",
      10
    );
    const cumulativeMiles = parseInt(
      safeGetValue(columnIndices.cumulativeMiles) || "0",
      10
    );

    // Other fields
    const locationName =
      safeGetValue(columnIndices.locationName) || `${city}, ${state}`;
    const address = safeGetValue(columnIndices.address) || "";
    const chargingAvailable =
      safeGetValue(columnIndices.chargingAvailable) || "Unknown";
    const notes = safeGetValue(columnIndices.notes) || "";

    // Handle special case for address if it was combined with locationName due to parsing issues
    let finalLocationName = locationName;
    let finalAddress = address;

    // If we didn't get a separate address but locationName has a comma, split it
    if (!address && locationName && locationName.includes(",")) {
      const parts = locationName.split(",");
      if (parts.length >= 2) {
        finalLocationName = parts[0].trim();
        finalAddress = parts.slice(1).join(",").trim();
      }
    }

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
        locationName: finalLocationName,
        address: finalAddress,
        chargingAvailable,
        notes,
        id: `stop-${i}`,
        title: `${city}, ${state}`,
        description: finalLocationName,
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
      locationName: finalLocationName,
      address: finalAddress,
      chargingAvailable,
      notes,
      // IMPORTANT: Store coordinates as array in [longitude, latitude] format for GeoJSON compatibility
      coordinates: [longitude, latitude],
    });
  }

  // Create route LineString feature (connects all stops in order)
  if (geoJSON.features.length > 1) {
    const routeCoordinates = geoJSON.features
      .filter(
        (feature) => feature.geometry && feature.geometry.type === "Point"
      )
      .map((feature) => feature.geometry.coordinates);

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

// Better CSV line parser with special case handling for RTF artifacts
function parseCSVLineWithSpecialCases(line) {
  // Special case: handle apostrophes encoded as 92s in RTF
  line = line.replace(/92s/g, "'s");

  // Break the line down by commas, respecting quotes
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

  // Handle special case for common RTF formatting artifacts
  return result.map((val) => {
    // Clean up any remaining RTF artifacts
    return val.replace(/\\[a-z]+\d*/g, "").trim();
  });
}

// Main function
async function main() {
  try {
    console.log("Reading trip details from:", INPUT_FILE);
    const rtfContent = fs.readFileSync(INPUT_FILE, "utf8");
    const textContent = extractTextFromRTF(rtfContent);

    // For debugging: write the extracted text to a temp file
    fs.writeFileSync(
      path.join(__dirname, "../temp-extracted-text.txt"),
      textContent
    );
    console.log("Extracted text written to: temp-extracted-text.txt");

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
