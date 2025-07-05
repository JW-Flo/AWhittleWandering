#!/usr/bin/env node
/**
 * integrate-itinerary-coordinates.cjs
 *
 * This script takes the generated CSV file with coordinates and:
 * 1. Converts it to GeoJSON format for map rendering
 * 2. Creates a trip-data.json file for the application
 * 3. Ensures the data directory exists
 */

const fs = require("fs");
const path = require("path");
const { EOL } = require("os");

// Configuration
const INPUT_CSV = path.join(
  __dirname,
  "..",
  "48Continental_Final_Itinerary_with_Coords.csv"
);
const DATA_DIR = path.join(
  __dirname,
  "..",
  "48Continental_Starter",
  "public-site",
  "src",
  "data"
);
const GEOJSON_OUTPUT = path.join(DATA_DIR, "trip-data.geojson");
const JSON_OUTPUT = path.join(DATA_DIR, "trip-data.json");

// ANSI colors for console output
const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

// Utility function for colored console output
function log(message, type = "info") {
  const timestamp = new Date().toLocaleTimeString();
  let prefix = "";
  let color = "";

  switch (type) {
    case "error":
      prefix = "[ERROR]";
      color = COLORS.red;
      break;
    case "warning":
      prefix = "[WARNING]";
      color = COLORS.yellow;
      break;
    case "success":
      prefix = "[SUCCESS]";
      color = COLORS.green;
      break;
    case "debug":
      prefix = "[DEBUG]";
      color = COLORS.dim;
      break;
    default:
      prefix = "[INFO]";
      color = COLORS.blue;
      break;
  }

  console.log(`${color}${prefix}${COLORS.reset} ${message}`);
}

// Ensure directory exists
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    log(`Creating directory: ${dir}`, "debug");
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Parse CSV file and return an array of objects
function parseCSV(filePath) {
  log(`Reading CSV file: ${filePath}`);
  const fileContent = fs.readFileSync(filePath, "utf8");
  const lines = fileContent.split(/\r?\n/);

  // Parse header
  const header = lines[0].split(",");

  // Parse data rows
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    // Handle quoted fields with commas
    const row = {};
    let fields = [];
    let inQuote = false;
    let currentField = "";

    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];

      if (char === '"' && (j === 0 || lines[i][j - 1] !== "\\")) {
        inQuote = !inQuote;
      } else if (char === "," && !inQuote) {
        fields.push(currentField);
        currentField = "";
      } else {
        currentField += char;
      }
    }

    // Add the last field
    fields.push(currentField);

    // Create object from fields
    for (let j = 0; j < header.length; j++) {
      let value = fields[j] || "";

      // Remove quotes from quoted fields
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1).replace(/""/g, '"');
      }

      // Convert numeric fields
      if (header[j] === "Longitude" || header[j] === "Latitude") {
        value = parseFloat(value);
      }

      row[header[j]] = value;
    }

    data.push(row);
  }

  log(`Parsed ${data.length} entries from CSV`, "success");
  return data;
}

// Convert CSV data to GeoJSON format
function convertToGeoJSON(data) {
  log("Converting data to GeoJSON format");

  // Create route feature with all points
  const routeCoordinates = data.map((item) => [item.Longitude, item.Latitude]);

  const features = [
    // Route as LineString
    {
      type: "Feature",
      properties: {
        type: "route",
      },
      geometry: {
        type: "LineString",
        coordinates: routeCoordinates,
      },
    },

    // Stops as Points
    ...data.map((item) => ({
      type: "Feature",
      properties: {
        id: `stop-${data.indexOf(item)}`,
        name: item.City,
        description: item.Notes || `${item.City}, ${item.State}`,
        type: item.StopType || "waypoint",
        overnight: item.StopType === "overnight",
        charging: item.Notes
          ? item.Notes.toLowerCase().includes("charging")
          : false,
        state: item.State,
      },
      geometry: {
        type: "Point",
        coordinates: [item.Longitude, item.Latitude],
      },
    })),
  ];

  return {
    type: "FeatureCollection",
    features,
  };
}

// Create trip data JSON for the application
function createTripDataJSON(data) {
  log("Creating trip data JSON");

  // Calculate visited states
  const visitedStates = [...new Set(data.map((item) => item.State))];

  // Calculate total miles (simplified estimate based on distance between points)
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

  let totalMiles = 0;
  for (let i = 1; i < data.length; i++) {
    const distance = calculateDistance(
      data[i - 1].Latitude,
      data[i - 1].Longitude,
      data[i].Latitude,
      data[i].Longitude
    );
    totalMiles += distance;
  }

  // Format route points
  const route = data.map((item) => ({
    latitude: item.Latitude,
    longitude: item.Longitude,
  }));

  // Format stops
  const stops = data.map((item) => ({
    id: `stop-${data.indexOf(item)}`,
    name: item.City,
    latitude: item.Latitude,
    longitude: item.Longitude,
    type: item.StopType || "waypoint",
    description: item.Notes || `${item.City}, ${item.State}`,
    charging: item.Notes
      ? item.Notes.toLowerCase().includes("charging")
      : false,
    overnight: item.StopType === "overnight",
    state: item.State,
  }));

  // Calculate trip stats
  const tripData = {
    visitedStates,
    currentState: data[0].State, // For demo purposes, use first state as current
    currentCity: data[0].City,
    nextStop: {
      city: data[1].City,
      state: data[1].State,
      eta: new Date().toISOString(),
    },
    distanceToNext: Math.round(
      calculateDistance(
        data[0].Latitude,
        data[0].Longitude,
        data[1].Latitude,
        data[1].Longitude
      )
    ),
    totalMiles: Math.round(totalMiles),
    daysOnRoad: 1, // Starting value
    route,
    stops,
    statesRemaining: 48 - visitedStates.length,
    routeProgress: Math.round((visitedStates.length / 48) * 100),
    averageMilesPerDay: Math.round(totalMiles),
    currentLocation: {
      latitude: data[0].Latitude,
      longitude: data[0].Longitude,
      state: data[0].State,
      city: data[0].City,
    },
    lastUpdated: new Date().toISOString(),
  };

  return tripData;
}

// Main function
function processItineraryData() {
  try {
    // Check if CSV file exists
    if (!fs.existsSync(INPUT_CSV)) {
      log(`CSV file not found: ${INPUT_CSV}`, "error");
      log(
        "Please run generate-itinerary-csv.cjs first to create the CSV file",
        "error"
      );
      return;
    }

    // Parse CSV data
    const csvData = parseCSV(INPUT_CSV);

    // Ensure data directory exists
    ensureDirectoryExists(DATA_DIR);

    // Convert to GeoJSON
    const geoJSON = convertToGeoJSON(csvData);

    // Create trip data JSON
    const tripData = createTripDataJSON(csvData);

    // Write output files
    fs.writeFileSync(GEOJSON_OUTPUT, JSON.stringify(geoJSON, null, 2));
    fs.writeFileSync(JSON_OUTPUT, JSON.stringify(tripData, null, 2));

    log(`GeoJSON file written to: ${GEOJSON_OUTPUT}`, "success");
    log(`Trip data JSON written to: ${JSON_OUTPUT}`, "success");
    log(
      "Integration complete! The map should now display the route and stops correctly.",
      "success"
    );

    // Log next steps
    log("To see the map in action:", "info");
    log(
      "1. Open 48Continental_Starter/public-site/src/data/trip-data.json to verify the data",
      "info"
    );
    log(
      "2. Run your development server to see the map with the new data",
      "info"
    );
    log(
      "3. Check the map rendering to verify the coordinates are in the correct format",
      "info"
    );
  } catch (error) {
    log(`Error processing itinerary data: ${error.message}`, "error");
    console.error(error);
  }
}

// Execute the main function
processItineraryData();
