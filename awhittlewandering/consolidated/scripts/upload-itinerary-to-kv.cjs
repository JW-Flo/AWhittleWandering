#!/usr/bin/env node

/**
 * Upload 48 Continental USA Itinerary Data to Cloudflare KV
 * This script reads the .current_trip_day.json file and uploads it to the ITINERARY_KV namespace
 * using the namespace ID from wrangler.toml
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configuration
const DATA_FILE = path.join(__dirname, "..", ".current_trip_day.json");
const KEY_NAME = "current_day";
const NAMESPACE_ID = "41e8cca6911d47338647d950d2344d91"; // From wrangler.toml

// Check if data file exists
if (!fs.existsSync(DATA_FILE)) {
  console.error(`Error: Data file ${DATA_FILE} not found`);
  console.log(
    "Please run convert-itinerary-to-kv.cjs first to generate the data file"
  );
  process.exit(1);
}

try {
  // Read data file
  console.log(`Reading trip data from ${DATA_FILE}`);
  const tripData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

  // Create temporary directory if it doesn't exist
  const tempDir = path.join(__dirname, "..", ".temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  // Write trip data to temporary file
  const tempFile = path.join(tempDir, "current_day.json");
  fs.writeFileSync(tempFile, JSON.stringify(tripData, null, 2));

  // Upload to KV namespace using wrangler
  console.log(`Uploading current day data to namespace ID: ${NAMESPACE_ID}`);
  const command = `cd edge-worker && npx wrangler kv:key put --namespace-id=${NAMESPACE_ID} "${KEY_NAME}" --path="${tempFile.replace(
    /\\/g,
    "/"
  )}"`;

  console.log(`Executing: ${command}`);
  execSync(command, { stdio: "inherit" });

  console.log("Trip data uploaded successfully!");

  // Clean up temporary file
  fs.unlinkSync(tempFile);

  // Exit successfully
  process.exit(0);
} catch (error) {
  console.error("Error uploading trip data:", error);
  process.exit(1);
}
