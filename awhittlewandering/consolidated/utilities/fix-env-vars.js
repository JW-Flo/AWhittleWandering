#!/usr/bin/env node

/**
 * 48 Continental Environment Variable Synchronization Utility
 *
 * This script fixes environment variable inconsistencies between the edge worker
 * and public site components of the 48 Continental USA road trip project.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Paths configuration
const PROJECT_ROOT = process.cwd();
const PUBLIC_SITE_DIR = path.join(
  PROJECT_ROOT,
  "48Continental_Starter",
  "public-site"
);
const EDGE_WORKER_DIR = path.join(PROJECT_ROOT, "edge-worker");
const ENV_FILES = {
  publicSiteLocal: path.join(PUBLIC_SITE_DIR, ".env.local"),
  publicSiteExample: path.join(PUBLIC_SITE_DIR, ".env.example"),
  edgeWorkerDev: path.join(EDGE_WORKER_DIR, ".dev.vars"),
};

// Mapping between public site and edge worker env variable names
const variableMapping = {
  VITE_TESSIE_API_TOKEN: "TESSIE_API_TOKEN",
  VITE_TESSIE_VIN: "TESSIE_VIN",
  VITE_MAPBOX_TOKEN: "MAPBOX_TOKEN",
  VITE_OPENWEATHER_API_KEY: "OPENWEATHER_API_KEY",
};

/**
 * Parse dotenv-style environment files
 */
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const result = {};

  content.split("\n").forEach((line) => {
    const line_trim = line.trim();
    if (!line_trim || line_trim.startsWith("#")) return;

    const keyValueMatch = line_trim.match(/^([^=]+)=(.*)$/);
    if (keyValueMatch) {
      const key = keyValueMatch[1].trim();
      let value = keyValueMatch[2].trim();

      // Remove quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.substr(1, value.length - 2);
      }

      result[key] = value;
    }
  });

  return result;
}

/**
 * Write environment variables to a file
 */
function writeEnvFile(filePath, envVars) {
  const content = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  fs.writeFileSync(filePath, content);
}

/**
 * Fix environment variable inconsistencies
 */
function fixEnvironmentIssues() {
  console.log("🔍 Analyzing environment variables...");

  // Read environment files
  const publicSiteEnv = parseEnvFile(ENV_FILES.publicSiteLocal);
  const edgeWorkerEnv = parseEnvFile(ENV_FILES.edgeWorkerDev);

  if (Object.keys(publicSiteEnv).length === 0) {
    console.error("❌ Public site environment file not found or empty");
    return;
  }

  if (Object.keys(edgeWorkerEnv).length === 0) {
    console.error("❌ Edge worker environment file not found or empty");
    return;
  }

  // Track changes
  const updates = {
    publicSite: [],
    edgeWorker: [],
  };

  // Create updated environment variables
  const updatedPublicSiteEnv = { ...publicSiteEnv };
  const updatedEdgeWorkerEnv = { ...edgeWorkerEnv };

  // 1. Fix token inconsistencies
  console.log("🔄 Checking API tokens consistency...");

  for (const [siteVar, workerVar] of Object.entries(variableMapping)) {
    if (
      publicSiteEnv[siteVar] &&
      edgeWorkerEnv[workerVar] &&
      publicSiteEnv[siteVar] !== edgeWorkerEnv[workerVar]
    ) {
      // Use the public site token as the source of truth
      updatedEdgeWorkerEnv[workerVar] = publicSiteEnv[siteVar];
      updates.edgeWorker.push(
        `${workerVar}: ${edgeWorkerEnv[workerVar]} → ${publicSiteEnv[siteVar]}`
      );
      console.log(
        `  ⚠️ Found inconsistent ${workerVar}, will synchronize from public site`
      );
    }
  }

  // 2. Fix endpoint URL inconsistencies
  console.log("🔄 Checking API endpoint consistency...");

  // Check if endpoints are local but websocket is deployed
  if (
    publicSiteEnv.VITE_EDGE_WORKER_URL === "http://localhost:8787" &&
    publicSiteEnv.VITE_WEBSOCKET_ENDPOINT &&
    publicSiteEnv.VITE_WEBSOCKET_ENDPOINT.includes("workers.dev")
  ) {
    // Align the edge worker URL with websocket URL
    const workerUrl = publicSiteEnv.VITE_WEBSOCKET_ENDPOINT.replace(
      "wss://",
      "https://"
    ).replace("/ws", "");

    updatedPublicSiteEnv.VITE_EDGE_WORKER_URL = workerUrl;
    updatedPublicSiteEnv.VITE_API_BASE_URL = workerUrl;

    updates.publicSite.push(
      `VITE_EDGE_WORKER_URL: ${publicSiteEnv.VITE_EDGE_WORKER_URL} → ${workerUrl}`
    );
    updates.publicSite.push(
      `VITE_API_BASE_URL: ${publicSiteEnv.VITE_API_BASE_URL} → ${workerUrl}`
    );

    console.log(
      `  ⚠️ Found local URLs with deployed websocket, will synchronize to: ${workerUrl}`
    );
  }

  // Ensure API_BASE_URL matches EDGE_WORKER_URL if both exist
  if (
    publicSiteEnv.VITE_EDGE_WORKER_URL &&
    publicSiteEnv.VITE_API_BASE_URL &&
    publicSiteEnv.VITE_EDGE_WORKER_URL !== publicSiteEnv.VITE_API_BASE_URL
  ) {
    updatedPublicSiteEnv.VITE_API_BASE_URL = publicSiteEnv.VITE_EDGE_WORKER_URL;
    updates.publicSite.push(
      `VITE_API_BASE_URL: ${publicSiteEnv.VITE_API_BASE_URL} → ${publicSiteEnv.VITE_EDGE_WORKER_URL}`
    );

    console.log(
      `  ⚠️ Found inconsistent API_BASE_URL, will synchronize with EDGE_WORKER_URL`
    );
  }

  // Apply changes if needed
  if (updates.publicSite.length > 0) {
    console.log("✍️ Updating public site environment variables...");
    try {
      writeEnvFile(ENV_FILES.publicSiteLocal, updatedPublicSiteEnv);
      console.log("  ✅ Public site environment updated successfully");
      updates.publicSite.forEach((update) => console.log(`  - ${update}`));
    } catch (error) {
      console.error(
        `  ❌ Failed to update public site environment: ${error.message}`
      );
    }
  } else {
    console.log("  ✅ Public site environment is consistent");
  }

  if (updates.edgeWorker.length > 0) {
    console.log("✍️ Updating edge worker environment variables...");
    try {
      writeEnvFile(ENV_FILES.edgeWorkerDev, updatedEdgeWorkerEnv);
      console.log("  ✅ Edge worker environment updated successfully");
      updates.edgeWorker.forEach((update) => console.log(`  - ${update}`));
    } catch (error) {
      console.error(
        `  ❌ Failed to update edge worker environment: ${error.message}`
      );
    }
  } else {
    console.log("  ✅ Edge worker environment is consistent");
  }

  console.log("🔍 Checking for missing critical environment variables...");
  const missingVars = [];

  // Check for essential variables
  if (!updatedPublicSiteEnv.VITE_TESSIE_API_TOKEN) {
    missingVars.push("VITE_TESSIE_API_TOKEN in public site");
  }

  if (!updatedEdgeWorkerEnv.TESSIE_API_TOKEN) {
    missingVars.push("TESSIE_API_TOKEN in edge worker");
  }

  if (!updatedPublicSiteEnv.VITE_MAPBOX_TOKEN) {
    missingVars.push("VITE_MAPBOX_TOKEN in public site");
  }

  if (missingVars.length > 0) {
    console.log("⚠️ Missing essential environment variables:");
    missingVars.forEach((v) => console.log(`  - ${v}`));
  } else {
    console.log("  ✅ All essential variables are present");
  }

  return {
    publicSiteUpdated: updates.publicSite.length > 0,
    edgeWorkerUpdated: updates.edgeWorker.length > 0,
    updates,
  };
}

// Run the script
try {
  console.log("🚀 Starting 48 Continental environment variable sync utility");
  const result = fixEnvironmentIssues();

  if (result.publicSiteUpdated || result.edgeWorkerUpdated) {
    console.log("🎉 Environment variables have been synchronized successfully");
  } else {
    console.log("👍 Environment variables are already consistent");
  }
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
}
