#!/usr/bin/env node

/**
 * Upload Itinerary Data to Cloudflare KV Namespace
 * Using the proper wrangler syntax for working with KV
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configuration
const DATA_FILE = path.join(__dirname, "..", ".current_trip_day.json");
const KV_NAMESPACE = "ITINERARY_KV";
const KEY_NAME = "current_day";

// Check if the data file exists
if (!fs.existsSync(DATA_FILE)) {
  console.error(`Error: Data file ${DATA_FILE} not found`);
  console.log(
    "Please run convert-itinerary-to-kv.cjs first to generate the data file"
  );
  process.exit(1);
}

try {
  // Read the data file
  console.log(`Reading trip data from ${DATA_FILE}...`);
  const tripData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

  // Create a temporary file
  const tempDir = path.join(__dirname, "..", ".temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const tempFile = path.join(tempDir, "current_day.json");
  fs.writeFileSync(tempFile, JSON.stringify(tripData, null, 2));

  // Get the namespace ID first
  console.log("Retrieving KV namespace ID...");
  const getNamespaceCommand = `cd edge-worker && npx wrangler kv:namespace list`;
  console.log(`Executing: ${getNamespaceCommand}`);

  const namespaceOutput = execSync(getNamespaceCommand, { encoding: "utf8" });
  console.log("Namespace list output:", namespaceOutput);

  // Parse the output to find the namespace ID
  const namespaceMatch = namespaceOutput.match(
    new RegExp(`${KV_NAMESPACE}[\\s\\S]*?([a-f0-9-]{36})`)
  );

  if (!namespaceMatch || !namespaceMatch[1]) {
    throw new Error(`Could not find namespace ID for ${KV_NAMESPACE}`);
  }

  const namespaceId = namespaceMatch[1];
  console.log(`Found namespace ID: ${namespaceId}`);

  // Upload the data using the namespace ID
  console.log(`Uploading data to KV namespace ${KV_NAMESPACE}...`);
  const uploadCommand = `cd edge-worker && npx wrangler kv:key put --namespace-id=${namespaceId} "${KEY_NAME}" --path="${tempFile.replace(
    /\\/g,
    "/"
  )}"`;
  console.log(`Executing: ${uploadCommand}`);

  execSync(uploadCommand, { stdio: "inherit" });
  console.log("Trip data uploaded successfully!");

  // Clean up temporary file
  fs.unlinkSync(tempFile);

  process.exit(0);
} catch (error) {
  console.error("Error uploading trip data:", error);
  process.exit(1);
}
