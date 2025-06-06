#!/usr/bin/env node
/* eslint-disable */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const https = require("https");

// Configuration
const CLOUDFLARE_PROJECT = "continentalusa-site";
const CUSTOM_DOMAIN = "thewanderingwhittle.com";

// Read environment variables from JSON
const envVarsPath = path.join(__dirname, "cloudflare-env-vars.json");
const envVarsData = JSON.parse(fs.readFileSync(envVarsPath, "utf8"));
const envVars = envVarsData.env_vars;

// Function to make Cloudflare API request
function makeApiRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        try {
          const parsedData = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedData);
          } else {
            reject(new Error(`API Error: ${JSON.stringify(parsedData)}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Main function
async function main() {
  try {
    // Use the provided Cloudflare API token
    const apiToken = "_qx3a8qi33IWxM6cLqUJOFbMxqoTWJjahdUITFH4";
    console.log("Using provided Cloudflare API token");

    // Get account ID
    console.log("Fetching Cloudflare account information...");
    const accountOptions = {
      method: "GET",
      hostname: "api.cloudflare.com",
      path: "/client/v4/accounts",
      headers: {
        Authorization: `Bearer ${apiToken}`,
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
    console.log(`Using Cloudflare account: ${accountsResponse.result[0].name}`);

    // Get project details
    console.log(`Getting details for project: ${CLOUDFLARE_PROJECT}`);
    const projectOptions = {
      method: "GET",
      hostname: "api.cloudflare.com",
      path: `/client/v4/accounts/${accountId}/pages/projects/${CLOUDFLARE_PROJECT}`,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
    };

    const projectResponse = await makeApiRequest(projectOptions);
    if (!projectResponse.success) {
      throw new Error(`Failed to retrieve project: ${CLOUDFLARE_PROJECT}`);
    }

    // Set environment variables
    console.log("Setting environment variables...");
    const envVarsOptions = {
      method: "POST", // Changed from PUT to POST based on API requirements
      hostname: "api.cloudflare.com",
      path: `/client/v4/accounts/${accountId}/pages/projects/${CLOUDFLARE_PROJECT}/env_vars`,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
    };

    // Format environment variables for API
    const formattedEnvVars = {};
    envVars.forEach((env) => {
      formattedEnvVars[env.name] = env.value;
    });

    const envVarsPayload = {
      env_vars: formattedEnvVars,
    };

    console.log("Sending environment variables to Cloudflare...");
    const envVarsResponse = await makeApiRequest(
      envVarsOptions,
      envVarsPayload
    );
    if (envVarsResponse.success) {
      console.log("✅ Environment variables set successfully!");
    } else {
      throw new Error("Failed to set environment variables");
    }

    // Set up custom domain
    console.log(`Setting up custom domain: ${CUSTOM_DOMAIN}`);
    const domainOptions = {
      method: "POST",
      hostname: "api.cloudflare.com",
      path: `/client/v4/accounts/${accountId}/pages/projects/${CLOUDFLARE_PROJECT}/domains`,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
    };

    const domainPayload = {
      name: CUSTOM_DOMAIN,
    };

    const domainResponse = await makeApiRequest(domainOptions, domainPayload);
    if (domainResponse.success) {
      console.log("✅ Custom domain set up successfully!");
    } else {
      console.error("Warning: Failed to set up custom domain.");
      console.error("You can set it up manually in the Cloudflare dashboard.");
    }

    // Trigger new deployment to apply changes
    console.log("Triggering new deployment...");
    console.log("\nTo trigger a new deployment manually:");
    console.log("1. Go to https://dash.cloudflare.com");
    console.log("2. Navigate to Workers & Pages > continentalusa-site");
    console.log("3. Click 'Redeploy' on the latest deployment\n");

    console.log("All done! Your Cloudflare Pages site has been configured.");
    console.log(
      `Visit: https://${CLOUDFLARE_PROJECT}.pages.dev to see your site.`
    );
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

// Run the script
main();
