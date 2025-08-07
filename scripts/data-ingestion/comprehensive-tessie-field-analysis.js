/**
 * Comprehensive Tessie API Field Analysis
 * This script examines ALL available fields in the Tessie API responses
 * to ensure we capture every possible data point for the Tesla journey
 */

import fetch from "node-fetch";

const TESSIE_TOKEN = process.env.TESSIE_API_TOKEN;
const VEHICLE_ID = process.env.VEHICLE_ID;

if (!TESSIE_TOKEN || !VEHICLE_ID) {
  console.error(
    "❌ Missing TESSIE_API_TOKEN or VEHICLE_ID environment variables"
  );
  process.exit(1);
}

console.log("🔍 COMPREHENSIVE TESSIE API FIELD ANALYSIS");
console.log("==========================================");

async function analyzeAllTessieFields() {
  try {
    // 1. VEHICLE STATE - Real-time data
    console.log("\n📊 1. VEHICLE STATE FIELDS:");
    const stateResponse = await fetch(
      `https://api.tessie.com/${VEHICLE_ID}/state`,
      {
        headers: { Authorization: `Bearer ${TESSIE_TOKEN}` },
      }
    );
    const stateData = await stateResponse.json();

    console.log("Available top-level state fields:");
    Object.keys(stateData).forEach((key) => {
      const value = stateData[key];
      const type = typeof value;
      const preview =
        type === "object"
          ? `{${Object.keys(value || {}).length} fields}`
          : type === "string"
          ? `"${String(value).substring(0, 30)}${
              String(value).length > 30 ? "..." : ""
            }"`
          : String(value);
      console.log(`  • ${key}: ${type} = ${preview}`);
    });

    // 2. DRIVES - Historical driving data
    console.log("\n🚗 2. DRIVES FIELDS:");
    const drivesResponse = await fetch(
      `https://api.tessie.com/${VEHICLE_ID}/drives?limit=1`,
      {
        headers: { Authorization: `Bearer ${TESSIE_TOKEN}` },
      }
    );
    const drivesData = await drivesResponse.json();

    if (drivesData.results && drivesData.results.length > 0) {
      const sampleDrive = drivesData.results[0];
      console.log("Available drive fields:");
      Object.keys(sampleDrive).forEach((key) => {
        const value = sampleDrive[key];
        const type = typeof value;
        const preview =
          type === "object"
            ? `{${Object.keys(value || {}).length} fields}`
            : type === "string"
            ? `"${String(value).substring(0, 30)}${
                String(value).length > 30 ? "..." : ""
              }"`
            : String(value);
        console.log(`  • ${key}: ${type} = ${preview}`);
      });
    }

    // 3. CHARGES - Charging session data
    console.log("\n🔋 3. CHARGES FIELDS:");
    const chargesResponse = await fetch(
      `https://api.tessie.com/${VEHICLE_ID}/charges?limit=1`,
      {
        headers: { Authorization: `Bearer ${TESSIE_TOKEN}` },
      }
    );
    const chargesData = await chargesResponse.json();

    if (chargesData.results && chargesData.results.length > 0) {
      const sampleCharge = chargesData.results[0];
      console.log("Available charge fields:");
      Object.keys(sampleCharge).forEach((key) => {
        const value = sampleCharge[key];
        const type = typeof value;
        const preview =
          type === "object"
            ? `{${Object.keys(value || {}).length} fields}`
            : type === "string"
            ? `"${String(value).substring(0, 30)}${
                String(value).length > 30 ? "..." : ""
              }"`
            : String(value);
        console.log(`  • ${key}: ${type} = ${preview}`);
      });
    }

    // 4. VEHICLE INFO - Static vehicle data
    console.log("\n🚙 4. VEHICLE INFO FIELDS:");
    const vehicleResponse = await fetch(
      `https://api.tessie.com/${VEHICLE_ID}`,
      {
        headers: { Authorization: `Bearer ${TESSIE_TOKEN}` },
      }
    );
    const vehicleData = await vehicleResponse.json();

    console.log("Available vehicle info fields:");
    Object.keys(vehicleData).forEach((key) => {
      const value = vehicleData[key];
      const type = typeof value;
      const preview =
        type === "object"
          ? `{${Object.keys(value || {}).length} fields}`
          : type === "string"
          ? `"${String(value).substring(0, 30)}${
              String(value).length > 30 ? "..." : ""
            }"`
          : String(value);
      console.log(`  • ${key}: ${type} = ${preview}`);
    });

    // 5. FLEET STATS - Overall statistics
    console.log("\n📈 5. FLEET STATS FIELDS:");
    try {
      const statsResponse = await fetch(
        `https://api.tessie.com/${VEHICLE_ID}/stats`,
        {
          headers: { Authorization: `Bearer ${TESSIE_TOKEN}` },
        }
      );
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log("Available stats fields:");
        Object.keys(statsData).forEach((key) => {
          const value = statsData[key];
          const type = typeof value;
          const preview =
            type === "object"
              ? `{${Object.keys(value || {}).length} fields}`
              : type === "string"
              ? `"${String(value).substring(0, 30)}${
                  String(value).length > 30 ? "..." : ""
                }"`
              : String(value);
          console.log(`  • ${key}: ${type} = ${preview}`);
        });
      } else {
        console.log(
          "Stats endpoint not available or requires different authentication"
        );
      }
    } catch (error) {
      console.log("Stats endpoint not accessible");
    }

    // 6. DETAILED FIELD ANALYSIS - Nested objects
    console.log("\n🔬 6. DETAILED NESTED FIELD ANALYSIS:");

    // Analyze nested state objects
    if (stateData.charge_state) {
      console.log("\n  📋 charge_state fields:");
      Object.keys(stateData.charge_state).forEach((key) => {
        console.log(`    • ${key}: ${stateData.charge_state[key]}`);
      });
    }

    if (stateData.drive_state) {
      console.log("\n  📋 drive_state fields:");
      Object.keys(stateData.drive_state).forEach((key) => {
        console.log(`    • ${key}: ${stateData.drive_state[key]}`);
      });
    }

    if (stateData.vehicle_state) {
      console.log("\n  📋 vehicle_state fields:");
      Object.keys(stateData.vehicle_state).forEach((key) => {
        console.log(`    • ${key}: ${stateData.vehicle_state[key]}`);
      });
    }

    if (stateData.climate_state) {
      console.log("\n  📋 climate_state fields:");
      Object.keys(stateData.climate_state).forEach((key) => {
        console.log(`    • ${key}: ${stateData.climate_state[key]}`);
      });
    }

    // 7. FIELD COMPLETENESS CHECK
    console.log("\n✅ 7. FIELD COMPLETENESS ANALYSIS:");
    console.log("==========================================");

    const currentFields = [
      // Vehicle State
      "battery_level",
      "battery_range",
      "charging_state",
      "latitude",
      "longitude",
      "speed",
      "odometer",
      "inside_temp",
      "outside_temp",
      "power",
      "locked",
      "climate_on",
      "shift_state",
      "timestamp",

      // Drives
      "started_at",
      "ended_at",
      "starting_location",
      "ending_location",
      "odometer_distance",
      "duration_minutes",
      "energy_used",
      "average_speed",
      "max_speed",
      "start_battery_level",
      "end_battery_level",

      // Charges
      "started_at",
      "ended_at",
      "location",
      "charger_type",
      "charger_power",
      "energy_added",
      "start_battery_level",
      "end_battery_level",
      "cost",
    ];

    console.log(`\n📊 Currently capturing ${currentFields.length} fields`);
    console.log("\n🔍 MISSING OPPORTUNITIES - Fields we might want to add:");

    // Check for additional useful fields in drives
    if (drivesData.results && drivesData.results.length > 0) {
      const driveFields = Object.keys(drivesData.results[0]);
      const missingDriveFields = driveFields.filter(
        (field) => !currentFields.includes(field)
      );
      if (missingDriveFields.length > 0) {
        console.log("\n  🚗 Additional drive fields available:");
        missingDriveFields.forEach((field) => {
          const value = drivesData.results[0][field];
          console.log(`    • ${field}: ${typeof value} = ${value}`);
        });
      }
    }

    // Check for additional useful fields in charges
    if (chargesData.results && chargesData.results.length > 0) {
      const chargeFields = Object.keys(chargesData.results[0]);
      const missingChargeFields = chargeFields.filter(
        (field) => !currentFields.includes(field)
      );
      if (missingChargeFields.length > 0) {
        console.log("\n  🔋 Additional charge fields available:");
        missingChargeFields.forEach((field) => {
          const value = chargesData.results[0][field];
          console.log(`    • ${field}: ${typeof value} = ${value}`);
        });
      }
    }

    // Check for additional useful fields in vehicle state
    const stateFields = Object.keys(stateData);
    const missingStateFields = stateFields.filter(
      (field) => !currentFields.includes(field)
    );
    if (missingStateFields.length > 0) {
      console.log("\n  📊 Additional state fields available:");
      missingStateFields.forEach((field) => {
        const value = stateData[field];
        const type = typeof value;
        const preview =
          type === "object"
            ? `{object with ${Object.keys(value || {}).length} fields}`
            : String(value);
        console.log(`    • ${field}: ${type} = ${preview}`);
      });
    }

    console.log("\n🎯 RECOMMENDATIONS:");
    console.log("===================");
    console.log("1. ✅ Core journey data is being captured");
    console.log("2. 🔍 Check additional fields above for enhanced analytics");
    console.log("3. 📊 Consider weather data integration");
    console.log("4. 🗺️ Consider route/waypoint data if available");
    console.log("5. 💰 Verify all cost/pricing fields are captured");
    console.log("6. ⚡ Check for supercharger network data");
    console.log("7. 🚗 Vehicle configuration/settings data");
    console.log("8. 📱 Software version tracking");
  } catch (error) {
    console.error("❌ Analysis failed:", error.message);
  }
}

// Run the comprehensive analysis
analyzeAllTessieFields();
