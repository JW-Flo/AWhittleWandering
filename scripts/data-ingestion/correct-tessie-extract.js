/**
 * CORRECTED TESSIE DATA EXTRACTOR
 * Using the EXACT field names from the API response
 */

const TESSIE_API_TOKEN = process.env.TESSIE_API_TOKEN;
const VEHICLE_ID = process.env.VEHICLE_ID;

console.log("🔧 CORRECTED TESSIE DATA EXTRACTION");
console.log("Using EXACT field names from API response");
console.log("=" * 50);

async function extractCorrectData() {
  try {
    const since = "2025-06-01T00:00:00Z";

    // 1. Get drives with CORRECT field mapping
    console.log("\n🛣️ EXTRACTING DRIVES WITH CORRECT FIELDS...");
    console.log("-".repeat(40));

    let totalMiles = 0;
    let totalEnergyUsed = 0;
    let driveCount = 0;
    let page = 1;
    const batchSize = 500;
    let sampleDrives = [];

    while (page <= 8) {
      // Get first ~4000 drives
      console.log(`📄 Processing page ${page}...`);

      const drivesResponse = await fetch(
        `https://api.tessie.com/${VEHICLE_ID}/drives?since=${since}&limit=${batchSize}&page=${page}`,
        { headers: { Authorization: `Bearer ${TESSIE_API_TOKEN}` } }
      );

      const drivesData = await drivesResponse.json();
      const drives = drivesData.results || [];

      if (drives.length === 0) break;

      for (const drive of drives) {
        driveCount++;

        // Use CORRECT field names from API
        const distance = drive.odometer_distance || 0; // ✅ Correct field
        const energy = drive.energy_used || 0; // ✅ Correct field

        totalMiles += distance;
        totalEnergyUsed += energy;

        // Collect samples for verification
        if (sampleDrives.length < 10) {
          sampleDrives.push({
            id: drive.id,
            date: new Date(drive.started_at * 1000).toISOString().split("T")[0],
            distance: distance,
            energy: energy,
            startLocation: drive.starting_location,
            endLocation: drive.ending_location,
            startBattery: drive.starting_battery,
            endBattery: drive.ending_battery,
          });
        }
      }

      page++;
    }

    console.log("\n📊 CORRECTED DRIVE TOTALS:");
    console.log("  - Total drives processed:", driveCount);
    console.log("  - Total miles:", totalMiles.toFixed(2));
    console.log("  - Total energy used:", totalEnergyUsed.toFixed(2), "kWh");
    console.log(
      "  - Average per drive:",
      (totalMiles / driveCount).toFixed(2),
      "miles"
    );
    console.log(
      "  - Overall efficiency:",
      (totalMiles / totalEnergyUsed).toFixed(2),
      "mi/kWh"
    );

    console.log("\n📋 SAMPLE DRIVES (Verification):");
    sampleDrives.forEach((drive, i) => {
      console.log(
        `  ${i + 1}. ${drive.date}: ${drive.distance} mi, ${drive.energy} kWh`
      );
      console.log(`     ${drive.startLocation} → ${drive.endLocation}`);
    });

    // 2. Get charges with CORRECT field mapping
    console.log("\n⚡ EXTRACTING CHARGES WITH CORRECT FIELDS...");
    console.log("-".repeat(40));

    let totalEnergyAdded = 0;
    let totalCost = 0;
    let chargeCount = 0;
    let sampleCharges = [];
    page = 1;

    while (page <= 3) {
      // Get first ~1500 charges
      console.log(`📄 Processing charges page ${page}...`);

      const chargesResponse = await fetch(
        `https://api.tessie.com/${VEHICLE_ID}/charges?since=${since}&limit=${batchSize}&page=${page}`,
        { headers: { Authorization: `Bearer ${TESSIE_API_TOKEN}` } }
      );

      const chargesData = await chargesResponse.json();
      const charges = chargesData.results || [];

      if (charges.length === 0) break;

      for (const charge of charges) {
        chargeCount++;

        // Use CORRECT field names
        const energyAdded = charge.energy_added || 0; // ✅ Correct field
        const cost = charge.cost || 0; // ✅ Correct field

        totalEnergyAdded += energyAdded;
        totalCost += cost;

        // Collect samples
        if (sampleCharges.length < 10) {
          sampleCharges.push({
            id: charge.id,
            date: new Date(charge.started_at * 1000)
              .toISOString()
              .split("T")[0],
            location: charge.location,
            energyAdded: energyAdded,
            cost: cost,
            isSupercharger: charge.is_supercharger,
            startBattery: charge.starting_battery,
            endBattery: charge.ending_battery,
          });
        }
      }

      page++;
    }

    console.log("\n📊 CORRECTED CHARGE TOTALS:");
    console.log("  - Total charges processed:", chargeCount);
    console.log("  - Total energy added:", totalEnergyAdded.toFixed(2), "kWh");
    console.log("  - Total cost:", totalCost.toFixed(2), "USD");
    console.log(
      "  - Average per charge:",
      (totalEnergyAdded / chargeCount).toFixed(2),
      "kWh"
    );
    console.log(
      "  - Average cost per kWh:",
      (totalCost / totalEnergyAdded).toFixed(3),
      "USD/kWh"
    );

    console.log("\n📋 SAMPLE CHARGES (Verification):");
    sampleCharges.forEach((charge, i) => {
      const type = charge.isSupercharger ? "⚡ SC" : "🏠 Home";
      console.log(
        `  ${i + 1}. ${charge.date}: ${charge.energyAdded} kWh, $${
          charge.cost
        } ${type}`
      );
      console.log(`     ${charge.location}`);
    });

    // 3. Final journey summary
    console.log("\n🎯 CORRECTED JOURNEY SUMMARY");
    console.log("=" * 50);
    console.log(`📅 Journey Duration: 65 days (June 1 - August 4, 2025)`);
    console.log(`🛣️  Total Miles: ${totalMiles.toFixed(0)} miles`);
    console.log(`🚗 Total Drives: ${driveCount} drives`);
    console.log(`⚡ Energy Used: ${totalEnergyUsed.toFixed(0)} kWh`);
    console.log(`🔋 Energy Added: ${totalEnergyAdded.toFixed(0)} kWh`);
    console.log(`⚡ Total Charges: ${chargeCount} charges`);
    console.log(`💰 Total Cost: $${totalCost.toFixed(0)}`);
    console.log(`📈 Daily Average: ${(totalMiles / 65).toFixed(0)} miles/day`);
    console.log(
      `🏎️  Efficiency: ${(totalMiles / totalEnergyUsed).toFixed(2)} mi/kWh`
    );

    // Sanity check
    if (totalMiles / 65 > 1000) {
      console.log("\n❌ WARNING: Average miles/day seems too high!");
      console.log(
        "   This suggests possible data issues or filtering problems"
      );
    } else if (totalMiles / 65 < 100) {
      console.log("\n❌ WARNING: Average miles/day seems too low!");
      console.log("   This suggests possible missing data");
    } else {
      console.log("\n✅ Data looks reasonable for a cross-country road trip");
    }
  } catch (error) {
    console.error("❌ EXTRACTION FAILED:", error.message);
  }
}

extractCorrectData();
