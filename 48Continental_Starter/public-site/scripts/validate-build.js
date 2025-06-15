/**
 * Build Validation Script
 *
 * This script runs after the build process to validate critical components
 * including MapBox token injection, environment variable replacement,
 * and other production readiness checks.
 */

/* eslint-env node */
const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

console.log("======================================");
console.log("48 Continental USA - Build Validation");
console.log("======================================");

// Paths
const distDir = path.join(__dirname, "../dist");
const indexHtmlPath = path.join(distDir, "index.html");
const jsDir = path.join(distDir, "assets");

// Check if dist directory exists
if (!fs.existsSync(distDir)) {
  console.error("❌ ERROR: dist directory not found!");
  console.error("Run npm run build before running this script");
  process.exit(1);
}

// Status tracking
const issues = [];
const successes = [];

// Validate index.html
console.log("\n📄 Checking index.html...");
if (fs.existsSync(indexHtmlPath)) {
  const indexHtml = fs.readFileSync(indexHtmlPath, "utf8");

  // Check for MapBox token meta tag
  if (indexHtml.includes('meta name="mapbox-token"')) {
    successes.push("✓ Found MapBox token meta tag in index.html");
  } else {
    issues.push("⚠️ MapBox token meta tag missing from index.html");
  }

  // Check for window.__MAPBOX_TOKEN__
  if (indexHtml.includes("window.__MAPBOX_TOKEN__")) {
    successes.push("✓ Found window.__MAPBOX_TOKEN__ in index.html");
  } else {
    issues.push("⚠️ window.__MAPBOX_TOKEN__ missing from index.html");
  }

  // Check for MapBox CSS
  if (indexHtml.includes("mapbox-gl.css")) {
    successes.push("✓ Found MapBox GL CSS in index.html");
  } else {
    issues.push("⚠️ MapBox GL CSS not found in index.html");
  }
} else {
  issues.push("❌ index.html not found in build output!");
}

// Check JS files for token injection
console.log("\n📦 Checking JS bundles...");
if (fs.existsSync(jsDir)) {
  const jsFiles = fs
    .readdirSync(jsDir)
    .filter((file) => file.endsWith(".js"))
    .map((file) => path.join(jsDir, file));

  console.log(`Found ${jsFiles.length} JavaScript files`);

  let tokenFound = false;
  let mapboxImportFound = false;

  jsFiles.forEach((file) => {
    const content = fs.readFileSync(file, "utf8");

    // Look for MapBox token pattern
    if (content.includes("pk.ey")) {
      tokenFound = true;
      const match = content.match(/pk\.ey[a-zA-Z0-9_-]{30,}/);
      if (match) {
        successes.push(
          `✓ Found MapBox token in ${path.basename(file)}: ${match[0].substring(
            0,
            15
          )}...`
        );
      } else {
        successes.push(
          `✓ Found MapBox token signature in ${path.basename(file)}`
        );
      }
    }

    // Look for MapBox import
    if (content.includes("mapbox-gl")) {
      mapboxImportFound = true;
      successes.push(`✓ Found MapBox GL import in ${path.basename(file)}`);
    }
  });

  if (!tokenFound) {
    issues.push("❌ CRITICAL: MapBox token not found in any JS file!");
  }

  if (!mapboxImportFound) {
    issues.push("⚠️ MapBox GL import not found in any JS file");
  }
} else {
  issues.push("❌ No JavaScript assets found in build output!");
}

// Summary
console.log("\n📊 Validation Summary:");

if (successes.length > 0) {
  console.log("\nSuccesses:");
  successes.forEach((success) => console.log(success));
}

if (issues.length > 0) {
  console.log("\nIssues:");
  issues.forEach((issue) => console.log(issue));

  console.log("\n⚠️ Production build validation found issues!");
  console.log("Review these issues before deploying.");
} else {
  console.log("\n✅ All validation checks passed!");
}

// Final recommendations
console.log("\n📋 Recommendations:");
console.log("- Test build locally with: npm run preview");
console.log("- Verify MapBox loads in incognito/private browser window");
console.log("- Check Map component initialization in browser console");
console.log("- Verify environment variables are correctly injected");

// Exit with status based on issues
process.exit(issues.length > 0 ? 1 : 0);
