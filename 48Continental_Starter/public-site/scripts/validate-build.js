#!/usr/bin/env node
/**
 * Build Validation Script
 *
 * This script runs all validation checks on the build output to ensure it's ready for production.
 * It orchestrates the execution of individual validation scripts:
 * - verify-mapbox-token.sh: Ensures the Mapbox token is correctly embedded
 * - check-bundle-size.sh: Verifies that JS/CSS bundles are within size limits
 * - validate-api-endpoints.sh: Checks that API endpoints are properly configured
 *
 * Usage: npm run build:validate
 */

/* eslint-disable no-console, no-process-exit */
import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Get directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SCRIPTS_DIR = __dirname;
const DIST_DIR = path.join(__dirname, "..", "dist");
const LOG_FILE = path.join(__dirname, "..", "validation-report.log");
const VALIDATION_SCRIPTS = [
  {
    name: "Mapbox Token Verification",
    script: "verify-mapbox-token.sh",
    required: true,
  },
  {
    name: "Bundle Size Check",
    script: "check-bundle-size.sh",
    required: false,
  },
  {
    name: "API Endpoints Validation",
    script: "validate-api-endpoints.sh",
    required: true,
  },
];

// Terminal colors
const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
};

// Helper functions
function logHeader(text) {
  console.log(
    `\n${COLORS.bright}${COLORS.blue}===========================================${COLORS.reset}`
  );
  console.log(`${COLORS.bright}${COLORS.blue}${text}${COLORS.reset}`);
  console.log(
    `${COLORS.bright}${COLORS.blue}===========================================${COLORS.reset}\n`
  );
}

function logSuccess(text) {
  console.log(`${COLORS.green}✓ ${text}${COLORS.reset}`);
}

function logError(text) {
  console.log(`${COLORS.red}✗ ${text}${COLORS.reset}`);
}

function logWarning(text) {
  console.log(`${COLORS.yellow}⚠ ${text}${COLORS.reset}`);
}

function runScript(scriptPath, required) {
  try {
    console.log(`Running: ${path.basename(scriptPath)}`);
    // Using a timeout to prevent hanging
    const output = execSync(`bash "${scriptPath}"`, {
      timeout: 60000, // 1 minute timeout
      stdio: "pipe",
    }).toString();

    console.log(output);
    return { success: true, output };
  } catch (error) {
    const errorOutput = error.stdout ? error.stdout.toString() : error.message;
    console.error(errorOutput);

    return {
      success: false,
      output: errorOutput,
      required,
    };
  }
}

// Main validation function
async function validateBuild() {
  logHeader("Starting Build Validation");

  // Verify that the dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    logError(
      `Build directory '${DIST_DIR}' not found. Run 'npm run build' first.`
    );
    process.exit(1);
  }

  // Initialize log file
  fs.writeFileSync(
    LOG_FILE,
    `Build Validation Report - ${new Date().toISOString()}\n\n`
  );

  // Track results
  const results = [];
  let criticalFailure = false;

  // Run each validation script
  for (const validation of VALIDATION_SCRIPTS) {
    logHeader(`Running ${validation.name}`);

    const scriptPath = path.join(SCRIPTS_DIR, validation.script);

    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
      logWarning(
        `Validation script '${validation.script}' not found. Skipping.`
      );
      fs.appendFileSync(
        LOG_FILE,
        `[WARNING] ${validation.name}: Script not found - ${scriptPath}\n`
      );
      continue;
    }

    // Make script executable (just in case)
    try {
      fs.chmodSync(scriptPath, "755");
    } catch (error) {
      logWarning(`Could not make script executable: ${error.message}`);
    }

    // Run the validation script
    const result = runScript(scriptPath, validation.required);
    results.push({ ...validation, ...result });

    // Log result to file
    fs.appendFileSync(
      LOG_FILE,
      `[${result.success ? "SUCCESS" : "FAILURE"}] ${validation.name}:\n`
    );
    fs.appendFileSync(LOG_FILE, result.output);
    fs.appendFileSync(LOG_FILE, "\n\n");

    // Track critical failures
    if (!result.success && validation.required) {
      criticalFailure = true;
    }
  }

  // Summarize results
  logHeader("Validation Summary");

  let passedCount = 0;
  let warningCount = 0;
  let failedCount = 0;

  results.forEach((result) => {
    if (result.success) {
      logSuccess(`${result.name} - Passed`);
      passedCount++;
    } else if (!result.required) {
      logWarning(`${result.name} - Warning (non-critical)`);
      warningCount++;
    } else {
      logError(`${result.name} - Failed (critical)`);
      failedCount++;
    }
  });

  // Final result
  console.log("\n");
  if (criticalFailure) {
    logError(
      `Build validation failed with ${failedCount} critical error(s) and ${warningCount} warning(s)`
    );
    logError(`See ${LOG_FILE} for detailed report`);
    logError("Please fix these issues before deployment");
    process.exit(1);
  } else if (warningCount > 0) {
    logWarning(
      `Build validation passed with ${warningCount} non-critical warning(s)`
    );
    logWarning(`See ${LOG_FILE} for detailed report`);
    logSuccess(
      "Build is ready for deployment, but consider addressing warnings"
    );
    process.exit(0);
  } else {
    logSuccess(`Build validation passed successfully (${passedCount} checks)`);
    logSuccess("Build is ready for deployment");
    process.exit(0);
  }
}

// Run validation
validateBuild().catch((error) => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});
