// Quick test to check what data is being loaded on the frontend
import puppeteer from "puppeteer";

async function testFrontendData() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Listen to console logs
  page.on("console", (msg) => {
    console.log("BROWSER LOG:", msg.text());
  });

  console.log("🚀 Loading awhittlewandering.com...");
  await page.goto("https://awhittlewandering.com", {
    waitUntil: "networkidle0",
  });

  // Wait for the app to load
  await page.waitForTimeout(5000);

  // Check what data is available
  const pageContent = await page.evaluate(() => {
    // Look for any data indicators
    const text = document.body.innerText;
    return {
      hasLoadingText: text.includes("Loading"),
      hasErrorText: text.includes("error") || text.includes("Error"),
      hasMilesData: text.includes("miles") || text.includes("Miles"),
      hasStatesData: text.includes("states") || text.includes("States"),
      contentLength: text.length,
      firstLines: text.substring(0, 500),
    };
  });

  console.log("📊 Page Analysis:", pageContent);

  await browser.close();
}

testFrontendData().catch(console.error);
