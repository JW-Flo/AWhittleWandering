#!/usr/bin/env node
/**
 * 48 Continental USA Deployment Fix Script
 *
 * This script automates fixes for common deployment issues:
 * - Updates Cloudflare worker settings
 * - Fixes CORS configuration
 * - Verifies custom domain setup
 * - Checks KV namespace access
 * - Generates new HMAC keys if needed
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { promisify } = require("util");
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// ANSI colors for terminal output
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const RESET = "\x1b[0m";

// Paths
const EDGE_WORKER_DIR = path.join(__dirname, "..", "edge-worker");
const WRANGLER_CONFIG = path.join(EDGE_WORKER_DIR, "wrangler.toml");
const DEV_VARS = path.join(EDGE_WORKER_DIR, ".dev.vars");
const INDEX_TS = path.join(EDGE_WORKER_DIR, "src", "index.ts");

// Header banner
console.log(`${BLUE}==============================================${RESET}`);
console.log(`${BLUE}     48 CONTINENTAL USA DEPLOYMENT FIX      ${RESET}`);
console.log(`${BLUE}==============================================${RESET}`);
console.log(`Started: ${new Date().toLocaleString()}`);
console.log(`${BLUE}==============================================${RESET}\n`);

/**
 * Execute shell command and return output
 */
function runCommand(command, options = {}) {
  console.log(`${YELLOW}Running: ${command}${RESET}`);
  try {
    const output = execSync(command, {
      encoding: "utf8",
      stdio: options.silent ? "pipe" : "inherit",
      ...options,
    });
    return { success: true, output };
  } catch (error) {
    if (!options.ignoreError) {
      console.error(`${RED}Command failed: ${error.message}${RESET}`);
    }
    return { success: false, error };
  }
}

/**
 * Generate a secure HMAC key
 */
function generateHmacKey(length = 32) {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Check if custom domain is properly configured
 */
async function checkCustomDomain() {
  console.log(`\n${BLUE}Checking custom domain configuration...${RESET}`);

  try {
    const wranglerContent = await readFile(WRANGLER_CONFIG, "utf8");

    if (!wranglerContent.includes("custom_domain = true")) {
      console.log(
        `${YELLOW}Custom domain not properly configured in wrangler.toml${RESET}`
      );

      let updatedContent = wranglerContent;
      if (!wranglerContent.includes("[[routes]]")) {
        updatedContent += `
# Custom domain settings
[[routes]]
pattern = "trip.thewanderingwhittle.com"
custom_domain = true`;
      } else if (!wranglerContent.includes("custom_domain = true")) {
        updatedContent = wranglerContent.replace(
          /\[\[routes\]\]\s*pattern\s*=\s*"trip\.thewanderingwhittle\.com"/,
          '[[routes]]\npattern = "trip.thewanderingwhittle.com"\ncustom_domain = true'
        );
      }

      await writeFile(WRANGLER_CONFIG, updatedContent);
      console.log(
        `${GREEN}Updated custom domain configuration in wrangler.toml${RESET}`
      );
    } else {
      console.log(
        `${GREEN}Custom domain properly configured in wrangler.toml${RESET}`
      );
    }
  } catch (error) {
    console.error(
      `${RED}Error checking custom domain: ${error.message}${RESET}`
    );
  }
}

/**
 * Fix CORS configuration in index.ts
 */
async function fixCorsSecurity() {
  console.log(`\n${BLUE}Fixing CORS and security configuration...${RESET}`);

  try {
    const indexContent = await readFile(INDEX_TS, "utf8");

    // Check if CORS headers are properly set
    if (!indexContent.includes("Access-Control-Allow-Origin")) {
      console.log(`${YELLOW}CORS headers not found, adding them...${RESET}`);
      // Too complex to implement in this script - would require proper parsing
      console.log(
        `${YELLOW}Please manually add CORS headers to ${INDEX_TS}${RESET}`
      );
    } else {
      console.log(`${GREEN}CORS headers found in index.ts${RESET}`);
    }

    // Check for proper OPTIONS handling
    if (!indexContent.includes("request.method === 'OPTIONS'")) {
      console.log(
        `${YELLOW}OPTIONS handling not found, should be added for CORS preflight${RESET}`
      );
      console.log(
        `${YELLOW}Please manually add OPTIONS handling to ${INDEX_TS}${RESET}`
      );
    } else {
      console.log(`${GREEN}OPTIONS handling found in index.ts${RESET}`);
    }

    // Add test endpoint if not present
    if (
      !indexContent.includes("/api/v1/status") &&
      !indexContent.includes("/test")
    ) {
      console.log(`${YELLOW}Test endpoint not found, adding one...${RESET}`);

      // Find a good place to insert the test endpoint
      const insertPoint = indexContent.indexOf("export default {");
      if (insertPoint !== -1) {
        const beforeInsert = indexContent.substring(0, insertPoint);
        const afterInsert = indexContent.substring(insertPoint);

        const testEndpointCode = `
// Test endpoint for connectivity verification
function handleTestEndpoint() {
  return new Response(JSON.stringify({
    status: "ok",
    version: "1.0.0",
    time: new Date().toISOString(),
    environment: "production"
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-signature"
    }
  });
}

`;

        const updatedContent = beforeInsert + testEndpointCode + afterInsert;
        await writeFile(INDEX_TS, updatedContent);
        console.log(`${GREEN}Added test endpoint function to index.ts${RESET}`);

        // Now add the route handler
        // This is a simplistic approach - in a real scenario you'd want to use proper TS parsing
        console.log(
          `${YELLOW}Please manually add the test endpoint route in the fetch handler:${RESET}`
        );
        console.log(`
if (url.pathname === "/test" || url.pathname === "/api/v1/status") {
  return handleTestEndpoint();
}
`);
      } else {
        console.log(
          `${RED}Could not find insertion point for test endpoint${RESET}`
        );
      }
    } else {
      console.log(`${GREEN}Test endpoint found in index.ts${RESET}`);
    }
  } catch (error) {
    console.error(`${RED}Error fixing CORS: ${error.message}${RESET}`);
  }
}

/**
 * Update environment variables
 */
async function updateEnvironmentVars() {
  console.log(`\n${BLUE}Checking environment variables...${RESET}`);

  try {
    // Check .dev.vars file
    let devVarsContent = "";
    try {
      devVarsContent = await readFile(DEV_VARS, "utf8");
    } catch (error) {
      console.log(`${YELLOW}.dev.vars file not found, creating it...${RESET}`);
      devVarsContent = "";
    }

    // Check for EDGE_HMAC_KEY
    if (!devVarsContent.includes("EDGE_HMAC_KEY=")) {
      console.log(
        `${YELLOW}EDGE_HMAC_KEY not found, generating a new one...${RESET}`
      );
      const newKey = generateHmacKey();
      devVarsContent += `\nEDGE_HMAC_KEY="${newKey}"\n`;

      // Also update wrangler.toml
      const wranglerContent = await readFile(WRANGLER_CONFIG, "utf8");

      let updatedWranglerContent = wranglerContent;
      if (wranglerContent.includes("EDGE_HMAC_KEY =")) {
        updatedWranglerContent = wranglerContent.replace(
          /EDGE_HMAC_KEY = ".*"/,
          `EDGE_HMAC_KEY = "${newKey}"`
        );
      } else {
        // Add it in the [vars] section or create that section
        if (wranglerContent.includes("[vars]")) {
          updatedWranglerContent = wranglerContent.replace(
            /\[vars\]/,
            `[vars]\nEDGE_HMAC_KEY = "${newKey}"`
          );
        } else {
          updatedWranglerContent =
            wranglerContent + `\n[vars]\nEDGE_HMAC_KEY = "${newKey}"\n`;
        }
      }

      await writeFile(WRANGLER_CONFIG, updatedWranglerContent);
      console.log(`${GREEN}Updated EDGE_HMAC_KEY in wrangler.toml${RESET}`);
    } else {
      console.log(`${GREEN}EDGE_HMAC_KEY found in .dev.vars${RESET}`);
    }

    // Check for WEATHER_API_KEY
    if (!devVarsContent.includes("WEATHER_API_KEY=")) {
      console.log(
        `${YELLOW}WEATHER_API_KEY not found, adding placeholder...${RESET}`
      );
      devVarsContent += `\nWEATHER_API_KEY="YOUR_WEATHER_API_KEY_HERE"\n`;
    }

    // Check for TESSIE_API_TOKEN
    if (!devVarsContent.includes("TESSIE_API_TOKEN=")) {
      console.log(
        `${YELLOW}TESSIE_API_TOKEN not found, adding placeholder...${RESET}`
      );
      devVarsContent += `\nTESSIE_API_TOKEN="YOUR_TESSIE_API_TOKEN_HERE"\n`;
    }

    // Check for TESSIE_VIN
    if (!devVarsContent.includes("TESSIE_VIN=")) {
      console.log(
        `${YELLOW}TESSIE_VIN not found, adding placeholder...${RESET}`
      );
      devVarsContent += `\nTESSIE_VIN="YOUR_TESLA_VIN_HERE"\n`;
    }

    // Write updated .dev.vars
    await writeFile(DEV_VARS, devVarsContent);
    console.log(`${GREEN}Updated .dev.vars file${RESET}`);
  } catch (error) {
    console.error(
      `${RED}Error updating environment variables: ${error.message}${RESET}`
    );
  }
}

/**
 * Verify KV namespace access
 */
async function verifyKvAccess() {
  console.log(`\n${BLUE}Verifying KV namespace access...${RESET}`);

  try {
    // Check wrangler.toml for KV bindings
    const wranglerContent = await readFile(WRANGLER_CONFIG, "utf8");

    // Check for APP_KV
    if (!wranglerContent.includes('binding = "APP_KV"')) {
      console.log(`${YELLOW}APP_KV binding not found in wrangler.toml${RESET}`);
      console.log(
        `${YELLOW}Please make sure your KV namespaces are properly configured${RESET}`
      );
    } else {
      console.log(`${GREEN}APP_KV binding found in wrangler.toml${RESET}`);

      // Test KV access via wrangler
      console.log(`${YELLOW}Testing KV access...${RESET}`);
      const result = runCommand("npx wrangler kv:key list APP_KV --limit 1", {
        cwd: EDGE_WORKER_DIR,
        silent: true,
        ignoreError: true,
      });

      if (result.success) {
        console.log(`${GREEN}Successfully accessed APP_KV namespace${RESET}`);
      } else {
        console.log(`${RED}Failed to access APP_KV namespace${RESET}`);
        console.log(
          `${YELLOW}Ensure you're logged in to Cloudflare (run 'npx wrangler login')${RESET}`
        );
      }
    }
  } catch (error) {
    console.error(`${RED}Error verifying KV access: ${error.message}${RESET}`);
  }
}

/**
 * Deploy updated worker
 */
async function deployWorker() {
  console.log(`\n${BLUE}Deploying updated worker...${RESET}`);

  try {
    // Build the worker
    console.log(`${YELLOW}Building worker...${RESET}`);
    const buildResult = runCommand("npm run build", { cwd: EDGE_WORKER_DIR });

    if (!buildResult.success) {
      console.log(`${RED}Failed to build worker${RESET}`);
      return;
    }

    // Deploy the worker
    console.log(`${YELLOW}Deploying worker...${RESET}`);
    const deployResult = runCommand("npx wrangler deploy", {
      cwd: EDGE_WORKER_DIR,
    });

    if (deployResult.success) {
      console.log(`${GREEN}Worker deployed successfully${RESET}`);
    } else {
      console.log(`${RED}Failed to deploy worker${RESET}`);
    }
  } catch (error) {
    console.error(`${RED}Error deploying worker: ${error.message}${RESET}`);
  }
}

/**
 * Test API endpoints
 */
async function testEndpoints() {
  console.log(`\n${BLUE}Testing API endpoints...${RESET}`);

  const endpoints = [
    "https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev/test",
    "https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev/api/v1/status",
    "https://trip.thewanderingwhittle.com/test",
    "https://trip.thewanderingwhittle.com/api/v1/status",
  ];

  for (const endpoint of endpoints) {
    console.log(`${YELLOW}Testing ${endpoint}...${RESET}`);
    const result = runCommand(`curl -s "${endpoint}"`, {
      silent: true,
      ignoreError: true,
    });

    if (result.success) {
      console.log(`${GREEN}Success: ${endpoint}${RESET}`);
    } else {
      console.log(`${RED}Failed: ${endpoint}${RESET}`);
    }
  }
}

/**
 * Main function to run all fixes
 */
async function main() {
  try {
    // Check current directory
    const currentDir = process.cwd();
    console.log(`Current directory: ${currentDir}`);

    // Run all fix functions
    await checkCustomDomain();
    await fixCorsSecurity();
    await updateEnvironmentVars();
    await verifyKvAccess();
    await deployWorker();
    await testEndpoints();

    console.log(
      `\n${BLUE}==============================================${RESET}`
    );
    console.log(`${GREEN}Deployment fixes completed${RESET}`);
    console.log(
      `${BLUE}==============================================${RESET}`
    );
    console.log(`\nNext steps:`);
    console.log(
      `1. Run './scripts/verify-deployment.sh' to verify all endpoints`
    );
    console.log(`2. Check the Cloudflare dashboard for any remaining issues`);
    console.log(
      `3. Verify the site is accessible at https://trip.thewanderingwhittle.com`
    );
  } catch (error) {
    console.error(`${RED}Unexpected error: ${error.message}${RESET}`);
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error(`${RED}Fatal error: ${error.message}${RESET}`);
  process.exit(1);
});
