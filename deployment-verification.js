// Deployment Verification Script - Run in browser console on deployed site
console.log("🚀 AWhittleWandering Deployment Verification");
console.log("===========================================");

// Check deployed environment
function checkDeployment() {
  console.log("\n📋 Checking deployment environment...");
  
  console.log("URL:", window.location.href);
  console.log("Time:", new Date().toISOString());
  
  // Look for indicators of production deployment
  const isProd = window.location.href.includes("awhittlewandering-site.pages.dev");
  console.log("Production deployment:", isProd ? "✅ Yes" : "❌ No");
}

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
  
  // Check window token
  if (window.__MAPBOX_TOKEN__) {
    console.log("✅ Window.__MAPBOX_TOKEN__ is set");
    console.log("Window token preview:", window.__MAPBOX_TOKEN__.substring(0, 20) + "...");
  } else {
    console.warn("⚠️ Window.__MAPBOX_TOKEN__ is not set");
  }

  return true;
}

// Check CSS inclusion
function checkCSSInclusion() {
  console.log("\n📊 Checking CSS inclusion...");
  
  // Check for mapbox CSS
  const stylesheets = Array.from(document.styleSheets);
  let mapboxCSSFound = false;
  
  stylesheets.forEach((sheet, i) => {
    try {
      const href = sheet.href || "inline";
      if (href.includes("mapbox")) {
        console.log(`✅ Found Mapbox CSS ${i+1}:`, href);
        mapboxCSSFound = true;
      }
    } catch (e) {
      // Can't access cross-origin stylesheets
    }
  });
  
  if (!mapboxCSSFound) {
    console.warn("⚠️ No Mapbox CSS found in document");
    
    // Check if CSS content exists regardless of stylesheet href
    const mapboxStyleElements = document.querySelectorAll('.mapboxgl-map, .mapboxgl-canvas');
    if (mapboxStyleElements.length > 0) {
      console.log("✅ Mapbox CSS classes found in document");
    } else {
      console.error("❌ No Mapbox CSS classes found in document");
    }
  }
  
  return mapboxCSSFound;
}

// Check map container
function checkMapContainer() {
  console.log("\n🏗️ Checking Map Container...");

  const mapContainers = document.querySelectorAll('.map-container, .mapboxgl-map, [id*="map"]');
  console.log("Found map containers:", mapContainers.length);

  if (mapContainers.length === 0) {
    console.error("❌ No map containers found");
    return false;
  }

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
  
  // Check for map canvas
  const mapCanvas = document.querySelector('.mapboxgl-canvas');
  if (mapCanvas) {
    console.log("✅ Map canvas found:", {
      width: mapCanvas.width,
      height: mapCanvas.height,
      style: {
        width: mapCanvas.style.width,
        height: mapCanvas.style.height
      }
    });
  } else {
    console.error("❌ No map canvas found");
  }

  return mapContainers.length > 0;
}

// Run verification
function verifyDeployment() {
  console.log("🔍 Starting deployment verification...");
  
  checkDeployment();
  const tokenOK = checkMapboxToken();
  const cssOK = checkCSSInclusion();
  const containerOK = checkMapContainer();
  
  console.log("\n📝 Verification Summary:");
  console.log("-----------------------");
  console.log("Mapbox Token:", tokenOK ? "✅ PASS" : "❌ FAIL");
  console.log("CSS Inclusion:", cssOK ? "✅ PASS" : "⚠️ WARNING");
  console.log("Map Container:", containerOK ? "✅ PASS" : "❌ FAIL");
  
  const overallStatus = tokenOK && containerOK ? "✅ DEPLOYMENT LOOKS GOOD" : "❌ ISSUES DETECTED";
  console.log("\n" + overallStatus);
  
  return {
    verified: new Date().toISOString(),
    url: window.location.href,
    tokenOK,
    cssOK,
    containerOK,
    overall: tokenOK && containerOK
  };
}

// Run verification and store results
window.verificationResults = verifyDeployment();
console.log("Results stored in window.verificationResults");
