#!/usr/bin/env node

/**
 * Upload 48 Continental USA Itinerary to Cloudflare KV
 * This script reads the itinerary.json file and uploads it to the ITINERARY_KV namespace
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
    const itinerary = JSON.parse(itineraryData);

    // Upload full itinerary
    console.log(
      `🚀 Uploading full itinerary to ${KV_NAMESPACE}:${ITINERARY_KEY}`
    );
    const uploadCommand = `cd edge-worker && npx wrangler kv:key put --binding=${KV_NAMESPACE} "${ITINERARY_KEY}" '${JSON.stringify(
      itinerary
    )}'`;

    console.log(`Executing: ${uploadCommand}`);
    execSync(uploadCommand, { stdio: "inherit" });

    // Upload individual stops with state codes as keys
    console.log(`🚀 Uploading individual stops by state`);
    const states = {};

    // Group stops by state
    itinerary.stops.forEach((stop) => {
      if (!states[stop.state]) {
        states[stop.state] = [];
      }
      states[stop.state].push(stop);
    });

    // Upload state groups
    for (const [state, stops] of Object.entries(states)) {
      const stateKey = `state_${state.toLowerCase()}`;
      console.log(
        `📍 Uploading ${stops.length} stops for ${state} as ${stateKey}`
      );

      const stateUploadCommand = `cd edge-worker && npx wrangler kv:key put --binding=${KV_NAMESPACE} "${stateKey}" '${JSON.stringify(
        stops
      )}'`;
      execSync(stateUploadCommand, { stdio: "inherit" });
    }

    console.log(`✅ Successfully uploaded itinerary to KV namespace`);
    console.log(
      `📊 Uploaded 1 full itinerary and ${
        Object.keys(states).length
      } state groups`
    );
  } catch (error) {
    console.error("Error uploading itinerary to KV:", error);
    process.exit(1);
  }
}

// Execute the upload
uploadItineraryToKV();
