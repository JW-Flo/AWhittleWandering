/**
 * TESSIE API DEBUGGER - Find vehicle with VIN 5YJYGDEE5LF027324
 */

const TESSIE_API_TOKEN = process.env.TESSIE_API_TOKEN;
const TARGET_VIN = "5YJYGDEE5LF027324";

if (!TESSIE_API_TOKEN) {
  console.error("❌ Missing TESSIE_API_TOKEN");
  process.exit(1);
}

async function debugTessieAPI() {
  try {
    console.log("🔍 TESSIE API DEBUG - Finding Vehicle with VIN:", TARGET_VIN);
    console.log("=".repeat(60));

    // Test vehicles endpoint
    console.log("\n1. Getting vehicles list...");
    const vehiclesResponse = await fetch("https://api.tessie.com/vehicles", {
      headers: { Authorization: `Bearer ${TESSIE_API_TOKEN}` },
    });

    console.log("Status:", vehiclesResponse.status);

    if (!vehiclesResponse.ok) {
      console.error("❌ Vehicles API failed:", vehiclesResponse.status);
      const errorText = await vehiclesResponse.text();
      console.error("Error:", errorText);
      return;
    }

    const vehiclesText = await vehiclesResponse.text();
    console.log("Raw response length:", vehiclesText.length);

    try {
      const vehiclesData = JSON.parse(vehiclesText);
      console.log("✅ Successfully parsed JSON response");

      // Handle different response structures
      let vehicles = [];
      if (Array.isArray(vehiclesData)) {
        vehicles = vehiclesData;
        console.log("📋 Response is direct array of vehicles");
      } else if (vehiclesData.results && Array.isArray(vehiclesData.results)) {
        vehicles = vehiclesData.results;
        console.log("📋 Response has 'results' array");
      } else if (vehiclesData.data && Array.isArray(vehiclesData.data)) {
        vehicles = vehiclesData.data;
        console.log("📋 Response has 'data' array");
      } else {
        console.log(
          "📋 Unknown response structure:",
          Object.keys(vehiclesData)
        );
        console.log("Full response:", JSON.stringify(vehiclesData, null, 2));
      }

      console.log(`\n📊 Found ${vehicles.length} vehicle(s)`);

      // Find the vehicle with our VIN
      let targetVehicle = null;
      vehicles.forEach((vehicle, index) => {
        console.log(`\n🚗 Vehicle ${index + 1}:`);
        console.log("  - Full object:", JSON.stringify(vehicle, null, 2));
        console.log("  - All keys:", Object.keys(vehicle));

        if (vehicle.vin === TARGET_VIN) {
          targetVehicle = vehicle;
          console.log("  ✅ MATCH! This is our target vehicle");
        }
      });

      if (targetVehicle) {
        const vehicleId = targetVehicle.last_state?.vehicle_id;
        const displayName =
          targetVehicle.last_state?.vehicle_state?.vehicle_name ||
          targetVehicle.last_state?.display_name;

        console.log(`\n🎯 TARGET VEHICLE FOUND:`);
        console.log("  - Vehicle ID:", vehicleId);
        console.log("  - VIN:", targetVehicle.vin);
        console.log("  - Name:", displayName);
        console.log(
          "  - Battery Level:",
          targetVehicle.last_state?.charge_state?.battery_level + "%"
        );
        console.log(
          "  - Charging State:",
          targetVehicle.last_state?.charge_state?.charging_state
        );
        console.log(
          "  - Location:",
          targetVehicle.last_state?.drive_state?.latitude,
          targetVehicle.last_state?.drive_state?.longitude
        );

        if (!vehicleId) {
          console.error("❌ Vehicle ID not found in last_state.vehicle_id");
          return;
        }

        // Test getting drives for this vehicle
        console.log(`\n🚗 Testing drives with Vehicle ID: ${vehicleId}`);
        const drivesResponse = await fetch(
          `https://api.tessie.com/${vehicleId}/drives?limit=5&since=1746076800`,
          {
            headers: { Authorization: `Bearer ${TESSIE_API_TOKEN}` },
          }
        );

        if (drivesResponse.ok) {
          const drivesData = await drivesResponse.json();
          console.log("✅ Drives API working!");
          console.log("Found drives:", drivesData.results?.length || 0);

          if (drivesData.results && drivesData.results.length > 0) {
            const sampleDrive = drivesData.results[0];
            console.log("Sample drive:", {
              id: sampleDrive.id,
              started_at: sampleDrive.started_at,
              distance: sampleDrive.odometer_distance,
              energy_used: sampleDrive.energy_used,
              from: sampleDrive.starting_location,
              to: sampleDrive.ending_location,
            });
          }
        } else {
          console.error("❌ Drives API failed:", drivesResponse.status);
          const errorText = await drivesResponse.text();
          console.error("Error:", errorText);
        }

        // Test getting charges for this vehicle
        console.log(`\n🔋 Testing charges with Vehicle ID: ${vehicleId}`);
        const chargesResponse = await fetch(
          `https://api.tessie.com/${vehicleId}/charges?limit=5&since=1746076800`,
          {
            headers: { Authorization: `Bearer ${TESSIE_API_TOKEN}` },
          }
        );

        if (chargesResponse.ok) {
          const chargesData = await chargesResponse.json();
          console.log("✅ Charges API working!");
          console.log("Found charges:", chargesData.results?.length || 0);

          if (chargesData.results && chargesData.results.length > 0) {
            const sampleCharge = chargesData.results[0];
            console.log("Sample charge:", {
              id: sampleCharge.id,
              started_at: sampleCharge.started_at,
              energy_added: sampleCharge.energy_added,
              location: sampleCharge.location,
              is_supercharger: sampleCharge.is_supercharger,
            });
          }
        } else {
          console.error("❌ Charges API failed:", chargesResponse.status);
          const errorText = await chargesResponse.text();
          console.error("Error:", errorText);
        }

        // Update .env file with correct vehicle ID
        console.log(`\n📝 UPDATING .env FILE WITH CORRECT VEHICLE ID`);
        console.log(`Update your .env file with:`);
        console.log(`VEHICLE_ID=${vehicleId}`);
        console.log(`TESLA_VIN=${targetVehicle.vin}`);
      } else {
        console.error(`❌ Vehicle with VIN ${TARGET_VIN} not found!`);
        console.log(
          "Available VINs:",
          vehicles.map((v) => v.vin)
        );
      }
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError.message);
      console.log("Raw response:", vehiclesText);
    }
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
  }
}

debugTessieAPI();
