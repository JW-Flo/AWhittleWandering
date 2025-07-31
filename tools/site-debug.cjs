const puppeteer = require("puppeteer");

async function debugSite() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Capture console logs
  page.on("console", (msg) => {
    console.log(`Console ${msg.type()}: ${msg.text()}`);
  });

  // Capture page errors
  page.on("pageerror", (error) => {
    console.log(`Page error: ${error.message}`);
  });

  // Capture request failures
  page.on("requestfailed", (request) => {
    console.log(
      `Request failed: ${request.url()} - ${request.failure().errorText}`
    );
  });

  console.log("🔍 Loading https://awhittlewandering.com...");

  try {
    await page.goto("https://awhittlewandering.com", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Wait a bit more for React to render
    await page.waitForSelector("#root", { timeout: 10000 });
    await page.evaluate(
      () => new Promise((resolve) => setTimeout(resolve, 5000))
    );

    // Check if React app loaded
    const rootContent = await page.$eval("#root", (el) => el.innerHTML);

    if (rootContent.trim() === "") {
      console.log("❌ React app did not render - #root is empty");
    } else {
      console.log("✅ React app rendered successfully");
      console.log(`Root content length: ${rootContent.length} characters`);
    }

    // Check for specific elements
    const hasNavigation = (await page.$("header")) !== null;
    const hasContent = (await page.$(".min-h-screen")) !== null;

    console.log(`Navigation present: ${hasNavigation ? "✅" : "❌"}`);
    console.log(`Main content present: ${hasContent ? "✅" : "❌"}`);
  } catch (error) {
    console.log(`❌ Error loading page: ${error.message}`);
  }

  await browser.close();
}

debugSite().catch(console.error);
