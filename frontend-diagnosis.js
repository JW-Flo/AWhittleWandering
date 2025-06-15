// Frontend Journey Data Loading Debug Script
// Run this in the browser console on the live site to diagnose issues

console.log("🔍 Frontend Journey Data Loading Debug Script");
console.log("================================================");

// Helper function to safely check React hooks state
function checkReactState() {
  console.log("\n📊 Checking React Component State...");

  // Look for React components in the DOM
  const appContainer = document.querySelector(".app-container");
  if (!appContainer) {
    console.error("❌ App container not found");
    return;
  }

  // Check if dashboard is rendered
  const dashboard = document.querySelector('[class*="dashboard"]');
  if (!dashboard) {
    console.error("❌ Dashboard component not found");
    return;
  }

  // Check for error states in the DOM
  const errorElements = document.querySelectorAll("*");
  const errorTexts = [];
  errorElements.forEach((el) => {
    if (
      el.textContent &&
      el.textContent.includes("Unable to load journey data")
    ) {
      errorTexts.push(el);
    }
  });

  if (errorTexts.length > 0) {
    console.error(
      '❌ Found "Unable to load journey data" error in DOM:',
      errorTexts
    );
    errorTexts.forEach((el, i) => {
      console.log(`Error element ${i + 1}:`, el);
      console.log(
        "Parent chain:",
        el.closest(".loading-overlay") || el.parentElement
      );
    });
  } else {
    console.log('✅ No "Unable to load journey data" error found in DOM');
  }

  // Check for loading states
  const loadingElements = document.querySelectorAll(
    '[class*="loading"], [class*="spinner"]'
  );
  if (loadingElements.length > 0) {
    console.log("⏳ Found loading elements:", loadingElements);
  } else {
    console.log("✅ No loading elements found - app should be loaded");
  }
}

// Test the APIs directly from the frontend
async function testAPIsFromFrontend() {
  console.log("\n🌐 Testing APIs from Frontend Context...");

  // Get the edge worker URL from the window/env
  const edgeWorkerUrl = window.location.href.includes("localhost")
    ? "http://localhost:8787"
    : "https://awhittlewandering-edge.kd8jc7v8cd.workers.dev";

  console.log("Using Edge Worker URL:", edgeWorkerUrl);

  const endpoints = ["vehicle", "trip", "weather"];
  const results = {};

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint}...`);
      const response = await fetch(`${edgeWorkerUrl}/api/${endpoint}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      results[endpoint] = { success: true, data };
      console.log(`✅ ${endpoint} API working:`, data);
    } catch (error) {
      results[endpoint] = { success: false, error: error.message };
      console.error(`❌ ${endpoint} API failed:`, error);
    }
  }

  return results;
}

// Check for React hook errors
function checkHookErrors() {
  console.log("\n🪝 Checking for React Hook Errors...");

  // Check console for hook-related errors
  const originalError = console.error;
  const errors = [];

  console.error = function (...args) {
    errors.push(args.join(" "));
    originalError.apply(console, args);
  };

  // Check for common hook error patterns
  const hookErrorPatterns = [
    "useVehicleData",
    "useTripData",
    "useWeatherData",
    "Cannot read prop",
    "undefined is not an object",
    "Network Error",
    "Failed to fetch",
  ];

  setTimeout(() => {
    console.error = originalError;

    const hookErrors = errors.filter((error) =>
      hookErrorPatterns.some((pattern) => error.includes(pattern))
    );

    if (hookErrors.length > 0) {
      console.error("❌ Found hook-related errors:", hookErrors);
    } else {
      console.log("✅ No hook-related errors detected");
    }
  }, 2000);
}

// Check network requests
function checkNetworkRequests() {
  console.log("\n🌍 Checking Network Requests...");

  // Monitor fetch calls
  const originalFetch = window.fetch;
  const requests = [];

  window.fetch = function (...args) {
    const request = { url: args[0], timestamp: Date.now() };
    requests.push(request);
    console.log("📡 Fetch request:", args[0]);

    return originalFetch
      .apply(this, args)
      .then((response) => {
        request.status = response.status;
        request.success = response.ok;
        console.log(
          `📡 Response for ${args[0]}:`,
          response.status,
          response.ok ? "✅" : "❌"
        );
        return response;
      })
      .catch((error) => {
        request.error = error.message;
        console.error(`📡 Error for ${args[0]}:`, error);
        throw error;
      });
  };

  // Restore after 10 seconds
  setTimeout(() => {
    window.fetch = originalFetch;
    console.log("📡 Network monitoring complete. Requests made:", requests);
  }, 10000);
}

// Check for environment variables
function checkEnvironmentConfig() {
  console.log("\n⚙️ Checking Environment Configuration...");

  // Try to access Vite env vars (these might not be available in production)
  const envVars = [
    "VITE_EDGE_WORKER_URL",
    "VITE_USE_SIMULATED_DATA",
    "VITE_MAPBOX_TOKEN",
  ];

  envVars.forEach((envVar) => {
    // In production, these won't be accessible, but we can check the build output
    console.log(`${envVar}: Not accessible in production build (expected)`);
  });

  // Check if the app is using simulated data by looking at API responses
  console.log("Will check API responses to determine if using live data...");
}

// Main diagnosis function
async function diagnoseFrontendIssue() {
  console.log("🚀 Starting Frontend Journey Data Diagnosis...");
  console.log("Time:", new Date().toISOString());
  console.log("URL:", window.location.href);
  console.log("User Agent:", navigator.userAgent);

  // Run all checks
  checkReactState();
  checkHookErrors();
  checkNetworkRequests();
  checkEnvironmentConfig();

  // Test APIs
  const apiResults = await testAPIsFromFrontend();

  // Summary
  console.log("\n📋 DIAGNOSIS SUMMARY:");
  console.log("==================");

  const vehicleSuccess = apiResults.vehicle?.success;
  const tripSuccess = apiResults.trip?.success;

  if (vehicleSuccess && tripSuccess) {
    console.log("✅ APIs are working correctly");
    console.log("✅ Journey data should be available");
    console.log(
      "🔍 If error still shows, issue is in frontend error handling logic"
    );
  } else {
    console.log("❌ API issues detected:");
    if (!vehicleSuccess) console.log("  - Vehicle API failed");
    if (!tripSuccess) console.log("  - Trip API failed");
  }

  return {
    apis: apiResults,
    timestamp: new Date().toISOString(),
    url: window.location.href,
  };
}

// Auto-run diagnosis
diagnoseFrontendIssue().then((results) => {
  console.log("\n🎯 FINAL RESULTS:", results);

  // Store results globally for manual inspection
  window.frontendDiagnosisResults = results;

  console.log("\n💡 Results stored in window.frontendDiagnosisResults");
  console.log("💡 Re-run diagnosis with: diagnoseFrontendIssue()");
});

// Export functions for manual use
window.diagnoseFrontendIssue = diagnoseFrontendIssue;
window.checkReactState = checkReactState;
window.testAPIsFromFrontend = testAPIsFromFrontend;
