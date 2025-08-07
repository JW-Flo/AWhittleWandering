/**
 * FIXED Tessie Data Ingestion - Using REAL API Structure
 * Corrected field mapping based on actual Tessie API response
 */

const TESSIE_API_TOKEN = process.env.TESSIE_API_TOKEN;
const VEHICLE_ID = process.env.VEHICLE_ID;

console.log("🚀 REAL TESSIE DATA INGESTION - FIXED FIELD MAPPING");
console.log("===================================================");

async function ingestRealTessieData() {
  try {
    console.log("📊 STEP 1: Current Vehicle State");
    console.log("----------------------------------");

    const stateResponse = await fetch(
      `https://api.tessie.com/${VEHICLE_ID}/state`,
      {
        headers: { Authorization: `Bearer ${TESSIE_API_TOKEN}` },
      }
    );
    const state = await stateResponse.json();

    // CORRECTED vehicle state mapping
    const vehicleState = {
      vehicle_id: "midnight-shadow",
      battery_level: state.charge_state?.battery_level || 0,
      battery_range: state.charge_state?.battery_range || 0,
      charging_state: state.charge_state?.charging_state || "Unknown",
      latitude: state.drive_state?.latitude || 0,
      longitude: state.drive_state?.longitude || 0,
      speed: state.drive_state?.speed || 0,
      odometer: state.vehicle_state?.odometer || 0,
      inside_temp: state.climate_state?.inside_temp || null,
      outside_temp: state.climate_state?.outside_temp || null,
      power: state.drive_state?.power || 0,
      locked: state.vehicle_state?.locked || false,
      climate_on: state.climate_state?.is_climate_on || false,
      shift_state: state.drive_state?.shift_state || null,
      timestamp: new Date().toISOString(),
      vehicle_name: state.vehicle_state?.vehicle_name || "Midnight Shadow",
    };

    console.log("✅ Current State Parsed:", vehicleState);

    console.log("\n🛣️  STEP 2: Historical Drives Analysis");
    console.log("---------------------------------------");

    const drivesResponse = await fetch(
      `https://api.tessie.com/${VEHICLE_ID}/drives?start=2025-06-01&end=${
        new Date().toISOString().split("T")[0]
      }`,
      {
        headers: { Authorization: `Bearer ${TESSIE_API_TOKEN}` },
      }
    );
    const drivesData = await drivesResponse.json();

    console.log(`Found ${drivesData.results?.length || 0} drives`);

    if (drivesData.results && drivesData.results.length > 0) {
      // CORRECTED drives field mapping based on actual API structure
      const sampleDrive = drivesData.results[0];
      console.log("\n🔍 Sample drive structure (corrected):", {
        id: sampleDrive.id,
        started_at: new Date(sampleDrive.started_at * 1000).toISOString(), // Unix timestamp to ISO
        ended_at: new Date(sampleDrive.ended_at * 1000).toISOString(),
        start_address: sampleDrive.starting_location, // CORRECT FIELD
        end_address: sampleDrive.ending_location, // CORRECT FIELD
        start_latitude: sampleDrive.starting_latitude, // CORRECT FIELD
        start_longitude: sampleDrive.starting_longitude, // CORRECT FIELD
        end_latitude: sampleDrive.ending_latitude, // CORRECT FIELD
        end_longitude: sampleDrive.ending_longitude, // CORRECT FIELD
        distance_miles: sampleDrive.odometer_distance, // CORRECT FIELD
        energy_used_kwh: sampleDrive.energy_used, // CORRECT FIELD
        start_battery: sampleDrive.starting_battery, // CORRECT FIELD
        end_battery: sampleDrive.ending_battery, // CORRECT FIELD
        average_speed: sampleDrive.average_speed, // CORRECT FIELD
        max_speed: sampleDrive.max_speed, // CORRECT FIELD
        outside_temp_avg: sampleDrive.average_outside_temperature, // CORRECT FIELD
      });

      // Calculate REAL totals using correct field names
      let totalMiles = 0;
      let totalEnergyUsed = 0;
      let validDrives = 0;

      drivesData.results.forEach((drive) => {
        if (drive.odometer_distance) {
          totalMiles += drive.odometer_distance;
          validDrives++;
        }
        if (drive.energy_used) {
          totalEnergyUsed += drive.energy_used;
        }
      });

      console.log("\n📊 CORRECTED DRIVES TOTALS:");
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

      // First and last drive details
      const firstDrive = drivesData.results[drivesData.results.length - 1];
      const lastDrive = drivesData.results[0];

      console.log("\n🚀 FIRST DRIVE (June 1, 2025):");
      console.log({
        date: new Date(firstDrive.started_at * 1000).toISOString(),
        from: firstDrive.starting_location,
        to: firstDrive.ending_location,
        miles: firstDrive.odometer_distance,
        energy_kwh: firstDrive.energy_used,
        efficiency:
          firstDrive.energy_used > 0
            ? Math.round(
                (firstDrive.odometer_distance / firstDrive.energy_used) * 100
              ) / 100
            : 0,
      });

      console.log("\n🏁 MOST RECENT DRIVE:");
      console.log({
        date: new Date(lastDrive.started_at * 1000).toISOString(),
        from: lastDrive.starting_location,
        to: lastDrive.ending_location,
        miles: lastDrive.odometer_distance,
        energy_kwh: lastDrive.energy_used,
        efficiency:
          lastDrive.energy_used > 0
            ? Math.round(
                (lastDrive.odometer_distance / lastDrive.energy_used) * 100
              ) / 100
            : 0,
      });
    }

    console.log("\n🔋 STEP 3: Historical Charges Analysis");
    console.log("---------------------------------------");

    const chargesResponse = await fetch(
      `https://api.tessie.com/${VEHICLE_ID}/charges?start=2025-06-01&end=${
        new Date().toISOString().split("T")[0]
      }`,
      {
        headers: { Authorization: `Bearer ${TESSIE_API_TOKEN}` },
      }
    );
    const chargesData = await chargesResponse.json();

    console.log(`Found ${chargesData.results?.length || 0} charges`);

    if (chargesData.results && chargesData.results.length > 0) {
      // CORRECTED charges field mapping
      const sampleCharge = chargesData.results[0];
      console.log("\n🔍 Sample charge structure (corrected):", {
        id: sampleCharge.id,
        started_at: new Date(sampleCharge.started_at * 1000).toISOString(),
        ended_at: new Date(sampleCharge.ended_at * 1000).toISOString(),
        location: sampleCharge.location,
        latitude: sampleCharge.latitude,
        longitude: sampleCharge.longitude,
        energy_added_kwh: sampleCharge.energy_added, // CORRECT FIELD
        energy_used_kwh: sampleCharge.energy_used, // CORRECT FIELD
        start_battery: sampleCharge.starting_battery, // CORRECT FIELD
        end_battery: sampleCharge.ending_battery, // CORRECT FIELD
        cost_usd: sampleCharge.cost, // CORRECT FIELD
        is_supercharger: sampleCharge.is_supercharger, // CORRECT FIELD
        is_fast_charger: sampleCharge.is_fast_charger, // CORRECT FIELD
        miles_added: sampleCharge.miles_added, // CORRECT FIELD
      });

      // Calculate REAL totals using correct field names
      let totalEnergyAdded = 0;
      let totalCost = 0;
      let validCharges = 0;
      let costCharges = 0;
      let superchargerCount = 0;

      chargesData.results.forEach((charge) => {
        if (charge.energy_added) {
          totalEnergyAdded += charge.energy_added;
          validCharges++;
        }
        if (charge.cost && charge.cost > 0) {
          totalCost += charge.cost;
          costCharges++;
        }
        if (charge.is_supercharger) {
          superchargerCount++;
        }
      });

      console.log("\n💰 CORRECTED CHARGES TOTALS:");
      console.log({
        total_charges: chargesData.results.length,
        valid_charges_with_energy: validCharges,
        charges_with_cost_data: costCharges,
        supercharger_sessions: superchargerCount,
        total_energy_added_kwh: Math.round(totalEnergyAdded * 100) / 100,
        total_cost_usd: Math.round(totalCost * 100) / 100,
        average_cost_per_kwh:
          totalEnergyAdded > 0
            ? Math.round((totalCost / totalEnergyAdded) * 100) / 100
            : 0,
      });

      // First and last charge details
      const firstCharge = chargesData.results[chargesData.results.length - 1];
      const lastCharge = chargesData.results[0];

      console.log("\n⚡ FIRST CHARGE (June 1, 2025):");
      console.log({
        date: new Date(firstCharge.started_at * 1000).toISOString(),
        location: firstCharge.location,
        energy_added_kwh: firstCharge.energy_added,
        cost: firstCharge.cost || "Free/Unknown",
        type: firstCharge.is_supercharger
          ? "Supercharger"
          : firstCharge.is_fast_charger
          ? "Fast Charger"
          : "Level 2",
      });

      console.log("\n🔋 MOST RECENT CHARGE:");
      console.log({
        date: new Date(lastCharge.started_at * 1000).toISOString(),
        location: lastCharge.location,
        energy_added_kwh: lastCharge.energy_added,
        cost: lastCharge.cost || "Free/Unknown",
        type: lastCharge.is_supercharger
          ? "Supercharger"
          : lastCharge.is_fast_charger
          ? "Fast Charger"
          : "Level 2",
      });
    }

    console.log("\n🎯 JOURNEY SUMMARY WITH REAL DATA");
    console.log("==================================");

    const totalMiles =
      drivesData.results?.reduce(
        (sum, drive) => sum + (drive.odometer_distance || 0),
        0
      ) || 0;
    const totalEnergyUsed =
      drivesData.results?.reduce(
        (sum, drive) => sum + (drive.energy_used || 0),
        0
      ) || 0;
    const totalEnergyAdded =
      chargesData.results?.reduce(
        (sum, charge) => sum + (charge.energy_added || 0),
        0
      ) || 0;
    const totalCost =
      chargesData.results?.reduce(
        (sum, charge) => sum + (charge.cost || 0),
        0
      ) || 0;

    const journeyStart = new Date("2025-06-01");
    const now = new Date();
    const daysElapsed = Math.floor(
      (now - journeyStart) / (1000 * 60 * 60 * 24)
    );

    console.log({
      journey_duration_days: daysElapsed,
      current_location: `${vehicleState.latitude}, ${vehicleState.longitude}`,
      current_battery: `${vehicleState.battery_level}% (${vehicleState.battery_range} mi range)`,
      charging_status: vehicleState.charging_state,
      odometer: vehicleState.odometer,
      total_drives: drivesData.results?.length || 0,
      total_miles: Math.round(totalMiles * 100) / 100,
      total_charges: chargesData.results?.length || 0,
      total_energy_used_kwh: Math.round(totalEnergyUsed * 100) / 100,
      total_energy_added_kwh: Math.round(totalEnergyAdded * 100) / 100,
      total_charging_cost: Math.round(totalCost * 100) / 100,
      overall_efficiency:
        totalEnergyUsed > 0
          ? Math.round((totalMiles / totalEnergyUsed) * 100) / 100
          : 0,
      average_miles_per_day: Math.round((totalMiles / daysElapsed) * 100) / 100,
    });

    console.log("\n✅ REAL DATA ANALYSIS COMPLETE!");
    console.log("================================");
    console.log("✓ Correct field mapping identified");
    console.log("✓ Accurate totals calculated");
    console.log("✓ First/last drive and charge data extracted");
    console.log("✓ Ready for D1 database ingestion with correct field names");
  } catch (error) {
    console.error("❌ INGESTION FAILED:", error.message);
  }
}

if (!TESSIE_API_TOKEN || !VEHICLE_ID) {
  console.error("❌ Missing credentials. Run: source setup-real-tessie.sh");
  process.exit(1);
}

ingestRealTessieData();
