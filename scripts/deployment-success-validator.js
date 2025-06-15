#!/usr/bin/env node
/**
 * Deployment Success Validator
 * This script validates that a deployment meets all success criteria
 * for The Wandering Whittle project.
 *
 * Usage: node deployment-success-validator.js [url]
 */

const https = require("https");
const { execSync } = require("child_process");
const readline = require("readline");

// Configuration
const DEFAULT_TIMEOUT = 15000; // 15 seconds
const DEFAULT_SITE_URL = "https://wandering-whittle.pages.dev";
const DEFAULT_API_URL =
  "https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev";

// Colors for console output
const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};

// Check if we're running in a CI environment
const isCI = process.env.CI === "true";

// Parse command line arguments
const args = process.argv.slice(2);
const siteUrl = args[0] || DEFAULT_SITE_URL;
const apiUrl = args[1] || DEFAULT_API_URL;

// Create interactive interface if not in CI
const rl = !isCI
  ? readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
  : null;

// Result tracking
const results = {
  success: [],
  warnings: [],
  failures: [],
  total: 0,
  passed: 0,
  failed: 0,
  startTime: Date.now(),
};

/**
 * Logs a message with color
 */
function log(message, color = COLORS.white) {
  console.log(`${color}${message}${COLORS.reset}`);
}

/**
 * Performs an HTTP request and returns a promise
 */
function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
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
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.setTimeout(DEFAULT_TIMEOUT, () => {
      req.abort();
      reject(
        new Error(`Request to ${url} timed out after ${DEFAULT_TIMEOUT}ms`)
      );
    });

    req.end();
  });
}

/**
 * Reports a test result
 */
function reportResult(name, success, message, warning = false) {
  results.total++;

  if (success) {
    results.passed++;
    results.success.push({ name, message });
    log(`✅ PASS: ${name}${message ? ` - ${message}` : ""}`, COLORS.green);
  } else if (warning) {
    results.warnings.push({ name, message });
    log(`⚠️ WARNING: ${name}${message ? ` - ${message}` : ""}`, COLORS.yellow);
  } else {
    results.failed++;
    results.failures.push({ name, message });
    log(`❌ FAIL: ${name}${message ? ` - ${message}` : ""}`, COLORS.red);
  }
}

/**
 * Validates the frontend deployment
 */
async function validateFrontend() {
  log("\n📋 Validating Frontend Deployment...", COLORS.cyan);

  try {
    // Check if site is accessible
    const response = await httpRequest(siteUrl);
    reportResult(
      "Site Accessible",
      response.statusCode === 200,
      `Status code: ${response.statusCode}`
    );

    // Check if HTML content contains expected elements
    const hasTitle =
      response.data.includes("<title>The Wandering Whittle</title>") ||
      response.data.includes("<title>AWhittleWandering</title>");
    reportResult(
      "Page Title",
      hasTitle,
      hasTitle ? "Found correct title" : "Missing expected title"
    );

    const hasRootDiv = response.data.includes('<div id="root">');
    reportResult(
      "Root Element",
      hasRootDiv,
      hasRootDiv ? "Found root element" : "Missing root element"
    );

    const hasMapboxScript =
      response.data.includes("mapbox") || response.data.includes("mapboxgl");
    reportResult(
      "Mapbox Integration",
      hasMapboxScript,
      hasMapboxScript ? "Found Mapbox references" : "Missing Mapbox references"
    );

    const hasErrorReporter = response.data.includes("error-reporter.js");
    reportResult(
      "Error Reporter",
      hasErrorReporter,
      hasErrorReporter
        ? "Error reporting script found"
        : "Missing error reporting script"
    );
  } catch (error) {
    reportResult("Site Accessible", false, `Error: ${error.message}`);
  }
}

/**
 * Validates the API deployment
 */
async function validateAPI() {
  log("\n📡 Validating API Deployment...", COLORS.cyan);

  try {
    // Check API status endpoint
    const statusResponse = await httpRequest(`${apiUrl}/api/v1/status`);
    const statusOk = statusResponse.statusCode === 200;
    reportResult(
      "API Status",
      statusOk,
      `Status code: ${statusResponse.statusCode}`
    );

    try {
      // Parse JSON response
      const statusData = JSON.parse(statusResponse.data);
      const hasStatus = statusData && statusData.status;
      reportResult(
        "API Response Format",
        hasStatus,
        hasStatus ? "Valid response format" : "Invalid response format"
      );
    } catch (e) {
      reportResult("API Response Format", false, "Invalid JSON response");
    }

    // Check CORS headers
    const corsHeaders = statusResponse.headers["access-control-allow-origin"];
    const corsOk =
      corsHeaders === "*" || corsHeaders?.includes("wandering-whittle");
    reportResult(
      "CORS Headers",
      corsOk,
      corsOk ? "CORS properly configured" : "Missing or incorrect CORS headers"
    );
  } catch (error) {
    reportResult("API Status", false, `Error: ${error.message}`);
  }
}

/**
 * Validates environment variables in the frontend
 */
async function validateEnvironmentVariables() {
  log("\n🔑 Validating Environment Variables...", COLORS.cyan);

  try {
    const response = await httpRequest(siteUrl);

    // Check for Mapbox token
    const hasMapboxToken =
      response.data.includes("mapboxgl.accessToken") ||
      response.data.includes("mapboxToken");
    reportResult(
      "Mapbox Token",
      hasMapboxToken,
      hasMapboxToken ? "Mapbox token found" : "Mapbox token missing"
    );

    // Check for API references
    const hasApiUrl =
      response.data.includes("api") &&
      (response.data.includes("thewanderingwhittle") ||
        response.data.includes("awhittlewandering"));
    reportResult(
      "API URL Reference",
      hasApiUrl,
      hasApiUrl ? "API URL reference found" : "API URL reference missing",
      !hasApiUrl
    );
  } catch (error) {
    reportResult("Environment Variables", false, `Error: ${error.message}`);
  }
}

/**
 * Validates that branding has been updated throughout the site
 */
async function validateBranding() {
  log("\n🏷️ Validating Branding...", COLORS.cyan);

  try {
    const response = await httpRequest(siteUrl);

    // Check for old branding
    const hasOldBranding =
      response.data.includes("48Continental") ||
      response.data.includes("48 Continental");
    reportResult(
      "Branding Update",
      !hasOldBranding,
      hasOldBranding
        ? 'Old branding "48Continental" still present'
        : "No old branding found"
    );

    // Check for new branding
    const hasNewBranding =
      response.data.includes("Wandering Whittle") ||
      response.data.includes("WanderingWhittle") ||
      response.data.includes("AWhittleWandering");
    reportResult(
      "New Branding",
      hasNewBranding,
      hasNewBranding ? "New branding found" : "New branding missing"
    );
  } catch (error) {
    reportResult("Branding Validation", false, `Error: ${error.message}`);
  }
}

/**
 * Prints a summary of the validation results
 */
function printSummary() {
  const elapsedTime = ((Date.now() - results.startTime) / 1000).toFixed(2);

  log("\n📊 VALIDATION SUMMARY", COLORS.magenta);
  log("===================", COLORS.magenta);
  log(`🕒 Time: ${elapsedTime}s`, COLORS.white);
  log(`📋 Total Tests: ${results.total}`, COLORS.white);
  log(`✅ Passed: ${results.passed}`, COLORS.green);
  log(`⚠️ Warnings: ${results.warnings.length}`, COLORS.yellow);
  log(`❌ Failed: ${results.failed}`, COLORS.red);

  if (results.failures.length > 0) {
    log("\n❌ FAILED TESTS:", COLORS.red);
    results.failures.forEach((failure) => {
      log(`  - ${failure.name}: ${failure.message}`, COLORS.red);
    });
  }

  if (results.warnings.length > 0) {
    log("\n⚠️ WARNINGS:", COLORS.yellow);
    results.warnings.forEach((warning) => {
      log(`  - ${warning.name}: ${warning.message}`, COLORS.yellow);
    });
  }

  const passRate = Math.round((results.passed / results.total) * 100);
  log(`\n${COLORS.cyan}Pass Rate: ${passRate}%${COLORS.reset}`);

  // Overall assessment
  if (results.failed === 0) {
    log("\n✅ DEPLOYMENT VALIDATION SUCCESSFUL!", COLORS.green);
    if (results.warnings.length > 0) {
      log("   (with warnings that should be addressed)", COLORS.yellow);
    }
  } else {
    log("\n❌ DEPLOYMENT VALIDATION FAILED!", COLORS.red);
    log("   Please address the failed tests before proceeding.", COLORS.red);
  }
}

/**
 * Asks the user if they want to continue despite failures
 */
function askToContinue() {
  if (isCI || results.failed === 0) {
    process.exit(results.failed > 0 ? 1 : 0);
  }

  rl.question("\nContinue despite validation failures? (y/N) ", (answer) => {
    if (answer.toLowerCase() === "y") {
      log("Continuing despite validation failures...", COLORS.yellow);
      rl.close();
      process.exit(0);
    } else {
      log("Aborting deployment due to validation failures.", COLORS.red);
      rl.close();
      process.exit(1);
    }
  });
}

/**
 * Main validation function
 */
async function runValidation() {
  log("🔍 DEPLOYMENT VALIDATION", COLORS.blue);
  log("=====================", COLORS.blue);
  log(`📌 Site URL: ${siteUrl}`, COLORS.white);
  log(`📌 API URL: ${apiUrl}`, COLORS.white);

  await validateFrontend();
  await validateAPI();
  await validateEnvironmentVariables();
  await validateBranding();

  printSummary();

  if (!isCI) {
    if (results.failed > 0) {
      askToContinue();
    } else {
      rl.close();
    }
  } else {
    process.exit(results.failed > 0 ? 1 : 0);
  }
}

// Run the validation
runValidation().catch((error) => {
  log(`\n❌ VALIDATION ERROR: ${error.message}`, COLORS.red);
  if (!isCI && rl) {
    rl.close();
  }
  process.exit(1);
});
