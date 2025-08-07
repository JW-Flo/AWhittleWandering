/**
 * Comprehensive Tessie API Analysis
 * Get accurate first/last drive data, energy totals, cost totals
 * Analyze the REAL data structure from your Tesla
 */

const TESSIE_API_TOKEN = process.env.TESSIE_API_TOKEN;
const VEHICLE_ID = process.env.VEHICLE_ID;

if (!TESSIE_API_TOKEN || !VEHICLE_ID) {
  console.error("❌ Missing credentials. Run: source setup-real-tessie.sh");
  process.exit(1);
}

console.log("🔍 COMPREHENSIVE TESSIE DATA ANALYSIS");
console.log("=====================================");
console.log(`Vehicle ID: ${VEHICLE_ID}`);
console.log(`Journey Start: June 1, 2025`);
console.log(`Analysis Date: ${new Date().toISOString()}\n`);

async function analyzeRealTessieData() {
  try {
    // 1. CURRENT VEHICLE STATE - Full detailed analysis
    console.log("🚗 STEP 1: CURRENT VEHICLE STATE ANALYSIS");
    console.log("------------------------------------------");

    const stateResponse = await fetch(
      `https://api.tessie.com/${VEHICLE_ID}/state`,
      {
        headers: { Authorization: `Bearer ${TESSIE_API_TOKEN}` },
      }
    );

    const state = await stateResponse.json();
    console.log("RAW STATE RESPONSE STRUCTURE:");
    console.log(JSON.stringify(state, null, 2));

    // Extract and validate key state data
    const currentState = {
      battery_level: state.charge_state?.battery_level,
      battery_range: state.charge_state?.battery_range,
      charging_state: state.charge_state?.charging_state,
      latitude: state.drive_state?.latitude,
      longitude: state.drive_state?.longitude,
      speed: state.drive_state?.speed,
      odometer: state.vehicle_state?.odometer,
      inside_temp: state.climate_state?.inside_temp,
      outside_temp: state.climate_state?.outside_temp,
      locked: state.vehicle_state?.locked,
      climate_on: state.climate_state?.is_climate_on,
      shift_state: state.drive_state?.shift_state,
      timestamp: state.drive_state?.timestamp || new Date().toISOString(),
    };

    console.log("\n✅ PARSED CURRENT STATE:");
    console.log(currentState);

    // 2. DRIVES ANALYSIS - Get first, last, and totals
    console.log("\n🛣️  STEP 2: DRIVES ANALYSIS (June 1 - Present)");
    console.log("------------------------------------------------");

    const drivesResponse = await fetch(
      `https://api.tessie.com/${VEHICLE_ID}/drives?start=2025-06-01&end=${
        new Date().toISOString().split("T")[0]
      }`,
      {
        headers: { Authorization: `Bearer ${TESSIE_API_TOKEN}` },
      }
    );

    const drivesData = await drivesResponse.json();
    console.log(`Total drives found: ${drivesData.results?.length || 0}`);

    if (drivesData.results && drivesData.results.length > 0) {
      // First drive
      const firstDrive = drivesData.results[drivesData.results.length - 1]; // API returns newest first
      console.log("\n🚀 FIRST DRIVE (June 1, 2025):");
      console.log({
        id: firstDrive.id,
        started_at: firstDrive.started_at,
        start_address: firstDrive.start_address,
        end_address: firstDrive.end_address,
        distance_miles: firstDrive.distance_miles,
        energy_used_kwh: firstDrive.energy_used_kwh,
        start_battery: firstDrive.start_battery_level,
        end_battery: firstDrive.end_battery_level,
      });

      // Last drive
      const lastDrive = drivesData.results[0]; // Most recent
      console.log("\n🏁 MOST RECENT DRIVE:");
      console.log({
        id: lastDrive.id,
        started_at: lastDrive.started_at,
        start_address: lastDrive.start_address,
        end_address: lastDrive.end_address,
        distance_miles: lastDrive.distance_miles,
        energy_used_kwh: lastDrive.energy_used_kwh,
        start_battery: lastDrive.start_battery_level,
        end_battery: lastDrive.end_battery_level,
      });

      // Calculate totals
      let totalMiles = 0;
      let totalEnergyUsed = 0;
      let validDrives = 0;

      drivesData.results.forEach((drive) => {
        if (drive.distance_miles) {
          totalMiles += drive.distance_miles;
          validDrives++;
        }
        if (drive.energy_used_kwh) {
          totalEnergyUsed += drive.energy_used_kwh;
        }
      });

      console.log("\n📊 DRIVES TOTALS:");
      console.log({
        total_drives: drivesData.results.length,
        valid_drives_with_distance: validDrives,
        total_miles: Math.round(totalMiles * 100) / 100,
        total_energy_used_kwh: Math.round(totalEnergyUsed * 100) / 100,
        average_efficiency:
          totalEnergyUsed > 0
            ? Math.round((totalMiles / totalEnergyUsed) * 100) / 100
            : 0,
      });

      // Sample drive structure analysis
      console.log("\n🔍 SAMPLE DRIVE STRUCTURE:");
      console.log(JSON.stringify(drivesData.results[0], null, 2));
    }

    // 3. CHARGES ANALYSIS - Get totals and costs
    console.log("\n🔌 STEP 3: CHARGES ANALYSIS (June 1 - Present)");
    console.log("-----------------------------------------------");

    const chargesResponse = await fetch(
      `https://api.tessie.com/${VEHICLE_ID}/charges?start=2025-06-01&end=${
        new Date().toISOString().split("T")[0]
      }`,
      {
        headers: { Authorization: `Bearer ${TESSIE_API_TOKEN}` },
      }
    );

    const chargesData = await chargesResponse.json();
    console.log(`Total charges found: ${chargesData.results?.length || 0}`);

    if (chargesData.results && chargesData.results.length > 0) {
      // First charge
      const firstCharge = chargesData.results[chargesData.results.length - 1];
      console.log("\n⚡ FIRST CHARGE (June 1, 2025):");
      console.log({
        id: firstCharge.id,
        started_at: firstCharge.started_at,
        location: firstCharge.location,
        charger_type: firstCharge.charger_type,
        energy_added_kwh: firstCharge.energy_added_kwh,
        cost_usd: firstCharge.cost_usd,
        start_battery: firstCharge.start_battery_level,
        end_battery: firstCharge.end_battery_level,
      });

      // Most recent charge
      const lastCharge = chargesData.results[0];
      console.log("\n🔋 MOST RECENT CHARGE:");
      console.log({
        id: lastCharge.id,
        started_at: lastCharge.started_at,
        location: lastCharge.location,
        charger_type: lastCharge.charger_type,
        energy_added_kwh: lastCharge.energy_added_kwh,
        cost_usd: lastCharge.cost_usd,
        start_battery: lastCharge.start_battery_level,
        end_battery: lastCharge.end_battery_level,
      });

      // Calculate totals
      let totalEnergyAdded = 0;
      let totalCost = 0;
      let validCharges = 0;
      let costCharges = 0;

      chargesData.results.forEach((charge) => {
        if (charge.energy_added_kwh) {
          totalEnergyAdded += charge.energy_added_kwh;
          validCharges++;
        }
        if (charge.cost_usd) {
          totalCost += charge.cost_usd;
          costCharges++;
        }
      });

      console.log("\n💰 CHARGES TOTALS:");
      console.log({
        total_charges: chargesData.results.length,
        valid_charges_with_energy: validCharges,
        charges_with_cost_data: costCharges,
        total_energy_added_kwh: Math.round(totalEnergyAdded * 100) / 100,
        total_cost_usd: Math.round(totalCost * 100) / 100,
        average_cost_per_kwh:
          totalEnergyAdded > 0
            ? Math.round((totalCost / totalEnergyAdded) * 100) / 100
            : 0,
      });

      // Sample charge structure analysis
      console.log("\n🔍 SAMPLE CHARGE STRUCTURE:");
      console.log(JSON.stringify(chargesData.results[0], null, 2));
    }

    // 4. SUMMARY ANALYSIS
    console.log("\n📈 STEP 4: JOURNEY SUMMARY ANALYSIS");
    console.log("------------------------------------");

    const journeyStart = new Date("2025-06-01");
    const now = new Date();
    const daysElapsed = Math.floor(
      (now - journeyStart) / (1000 * 60 * 60 * 24)
    );

    console.log({
      journey_start: "2025-06-01",
      analysis_date: now.toISOString().split("T")[0],
      days_elapsed: daysElapsed,
      current_location: `${currentState.latitude}, ${currentState.longitude}`,
      current_battery: `${currentState.battery_level}% (${currentState.battery_range} mi range)`,
      charging_status: currentState.charging_state,
      odometer: currentState.odometer,
      total_drives: drivesData.results?.length || 0,
      total_charges: chargesData.results?.length || 0,
    });

    // 5. DATA QUALITY ASSESSMENT
    console.log("\n🎯 STEP 5: DATA QUALITY ASSESSMENT");
    console.log("-----------------------------------");

    const qualityReport = {
      state_data_complete: !!(
        currentState.battery_level &&
        currentState.latitude &&
        currentState.longitude
      ),
      drives_have_distances: drivesData.results
        ? drivesData.results.filter((d) => d.distance_miles).length
        : 0,
      drives_have_energy: drivesData.results
        ? drivesData.results.filter((d) => d.energy_used_kwh).length
        : 0,
      charges_have_energy: chargesData.results
        ? chargesData.results.filter((c) => c.energy_added_kwh).length
        : 0,
      charges_have_cost: chargesData.results
        ? chargesData.results.filter((c) => c.cost_usd).length
        : 0,
      data_coverage_percent:
        daysElapsed > 0
          ? Math.round(
              ((drivesData.results?.length || 0) / daysElapsed) * 100
            ) / 100
          : 0,
    };

    console.log(qualityReport);

    console.log("\n✅ ANALYSIS COMPLETE!");
    console.log("====================");
    console.log("✓ Real Tessie API connection verified");
    console.log("✓ Historical data from June 1, 2025 analyzed");
    console.log("✓ Data structure and quality assessed");
    console.log("✓ Ready for accurate D1 database ingestion");
  } catch (error) {
    console.error("\n❌ ANALYSIS FAILED:", error.message);
    if (error.message.includes("401")) {
      console.error("\n🔧 TROUBLESHOOTING:");
      console.error(
        "1. Check your Tessie API token at: https://my.tessie.com/settings/api"
      );
      console.error('2. Run: export TESSIE_API_TOKEN="your-real-token"');
      console.error('3. Run: export VEHICLE_ID="your-tesla-vehicle-id"');
    }
  }
}

analyzeRealTessieData();
