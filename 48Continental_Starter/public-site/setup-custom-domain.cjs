#!/usr/bin/env node
/* eslint-disable */
const https = require("https");

// Configuration
const CLOUDFLARE_PROJECT = "continentalusa-site";
const CUSTOM_DOMAIN = "thewanderingwhittle.com";
const API_TOKEN = "_qx3a8qi33IWxM6cLqUJOFbMxqoTWJjahdUITFH4";

// Function to make Cloudflare API request with detailed logging
function makeApiRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    console.log(`Making ${options.method} request to: ${options.path}`);

    const req = https.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        console.log(`Response status: ${res.statusCode}`);
        try {
          const parsedData = JSON.parse(responseData);
          console.log(
            "Response headers:",
            JSON.stringify(res.headers, null, 2)
          );

          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedData);
          } else {
            console.error(
              "Error response:",
              JSON.stringify(parsedData, null, 2)
            );
            reject(
              new Error(
                `API Error (${res.statusCode}): ${JSON.stringify(parsedData)}`
              )
            );
          }
        } catch (e) {
          console.error("Failed to parse response:", responseData);
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on("error", (error) => {
      console.error("Request error:", error);
      reject(error);
    });

    if (data) {
      console.log("Request payload:", JSON.stringify(data, null, 2));
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Main function
async function main() {
  try {
    console.log("Setting up custom domain for Cloudflare Pages project");
    console.log(`Project: ${CLOUDFLARE_PROJECT}`);
    console.log(`Domain: ${CUSTOM_DOMAIN}`);

    // Get account ID
    console.log("\nFetching Cloudflare account information...");
    const accountOptions = {
      method: "GET",
      hostname: "api.cloudflare.com",
      path: "/client/v4/accounts",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
    };

    const accountsResponse = await makeApiRequest(accountOptions);
    if (
      !accountsResponse.success ||
      !accountsResponse.result ||
      accountsResponse.result.length === 0
    ) {
      throw new Error("Failed to retrieve Cloudflare accounts");
    }

    const accountId = accountsResponse.result[0].id;
    console.log(
      `\nUsing Cloudflare account: ${accountsResponse.result[0].name} (${accountId})`
    );

    // Set up custom domain
    console.log(`\nSetting up custom domain: ${CUSTOM_DOMAIN}`);
    const domainOptions = {
      method: "POST",
      hostname: "api.cloudflare.com",
      path: `/client/v4/accounts/${accountId}/pages/projects/${CLOUDFLARE_PROJECT}/domains`,
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
    };

    const domainPayload = {
      name: CUSTOM_DOMAIN,
    };

    try {
      const domainResponse = await makeApiRequest(domainOptions, domainPayload);
      if (domainResponse.success) {
        console.log("\n✅ Custom domain set up successfully!");
        console.log("\nNext steps:");
        console.log("1. Go to the Cloudflare dashboard to verify DNS settings");
        console.log("2. Wait for DNS propagation and SSL certificate issuance");
      } else {
        throw new Error("Response indicated failure");
      }
    } catch (domainError) {
      console.error("\n⚠️ Could not set up custom domain via API.");
      console.error("Error:", domainError.message);

      console.log("\nManual setup instructions:");
      console.log("1. Go to https://dash.cloudflare.com");
      console.log("2. Navigate to Workers & Pages > continentalusa-site");
      console.log("3. Click on 'Custom domains'");
      console.log("4. Add custom domain: thewanderingwhittle.com");
      console.log("5. Follow the verification steps");
    }

    // Manual environment variable setup instructions
    console.log("\nTo set up environment variables manually:");
    console.log("1. Go to the Cloudflare dashboard");
    console.log(
      "2. Navigate to Workers & Pages > continentalusa-site > Settings > Environment variables"
    );
    console.log("3. Add the following environment variables:");
    console.log(`
VITE_EDGE_WORKER_URL = https://thewanderingwhittle-edge.workers.dev
VITE_MAPBOX_TOKEN = pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJmNXlwY2IycGdtMnFva2liaTA4enIwIn0.tU9_tLaaxXxhfcVX4WhOeA
VITE_TESSIE_API_TOKEN = bqfufwiCC5QeXIhlZ9I1eCYoF9XFd9xo
VITE_TESSIE_VIN = 5YJYGDEE5LF027324
VITE_OPENWEATHER_API_KEY = 15bff53e78e69788b02b407a2603ee43
VITE_WEBSOCKET_ENDPOINT = wss://thewanderingwhittle-edge.workers.dev/ws
VITE_API_BASE_URL = https://thewanderingwhittle-edge.workers.dev
VITE_ENABLE_STREAMING = true
VITE_USE_SIMULATED_DATA = false
`);
    console.log("4. Click 'Save' to apply the environment variables");
    console.log("5. Trigger a new deployment to apply these variables");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

// Run the script
main();
