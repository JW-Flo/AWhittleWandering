#!/usr/bin/env node

/**
 * Map Error Handling Test Script
 *
 * This script helps verify the robust error handling capabilities of the
 * enhanced map components by simulating various error conditions.
 */

const fs = require("fs");
const path = require("path");
const http = require("http");
const { exec } = require("child_process");
const readline = require("readline");

// Configuration
const PORT = 3500;
const TEMP_ENV_PATH = path.join(__dirname, ".env.test-error");
const REAL_ENV_PATH = path.join(__dirname, ".env");
const MAPBOX_TOKEN_KEY = "VITE_MAPBOX_TOKEN";

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// ANSI color codes for terminal output
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

/**
 * Backup the current .env file
 */
function backupEnvFile() {
  if (fs.existsSync(REAL_ENV_PATH)) {
    console.log(`${colors.cyan}Backing up current .env file...${colors.reset}`);
    fs.copyFileSync(REAL_ENV_PATH, `${REAL_ENV_PATH}.backup`);
  }
}

/**
 * Restore the original .env file
 */
function restoreEnvFile() {
  if (fs.existsSync(`${REAL_ENV_PATH}.backup`)) {
    console.log(`${colors.cyan}Restoring original .env file...${colors.reset}`);
    fs.copyFileSync(`${REAL_ENV_PATH}.backup`, REAL_ENV_PATH);
    fs.unlinkSync(`${REAL_ENV_PATH}.backup`);
  }
}

/**
 * Create a test .env file with a specified Mapbox token
 */
function createTestEnvFile(mapboxToken) {
  let envContent = "";

  // If original .env exists, read its content first
  if (fs.existsSync(REAL_ENV_PATH)) {
    envContent = fs.readFileSync(REAL_ENV_PATH, "utf8");

    // Replace or add the Mapbox token
    if (envContent.includes(`${MAPBOX_TOKEN_KEY}=`)) {
      envContent = envContent.replace(
        new RegExp(`${MAPBOX_TOKEN_KEY}=.*`),
        `${MAPBOX_TOKEN_KEY}=${mapboxToken}`
      );
    } else {
      envContent += `\n${MAPBOX_TOKEN_KEY}=${mapboxToken}`;
    }
  } else {
    // Create a minimal .env file with just the token
    envContent = `${MAPBOX_TOKEN_KEY}=${mapboxToken}`;
  }

  fs.writeFileSync(REAL_ENV_PATH, envContent);
  console.log(
    `${colors.green}Created test .env with token: ${mapboxToken}${colors.reset}`
  );
}

/**
 * Print help menu
 */
function printHelp() {
  console.log(`
${colors.bright}Map Error Handling Test Script${colors.reset}

This script helps test the error handling capabilities of the enhanced map components.

${colors.bright}Available commands:${colors.reset}

  ${colors.yellow}1${colors.reset} - Test with valid Mapbox token (normal operation)
  ${colors.yellow}2${colors.reset} - Test with invalid Mapbox token (should trigger token error)
  ${colors.yellow}3${colors.reset} - Test with empty Mapbox token (should trigger missing token error)
  ${colors.yellow}4${colors.reset} - Launch the application with current settings
  ${colors.yellow}5${colors.reset} - Open the map error test page directly
  ${colors.yellow}r${colors.reset} - Restore original environment and exit
  ${colors.yellow}h${colors.reset} - Display this help menu
  ${colors.yellow}q${colors.reset} - Quit

The application will open in your default browser after selecting options 1-5.
`);
}

/**
 * Launch the development server
 */
function launchDevServer(openPath = "/") {
  console.log(`${colors.cyan}Starting development server...${colors.reset}`);

  const serverProcess = exec("npm run dev", { cwd: __dirname });

  serverProcess.stdout.on("data", (data) => {
    if (data.includes("Local:")) {
      // Extract the local URL
      const match = data.match(/Local:\s+(http:\/\/localhost:\d+)/);
      if (match && match[1]) {
        const url = `${match[1]}${openPath}`;
        console.log(`${colors.green}Opening browser at: ${url}${colors.reset}`);
        exec(`open ${url}`);
      }
    }
  });

  serverProcess.stderr.on("data", (data) => {
    console.error(`${colors.red}Server error: ${data}${colors.reset}`);
  });

  return serverProcess;
}

/**
 * Process user command
 */
function processCommand(cmd) {
  switch (cmd.toLowerCase()) {
    case "1":
      backupEnvFile();
      // Use a valid Mapbox token (this is just a placeholder, it won't actually work)
      createTestEnvFile(
        "pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJmNXlwY2IycGdtMnFva2liaTA4enIwIn0.tU9_tLaaxXxhfcVX4WhOeA"
      );
      return launchDevServer();

    case "2":
      backupEnvFile();
      // Use an invalid token format
      createTestEnvFile("invalid.token.that.will.cause.errors");
      return launchDevServer("/map-error-test");

    case "3":
      backupEnvFile();
      // Use an empty token
      createTestEnvFile("");
      return launchDevServer("/map-error-test");

    case "4":
      // Launch with current settings
      return launchDevServer();

    case "5":
      // Open the map error test page directly
      return launchDevServer("/map-error-test");

    case "r":
      restoreEnvFile();
      console.log(
        `${colors.green}Environment restored. Exiting...${colors.reset}`
      );
      rl.close();
      process.exit(0);
      break;

    case "h":
      printHelp();
      break;

    case "q":
      restoreEnvFile();
      console.log(`${colors.green}Exiting...${colors.reset}`);
      rl.close();
      process.exit(0);
      break;

    default:
      console.log(`${colors.red}Unknown command: ${cmd}${colors.reset}`);
      printHelp();
  }

  return null;
}

/**
 * Main execution
 */
function main() {
  console.log(
    `${colors.bright}${colors.cyan}48 Continental Map Error Handling Test${colors.reset}\n`
  );
  printHelp();

  let currentProcess = null;

  rl.on("line", (input) => {
    // Kill any running process
    if (currentProcess) {
      console.log(`${colors.yellow}Stopping current process...${colors.reset}`);
      currentProcess.kill();
      currentProcess = null;
    }

    // Process the command
    currentProcess = processCommand(input);
  });

  // Handle script termination
  process.on("SIGINT", () => {
    console.log(`${colors.yellow}\nCleaning up and exiting...${colors.reset}`);
    if (currentProcess) {
      currentProcess.kill();
    }
    restoreEnvFile();
    rl.close();
    process.exit(0);
  });
}

// Run the script
main();
