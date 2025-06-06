#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-env node */

/**
 * Map Functionality Fix Utility
 *
 * This script fixes common issues with the map functionality:
 * 1. Copies and ensures correct itinerary data files are in place
 * 2. Fixes coordinate formats in the data files
 * 3. Validates MapBox token configuration
 * 4. Checks API endpoints
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// File paths
const ROOT_DIR = path.resolve(__dirname, "../..");
const PUBLIC_SITE_DIR = __dirname;
const SCRIPTS_DIR = path.resolve(ROOT_DIR, "scripts");

const ROOT_ITINERARY_FILE = path.resolve(ROOT_DIR, "itinerary.json");
const ROOT_FULL_ITINERARY_FILE = path.resolve(ROOT_DIR, "itinerary-full.json");
const ROOT_EDGE_WORKER_DATA_FILE = path.resolve(
  ROOT_DIR,
  "edge-worker/trip-data.json"
);

const PUBLIC_ITINERARY_FILE = path.resolve(PUBLIC_SITE_DIR, "itinerary.json");
const PUBLIC_FULL_ITINERARY_FILE = path.resolve(
  PUBLIC_SITE_DIR,
  "itinerary-full.json"
);
const PUBLIC_EDGE_WORKER_DIR = path.resolve(PUBLIC_SITE_DIR, "edge-worker");
const PUBLIC_EDGE_WORKER_DATA_FILE = path.resolve(
  PUBLIC_EDGE_WORKER_DIR,
  "trip-data.json"
);

const ENV_FILE = path.resolve(PUBLIC_SITE_DIR, ".env");
const MAP_JSX_FILE = path.resolve(PUBLIC_SITE_DIR, "src/components/Map.jsx");
const USE_TRIP_DATA_FILE = path.resolve(
  PUBLIC_SITE_DIR,
  "src/hooks/useTripData.js"
);
const COORDINATE_FIX_SCRIPT = path.resolve(
  SCRIPTS_DIR,
  "fix-coordinate-format.cjs"
);

// Helper to check if a file exists
const fileExists = (filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
};

// Create directory if it doesn't exist
const ensureDirExists = (dirPath) => {
  if (!fileExists(dirPath)) {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dirPath}`);
      return true;
    } catch (error) {
      console.error(`Error creating directory ${dirPath}:`, error);
      return false;
    }
  }
  return true;
};

// Copy file if source exists
const copyFileIfExists = (source, destination) => {
  if (fileExists(source)) {
    try {
      const destinationDir = path.dirname(destination);
      ensureDirExists(destinationDir);

      fs.copyFileSync(source, destination);
      console.log(`✓ Copied ${source} to ${destination}`);
      return true;
    } catch (error) {
      console.error(`Error copying ${source} to ${destination}:`, error);
      return false;
    }
  } else {
    console.log(`Source file ${source} not found. Skipping copy.`);
    return false;
  }
};

// Generate MapBox token if not exists
const ensureMapBoxToken = () => {
  if (!fileExists(ENV_FILE)) {
    try {
      const envContent = `VITE_MAPBOX_TOKEN=pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJmNXlwY2IycGdtMnFva2liaTA4enIwIn0.tU9_tLaaxXxhfcVX4WhOeA\n`;
      fs.writeFileSync(ENV_FILE, envContent);
      console.log(`✓ Created .env file with MapBox token`);
      return true;
    } catch (error) {
      console.error(`Error creating .env file:`, error);
      return false;
    }
  }

  // Check if MapBox token exists in .env file
  try {
    const envContent = fs.readFileSync(ENV_FILE, "utf8");
    if (!envContent.includes("VITE_MAPBOX_TOKEN=")) {
      const newEnvContent =
        envContent +
        `\nVITE_MAPBOX_TOKEN=pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJmNXlwY2IycGdtMnFva2liaTA4enIwIn0.tU9_tLaaxXxhfcVX4WhOeA\n`;
      fs.writeFileSync(ENV_FILE, newEnvContent);
      console.log(`✓ Added MapBox token to .env file`);
      return true;
    }
    return true;
  } catch (error) {
    console.error(`Error checking/updating .env file:`, error);
    return false;
  }
};

// Run fix-coordinate-format.cjs script
const runCoordinateFix = () => {
  if (fileExists(COORDINATE_FIX_SCRIPT)) {
    try {
      console.log(`Running coordinate fix script...`);
      execSync(`node ${COORDINATE_FIX_SCRIPT}`, { stdio: "inherit" });
      return true;
    } catch (error) {
      console.error(`Error running coordinate fix script:`, error);
      return false;
    }
  } else {
    console.log(`Coordinate fix script not found. Skipping this step.`);
    return false;
  }
};

// Validate coordinate data
const validateCoordinateData = () => {
  const files = [
    { path: PUBLIC_ITINERARY_FILE, name: "itinerary.json" },
    { path: PUBLIC_FULL_ITINERARY_FILE, name: "itinerary-full.json" },
    { path: PUBLIC_EDGE_WORKER_DATA_FILE, name: "edge-worker/trip-data.json" },
  ];

  let allValid = true;

  for (const file of files) {
    if (!fileExists(file.path)) {
      console.log(`${file.name} not found. Skipping validation.`);
      allValid = false;
      continue;
    }

    try {
      const data = JSON.parse(fs.readFileSync(file.path, "utf8"));

      if (file.name === "itinerary.json") {
        if (!data.stops || !Array.isArray(data.stops)) {
          console.log(
            `Invalid format in ${file.name}: missing or invalid 'stops' array.`
          );
          allValid = false;
          continue;
        }

        // Check if stops have valid coordinates
        let validStops = 0;
        for (const stop of data.stops) {
          if (
            typeof stop.longitude === "number" &&
            typeof stop.latitude === "number" &&
            !isNaN(stop.longitude) &&
            !isNaN(stop.latitude) &&
            Math.abs(stop.longitude) <= 180 &&
            Math.abs(stop.latitude) <= 90
          ) {
            validStops++;
          }
        }

        if (validStops === data.stops.length) {
          console.log(
            `✓ All ${validStops} stops in ${file.name} have valid coordinates.`
          );
        } else {
          console.log(
            `⚠ Only ${validStops} out of ${data.stops.length} stops in ${file.name} have valid coordinates.`
          );
          allValid = false;
        }
      } else if (file.name === "itinerary-full.json") {
        if (
          !data.features ||
          !Array.isArray(data.features) ||
          data.features.length === 0
        ) {
          console.log(
            `Invalid format in ${file.name}: missing or invalid 'features' array.`
          );
          allValid = false;
          continue;
        }

        const feature = data.features[0];
        if (
          !feature.geometry ||
          feature.geometry.type !== "LineString" ||
          !Array.isArray(feature.geometry.coordinates) ||
          feature.geometry.coordinates.length < 2
        ) {
          console.log(`Invalid geometry in ${file.name}.`);
          allValid = false;
          continue;
        }

        // Check if coordinates are valid
        let validCoords = 0;
        for (const coord of feature.geometry.coordinates) {
          if (
            Array.isArray(coord) &&
            coord.length === 2 &&
            typeof coord[0] === "number" &&
            typeof coord[1] === "number" &&
            !isNaN(coord[0]) &&
            !isNaN(coord[1]) &&
            Math.abs(coord[0]) <= 180 &&
            Math.abs(coord[1]) <= 90
          ) {
            validCoords++;
          }
        }

        if (validCoords === feature.geometry.coordinates.length) {
          console.log(
            `✓ All ${validCoords} coordinates in ${file.name} are valid.`
          );
        } else {
          console.log(
            `⚠ Only ${validCoords} out of ${feature.geometry.coordinates.length} coordinates in ${file.name} are valid.`
          );
          allValid = false;
        }
      } else if (file.name === "edge-worker/trip-data.json") {
        if (!Array.isArray(data) || data.length === 0) {
          console.log(
            `Invalid format in ${file.name}: expected array of KV objects.`
          );
          allValid = false;
          continue;
        }

        let validKVItems = 0;
        for (const item of data) {
          if (typeof item.key === "string" && typeof item.value === "string") {
            try {
              JSON.parse(item.value);
              validKVItems++;
            } catch (error) {
              console.log(`Invalid JSON in ${file.name} for key ${item.key}.`);
            }
          }
        }

        if (validKVItems === data.length) {
          console.log(
            `✓ All ${validKVItems} KV items in ${file.name} are valid.`
          );
        } else {
          console.log(
            `⚠ Only ${validKVItems} out of ${data.length} KV items in ${file.name} are valid.`
          );
          allValid = false;
        }
      }
    } catch (error) {
      console.error(`Error validating ${file.name}:`, error);
      allValid = false;
    }
  }

  return allValid;
};

// Check MapBox token configuration
const checkMapBoxToken = () => {
  try {
    if (!fileExists(MAP_JSX_FILE)) {
      console.log(`Map.jsx not found. Skipping MapBox token check.`);
      return false;
    }

    const mapJsxContent = fs.readFileSync(MAP_JSX_FILE, "utf8");
    const envContent = fileExists(ENV_FILE)
      ? fs.readFileSync(ENV_FILE, "utf8")
      : "";

    const hasMapBoxTokenInEnv = envContent.includes("VITE_MAPBOX_TOKEN=");
    const usesEnvToken = mapJsxContent.includes(
      "import.meta.env.VITE_MAPBOX_TOKEN"
    );
    const hasFallbackToken = mapJsxContent.includes("MAPBOX_FALLBACK_TOKEN");

    if (hasMapBoxTokenInEnv && (usesEnvToken || hasFallbackToken)) {
      console.log(`✓ MapBox token is properly configured.`);
      return true;
    } else {
      console.log(`⚠ MapBox token configuration is incomplete.`);
      console.log(
        `- ${hasMapBoxTokenInEnv ? "✓" : "✗"} VITE_MAPBOX_TOKEN in .env`
      );
      console.log(
        `- ${
          usesEnvToken ? "✓" : "✗"
        } Using import.meta.env.VITE_MAPBOX_TOKEN in Map.jsx`
      );
      console.log(
        `- ${hasFallbackToken ? "✓" : "✗"} Has fallback token in Map.jsx`
      );
      return false;
    }
  } catch (error) {
    console.error(`Error checking MapBox token configuration:`, error);
    return false;
  }
};

// Check API endpoints
const checkAPIEndpoints = () => {
  try {
    if (!fileExists(USE_TRIP_DATA_FILE)) {
      console.log(`useTripData.js not found. Skipping API endpoint check.`);
      return false;
    }

    const useTripDataContent = fs.readFileSync(USE_TRIP_DATA_FILE, "utf8");
    const hasAPIEndpoint =
      useTripDataContent.includes("fetch(") ||
      useTripDataContent.includes("axios.get(");
    const hasFallbackData =
      useTripDataContent.includes("localData") ||
      useTripDataContent.includes("fallbackData");

    if (hasAPIEndpoint) {
      console.log(`✓ API endpoints are configured.`);
      return true;
    } else if (hasFallbackData) {
      console.log(`✓ Using fallback data instead of API endpoints.`);
      return true;
    } else {
      console.log(
        `⚠ No API endpoints or fallback data found in useTripData.js.`
      );
      return false;
    }
  } catch (error) {
    console.error(`Error checking API endpoints:`, error);
    return false;
  }
};

// Main function
const main = async () => {
  console.log("Map Functionality Fixing Utility");
  console.log("===============================\n");

  // 1. Copy itinerary files to public-site directory
  console.log("1. Copying itinerary files to public-site directory...");
  copyFileIfExists(ROOT_ITINERARY_FILE, PUBLIC_ITINERARY_FILE);
  copyFileIfExists(ROOT_FULL_ITINERARY_FILE, PUBLIC_FULL_ITINERARY_FILE);
  ensureDirExists(PUBLIC_EDGE_WORKER_DIR);
  copyFileIfExists(ROOT_EDGE_WORKER_DATA_FILE, PUBLIC_EDGE_WORKER_DATA_FILE);

  // 2. Ensure MapBox token is configured
  console.log("\n2. Ensuring MapBox token is configured...");
  ensureMapBoxToken();

  // 3. Fix coordinate formats in data files
  console.log("\n3. Fixing coordinate formats in data files...");
  runCoordinateFix();

  // 4. Validate coordinate data
  console.log("\n4. Validating coordinate data...");
  const dataValid = validateCoordinateData();
  if (!dataValid) {
    console.log(
      "Some coordinate data validation failed. The fix script should have corrected issues, but manual review may be needed."
    );
  }

  // 5. Check MapBox token configuration
  console.log("\n5. Checking MapBox token configuration...");
  const tokenValid = checkMapBoxToken();

  // 6. Check API endpoints
  console.log("\n6. Checking API endpoints...");
  const apiValid = checkAPIEndpoints();

  // Summary
  console.log("\nFix Summary:");
  console.log("===========");
  console.log(`Coordinate Data: ${dataValid ? "✓ Valid" : "⚠ Needs review"}`);
  console.log(
    `MapBox Token: ${tokenValid ? "✓ Configured" : "⚠ Needs review"}`
  );
  console.log(`API Endpoints: ${apiValid ? "✓ Configured" : "⚠ Needs review"}`);

  console.log("\nNext Steps:");
  console.log("===========");
  console.log("1. Start the development server:");
  console.log("   cd 48Continental_Starter/public-site && npm run dev");
  console.log(
    "2. Check the map functionality and use the debug panel (Ctrl+Shift+D)"
  );
  console.log("3. If issues persist, review the data files manually");
};

// Run the main function
main().catch((error) => {
  console.error("Error running fix utility:", error);
  process.exit(1);
});
