#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-env node */

const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

// Coordinates for each city
const cityCoordinates = {
  "Corpus Christi": { lat: 27.8006, lng: -97.3964 },
  Tucson: { lat: 32.2226, lng: -110.9747 },
  "Grand Canyon": { lat: 36.0544, lng: -112.1401 },
  "Los Angeles": { lat: 34.0522, lng: -118.2437 },
  "Santa Barbara": { lat: 34.4208, lng: -119.6982 },
  "Big Sur": { lat: 36.2704, lng: -121.8081 },
  Redwoods: { lat: 41.2132, lng: -124.0046 },
  Colfax: { lat: 47.8077, lng: -117.3643 },
  "Oregon Coast": { lat: 44.6368, lng: -124.0535 },
  Olympia: { lat: 47.0379, lng: -122.9007 },
  Seattle: { lat: 47.6062, lng: -122.3321 },
  Yellowstone: { lat: 44.428, lng: -110.5885 },
  "Salt Lake City": { lat: 40.7608, lng: -111.891 },
  Provo: { lat: 40.2338, lng: -111.6585 },
  Denver: { lat: 39.7392, lng: -104.9903 },
  "Fort Collins": { lat: 40.5853, lng: -105.0844 },
  Fargo: { lat: 46.8772, lng: -96.7898 },
  "Sioux Falls": { lat: 43.5446, lng: -96.7311 },
  Lincoln: { lat: 40.8136, lng: -96.7026 },
  Chicago: { lat: 41.8781, lng: -87.6298 },
  Milwaukee: { lat: 43.0389, lng: -87.9065 },
  Minneapolis: { lat: 44.9778, lng: -93.265 },
  "Traverse City": { lat: 44.7631, lng: -85.6206 },
  Columbus: { lat: 39.9612, lng: -82.9988 },
  "Terre Haute": { lat: 39.4667, lng: -87.4139 },
  Philadelphia: { lat: 39.9526, lng: -75.1652 },
  Albany: { lat: 42.6526, lng: -73.7562 },
  Montpelier: { lat: 44.2601, lng: -72.5754 },
  Concord: { lat: 43.2081, lng: -71.5376 },
  "Bar Harbor": { lat: 44.3876, lng: -68.2039 },
  Hartford: { lat: 41.7658, lng: -72.6734 },
  Boston: { lat: 42.3601, lng: -71.0589 },
  Providence: { lat: 41.824, lng: -71.4128 },
  Newark: { lat: 40.7357, lng: -74.1724 },
  Wilmington: { lat: 39.7447, lng: -75.5466 },
  "Harpers Ferry": { lat: 39.3254, lng: -77.7389 },
  Raleigh: { lat: 35.7796, lng: -78.6382 },
  Monroe: { lat: 34.9854, lng: -80.5495 },
  Asheville: { lat: 35.5951, lng: -82.5515 },
  Spartanburg: { lat: 34.9495, lng: -81.932 },
  Savannah: { lat: 32.0809, lng: -81.0912 },
  Sarasota: { lat: 27.3364, lng: -82.5307 },
  Tallahassee: { lat: 30.4383, lng: -84.2807 },
  Knoxville: { lat: 35.9606, lng: -83.9207 },
  Mobile: { lat: 30.6954, lng: -88.0399 },
  "New Orleans": { lat: 29.9511, lng: -90.0715 },
  Jackson: { lat: 32.2988, lng: -90.1848 },
  "Little Rock": { lat: 34.7465, lng: -92.2896 },
  Austin: { lat: 30.2672, lng: -97.7431 },
};

// Read and parse the CSV file
const csvContent = fs.readFileSync(
  path.join(
    __dirname,
    "..",
    "docs",
    "Final_60-Day_Itinerary__With_Knoxville__TN_.csv"
  ),
  "utf-8"
);
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
});

// Process the records into GeoJSON
const itineraryData = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        route: "48 Continental USA",
        stops: records.map((record) => {
          const city = record.Location;
          const coords = cityCoordinates[city];

          if (!coords) {
            console.warn(`Warning: No coordinates found for ${city}`);
          }

          // Determine stop type based on Notes field
          let type = "waypoint";
          if (
            record.Notes.toLowerCase().includes("overnight") ||
            record.Notes.toLowerCase().includes("stay") ||
            record.Notes.toLowerCase().includes("visit")
          ) {
            type = "overnight";
          }
          if (record.Notes.toLowerCase().includes("recharge")) {
            type = "charging";
          }
          if (record.Notes.toLowerCase().includes("trip begins")) {
            type = "start";
          }
          if (record.Notes.toLowerCase().includes("trip ends")) {
            type = "end";
          }

          return {
            date: record.Dates,
            location: `${city}, ${record.State}`,
            type,
            description: record.Notes,
            latitude: coords ? coords.lat : null,
            longitude: coords ? coords.lng : null,
            state: record.State,
          };
        }),
      },
      geometry: {
        type: "LineString",
        coordinates: records
          .map((record) => {
            const coords = cityCoordinates[record.Location];
            return coords ? [coords.lng, coords.lat] : null;
          })
          .filter((coord) => coord !== null),
      },
    },
  ],
};

// Save the full itinerary data
fs.writeFileSync(
  path.join(__dirname, "..", "itinerary-full.json"),
  JSON.stringify(itineraryData, null, 2)
);

// Create KV bulk upload format
const kvData = [
  {
    key: "itinerary",
    value: JSON.stringify(itineraryData),
  },
];

// Save KV upload file
fs.writeFileSync(
  path.join(__dirname, "..", "edge-worker", "trip-data.json"),
  JSON.stringify(kvData)
);

// Upload to KV using wrangler
const { exec } = require("child_process");
exec(
  `cd edge-worker && npx wrangler kv put --binding=ITINERARY_KV itinerary '${JSON.stringify(
    itineraryData
  )}'`,
  (error, stdout, stderr) => {
    if (error) {
      console.error("Error uploading to KV:", error);
      return;
    }
    if (stderr) {
      console.error("stderr:", stderr);
      return;
    }
    console.log("Successfully uploaded to KV:", stdout);

    // Clean up temporary file
    fs.unlinkSync(path.join(__dirname, "..", "edge-worker", "trip-data.json"));
  }
);
