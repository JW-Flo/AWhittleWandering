#!/usr/bin/env node

/**
 * Frontend Simulation Test
 * Simulates browser JavaScript execution to catch runtime errors
 */

import fetch from "node-fetch";

class FrontendSimulation {
  constructor() {
    this.errors = [];
    this.logs = [];
  }

  log(message, type = "info") {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    this.logs.push(logEntry);
    console.log(logEntry);
  }

  async testAPIConnectivity() {
    this.log("Testing API connectivity...", "info");

    try {
      // Simulate the exact request the frontend would make
      const response = await fetch(
        "https://awhittlewandering-api.kd8jc7v8cd.workers.dev/unified-data",
        {
          method: "GET",
          headers: {
            Origin: "https://182679ee.awhittlewandering-site.pages.dev",
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            Accept: "application/json",
            "Accept-Language": "en-US,en;q=0.9",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }
      );

      this.log(`API Response Status: ${response.status}`, "info");
      this.log(
        `API Response Headers: ${JSON.stringify(
          Object.fromEntries(response.headers.entries())
        )}`,
        "info"
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.log(
        `API Response Size: ${JSON.stringify(data).length} bytes`,
        "info"
      );

      // Check for expected data structure
      if (!data.overview || !data.currentStatus) {
        throw new Error("Missing expected data structure");
      }

      this.log("✅ API connectivity test passed", "success");
      return data;
    } catch (error) {
      this.errors.push(`API Connectivity: ${error.message}`);
      this.log(`❌ API connectivity failed: ${error.message}`, "error");
      return null;
    }
  }

  async testFrontendAssets() {
    this.log("Testing frontend asset loading...", "info");

    try {
      // Test main HTML
      const htmlResponse = await fetch(
        "https://182679ee.awhittlewandering-site.pages.dev/",
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          },
        }
      );

      if (!htmlResponse.ok) {
        throw new Error(`Frontend HTML failed: ${htmlResponse.status}`);
      }

      const html = await htmlResponse.text();
      this.log(`HTML Size: ${html.length} bytes`, "info");

      // Extract and test JavaScript assets
      const jsAssetRegex = /src="([^"]*\.js)"/g;
      const jsAssets = [];
      let match;

      while ((match = jsAssetRegex.exec(html)) !== null) {
        jsAssets.push(match[1]);
      }

      this.log(`Found ${jsAssets.length} JavaScript assets`, "info");

      // Test each JS asset
      for (const asset of jsAssets) {
        const assetUrl = asset.startsWith("http")
          ? asset
          : `https://182679ee.awhittlewandering-site.pages.dev${asset}`;

        try {
          const assetResponse = await fetch(assetUrl);
          if (!assetResponse.ok) {
            throw new Error(`Asset ${asset} failed: ${assetResponse.status}`);
          }
          this.log(`✅ Asset loaded: ${asset}`, "success");
        } catch (assetError) {
          this.errors.push(`Asset Loading: ${asset} - ${assetError.message}`);
          this.log(
            `❌ Asset failed: ${asset} - ${assetError.message}`,
            "error"
          );
        }
      }

      this.log("✅ Frontend assets test completed", "success");
    } catch (error) {
      this.errors.push(`Frontend Assets: ${error.message}`);
      this.log(`❌ Frontend assets test failed: ${error.message}`, "error");
    }
  }

  async testCORSConfiguration() {
    this.log("Testing CORS configuration...", "info");

    try {
      const response = await fetch(
        "https://awhittlewandering-api.kd8jc7v8cd.workers.dev/health",
        {
          method: "OPTIONS",
          headers: {
            Origin: "https://182679ee.awhittlewandering-site.pages.dev",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Content-Type",
          },
        }
      );

      const corsHeaders = {
        "access-control-allow-origin": response.headers.get(
          "access-control-allow-origin"
        ),
        "access-control-allow-methods": response.headers.get(
          "access-control-allow-methods"
        ),
        "access-control-allow-headers": response.headers.get(
          "access-control-allow-headers"
        ),
      };

      this.log(`CORS Headers: ${JSON.stringify(corsHeaders)}`, "info");

      if (!corsHeaders["access-control-allow-origin"]) {
        throw new Error("Missing CORS allow-origin header");
      }

      this.log("✅ CORS configuration test passed", "success");
    } catch (error) {
      this.errors.push(`CORS Configuration: ${error.message}`);
      this.log(`❌ CORS test failed: ${error.message}`, "error");
    }
  }

  async runSimulation() {
    this.log("🚀 Starting Frontend Simulation", "info");
    this.log("=".repeat(50), "info");

    await this.testAPIConnectivity();
    await this.testFrontendAssets();
    await this.testCORSConfiguration();

    this.log("=".repeat(50), "info");
    this.log("📊 SIMULATION RESULTS", "info");
    this.log(
      `Total Errors: ${this.errors.length}`,
      this.errors.length > 0 ? "error" : "success"
    );

    if (this.errors.length > 0) {
      this.log("❌ ERRORS DETECTED:", "error");
      this.errors.forEach((error, i) => {
        this.log(`  ${i + 1}. ${error}`, "error");
      });
    } else {
      this.log("🎉 ALL SIMULATION TESTS PASSED!", "success");
    }

    return this.errors.length === 0;
  }
}

// Run simulation
const simulation = new FrontendSimulation();
simulation
  .runSimulation()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Simulation failed:", error);
    process.exit(1);
  });
