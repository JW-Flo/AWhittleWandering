#!/usr/bin/env node
/* eslint-disable */
/**
 * Enhanced Vehicle Tracker Test Script
 *
 * This script runs a development server and opens the enhanced vehicle tracker
 * test page in the default browser.
 *
 * Usage:
 *   node test-enhanced-vehicle-tracker.cjs
 */

const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

console.log(
  `${colors.bright}${colors.cyan}=== Testing Enhanced Vehicle Tracker ====${colors.reset}\n`
);

// Function to check if Mapbox token is available
const checkMapboxToken = () => {
  try {
    const envPath = path.join(__dirname, ".env");
    if (!fs.existsSync(envPath)) {
      console.log(`${colors.yellow}Warning: No .env file found${colors.reset}`);
      return false;
    }

    const envContent = fs.readFileSync(envPath, "utf8");
    const hasMapboxToken =
      envContent.includes("VITE_MAPBOX_TOKEN=") &&
      !envContent.includes("VITE_MAPBOX_TOKEN=undefined") &&
      !envContent.includes("VITE_MAPBOX_TOKEN=");

    if (!hasMapboxToken) {
      console.log(
        `${colors.yellow}Warning: VITE_MAPBOX_TOKEN not found in .env file${colors.reset}`
      );
      console.log(
        `${colors.yellow}Map component requires a Mapbox token to function properly${colors.reset}`
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      `${colors.red}Error checking Mapbox token:${colors.reset}`,
      error
    );
    return false;
  }
};

// Check Mapbox token
const hasMapboxToken = checkMapboxToken();
if (!hasMapboxToken) {
  console.log(
    `${colors.yellow}You can set up a Mapbox token by running:${colors.reset}`
  );
  console.log(`${colors.cyan}node setup-mapbox-token.cjs${colors.reset}\n`);
}

// Start the development server and open the browser
console.log(`${colors.green}Starting development server...${colors.reset}`);
console.log(
  `${colors.cyan}The enhanced vehicle tracker will open in your browser${colors.reset}`
);
console.log(
  `${colors.cyan}(If it doesn't open automatically, navigate to http://localhost:5173/enhanced-vehicle-tracker)${colors.reset}\n`
);

// Set path to npm
const npmPath = process.platform === "win32" ? "npm.cmd" : "npm";

// Run development server with specific start URL
exec(
  `${npmPath} run dev -- --open /enhanced-vehicle-tracker`,
  {
    cwd: __dirname,
  },
  (error, stdout, stderr) => {
    if (error) {
      console.error(
        `${colors.red}Error starting development server:${colors.reset}`,
        error
      );
      console.error(stderr);
      return;
    }

    console.log(stdout);
  }
);

console.log(
  `${colors.yellow}Press Ctrl+C to stop the server when finished${colors.reset}`
);
