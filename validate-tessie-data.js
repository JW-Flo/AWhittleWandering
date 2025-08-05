/**
 * TESSIE DATA VALIDATOR - Get EXACT correct totals
 * We need to verify every single field before D1 ingestion
 */

const TESSIE_API_TOKEN = process.env.TESSIE_API_TOKEN;

if (!TESSIE_API_TOKEN) {
  console.error("❌ Missing TESSIE_API_TOKEN. Please set it in environment or .env file");
  process.exit(1);
}

console.log("🔍 TESSIE DATA VALIDATION - DETAILED ANALYSIS");
console.log("=".repeat(60));

async function validateTessieData() {
  try {
    // 1. Get vehicle list first (no vehicle ID needed)
    console.log("\n🚗 STEP 1: Get Vehicle List");
    console.log("-".repeat(40));

    const vehiclesResponse = await fetch('https://api.tessie.com/vehicles', {
      headers: { 'Authorization': `Bearer ${TESSIE_API_TOKEN}` }
    });

    if (!vehiclesResponse.ok) {
      throw new Error(`Vehicles API failed: ${vehiclesResponse.status} - ${await vehiclesResponse.text()}`);
    }

    const vehicles = await vehiclesResponse.json();
    console.log("Found vehicles:", vehicles.length);
    
    if (!vehicles || vehicles.length === 0) {
      throw new Error("No vehicles found in account");
    }

    const vehicle = vehicles[0]; // Use first vehicle
    const vehicleId = vehicle.id;
    console.log("Using vehicle:", vehicle.display_name || vehicle.vin, "ID:", vehicleId);

    // 2. Get current state for verification
    console.log("\n📊 STEP 2: Current Vehicle State");
    console.log("-".repeat(40));

    const stateResponse = await fetch(`https://api.tessie.com/${vehicleId}/state`, {
      headers: { 'Authorization': `Bearer ${TESSIE_API_TOKEN}` }
    });

    if (!stateResponse.ok) {
      throw new Error(`State API failed: ${stateResponse.status} - ${await stateResponse.text()}`);
    }

    const state = await stateResponse.json();
    console.log("Battery Level:", state.charge_state?.battery_level);
    console.log("Charging State:", state.charge_state?.charging_state);
    console.log("Current Location:", state.drive_state?.latitude, state.drive_state?.longitude);
    console.log("Odometer:", state.vehicle_state?.odometer);

    // 3. Get SINGLE drive to check data structure
    console.log("\n🛣️ STEP 3: Single Drive Data Structure");
    console.log("-".repeat(40));

    const singleDriveResponse = await fetch(`https://api.tessie.com/${vehicleId}/drives?limit=1`, {
      headers: { 'Authorization': `Bearer ${TESSIE_API_TOKEN}` }
    });

    const singleDriveData = await singleDriveResponse.json();
    const sampleDrive = singleDriveData.results?.[0];

    if (sampleDrive) {
      console.log("📋 DRIVE STRUCTURE:");
      console.log("  - id:", sampleDrive.id);
      console.log("  - distance_miles:", sampleDrive.distance_miles);
      console.log("  - distance_mi:", sampleDrive.distance_mi); // Alternative field?
      console.log("  - started_at:", sampleDrive.started_at);
      console.log("  - ended_at:", sampleDrive.ended_at);
      console.log("  - start_address:", sampleDrive.start_address);
      console.log("  - end_address:", sampleDrive.end_address);
      console.log("  - energy_used_kwh:", sampleDrive.energy_used_kwh);
      console.log("  - energy_used:", sampleDrive.energy_used); // Alternative field?
      console.log("  - ALL FIELDS:", Object.keys(sampleDrive));
    }

    // 4. Get SINGLE charge to check data structure
    console.log("\n⚡ STEP 4: Single Charge Data Structure");
    console.log("-".repeat(40));

    const singleChargeResponse = await fetch(`https://api.tessie.com/${vehicleId}/charges?limit=1`, {
      headers: { 'Authorization': `Bearer ${TESSIE_API_TOKEN}` }
    });

    const singleChargeData = await singleChargeResponse.json();
    const sampleCharge = singleChargeData.results?.[0];

    if (sampleCharge) {
      console.log("📋 CHARGE STRUCTURE:");
      console.log("  - id:", sampleCharge.id);
      console.log("  - energy_added_kwh:", sampleCharge.energy_added_kwh);
      console.log("  - energy_added:", sampleCharge.energy_added); // Alternative field?
      console.log("  - cost_usd:", sampleCharge.cost_usd);
      console.log("  - cost:", sampleCharge.cost); // Alternative field?
      console.log("  - location:", sampleCharge.location);
      console.log("  - charger_type:", sampleCharge.charger_type);
      console.log("  - ALL FIELDS:", Object.keys(sampleCharge));
    }

    // 5. Get drives since June 1 with SMALL batches to verify totals
    console.log("\n🔢 STEP 5: Manual Total Calculation (Small Batch)");
    console.log("-".repeat(40));

    const since = "2025-06-01T00:00:00Z";
    let totalMiles = 0;
    let totalEnergyUsed = 0;
    let driveCount = 0;
    let page = 1;
    const limit = 100; // Small batches

    console.log("Calculating totals in batches of", limit, "...");

    while (page <= 3) { // Only check first 3 pages for validation
      const drivesResponse = await fetch(
        `https://api.tessie.com/${vehicleId}/drives?since=${since}&limit=${limit}&page=${page}`,
        { headers: { 'Authorization': `Bearer ${TESSIE_API_TOKEN}` } }
      );

      const drivesData = await drivesResponse.json();
      const drives = drivesData.results || [];

      console.log(`📄 Page ${page}: ${drives.length} drives`);

      if (drives.length === 0) break;

      for (const drive of drives) {
        driveCount++;

        // Try multiple possible distance fields
        const distance =
          drive.distance_miles || drive.distance_mi || drive.distance || 0;
        const energy = drive.energy_used_kwh || drive.energy_used || 0;

        totalMiles += distance;
        totalEnergyUsed += energy;

        if (driveCount <= 5) {
          console.log(
            `  Drive ${driveCount}: ${distance} miles, ${energy} kWh`
          );
        }
      }

      page++;
    }

    console.log("\n📊 MANUAL CALCULATION RESULTS (First 300 drives):");
    console.log("  - Drives counted:", driveCount);
    console.log("  - Total miles:", totalMiles.toFixed(2));
    console.log("  - Total energy (kWh):", totalEnergyUsed.toFixed(2));
    console.log(
      "  - Avg miles per drive:",
      (totalMiles / driveCount).toFixed(2)
    );

    // 6. Compare with API stats
    console.log("\n⚖️ STEP 6: Compare with API Stats");
    console.log("-".repeat(40));

    const statsResponse = await fetch(
      `https://api.tessie.com/${vehicleId}/stats?since=${since}`,
      { headers: { 'Authorization': `Bearer ${TESSIE_API_TOKEN}` } }
    );

    const stats = await statsResponse.json();
    console.log("📊 API STATS:");
    console.log("  - total_drives:", stats.total_drives);
    console.log("  - total_miles:", stats.total_miles);
    console.log("  - total_energy_used_kwh:", stats.total_energy_used_kwh);
    console.log("  - avg_miles_per_day:", stats.average_miles_per_day);

    // 7. VERDICT
    console.log("\n🎯 ANALYSIS VERDICT:");
    console.log("=".repeat(40));

    if (stats.total_miles > 50000) {
      console.log("❌ TOTAL MILES SEEMS TOO HIGH!");
      console.log("   - API reports:", stats.total_miles, "miles");
      console.log(
        "   - That's",
        (stats.total_miles / 65).toFixed(0),
        "miles/day average"
      );
      console.log("   - Need to check date filtering or API parameters");
    } else {
      console.log("✅ Total miles looks reasonable");
    }

    if (driveCount * 10 < stats.total_drives) {
      console.log("❌ DRIVE COUNT DISCREPANCY!");
      console.log("   - Manual count (300):", driveCount);
      console.log("   - API total:", stats.total_drives);
    }
  } catch (error) {
    console.error("❌ VALIDATION FAILED:", error.message);
  }
}

validateTessieData();
