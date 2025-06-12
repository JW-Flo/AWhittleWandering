#!/usr/bin/env node
/* eslint-disable no-console */

import { promisify } from "util";
import https from "https";

const get = promisify((url) => {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () =>
          resolve({
            status: res.statusCode,
            data,
            headers: res.headers,
          })
        );
      })
      .on("error", reject);
  });
});

const URLS = {
  MAIN: "https://main.continentalusa-site.pages.dev/",
  API: "https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev",
  ITINERARY:
    "https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev/api/itinerary",
  STATUS:
    "https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev/api/v1/status",
  WEATHER:
    "https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev/api/weather",
};

const REQUIRED_ELEMENTS = {
  map: ["mapboxgl", "Map.jsx", "vehicle marker", "route display"],
  vehicle: ["useVehicleData", "telemetry stream", "position updates"],
  api: ["CORS headers", "rate limiting", "cache control"],
  monitoring: ["error tracking", "performance metrics", "status endpoints"],
};

async function validateDeployment() {
  console.log("Starting comprehensive deployment validation...\n");

  const results = {
    accessibility: 0,
    functionality: 0,
    performance: 0,
    reliability: 0,
  };

  try {
    // 1. Basic Endpoint Checks
    console.log("Checking endpoint availability:");
    for (const [name, url] of Object.entries(URLS)) {
      try {
        const response = await get(url);
        const status = response.status;
        const isHealthy = status >= 200 && status < 300;
        console.log(`${isHealthy ? "✓" : "✗"} ${name}: ${status}`);

        if (isHealthy) {
          results.reliability += 0.2;

          // Check for CORS headers in API endpoints
          if (name !== "MAIN") {
            const hasValidCORS =
              response.headers?.["access-control-allow-origin"];
            if (hasValidCORS) {
              results.functionality += 0.1;
            } else {
              console.log(`  ! Missing CORS headers for ${name}`);
            }
          }

          // For main site, check if it's not just returning an empty page
          if (name === "MAIN") {
            const hasContent = response.data.length > 100;
            const hasHTML = response.data.includes("<!DOCTYPE html>");
            if (!hasContent || !hasHTML) {
              console.log(
                "  ! Warning: Main site appears to be empty or invalid"
              );
              results.functionality -= 0.2;
            }
          }
        }
      } catch (error) {
        console.log(`✗ ${name}: Failed - ${error.message}`);
      }
    }

    // 2. Content Validation
    console.log("\nValidating required content and functionality:");
    const mainResponse = await get(URLS.MAIN);
    const content = mainResponse.data.toLowerCase();

    // Check for critical page elements
    Object.entries(REQUIRED_ELEMENTS).forEach(([category, elements]) => {
      console.log(`\nChecking ${category} components:`);
      elements.forEach((element) => {
        const hasElement = content.includes(element.toLowerCase());
        console.log(`${hasElement ? "✓" : "✗"} ${element}`);
        if (hasElement) {
          results.functionality += 0.1;
        }
      });
    });

    // 3. Performance Checks
    console.log("\nRunning performance checks:");
    try {
      const loadTime = await measureLoadTime(URLS.MAIN);
      console.log(`Page Load Time: ${loadTime}ms`);
      results.performance +=
        loadTime < 3000
          ? 0.3
          : loadTime < 5000
          ? 0.2
          : loadTime < 8000
          ? 0.1
          : 0;
    } catch (error) {
      console.log("✗ Failed to measure load time");
    }

    // 4. Accessibility Validation
    console.log("\nChecking accessibility features:");
    const accessibilityChecks = [
      "aria-label",
      "role=",
      "alt=",
      "<label",
      "tabindex",
    ];

    accessibilityChecks.forEach((check) => {
      const hasFeature = content.includes(check.toLowerCase());
      console.log(`${hasFeature ? "✓" : "✗"} ${check}`);
      if (hasFeature) {
        results.accessibility += 0.2;
      }
    });

    // Calculate overall score
    const totalScore = Object.values(results).reduce(
      (sum, val) => sum + val,
      0
    );
    const maxScore = Object.keys(results).length;
    const overallScore = (totalScore / maxScore) * 100;

    // Output results
    console.log("\nValidation Results:");
    console.log("------------------");
    Object.entries(results).forEach(([key, value]) => {
      console.log(`${key}: ${(value * 100).toFixed(1)}%`);
    });
    console.log(`\nOverall Deployment Score: ${overallScore.toFixed(1)}%`);

    // Generate actionable recommendations
    console.log("\nRecommendations:");
    if (results.accessibility < 0.8) {
      console.log("- Improve accessibility by adding ARIA labels and roles");
    }
    if (results.functionality < 0.8) {
      console.log("- Verify all core features are properly implemented");
      console.log("- Check if required components are actually rendered");
      console.log("- Validate data flow between components");
    }
    if (results.performance < 0.8) {
      console.log("- Optimize page load time and resource usage");
      console.log("- Consider implementing code splitting");
      console.log("- Analyze and optimize bundle size");
    }
    if (results.reliability < 0.8) {
      console.log("- Address endpoint availability and CORS issues");
      console.log("- Implement proper error handling");
      console.log("- Add retry mechanisms for failed requests");
    }

    // Success criteria
    const isSuccessful = overallScore >= 80;
    console.log(`\nDeployment Status: ${isSuccessful ? "✓ PASS" : "✗ FAIL"}`);

    // Additional checks for empty or invalid deployments
    if (mainResponse.data.length < 1000) {
      console.log(
        "\n⚠️ CRITICAL WARNING: Deployment appears to be incomplete or empty!"
      );
      console.log("Required Actions:");
      console.log("1. Verify build process completed successfully");
      console.log("2. Check build artifacts for expected content");
      console.log("3. Validate deployment configuration");
      console.log("4. Review CI/CD pipeline logs");
      process.exit(1);
    }

    if (!isSuccessful) {
      console.log("\nRequired Actions:");
      console.log("1. Review and fix failed checks");
      console.log("2. Ensure all critical components are functional");
      console.log("3. Re-run validation after fixes");
      process.exit(1);
    }

    return isSuccessful;
  } catch (error) {
    console.error("Validation failed:", error);
    process.exit(1);
  }
}

async function measureLoadTime(url) {
  try {
    const start = Date.now();
    await get(url);
    return Date.now() - start;
  } catch (error) {
    throw new Error(`Failed to measure load time: ${error.message}`);
  }
}

// Execute validation
validateDeployment().catch(console.error);
