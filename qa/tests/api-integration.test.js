/**
 * Comprehensive API Integration Tests
 * Tests all backend endpoints and integration points
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { getQAConfig } from "../src/qa-config.js";

const runtime = getQAConfig();
const API_BASE_URL =
  runtime.apiBaseUrl || "https://awhittlewandering-api.kd8jc7v8cd.workers.dev";

// Test configuration
const TEST_CONFIG = {
  timeout: 30000,
  retries: 3,
  endpoints: {
    health: "/health",
    teslaData: "/api/tesla-data",
    config: "/api/config",
  },
};

class APITestRunner {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "QA-Test-Suite/1.0",
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);

      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers),
        data: response.headers.get("content-type")?.includes("application/json")
          ? await response.json()
          : await response.text(),
        responseTime: Date.now() - this.startTime,
      };
    } catch (error) {
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  async testWithRetry(testFn, maxRetries = TEST_CONFIG.retries) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await testFn();
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          console.log(`  🔄 Retry ${attempt}/${maxRetries} for test...`);
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    throw lastError;
  }

  logResult(testName, result) {
    this.results.push({
      test: testName,
      ...result,
      timestamp: new Date().toISOString(),
    });
  }
}

describe("API Integration Tests", () => {
  let testRunner;

  beforeAll(() => {
    testRunner = new APITestRunner();
  });

  afterAll(() => {
    console.log("\n📊 API Test Results Summary:");
    testRunner.results.forEach((result) => {
      const status = result.passed ? "✅" : "❌";
      console.log(`${status} ${result.test}: ${result.duration}ms`);
    });
  });

  describe("Health Check Endpoint", () => {
    it("should return healthy status", async () => {
      await testRunner.testWithRetry(async () => {
        const startTime = Date.now();
        const response = await testRunner.makeRequest("/health");
        const duration = Date.now() - startTime;

        expect(response.ok).toBe(true);
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty("status", "healthy");
        expect(duration).toBeLessThan(5000); // Should respond within 5 seconds

        testRunner.logResult("Health Check", {
          passed: true,
          duration,
          responseTime: response.responseTime,
        });
      });
    });

    it("should include service information", async () => {
      const response = await testRunner.makeRequest("/health");

      expect(response.data).toHaveProperty("timestamp");
      expect(response.data).toHaveProperty("version");
      expect(response.data.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
      );
    });

    it("should have proper CORS headers", async () => {
      const response = await testRunner.makeRequest("/health");

      expect(response.headers).toHaveProperty("access-control-allow-origin");
      expect(response.headers["access-control-allow-origin"]).toBe("*");
    });
  });

  describe("Tesla Data Endpoint", () => {
    it("should return valid Tesla data structure", async () => {
      await testRunner.testWithRetry(async () => {
        const startTime = Date.now();
        const response = await testRunner.makeRequest("/api/tesla-data");
        const duration = Date.now() - startTime;

        expect(response.ok).toBe(true);
        expect(response.status).toBe(200);

        const data = response.data;
        expect(data).toHaveProperty("battery_level");
        expect(data).toHaveProperty("range");
        expect(data).toHaveProperty("odometer");
        expect(data).toHaveProperty("location");

        // Validate data types
        expect(typeof data.battery_level).toBe("number");
        expect(typeof data.range).toBe("number");
        expect(typeof data.odometer).toBe("number");
        expect(data.location).toHaveProperty("lat");
        expect(data.location).toHaveProperty("lng");

        testRunner.logResult("Tesla Data Structure", {
          passed: true,
          duration,
          dataSize: JSON.stringify(data).length,
        });
      });
    });

    it("should return realistic data values", async () => {
      const response = await testRunner.makeRequest("/api/tesla-data");
      const data = response.data;

      // Battery level should be 0-100
      expect(data.battery_level).toBeGreaterThanOrEqual(0);
      expect(data.battery_level).toBeLessThanOrEqual(100);

      // Range should be reasonable (0-500 miles)
      expect(data.range).toBeGreaterThanOrEqual(0);
      expect(data.range).toBeLessThanOrEqual(500);

      // Odometer should be positive
      expect(data.odometer).toBeGreaterThan(0);

      // Location should be valid coordinates
      expect(data.location.lat).toBeGreaterThanOrEqual(-90);
      expect(data.location.lat).toBeLessThanOrEqual(90);
      expect(data.location.lng).toBeGreaterThanOrEqual(-180);
      expect(data.location.lng).toBeLessThanOrEqual(180);
    });

    it("should handle high frequency requests", async () => {
      const requests = [];
      const requestCount = 10;

      // Make concurrent requests
      for (let i = 0; i < requestCount; i++) {
        requests.push(testRunner.makeRequest("/api/tesla-data"));
      }

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach((response, index) => {
        expect(response.ok).toBe(true);
        expect(response.status).toBe(200);
      });

      // Calculate average response time
      const avgResponseTime =
        responses.reduce((sum, r) => sum + r.responseTime, 0) /
        responses.length;
      expect(avgResponseTime).toBeLessThan(3000); // Average should be under 3 seconds
    });
  });

  describe("Config Endpoint", () => {
    it("should return configuration without sensitive data", async () => {
      const response = await testRunner.makeRequest("/api/config");

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);

      const config = response.data;
      expect(config).toHaveProperty("config");

      // Should not expose API keys or secrets
      const configStr = JSON.stringify(config);
      expect(configStr).not.toMatch(/sk-/); // No secret keys
      expect(configStr).not.toMatch(/password/i);
      expect(configStr).not.toMatch(/secret/i);
      expect(configStr).not.toMatch(/token/i);
    });

    it("should include frontend configuration", async () => {
      const response = await testRunner.makeRequest("/api/config");
      const config = response.data.config;

      expect(config).toHaveProperty("mapbox");
      expect(config).toHaveProperty("refreshInterval");
      expect(typeof config.refreshInterval).toBe("number");
    });
  });

  describe("Error Handling", () => {
    it("should return 404 for non-existent endpoints", async () => {
      const response = await testRunner.makeRequest("/api/non-existent");

      expect(response.status).toBe(404);
    });

    it("should handle malformed requests gracefully", async () => {
      const response = await testRunner.makeRequest("/api/tesla-data", {
        method: "POST",
        body: "invalid json",
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
    });

    it("should include proper error messages", async () => {
      const response = await testRunner.makeRequest("/api/non-existent");

      if (response.headers["content-type"]?.includes("application/json")) {
        expect(response.data).toHaveProperty("error");
        expect(typeof response.data.error).toBe("string");
      }
    });
  });

  describe("Performance Tests", () => {
    it("should respond to health checks under 1 second", async () => {
      const startTime = Date.now();
      const response = await testRunner.makeRequest("/health");
      const duration = Date.now() - startTime;

      expect(response.ok).toBe(true);
      expect(duration).toBeLessThan(1000);
    });

    it("should handle burst traffic", async () => {
      const burstSize = 50;
      const promises = Array(burstSize)
        .fill()
        .map((_, i) =>
          testRunner
            .makeRequest("/health")
            .then((response) => ({ index: i, ...response }))
        );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(
        (r) => r.status === "fulfilled" && r.value.ok
      );

      // At least 90% should succeed during burst
      expect(successful.length / burstSize).toBeGreaterThan(0.9);
    });

    it("should maintain performance under sustained load", async () => {
      const duration = 30000; // 30 seconds
      const interval = 1000; // 1 second intervals
      const startTime = Date.now();
      const results = [];

      while (Date.now() - startTime < duration) {
        const requestStart = Date.now();
        try {
          const response = await testRunner.makeRequest("/health");
          const requestDuration = Date.now() - requestStart;
          results.push({ success: response.ok, duration: requestDuration });
        } catch (error) {
          results.push({ success: false, error: error.message });
        }

        await new Promise((resolve) => setTimeout(resolve, interval));
      }

      const successRate =
        results.filter((r) => r.success).length / results.length;
      const avgResponseTime =
        results
          .filter((r) => r.success)
          .reduce((sum, r) => sum + r.duration, 0) /
        results.filter((r) => r.success).length;

      expect(successRate).toBeGreaterThan(0.95); // 95% success rate
      expect(avgResponseTime).toBeLessThan(2000); // Average under 2 seconds
    });
  });

  describe("Data Consistency", () => {
    it("should return consistent data structure across requests", async () => {
      const request1 = await testRunner.makeRequest("/api/tesla-data");
      const request2 = await testRunner.makeRequest("/api/tesla-data");

      const keys1 = Object.keys(request1.data).sort();
      const keys2 = Object.keys(request2.data).sort();

      expect(keys1).toEqual(keys2);
    });

    it("should show realistic data changes over time", async () => {
      const initial = await testRunner.makeRequest("/api/tesla-data");

      // Wait 5 seconds
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const later = await testRunner.makeRequest("/api/tesla-data");

      // Battery level might change slightly but not dramatically
      const batteryDiff = Math.abs(
        initial.data.battery_level - later.data.battery_level
      );
      expect(batteryDiff).toBeLessThan(5); // Less than 5% change in 5 seconds
    });
  });

  describe("Security Tests", () => {
    it("should not expose internal server information", async () => {
      const response = await testRunner.makeRequest("/health");

      // Should not expose server technology
      expect(response.headers.server).toBeUndefined();
      expect(response.headers["x-powered-by"]).toBeUndefined();
    });

    it("should have security headers", async () => {
      const response = await testRunner.makeRequest("/health");

      expect(response.headers).toHaveProperty("x-content-type-options");
      expect(response.headers["x-content-type-options"]).toBe("nosniff");
    });

    it("should handle SQL injection attempts safely", async () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "<script>alert('xss')</script>",
      ];

      for (const input of maliciousInputs) {
        const response = await testRunner.makeRequest(
          `/api/tesla-data?param=${encodeURIComponent(input)}`
        );

        // Should not return 500 or expose errors
        expect(response.status).not.toBe(500);

        if (response.status >= 400) {
          // Error responses should not expose system details
          const errorText =
            typeof response.data === "string"
              ? response.data
              : JSON.stringify(response.data);
          expect(errorText.toLowerCase()).not.toContain("sql");
          expect(errorText.toLowerCase()).not.toContain("database");
          expect(errorText.toLowerCase()).not.toContain("error:");
        }
      }
    });
  });
});

// Export test utilities for use in recursive pipeline
export const apiTestUtils = {
  async runHealthCheck() {
    const runner = new APITestRunner();
    return await runner.makeRequest("/health");
  },

  async validateAllEndpoints() {
    const runner = new APITestRunner();
    const endpoints = Object.values(TEST_CONFIG.endpoints);

    const results = await Promise.allSettled(
      endpoints.map((endpoint) => runner.makeRequest(endpoint))
    );

    return results.map((result, index) => ({
      endpoint: endpoints[index],
      success: result.status === "fulfilled" && result.value.ok,
      response: result.status === "fulfilled" ? result.value : null,
      error: result.status === "rejected" ? result.reason.message : null,
    }));
  },

  async measurePerformance() {
    const runner = new APITestRunner();
    const metrics = {};

    for (const [name, endpoint] of Object.entries(TEST_CONFIG.endpoints)) {
      const start = Date.now();
      try {
        const response = await runner.makeRequest(endpoint);
        metrics[name] = {
          responseTime: Date.now() - start,
          success: response.ok,
          status: response.status,
        };
      } catch (error) {
        metrics[name] = {
          responseTime: Date.now() - start,
          success: false,
          error: error.message,
        };
      }
    }

    return metrics;
  },
};
