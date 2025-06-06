#!/usr/bin/env node

/**
 * Upload 48 Continental USA Itinerary Data to Cloudflare KV (Remote Version)
 * This script reads the .current_trip_day.json file and uploads it to the ITINERARY_KV namespace
 * with the --remote flag to ensure data is uploaded to the production environment
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configuration
const DATA_FILE = path.join(__dirname, "..", ".current_trip_day.json");
const KV_NAMESPACE = "ITINERARY_KV";
const KEY_NAME = "current_day";

// ANSI color codes for prettier output
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";

// Check if data file exists
if (!fs.existsSync(DATA_FILE)) {
  console.error(`${RED}Error: Data file ${DATA_FILE} not found${RESET}`);
  console.log(
    `${YELLOW}Please run convert-itinerary-to-kv.cjs first to generate the data file${RESET}`
  );
  process.exit(1);
}

try {
  // Read data file
  console.log(`${YELLOW}Reading trip data from ${DATA_FILE}${RESET}`);
  const tripData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

  // Create temporary directory if it doesn't exist
  const tempDir = path.join(__dirname, "..", ".temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  // Write trip data to temporary file
  const tempFile = path.join(tempDir, "current_day.json");
  fs.writeFileSync(tempFile, JSON.stringify(tripData, null, 2));

  // Upload to KV namespace using wrangler with the --remote flag
  console.log(
    `${YELLOW}Uploading current day data to ${KV_NAMESPACE} (REMOTE)${RESET}`
  );
  const command = `cd edge-worker && npx wrangler kv key put "${KEY_NAME}" --binding=${KV_NAMESPACE} --path="${tempFile.replace(
    /\\/g,
    "/"
  )}" --remote`;

  console.log(`${YELLOW}Executing: ${command}${RESET}`);
  execSync(command, { stdio: "inherit" });

  console.log(
    `${GREEN}Trip data uploaded successfully to remote KV namespace!${RESET}`
  );

  // Clean up temporary file
  fs.unlinkSync(tempFile);

  // Exit successfully
  process.exit(0);
} catch (error) {
  console.error(`${RED}Error uploading trip data:${RESET}`, error);
  process.exit(1);
}
