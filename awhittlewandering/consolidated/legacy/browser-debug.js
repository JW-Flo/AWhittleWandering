// Paste this into browser console on the live site to debug
console.log("=== JOURNEY DATA DEBUG ===");

// Check if React DevTools is available
if (window.React) {
  console.log("React version:", React.version);
}

// Monitor all fetch requests
const originalFetch = window.fetch;
window.fetch = function (...args) {
  console.log("🌐 FETCH:", args[0]);
  return originalFetch
    .apply(this, args)
    .then((response) => {
      console.log("✅ FETCH SUCCESS:", args[0], response.status);
      return response;
    })
    .catch((error) => {
      console.log("❌ FETCH ERROR:", args[0], error);
      throw error;
    });
};

// Monitor console errors
const originalError = console.error;
console.error = function (...args) {
  console.log("🚨 CONSOLE ERROR:", args);
  return originalError.apply(this, args);
};

// Check current state
setTimeout(() => {
  // Look for error elements
  const errorElements = document.querySelectorAll(
    '[class*="error"], [class*="Error"]'
  );
  console.log("Error elements found:", errorElements.length);

  errorElements.forEach((el, i) => {
    console.log(`Error element ${i}:`, el.textContent, el.className);
  });

  // Look for journey data text
  const journeyText = document.body.textContent.includes(
    "Unable to load journey data"
  );
  console.log('Contains "Unable to load journey data":', journeyText);

  // Check if loading
  const loadingElements = document.querySelectorAll(
    '[class*="loading"], [class*="Loading"]'
  );
  console.log("Loading elements found:", loadingElements.length);

  // Try to find React components
  const dashboardEl = document.querySelector('[class*="dashboard"]');
  if (dashboardEl) {
    console.log("Dashboard element found:", dashboardEl.className);
  }
}, 2000);

console.log("Debug script loaded. Check console for details.");
