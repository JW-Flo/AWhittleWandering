#!/usr/bin/env node

const https = require("https");

const PUBLIC_SITE_URL = "https://main.continentalusa-site.pages.dev";
const EDGE_WORKER_URL =
  "https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev";

console.log(
  "🔍 Verifying 48 Continental USA public site and API integration..."
);
console.log("===========================================================");

// Helper function to make HTTPS requests
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        const { statusCode } = res;
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          resolve({ statusCode, data });
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

async function verifyDeployment() {
  try {
    console.log(`📡 Checking public site (${PUBLIC_SITE_URL})...`);
    const publicSiteRes = await makeRequest(PUBLIC_SITE_URL);

    if (publicSiteRes.statusCode === 200) {
      console.log("✅ Public site is accessible!");
    } else {
      console.log(
        `❌ Public site returned status code: ${publicSiteRes.statusCode}`
      );
    }

    // Check edge worker endpoints
    console.log(`\n📡 Checking edge worker (${EDGE_WORKER_URL})...`);
    const edgeWorkerRes = await makeRequest(`${EDGE_WORKER_URL}/api/v1/status`);

    if (edgeWorkerRes.statusCode === 200) {
      console.log("✅ Edge worker is accessible!");
    } else {
      console.log(
        `❌ Edge worker returned status code: ${edgeWorkerRes.statusCode}`
      );
    }

    // Check itinerary endpoint
    console.log("\n📡 Checking itinerary API...");
    const itineraryRes = await makeRequest(`${EDGE_WORKER_URL}/api/itinerary`);

    if (itineraryRes.statusCode === 200) {
      console.log("✅ Itinerary API is accessible!");
      const itineraryData = JSON.parse(itineraryRes.data);
      console.log(
        `   Found ${
          itineraryData.meta?.totalStops ||
          itineraryData.stops?.length ||
          "unknown"
        } stops in the itinerary.`
      );
    } else {
      console.log(
        `❌ Itinerary API returned status code: ${itineraryRes.statusCode}`
      );
    }

    // Check vehicle endpoint
    console.log("\n📡 Checking vehicle API...");
    const vehicleRes = await makeRequest(`${EDGE_WORKER_URL}/api/vehicle`);

    if (vehicleRes.statusCode === 200) {
      console.log("✅ Vehicle API is accessible!");
      const vehicleData = JSON.parse(vehicleRes.data);
      console.log(
        `   Vehicle: ${vehicleData.name || "Unknown"} (${
          vehicleData.model || "Unknown"
        })`
      );
      console.log(
        `   Battery: ${vehicleData.batteryLevel || 0}%, Range: ${
          vehicleData.range || 0
        } miles`
      );
      console.log(
        `   Location: ${vehicleData.location?.latitude || 0}, ${
          vehicleData.location?.longitude || 0
        }`
      );
    } else {
      console.log(
        `❌ Vehicle API returned status code: ${vehicleRes.statusCode}`
      );
    }

    // Check weather endpoint
    console.log("\n📡 Checking weather API...");
    const weatherRes = await makeRequest(
      `${EDGE_WORKER_URL}/api/weather?lat=27.741774&lon=-97.388845`
    );

    if (weatherRes.statusCode === 200) {
      console.log("✅ Weather API is accessible!");
      const weatherData = JSON.parse(weatherRes.data);
      console.log(
        `   Temperature: ${weatherData.temperature || 0}°C, Wind: ${
          weatherData.windSpeed || 0
        } km/h`
      );
      console.log(
        `   Conditions: ${weatherData.conditions?.join(", ") || "Unknown"}`
      );
    } else {
      console.log(
        `❌ Weather API returned status code: ${weatherRes.statusCode}`
      );
    }

    console.log(
      "\n==========================================================="
    );
    console.log("🏁 Verification completed!");
  } catch (error) {
    console.error("❌ Error during verification:", error.message);
  }
}

verifyDeployment();
