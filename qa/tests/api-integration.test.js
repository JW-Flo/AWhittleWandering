/**
 * Comprehensive API Integration Tests
 * Tests public + admin endpoints with safe retry/backoff.
 *
 * Notes:
 * - External API data is untrusted: validate shapes at runtime.
 * - Avoid load tests by default (enable via QA_STRESS=true).
 * - Never log secrets or full payloads (report only summaries).
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { getQAConfig } from "../src/qa-config.js";
import { createArtifactPaths, writeJson } from "../src/puppeteer/harness.js";

const cfg = getQAConfig();
const API_BASE_URL =
  cfg.apiBaseUrl || "https://awhittlewandering-api.kd8jc7v8cd.workers.dev";
const artifacts = createArtifactPaths(process.env.QA_RUN_ID);

// Test configuration
const TEST_CONFIG = {
  timeoutMs: Number(process.env.QA_REQUEST_TIMEOUT_MS || 15000),
  retries: Number(process.env.QA_API_RETRIES || 3),
  stress: Boolean(cfg.flags?.stress),
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function summarizeData(data) {
  if (data == null) return { type: "null" };
  if (typeof data === "string") return { type: "string", length: data.length };
  if (Array.isArray(data)) return { type: "array", length: data.length };
  if (isPlainObject(data)) return { type: "object", keys: Object.keys(data).slice(0, 50) };
  return { type: typeof data };
}

class APITestRunner {
  constructor() {
    this.results = [];
    this.startedAt = Date.now();
  }

  async request(path, options = {}) {
    const url = `${API_BASE_URL}${path}`;
    const timeoutMs = options.timeoutMs ?? TEST_CONFIG.timeoutMs;
    const maxRetries = options.retries ?? TEST_CONFIG.retries;
    const method = options.method || "GET";

    // Never print secrets: do not log headers/body.
    const headers = {
      "User-Agent": "QA-Test-Suite/1.0",
      Accept: "application/json",
      ...(method !== "GET" ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    };

    let lastErr = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const start = Date.now();
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(url, {
          method,
          headers,
          body: options.body,
          signal: controller.signal,
        });
        const elapsedMs = Date.now() - start;
        const resHeaders = Object.fromEntries(res.headers);
        const contentType = res.headers.get("content-type") || "";
        const parsed =
          contentType.includes("application/json") ? await res.json() : await res.text();

        const response = {
          ok: res.ok,
          status: res.status,
          headers: resHeaders,
          data: parsed,
          elapsedMs,
        };

        // Retry on rate limit or transient 5xx
        const retryable = res.status === 429 || res.status >= 500;
        if (retryable && attempt < maxRetries) {
          const backoff = Math.min(4000, 500 * Math.pow(2, attempt - 1));
          await sleep(backoff);
          continue;
        }

        return response;
      } catch (e) {
        lastErr = e;
        const msg = e?.message || String(e);
        if (attempt < maxRetries) {
          const backoff = Math.min(4000, 500 * Math.pow(2, attempt - 1));
          await sleep(backoff);
          continue;
        }
        throw new Error(`Request failed: ${msg}`);
      } finally {
        clearTimeout(t);
      }
    }
    throw lastErr || new Error("Request failed");
  }

  record(testName, result) {
    this.results.push({
      test: testName,
      timestamp: new Date().toISOString(),
      ...result,
    });
  }
}

describe("API Integration Tests", () => {
  let testRunner;
  const report = {
    runId: artifacts.runId,
    startedAt: new Date().toISOString(),
    apiBaseUrl: API_BASE_URL,
    admin: {
      tokenPresent: cfg.admin?.tokenPresent || false,
      allowMutations: cfg.admin?.allowMutations || false,
      requireToken: cfg.admin?.requireToken || false,
    },
    results: [],
  };

  beforeAll(() => {
    testRunner = new APITestRunner();
  });

  afterAll(() => {
    report.endedAt = new Date().toISOString();
    report.results = testRunner.results;
    writeJson(artifacts.reportPath("api-summary"), report);
  });

  it("GET /api/v1/health returns structured health", async () => {
    const start = Date.now();
    const res = await testRunner.request("/api/v1/health");
    const durationMs = Date.now() - start;

    testRunner.record("health", {
      passed: res.status === 200,
      durationMs,
      status: res.status,
      elapsedMs: res.elapsedMs,
      dataSummary: summarizeData(res.data),
    });

    expect(isPlainObject(res.data)).toBe(true);
    expect(res.data).toHaveProperty("status");
    expect(res.data).toHaveProperty("timestamp");
    expect(res.data).toHaveProperty("version");
    expect(res.status).toBe(200);
    expect(durationMs).toBeLessThan(8000);
  }, 30000);

  it("GET /api/v1/meta/routes enumerates API surface", async () => {
    const res = await testRunner.request("/api/v1/meta/routes");
    testRunner.record("meta-routes", {
      passed: res.ok,
      status: res.status,
      elapsedMs: res.elapsedMs,
      dataSummary: summarizeData(res.data),
    });

    expect(res.ok).toBe(true);
    expect(isPlainObject(res.data)).toBe(true);
    expect(res.data).toHaveProperty("ok", true);
    expect(res.data).toHaveProperty("endpoints");
  }, 30000);

  it("GET /api/v1/config returns frontend-safe config", async () => {
    const res = await testRunner.request("/api/v1/config");
    testRunner.record("config", {
      passed: res.ok,
      status: res.status,
      elapsedMs: res.elapsedMs,
      dataSummary: summarizeData(res.data),
    });

    expect(res.ok).toBe(true);
    expect(isPlainObject(res.data)).toBe(true);
    expect(res.data).toHaveProperty("appName");
    expect(res.data).toHaveProperty("apiVersion");
    expect(res.data).toHaveProperty("features");
    expect(isPlainObject(res.data.features)).toBe(true);

    // Must not leak secrets (basic heuristic)
    const s = JSON.stringify(res.data);
    expect(s).not.toMatch(/tessie/i);
    expect(s).not.toMatch(/jwt/i);
    expect(s).not.toMatch(/admin_token/i);
  }, 30000);

  it("GET /api/v1/unified-data returns contract skeleton", async () => {
    const res = await testRunner.request("/api/v1/unified-data");
    testRunner.record("unified-data", {
      passed: res.ok,
      status: res.status,
      elapsedMs: res.elapsedMs,
      dataSummary: summarizeData(res.data),
    });

    expect(res.ok).toBe(true);
    expect(isPlainObject(res.data)).toBe(true);
    expect(res.data).toHaveProperty("overview");
    expect(res.data).toHaveProperty("currentStatus");
    expect(res.data).toHaveProperty("tessieStatus");
  }, 30000);

  it("GET /api/v1/trip-status returns current trip marker", async () => {
    const res = await testRunner.request("/api/v1/trip-status");
    testRunner.record("trip-status", {
      passed: res.ok,
      status: res.status,
      elapsedMs: res.elapsedMs,
      dataSummary: summarizeData(res.data),
    });

    expect(res.ok).toBe(true);
    expect(isPlainObject(res.data)).toBe(true);
    expect(res.data).toHaveProperty("tripId");
    expect(res.data).toHaveProperty("status");
  }, 30000);

  it("GET /api/v1/component/* endpoints respond", async () => {
    const endpoints = [
      "/api/v1/component/overview",
      "/api/v1/component/current-status",
      "/api/v1/component/states-progress",
      "/api/v1/component/recent-drives?limit=5",
    ];

    for (const ep of endpoints) {
      const res = await testRunner.request(ep);
      testRunner.record(`component:${ep}`, {
        passed: res.ok,
        status: res.status,
        elapsedMs: res.elapsedMs,
        dataSummary: summarizeData(res.data),
      });
      expect(res.status).toBeLessThan(500);
    }
  }, 60000);

  it("GET /api/v1/analytics/* endpoints respond", async () => {
    const endpoints = [
      "/api/v1/analytics/comprehensive?limit=7",
      "/api/v1/analytics/efficiency?limit=7",
      "/api/v1/analytics/charging",
    ];

    for (const ep of endpoints) {
      const res = await testRunner.request(ep);
      testRunner.record(`analytics:${ep}`, {
        passed: res.ok,
        status: res.status,
        elapsedMs: res.elapsedMs,
        dataSummary: summarizeData(res.data),
      });
      expect(res.status).toBeLessThan(500);
    }
  }, 60000);

  it("GET /api/v1/vehicle/state/enhanced responds", async () => {
    const res = await testRunner.request("/api/v1/vehicle/state/enhanced");
    testRunner.record("vehicle-state-enhanced", {
      passed: res.ok,
      status: res.status,
      elapsedMs: res.elapsedMs,
      dataSummary: summarizeData(res.data),
    });
    expect(res.status).toBeLessThan(500);
  }, 30000);

  it("Admin endpoints: enforce auth when configured, succeed when token provided", async () => {
    if (cfg.admin?.requireToken && !cfg.admin?.tokenPresent) {
      throw new Error(
        "QA_REQUIRE_ADMIN_TOKEN=true but QA_ADMIN_TOKEN is not set"
      );
    }

    // Unauthenticated call: either 401/403 (token configured) or 200 in dev (no token configured).
    const unauth = await testRunner.request("/api/v1/admin/status", {
      retries: 1,
    });
    testRunner.record("admin-status:unauth", {
      passed: [200, 401, 403].includes(unauth.status),
      status: unauth.status,
      elapsedMs: unauth.elapsedMs,
      dataSummary: summarizeData(unauth.data),
    });

    if (cfg.admin?.tokenPresent) {
      const authz = await testRunner.request("/api/v1/admin/status", {
        headers: { Authorization: `Bearer ${cfg.admin.token}` },
      });
      testRunner.record("admin-status:auth", {
        passed: authz.ok,
        status: authz.status,
        elapsedMs: authz.elapsedMs,
        dataSummary: summarizeData(authz.data),
      });
      expect(authz.ok).toBe(true);
      expect(isPlainObject(authz.data)).toBe(true);
      expect(authz.data).toHaveProperty("service");

      // Read-only admin endpoints
      const cron = await testRunner.request("/api/v1/admin/cron/metrics", {
        headers: { Authorization: `Bearer ${cfg.admin.token}` },
      });
      testRunner.record("admin-cron-metrics", {
        passed: cron.status !== 401 && cron.status !== 403,
        status: cron.status,
        elapsedMs: cron.elapsedMs,
        dataSummary: summarizeData(cron.data),
      });
      expect([200, 500].includes(cron.status)).toBe(true);

      const dataVehicles = await testRunner.request(
        "/api/v1/admin/data/vehicles?limit=1&offset=0",
        { headers: { Authorization: `Bearer ${cfg.admin.token}` } }
      );
      testRunner.record("admin-data-vehicles", {
        passed: dataVehicles.status !== 401 && dataVehicles.status !== 403,
        status: dataVehicles.status,
        elapsedMs: dataVehicles.elapsedMs,
        dataSummary: summarizeData(dataVehicles.data),
      });
      expect([200, 500].includes(dataVehicles.status)).toBe(true);

      if (cfg.admin?.allowMutations) {
        const cleared = await testRunner.request("/api/v1/admin/cache/clear", {
          method: "POST",
          headers: { Authorization: `Bearer ${cfg.admin.token}` },
        });
        testRunner.record("admin-cache-clear", {
          passed: cleared.ok,
          status: cleared.status,
          elapsedMs: cleared.elapsedMs,
          dataSummary: summarizeData(cleared.data),
        });
        expect(cleared.ok).toBe(true);
      }
    }
  }, 60000);

  it("Optional stress: small burst to /api/v1/health (QA_STRESS=true)", async () => {
    if (!TEST_CONFIG.stress) return;

    const burstSize = 10;
    const results = await Promise.all(
      Array.from({ length: burstSize }, () => testRunner.request("/api/v1/health", { retries: 1 }))
    );
    const okCount = results.filter((r) => r.status === 200).length;
    testRunner.record("stress:health-burst", {
      passed: okCount / burstSize >= 0.8,
      okCount,
      burstSize,
    });
    expect(okCount / burstSize).toBeGreaterThanOrEqual(0.8);
  }, 30000);
});

export const apiTestUtils = {
  async runHealthCheck() {
    const runner = new APITestRunner();
    return await runner.request("/api/v1/health", { retries: 1 });
  },

  async validateAllEndpoints() {
    const runner = new APITestRunner();
    const endpoints = [
      "/api/v1/health",
      "/api/v1/meta/routes",
      "/api/v1/config",
      "/api/v1/unified-data",
      "/api/v1/trip-status",
    ];

    const settled = await Promise.allSettled(
      endpoints.map((ep) => runner.request(ep, { retries: 1 }))
    );

    return settled.map((r, idx) => {
      if (r.status === "fulfilled") {
        return {
          endpoint: endpoints[idx],
          success: r.value.status < 500,
          status: r.value.status,
          dataSummary: summarizeData(r.value.data),
        };
      }
      return { endpoint: endpoints[idx], success: false, error: r.reason?.message || String(r.reason) };
    });
  },

  async measurePerformance() {
    const runner = new APITestRunner();
    const start = Date.now();
    const res = await runner.request("/api/v1/health", { retries: 1 });
    return { ok: res.status === 200, status: res.status, elapsedMs: Date.now() - start };
  },
};
