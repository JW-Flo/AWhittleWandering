#!/usr/bin/env node

/**
 * API Endpoint Health Check
 *
 * This script checks the health of the API endpoints by making
 * requests to each endpoint and verifying the responses.
 *
 * Usage:
 *   node test-api-endpoints.js [API_URL]
 *
 * Environment variables:
 *   EDGE_HMAC_KEY - HMAC key for securing API requests
 *   AUTO_REMEDIATE - Set to "true" to enable auto-remediation (default: false)
 *   NOTIFICATION_WEBHOOK - Webhook URL for sending notifications
 */

const https = require("https");
const http = require("http");
const crypto = require("crypto");
const { URL } = require("url");

// Configuration
const config = {
  defaultApiUrl: "https://awhittlewandering-edge.kd8jc7v8cd.workers.dev",
  endpoints: [
    { path: "/healthz", method: "GET", expectedStatus: 200 },
    {
      path: "/api/v1/vehicle/status",
      method: "GET",
      expectedStatus: 200,
      requiresAuth: true,
    },
    { path: "/api/v1/trip/current", method: "GET", expectedStatus: 200 },
    { path: "/api/v1/weather/current", method: "GET", expectedStatus: 200 },
    { path: "/api/v1/states/visited", method: "GET", expectedStatus: 200 },
  ],
  auth: {
    hmacKey: process.env.EDGE_HMAC_KEY || "test-key",
    timestampValiditySeconds: 300,
  },
  timeouts: {
    request: 10000, // 10 seconds
  },
  reporting: {
    exitOnFail: true,
    verbose: true,
  },
};

// Parse command line arguments
const args = process.argv.slice(2);
const apiUrl = args[0] || config.defaultApiUrl;

console.log(`Testing API endpoints at: ${apiUrl}`);

// Helper function to make HTTP requests
function makeRequest(
  url,
  method,
  headers = {},
  timeoutMs = config.timeouts.request
) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        "User-Agent": "API-Health-Check/1.0",
        Accept: "application/json",
        ...headers,
      },
      timeout: timeoutMs,
    };

    const req = (urlObj.protocol === "https:" ? https : http).request(
      options,
      (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          let responseBody;
          try {
            responseBody = data.length > 0 ? JSON.parse(data) : null;
          } catch (e) {
            responseBody = data;
          }

          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: responseBody,
            rawBody: data,
          });
        });
      }
    );

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

// Generate HMAC signature for authenticated requests
function generateHmacSignature(path, timestamp) {
  const hmac = crypto.createHmac("sha256", config.auth.hmacKey);
  hmac.update(`${path}:${timestamp}`);
  return hmac.digest("hex");
}

// Test a single endpoint
async function testEndpoint(endpoint) {
  const url = `${apiUrl}${endpoint.path}`;
  const headers = {};

  // Add authentication headers if required
  if (endpoint.requiresAuth) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = generateHmacSignature(endpoint.path, timestamp);

    headers["X-Timestamp"] = timestamp;
    headers["X-Signature"] = signature;
  }

  console.log(
    `Testing ${endpoint.method} ${url}${
      endpoint.requiresAuth ? " (authenticated)" : ""
    }`
  );

  try {
    const response = await makeRequest(url, endpoint.method, headers);

    const passed = response.statusCode === endpoint.expectedStatus;
    const statusMessage = passed ? "PASSED" : "FAILED";
    const statusColor = passed ? "\x1b[32m" : "\x1b[31m"; // Green or Red

    console.log(
      `${statusColor}${statusMessage}\x1b[0m - Status: ${response.statusCode} (expected ${endpoint.expectedStatus})`
    );

    if (config.reporting.verbose) {
      console.log("Response headers:", response.headers);
      console.log(
        "Response body:",
        typeof response.body === "object"
          ? JSON.stringify(response.body, null, 2)
          : response.body
      );
    }

    return {
      endpoint: endpoint,
      url: url,
      passed: passed,
      statusCode: response.statusCode,
      response: response,
    };
  } catch (error) {
    console.error(`\x1b[31mFAILED\x1b[0m - Error: ${error.message}`);

    return {
      endpoint: endpoint,
      url: url,
      passed: false,
      error: error.message,
    };
  }
}

// Main function to test all endpoints
async function testAllEndpoints() {
  console.log("Starting API endpoint tests...");

  const results = [];
  let allPassed = true;

  for (const endpoint of config.endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);

    if (!result.passed) {
      allPassed = false;
    }

    // Add a small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Print summary
  console.log("\nTest Summary:");
  console.log("-".repeat(50));

  let passCount = 0;
  let failCount = 0;

  for (const result of results) {
    const statusSymbol = result.passed ? "✅" : "❌";
    console.log(`${statusSymbol} ${result.endpoint.method} ${result.url}`);

    if (result.passed) {
      passCount++;
    } else {
      failCount++;
    }
  }

  console.log("-".repeat(50));
  console.log(`Results: ${passCount} passed, ${failCount} failed`);

  // Generate JSON report
  const report = {
    timestamp: new Date().toISOString(),
    apiUrl: apiUrl,
    summary: {
      total: results.length,
      passed: passCount,
      failed: failCount,
      success_rate: (passCount / results.length) * 100,
    },
    results: results.map((r) => ({
      url: r.url,
      method: r.endpoint.method,
      passed: r.passed,
      statusCode: r.statusCode,
      error: r.error,
    })),
  };

  console.log(`\nJSON Report: ${JSON.stringify(report, null, 2)}`);

  // Exit with appropriate code if configured
  if (config.reporting.exitOnFail && !allPassed) {
    console.error("Some tests failed. Exiting with error code.");
    process.exit(1);
  }

  return report;
}

// Run the tests
testAllEndpoints().catch((error) => {
  console.error("Uncaught error:", error);
  process.exit(1);
});
