#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-env node */

/**
 * Map Functionality Fix Script
 *
 * This script diagnoses and fixes issues with the map functionality, focusing on:
 * 1. Coordinate format consistency checking ([longitude, latitude] for GeoJSON)
 * 2. MapBox token validation
 * 3. Data pipeline verification
 * 4. GeoJSON structure validation
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

console.log("🗺️ Map Functionality Fix Script");
console.log("===============================");

// Configuration
// Fix paths to point to the correct locations
const ITINERARY_PATH = path.resolve(__dirname, "../../itinerary.json");
const ITINERARY_FULL_PATH = path.resolve(
  __dirname,
  "../../itinerary-full.json"
);
const TRIP_DATA_PATH = path.resolve(__dirname, "./src/data/trip-data.json");
const MAP_COMPONENT_PATH = path.resolve(__dirname, "./src/components/Map.jsx");

// Helper function to validate GeoJSON coordinates
function validateCoordinates(coordinates, name = "Unknown") {
  let isValid = true;
  let issues = [];

  if (!Array.isArray(coordinates)) {
    return {
      isValid: false,
      issues: [`${name}: Coordinates are not an array`],
    };
  }

  // For Point geometries, coordinates should be [longitude, latitude]
  if (
    coordinates.length === 2 &&
    typeof coordinates[0] === "number" &&
    typeof coordinates[1] === "number"
  ) {
    // Check longitude range (-180 to 180)
    if (coordinates[0] < -180 || coordinates[0] > 180) {
      isValid = false;
      issues.push(
        `${name}: Longitude ${coordinates[0]} is out of range (-180 to 180)`
      );
    }

    // Check latitude range (-90 to 90)
    if (coordinates[1] < -90 || coordinates[1] > 90) {
      isValid = false;
      issues.push(
        `${name}: Latitude ${coordinates[1]} is out of range (-90 to 90)`
      );
    }

    // Check if coordinates might be in wrong order (common issue)
    if (Math.abs(coordinates[0]) > 90 && Math.abs(coordinates[1]) <= 90) {
      // This is probably correct [longitude, latitude]
    } else if (
      Math.abs(coordinates[0]) <= 90 &&
      Math.abs(coordinates[1]) > 90
    ) {
      isValid = false;
      issues.push(
        `${name}: Coordinates appear to be in [latitude, longitude] format, but GeoJSON requires [longitude, latitude]`
      );
    }
  }
  // For LineString, Polygon, etc., coordinates are nested arrays
  else if (Array.isArray(coordinates[0])) {
    coordinates.forEach((coord, index) => {
      const result = validateCoordinates(coord, `${name}[${index}]`);
      if (!result.isValid) {
        isValid = false;
        issues = [...issues, ...result.issues];
      }
    });
  }

  return { isValid, issues };
}

// Helper function to validate a GeoJSON Feature
function validateGeoJSONFeature(feature, name = "Feature") {
  let isValid = true;
  let issues = [];

  if (!feature) {
    return { isValid: false, issues: ["Feature is null or undefined"] };
  }

  if (feature.type !== "Feature") {
    isValid = false;
    issues.push(`${name}: Type is "${feature.type}" but should be "Feature"`);
  }

  if (!feature.geometry) {
    isValid = false;
    issues.push(`${name}: Missing geometry property`);
  } else {
    if (!feature.geometry.type) {
      isValid = false;
      issues.push(`${name}: Missing geometry type`);
    }

    if (!feature.geometry.coordinates) {
      isValid = false;
      issues.push(`${name}: Missing geometry coordinates`);
    } else {
      const coordResult = validateCoordinates(
        feature.geometry.coordinates,
        `${name}.coordinates`
      );
      if (!coordResult.isValid) {
        isValid = false;
        issues = [...issues, ...coordResult.issues];
      }
    }
  }

  return { isValid, issues };
}

// Helper function to validate a GeoJSON FeatureCollection
function validateGeoJSONFeatureCollection(
  featureCollection,
  name = "FeatureCollection"
) {
  let isValid = true;
  let issues = [];

  if (!featureCollection) {
    return {
      isValid: false,
      issues: ["FeatureCollection is null or undefined"],
    };
  }

  if (featureCollection.type !== "FeatureCollection") {
    isValid = false;
    issues.push(
      `${name}: Type is "${featureCollection.type}" but should be "FeatureCollection"`
    );
  }

  if (!Array.isArray(featureCollection.features)) {
    isValid = false;
    issues.push(`${name}: Missing or invalid features array`);
  } else {
    featureCollection.features.forEach((feature, index) => {
      const featureResult = validateGeoJSONFeature(
        feature,
        `${name}.features[${index}]`
      );
      if (!featureResult.isValid) {
        isValid = false;
        issues = [...issues, ...featureResult.issues];
      }
    });
  }

  return { isValid, issues };
}

// Check and fix itinerary.json
function checkItinerary() {
  console.log("\n📍 Checking itinerary data...");

  if (!fs.existsSync(ITINERARY_PATH)) {
    console.log(`❌ Error: Itinerary file not found at ${ITINERARY_PATH}`);
    return;
  }

  try {
    const itineraryData = JSON.parse(fs.readFileSync(ITINERARY_PATH, "utf8"));
    console.log(`✅ Itinerary file loaded successfully`);

    // Check if itinerary has locations array
    if (!Array.isArray(itineraryData.locations)) {
      console.log("❌ Error: Itinerary does not have a locations array");
      return;
    }

    console.log(
      `📌 Found ${itineraryData.locations.length} locations in itinerary`
    );

    // Check for coordinate issues in locations
    let locationIssues = 0;
    let fixedLocations = 0;

    const fixedItinerary = { ...itineraryData };

    fixedItinerary.locations = itineraryData.locations.map((location) => {
      const updatedLocation = { ...location };

      // Check if location has coordinates
      if (!location.coordinates || !Array.isArray(location.coordinates)) {
        console.log(
          `❌ Location "${location.name}" has missing or invalid coordinates`
        );
        locationIssues++;
        return updatedLocation;
      }

      // Validate coordinate format
      const { isValid, issues } = validateCoordinates(
        location.coordinates,
        location.name
      );

      if (!isValid) {
        locationIssues++;
        issues.forEach((issue) => console.log(`  ❌ ${issue}`));

        // Try to fix coordinates if they appear to be in wrong order
        if (
          issues.some((issue) =>
            issue.includes("appear to be in [latitude, longitude] format")
          )
        ) {
          // Swap coordinates to [longitude, latitude] format
          const [lat, lng] = location.coordinates;
          updatedLocation.coordinates = [lng, lat];
          console.log(
            `  🔄 Fixed coordinates for "${location.name}": [${lat}, ${lng}] -> [${lng}, ${lat}]`
          );
          fixedLocations++;
        }
      }

      return updatedLocation;
    });

    if (locationIssues > 0) {
      if (fixedLocations > 0) {
        // Save fixed itinerary
        fs.writeFileSync(
          ITINERARY_PATH,
          JSON.stringify(fixedItinerary, null, 2),
          "utf8"
        );
        console.log(
          `✅ Fixed ${fixedLocations} locations and saved to ${ITINERARY_PATH}`
        );
      } else {
        console.log(
          `❌ Found ${locationIssues} locations with issues but couldn't automatically fix them`
        );
      }
    } else {
      console.log("✅ All location coordinates appear to be valid");
    }

    // Check if itinerary has a route property with GeoJSON
    if (itineraryData.route) {
      console.log("\n📍 Checking route GeoJSON...");

      const { isValid, issues } = validateGeoJSONFeature(
        itineraryData.route,
        "route"
      );

      if (!isValid) {
        console.log("❌ Route GeoJSON has issues:");
        issues.forEach((issue) => console.log(`  ❌ ${issue}`));
      } else {
        console.log("✅ Route GeoJSON appears to be valid");
      }
    }
  } catch (error) {
    console.log(`❌ Error processing itinerary: ${error.message}`);
  }
}

// Check full itinerary (if available)
function checkFullItinerary() {
  console.log("\n📍 Checking full itinerary data...");

  if (!fs.existsSync(ITINERARY_FULL_PATH)) {
    console.log(`ℹ️ Full itinerary file not found at ${ITINERARY_FULL_PATH}`);
    return;
  }

  try {
    const itineraryData = JSON.parse(
      fs.readFileSync(ITINERARY_FULL_PATH, "utf8")
    );
    console.log(`✅ Full itinerary file loaded successfully`);

    // Check for GeoJSON feature collection structure
    if (itineraryData.geoJSON) {
      console.log("\n📍 Checking GeoJSON in full itinerary...");

      const { isValid, issues } = validateGeoJSONFeatureCollection(
        itineraryData.geoJSON,
        "geoJSON"
      );

      if (!isValid) {
        console.log("❌ GeoJSON has issues:");
        issues.forEach((issue) => console.log(`  ❌ ${issue}`));
      } else {
        console.log("✅ GeoJSON appears to be valid");
      }
    }
  } catch (error) {
    console.log(`❌ Error processing full itinerary: ${error.message}`);
  }
}

// Check the map component for initialization issues
function checkMapComponent() {
  console.log("\n📍 Analyzing Map component...");

  if (!fs.existsSync(MAP_COMPONENT_PATH)) {
    console.log(`❌ Error: Map component not found at ${MAP_COMPONENT_PATH}`);
    return;
  }

  try {
    const mapCode = fs.readFileSync(MAP_COMPONENT_PATH, "utf8");
    console.log("✅ Map component file loaded successfully");

    // Check for token initialization issues
    if (!mapCode.includes("mapboxgl.accessToken =")) {
      console.log(
        "❌ Map component is missing mapboxgl.accessToken initialization"
      );
    } else {
      console.log("✅ Found mapboxgl.accessToken initialization");

      // Check how token is initialized
      if (mapCode.includes("import.meta.env.VITE_MAPBOX_TOKEN")) {
        console.log("✅ Token is loaded from environment variables correctly");
      } else {
        console.log(
          "⚠️ Token might be hardcoded instead of using environment variables"
        );
      }
    }

    // Check for appropriate error handling in map initialization
    if (mapCode.includes("try") && mapCode.includes("catch")) {
      console.log("✅ Map initialization appears to have error handling");
    } else {
      console.log("⚠️ Map initialization might be missing error handling");
    }

    // Check for layer initialization patterns
    if (mapCode.includes("map.on('load'")) {
      console.log("✅ Map has load event handler for layer initialization");
    } else {
      console.log(
        "⚠️ Map might be missing load event handler for layer initialization"
      );
    }

    // Check for coordinate transformation functions
    const hasCoordinateTransformation =
      mapCode.includes("reverse()") ||
      mapCode.includes("[lng, lat]") ||
      mapCode.includes("[lon, lat]") ||
      (mapCode.includes("swap") && mapCode.includes("coordinate"));

    if (hasCoordinateTransformation) {
      console.log(
        "⚠️ Map component contains coordinate transformations which might cause issues"
      );
      console.log("   Remember: MapBox requires [longitude, latitude] format");
    }
  } catch (error) {
    console.log(`❌ Error analyzing Map component: ${error.message}`);
  }
}

// Check the trip data for format issues
function checkTripData() {
  console.log("\n📍 Checking trip data...");

  if (!fs.existsSync(TRIP_DATA_PATH)) {
    console.log(`ℹ️ Trip data file not found at ${TRIP_DATA_PATH}`);
    return;
  }

  try {
    const tripData = JSON.parse(fs.readFileSync(TRIP_DATA_PATH, "utf8"));
    console.log(`✅ Trip data file loaded successfully`);

    // Check if trip data has expected properties
    const requiredProperties = [
      "tripName",
      "startDate",
      "endDate",
      "currentLocation",
    ];
    const missingProperties = requiredProperties.filter(
      (prop) => !tripData[prop]
    );

    if (missingProperties.length > 0) {
      console.log(
        `⚠️ Trip data is missing properties: ${missingProperties.join(", ")}`
      );
    } else {
      console.log("✅ Trip data has all required basic properties");
    }

    // Check current location coordinates if available
    if (tripData.currentLocation && tripData.currentLocation.coordinates) {
      console.log("📌 Checking current location coordinates...");

      const { isValid, issues } = validateCoordinates(
        tripData.currentLocation.coordinates,
        "currentLocation"
      );

      if (!isValid) {
        console.log("❌ Current location coordinates have issues:");
        issues.forEach((issue) => console.log(`  ❌ ${issue}`));
      } else {
        console.log("✅ Current location coordinates appear to be valid");
      }
    }

    // Check route data if available
    if (tripData.route) {
      console.log("📌 Checking route data...");

      if (tripData.route.type === "Feature") {
        const { isValid, issues } = validateGeoJSONFeature(
          tripData.route,
          "route"
        );

        if (!isValid) {
          console.log("❌ Route GeoJSON has issues:");
          issues.forEach((issue) => console.log(`  ❌ ${issue}`));
        } else {
          console.log("✅ Route GeoJSON appears to be valid");
        }
      } else {
        console.log(
          `⚠️ Route data does not appear to be a valid GeoJSON Feature`
        );
      }
    }
  } catch (error) {
    console.log(`❌ Error processing trip data: ${error.message}`);
  }
}

// Check MapBox token
function checkMapBoxToken() {
  console.log("\n📍 Checking MapBox token...");

  const envPath = path.resolve(__dirname, ".env");

  // Check if .env file exists
  if (!fs.existsSync(envPath)) {
    console.log(`⚠️ .env file not found at ${envPath}`);
    console.log("   You might be missing the MapBox token configuration");
    return;
  }

  try {
    const envContent = fs.readFileSync(envPath, "utf8");
    const envLines = envContent.split("\n");

    // Find MapBox token in .env file
    let mapboxToken = null;
    for (const line of envLines) {
      if (line.trim().startsWith("VITE_MAPBOX_TOKEN=")) {
        mapboxToken = line.trim().split("=")[1];
        // Remove quotes if present
        if (mapboxToken.startsWith('"') && mapboxToken.endsWith('"')) {
          mapboxToken = mapboxToken.slice(1, -1);
        }
        if (mapboxToken.startsWith("'") && mapboxToken.endsWith("'")) {
          mapboxToken = mapboxToken.slice(1, -1);
        }
        break;
      }
    }

    if (!mapboxToken) {
      console.log("❌ VITE_MAPBOX_TOKEN not found in .env file");
      return;
    }

    console.log(`🔑 Found MapBox token: ${mapboxToken.substring(0, 10)}...`);

    // Validate token format
    if (!mapboxToken.startsWith("pk.")) {
      console.log(
        '❌ MapBox token does not start with "pk." (public token prefix)'
      );
      return;
    }

    console.log("✅ Token format validation passed (starts with pk.)");
    console.log("🔄 Testing token against MapBox API...");

    // Test against MapBox API to verify the token is valid
    const url = `https://api.mapbox.com/styles/v1/mapbox/streets-v11?access_token=${mapboxToken}`;

    https
      .get(url, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          if (res.statusCode === 200) {
            console.log("✅ MapBox API validation successful!");
            console.log(
              "✅ The token is valid and able to access MapBox styles."
            );

            // Continue with other checks after token validation
            checkItinerary();
            checkFullItinerary();
            checkMapComponent();
            checkTripData();

            console.log("\n🚀 Fix Recommendations:");
            console.log(
              "1. Check browser console for MapBox errors when map fails to load"
            );
            console.log(
              "2. Ensure all GeoJSON uses [longitude, latitude] format (not [latitude, longitude])"
            );
            console.log(
              "3. Verify that the map container has a proper height/width set in CSS"
            );
            console.log(
              "4. Use the MapDebug.jsx component to isolate map initialization issues"
            );
            console.log(
              "5. Ensure the trip data fetch completes before initializing map layers"
            );
          } else {
            console.log(
              `❌ MapBox API validation failed with status ${res.statusCode}`
            );
            console.log(`❌ Response: ${data}`);
            console.log(
              "\n❌ The token might be invalid, expired, or rate-limited."
            );
            console.log(
              "   Please check the MapBox dashboard to verify the token status."
            );
          }
        });
      })
      .on("error", (error) => {
        console.log(`❌ Error testing MapBox token: ${error.message}`);
        console.log("   This might indicate a network connectivity issue.");

        // Continue with other checks even if token validation fails
        checkItinerary();
        checkFullItinerary();
        checkMapComponent();
        checkTripData();
      });
  } catch (error) {
    console.log(`❌ Error checking MapBox token: ${error.message}`);
  }
}

// Start diagnostics with MapBox token check
checkMapBoxToken();
