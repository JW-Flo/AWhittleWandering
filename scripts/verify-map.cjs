#!/usr/bin/env node

const https = require("https");
const http = require("http");

// Colors for terminal output
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

console.log(
  "🗺️ Verifying map and itinerary data for 48 Continental USA project...\n"
);

// Configuration
const EDGE_WORKER_URL =
  "https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev";
const PUBLIC_SITE_URL = "https://main.continentalusa-site.pages.dev";

// Helper function to make HTTP requests
async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Request failed with status code ${res.statusCode}`));
        return;
      }

      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (e) {
          // If not JSON, return the raw data
          resolve(data);
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.end();
  });
}

// Validate coordinate structure
function validateCoordinates(coordinates) {
  if (!Array.isArray(coordinates)) {
    return false;
  }

  // For a GeoJSON LineString, coordinates should be an array of coordinate pairs
  if (coordinates.length === 0) {
    return false;
  }

  // Check if coordinates are in [longitude, latitude] format
  return coordinates.every(
    (coord) =>
      Array.isArray(coord) &&
      coord.length === 2 &&
      typeof coord[0] === "number" &&
      typeof coord[1] === "number"
  );
}

// Check if itinerary data is well-formed
function validateItineraryData(data) {
  // Check basic structure
  if (
    !data ||
    !data.features ||
    !Array.isArray(data.features) ||
    data.features.length === 0
  ) {
    return {
      valid: false,
      reason: "Invalid GeoJSON structure: missing or empty features array",
    };
  }

  const feature = data.features[0];

  // Check for geometry
  if (!feature.geometry || feature.geometry.type !== "LineString") {
    return {
      valid: false,
      reason: "Invalid geometry: expected LineString",
    };
  }

  // Check coordinates
  if (!validateCoordinates(feature.geometry.coordinates)) {
    return {
      valid: false,
      reason: "Invalid coordinates structure",
    };
  }

  // Check properties
  if (
    !feature.properties ||
    !feature.properties.stops ||
    !Array.isArray(feature.properties.stops)
  ) {
    return {
      valid: false,
      reason: "Missing or invalid stops array in properties",
    };
  }

  // Check stops
  const stops = feature.properties.stops;
  if (stops.length === 0) {
    return {
      valid: false,
      reason: "Empty stops array",
    };
  }

  // Check a sample of stops
  const sampleStop = stops[0];
  if (
    !sampleStop.location ||
    !sampleStop.coordinates ||
    !Array.isArray(sampleStop.coordinates)
  ) {
    return {
      valid: false,
      reason: "Invalid stop format",
    };
  }

  return { valid: true };
}

// Main verification function
async function verifyMapAndItinerary() {
  try {
    console.log(`Testing Edge Worker API at ${EDGE_WORKER_URL}...`);

    // 1. Check Edge Worker status
    try {
      const status = await makeRequest(`${EDGE_WORKER_URL}/test`);
      console.log(`${GREEN}✓ Edge Worker is online${RESET}`);
      console.log(`  Status: ${status.status}, Version: ${status.version}\n`);
    } catch (error) {
      console.log(
        `${RED}✗ Edge Worker is not accessible: ${error.message}${RESET}\n`
      );
      return false;
    }

    // 2. Check Itinerary API
    try {
      console.log("Checking Itinerary API...");
      const itineraryData = await makeRequest(
        `${EDGE_WORKER_URL}/api/itinerary`
      );

      // Validate the itinerary data format
      const validation = validateItineraryData(itineraryData);

      if (validation.valid) {
        const coordCount =
          itineraryData.features[0].geometry.coordinates.length;
        const stopsCount = itineraryData.features[0].properties.stops.length;

        console.log(`${GREEN}✓ Itinerary data is valid${RESET}`);
        console.log(`  Route contains ${coordCount} coordinate points`);
        console.log(`  Itinerary contains ${stopsCount} stops\n`);

        // Sample the first few coordinates to check format
        const coords = itineraryData.features[0].geometry.coordinates.slice(
          0,
          3
        );
        console.log(
          "  Sample coordinates (should be [longitude, latitude] format):"
        );
        coords.forEach((coord) => {
          console.log(`    [${coord[0]}, ${coord[1]}]`);
        });
        console.log("");
      } else {
        console.log(
          `${RED}✗ Itinerary data has format issues: ${validation.reason}${RESET}\n`
        );
        return false;
      }
    } catch (error) {
      console.log(
        `${RED}✗ Failed to fetch itinerary data: ${error.message}${RESET}\n`
      );
      return false;
    }

    // 3. Check if public site can access the API (CORS test)
    console.log(
      `${YELLOW}ℹ CORS verification requires manual testing in browser${RESET}`
    );
    console.log(`  To verify: Open the public site at ${PUBLIC_SITE_URL}`);
    console.log(
      "  Open browser developer tools and check for CORS errors in console\n"
    );

    // 4. Summary
    console.log(
      `${GREEN}✓ Map and itinerary verification checks passed${RESET}`
    );
    console.log("  The map should be correctly displaying the route and stops");
    console.log(
      "  For final confirmation, please check the deployed site visually at:"
    );
    console.log(`  ${PUBLIC_SITE_URL}\n`);

    return true;
  } catch (error) {
    console.error(
      `${RED}Verification failed with error: ${error.message}${RESET}`
    );
    return false;
  }
}

// Run the verification
verifyMapAndItinerary()
  .then((success) => {
    if (!success) {
      console.log(
        `${RED}⚠ Some verification checks failed. See details above.${RESET}`
      );
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error(`${RED}Error during verification: ${error.message}${RESET}`);
    process.exit(1);
  });
