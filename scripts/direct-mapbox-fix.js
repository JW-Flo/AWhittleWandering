#!/usr/bin/env node
/**
 * Direct Map Token Fix Script
 *
 * This script directly updates the Mapbox token in environment files
 * without relying on the MCP server infrastructure.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// Define file paths
const publicSiteEnvLocal = path.join(
  projectRoot,
  "48Continental_Starter",
  "public-site",
  ".env.local"
);
const publicSiteEnv = path.join(
  projectRoot,
  "48Continental_Starter",
  "public-site",
  ".env"
);
const publicSiteEnvProduction = path.join(
  projectRoot,
  "48Continental_Starter",
  "public-site",
  ".env.production"
);

// The token to use (this is the token from the .env.production file)
const MAPBOX_TOKEN =
  "pk.eyJ1IjoidGhld2FuZGVyaW5nd2hpdHRsZSIsImEiOiJjbHQxaXhzejYwYmU2MmpxdHl0MHowN3UzIn0.Q7xKTRlXvtimBHd39JqN1A";

/**
 * Updates or adds a Mapbox token to an environment file
 */
function updateMapboxToken(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, "utf8");
    let updated = false;

    // Check if VITE_MAPBOX_TOKEN exists and update it
    if (content.includes("VITE_MAPBOX_TOKEN=")) {
      const newContent = content.replace(
        /VITE_MAPBOX_TOKEN=.*/g,
        `VITE_MAPBOX_TOKEN=${MAPBOX_TOKEN}`
      );

      if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, "utf8");
        updated = true;
      }
    } else {
      // Add the token if it doesn't exist
      content += `\nVITE_MAPBOX_TOKEN=${MAPBOX_TOKEN}\n`;
      fs.writeFileSync(filePath, content, "utf8");
      updated = true;
    }

    if (updated) {
      console.log(`✅ Updated Mapbox token in ${path.basename(filePath)}`);
      return true;
    } else {
      console.log(`ℹ️ No changes needed in ${path.basename(filePath)}`);
      return false;
    }
  } catch (error) {
    console.error(
      `❌ Error updating ${path.basename(filePath)}:`,
      error.message
    );
    return false;
  }
}

console.log("🗺️ Starting MapBox token fix...");

// Update all environment files
const results = [
  updateMapboxToken(publicSiteEnvLocal),
  updateMapboxToken(publicSiteEnv),
  updateMapboxToken(publicSiteEnvProduction),
];

if (results.some((result) => result)) {
  console.log("\n✅ MapBox token has been updated in at least one file.");
  console.log(
    "🌐 The map should now render correctly. Please restart your application if it's running."
  );
} else {
  console.log("\n⚠️ No changes were made to any files.");
}
