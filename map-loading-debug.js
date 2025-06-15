// Map Loading Debug Script - Run in browser console
console.log("🗺️ Map Loading Debug Script");
console.log("========================");

// Check Mapbox token
function checkMapboxToken() {
  console.log("\n🔑 Checking Mapbox Token...");

  // Check if mapboxgl is loaded
  if (typeof mapboxgl === "undefined") {
    console.error("❌ mapboxgl is not loaded");
    return false;
  }

  console.log("✅ mapboxgl is loaded:", mapboxgl.version);

  // Check token
  const token = mapboxgl.accessToken;
  if (!token) {
    console.error("❌ No Mapbox access token set");
    return false;
  }

  if (!token.startsWith("pk.")) {
    console.error("❌ Invalid Mapbox token format (should start with pk.)");
    return false;
  }

  console.log("✅ Mapbox token is set and formatted correctly");
  console.log("Token preview:", token.substring(0, 20) + "...");

  return true;
}

// Check map container
function checkMapContainer() {
  console.log("\n🏗️ Checking Map Container...");

  const mapContainers = document.querySelectorAll(
    '.map-container, .map, [id*="map"]'
  );
  console.log("Found map containers:", mapContainers.length);

  mapContainers.forEach((container, i) => {
    console.log(`Container ${i + 1}:`, {
      element: container,
      className: container.className,
      id: container.id,
      dimensions: {
        width: container.offsetWidth,
        height: container.offsetHeight,
        visible: container.offsetParent !== null,
      },
      styles: {
        display: getComputedStyle(container).display,
        visibility: getComputedStyle(container).visibility,
        position: getComputedStyle(container).position,
      },
    });
  });

  // Check for "Loading map..." text
  const loadingText = document.querySelector("*");
  let foundLoadingText = false;
  document.querySelectorAll("*").forEach((el) => {
    if (el.textContent && el.textContent.includes("Loading map")) {
      console.log('📍 Found "Loading map..." text in:', el);
      foundLoadingText = true;
    }
  });

  if (foundLoadingText) {
    console.log("⚠️ Map is stuck in loading state");
  } else {
    console.log('✅ No "Loading map..." text found');
  }
}

// Check React components
function checkReactComponents() {
  console.log("\n⚛️ Checking React Components...");

  // Look for React Fiber nodes
  const reactRoots = document.querySelectorAll(
    "[data-reactroot], #root, .app-container"
  );
  console.log("React roots found:", reactRoots.length);

  // Check for EnhancedMap component
  const mapComponents = document.querySelectorAll(
    '[class*="map"], [class*="Map"]'
  );
  console.log("Map-related components:", mapComponents.length);

  // Check for error boundaries or error states
  const errorElements = document.querySelectorAll(
    '[class*="error"], [class*="Error"]'
  );
  console.log("Error-related elements:", errorElements.length);

  errorElements.forEach((el, i) => {
    console.log(`Error element ${i + 1}:`, el.textContent);
  });
}

// Check panel interactions
function checkPanelInteractions() {
  console.log("\n🎛️ Checking Panel Interactions...");

  // Find panel tabs
  const panelTabs = document.querySelectorAll('.panel-tab, [class*="tab"]');
  console.log("Panel tabs found:", panelTabs.length);

  panelTabs.forEach((tab, i) => {
    console.log(`Tab ${i + 1}:`, {
      text: tab.textContent,
      className: tab.className,
      disabled: tab.disabled,
      clickable: tab.onclick !== null || tab.addEventListener !== undefined,
      styles: {
        pointerEvents: getComputedStyle(tab).pointerEvents,
        zIndex: getComputedStyle(tab).zIndex,
        position: getComputedStyle(tab).position,
      },
    });

    // Test click handler
    if (tab.onclick) {
      console.log(`Tab ${i + 1} has onclick handler`);
    }
  });

  // Find the slide-out panel
  const detailsPanels = document.querySelectorAll(
    '.details-panel, [class*="panel"]'
  );
  console.log("Details panels found:", detailsPanels.length);

  detailsPanels.forEach((panel, i) => {
    console.log(`Panel ${i + 1}:`, {
      className: panel.className,
      visible: panel.offsetParent !== null,
      dimensions: {
        width: panel.offsetWidth,
        height: panel.offsetHeight,
      },
    });
  });
}

// Test API endpoints
async function testAPIs() {
  console.log("\n🌐 Testing API Endpoints...");

  const API_BASE = "https://awhittlewandering-edge.kd8jc7v8cd.workers.dev";
  const endpoints = ["vehicle", "trip"];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint}...`);
      const response = await fetch(`${API_BASE}/api/${endpoint}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint} API working:`, data);
      } else {
        console.error(`❌ ${endpoint} API failed: HTTP ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ ${endpoint} API error:`, error.message);
    }
  }
}

// Test manual panel interaction
function testPanelInteraction() {
  console.log("\n🔧 Testing Manual Panel Interaction...");

  // Try to find and click tab buttons
  const progressTab = document.querySelector(
    '[class*="tab"]:first-child, .panel-tab'
  );
  const vehicleTab = document.querySelector('[class*="tab"]:nth-child(2)');
  const statesTab = document.querySelector('[class*="tab"]:nth-child(3)');

  if (progressTab) {
    console.log("Found Progress tab, attempting click...");
    progressTab.click();
    setTimeout(() => {
      console.log("Progress tab clicked, checking result...");
    }, 100);
  }

  if (vehicleTab) {
    console.log("Found Vehicle tab, will test in 2 seconds...");
    setTimeout(() => {
      console.log("Clicking Vehicle tab...");
      vehicleTab.click();
    }, 2000);
  }

  if (statesTab) {
    console.log("Found States tab, will test in 4 seconds...");
    setTimeout(() => {
      console.log("Clicking States tab...");
      statesTab.click();
    }, 4000);
  }
}

// Check for mapbox CSS
function checkMapboxCSS() {
  console.log("\n🎨 Checking Mapbox CSS...");

  const stylesheets = Array.from(document.styleSheets);
  let mapboxCSSFound = false;

  stylesheets.forEach((sheet, i) => {
    try {
      const href = sheet.href || "inline";
      if (href.includes("mapbox") || href.includes("Map")) {
        console.log(`✅ Found Mapbox-related CSS ${i + 1}:`, href);
        mapboxCSSFound = true;
      }
    } catch (e) {
      // Can't access cross-origin stylesheets
    }
  });

  if (!mapboxCSSFound) {
    console.log("⚠️ No Mapbox CSS found - this might cause styling issues");
  }

  // Check for mapbox-gl CSS classes
  const mapboxElements = document.querySelectorAll('[class*="mapbox"]');
  console.log("Elements with mapbox classes:", mapboxElements.length);
}

// Main diagnostic function
async function diagnoseFrontendIssues() {
  console.log("🚀 Starting Frontend Issues Diagnosis...");
  console.log("Time:", new Date().toISOString());
  console.log("URL:", window.location.href);

  // Run all checks
  const tokenOK = checkMapboxToken();
  checkMapContainer();
  checkReactComponents();
  checkPanelInteractions();
  checkMapboxCSS();

  // Test APIs
  await testAPIs();

  // Test manual interactions
  testPanelInteraction();

  console.log("\n📋 DIAGNOSIS SUMMARY:");
  console.log("==================");

  if (tokenOK) {
    console.log("✅ Mapbox token is properly configured");
  } else {
    console.log("❌ Mapbox token issues detected");
  }

  console.log(
    "💡 If map is still loading, check browser network tab for failed requests"
  );
  console.log("💡 If panels are not working, check for JavaScript errors");
  console.log("💡 Try opening browser developer tools and look for errors");

  return {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    mapboxTokenOK: tokenOK,
  };
}

// Auto-run diagnosis
diagnoseFrontendIssues().then((results) => {
  console.log("\n🎯 DIAGNOSIS COMPLETE:", results);

  // Store results globally for manual inspection
  window.mapDiagnosisResults = results;

  console.log("\n💡 Results stored in window.mapDiagnosisResults");
  console.log("💡 Re-run diagnosis with: diagnoseFrontendIssues()");
  console.log("💡 Test panel interactions with: testPanelInteraction()");
});

// Export functions for manual use
window.diagnoseFrontendIssues = diagnoseFrontendIssues;
window.checkMapboxToken = checkMapboxToken;
window.checkMapContainer = checkMapContainer;
window.testPanelInteraction = testPanelInteraction;
