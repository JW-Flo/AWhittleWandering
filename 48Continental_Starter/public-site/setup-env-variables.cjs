#!/usr/bin/env node
/* eslint-disable */
const https = require("https");

// Configuration
const CLOUDFLARE_PROJECT = "continentalusa-site";
const API_TOKEN = "_qx3a8qi33IWxM6cLqUJOFbMxqoTWJjahdUITFH4";

// Read environment variables from JSON
const fs = require("fs");
const path = require("path");
const envVarsPath = path.join(__dirname, "cloudflare-env-vars.json");
const envVarsData = JSON.parse(fs.readFileSync(envVarsPath, "utf8"));
const envVars = envVarsData.env_vars;

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
    console.log(
      "Setting up environment variables for Cloudflare Pages project"
    );
    console.log(`Project: ${CLOUDFLARE_PROJECT}`);
    console.log(`Number of variables to set: ${envVars.length}`);

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

    // Set environment variables
    console.log("\nSetting up environment variables...");

    // Format environment variables for API
    const formattedEnvVars = {};
    envVars.forEach((env) => {
      formattedEnvVars[env.name] = env.value;
    });

    const envVarsOptions = {
      method: "PUT",
      hostname: "api.cloudflare.com",
      path: `/client/v4/accounts/${accountId}/pages/projects/${CLOUDFLARE_PROJECT}/environment_variables`,
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
    };

    const envVarsPayload = {
      environment_variables: formattedEnvVars,
    };

    try {
      console.log("Sending environment variables to Cloudflare...");
      const envVarsResponse = await makeApiRequest(
        envVarsOptions,
        envVarsPayload
      );

      if (envVarsResponse.success) {
        console.log("\n✅ Environment variables set successfully!");
        console.log("\nNext steps:");
        console.log(
          "1. Trigger a new deployment to apply the environment variables"
        );
        console.log("2. Go to https://dash.cloudflare.com");
        console.log("3. Navigate to Workers & Pages > continentalusa-site");
        console.log("4. Click 'Redeploy' on the latest deployment");
      } else {
        throw new Error("Response indicated failure");
      }
    } catch (envError) {
      console.error("\n⚠️ Could not set environment variables via API.");
      console.error("Error:", envError.message);

      console.log("\nManual setup instructions:");
      console.log("1. Go to https://dash.cloudflare.com");
      console.log(
        "2. Navigate to Workers & Pages > continentalusa-site > Settings > Environment variables"
      );
      console.log("3. Add the following environment variables:");

      envVars.forEach((env) => {
        console.log(`   ${env.name} = ${env.value}`);
      });

      console.log("4. Click 'Save' to apply the environment variables");
      console.log("5. Trigger a new deployment to apply these variables");
    }
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

// Run the script
main();
