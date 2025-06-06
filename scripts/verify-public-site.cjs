#!/usr/bin/env node
/**
 * Public Site Verification Script
 *
 * This script verifies that the public site can properly communicate
 * with the edge worker API and that environment variables are correctly configured.
 */

const https = require("https");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// ANSI colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

// Console logging helpers
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) =>
    console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
};

// Constants
const PUBLIC_SITE_URL = "https://main.continentalusa-site.pages.dev";
const EDGE_WORKER_URL =
  "https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev";
const ENV_FILE_PATH = path.resolve(
  __dirname,
  "../48Continental_Starter/public-site/.env.production"
);

// Function to make HTTPS requests
async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    https
      .get(url, options, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
          });
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

// Function to verify CORS configuration
async function verifyCors() {
  log.info("Verifying CORS configuration...");

  try {
    const options = {
      method: "OPTIONS",
      headers: {
        Origin: PUBLIC_SITE_URL,
        "Access-Control-Request-Method": "GET",
      },
    };

    const response = await makeRequest(
      `${EDGE_WORKER_URL}/api/v1/status`,
      options
    );

    if (
      response.headers["access-control-allow-origin"] === "*" ||
      response.headers["access-control-allow-origin"] === PUBLIC_SITE_URL
    ) {
      log.success("CORS is properly configured");
      return true;
    } else {
      log.error("CORS headers are missing or not properly configured");
      log.info("Headers received:");
      console.log(response.headers);
      return false;
    }
  } catch (error) {
    log.error(`Error verifying CORS: ${error.message}`);
    return false;
  }
}

// Function to verify API endpoints
async function verifyApiEndpoints() {
  log.info("Verifying API endpoints...");

  const endpoints = [
    "/test",
    "/api/v1/status",
    "/api/vehicle",
    "/api/trip",
    "/api/weather",
  ];

  let successCount = 0;

  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${EDGE_WORKER_URL}${endpoint}`);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        log.success(`Endpoint ${endpoint} is working (${response.statusCode})`);
        successCount++;
      } else {
        log.error(
          `Endpoint ${endpoint} returned status ${response.statusCode}`
        );
      }
    } catch (error) {
      log.error(`Error accessing endpoint ${endpoint}: ${error.message}`);
    }
  }

  log.info(`${successCount}/${endpoints.length} endpoints are working`);
  return successCount === endpoints.length;
}

// Function to verify environment variables
function verifyEnvironmentVariables() {
  log.info("Verifying environment variables...");

  try {
    const envContent = fs.readFileSync(ENV_FILE_PATH, "utf8");
    const envVars = envContent.split("\n").reduce((acc, line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match && !line.startsWith("#")) {
        acc[match[1]] = match[2];
      }
      return acc;
    }, {});

    const requiredVars = [
      "VITE_EDGE_WORKER_URL",
      "VITE_API_BASE_URL",
      "VITE_WEBSOCKET_ENDPOINT",
      "VITE_MAPBOX_TOKEN",
      "VITE_TESSIE_API_TOKEN",
      "VITE_TESSIE_VIN",
      "VITE_OPENWEATHER_API_KEY",
    ];

    let missingVars = [];

    for (const varName of requiredVars) {
      if (!envVars[varName]) {
        missingVars.push(varName);
      }
    }

    if (missingVars.length > 0) {
      log.error(
        `Missing required environment variables: ${missingVars.join(", ")}`
      );
      return false;
    }

    // Verify URLs match the expected pattern
    if (envVars["VITE_EDGE_WORKER_URL"] !== EDGE_WORKER_URL) {
      log.error(
        `VITE_EDGE_WORKER_URL does not match expected URL: ${EDGE_WORKER_URL}`
      );
      return false;
    }

    if (envVars["VITE_API_BASE_URL"] !== EDGE_WORKER_URL) {
      log.error(
        `VITE_API_BASE_URL does not match expected URL: ${EDGE_WORKER_URL}`
      );
      return false;
    }

    const expectedWsUrl = `wss://${new URL(EDGE_WORKER_URL).hostname}/ws`;
    if (envVars["VITE_WEBSOCKET_ENDPOINT"] !== expectedWsUrl) {
      log.warn(
        `VITE_WEBSOCKET_ENDPOINT (${envVars["VITE_WEBSOCKET_ENDPOINT"]}) may not match the expected pattern: ${expectedWsUrl}`
      );
    }

    log.success(
      "All required environment variables are present and properly configured"
    );
    return true;
  } catch (error) {
    log.error(`Error verifying environment variables: ${error.message}`);
    return false;
  }
}

// Function to check if the public site is accessible
async function verifyPublicSiteAccessibility() {
  log.info(`Verifying public site accessibility at ${PUBLIC_SITE_URL}...`);

  try {
    const response = await makeRequest(PUBLIC_SITE_URL);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      log.success(`Public site is accessible (${response.statusCode})`);
      return true;
    } else {
      log.error(`Public site returned status ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    log.error(`Error accessing public site: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  log.info("Starting public site verification...");

  const results = {
    publicSiteAccessible: await verifyPublicSiteAccessibility(),
    corsConfigured: await verifyCors(),
    apiEndpointsWorking: await verifyApiEndpoints(),
    environmentVariablesValid: verifyEnvironmentVariables(),
  };

  // Display results summary
  console.log("\n============================================");
  console.log("             VERIFICATION RESULTS            ");
  console.log("============================================");

  for (const [test, passed] of Object.entries(results)) {
    const symbol = passed ? "✅" : "❌";
    const color = passed ? colors.green : colors.red;
    const name = test.replace(/([A-Z])/g, " $1").toLowerCase();

    console.log(`${symbol} ${color}${name}${colors.reset}`);
  }

  console.log("============================================");

  const allPassed = Object.values(results).every((result) => result);

  if (allPassed) {
    log.success(
      "All checks passed! The public site is properly configured and can communicate with the edge worker API."
    );
  } else {
    log.error(
      "Some checks failed. Please review the errors above and fix the issues."
    );
  }

  return allPassed;
}

// Run the main function
main().catch((error) => {
  log.error(`Unexpected error: ${error.message}`);
  process.exit(1);
});
