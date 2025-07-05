#!/usr/bin/env node

/**
 * Deployment Success Validator
 *
 * This script verifies that the A Whittle Wandering website and API
 * are properly deployed and functioning by checking key endpoints
 * and features.
 *
 * Usage:
 *   node deployment-success-validator.js [SITE_URL] [API_URL]
 *
 * Example:
 *   node deployment-success-validator.js https://awhittlewandering-site.pages.dev https://awhittlewandering-edge.workers.dev
 */

const https = require("https");
const { URL } = require("url");

// Configuration
const config = {
  timeouts: {
    request: 15000, // 15 seconds
    total: 120000, // 2 minutes for complete validation
  },
  retries: {
    count: 3,
    delay: 5000, // 5 seconds between retries
  },
  exitOnFail: true,
};

// Parse command line arguments
const args = process.argv.slice(2);
const siteUrl = args[0] || "https://awhittlewandering-site.pages.dev";
const apiUrl = args[1] || "https://awhittlewandering-edge.workers.dev";

// Validation checks
const checks = [
  {
    name: "Public Site Homepage",
    type: "site",
    url: `${siteUrl}`,
    method: "GET",
    expectStatus: 200,
    validateContent: (body) =>
      body.includes("<title>A Whittle Wandering") ||
      body.includes("<title>48Continental"),
  },
  {
    name: "Public Site CSS & Assets",
    type: "site",
    url: `${siteUrl}`,
    method: "GET",
    expectStatus: 200,
    validateContent: (body) =>
      body.includes("<link") &&
      (body.includes(".css") || body.includes("stylesheet")) &&
      (body.includes(".js") || body.includes("script src=")),
  },
  {
    name: "API Health Check",
    type: "api",
    url: `${apiUrl}/healthz`,
    method: "GET",
    expectStatus: 200,
    validateContent: (body) => {
      try {
        const data = JSON.parse(body);
        return data.status === "ok" || data.healthy === true;
      } catch {
        return body.includes("ok") || body.includes("healthy");
      }
    },
  },
  {
    name: "API Trip Data Endpoint",
    type: "api",
    url: `${apiUrl}/api/v1/trip/current`,
    method: "GET",
    expectStatus: 200,
    validateContent: (body) => {
      try {
        const data = JSON.parse(body);
        return (
          data &&
          (data.currentDay !== undefined ||
            data.currentLocation !== undefined ||
            data.tripData !== undefined)
        );
      } catch {
        return false;
      }
    },
  },
  {
    name: "API Weather Endpoint",
    type: "api",
    url: `${apiUrl}/api/v1/weather/current`,
    method: "GET",
    expectStatus: 200,
    validateContent: (body) => {
      try {
        const data = JSON.parse(body);
        return (
          data &&
          (data.weather !== undefined ||
            data.temperature !== undefined ||
            data.current !== undefined)
        );
      } catch {
        return false;
      }
    },
  },
];

// Helper function to make HTTP requests
function makeRequest(url, method = "GET", timeoutMs = config.timeouts.request) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        "User-Agent": "Deployment-Validator/1.0",
        Accept: "text/html,application/json,*/*",
      },
      timeout: timeoutMs,
    };

    const req = https.request(options, (res) => {
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
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    });

    req.end();
  });
}

// Function to run a single check with retries
async function runCheck(check) {
  let lastError = null;

  for (let attempt = 1; attempt <= config.retries.count; attempt++) {
    try {
      console.log(
        `Running check: ${check.name} (${check.url}) - Attempt ${attempt}/${config.retries.count}`
      );

      const response = await makeRequest(check.url, check.method);

      // Check status code
      const statusOk = response.statusCode === check.expectStatus;
      if (!statusOk) {
        throw new Error(
          `Expected status ${check.expectStatus}, got ${response.statusCode}`
        );
      }

      // Validate content if a validator function was provided
      let contentOk = true;
      if (check.validateContent) {
        contentOk = check.validateContent(response.body);
        if (!contentOk) {
          throw new Error("Content validation failed");
        }
      }

      console.log(`✅ PASSED: ${check.name}`);
      return true;
    } catch (error) {
      lastError = error;
      console.error(`❌ FAILED: ${check.name} - ${error.message}`);

      if (attempt < config.retries.count) {
        console.log(`Retrying in ${config.retries.delay / 1000}s...`);
        await new Promise((resolve) =>
          setTimeout(resolve, config.retries.delay)
        );
      }
    }
  }

  console.error(`✖️ ALL ATTEMPTS FAILED: ${check.name} - ${lastError.message}`);
  return false;
}

// Main function to run all checks
async function runAllChecks() {
  console.log(`
====================================================
     A Whittle Wandering Deployment Validator
====================================================

Site URL: ${siteUrl}
API URL:  ${apiUrl}

Starting validation checks...
`);

  // Set a timeout for the entire validation process
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(
        new Error(
          `Validation timed out after ${config.timeouts.total / 1000} seconds`
        )
      );
    }, config.timeouts.total);
  });

  // Run all checks
  const checkPromise = (async () => {
    const results = {
      site: { passed: 0, failed: 0, total: 0 },
      api: { passed: 0, failed: 0, total: 0 },
      all: { passed: 0, failed: 0, total: checks.length },
    };

    for (const check of checks) {
      const success = await runCheck(check);

      // Update results
      results[check.type].total++;
      if (success) {
        results[check.type].passed++;
        results.all.passed++;
      } else {
        results[check.type].failed++;
        results.all.failed++;
      }
    }

    return results;
  })();

  try {
    // Race between checks and timeout
    const results = await Promise.race([checkPromise, timeoutPromise]);

    // Print summary
    console.log(`
====================================================
                 Validation Results
====================================================

Website Checks: ${results.site.passed}/${results.site.total} passed
API Checks:     ${results.api.passed}/${results.api.total} passed
Overall:        ${results.all.passed}/${results.all.total} passed (${Math.round(
      (results.all.passed / results.all.total) * 100
    )}%)
`);

    // Determine exit code
    const allPassed = results.all.passed === results.all.total;

    if (allPassed) {
      console.log("✅ DEPLOYMENT VALIDATION SUCCESSFUL");
      process.exit(0);
    } else {
      console.error("❌ DEPLOYMENT VALIDATION FAILED");

      if (config.exitOnFail) {
        process.exit(1);
      }
    }
  } catch (error) {
    console.error(`\n❌ VALIDATION ERROR: ${error.message}`);

    if (config.exitOnFail) {
      process.exit(1);
    }
  }
}

// Run the validation
runAllChecks();
