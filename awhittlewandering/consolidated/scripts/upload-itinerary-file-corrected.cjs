#!/usr/bin/env node

/**
 * Upload 48 Continental USA Itinerary to Cloudflare KV
 * This script uploads the itinerary.json file to the ITINERARY_KV namespace
 * using a simplified approach with temporary files
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Path to the JSON file (relative to project root)
const JSON_FILE = path.join(__dirname, "..", "itinerary.json");
// KV namespace name
const KV_NAMESPACE = "ITINERARY_KV";
// Key name for the itinerary in KV
const ITINERARY_KEY = "full_itinerary";

// Main function to upload itinerary to KV
async function uploadItineraryToKV() {
  try {
    // Read JSON file
    console.log(`📂 Reading itinerary from ${JSON_FILE}`);
    const itineraryData = fs.readFileSync(JSON_FILE, "utf8");

    // Write to a temporary file in the edge-worker directory
    const tempFilePath = path.join(
      __dirname,
      "..",
      "edge-worker",
      "itinerary-data.json"
    );
    fs.writeFileSync(tempFilePath, itineraryData);

    // Upload using the file reference command format
    console.log(
      `🚀 Uploading full itinerary to ${KV_NAMESPACE}:${ITINERARY_KEY}`
    );

    // Corrected command based on help output
    const uploadCommand = `cd edge-worker && npx wrangler kv key put "${ITINERARY_KEY}" --binding=${KV_NAMESPACE} --path=itinerary-data.json`;

    console.log(`Executing: ${uploadCommand}`);
    execSync(uploadCommand, { stdio: "inherit" });

    // Clean up temp file
    fs.unlinkSync(tempFilePath);
    console.log(`✅ Successfully uploaded itinerary to KV namespace`);
  } catch (error) {
    console.error("Error uploading itinerary to KV:", error);
    process.exit(1);
  }
}

// Execute the upload
uploadItineraryToKV();
