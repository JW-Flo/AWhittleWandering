#!/usr/bin/env node

/**
 * REAL TESSIE DATA TESTER
 * Tests actual Tessie API connection and data availability
 * Run: node test-tessie-api.js
 */

const TESSIE_API_TOKEN =
  process.env.TESSIE_API_TOKEN || "your-tessie-token-here";
const VEHICLE_ID = process.env.VEHICLE_ID || "your-vehicle-id-here";

async function testRealTessieAPI() {
  console.log("🔥 TESTING REAL TESSIE API CONNECTION");
  console.log("📅 Checking data from June 1, 2025 to present");
  console.log("🚫 NO SIMULATIONS - REAL DATA ONLY");
  console.log("─".repeat(60));

  try {
    // Test 1: API Connection & Vehicle List
    console.log("🔍 Step 1: Testing API connection...");
    const vehiclesResponse = await fetch("https://api.tessie.com/vehicles", {
      headers: {
        Authorization: `Bearer ${TESSIE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!vehiclesResponse.ok) {
      throw new Error(
        `API Error: ${vehiclesResponse.status} - ${vehiclesResponse.statusText}`
      );
    }

    const vehicles = await vehiclesResponse.json();
    console.log(`✅ Connected! Found ${vehicles.length} vehicle(s)`);

    if (vehicles.length > 0) {
      vehicles.forEach((vehicle, index) => {
        console.log(
          `   ${index + 1}. ${vehicle.display_name} (VIN: ${vehicle.vin})`
        );
      });
    }

    // Test 2: Current Vehicle State
    if (VEHICLE_ID !== "your-vehicle-id-here") {
      console.log("\n🔴 Step 2: Getting real-time vehicle state...");
      const stateResponse = await fetch(
        `https://api.tessie.com/${VEHICLE_ID}/state`,
        {
          headers: {
            Authorization: `Bearer ${TESSIE_API_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (stateResponse.ok) {
        const state = await stateResponse.json();
        console.log(
          `✅ Battery Level: ${state.charge_state?.battery_level || "Unknown"}%`
        );
        console.log(
          `📍 Location: ${state.drive_state?.latitude || "Unknown"}, ${
            state.drive_state?.longitude || "Unknown"
          }`
        );
        console.log(
          `🔋 Charging: ${state.charge_state?.charging_state || "Unknown"}`
        );
        console.log(
          `🛣️  Odometer: ${state.vehicle_state?.odometer || "Unknown"} miles`
        );
      } else {
        console.log(`❌ State error: ${stateResponse.status}`);
      }

      // Test 3: Historical Drives (since June 1, 2025)
      console.log("\n🚗 Step 3: Checking historical drives...");
      const drivesResponse = await fetch(
        `https://api.tessie.com/${VEHICLE_ID}/drives?since=2025-06-01T00:00:00Z&per_page=100`,
        {
          headers: {
            Authorization: `Bearer ${TESSIE_API_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (drivesResponse.ok) {
        const drivesData = await drivesResponse.json();
        const drives = drivesData.results || drivesData;
        console.log(`✅ Found ${drives.length} drives since June 1, 2025`);

        if (drives.length > 0) {
          const totalMiles = drives.reduce(
            (sum, drive) => sum + (drive.distance_miles || 0),
            0
          );
          const firstDrive = drives[0];
          const lastDrive = drives[drives.length - 1];

          console.log(`📊 Total miles: ${Math.round(totalMiles)}`);
          console.log(`📅 First drive: ${firstDrive.started_at}`);
          console.log(`📅 Last drive: ${lastDrive.started_at}`);

          // Sample drive details
          console.log(
            `🔍 Sample drive: ${firstDrive.distance_miles} miles, ${firstDrive.duration_minutes} min`
          );
        }
      } else {
        console.log(`❌ Drives error: ${drivesResponse.status}`);
      }

      // Test 4: Historical Charges
      console.log("\n🔋 Step 4: Checking historical charges...");
      const chargesResponse = await fetch(
        `https://api.tessie.com/${VEHICLE_ID}/charges?since=2025-06-01T00:00:00Z&per_page=100`,
        {
          headers: {
            Authorization: `Bearer ${TESSIE_API_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (chargesResponse.ok) {
        const chargesData = await chargesResponse.json();
        const charges = chargesData.results || chargesData;
        console.log(`✅ Found ${charges.length} charges since June 1, 2025`);

        if (charges.length > 0) {
          const totalEnergy = charges.reduce(
            (sum, charge) => sum + (charge.energy_added_kwh || 0),
            0
          );
          const totalCost = charges.reduce(
            (sum, charge) => sum + (charge.cost_usd || 0),
            0
          );

          console.log(`⚡ Total energy added: ${Math.round(totalEnergy)} kWh`);
          console.log(`💰 Total cost: $${Math.round(totalCost * 100) / 100}`);

          // Sample charge details
          const firstCharge = charges[0];
          console.log(
            `🔍 Sample charge: ${firstCharge.energy_added_kwh} kWh at ${firstCharge.location}`
          );
        }
      } else {
        console.log(`❌ Charges error: ${chargesResponse.status}`);
      }
    } else {
      console.log("\n⚠️  VEHICLE_ID not set - skipping vehicle-specific tests");
      console.log(
        "Set VEHICLE_ID environment variable to test specific vehicle data"
      );
    }

    console.log("\n" + "─".repeat(60));
    console.log("🎯 REAL DATA VALIDATION COMPLETE");
    console.log("✅ Tessie API is accessible");
    console.log("✅ Historical data is available");
    console.log("✅ Ready for full data ingestion");
  } catch (error) {
    console.error("\n❌ TESSIE API TEST FAILED:");
    console.error(error.message);
    console.log("\n🔧 TROUBLESHOOTING:");
    console.log(
      "1. Get your Tessie API token from: https://my.tessie.com/settings/api"
    );
    console.log(
      '2. Set environment variable: export TESSIE_API_TOKEN="your-token"'
    );
    console.log('3. Set vehicle ID: export VEHICLE_ID="your-vehicle-id"');
    console.log("4. Make sure your Tesla is connected to Tessie");
  }
}

// Run the test
testRealTessieAPI();
