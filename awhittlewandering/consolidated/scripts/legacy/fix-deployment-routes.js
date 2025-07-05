#!/usr/bin/env node

/**
 * 48 Continental USA - Deployment Route Fix Script
 *
 * This script fixes common route configuration issues with Cloudflare Workers and Pages deployments.
 * It addresses:
 * 1. Workers.dev domain access (404 errors)
 * 2. Custom domain access (403 errors)
 * 3. Route configuration for API endpoints
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Configuration
const EDGE_WORKER_DIR = path.join(__dirname, "..", "edge-worker");
const WRANGLER_CONFIG = path.join(EDGE_WORKER_DIR, "wrangler.toml");

// Utility functions
function log(message) {
  console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
}

function executeCommand(command, options = {}) {
  try {
    const output = execSync(command, {
      encoding: "utf8",
      stdio: "pipe",
      ...options,
    });
    return { success: true, output };
  } catch (error) {
    return {
      success: false,
      output: error.stdout || "",
      error: error.stderr || error.message,
    };
  }
}

function updateWranglerConfig() {
  log("Checking wrangler.toml configuration...");

  if (!fs.existsSync(WRANGLER_CONFIG)) {
    log("❌ wrangler.toml not found!");
    return false;
  }

  let config = fs.readFileSync(WRANGLER_CONFIG, "utf8");
  let updated = false;

  // Check if workers.dev is enabled
  if (!config.includes("workers_dev")) {
    log("Adding workers_dev = true to configuration");

    // Find the position after the main = "src/index.ts" line
    const mainLineEnd =
      config.indexOf('main = "src/index.ts"') + 'main = "src/index.ts"'.length;

    // Insert workers_dev = true after that line
    config =
      config.slice(0, mainLineEnd) +
      "\nworkers_dev = true" +
      config.slice(mainLineEnd);
    updated = true;
  } else if (config.includes("workers_dev = false")) {
    log("Enabling workers_dev in configuration");
    config = config.replace("workers_dev = false", "workers_dev = true");
    updated = true;
  }

  // Fix custom domain route configuration
  if (config.includes('pattern = "trip.thewanderingwhittle.com"')) {
    // Ensure the custom domain route is correctly configured
    if (!config.includes('zone_name = "thewanderingwhittle.com"')) {
      log("Adding zone_name to custom domain configuration");

      // Replace the custom domain route section
      const routePattern =
        /\[\[routes\]\]\s*pattern\s*=\s*"trip\.thewanderingwhittle\.com"\s*custom_domain\s*=\s*true/;
      const replacementRoute = `[[routes]]
pattern = "trip.thewanderingwhittle.com"
custom_domain = true
zone_name = "thewanderingwhittle.com"`;

      config = config.replace(routePattern, replacementRoute);
      updated = true;
    }
  }

  // Write the updated configuration
  if (updated) {
    log("Writing updated wrangler.toml");
    fs.writeFileSync(WRANGLER_CONFIG, config);
    return true;
  } else {
    log("No changes needed for wrangler.toml");
    return false;
  }
}

function verifyWhoami() {
  log("Checking Cloudflare authentication...");

  const result = executeCommand("npx wrangler whoami", {
    cwd: EDGE_WORKER_DIR,
  });
  if (!result.success) {
    log("❌ Failed to verify Cloudflare authentication");
    log("Please run: npx wrangler login");
    return false;
  }

  log("✅ Authenticated with Cloudflare");
  log(result.output);
  return true;
}

function deployWorker() {
  log("Deploying worker with updated configuration...");

  // Build the worker first
  const buildResult = executeCommand("npm run build", { cwd: EDGE_WORKER_DIR });
  if (!buildResult.success) {
    log("❌ Failed to build worker");
    log(buildResult.error);
    return false;
  }

  // Deploy the worker
  const deployResult = executeCommand("npx wrangler deploy", {
    cwd: EDGE_WORKER_DIR,
  });
  if (!deployResult.success) {
    log("❌ Failed to deploy worker");
    log(deployResult.error);
    return false;
  }

  log("✅ Worker deployed successfully");
  return true;
}

function testEndpoints() {
  log("Testing API endpoints...");

  // Get the workers.dev domain from whoami
  const whoamiResult = executeCommand("npx wrangler whoami", {
    cwd: EDGE_WORKER_DIR,
  });
  const accountNameMatch = whoamiResult.output.match(
    /([\w.-]+@[\w.-]+\.\w+)'s Account/
  );
  const accountName = accountNameMatch
    ? accountNameMatch[1].replace("@", "")
    : "kd8jc7v8cd";
  const sanitizedAccountName = accountName.replace(/[@.]/g, "");

  const workersDomain = `https://thewanderingwhittle-edge.${sanitizedAccountName}.workers.dev`;
  const customDomain = "https://trip.thewanderingwhittle.com";

  log(`Testing workers.dev domain: ${workersDomain}`);
  const testEndpointResult = executeCommand(`curl -s "${workersDomain}/test"`);

  if (
    testEndpointResult.success &&
    testEndpointResult.output.includes('"status":"ok"')
  ) {
    log("✅ Workers.dev domain is accessible");
  } else {
    log("❌ Workers.dev domain test failed");
  }

  log(`Testing custom domain: ${customDomain}`);
  const customDomainResult = executeCommand(`curl -s "${customDomain}/test"`);

  if (
    customDomainResult.success &&
    customDomainResult.output.includes('"status":"ok"')
  ) {
    log("✅ Custom domain is accessible");
  } else {
    log("❌ Custom domain test failed");
    log(
      "This might require DNS propagation time or Cloudflare dashboard configuration"
    );
  }

  return true;
}

function setKVPermissions() {
  log("Setting KV namespace permissions...");

  // List KV namespaces to verify access
  const listResult = executeCommand("npx wrangler kv namespace list", {
    cwd: EDGE_WORKER_DIR,
  });
  if (!listResult.success) {
    log("❌ Failed to list KV namespaces");
    log(listResult.error);
    return false;
  }

  log("✅ KV namespace access verified");
  return true;
}

// Main function
async function main() {
  console.log("==============================================");
  console.log("     48 CONTINENTAL USA ROUTE FIX");
  console.log("==============================================");
  console.log(`Started: ${new Date().toLocaleString()}`);
  console.log("==============================================\n");

  // Check authentication
  if (!verifyWhoami()) {
    return;
  }

  // Update wrangler configuration
  const configUpdated = updateWranglerConfig();

  // Set KV permissions
  setKVPermissions();

  // Deploy worker (if config was updated or forced)
  if (configUpdated) {
    deployWorker();
  }

  // Test endpoints
  testEndpoints();

  console.log("\n==============================================");
  console.log("Route fixes completed");
  console.log("==============================================\n");

  console.log("Next steps:");
  console.log("1. Check the Cloudflare dashboard for custom domain settings");
  console.log("2. Verify DNS settings for trip.thewanderingwhittle.com");
  console.log("3. Run ./scripts/monitor-deployment.sh to verify all endpoints");
  console.log("4. If issues persist, contact Cloudflare support");
}

// Run the script
main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
