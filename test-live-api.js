// Test script to validate live Tessie API integration
// Run this in browser console to set API key and test

// Set the API key in localStorage
localStorage.setItem("tessie_api_key", "64rbSGkMgblAZ5TaivBzokOGKTy72fYw");
localStorage.removeItem("demo_mode");

console.log("✅ Tessie API key set in localStorage");
console.log("🔄 Refresh the page to use live data");

// Test API directly from browser
async function testTessieAPI() {
  const apiKey = "64rbSGkMgblAZ5TaivBzokOGKTy72fYw";

  try {
    console.log("🚗 Testing vehicles endpoint...");
    const vehiclesResponse = await fetch("https://api.tessie.com/vehicles", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const vehicles = await vehiclesResponse.json();
    console.log("Vehicles:", vehicles.results.length);

    if (vehicles.results.length > 0) {
      const vin = vehicles.results[0].vin;
      console.log("Vehicle VIN:", vin);
      console.log(
        "Display Name:",
        vehicles.results[0].last_state?.display_name
      );

      // Test drives endpoint
      console.log("🛣️ Testing drives endpoint...");
      const fromDate = Math.floor(new Date("2025-06-01").getTime() / 1000);
      const toDate = Math.floor(new Date().getTime() / 1000);

      const drivesResponse = await fetch(
        `https://api.tessie.com/${vin}/drives?from=${fromDate}&to=${toDate}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        }
      );
      const drives = await drivesResponse.json();
      console.log("Historical drives:", drives.results?.length || 0);

      if (drives.results?.length > 0) {
        console.log("Sample drive:", drives.results[0]);
      }

      // Test charges endpoint
      console.log("⚡ Testing charges endpoint...");
      const chargesResponse = await fetch(
        `https://api.tessie.com/${vin}/charges?from=${fromDate}&to=${toDate}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        }
      );
      const charges = await chargesResponse.json();
      console.log("Historical charges:", charges.results?.length || 0);

      if (charges.results?.length > 0) {
        console.log("Sample charge:", charges.results[0]);
      }
    }

    console.log("✅ All API tests completed successfully!");
  } catch (error) {
    console.error("❌ API test failed:", error);
  }
}

// Run the test
testTessieAPI();
