/**
 * TESSIE VIN-BASED API TEST
 * Test using VIN directly in API endpoints
 */

const TESSIE_API_TOKEN = process.env.TESSIE_API_TOKEN;
const TESLA_VIN = process.env.TESLA_VIN;

if (!TESSIE_API_TOKEN || !TESLA_VIN) {
  console.error("❌ Missing TESSIE_API_TOKEN or TESLA_VIN");
  process.exit(1);
}

async function testVinBasedAPI() {
  try {
    console.log("🔍 TESTING VIN-BASED TESSIE API");
    console.log("VIN:", TESLA_VIN);
    console.log("=".repeat(50));
    
    // Test 1: Try drives with VIN
    console.log("\n🚗 Testing drives with VIN...");
    const drivesResponse = await fetch(`https://api.tessie.com/${TESLA_VIN}/drives?limit=5&since=1746076800`, {
      headers: { 'Authorization': `Bearer ${TESSIE_API_TOKEN}` }
    });
    
    console.log("Drives status:", drivesResponse.status);
    if (drivesResponse.ok) {
      const drivesData = await drivesResponse.json();
      console.log("✅ Drives API working with VIN!");
      console.log("Found drives:", drivesData.results?.length || 0);
      
      if (drivesData.results && drivesData.results.length > 0) {
        const drive = drivesData.results[0];
        console.log("Sample drive:", {
          id: drive.id,
          started_at: new Date(drive.started_at * 1000).toISOString(),
          distance: drive.odometer_distance,
          energy: drive.energy_used,
          from: drive.starting_location?.substring(0, 50),
          to: drive.ending_location?.substring(0, 50)
        });
      }
    } else {
      const errorText = await drivesResponse.text();
      console.error("❌ Drives failed:", errorText);
    }
    
    // Test 2: Try charges with VIN
    console.log("\n🔋 Testing charges with VIN...");
    const chargesResponse = await fetch(`https://api.tessie.com/${TESLA_VIN}/charges?limit=5&since=1746076800`, {
      headers: { 'Authorization': `Bearer ${TESSIE_API_TOKEN}` }
    });
    
    console.log("Charges status:", chargesResponse.status);
    if (chargesResponse.ok) {
      const chargesData = await chargesResponse.json();
      console.log("✅ Charges API working with VIN!");
      console.log("Found charges:", chargesData.results?.length || 0);
      
      if (chargesData.results && chargesData.results.length > 0) {
        const charge = chargesData.results[0];
        console.log("Sample charge:", {
          id: charge.id,
          started_at: new Date(charge.started_at * 1000).toISOString(),
          energy: charge.energy_added,
          location: charge.location?.substring(0, 50),
          supercharger: charge.is_supercharger
        });
      }
    } else {
      const errorText = await chargesResponse.text();
      console.error("❌ Charges failed:", errorText);
    }
    
    // Test 3: Try state with VIN
    console.log("\n📊 Testing state with VIN...");
    const stateResponse = await fetch(`https://api.tessie.com/${TESLA_VIN}/state`, {
      headers: { 'Authorization': `Bearer ${TESSIE_API_TOKEN}` }
    });
    
    console.log("State status:", stateResponse.status);
    if (stateResponse.ok) {
      const stateData = await stateResponse.json();
      console.log("✅ State API working with VIN!");
      console.log("Current state:", {
        battery: stateData.charge_state?.battery_level + "%",
        charging: stateData.charge_state?.charging_state,
        location: [stateData.drive_state?.latitude, stateData.drive_state?.longitude],
        odometer: stateData.vehicle_state?.odometer
      });
    } else {
      const errorText = await stateResponse.text();
      console.error("❌ State failed:", errorText);
    }
    
    // Test 4: Alternative API patterns
    console.log("\n🔍 Testing alternative endpoints...");
    
    // Try without VIN prefix
    const altDrivesResponse = await fetch(`https://api.tessie.com/drives?vin=${TESLA_VIN}&limit=5&since=1746076800`, {
      headers: { 'Authorization': `Bearer ${TESSIE_API_TOKEN}` }
    });
    
    console.log("Alternative drives status:", altDrivesResponse.status);
    if (altDrivesResponse.ok) {
      console.log("✅ Alternative drives endpoint works!");
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testVinBasedAPI();
