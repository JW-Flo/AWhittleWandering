#!/usr/bin/env node
/**
 * Itinerary CSV to KV Namespace Converter & Uploader
 *
 * This script converts the 48 Continental USA itinerary CSV file to JSON format
 * and uploads it to the Cloudflare KV namespace for use by the edge worker.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const csv = require("csv-parser");

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
const CSV_FILE_PATH = path.resolve(
  __dirname,
  "../docs/Full_60-Day_Itinerary__June_6___August_4_.csv"
);
const JSON_OUTPUT_PATH = path.resolve(__dirname, "../itinerary.json");
const EDGE_WORKER_DIR = path.resolve(__dirname, "../edge-worker");
const KV_NAMESPACE = "ITINERARY_KV";

// Function to check if a package is installed
function isPackageInstalled(packageName) {
  try {
    require.resolve(packageName);
    return true;
  } catch (err) {
    return false;
  }
}

// Function to install required packages
function installRequiredPackages() {
  log.info("Checking required packages...");

  if (!isPackageInstalled("csv-parser")) {
    log.info("Installing csv-parser package...");
    try {
      execSync("npm install csv-parser", { stdio: "inherit" });
      log.success("csv-parser installed successfully");
    } catch (error) {
      log.error(`Failed to install csv-parser: ${error.message}`);
      process.exit(1);
    }
  }
}

// Function to convert CSV to JSON
function convertCsvToJson() {
  log.info(`Converting CSV file: ${CSV_FILE_PATH}`);

  return new Promise((resolve, reject) => {
    if (!fs.existsSync(CSV_FILE_PATH)) {
      reject(new Error(`CSV file not found: ${CSV_FILE_PATH}`));
      return;
    }

    const results = [];

    fs.createReadStream(CSV_FILE_PATH)
      .pipe(csv())
      .on("data", (data) => {
        // Clean up data and convert types
        const cleanedData = {};

        for (const [key, value] of Object.entries(data)) {
          // Convert empty strings to null
          const cleanedValue = value === "" ? null : value;

          // Convert numeric strings to numbers
          const numericValue =
            !isNaN(cleanedValue) && cleanedValue !== null
              ? parseFloat(cleanedValue)
              : cleanedValue;

          // Handle boolean values
          let finalValue;
          if (numericValue === "true" || numericValue === "TRUE")
            finalValue = true;
          else if (numericValue === "false" || numericValue === "FALSE")
            finalValue = false;
          else finalValue = numericValue;

          // Use camelCase keys for consistency
          const camelCaseKey = key
            .replace(/(?:^|_)(.)/g, (_, c) => c.toUpperCase())
            .replace(/^(.)/, (c) => c.toLowerCase());

          cleanedData[camelCaseKey] = finalValue;
        }

        // Add coordinates as a GeoJSON Point if lat/lon are available
        if (cleanedData.latitude && cleanedData.longitude) {
          cleanedData.coordinates = {
            type: "Point",
            coordinates: [
              parseFloat(cleanedData.longitude),
              parseFloat(cleanedData.latitude),
            ],
          };
        }

        results.push(cleanedData);
      })
      .on("end", () => {
        // Create a structured itinerary object
        const itinerary = {
          meta: {
            version: "1.0.0",
            generatedAt: new Date().toISOString(),
            totalStops: results.length,
            title: "48 Continental USA Road Trip",
            description: "Tesla road trip through all 48 contiguous US states",
          },
          stops: results,
        };

        // Write JSON to file
        fs.writeFileSync(JSON_OUTPUT_PATH, JSON.stringify(itinerary, null, 2));

        log.success(
          `Converted ${results.length} itinerary stops to JSON format`
        );
        log.success(`JSON file saved to: ${JSON_OUTPUT_PATH}`);

        resolve(itinerary);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

// Function to upload JSON to KV namespace
async function uploadToKvNamespace(data) {
  log.info(`Uploading itinerary data to KV namespace: ${KV_NAMESPACE}`);

  try {
    // Check if we're in the edge-worker directory
    if (!fs.existsSync(path.join(EDGE_WORKER_DIR, "wrangler.toml"))) {
      log.error(`wrangler.toml not found in ${EDGE_WORKER_DIR}`);
      return false;
    }

    // First, make sure the KV namespace exists
    try {
      log.info("Checking if KV namespace exists...");
      execSync(`cd ${EDGE_WORKER_DIR} && npx wrangler kv:namespace list`, {
        stdio: "pipe",
      });
    } catch (error) {
      log.warn("Error checking KV namespaces, may need to create it");
    }

    // Upload the full itinerary
    log.info("Uploading full itinerary...");
    const itineraryJson = JSON.stringify(data);
    const tempFilePath = path.join(__dirname, "temp-itinerary.json");
    fs.writeFileSync(tempFilePath, itineraryJson);

    execSync(
      `cd ${EDGE_WORKER_DIR} && npx wrangler kv:key put --binding=${KV_NAMESPACE} "itinerary" "${tempFilePath}" --path`,
      { stdio: "inherit" }
    );

    // Upload individual stops
    log.info("Uploading individual stops...");
    data.stops.forEach((stop, index) => {
      const stopKey = `stop_${index + 1}`;
      const stopJson = JSON.stringify(stop);
      const tempStopPath = path.join(__dirname, `temp-stop-${index}.json`);
      fs.writeFileSync(tempStopPath, stopJson);

      try {
        execSync(
          `cd ${EDGE_WORKER_DIR} && npx wrangler kv:key put --binding=${KV_NAMESPACE} "${stopKey}" "${tempStopPath}" --path`,
          { stdio: "pipe" }
        );
        fs.unlinkSync(tempStopPath);
      } catch (error) {
        log.error(`Failed to upload stop ${index + 1}: ${error.message}`);
      }
    });

    // Clean up temp files
    fs.unlinkSync(tempFilePath);

    log.success("Itinerary data uploaded to KV namespace successfully");
    return true;
  } catch (error) {
    log.error(`Failed to upload data to KV namespace: ${error.message}`);
    return false;
  }
}

// Function to verify data in KV namespace
async function verifyKvNamespaceData() {
  log.info(`Verifying data in KV namespace: ${KV_NAMESPACE}`);

  try {
    // Check if the main itinerary key exists
    const keyListCommand = `cd ${EDGE_WORKER_DIR} && npx wrangler kv:key list --binding=${KV_NAMESPACE} --prefix="itinerary"`;
    const keyListResult = execSync(keyListCommand, { encoding: "utf8" });

    if (keyListResult.includes("itinerary")) {
      log.success("Main itinerary key found in KV namespace");

      // Get a sample stop to verify
      const sampleStopCommand = `cd ${EDGE_WORKER_DIR} && npx wrangler kv:key get --binding=${KV_NAMESPACE} "stop_1"`;
      try {
        const sampleStopResult = execSync(sampleStopCommand, {
          encoding: "utf8",
        });
        log.success("Successfully retrieved sample stop from KV namespace");
        log.info("Sample stop data:");
        console.log(sampleStopResult.substring(0, 200) + "...");
        return true;
      } catch (error) {
        log.error(`Failed to retrieve sample stop: ${error.message}`);
        return false;
      }
    } else {
      log.error("Main itinerary key not found in KV namespace");
      return false;
    }
  } catch (error) {
    log.error(`Failed to verify data in KV namespace: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  log.info("Starting itinerary CSV to KV conversion and upload...");

  try {
    // Install required packages
    installRequiredPackages();

    // Convert CSV to JSON
    const itineraryData = await convertCsvToJson();

    // Upload to KV namespace
    const uploadSuccess = await uploadToKvNamespace(itineraryData);

    if (uploadSuccess) {
      // Verify the upload
      const verifySuccess = await verifyKvNamespaceData();

      if (verifySuccess) {
        log.success(
          "Itinerary data successfully converted, uploaded, and verified!"
        );
      } else {
        log.warn("Itinerary data uploaded but verification failed.");
      }
    }

    log.info("Process completed.");
  } catch (error) {
    log.error(`Failed to process itinerary: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    log.error(`Unexpected error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  convertCsvToJson,
  uploadToKvNamespace,
  verifyKvNamespaceData,
};
