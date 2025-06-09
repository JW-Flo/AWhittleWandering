#!/usr/bin/env node

/* eslint-disable */
/**
 * Test Vehicle Tracker
 *
 * This script starts the development server and opens the Vehicle Tracker
 * page in the browser to test the live vehicle tracking functionality.
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

// Configuration
const PORT = 3000;
const URL = `http://localhost:${PORT}/vehicle-tracker`;
const ENV_FILE_PATH = path.join(__dirname, ".env");

// ANSI colors for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

// Helper function to print a colored message
function print(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

// Helper function to print a section header
function printHeader(title) {
  console.log(
    "\n" + colors.bright + colors.blue + "=".repeat(80) + colors.reset
  );
  console.log(colors.bright + colors.blue + " " + title + colors.reset);
  console.log(
    colors.bright + colors.blue + "=".repeat(80) + colors.reset + "\n"
  );
}

// Check if .env file exists and if it contains VITE_MAPBOX_TOKEN
function checkEnvFile() {
  if (!fs.existsSync(ENV_FILE_PATH)) {
    print(
      colors.yellow,
      "Warning: .env file not found. Creating a sample .env file..."
    );

    fs.writeFileSync(
      ENV_FILE_PATH,
      "# Mapbox token (required for maps)\n" +
        "VITE_MAPBOX_TOKEN=\n\n" +
        "# Tessie API token (optional, for live data)\n" +
        "VITE_TESSIE_API_TOKEN=\n" +
        "VITE_TESSIE_BASE=https://api.tessie.com\n"
    );

    print(
      colors.yellow,
      `Please add your Mapbox token to ${ENV_FILE_PATH} before testing.`
    );
    return false;
  }

  const envContent = fs.readFileSync(ENV_FILE_PATH, "utf8");
  const mapboxToken = envContent.match(/VITE_MAPBOX_TOKEN=(.+)/);

  if (!mapboxToken || !mapboxToken[1]) {
    print(colors.yellow, `Warning: VITE_MAPBOX_TOKEN not found in .env file.`);
    print(
      colors.yellow,
      `Please add your Mapbox token to ${ENV_FILE_PATH} before testing.`
    );
    return false;
  }

  return true;
}

// Main function
async function main() {
  printHeader("Vehicle Tracker Test");

  // Check environment setup
  print(colors.cyan, "Checking environment setup...");
  const envReady = checkEnvFile();

  if (!envReady) {
    print(
      colors.yellow,
      "Environment setup needs attention. Please fix the issues above and run this script again."
    );
    process.exit(1);
  }

  print(colors.green, "Environment setup looks good!");

  // Instructions
  printHeader("Testing Instructions");
  print(
    colors.bright,
    "The Vehicle Tracker page will open in your default browser."
  );
  print(
    colors.bright,
    "It demonstrates the live vehicle tracking functionality using:"
  );
  print(colors.cyan, "• Real-time vehicle location on the map");
  print(colors.cyan, "• Vehicle data display (battery, speed, etc.)");
  print(colors.cyan, "• Mock data simulation for development");
  print(colors.cyan, "• WebSocket and polling options for live data");
  print(colors.cyan, "• Trip route display with stops");

  print(colors.bright, "\nTesting options:");
  print(
    colors.green,
    "1. Use the control panel to toggle between mock and live data"
  );
  print(
    colors.green,
    "2. Try changing the polling interval to see more frequent updates"
  );
  print(colors.green, "3. Toggle satellite view and other map layers");
  print(colors.green, "4. Test the fullscreen mode for better visibility");

  print(
    colors.yellow,
    "\nPress Ctrl+C in this terminal to stop the development server when done testing."
  );

  // Start the dev server and open the browser
  print(colors.magenta, "\nStarting development server and opening browser...");

  try {
    // Determine the open command based on the OS
    let openCommand;
    switch (os.platform()) {
      case "darwin": // macOS
        openCommand = "open";
        break;
      case "win32": // Windows
        openCommand = "start";
        break;
      default: // Linux and others
        openCommand = "xdg-open";
        break;
    }

    // Use npm to start the dev server
    execSync(`npx vite --port ${PORT}`, {
      stdio: "inherit",
      env: { ...process.env, BROWSER: "none" }, // Prevent Vite from opening the browser
    });

    // Open the browser ourselves after a short delay
    setTimeout(() => {
      try {
        execSync(`${openCommand} ${URL}`);
      } catch (err) {
        print(
          colors.yellow,
          `Unable to open browser automatically. Please open ${URL} manually.`
        );
      }
    }, 2000);
  } catch (err) {
    print(colors.red, "Error starting development server:");
    print(colors.red, err.message);
    process.exit(1);
  }
}

// Run the main function
main().catch((err) => {
  print(colors.red, "Unhandled error:");
  print(colors.red, err.message);
  process.exit(1);
});
