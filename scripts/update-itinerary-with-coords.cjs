#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-env node */

const fs = require("fs");
const path = require("path");

// Read the CSV file
const csvPath = path.resolve(
  __dirname,
  "../docs/Final_60-Day_Itinerary__With_Knoxville__TN_.csv"
);
const csvContent = fs.readFileSync(csvPath, "utf8");

// Parse CSV (simple parser)
const lines = csvContent.split("\n").filter((line) => line.trim());
const headers = lines[0].split(",");
const rows = lines.slice(1).map((line) => {
  const values = line.split(",");
  return headers.reduce((obj, header, i) => {
    obj[header] = values[i];
    return obj;
  }, {});
});

// City/state to coordinates mapping with more locations from latest itinerary
const coordinatesMap = {
  "Corpus Christi, TX": [27.8006, -97.3964],
  "Tucson, AZ": [32.2226, -110.9747],
  "Grand Canyon, AZ": [36.0544, -112.1401],
  "Los Angeles, CA": [34.0522, -118.2437],
  "Santa Barbara → Big Sur, CA": [36.0074, -121.5008], // Midpoint between Santa Barbara and Big Sur
  "Redwoods, CA": [41.2132, -124.0046],
  "Colfax, WA": [46.8791, -117.3644],
  "Oregon Coast, OR": [45.8918, -123.9615], // Using Cannon Beach as a representative point
  "Olympia, WA": [47.0379, -122.9007],
  "Seattle, WA": [47.6062, -122.3321],
  "Yellowstone, MT/WY": [44.428, -110.5885],
  "Salt Lake City, UT": [40.7608, -111.891],
  "Provo, UT": [40.2338, -111.6585],
  "Denver, CO": [39.7392, -104.9903],
  "Fort Collins, CO": [40.5853, -105.0844],
  "Fargo, ND": [46.8772, -96.7898],
  "Sioux Falls, SD": [43.5446, -96.7311],
  "Lincoln, NE": [40.8136, -96.7026],
  "Chicago, IL": [41.8781, -87.6298],
  "Milwaukee, WI": [43.0389, -87.9065],
  "Minneapolis, MN": [44.9778, -93.265],
  "Traverse City, MI": [44.7631, -85.6206],
  "Columbus, OH": [39.9612, -82.9988],
  "Terre Haute, IN": [39.4667, -87.4139],
  "Philadelphia, PA": [39.9526, -75.1652],
  "Albany, NY": [42.6526, -73.7562],
  "Montpelier / Concord, VT/NH": [43.734, -72.454], // Midpoint between Montpelier and Concord
  "Bar Harbor, ME": [44.3876, -68.2039],
  "Hartford, CT": [41.7658, -72.6734],
  "Boston, MA": [42.3601, -71.0589],
  "Providence, RI": [41.824, -71.4128],
  "Newark, NJ": [40.7357, -74.1724],
  "Wilmington, DE": [39.7391, -75.5398],
  "Harpers Ferry, WV": [39.3254, -77.7389],
  "Raleigh, NC": [35.7796, -78.6382],
  "Monroe, NC": [34.9854, -80.5495],
  "Asheville, NC": [35.5951, -82.5515],
  "Spartanburg, SC": [34.9496, -81.932],
  "Savannah, GA": [32.0809, -81.0912],
  "Sarasota, FL": [27.3364, -82.5307],
  "Tallahassee, FL": [30.4383, -84.2807],
  "Knoxville, TN": [35.9606, -83.9207],
  "Mobile, AL": [30.6954, -88.0399],
  "New Orleans, LA": [29.9511, -90.0715],
  "Jackson, MS": [32.2988, -90.1848],
  "Little Rock, AR": [34.7465, -92.2896],
  "Austin, TX": [30.2672, -97.7431],
  "Oklahoma City, OK": [35.4676, -97.5164],
};

// Function to clean location names for matching with the coordinate map
function cleanLocationName(location, state) {
  // Standardize the location name format
  return `${location}, ${state}`;
}

// Process the CSV data into a proper itinerary object
const processedStops = rows.map((row) => {
  // Extract the city name without arrows or other special chars
  const location = row.Location.split("→")[0].trim();
  const state = row.State;
  const cleanedLocation = cleanLocationName(location, state);

  // Determine coordinates
  let coordinates = coordinatesMap[cleanedLocation];

  // If not found, try with the full location string
  if (!coordinates && state) {
    coordinates = coordinatesMap[`${row.Location}, ${state}`];
  }

  // If still not found, use a fallback
  if (!coordinates) {
    console.warn(`Could not find coordinates for: ${row.Location}, ${state}`);
    // Default to a central US location if coordinates not found
    coordinates = [-98.5795, 39.8283]; // Center of US
  }

  // Determine stop type based on notes or other criteria
  let stopType = "waypoint";
  if (row.Notes && row.Notes.toLowerCase().includes("overnight")) {
    stopType = "overnight";
  } else if (row.Notes && row.Notes.toLowerCase().includes("recharge")) {
    stopType = "charging";
  }

  // Special cases for start and end
  if (row.Notes && row.Notes.toLowerCase().includes("trip begins")) {
    stopType = "start";
  } else if (row.Notes && row.Notes.toLowerCase().includes("trip ends")) {
    stopType = "end";
  }

  return {
    date: row.Dates,
    location: `${row.Location}, ${state}`,
    state: row.State,
    notes: row.Notes,
    type: stopType,
    coordinates: coordinates,
  };
});

// Create the GeoJSON feature collection
const itineraryData = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        route: "48 Continental USA",
        stops: processedStops,
      },
      geometry: {
        type: "LineString",
        // Fix coordinate order for GeoJSON: MapBox requires [longitude, latitude]
        coordinates: processedStops.map((stop) => [
          stop.coordinates[1],
          stop.coordinates[0],
        ]),
      },
    },
  ],
};

// Save to file
fs.writeFileSync("itinerary-full.json", JSON.stringify(itineraryData, null, 2));
console.log("Created itinerary-full.json with complete route data");

// Create a KV upload format for Cloudflare
const kvData = [
  {
    key: "itinerary",
    value: JSON.stringify(itineraryData),
  },
];

// Save the KV data
fs.writeFileSync("edge-worker/trip-data.json", JSON.stringify(kvData, null, 2));
console.log("Created edge-worker/trip-data.json for KV upload");

// Create a simplified version for the vehicle API to use
const simplifiedItinerary = {
  meta: {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    totalStops: processedStops.length,
    title: "48 Continental USA Road Trip",
    description: "Tesla road trip through all 48 contiguous US states",
  },
  stops: processedStops.map((stop) => ({
    dates: stop.date,
    location: stop.location.split(",")[0].trim(),
    state: stop.state,
    notes: stop.notes,
    // Keep the same property names but ensure values are correctly assigned
    // These properties will be used by Map.jsx which expects latitude/longitude properties
    latitude: stop.coordinates[0],
    longitude: stop.coordinates[1],
    // Also add GeoJSON formatted coordinates for convenience
    coordinates: [stop.coordinates[1], stop.coordinates[0]], // [longitude, latitude] for GeoJSON
    type: stop.type,
  })),
};

// Save the simplified version
fs.writeFileSync(
  "itinerary.json",
  JSON.stringify(simplifiedItinerary, null, 2)
);
console.log("Created itinerary.json with simplified format");

console.log("To upload to Cloudflare KV, run:");
console.log(
  "cd edge-worker && npx wrangler kv bulk put trip-data.json --binding=ITINERARY_KV"
);
