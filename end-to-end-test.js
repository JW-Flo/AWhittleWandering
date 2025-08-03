#!/usr/bin/env node

/**
 * End-to-End User Experience Test
 * Simulates real user interactions and validates complete workflows
 */

const API_BASE_URL = "https://awhittlewandering-api.kd8jc7v8cd.workers.dev";
const LATEST_FRONTEND = "https://182679ee.awhittlewandering-site.pages.dev";

class EndToEndTest {
  constructor() {
    this.results = { passed: 0, failed: 0, warnings: [] };
  }

  log(message, type = "info") {
    const colors = {
      info: "\x1b[36m",
      success: "\x1b[32m",
      error: "\x1b[31m",
      warning: "\x1b[33m",
      reset: "\x1b[0m",
    };
    console.log(`${colors[type]}${message}${colors.reset}`);
  }

  async test(name, testFn) {
    try {
      this.log(`🧪 Testing: ${name}`, "info");
      await testFn();
      this.results.passed++;
      this.log(`✅ PASSED: ${name}`, "success");
    } catch (error) {
      this.results.failed++;
      this.log(`❌ FAILED: ${name} - ${error.message}`, "error");
    }
  }

  async httpRequest(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: { "User-Agent": "E2E-Test/1.0", ...options.headers },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    const data = contentType?.includes("json")
      ? await response.json()
      : await response.text();

    return {
      data,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    };
  }

  async testUserJourney() {
    this.log("🗺️ Testing Complete User Journey Flow", "warning");

    await this.test("User lands on main site", async () => {
      const response = await this.httpRequest(LATEST_FRONTEND);
      if (
        !response.data.includes('<div id="root">') ||
        !response.data.includes("A Whittle Wandering")
      ) {
        throw new Error("Main site not properly configured");
      }
    });

    await this.test("User can access journey data", async () => {
      const response = await this.httpRequest(`${API_BASE_URL}/unified-data`);
      const data = response.data;

      // Validate user-facing data is present
      if (!data.overview.tripName.includes("Whittle Wandering")) {
        throw new Error("Trip name not properly set");
      }

      if (data.overview.daysElapsed <= 0) {
        throw new Error("Days elapsed should be positive");
      }

      if (!data.currentStatus.location.lastUpdate) {
        throw new Error("Location data missing timestamp");
      }
    });

    await this.test("User can view real-time status", async () => {
      const response = await this.httpRequest(`${API_BASE_URL}/unified-data`);
      const data = response.data;

      // Check for live status indicators
      if (data.tessieStatus.connected === undefined) {
        throw new Error("Tessie connection status missing");
      }

      if (!data.currentStatus.location.coordinates) {
        throw new Error("Coordinates missing from location data");
      }

      if (typeof data.currentStatus.battery.level !== "number") {
        throw new Error("Battery level should be numeric");
      }
    });

    await this.test("User can access admin portal", async () => {
      const response = await this.httpRequest(`${LATEST_FRONTEND}/admin`);
      if (response.status !== 200) {
        throw new Error("Admin portal not accessible");
      }
    });

    await this.test("Site loads quickly for users", async () => {
      const startTime = Date.now();
      await this.httpRequest(LATEST_FRONTEND);
      const endTime = Date.now();

      const loadTime = endTime - startTime;
      if (loadTime > 3000) {
        throw new Error(`Site load time too slow: ${loadTime}ms`);
      }

      this.log(`Site load time: ${loadTime}ms`, "info");
    });
  }

  async testDataConsistency() {
    this.log("📊 Testing Data Consistency Across Endpoints", "warning");

    await this.test("Trip data consistency", async () => {
      const healthResponse = await this.httpRequest(`${API_BASE_URL}/health`);
      const statusResponse = await this.httpRequest(
        `${API_BASE_URL}/trip-status`
      );
      const unifiedResponse = await this.httpRequest(
        `${API_BASE_URL}/unified-data`
      );

      // Check that trip identifiers are consistent
      if (statusResponse.data.tripId !== "continental-usa-2025") {
        throw new Error("Trip ID not consistent");
      }

      if (!unifiedResponse.data.overview.tripName.includes("Continental USA")) {
        throw new Error("Trip name not consistent across endpoints");
      }
    });

    await this.test("Timestamp consistency", async () => {
      const response1 = await this.httpRequest(`${API_BASE_URL}/unified-data`);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
      const response2 = await this.httpRequest(`${API_BASE_URL}/unified-data`);

      const time1 = new Date(response1.data.currentStatus.location.lastUpdate);
      const time2 = new Date(response2.data.currentStatus.location.lastUpdate);

      // Timestamps should be recent and potentially different
      const now = new Date();
      const timeDiff = now - time1;

      if (timeDiff > 60000) {
        // More than 1 minute old
        this.results.warnings.push("Timestamp data may be stale");
      }
    });
  }

  async testErrorScenarios() {
    this.log("⚠️ Testing Error Handling and Edge Cases", "warning");

    await this.test("Graceful 404 handling", async () => {
      try {
        await this.httpRequest(`${API_BASE_URL}/nonexistent`);
        throw new Error("Should have returned 404");
      } catch (error) {
        if (!error.message.includes("404")) {
          throw new Error("Not handling 404s properly");
        }
      }
    });

    await this.test("API rate limiting tolerance", async () => {
      // Send multiple rapid requests
      const promises = Array(20)
        .fill()
        .map(() => this.httpRequest(`${API_BASE_URL}/health`));

      const responses = await Promise.all(promises);
      const allSuccessful = responses.every((r) => r.status === 200);

      if (!allSuccessful) {
        throw new Error("API not handling burst requests properly");
      }
    });

    await this.test("Large data handling", async () => {
      const response = await this.httpRequest(`${API_BASE_URL}/unified-data`);
      const dataSize = JSON.stringify(response.data).length;

      if (dataSize > 50000) {
        // 50KB limit for reasonable response size
        throw new Error(`Response size too large: ${dataSize} bytes`);
      }
    });
  }

  async testAccessibility() {
    this.log("♿ Testing Accessibility and Standards Compliance", "warning");

    await this.test("HTML validation basics", async () => {
      const response = await this.httpRequest(LATEST_FRONTEND);
      const html = response.data;

      // Check for essential HTML structure
      if (!html.includes("<!DOCTYPE html>")) {
        throw new Error("Missing DOCTYPE declaration");
      }

      if (!html.includes('lang="en"')) {
        throw new Error("Missing language attribute");
      }

      if (!html.includes('<meta charset="UTF-8"')) {
        throw new Error("Missing charset declaration");
      }

      if (!html.includes("viewport")) {
        throw new Error("Missing viewport meta tag");
      }
    });

    await this.test("SEO meta tags present", async () => {
      const response = await this.httpRequest(LATEST_FRONTEND);
      const html = response.data;

      const requiredTags = [
        "<title>A Whittle Wandering</title>",
        'meta name="description"',
        'meta property="og:title"',
        'meta property="og:description"',
      ];

      for (const tag of requiredTags) {
        if (!html.includes(tag)) {
          throw new Error(`Missing SEO tag: ${tag}`);
        }
      }
    });
  }

  async runFullE2ETest() {
    this.log("🎯 Starting End-to-End User Experience Testing", "warning");
    this.log("=".repeat(60), "info");

    await this.testUserJourney();
    await this.testDataConsistency();
    await this.testErrorScenarios();
    await this.testAccessibility();

    this.log("=".repeat(60), "info");
    this.log("📊 END-TO-END TEST RESULTS", "warning");
    this.log(
      `Total Tests: ${this.results.passed + this.results.failed}`,
      "info"
    );
    this.log(`Passed: ${this.results.passed}`, "success");
    this.log(
      `Failed: ${this.results.failed}`,
      this.results.failed > 0 ? "error" : "success"
    );

    if (this.results.warnings.length > 0) {
      this.log(`Warnings: ${this.results.warnings.length}`, "warning");
      this.results.warnings.forEach((warning, i) => {
        this.log(`  ${i + 1}. ${warning}`, "warning");
      });
    }

    const successRate = (
      (this.results.passed / (this.results.passed + this.results.failed)) *
      100
    ).toFixed(1);
    this.log(`Success Rate: ${successRate}%`, "info");

    if (this.results.failed === 0) {
      this.log(
        "\n🎉 ALL END-TO-END TESTS PASSED! User experience validated.",
        "success"
      );
    } else {
      this.log("\n⚠️ Some E2E tests failed. Review above.", "warning");
    }
  }
}

// Global fetch polyfill for Node.js
if (typeof fetch === "undefined") {
  global.fetch = require("node-fetch");
}

const e2e = new EndToEndTest();
e2e.runFullE2ETest().catch(console.error);
