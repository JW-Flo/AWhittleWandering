/**
 * Tessie API Diagnostic Tool
 * Systematically tests different API endpoints and authentication methods
 * to identify why the API calls are failing
 */

const fetch = require("node-fetch");

const TESSIE_TOKEN = process.env.TESSIE_API_TOKEN;
const VEHICLE_ID = process.env.VEHICLE_ID;

console.log("🔍 TESSIE API DIAGNOSTIC TOOL");
console.log("=============================");
console.log(
  `Token: ${TESSIE_TOKEN ? TESSIE_TOKEN.substring(0, 10) + "..." : "NOT SET"}`
);
console.log(
  `Vehicle ID: ${VEHICLE_ID ? VEHICLE_ID.substring(0, 10) + "..." : "NOT SET"}`
);

async function runDiagnostics() {
  // Test 1: Basic API connection with different endpoints
  console.log("\n📋 TEST 1: API ENDPOINT VARIATIONS");
  console.log("=====================================");

  const testEndpoints = [
    "https://api.tessie.com/vehicles", // List vehicles
    "https://api.tessie.com/api/1/vehicles", // Tesla API format
    "https://api.tessie.com/v1/vehicles", // Version 1 API
    "https://api.tessie.com/me", // User info
    "https://api.tessie.com/user", // User profile
  ];

  for (const endpoint of testEndpoints) {
    try {
      console.log(`\n🔗 Testing: ${endpoint}`);
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${TESSIE_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log(
          `   ✅ SUCCESS! Data keys: ${Object.keys(data).join(", ")}`
        );
        if (data.length && Array.isArray(data)) {
          console.log(`   📊 Found ${data.length} items`);
        }
      } else {
        const errorText = await response.text();
        console.log(`   ❌ FAILED: ${errorText.substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`   💥 ERROR: ${error.message}`);
    }
  }

  // Test 2: Different authentication methods
  console.log("\n🔑 TEST 2: AUTHENTICATION METHODS");
  console.log("==================================");

  const authMethods = [
    {
      name: "Bearer Token",
      headers: { Authorization: `Bearer ${TESSIE_TOKEN}` },
    },
    { name: "Direct Token", headers: { Authorization: TESSIE_TOKEN } },
    { name: "X-API-Key", headers: { "X-API-Key": TESSIE_TOKEN } },
    { name: "API-Key", headers: { "API-Key": TESSIE_TOKEN } },
  ];

  for (const auth of authMethods) {
    try {
      console.log(`\n🔐 Testing: ${auth.name}`);
      const response = await fetch("https://api.tessie.com/vehicles", {
        headers: {
          ...auth.headers,
          "Content-Type": "application/json",
        },
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);
      if (response.ok) {
        console.log(`   ✅ SUCCESS with ${auth.name}!`);
      }
    } catch (error) {
      console.log(`   💥 ERROR: ${error.message}`);
    }
  }

  // Test 3: Vehicle-specific endpoints if we can find vehicles
  console.log("\n🚗 TEST 3: VEHICLE-SPECIFIC ENDPOINTS");
  console.log("=====================================");

  try {
    // First try to get vehicles list
    const vehiclesResponse = await fetch("https://api.tessie.com/vehicles", {
      headers: {
        Authorization: `Bearer ${TESSIE_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (vehiclesResponse.ok) {
      const vehicles = await vehiclesResponse.json();
      console.log(`\n✅ Found ${vehicles.length} vehicle(s)`);

      if (vehicles.length > 0) {
        const vehicle = vehicles[0];
        console.log(`Vehicle data keys: ${Object.keys(vehicle).join(", ")}`);

        // Test different vehicle ID formats
        const possibleIds = [
          vehicle.id,
          vehicle.id_s,
          vehicle.vin,
          vehicle.vehicle_id,
        ].filter(Boolean);

        console.log(`\nTesting vehicle IDs: ${possibleIds.join(", ")}`);

        for (const id of possibleIds) {
          const vehicleEndpoints = [
            `https://api.tessie.com/${id}/state`,
            `https://api.tessie.com/vehicles/${id}/state`,
            `https://api.tessie.com/api/1/vehicles/${id}/vehicle_data`,
            `https://api.tessie.com/${id}`,
            `https://api.tessie.com/vehicles/${id}`,
          ];

          for (const endpoint of vehicleEndpoints) {
            try {
              console.log(`\n🔗 Testing: ${endpoint}`);
              const response = await fetch(endpoint, {
                headers: {
                  Authorization: `Bearer ${TESSIE_TOKEN}`,
                  "Content-Type": "application/json",
                },
              });

              console.log(
                `   Status: ${response.status} ${response.statusText}`
              );
              if (response.ok) {
                console.log(`   ✅ SUCCESS! Vehicle data endpoint found`);
                const data = await response.json();
                if (data.charge_state) {
                  console.log(
                    `   🔋 Battery: ${data.charge_state.battery_level}%`
                  );
                }
                if (data.drive_state) {
                  console.log(
                    `   📍 Location: ${data.drive_state.latitude}, ${data.drive_state.longitude}`
                  );
                }
              }
            } catch (error) {
              console.log(`   💥 ERROR: ${error.message}`);
            }
          }
        }
      }
    } else {
      console.log(`❌ Could not fetch vehicles: ${vehiclesResponse.status}`);
    }
  } catch (error) {
    console.log(`💥 Vehicle test failed: ${error.message}`);
  }

  // Test 4: Historical data endpoints
  console.log("\n📊 TEST 4: HISTORICAL DATA ENDPOINTS");
  console.log("====================================");

  const historyEndpoints = [
    "https://api.tessie.com/drives",
    "https://api.tessie.com/charges",
    "https://api.tessie.com/trips",
    "https://api.tessie.com/history",
  ];

  for (const endpoint of historyEndpoints) {
    try {
      console.log(`\n📈 Testing: ${endpoint}`);
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${TESSIE_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ SUCCESS! Keys: ${Object.keys(data).join(", ")}`);
      }
    } catch (error) {
      console.log(`   💥 ERROR: ${error.message}`);
    }
  }

  console.log("\n🎯 DIAGNOSTIC SUMMARY");
  console.log("====================");
  console.log("1. Check which authentication method worked");
  console.log("2. Check which vehicle ID format is correct");
  console.log("3. Check which endpoint structure is valid");
  console.log("4. Use successful patterns for data ingestion");

  console.log("\n💡 COMMON ISSUES:");
  console.log("• Token expired - need to regenerate in Tessie app");
  console.log(
    "• Wrong endpoint format - Tessie uses different URLs than Tesla API"
  );
  console.log("• Vehicle not shared with token - check permissions in Tessie");
  console.log("• Rate limiting - too many requests too quickly");
  console.log("• Subscription inactive - verify Tessie account status");
}

// Run diagnostics
if (!TESSIE_TOKEN) {
  console.error("❌ TESSIE_API_TOKEN environment variable not set");
  console.log('Run: export TESSIE_API_TOKEN="your_token_here"');
  process.exit(1);
}

runDiagnostics().catch(console.error);
