#!/usr/bin/env node
/**
 * 48 Continental USA - Cloudflare Diagnostic Script
 *
 * This script provides detailed diagnostics for Cloudflare-related
 * configuration and services. It checks account access, service
 * status, and common configuration issues.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const https = require("https");

// ANSI colors
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";

// Project paths
const EDGE_WORKER_DIR = path.join(__dirname, "..", "edge-worker");
const WRANGLER_CONFIG = path.join(EDGE_WORKER_DIR, "wrangler.toml");

// Header
console.log(
  `${BLUE}==================================================${RESET}`
);
console.log(
  `${BLUE}      CLOUDFLARE CONFIGURATION DIAGNOSTICS         ${RESET}`
);
console.log(
  `${BLUE}==================================================${RESET}`
);
console.log(`Run time: ${new Date().toLocaleString()}`);
console.log(
  `${BLUE}==================================================${RESET}\n`
);

/**
 * Execute a command and return its output
 */
function runCommand(command, options = {}) {
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
 * Check Cloudflare login status
 */
async function checkCloudflareLogin() {
  console.log(`${CYAN}Checking Cloudflare authentication status...${RESET}`);

  const result = runCommand("npx wrangler whoami", {
    cwd: EDGE_WORKER_DIR,
    silent: true,
    ignoreError: true,
  });

  if (result.success && result.output.includes("You are logged in")) {
    console.log(`${GREEN}✓ Authenticated with Cloudflare${RESET}`);

    // Extract account info
    const accountMatch = result.output.match(/Account:\s+([^\n]+)/);
    const accountName = accountMatch ? accountMatch[1].trim() : "Unknown";

    const accountIdMatch = result.output.match(/Account ID:\s+([^\n]+)/);
    const accountId = accountIdMatch ? accountIdMatch[1].trim() : "Unknown";

    console.log(`${GREEN}✓ Account: ${accountName}${RESET}`);
    console.log(`${GREEN}✓ Account ID: ${accountId}${RESET}`);

    return true;
  } else {
    console.log(`${RED}✗ Not authenticated with Cloudflare${RESET}`);
    console.log(
      `${YELLOW}Run 'cd edge-worker && npx wrangler login' to authenticate${RESET}`
    );
    return false;
  }
}

/**
 * Check wrangler.toml configuration
 */
async function checkWranglerConfig() {
  console.log(`\n${CYAN}Checking wrangler.toml configuration...${RESET}`);

  try {
    if (!fs.existsSync(WRANGLER_CONFIG)) {
      console.log(
        `${RED}✗ wrangler.toml not found at ${WRANGLER_CONFIG}${RESET}`
      );
      return false;
    }

    const content = fs.readFileSync(WRANGLER_CONFIG, "utf8");
    console.log(`${GREEN}✓ wrangler.toml found${RESET}`);

    // Check essential configurations
    const checks = [
      { pattern: /name\s*=\s*"[^"]*"/, name: "Worker name", required: true },
      {
        pattern: /account_id\s*=\s*"[^"]*"/,
        name: "Account ID",
        required: true,
      },
      {
        pattern: /main\s*=\s*"[^"]*"/,
        name: "Main entry point",
        required: true,
      },
      {
        pattern: /\[\[kv_namespaces\]\]/,
        name: "KV namespaces",
        required: true,
      },
      {
        pattern: /binding\s*=\s*"APP_KV"/,
        name: "APP_KV binding",
        required: true,
      },
      { pattern: /\[\[routes\]\]/, name: "Routes", required: false },
      {
        pattern: /custom_domain\s*=\s*true/,
        name: "Custom domain",
        required: false,
      },
    ];

    let missingRequired = false;

    for (const check of checks) {
      if (content.match(check.pattern)) {
        console.log(`${GREEN}✓ ${check.name} configured${RESET}`);
      } else {
        if (check.required) {
          console.log(
            `${RED}✗ ${check.name} not configured (REQUIRED)${RESET}`
          );
          missingRequired = true;
        } else {
          console.log(
            `${YELLOW}⚠ ${check.name} not configured (OPTIONAL)${RESET}`
          );
        }
      }
    }

    // Extract and display worker name
    const nameMatch = content.match(/name\s*=\s*"([^"]*)"/);
    if (nameMatch) {
      const workerName = nameMatch[1];
      console.log(`${GREEN}✓ Worker name: ${workerName}${RESET}`);
    }

    // Check custom domain
    const customDomainMatch = content.match(/pattern\s*=\s*"([^"]*)"/);
    if (customDomainMatch) {
      const customDomain = customDomainMatch[1];
      console.log(`${GREEN}✓ Custom domain: ${customDomain}${RESET}`);
    }

    return !missingRequired;
  } catch (error) {
    console.log(
      `${RED}✗ Error reading wrangler.toml: ${error.message}${RESET}`
    );
    return false;
  }
}

/**
 * Check Cloudflare KV access
 */
async function checkKVAccess() {
  console.log(`\n${CYAN}Checking KV namespace access...${RESET}`);

  const result = runCommand("npx wrangler kv:namespace list", {
    cwd: EDGE_WORKER_DIR,
    silent: true,
    ignoreError: true,
  });

  if (result.success) {
    console.log(`${GREEN}✓ KV namespaces accessible${RESET}`);

    try {
      // Parse the JSON output
      const namespaces = JSON.parse(result.output);
      console.log(
        `${GREEN}✓ Found ${namespaces.length} KV namespace(s)${RESET}`
      );

      // Display namespace info
      namespaces.forEach((ns) => {
        console.log(`${GREEN}  - ${ns.title} (ID: ${ns.id})${RESET}`);
      });

      // Check if we have our required namespaces
      const hasAppKV = namespaces.some((ns) => ns.title.includes("APP_KV"));
      if (hasAppKV) {
        console.log(`${GREEN}✓ APP_KV namespace found${RESET}`);
      } else {
        console.log(`${YELLOW}⚠ APP_KV namespace not found${RESET}`);
      }

      return true;
    } catch (error) {
      console.log(
        `${YELLOW}⚠ Could not parse KV namespace list: ${error.message}${RESET}`
      );
      console.log(`${YELLOW}Raw output: ${result.output}${RESET}`);
      return false;
    }
  } else {
    console.log(`${RED}✗ Failed to list KV namespaces${RESET}`);
    console.log(`${YELLOW}Possible issues:${RESET}`);
    console.log(`${YELLOW}1. Not authenticated with Cloudflare${RESET}`);
    console.log(`${YELLOW}2. No permission to access KV namespaces${RESET}`);
    console.log(`${YELLOW}3. Wrangler not installed correctly${RESET}`);
    return false;
  }
}

/**
 * Check Cloudflare DNS settings
 */
async function checkDNSSettings() {
  console.log(`\n${CYAN}Checking custom domain DNS settings...${RESET}`);

  // This requires API keys, so we'll use a public DNS lookup instead
  console.log(
    `${YELLOW}Using public DNS lookup for trip.thewanderingwhittle.com${RESET}`
  );

  try {
    const dns = require("dns").promises;
    const records = await dns.resolve4("trip.thewanderingwhittle.com");

    if (records && records.length > 0) {
      console.log(
        `${GREEN}✓ DNS records found for trip.thewanderingwhittle.com${RESET}`
      );
      console.log(`${GREEN}  IP addresses: ${records.join(", ")}${RESET}`);
    } else {
      console.log(
        `${RED}✗ No DNS records found for trip.thewanderingwhittle.com${RESET}`
      );
    }
  } catch (error) {
    console.log(`${RED}✗ DNS lookup failed: ${error.message}${RESET}`);
    console.log(`${YELLOW}This may indicate DNS configuration issues${RESET}`);
  }

  // Check CNAME record
  try {
    const dns = require("dns").promises;
    const records = await dns
      .resolveCname("trip.thewanderingwhittle.com")
      .catch(() => []);

    if (records && records.length > 0) {
      console.log(
        `${GREEN}✓ CNAME records found: ${records.join(", ")}${RESET}`
      );

      // Check if it points to Cloudflare
      const pointsToCloudflare = records.some((r) => r.includes("cloudflare"));
      if (pointsToCloudflare) {
        console.log(`${GREEN}✓ CNAME correctly points to Cloudflare${RESET}`);
      } else {
        console.log(
          `${YELLOW}⚠ CNAME does not appear to point to Cloudflare${RESET}`
        );
      }
    } else {
      console.log(`${YELLOW}⚠ No CNAME records found${RESET}`);
    }
  } catch (error) {
    // This will happen if it's not a CNAME
    console.log(`${YELLOW}⚠ No CNAME records found or error in lookup${RESET}`);
  }
}

/**
 * Check deployed Worker status
 */
async function checkWorkerStatus() {
  console.log(`\n${CYAN}Checking deployed Worker status...${RESET}`);

  // Test with basic HTTP request
  function httpGet(url) {
    return new Promise((resolve, reject) => {
      const req = https
        .get(url, (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: data,
            });
          });
        })
        .on("error", (err) => {
          reject(err);
        });

      // Set a timeout
      req.setTimeout(5000, () => {
        req.abort();
        reject(new Error("Request timeout"));
      });
    });
  }

  try {
    console.log(`${YELLOW}Testing worker.dev domain...${RESET}`);
    const devResponse = await httpGet(
      "https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev/test"
    );

    if (devResponse.statusCode >= 200 && devResponse.statusCode < 400) {
      console.log(
        `${GREEN}✓ Worker.dev domain is accessible (HTTP ${devResponse.statusCode})${RESET}`
      );

      try {
        // Try to parse as JSON
        const data = JSON.parse(devResponse.body);
        console.log(`${GREEN}✓ Worker returns valid JSON response${RESET}`);
        console.log(`${GREEN}  Status: ${data.status || "unknown"}${RESET}`);
        console.log(`${GREEN}  Version: ${data.version || "unknown"}${RESET}`);
      } catch (e) {
        console.log(`${YELLOW}⚠ Worker response is not valid JSON${RESET}`);
      }
    } else {
      console.log(
        `${RED}✗ Worker.dev domain returned error (HTTP ${devResponse.statusCode})${RESET}`
      );
    }
  } catch (error) {
    console.log(
      `${RED}✗ Worker.dev domain test failed: ${error.message}${RESET}`
    );
  }

  try {
    console.log(`\n${YELLOW}Testing custom domain...${RESET}`);
    const customResponse = await httpGet(
      "https://trip.thewanderingwhittle.com/test"
    );

    if (customResponse.statusCode >= 200 && customResponse.statusCode < 400) {
      console.log(
        `${GREEN}✓ Custom domain is accessible (HTTP ${customResponse.statusCode})${RESET}`
      );
    } else {
      console.log(
        `${RED}✗ Custom domain returned error (HTTP ${customResponse.statusCode})${RESET}`
      );
    }
  } catch (error) {
    console.log(`${RED}✗ Custom domain test failed: ${error.message}${RESET}`);
  }
}

/**
 * Display summary and recommendations
 */
function displaySummary(results) {
  console.log(
    `\n${BLUE}==================================================${RESET}`
  );
  console.log(
    `${BLUE}               DIAGNOSTIC SUMMARY                 ${RESET}`
  );
  console.log(
    `${BLUE}==================================================${RESET}`
  );

  let allGood = true;

  for (const [test, passed] of Object.entries(results)) {
    if (passed) {
      console.log(`${GREEN}✓ ${test}: PASSED${RESET}`);
    } else {
      console.log(`${RED}✗ ${test}: FAILED${RESET}`);
      allGood = false;
    }
  }

  console.log(
    `\n${BLUE}==================================================${RESET}`
  );

  if (allGood) {
    console.log(`${GREEN}All diagnostics passed successfully!${RESET}`);
    console.log(
      `${GREEN}Your Cloudflare configuration appears to be correct.${RESET}`
    );
  } else {
    console.log(`${YELLOW}Some diagnostics failed. Recommendations:${RESET}`);

    if (!results.cloudflareLogin) {
      console.log(`${YELLOW}1. Authenticate with Cloudflare:${RESET}`);
      console.log(`   cd edge-worker && npx wrangler login`);
    }

    if (!results.wranglerConfig) {
      console.log(`${YELLOW}2. Fix wrangler.toml configuration:${RESET}`);
      console.log(`   Review and update ${WRANGLER_CONFIG}`);
    }

    if (!results.kvAccess) {
      console.log(`${YELLOW}3. Check KV namespace access:${RESET}`);
      console.log(
        `   Ensure you have the right permissions for the KV namespaces`
      );
    }

    console.log(
      `\n${YELLOW}Run the deployment fix script to resolve issues:${RESET}`
    );
    console.log(`   ./scripts/fix-deployment.cjs`);
  }

  console.log(
    `${BLUE}==================================================${RESET}`
  );
}

/**
 * Main function
 */
async function main() {
  try {
    const results = {
      cloudflareLogin: await checkCloudflareLogin(),
      wranglerConfig: await checkWranglerConfig(),
      kvAccess: await checkKVAccess(),
    };

    await checkDNSSettings();
    await checkWorkerStatus();

    displaySummary(results);
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
