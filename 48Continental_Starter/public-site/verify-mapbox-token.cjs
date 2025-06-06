#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-env node */

/**
 * MapBox Token Verification Script
 *
 * This script verifies that the MapBox token is valid and provides detailed
 * diagnostic information about any issues encountered.
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

console.log("🗺️ MapBox Token Verification Script");
console.log("===================================");

// Path to .env file
const envPath = path.resolve(__dirname, ".env");

// Check if .env file exists
if (!fs.existsSync(envPath)) {
  console.error("❌ Error: .env file not found at", envPath);
  process.exit(1);
}

// Load environment variables from .env file
console.log("📄 Loading environment variables from", envPath);
const envContent = fs.readFileSync(envPath, "utf8");
const envLines = envContent.split("\n");

// Parse the .env file manually to find the MapBox token
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
  console.error("❌ Error: VITE_MAPBOX_TOKEN not found in .env file");
  process.exit(1);
}

console.log("🔑 Found MapBox token:", mapboxToken.substring(0, 10) + "...");

// Validate token format
if (!mapboxToken.startsWith("pk.")) {
  console.error(
    '❌ Error: MapBox token does not start with "pk." (public token prefix)'
  );
  process.exit(1);
}

console.log("✅ Token format validation passed (starts with pk.)");
console.log("🔄 Testing token against MapBox API...");

// Test against MapBox API to verify the token is valid
const url = `https://api.mapbox.com/styles/v1/mapbox/streets-v11?access_token=${mapboxToken}`;
const testMapboxStyles = () => {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 200) {
          resolve({ success: true, status: res.statusCode, data });
        } else {
          resolve({
            success: false,
            status: res.statusCode,
            message: `API request failed with status ${res.statusCode}`,
            data,
          });
        }
      });
    });

    req.on("error", (error) => {
      reject({ success: false, message: error.message });
    });

    req.end();
  });
};

// Test MapBox Styles API (validates token)
testMapboxStyles()
  .then((result) => {
    if (result.success) {
      console.log("✅ MapBox API validation successful!");
      console.log("✅ The token is valid and able to access MapBox styles.");

      // Check if the current token is being used in Map.jsx
      const mapJsxPath = path.resolve(__dirname, "src/components/Map.jsx");
      if (fs.existsSync(mapJsxPath)) {
        const mapJsxContent = fs.readFileSync(mapJsxPath, "utf8");

        // Check for hardcoded token that might override the environment variable
        if (mapJsxContent.includes("mapboxgl.accessToken =")) {
          if (!mapJsxContent.includes("import.meta.env.VITE_MAPBOX_TOKEN")) {
            console.warn(
              "⚠️ Warning: Map.jsx might be using a hardcoded token instead of the environment variable"
            );
          }
        }

        console.log("✅ Map.jsx file checked for token usage");
      }

      console.log(
        "\n✅ All checks passed. The MapBox token is valid and properly configured."
      );
      console.log(
        "\nIf the map still isn't working, the issue might be related to:"
      );
      console.log("1. MapBox initialization timing in your React component");
      console.log(
        "2. CSS issues preventing the map container from displaying properly"
      );
      console.log(
        "3. Console errors related to MapBox initialization (check browser console)"
      );
      console.log("4. Network connectivity or browser compatibility issues");
    } else {
      console.error("❌ MapBox API validation failed!");
      console.error(`❌ Status code: ${result.status}`);
      console.error(`❌ Response: ${result.data}`);
      console.error(
        "\n❌ The token might be invalid, expired, or rate-limited."
      );
      console.error(
        "Please check the MapBox dashboard to verify the token status."
      );
    }
  })
  .catch((error) => {
    console.error("❌ Error testing MapBox token:", error.message);
    console.error("This might indicate a network connectivity issue.");
  });
