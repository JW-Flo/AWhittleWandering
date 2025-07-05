#!/usr/bin/env node

/**
 * Check API Data Script
 *
 * This script verifies that the API endpoints are returning the expected data
 * after uploading the fixed itinerary data to the KV namespace.
 */

const https = require("https");

// Configuration
const API_BASE = "https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev";
const ENDPOINTS = ["/api/v1/status", "/api/trip", "/api/vehicle", "/test"];

// Function to fetch data from an endpoint
function fetchEndpoint(endpoint) {
  return new Promise((resolve, reject) => {
    console.log(`Fetching ${API_BASE}${endpoint}...`);

    const options = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };

    https
      .get(`${API_BASE}${endpoint}`, options, (res) => {
        const { statusCode } = res;

        console.log(`Status Code: ${statusCode}`);

        // Handle redirects or errors
        if (statusCode !== 200) {
          console.log(
            `Endpoint ${endpoint} returned status code ${statusCode}`
          );
          return resolve({ endpoint, statusCode, data: null });
        }

        res.setEncoding("utf8");
        let rawData = "";

        res.on("data", (chunk) => {
          rawData += chunk;
        });

        res.on("end", () => {
          try {
            const parsedData = JSON.parse(rawData);
            console.log(
              `Successfully fetched and parsed data from ${endpoint}`
            );
            resolve({ endpoint, statusCode, data: parsedData });
          } catch (e) {
            console.error(`Error parsing JSON from ${endpoint}:`, e.message);
            resolve({ endpoint, statusCode, data: rawData, error: e.message });
          }
        });
      })
      .on("error", (e) => {
        console.error(`Error fetching ${endpoint}:`, e.message);
        reject(e);
      });
  });
}

// Main function to check all endpoints
async function checkAllEndpoints() {
  try {
    console.log("Checking API endpoints...");
    console.log("==========================");

    const results = await Promise.all(ENDPOINTS.map(fetchEndpoint));

    console.log("\nResults Summary:");
    console.log("===============");

    results.forEach(({ endpoint, statusCode, data }) => {
      console.log(
        `\n📝 ${endpoint} - Status: ${
          statusCode === 200 ? "✅" : "❌"
        } ${statusCode}`
      );

      if (data) {
        if (endpoint === "/api/v1/status") {
          console.log("  API Status:");
          console.log(`  - Version: ${data.version}`);
          console.log(`  - Environment: ${data.environment}`);
          console.log(`  - Status: ${data.status}`);
          console.log(`  - Timestamp: ${data.timestamp}`);
        } else if (endpoint === "/api/trip") {
          console.log("  Trip Data:");
          if (data.currentDay) {
            console.log(
              `  - Current Day: ${data.currentDay.location}, ${data.currentDay.state}`
            );
            console.log(`  - Current Day Notes: ${data.currentDay.notes}`);
          }
          if (data.nextDay) {
            console.log(
              `  - Next Day: ${data.nextDay.location}, ${data.nextDay.state}`
            );
          }
          console.log(
            `  - Visited States: ${
              data.visitedStates ? data.visitedStates.join(", ") : "None"
            }`
          );
          console.log(`  - Last Updated: ${data.lastUpdated}`);
        } else if (endpoint === "/api/vehicle") {
          console.log("  Vehicle Data:");
          if (data.name) console.log(`  - Name: ${data.name}`);
          if (data.batteryLevel)
            console.log(`  - Battery Level: ${data.batteryLevel}%`);
          if (data.range) console.log(`  - Range: ${data.range} miles`);
          if (data.location)
            console.log(
              `  - Location: ${data.location.city}, ${data.location.state}`
            );
        } else {
          // For /test and other endpoints
          console.log("  Response Data:");
          console.log(`  - ${JSON.stringify(data).substring(0, 200)}...`);
        }
      } else {
        console.log("  No data returned");
      }
    });

    console.log("\n==========================");
    console.log("API Data Check Complete");
    console.log("==========================");
  } catch (error) {
    console.error("Error checking endpoints:", error);
  }
}

// Run the script
checkAllEndpoints();
