/**
 * Standalone API QA runner (no Vitest dependency).
 *
 * Purpose: produce deterministic, machine-readable results even when the local
 * JS toolchain install is blocked (e.g., esbuild postinstall).
 *
 * Output: qa/reports/artifacts/<runId>/api-runner.json
 *
 * Env:
 * - QA_API_BASE_URL
 * - QA_ADMIN_TOKEN (optional)
 * - QA_ALLOW_MUTATIONS (default false)
 * - QA_REQUIRE_ADMIN_TOKEN (default false)
 */
import { getQAConfig } from "./src/qa-config.js";
import { createArtifactPaths, writeJson } from "./src/reporting/artifacts.js";

const cfg = getQAConfig();
const artifacts = createArtifactPaths(process.env.QA_RUN_ID);

const API_BASE_URL =
  cfg.apiBaseUrl || "https://awhittlewandering-api.kd8jc7v8cd.workers.dev";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function summarize(data) {
  if (data == null) return { type: "null" };
  if (typeof data === "string") return { type: "string", length: data.length };
  if (Array.isArray(data)) return { type: "array", length: data.length };
  if (typeof data === "object")
    return { type: "object", keys: Object.keys(data).slice(0, 50) };
  return { type: typeof data };
}

function truncateString(s, max = 300) {
  const str = String(s);
  return str.length > max ? `${str.slice(0, max)}…` : str;
}

function pickSafeErrorFields(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const out = {};
  for (const k of ["error", "message", "details", "available_endpoints", "allowed"]) {
    if (k in data) out[k] = data[k];
  }
  // Truncate string fields to avoid accidental large payloads/logs
  for (const [k, v] of Object.entries(out)) {
    if (typeof v === "string") out[k] = truncateString(v);
  }
  return Object.keys(out).length ? out : null;
}

async function request(path, { method = "GET", headers = {}, body, retries = 3 } = {}) {
  const url = `${API_BASE_URL}${path}`;
  let lastErr = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const start = Date.now();
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), cfg.timeouts.requestMs);
    try {
      const res = await fetch(url, {
        method,
        headers: {
          "User-Agent": "QA-Standalone/1.0",
          Accept: "application/json",
          ...(method !== "GET" ? { "Content-Type": "application/json" } : {}),
          ...headers,
        },
        body,
        signal: controller.signal,
      });
      const elapsedMs = Date.now() - start;
      const ct = res.headers.get("content-type") || "";
      const data = ct.includes("application/json") ? await res.json() : await res.text();

      // Retry on 429/5xx
      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
        await sleep(Math.min(4000, 500 * Math.pow(2, attempt - 1)));
        continue;
      }

      return { ok: res.ok, status: res.status, elapsedMs, data };
    } catch (e) {
      lastErr = e;
      if (attempt < retries) {
        await sleep(Math.min(4000, 500 * Math.pow(2, attempt - 1)));
        continue;
      }
      throw e;
    } finally {
      clearTimeout(t);
    }
  }

  throw lastErr || new Error("request failed");
}

function recordStep(report, name, result) {
  report.steps.push({
    name,
    timestamp: new Date().toISOString(),
    ...result,
  });
}

async function main() {
  const report = {
    runId: artifacts.runId,
    startedAt: new Date().toISOString(),
    apiBaseUrl: API_BASE_URL,
    admin: {
      tokenPresent: cfg.admin?.tokenPresent || false,
      allowMutations: cfg.admin?.allowMutations || false,
      requireToken: cfg.admin?.requireToken || false,
    },
    steps: [],
  };

  const endpoints = [
    { name: "health", path: "/api/v1/health", expect: (r) => r.status === 200 },
    { name: "meta-routes", path: "/api/v1/meta/routes", expect: (r) => r.status === 200 },
    { name: "config", path: "/api/v1/config", expect: (r) => r.status === 200 },
    { name: "unified-data", path: "/api/v1/unified-data", expect: (r) => r.status === 200 },
    { name: "trip-status", path: "/api/v1/trip-status", expect: (r) => r.status === 200 },
    { name: "component-overview", path: "/api/v1/component/overview", expect: (r) => r.status < 500 },
    { name: "component-current-status", path: "/api/v1/component/current-status", expect: (r) => r.status < 500 },
    { name: "component-states-progress", path: "/api/v1/component/states-progress", expect: (r) => r.status < 500 },
    { name: "component-recent-drives", path: "/api/v1/component/recent-drives?limit=5", expect: (r) => r.status < 500 },
    { name: "analytics-comprehensive", path: "/api/v1/analytics/comprehensive?limit=7", expect: (r) => r.status < 500 },
    { name: "analytics-efficiency", path: "/api/v1/analytics/efficiency?limit=7", expect: (r) => r.status < 500 },
    { name: "analytics-charging", path: "/api/v1/analytics/charging", expect: (r) => r.status < 500 },
    { name: "vehicle-state-enhanced", path: "/api/v1/vehicle/state/enhanced", expect: (r) => r.status < 500 },
  ];

  for (const ep of endpoints) {
    try {
      const res = await request(ep.path, { retries: 3 });
      const passed = Boolean(ep.expect(res));
      recordStep(report, ep.name, {
        ok: passed,
        status: res.status,
        elapsedMs: res.elapsedMs,
        dataSummary: summarize(res.data),
        ...(res.status >= 400 ? { safeError: pickSafeErrorFields(res.data) } : {}),
      });
    } catch (e) {
      recordStep(report, ep.name, {
        ok: false,
        error: e?.message || String(e),
      });
    }
  }

  // Admin endpoints (auth behavior varies depending on whether ADMIN_TOKEN is configured server-side)
  const adminStatus = await request("/api/v1/admin/status", { retries: 1 }).catch((e) => ({
    ok: false,
    status: 0,
    elapsedMs: 0,
    data: { error: e?.message || String(e) },
  }));
  recordStep(report, "admin-status:unauth", {
    ok: [200, 401, 403].includes(adminStatus.status),
    status: adminStatus.status,
    elapsedMs: adminStatus.elapsedMs,
    dataSummary: summarize(adminStatus.data),
  });

  if (cfg.admin?.requireToken && !cfg.admin?.tokenPresent) {
    recordStep(report, "admin:missing-token", {
      ok: false,
      error: "QA_REQUIRE_ADMIN_TOKEN=true but QA_ADMIN_TOKEN not set",
    });
  }

  if (cfg.admin?.tokenPresent) {
    const authHeader = { Authorization: `Bearer ${cfg.admin.token}` };

    const auth = await request("/api/v1/admin/status", {
      headers: authHeader,
      retries: 2,
    });
    recordStep(report, "admin-status:auth", {
      ok: auth.status === 200,
      status: auth.status,
      elapsedMs: auth.elapsedMs,
      dataSummary: summarize(auth.data),
    });

    const cron = await request("/api/v1/admin/cron/metrics", {
      headers: authHeader,
      retries: 2,
    });
    recordStep(report, "admin-cron-metrics", {
      ok: [200, 500].includes(cron.status),
      status: cron.status,
      elapsedMs: cron.elapsedMs,
      dataSummary: summarize(cron.data),
    });

    const vehicles = await request("/api/v1/admin/data/vehicles?limit=1&offset=0", {
      headers: authHeader,
      retries: 2,
    });
    recordStep(report, "admin-data-vehicles", {
      ok: [200, 500].includes(vehicles.status),
      status: vehicles.status,
      elapsedMs: vehicles.elapsedMs,
      dataSummary: summarize(vehicles.data),
    });

    if (cfg.admin?.allowMutations) {
      const cleared = await request("/api/v1/admin/cache/clear", {
        method: "POST",
        headers: authHeader,
        retries: 2,
      });
      recordStep(report, "admin-cache-clear", {
        ok: cleared.status === 200,
        status: cleared.status,
        elapsedMs: cleared.elapsedMs,
        dataSummary: summarize(cleared.data),
      });
    } else {
      recordStep(report, "admin-cache-clear:skipped", { ok: true, skipped: true });
    }
  }

  report.endedAt = new Date().toISOString();
  report.summary = {
    total: report.steps.length,
    failed: report.steps.filter((s) => !s.ok).length,
    passed: report.steps.filter((s) => s.ok).length,
  };

  const outPath = artifacts.reportPath("api-runner");
  writeJson(outPath, report);

  // Keep console output minimal and non-sensitive
  if (report.summary.failed > 0) process.exit(1);
}

await main();










