/**
 * REAL TESSIE DATA INGESTION SCRIPT
 *
 * This script fetches your ACTUAL Tesla data from Tessie API
 * and stores it in your optimized D1 database structure
 *
 * NO SIMULATIONS - REAL DATA ONLY
 */

// Load environment variables
require("dotenv").config();

const https = require("https");
const fs = require("fs");

// Configuration
const config = {
  tessieToken: process.env.TESSIE_API_TOKEN,
  vehicleId: process.env.VEHICLE_ID,
  journeyStartDate: "2025-06-01T00:00:00Z",
  journeyId: "continental-usa-2025",
  vehicleIdDB: "midnight-shadow",
};

console.log("🔥 REAL TESLA DATA INGESTION");
console.log("📅 Journey: June 1, 2025 → Present");
console.log("🚫 NO SIMULATIONS - TESSIE API ONLY");
console.log("═══════════════════════════════════════════");

/**
 * Make authenticated request to Tessie API
 */
function tessieRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.tessie.com",
      port: 443,
      path: endpoint,
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.tessieToken}`,
        "Content-Type": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Invalid JSON response: ${e.message}`));
          }
        } else {
          reject(new Error(`API Error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.end();
  });
}

/**
 * Fetch and analyze real vehicle state
 */
async function fetchVehicleState() {
  console.log("\n🔍 STEP 1: Current Vehicle State");
  console.log("─────────────────────────────────");

  try {
    const state = await tessieRequest("/state");

    console.log("✅ Raw API Response Structure:");
    console.log("Keys:", Object.keys(state));

    // Extract vehicle state data
    const vehicleState = {
      timestamp: new Date().toISOString(),
      battery_level:
        state.charge_state?.battery_level || state.battery_level || 0,
      battery_range:
        state.charge_state?.battery_range || state.est_battery_range || 0,
      charging_state:
        state.charge_state?.charging_state || state.charging_state || "Unknown",
      latitude: state.drive_state?.latitude || state.latitude || 0,
      longitude: state.drive_state?.longitude || state.longitude || 0,
      speed: state.drive_state?.speed || state.speed || 0,
      odometer: state.vehicle_state?.odometer || state.odometer || 0,
      inside_temp: state.climate_state?.inside_temp || state.inside_temp,
      outside_temp: state.climate_state?.outside_temp || state.outside_temp,
      locked: state.vehicle_state?.locked || state.locked || false,
      shift_state: state.drive_state?.shift_state || state.shift_state,
    };

    console.log("📊 Parsed Vehicle State:");
    console.log(
      `   Battery: ${vehicleState.battery_level}% (${vehicleState.battery_range} mi range)`
    );
    console.log(`   Charging: ${vehicleState.charging_state}`);
    console.log(
      `   Location: ${vehicleState.latitude}, ${vehicleState.longitude}`
    );
    console.log(`   Odometer: ${vehicleState.odometer} miles`);
    console.log(`   Speed: ${vehicleState.speed} mph`);

    // Save raw state for analysis
    fs.writeFileSync("real-vehicle-state.json", JSON.stringify(state, null, 2));
    console.log("💾 Raw state saved to: real-vehicle-state.json");

    return vehicleState;
  } catch (error) {
    console.error("❌ Vehicle state fetch failed:", error.message);
    throw error;
  }
}

/**
 * Fetch and analyze real driving data
 */
async function fetchDrives() {
  console.log("\n🚗 STEP 2: Historical Driving Data");
  console.log("─────────────────────────────────────");

  try {
    // Fetch drives since journey start
    const since = encodeURIComponent(config.journeyStartDate);
    const drives = await tessieRequest(`/drives?since=${since}&limit=50`);

    console.log("✅ Drives API Response:");
    console.log(`   Total drives: ${drives.results?.length || 0}`);

    if (drives.results && drives.results.length > 0) {
      const sampleDrive = drives.results[0];
      console.log("📊 Sample Drive Structure:");
      console.log("Keys:", Object.keys(sampleDrive));

      // Parse first few drives
      const parsedDrives = drives.results.slice(0, 5).map((drive) => ({
        tessie_id: drive.id,
        started_at: drive.started_at,
        ended_at: drive.ended_at,
        start_address: drive.start_address,
        end_address: drive.end_address,
        start_latitude:
          drive.start_latitude || drive.start_location?.latitude || 0,
        start_longitude:
          drive.start_longitude || drive.start_location?.longitude || 0,
        end_latitude: drive.end_latitude || drive.end_location?.latitude || 0,
        end_longitude:
          drive.end_longitude || drive.end_location?.longitude || 0,
        distance_miles: drive.distance_miles || 0,
        duration_minutes: drive.duration_minutes || 0,
        energy_used_kwh: drive.energy_used_kwh || 0,
        average_speed: drive.average_speed || 0,
        start_battery_level: drive.start_battery_level || 0,
        end_battery_level: drive.end_battery_level || 0,
      }));

      console.log("📋 Sample Parsed Drives:");
      parsedDrives.forEach((drive, i) => {
        console.log(
          `   ${i + 1}. ${drive.distance_miles} mi, ${
            drive.duration_minutes
          } min`
        );
        console.log(`      ${drive.start_address} → ${drive.end_address}`);
      });

      // Save raw drives for analysis
      fs.writeFileSync(
        "real-drives-sample.json",
        JSON.stringify(drives.results.slice(0, 10), null, 2)
      );
      console.log("💾 Sample drives saved to: real-drives-sample.json");
    }

    return drives.results || [];
  } catch (error) {
    console.error("❌ Drives fetch failed:", error.message);
    throw error;
  }
}

/**
 * Fetch and analyze real charging data
 */
async function fetchCharges() {
  console.log("\n🔋 STEP 3: Historical Charging Data");
  console.log("─────────────────────────────────────");

  try {
    // Fetch charges since journey start
    const since = encodeURIComponent(config.journeyStartDate);
    const charges = await tessieRequest(`/charges?since=${since}&limit=50`);

    console.log("✅ Charges API Response:");
    console.log(`   Total charges: ${charges.results?.length || 0}`);

    if (charges.results && charges.results.length > 0) {
      const sampleCharge = charges.results[0];
      console.log("📊 Sample Charge Structure:");
      console.log("Keys:", Object.keys(sampleCharge));

      // Parse first few charges
      const parsedCharges = charges.results.slice(0, 5).map((charge) => ({
        tessie_id: charge.id,
        started_at: charge.started_at,
        ended_at: charge.ended_at,
        location: charge.location,
        latitude: charge.latitude || charge.location_data?.latitude || 0,
        longitude: charge.longitude || charge.location_data?.longitude || 0,
        charger_type: charge.charger_type || "Unknown",
        energy_added_kwh: charge.energy_added_kwh || 0,
        cost_usd: charge.cost_usd || 0,
        duration_minutes: charge.duration_minutes || 0,
        start_battery_level: charge.start_battery_level || 0,
        end_battery_level: charge.end_battery_level || 0,
      }));

      console.log("📋 Sample Parsed Charges:");
      parsedCharges.forEach((charge, i) => {
        console.log(
          `   ${i + 1}. ${charge.energy_added_kwh} kWh, $${charge.cost_usd}`
        );
        console.log(`      ${charge.location} (${charge.charger_type})`);
      });

      // Save raw charges for analysis
      fs.writeFileSync(
        "real-charges-sample.json",
        JSON.stringify(charges.results.slice(0, 10), null, 2)
      );
      console.log("💾 Sample charges saved to: real-charges-sample.json");
    }

    return charges.results || [];
  } catch (error) {
    console.error("❌ Charges fetch failed:", error.message);
    throw error;
  }
}

/**
 * Generate SQL insert statements for D1 database
 */
function generateSQLInserts(vehicleState, drives, charges) {
  console.log("\n💾 STEP 4: Generate D1 Database Inserts");
  console.log("────────────────────────────────────────");

  let sql = "-- REAL TESLA DATA INSERT STATEMENTS\n";
  sql += "-- Generated from Tessie API on " + new Date().toISOString() + "\n\n";

  // Vehicle state insert
  sql += "-- Current Vehicle State\n";
  sql += `INSERT OR REPLACE INTO vehicle_state (
    vehicle_id, battery_level, battery_range, charging_state,
    latitude, longitude, speed, odometer, inside_temp, outside_temp,
    locked, shift_state, timestamp, updated_at
  ) VALUES (
    '${config.vehicleIdDB}',
    ${vehicleState.battery_level},
    ${vehicleState.battery_range},
    '${vehicleState.charging_state}',
    ${vehicleState.latitude},
    ${vehicleState.longitude},
    ${vehicleState.speed},
    ${vehicleState.odometer},
    ${vehicleState.inside_temp || "NULL"},
    ${vehicleState.outside_temp || "NULL"},
    ${vehicleState.locked ? 1 : 0},
    '${vehicleState.shift_state || ""}',
    '${vehicleState.timestamp}',
    datetime('now')
  );\n\n`;

  // Sample drives inserts (first 10)
  if (drives.length > 0) {
    sql += "-- Sample Drives (first 10)\n";
    drives.slice(0, 10).forEach((drive) => {
      sql += `INSERT OR IGNORE INTO drives (
        tessie_id, vehicle_id, journey_id, started_at, ended_at,
        start_address, end_address, start_latitude, start_longitude,
        end_latitude, end_longitude, distance_miles, duration_minutes,
        energy_used_kwh, average_speed, start_battery_level, end_battery_level
      ) VALUES (
        ${drive.id || "NULL"},
        '${config.vehicleIdDB}',
        '${config.journeyId}',
        '${drive.started_at || ""}',
        '${drive.ended_at || ""}',
        '${(drive.start_address || "").replace(/'/g, "''")}',
        '${(drive.end_address || "").replace(/'/g, "''")}',
        ${drive.start_latitude || drive.start_location?.latitude || 0},
        ${drive.start_longitude || drive.start_location?.longitude || 0},
        ${drive.end_latitude || drive.end_location?.latitude || 0},
        ${drive.end_longitude || drive.end_location?.longitude || 0},
        ${drive.distance_miles || 0},
        ${drive.duration_minutes || 0},
        ${drive.energy_used_kwh || 0},
        ${drive.average_speed || 0},
        ${drive.start_battery_level || 0},
        ${drive.end_battery_level || 0}
      );\n`;
    });
    sql += "\n";
  }

  // Sample charges inserts (first 10)
  if (charges.length > 0) {
    sql += "-- Sample Charges (first 10)\n";
    charges.slice(0, 10).forEach((charge) => {
      sql += `INSERT OR IGNORE INTO charges (
        tessie_id, vehicle_id, journey_id, started_at, ended_at,
        location, latitude, longitude, charger_type,
        energy_added_kwh, cost_usd, duration_minutes,
        start_battery_level, end_battery_level
      ) VALUES (
        ${charge.id || "NULL"},
        '${config.vehicleIdDB}',
        '${config.journeyId}',
        '${charge.started_at || ""}',
        '${charge.ended_at || ""}',
        '${(charge.location || "").replace(/'/g, "''")}',
        ${charge.latitude || charge.location_data?.latitude || 0},
        ${charge.longitude || charge.location_data?.longitude || 0},
        '${charge.charger_type || "Unknown"}',
        ${charge.energy_added_kwh || 0},
        ${charge.cost_usd || 0},
        ${charge.duration_minutes || 0},
        ${charge.start_battery_level || 0},
        ${charge.end_battery_level || 0}
      );\n`;
    });
  }

  // Save SQL file
  fs.writeFileSync("real-data-inserts.sql", sql);
  console.log("✅ SQL inserts generated: real-data-inserts.sql");
  console.log(`   Vehicle state: 1 record`);
  console.log(`   Sample drives: ${Math.min(drives.length, 10)} records`);
  console.log(`   Sample charges: ${Math.min(charges.length, 10)} records`);

  return sql;
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Validate configuration
    if (!config.tessieToken) {
      throw new Error("TESSIE_API_TOKEN not found in .env file");
    }

    console.log(`🔑 Using API token: ${config.tessieToken.substring(0, 8)}...`);
    console.log(`🚗 Vehicle ID: ${config.vehicleId}`);
    console.log(`📅 Journey start: ${config.journeyStartDate}`);

    // Fetch real data
    const vehicleState = await fetchVehicleState();
    const drives = await fetchDrives();
    const charges = await fetchCharges();

    // Generate SQL for D1 database
    generateSQLInserts(vehicleState, drives, charges);

    console.log("\n═══════════════════════════════════════════");
    console.log("🎯 REAL DATA ANALYSIS COMPLETE");
    console.log("═══════════════════════════════════════════");
    console.log("📁 Files generated:");
    console.log("   • real-vehicle-state.json - Current state");
    console.log("   • real-drives-sample.json - Sample drives");
    console.log("   • real-charges-sample.json - Sample charges");
    console.log("   • real-data-inserts.sql - D1 insert statements");
    console.log("");
    console.log("🚀 NEXT STEPS:");
    console.log("1. Review the generated SQL file");
    console.log(
      "2. Run: npx wrangler d1 execute tesla-journey-tracker --local --file=real-data-inserts.sql"
    );
    console.log("3. Test component APIs with real data");
    console.log("4. Deploy full ingestion worker");
  } catch (error) {
    console.error("\n❌ REAL DATA INGESTION FAILED:", error.message);
    process.exit(1);
  }
}

// Run the script
main();
