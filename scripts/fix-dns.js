#!/usr/bin/env node

// Script to add missing DNS records for awhittlewandering.com subdomains
// This script will add the CNAME records needed for api and admin subdomains

const https = require("https");

// Cloudflare API configuration
const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";
const ZONE_NAME = "awhittlewandering.com";

// You need to get your API token from the Cloudflare dashboard
// Go to: https://dash.cloudflare.com/profile/api-tokens
// Create token with Zone:Edit permissions for awhittlewandering.com
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || "YOUR_API_TOKEN_HERE";

if (API_TOKEN === "YOUR_API_TOKEN_HERE") {
  console.log("❌ Error: Please set your Cloudflare API token");
  console.log("   Export it as: export CLOUDFLARE_API_TOKEN=your_token_here");
  console.log(
    "   Or get it from: https://dash.cloudflare.com/profile/api-tokens"
  );
  process.exit(1);
}

async function makeCloudflareRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.cloudflare.com",
      path: `/client/v4${endpoint}`,
      method: method,
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.success) {
            resolve(parsed.result);
          } else {
            reject(new Error(`API Error: ${JSON.stringify(parsed.errors)}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function getZoneId() {
  const zones = await makeCloudflareRequest("GET", `/zones?name=${ZONE_NAME}`);
  if (zones.length === 0) {
    throw new Error(`Zone ${ZONE_NAME} not found`);
  }
  return zones[0].id;
}

async function createDNSRecord(zoneId, name, target) {
  const recordData = {
    type: "CNAME",
    name: name,
    content: target,
    ttl: 300, // 5 minutes
    proxied: true, // Enable Cloudflare proxy
  };

  console.log(`Creating DNS record: ${name} → ${target}`);

  try {
    const result = await makeCloudflareRequest(
      "POST",
      `/zones/${zoneId}/dns_records`,
      recordData
    );
    console.log(`✅ Successfully created: ${name} → ${target}`);
    return result;
  } catch (error) {
    if (error.message.includes("already exists")) {
      console.log(`⚠️  Record already exists: ${name}`);
    } else {
      console.log(`❌ Failed to create ${name}: ${error.message}`);
      throw error;
    }
  }
}

async function main() {
  try {
    console.log("🔍 Getting zone ID for", ZONE_NAME);
    const zoneId = await getZoneId();
    console.log("✅ Zone ID:", zoneId);

    // Create DNS records for the subdomains
    await createDNSRecord(
      zoneId,
      "api",
      "awhittlewandering-api.kd8jc7v8cd.workers.dev"
    );
    await createDNSRecord(zoneId, "admin", "awhittlewandering.com");

    console.log("\n🎉 DNS records created successfully!");
    console.log("🕐 DNS propagation may take 5-10 minutes");
    console.log("\n📝 Test the endpoints:");
    console.log("   curl https://api.awhittlewandering.com/api/v1/health");
    console.log("   curl https://admin.awhittlewandering.com/");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();
