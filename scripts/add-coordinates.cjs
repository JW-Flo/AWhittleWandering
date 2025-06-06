#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-env node */

const { writeFileSync } = require("fs");

// Coordinates for each stop
const stopCoordinates = {
  "Corpus Christi, TX": [27.8006, -97.3964],
  "Tucson, AZ": [32.2226, -110.9747],
  "Grand Canyon, AZ": [36.0544, -112.1401],
  "Las Vegas, NV": [36.1699, -115.1398],
  "Los Angeles, CA": [34.0522, -118.2437],
  "Yosemite, CA": [37.8651, -119.5383],
  "Colfax, CA": [39.1002, -120.9527],
  "Cannon Beach, OR": [45.8918, -123.9615],
  "Seattle, WA": [47.6062, -122.3321],
  "Olympia, WA": [47.0379, -122.9007],
  "Yellowstone, WY": [44.428, -110.5885],
  "Provo, UT": [40.2338, -111.6585],
  "Salt Lake City, UT": [40.7608, -111.891],
  "Lincoln, NE": [40.8136, -96.7026],
  "Des Moines, IA": [41.5868, -93.625],
  "Chicago, IL": [41.8781, -87.6298],
  "Madison, WI": [43.0731, -89.4012],
  "Traverse City, MI": [44.7631, -85.6206],
  "Cleveland, OH": [41.4993, -81.6944],
  "Erie, PA": [42.1292, -80.0851],
  "Niagara Falls, NY": [43.0962, -79.0377],
  "Burlington, VT": [44.4759, -73.2121],
  "Hartford, CT": [41.7658, -72.6734],
  "Bar Harbor, ME": [44.3876, -68.2039],
  "Boston, MA": [42.3601, -71.0589],
  "Providence, RI": [41.824, -71.4128],
  "Hudson Valley, NY": [41.7798, -73.9776],
  "Newark, NJ": [40.7357, -74.1724],
  "Baltimore, MD": [39.2904, -76.6122],
  "Richmond, VA": [37.5407, -77.436],
  "Charleston, SC": [32.7765, -79.9311],
  "Columbia, SC": [34.0007, -81.0348],
  "Savannah, GA": [32.0809, -81.0912],
  "Gainesville, FL": [29.6516, -82.3248],
  "Sarasota, FL": [27.3364, -82.5307],
  "Monroe, NC": [34.9854, -80.5495],
  "Max Patch, NC": [35.7973, -82.9567],
  "Knoxville, TN": [35.9606, -83.9207],
  "Lexington, KY": [38.0406, -84.5037],
  "St. Louis, MO": [38.627, -90.1994],
  "Memphis, TN": [35.1495, -90.049],
  "Ozarks, AR": [35.7596, -93.1318],
  "Oklahoma City, OK": [35.4676, -97.5164],
  "Amarillo, TX": [35.222, -101.8313],
  "San Angelo, TX": [31.4638, -100.437],
  "Austin, TX": [30.2672, -97.7431],
};

// Read the current itinerary
const itineraryData = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        route: "48 Continental USA",
        stops: [
          { date: "6/4-6/5", location: "Corpus Christi, TX", type: "start" },
          { date: "6/6", location: "Tucson, AZ", type: "waypoint" },
          { date: "6/7", location: "Grand Canyon, AZ", type: "overnight" },
          { date: "6/8", location: "Las Vegas, NV", type: "charging" },
          { date: "6/9", location: "Los Angeles, CA", type: "overnight" },
          { date: "6/10", location: "Yosemite, CA", type: "waypoint" },
          { date: "6/11-6/12", location: "Colfax, CA", type: "overnight" },
          { date: "6/13", location: "Cannon Beach, OR", type: "waypoint" },
          { date: "6/14", location: "Seattle, WA", type: "waypoint" },
          { date: "6/15", location: "Olympia, WA", type: "overnight" },
          { date: "6/16-6/17", location: "Yellowstone, WY", type: "overnight" },
          { date: "6/18-6/19", location: "Provo, UT", type: "overnight" },
          { date: "6/20", location: "Salt Lake City, UT", type: "overnight" },
          { date: "6/21-6/24", location: "Lincoln, NE", type: "overnight" },
          { date: "6/25", location: "Des Moines, IA", type: "charging" },
          { date: "6/26", location: "Chicago, IL", type: "waypoint" },
          { date: "6/27", location: "Madison, WI", type: "overnight" },
          { date: "6/28", location: "Traverse City, MI", type: "waypoint" },
          { date: "6/29", location: "Cleveland, OH", type: "waypoint" },
          { date: "6/30", location: "Erie, PA", type: "charging" },
          { date: "7/1", location: "Niagara Falls, NY", type: "overnight" },
          { date: "7/2", location: "Burlington, VT", type: "overnight" },
          { date: "7/3-7/7", location: "Hartford, CT", type: "overnight" },
          { date: "7/8", location: "Bar Harbor, ME", type: "waypoint" },
          { date: "7/9", location: "Boston, MA", type: "waypoint" },
          { date: "7/10", location: "Providence, RI", type: "waypoint" },
          { date: "7/11", location: "Hudson Valley, NY", type: "overnight" },
          { date: "7/12", location: "Newark, NJ", type: "waypoint" },
          { date: "7/13", location: "Baltimore, MD", type: "waypoint" },
          { date: "7/14", location: "Richmond, VA", type: "waypoint" },
          { date: "7/15", location: "Charleston, SC", type: "waypoint" },
          { date: "7/16", location: "Columbia, SC", type: "waypoint" },
          { date: "7/17", location: "Savannah, GA", type: "waypoint" },
          { date: "7/18", location: "Gainesville, FL", type: "overnight" },
          { date: "7/19-7/21", location: "Sarasota, FL", type: "overnight" },
          { date: "7/22-7/25", location: "Monroe, NC", type: "overnight" },
          { date: "7/26-7/27", location: "Max Patch, NC", type: "overnight" },
          { date: "7/28", location: "Knoxville, TN", type: "waypoint" },
          { date: "7/29", location: "Lexington, KY", type: "overnight" },
          { date: "7/30", location: "St. Louis, MO", type: "overnight" },
          { date: "7/31", location: "Memphis, TN", type: "overnight" },
          { date: "8/1", location: "Ozarks, AR", type: "overnight" },
          { date: "8/2", location: "Oklahoma City, OK", type: "waypoint" },
          { date: "8/3", location: "Amarillo, TX", type: "overnight" },
          { date: "8/4", location: "San Angelo, TX", type: "overnight" },
          { date: "8/5", location: "Austin, TX", type: "end" },
        ],
      },
      geometry: {
        type: "LineString",
        coordinates: [],
      },
    },
  ],
};

// Add coordinates to the LineString
itineraryData.features[0].geometry.coordinates =
  itineraryData.features[0].properties.stops.map(
    (stop) => stopCoordinates[stop.location]
  );

// Save to file
writeFileSync("itinerary-full.json", JSON.stringify(itineraryData, null, 2));

// Create a temporary file with the value in bulk format
writeFileSync(
  "edge-worker/trip-data.json",
  JSON.stringify([
    {
      key: "itinerary",
      value: JSON.stringify(itineraryData),
    },
  ])
);

// Upload to KV using wrangler
const { exec } = require("child_process");
exec(
  `cd edge-worker && npx wrangler kv bulk put trip-data.json --binding=ITINERARY_KV --remote`,
  (error, stdout) => {
    if (error) {
      console.error("Error uploading itinerary:", error);
      return;
    }
    console.log("Itinerary uploaded successfully:", stdout);
    // Clean up temporary file
    const { unlinkSync } = require("fs");
    unlinkSync("edge-worker/trip-data.json");
  }
);
