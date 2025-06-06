#!/usr/bin/env node
/**
 * GeoJSON Validation and Copy Tool
 *
 * This script validates GeoJSON data, ensures coordinates are in the correct
 * [longitude, latitude] format, and copies the fixed data to the correct locations
 * for use in the 48 Continental USA map.
 */

const fs = require("fs");
const path = require("path");

// ANSI color codes for terminal output
const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

// Paths
const PROJECT_ROOT = path.join(__dirname, "..");
const SOURCE_DATA = path.join(PROJECT_ROOT, "itinerary-geo.json");
const PUBLIC_SITE_DATA = path.join(
  PROJECT_ROOT,
  "48Continental_Starter",
  "public-site",
  "public",
  "data",
  "itinerary-geo.json"
);
const SRC_DATA_DIR = path.join(
  PROJECT_ROOT,
  "48Continental_Starter",
  "public-site",
  "src",
  "data"
);
const SRC_DATA_FILE = path.join(SRC_DATA_DIR, "trip-data.json");

console.log(`${COLORS.blue}GeoJSON Validation and Copy Tool${COLORS.reset}`);
console.log(`${COLORS.blue}=================================${COLORS.reset}`);

// Check if source data exists
if (!fs.existsSync(SOURCE_DATA)) {
  console.log(
    `${COLORS.yellow}Source GeoJSON file not found: ${SOURCE_DATA}${COLORS.reset}`
  );
  console.log(
    `${COLORS.blue}Running coordinate fix script first...${COLORS.reset}`
  );

  try {
    // Run the coordinate fix script
    require("./validate-and-fix-coordinates.cjs");

    // Check again if the file was created
    if (!fs.existsSync(SOURCE_DATA)) {
      console.error(
        `${COLORS.red}Failed to create GeoJSON file using validate-and-fix-coordinates.cjs${COLORS.reset}`
      );
      process.exit(1);
    }
  } catch (error) {
    console.error(
      `${COLORS.red}Error running coordinate fix script: ${error.message}${COLORS.reset}`
    );
    process.exit(1);
  }
}

// Validate GeoJSON
console.log(`${COLORS.blue}Validating GeoJSON...${COLORS.reset}`);
let geoJson;
try {
  const jsonData = fs.readFileSync(SOURCE_DATA, "utf8");
  geoJson = JSON.parse(jsonData);

  // Basic GeoJSON validation
  if (!geoJson.type) {
    console.error(
      `${COLORS.red}Invalid GeoJSON: missing 'type' property${COLORS.reset}`
    );
    process.exit(1);
  }

  if (geoJson.type !== "FeatureCollection" && geoJson.type !== "Feature") {
    console.error(
      `${COLORS.red}Invalid GeoJSON: type must be 'FeatureCollection' or 'Feature'${COLORS.reset}`
    );
    process.exit(1);
  }

  if (
    geoJson.type === "FeatureCollection" &&
    (!Array.isArray(geoJson.features) || geoJson.features.length === 0)
  ) {
    console.error(
      `${COLORS.red}Invalid GeoJSON: FeatureCollection must have 'features' array${COLORS.reset}`
    );
    process.exit(1);
  }

  // Check coordinates
  const features =
    geoJson.type === "FeatureCollection" ? geoJson.features : [geoJson];
  let coordinateErrors = 0;

  features.forEach((feature, index) => {
    if (!feature.geometry || !feature.geometry.coordinates) {
      console.error(
        `${COLORS.red}Feature #${index} missing geometry or coordinates${COLORS.reset}`
      );
      coordinateErrors++;
      return;
    }

    const coords = feature.geometry.coordinates;

    // Check Point coordinates
    if (feature.geometry.type === "Point") {
      if (!Array.isArray(coords) || coords.length !== 2) {
        console.error(
          `${COLORS.red}Invalid Point coordinates in feature #${index}${COLORS.reset}`
        );
        coordinateErrors++;
      } else if (Math.abs(coords[0]) > 180 || Math.abs(coords[1]) > 90) {
        console.error(
          `${COLORS.red}Out of range coordinates in feature #${index}: [${coords[0]}, ${coords[1]}]${COLORS.reset}`
        );
        coordinateErrors++;
      }
    }

    // Check LineString coordinates
    else if (feature.geometry.type === "LineString") {
      if (!Array.isArray(coords) || coords.length < 2) {
        console.error(
          `${COLORS.red}Invalid LineString coordinates in feature #${index}${COLORS.reset}`
        );
        coordinateErrors++;
      } else {
        coords.forEach((point, pointIndex) => {
          if (
            !Array.isArray(point) ||
            point.length !== 2 ||
            Math.abs(point[0]) > 180 ||
            Math.abs(point[1]) > 90
          ) {
            console.error(
              `${
                COLORS.red
              }Invalid LineString point #${pointIndex} in feature #${index}: ${JSON.stringify(
                point
              )}${COLORS.reset}`
            );
            coordinateErrors++;
          }
        });
      }
    }
  });

  if (coordinateErrors > 0) {
    console.error(
      `${COLORS.red}Found ${coordinateErrors} coordinate errors in GeoJSON file${COLORS.reset}`
    );
    process.exit(1);
  }

  console.log(
    `${COLORS.green}GeoJSON validation successful! No errors found.${COLORS.reset}`
  );
} catch (error) {
  console.error(
    `${COLORS.red}Error validating GeoJSON: ${error.message}${COLORS.reset}`
  );
  process.exit(1);
}

// Create directories if they don't exist
console.log(`${COLORS.blue}Creating directories...${COLORS.reset}`);
try {
  const publicDataDir = path.dirname(PUBLIC_SITE_DATA);
  if (!fs.existsSync(publicDataDir)) {
    fs.mkdirSync(publicDataDir, { recursive: true });
    console.log(
      `${COLORS.green}Created directory: ${publicDataDir}${COLORS.reset}`
    );
  }

  if (!fs.existsSync(SRC_DATA_DIR)) {
    fs.mkdirSync(SRC_DATA_DIR, { recursive: true });
    console.log(
      `${COLORS.green}Created directory: ${SRC_DATA_DIR}${COLORS.reset}`
    );
  }
} catch (error) {
  console.error(
    `${COLORS.red}Error creating directories: ${error.message}${COLORS.reset}`
  );
  process.exit(1);
}

// Copy GeoJSON to public site data directory
console.log(`${COLORS.blue}Copying GeoJSON to public site...${COLORS.reset}`);
try {
  fs.copyFileSync(SOURCE_DATA, PUBLIC_SITE_DATA);
  console.log(
    `${COLORS.green}Successfully copied GeoJSON to: ${PUBLIC_SITE_DATA}${COLORS.reset}`
  );
} catch (error) {
  console.error(
    `${COLORS.red}Error copying GeoJSON: ${error.message}${COLORS.reset}`
  );
  process.exit(1);
}

// Convert to trip-data.json format if not already there
console.log(
  `${COLORS.blue}Preparing trip data for React components...${COLORS.reset}`
);
try {
  let tripData = {
    route: [],
    stops: [],
    lastUpdated: new Date().toISOString(),
  };

  // Extract route and stops from GeoJSON
  const features =
    geoJson.type === "FeatureCollection" ? geoJson.features : [geoJson];

  features.forEach((feature) => {
    if (!feature.geometry) return;

    // Extract route from LineString
    if (feature.geometry.type === "LineString") {
      tripData.route = feature.geometry.coordinates.map((coord) => ({
        longitude: coord[0],
        latitude: coord[1],
        coordinates: coord,
      }));
    }

    // Extract stops from Point
    if (feature.geometry.type === "Point") {
      const props = feature.properties || {};
      tripData.stops.push({
        id: props.id || `stop-${tripData.stops.length}`,
        name: props.name || `Stop ${tripData.stops.length}`,
        description: props.description || props.name || "",
        type: props.type || "waypoint",
        overnight: !!props.overnight,
        charging: !!props.charging,
        state: props.state || "",
        longitude: feature.geometry.coordinates[0],
        latitude: feature.geometry.coordinates[1],
        coordinates: feature.geometry.coordinates,
      });
    }
  });

  // Only write if we extracted data
  if (tripData.route.length > 0 || tripData.stops.length > 0) {
    fs.writeFileSync(SRC_DATA_FILE, JSON.stringify(tripData, null, 2), "utf8");
    console.log(
      `${COLORS.green}Successfully prepared trip data for React: ${SRC_DATA_FILE}${COLORS.reset}`
    );
    console.log(
      `${COLORS.green}→ Extracted ${tripData.route.length} route points and ${tripData.stops.length} stops${COLORS.reset}`
    );
  } else {
    console.warn(
      `${COLORS.yellow}Warning: No route or stops found in GeoJSON. Not updating trip-data.json${COLORS.reset}`
    );
  }
} catch (error) {
  console.error(
    `${COLORS.red}Error preparing trip data: ${error.message}${COLORS.reset}`
  );
  process.exit(1);
}

console.log(
  `\n${COLORS.green}✓ GeoJSON validation and copying complete!${COLORS.reset}`
);
