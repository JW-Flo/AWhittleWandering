#!/usr/bin/env node

/* eslint-disable no-console */

import { promises as fs } from "fs";
import https from "https";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables
const ENV_PATH = join(__dirname, "../.env");
let CLOUDFLARE_API_TOKEN;
let ZONE_ID;
let ACCOUNT_ID;

async function loadConfig() {
  try {
    const env = await fs.readFile(ENV_PATH, "utf8");
    const config = Object.fromEntries(
      env
        .split("\n")
        .filter((line) => line && !line.startsWith("#"))
        .map((line) => line.split("="))
    );

    CLOUDFLARE_API_TOKEN = config.CLOUDFLARE_API_TOKEN;
    ZONE_ID = config.CLOUDFLARE_ZONE_ID;
    ACCOUNT_ID = config.CLOUDFLARE_ACCOUNT_ID;

    if (!CLOUDFLARE_API_TOKEN || !ZONE_ID || !ACCOUNT_ID) {
      throw new Error("Missing required environment variables");
    }
  } catch (error) {
    console.error("Error loading configuration:", error.message);
    process.exit(1);
  }
}

async function makeRequest(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: "api.cloudflare.com",
      port: 443,
      path: `/client/v4${endpoint}`,
      method: options.method || "GET",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    };

    const req = https.request(requestOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (!json.success) {
            reject(
              new Error(json.errors?.[0]?.message || "API request failed")
            );
          } else {
            resolve(json.result);
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function configureSsl() {
  console.log("🔒 Configuring SSL settings...");

  try {
    // Update SSL settings
    await makeRequest(`/zones/${ZONE_ID}/settings/ssl`, {
      method: "PATCH",
      body: {
        value: "strict",
      },
    });

    // Enable HTTPS rewrites
    await makeRequest(`/zones/${ZONE_ID}/settings/automatic_https_rewrites`, {
      method: "PATCH",
      body: {
        value: "on",
      },
    });

    console.log("✅ SSL configuration updated");
  } catch (error) {
    console.error("❌ SSL configuration failed:", error.message);
    throw error;
  }
}

async function configureWwwDomain() {
  console.log("\n🌐 Configuring WWW domain...");

  try {
    // Check existing DNS records
    const records = await makeRequest(
      `/zones/${ZONE_ID}/dns_records?type=CNAME&name=www.awhittlewandering.com`
    );

    // If record exists, update it
    if (records.length > 0) {
      await makeRequest(`/zones/${ZONE_ID}/dns_records/${records[0].id}`, {
        method: "PUT",
        body: {
          type: "CNAME",
          name: "www",
          content: "continentalusa-site.pages.dev",
          proxied: true,
          ttl: 1,
        },
      });
      console.log("✅ Updated existing WWW CNAME record");
    } else {
      // Create new record
      await makeRequest(`/zones/${ZONE_ID}/dns_records`, {
        method: "POST",
        body: {
          type: "CNAME",
          name: "www",
          content: "continentalusa-site.pages.dev",
          proxied: true,
          ttl: 1,
        },
      });
      console.log("✅ Created new WWW CNAME record");
    }
  } catch (error) {
    console.error("❌ WWW domain configuration failed:", error.message);
    throw error;
  }
}

async function configurePage() {
  console.log("\n📄 Configuring Pages project...");

  try {
    // Update Pages project settings
    await makeRequest(
      `/accounts/${ACCOUNT_ID}/pages/projects/continentalusa-site`,
      {
        method: "PATCH",
        body: {
          deployment_configs: {
            production: {
              always_use_latest_compatibility_date: true,
              compatibility_flags: ["nodejs_compat"],
              compatibility_date: new Date().toISOString().split("T")[0],
            },
          },
        },
      }
    );

    console.log("✅ Pages project settings updated");
  } catch (error) {
    console.error("❌ Pages configuration failed:", error.message);
    throw error;
  }
}

async function main() {
  console.log("🚀 Starting Cloudflare configuration...\n");

  try {
    await loadConfig();
    await configureSsl();
    await configureWwwDomain();
    await configurePage();

    console.log("\n✨ Configuration complete!");
    console.log("\nNext steps:");
    console.log("1. Wait 5-10 minutes for changes to propagate");
    console.log("2. Run 'bun run verify-dns' to check configuration");
    console.log("3. Test site access at https://www.awhittlewandering.com");
  } catch (error) {
    console.error(
      "\n❌ Configuration failed. Please resolve issues and retry."
    );
    process.exit(1);
  }
}

// Run if called directly
if (fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(console.error);
}

export default {
  configureSsl,
  configureWwwDomain,
  configurePage,
};
