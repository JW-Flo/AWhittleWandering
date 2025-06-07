#!/usr/bin/env node
/**
 * Map Coordinate Format Fix Test Script
 *
 * This script tests the coordinate format fixes in the EnhancedVehicleMap component.
 * It starts the development server and opens a test page that displays the map
 * with various coordinate formats to verify they're properly handled.
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

// Configuration
const DEV_SERVER_PORT = 5173;
const TEST_URL = `http://localhost:${DEV_SERVER_PORT}/enhanced-vehicle-tracker?test=coordinates`;

// Path resolution
const PUBLIC_SITE_DIR = path.resolve(__dirname);
const PAGES_DIR = path.join(PUBLIC_SITE_DIR, "src", "pages");
const COMPONENTS_DIR = path.join(PUBLIC_SITE_DIR, "src", "components");

// Check if we need to create/modify the test page
const enhancedTestPagePath = path.join(
  PAGES_DIR,
  "EnhancedVehicleMapTestPage.jsx"
);

console.log(
  "✅ Ensuring the test page includes coordinate format test cases..."
);

// Read the current test page content
let testPageContent = fs.readFileSync(enhancedTestPagePath, "utf8");

// Check if the test page already has coordinate format test cases
if (!testPageContent.includes("coordinateFormatTest")) {
  // Add coordinate format test cases to the test page
  testPageContent = testPageContent.replace(
    "const EnhancedVehicleMapTestPage = () => {",
    `const EnhancedVehicleMapTestPage = () => {
    // Get URL params to check for coordinate format test mode
    const urlParams = new URLSearchParams(window.location.search);
    const isCoordinateTest = urlParams.get('test') === 'coordinates';
    
    // Special test data for coordinate format testing
    const coordinateFormatTest = {
        days: [
            {
                day: 1,
                route: [
                    { lat: 39.7392, lng: -104.9903 }, // Denver (standard format)
                    { latitude: 40.7608, longitude: -111.8910 }, // Salt Lake City (alternate property names)
                    [-118.2437, 34.0522], // Los Angeles (longitude, latitude array)
                    [37.7749, -122.4194], // San Francisco (latitude, longitude array - swapped)
                    { coordinates: [47.6062, -122.3321] } // Seattle (nested coordinates array - swapped)
                ],
                stops: [
                    { 
                        name: "Denver, CO", 
                        lat: 39.7392, 
                        lng: -104.9903,
                        type: "overnight"
                    },
                    { 
                        name: "Salt Lake City, UT", 
                        latitude: 40.7608, 
                        longitude: -111.8910,
                        type: "charging"
                    },
                    { 
                        name: "Los Angeles, CA",
                        coordinates: [-118.2437, 34.0522], // Array format
                        type: "attraction"
                    }
                ]
            }
        ]
    };`
  );

  // Update the EnhancedVehicleMap usage to conditionally use the test data
  testPageContent = testPageContent.replace(
    "<EnhancedVehicleMap",
    `{isCoordinateTest ? (
                <div className="coordinate-test-banner">
                    <h3>🧪 Coordinate Format Test Mode</h3>
                    <p>Testing various coordinate formats with the ensureMapboxFormat utility</p>
                </div>
            ) : null}
            <EnhancedVehicleMap
                tripData={isCoordinateTest ? coordinateFormatTest : tripData}`
  );

  // Save the updated test page
  fs.writeFileSync(enhancedTestPagePath, testPageContent);
  console.log(
    "✅ Added coordinate format test cases to EnhancedVehicleMapTestPage.jsx"
  );
} else {
  console.log("✅ Coordinate format test cases already exist in the test page");
}

// Add a CSS class for the test banner if needed
const testPageCssPath = path.join(PAGES_DIR, "EnhancedVehicleMapTestPage.css");
if (fs.existsSync(testPageCssPath)) {
  let cssContent = fs.readFileSync(testPageCssPath, "utf8");

  if (!cssContent.includes("coordinate-test-banner")) {
    cssContent += `
/* Coordinate test banner */
.coordinate-test-banner {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 10px;
    background-color: rgba(255, 193, 7, 0.9);
    color: #333;
    text-align: center;
    z-index: 1000;
    border-bottom: 2px solid #e69500;
}

.coordinate-test-banner h3 {
    margin: 0 0 5px 0;
}

.coordinate-test-banner p {
    margin: 0;
    font-size: 14px;
}
`;
    fs.writeFileSync(testPageCssPath, cssContent);
    console.log("✅ Added CSS styles for coordinate test banner");
  }
}

// Start the development server and open the test page
const openCommand =
  process.platform === "darwin"
    ? "open"
    : process.platform === "win32"
    ? "start"
    : "xdg-open";

console.log("🚀 Starting development server...");
console.log(`🌐 Opening test page: ${TEST_URL}`);

try {
  // Start the dev server in the background
  const npmCommand = os.platform() === "win32" ? "npm.cmd" : "npm";
  const devServer = require("child_process").spawn(npmCommand, ["run", "dev"], {
    cwd: PUBLIC_SITE_DIR,
    stdio: "inherit",
    detached: true,
  });

  // Wait a moment for the server to start
  setTimeout(() => {
    try {
      execSync(`${openCommand} "${TEST_URL}"`, { stdio: "inherit" });
      console.log("\n✅ Test environment is ready!");
      console.log(
        "🧪 Testing the coordinate format fix with various input formats."
      );
      console.log(
        "📋 Verify that the map displays correctly with all coordinate formats."
      );
    } catch (error) {
      console.error("❌ Failed to open browser:", error.message);
      console.log(`Please manually open: ${TEST_URL}`);
    }
  }, 3000);

  // Keep the script running
  console.log(
    "\n💡 Press Ctrl+C to stop the development server when testing is complete.\n"
  );

  // Don't exit immediately
  devServer.unref();
} catch (error) {
  console.error("❌ Error running the test:", error.message);
  process.exit(1);
}
