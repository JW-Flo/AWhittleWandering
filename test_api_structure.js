// Test the API structure to verify frontend compatibility
const https = require("https");

https.get(
  "https://awhittlewandering-api.kd8jc7v8cd.workers.dev/unified-data",
  (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      try {
        const unifiedData = JSON.parse(data);

        console.log("✅ Testing frontend access patterns:");
        console.log("unifiedData.timeline:", typeof unifiedData.timeline);
        console.log(
          "unifiedData.timeline.drives:",
          typeof unifiedData.timeline.drives
        );
        console.log(
          "unifiedData.timeline.drives.length:",
          unifiedData.timeline.drives.length
        );
        console.log("Can access drives[0]:", !!unifiedData.timeline.drives[0]);
        console.log(
          "First drive startLocation:",
          unifiedData.timeline.drives[0]?.startLocation
        );

        // Test the exact error that was happening
        try {
          const states = unifiedData.timeline.drives.map(
            (drive) => drive.startLocation
          );
          console.log(
            "✅ SUCCESS: No TypeError when accessing drives property!"
          );
          console.log("Sample states from drives:", states.slice(0, 2));
        } catch (error) {
          console.log("❌ ERROR:", error.message);
        }
      } catch (error) {
        console.log("❌ Parse error:", error.message);
      }
    });
  }
);
