#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-env node */

/**
 * Coordinate Format Fix Script
 *
 * This script fixes coordinate format inconsistencies in the project:
 * 1. Ensures all GeoJSON data uses [longitude, latitude] format (required by MapBox)
 * 2. Creates standardized test data for verification
 * 3. Generates both raw and GeoJSON formatted data files
 *
 * The script also creates testing files to verify proper coordinate rendering.
 */

const fs = require("fs");
const path = require("path");

console.log("🔄 Starting coordinate format fix process...");

// ====== STEP 1: Ensure itinerary data exists ======
const itineraryPath = path.resolve(__dirname, "../itinerary.json");
if (!fs.existsSync(itineraryPath)) {
  console.error(
    "❌ itinerary.json not found. Please run update-itinerary-with-coords.cjs first."
  );
  process.exit(1);
}

// ====== STEP 2: Load and verify itinerary data ======
console.log("📂 Loading itinerary data...");
let itineraryData;
try {
  const itineraryContent = fs.readFileSync(itineraryPath, "utf8");
  itineraryData = JSON.parse(itineraryContent);
  console.log(
    `✅ Successfully loaded itinerary with ${itineraryData.stops.length} stops`
  );
} catch (error) {
  console.error("❌ Error loading itinerary data:", error.message);
  process.exit(1);
}

// ====== STEP 3: Validate and fix coordinate formats ======
console.log("🔍 Validating and fixing coordinate formats...");

/**
 * Validate a coordinate pair to ensure it follows proper GeoJSON format [longitude, latitude]
 * Returns properly formatted coordinates or null if invalid
 */
function validateAndFixCoordinates(coords) {
  // If already an array with two elements
  if (Array.isArray(coords) && coords.length === 2) {
    // Convert strings to numbers if needed
    const [first, second] = coords.map((v) =>
      typeof v === "string" ? parseFloat(v) : v
    );

    // Skip invalid numbers
    if (isNaN(first) || isNaN(second)) {
      console.warn("⚠️ Invalid coordinate values:", coords);
      return null;
    }

    // Check if values are in valid ranges
    // Longitude: -180 to 180, Latitude: -90 to 90
    const isValidLong = Math.abs(first) <= 180;
    const isValidLat = Math.abs(second) <= 90;

    // Both values are valid in their respective ranges (proper GeoJSON order)
    if (isValidLong && isValidLat) {
      return [first, second]; // Already in [longitude, latitude] format
    }

    // First value looks like latitude, second like longitude (swapped)
    if (Math.abs(first) <= 90 && Math.abs(second) <= 180) {
      console.log(
        `🔄 Swapping coordinates: [${first}, ${second}] → [${second}, ${first}]`
      );
      return [second, first]; // Return in [longitude, latitude] format
    }

    // Both values are out of expected ranges
    console.warn("⚠️ Coordinates out of expected ranges:", coords);
    return null;
  }

  // If it's an object with lat/lng or latitude/longitude properties
  if (coords && typeof coords === "object") {
    let lat, lng;

    // Extract from latitude/longitude properties
    if (coords.latitude !== undefined && coords.longitude !== undefined) {
      lat =
        typeof coords.latitude === "string"
          ? parseFloat(coords.latitude)
          : coords.latitude;
      lng =
        typeof coords.longitude === "string"
          ? parseFloat(coords.longitude)
          : coords.longitude;
    }
    // Extract from lat/lng properties
    else if (coords.lat !== undefined && coords.lng !== undefined) {
      lat =
        typeof coords.lat === "string" ? parseFloat(coords.lat) : coords.lat;
      lng =
        typeof coords.lng === "string" ? parseFloat(coords.lng) : coords.lng;
    }

    // Skip invalid numbers
    if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) {
      console.warn("⚠️ Invalid coordinate object:", coords);
      return null;
    }

    // Check if values are in valid ranges
    const isValidLat = Math.abs(lat) <= 90;
    const isValidLng = Math.abs(lng) <= 180;

    if (!isValidLat || !isValidLng) {
      // Check if they might be swapped
      if (Math.abs(lng) <= 90 && Math.abs(lat) <= 180) {
        console.log(
          `🔄 Swapping lat/lng properties: {lat: ${lat}, lng: ${lng}} → {lat: ${lng}, lng: ${lat}}`
        );
        return [lat, lng]; // Return swapped as [longitude, latitude]
      }

      console.warn("⚠️ Coordinate values out of expected ranges:", coords);
      return null;
    }

    return [lng, lat]; // Return in [longitude, latitude] format
  }

  console.warn("⚠️ Unsupported coordinate format:", coords);
  return null;
}

// Fix coordinates in the itinerary data
const fixedStops = itineraryData.stops.map((stop) => {
  // Start with the original stop data
  const fixedStop = { ...stop };

  // First check if the stop has coordinates array
  let fixedCoords = null;
  if (stop.coordinates) {
    fixedCoords = validateAndFixCoordinates(stop.coordinates);
  }

  // If no coordinates or validation failed, try using latitude/longitude properties
  if (
    !fixedCoords &&
    stop.latitude !== undefined &&
    stop.longitude !== undefined
  ) {
    fixedCoords = validateAndFixCoordinates({
      latitude: stop.latitude,
      longitude: stop.longitude,
    });
  }

  // If we still don't have valid coordinates, use a fallback
  if (!fixedCoords) {
    console.warn(
      `⚠️ Could not validate coordinates for stop: ${stop.location}. Using fallback.`
    );
    // Default to a central US location
    fixedCoords = [-98.5795, 39.8283]; // Center of US in [longitude, latitude] format
  }

  // Update with proper formatted coordinates
  fixedStop.coordinates = fixedCoords; // GeoJSON [longitude, latitude] format
  fixedStop.longitude = fixedCoords[0];
  fixedStop.latitude = fixedCoords[1];

  return fixedStop;
});

// Create a fixed itinerary object
const fixedItinerary = {
  ...itineraryData,
  stops: fixedStops,
  meta: {
    ...(itineraryData.meta || {}),
    coordinatesFixed: true,
    fixedAt: new Date().toISOString(),
    formatInfo: "All coordinates use GeoJSON [longitude, latitude] format",
  },
};

console.log(`✅ Fixed coordinates for ${fixedStops.length} stops`);

// ====== STEP 4: Generate GeoJSON version ======
console.log("🔄 Generating GeoJSON format data...");

// Create a proper GeoJSON feature collection
const geoJsonData = {
  type: "FeatureCollection",
  features: [
    // Route feature (LineString)
    {
      type: "Feature",
      properties: {
        name: "48 Continental USA Route",
        description: "Complete route through all 48 contiguous US states",
      },
      geometry: {
        type: "LineString",
        coordinates: fixedStops.map((stop) => stop.coordinates), // Already in [longitude, latitude] format
      },
    },
    // Individual stop features (Points)
    ...fixedStops.map((stop) => ({
      type: "Feature",
      properties: {
        id: stop.id || `stop-${Math.random().toString(36).substring(2, 9)}`,
        name: stop.location.split(",")[0].trim(),
        state: stop.state,
        description: stop.notes || stop.description || `${stop.location}`,
        type: stop.type || "waypoint",
        charging: stop.type === "charging" || stop.type === "overnight",
        overnight: stop.type === "overnight",
      },
      geometry: {
        type: "Point",
        coordinates: stop.coordinates, // Already in [longitude, latitude] format
      },
    })),
  ],
};

// ====== STEP 5: Save all data files ======
console.log("💾 Saving fixed data files...");

// Ensure directories exist
const publicSiteDataDir = path.resolve(
  __dirname,
  "../48Continental_Starter/public-site/src/data"
);
if (!fs.existsSync(publicSiteDataDir)) {
  fs.mkdirSync(publicSiteDataDir, { recursive: true });
}

// Save fixed itinerary
fs.writeFileSync(
  path.resolve(__dirname, "../itinerary-fixed.json"),
  JSON.stringify(fixedItinerary, null, 2)
);
console.log("✅ Saved itinerary-fixed.json");

// Save GeoJSON version
fs.writeFileSync(
  path.resolve(__dirname, "../itinerary-geo.json"),
  JSON.stringify(geoJsonData, null, 2)
);
console.log("✅ Saved itinerary-geo.json");

// Copy to public site data directory for front-end access
fs.writeFileSync(
  path.resolve(publicSiteDataDir, "trip-data.json"),
  JSON.stringify(fixedItinerary, null, 2)
);
console.log("✅ Saved public-site/src/data/trip-data.json");

fs.writeFileSync(
  path.resolve(publicSiteDataDir, "trip-data.geojson"),
  JSON.stringify(geoJsonData, null, 2)
);
console.log("✅ Saved public-site/src/data/trip-data.geojson");

// ====== STEP 6: Generate diagnostic script ======
console.log("🔧 Creating diagnostic utility...");

const diagnosticScript = `
/* eslint-env browser */
/**
 * Map Coordinate Diagnostic Utility
 * This script runs diagnostics on map coordinates to help troubleshoot rendering issues
 */

(function() {
  console.log('🔍 Starting map coordinate diagnostics...');
  
  // Check if MapBox is loaded
  if (!window.mapboxgl) {
    console.error('❌ MapBox GL not loaded!');
    return;
  }
  
  console.log('✅ MapBox GL version:', window.mapboxgl.version);
  console.log('✅ MapBox access token:', window.mapboxgl.accessToken ? 'Present' : 'Missing');
  
  // Check trip data
  async function checkTripData() {
    try {
      const response = await fetch('/src/data/trip-data.json');
      if (!response.ok) {
        throw new Error(\`Failed to fetch trip data: \${response.status}\`);
      }
      
      const tripData = await response.json();
      console.log('✅ Trip data loaded with', tripData.stops.length, 'stops');
      
      // Validate coordinates
      let validCoords = 0;
      let invalidCoords = 0;
      
      tripData.stops.forEach((stop, index) => {
        // Check for latitude/longitude properties
        const hasLatLng = stop.latitude !== undefined && stop.longitude !== undefined;
        
        // Check for coordinates array
        const hasCoords = Array.isArray(stop.coordinates) && stop.coordinates.length === 2;
        
        // Check values are valid numbers in proper ranges
        let validLatLng = false;
        let validCoords = false;
        
        if (hasLatLng) {
          validLatLng = 
            typeof stop.latitude === 'number' && !isNaN(stop.latitude) &&
            typeof stop.longitude === 'number' && !isNaN(stop.longitude) &&
            Math.abs(stop.latitude) <= 90 &&
            Math.abs(stop.longitude) <= 180;
        }
        
        if (hasCoords) {
          validCoords = 
            typeof stop.coordinates[0] === 'number' && !isNaN(stop.coordinates[0]) &&
            typeof stop.coordinates[1] === 'number' && !isNaN(stop.coordinates[1]) &&
            Math.abs(stop.coordinates[0]) <= 180 && // Longitude first in GeoJSON
            Math.abs(stop.coordinates[1]) <= 90;  // Latitude second in GeoJSON
        }
        
        if (validLatLng && validCoords) {
          validCoords++;
          
          // Cross-check if the values are consistent
          const coordsMatch = stop.longitude === stop.coordinates[0] && stop.latitude === stop.coordinates[1];
          if (!coordsMatch) {
            console.warn(\`⚠️ Stop \${index} (\${stop.location}) has inconsistent coordinates:
              latitude/longitude: [\${stop.latitude}, \${stop.longitude}]
              coordinates: [\${stop.coordinates[0]}, \${stop.coordinates[1]}]
            \`);
          }
        } else {
          invalidCoords++;
          console.error(\`❌ Stop \${index} (\${stop.location}) has invalid coordinates:
            hasLatLng: \${hasLatLng}, validLatLng: \${validLatLng}
            hasCoords: \${hasCoords}, validCoords: \${validCoords}
            Data: \`, stop);
        }
      });
      
      console.log(\`Coordinate validation: \${validCoords} valid, \${invalidCoords} invalid\`);
      
      // Also check GeoJSON format
      const geoResponse = await fetch('/src/data/trip-data.geojson');
      if (!geoResponse.ok) {
        throw new Error(\`Failed to fetch GeoJSON data: \${geoResponse.status}\`);
      }
      
      const geoData = await geoResponse.json();
      console.log('✅ GeoJSON data loaded with', geoData.features.length, 'features');
      
      // Identify feature types
      const featureTypes = {};
      geoData.features.forEach(feature => {
        const type = feature.geometry.type;
        featureTypes[type] = (featureTypes[type] || 0) + 1;
      });
      
      console.log('Feature types:', featureTypes);
      
      // Check LineString coordinates for route
      const routeFeature = geoData.features.find(f => f.geometry.type === 'LineString');
      if (routeFeature) {
        console.log(\`Route has \${routeFeature.geometry.coordinates.length} points\`);
        
        // Check first few and last few coordinates
        const firstFew = routeFeature.geometry.coordinates.slice(0, 3);
        const lastFew = routeFeature.geometry.coordinates.slice(-3);
        
        console.log('First few route coordinates:', firstFew);
        console.log('Last few route coordinates:', lastFew);
        
        // Check for valid longitude/latitude order in GeoJSON
        let invalidRoutePoints = 0;
        routeFeature.geometry.coordinates.forEach((coord, i) => {
          if (Math.abs(coord[0]) > 180 || Math.abs(coord[1]) > 90) {
            console.error(\`❌ Invalid route coordinate at index \${i}:\`, coord);
            invalidRoutePoints++;
          }
        });
        
        if (invalidRoutePoints === 0) {
          console.log('✅ All route coordinates are valid');
        } else {
          console.error(\`❌ Found \${invalidRoutePoints} invalid route coordinates\`);
        }
      }
    } catch (error) {
      console.error('❌ Error checking trip data:', error);
    }
  }
  
  checkTripData();
  
  console.log('🔍 Map coordinate diagnostics complete');
})();
`;

// Create utils directory if it doesn't exist
const utilsDir = path.resolve(
  __dirname,
  "../48Continental_Starter/public-site/src/utils"
);
if (!fs.existsSync(utilsDir)) {
  fs.mkdirSync(utilsDir, { recursive: true });
}

// Save diagnostic script
fs.writeFileSync(path.resolve(utilsDir, "diagnostic.js"), diagnosticScript);
console.log(
  "✅ Created diagnostic utility at public-site/src/utils/diagnostic.js"
);

// ====== STEP 7: Update routes configuration to include test page ======
console.log("🔄 Updating application routes...");

// Path to the router configuration
const routerPath = path.resolve(
  __dirname,
  "../48Continental_Starter/public-site/src/router.jsx"
);

// If router file exists, add the test route
if (fs.existsSync(routerPath)) {
  try {
    let routerContent = fs.readFileSync(routerPath, "utf8");

    // Check if the test route already exists
    if (!routerContent.includes("TestPage")) {
      // Import the TestPage component if it's not already imported
      if (!routerContent.includes("import TestPage")) {
        const importStatement = "import TestPage from './pages/TestPage';\n";
        // Add import after the last import statement
        const lastImportIndex = routerContent.lastIndexOf("import");
        const lastImportEndIndex =
          routerContent.indexOf("\n", lastImportIndex) + 1;
        routerContent =
          routerContent.slice(0, lastImportEndIndex) +
          importStatement +
          routerContent.slice(lastImportEndIndex);
      }

      // Add the test route
      const routeDefinition = `
  {
    path: '/test',
    element: <TestPage />
  },`;

      // Find the routes array and add the new route
      const routesStartIndex = routerContent.indexOf("[");
      const nextLineIndex = routerContent.indexOf("\n", routesStartIndex) + 1;
      routerContent =
        routerContent.slice(0, nextLineIndex) +
        routeDefinition +
        routerContent.slice(nextLineIndex);

      // Save the updated router file
      fs.writeFileSync(routerPath, routerContent);
      console.log("✅ Added test route to router.jsx");
    } else {
      console.log("ℹ️ Test route already exists in router.jsx");
    }
  } catch (error) {
    console.error("❌ Error updating router.jsx:", error.message);
  }
} else {
  console.warn("⚠️ router.jsx not found - test route not added");
}

console.log("🎉 Coordinate format fix process complete!");
console.log("👉 Run the script with: node scripts/fix-coordinate-format.cjs");
console.log("👉 Then navigate to /test route in the application to verify.");
