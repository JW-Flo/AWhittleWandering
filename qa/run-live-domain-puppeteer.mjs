/**
 * Live-site Puppeteer QA for awhittlewandering.com
 *
 * Run (no local install required):
 *   PUPPETEER_SKIP_DOWNLOAD=1 npx -y -p puppeteer -c "node qa/run-live-domain-puppeteer.mjs"
 *
 * Output:
 *   qa/reports/artifacts/<runId>/live-domain.json (+ screenshots)
 *
 * Notes:
 * - This script intentionally does NOT import any local QA harness that depends on local puppeteer installs.
 * - It uses the system Chrome if present.
 */
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { createArtifactPaths, writeJson } from "./src/reporting/artifacts.js";
import { getQAConfig } from "./src/qa-config.js";

const artifacts = createArtifactPaths(process.env.QA_RUN_ID);
const qaConfig = getQAConfig();
const TARGET_URL = qaConfig.frontendUrl;
const API_BASE = qaConfig.apiBaseUrl;

function exists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function pickChromeExecutable() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ].filter(Boolean);
  return candidates.find(exists);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  // `npx -p puppeteer` does not reliably participate in ESM `import` resolution.
  // Using `require()` here ensures Node can resolve from NODE_PATH set by `npx`.
  const require = createRequire(import.meta.url);
  const puppeteerMod = require("puppeteer");
  const puppeteer = puppeteerMod.default || puppeteerMod;

  const executablePath = pickChromeExecutable();
  const report = {
    runId: artifacts.runId,
    startedAt: new Date().toISOString(),
    targetUrl: TARGET_URL,
    apiBase: API_BASE,
    executablePath: executablePath || null,
    steps: [],
    network: {
      apiCalls: [],
      failedRequests: [],
      consoleErrors: [],
      pageErrors: [],
    },
    artifacts: {
      dir: artifacts.dir,
      screenshots: [],
      reportPath: artifacts.reportPath("live-domain"),
    },
  };

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    // Allow progress even if local cert trust changes mid-run (seen intermittently on macOS).
    ignoreHTTPSErrors: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--ignore-certificate-errors",
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      report.network.consoleErrors.push({
        text: msg.text(),
        location: msg.location(),
        timestamp: new Date().toISOString(),
      });
    }
  });
  page.on("pageerror", (err) => {
    report.network.pageErrors.push({
      message: err?.message || String(err),
      timestamp: new Date().toISOString(),
    });
  });
  page.on("requestfailed", (req) => {
    report.network.failedRequests.push({
      url: req.url(),
      method: req.method(),
      failure: req.failure()?.errorText || "unknown",
      timestamp: new Date().toISOString(),
    });
  });
  page.on("response", async (res) => {
    const url = res.url();
    if (url.startsWith(API_BASE) || url.includes("/api/v1/")) {
      report.network.apiCalls.push({
        url,
        status: res.status(),
        contentType: res.headers()?.["content-type"],
        timestamp: new Date().toISOString(),
      });
    }
  });

  const step = async (name, fn) => {
    const start = Date.now();
    try {
      await fn();
      report.steps.push({
        name,
        ok: true,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      const shot = path.join(artifacts.dir, `${name.replace(/[^a-z0-9_-]+/gi, "-")}.png`);
      try {
        await page.screenshot({ path: shot, fullPage: true });
        report.artifacts.screenshots.push(shot);
      } catch {}
      report.steps.push({
        name,
        ok: false,
        durationMs: Date.now() - start,
        error: e?.message || String(e),
        screenshot: shot,
        timestamp: new Date().toISOString(),
      });
      throw e;
    }
  };

  try {
    await step("load-homepage", async () => {
      const res = await page.goto(TARGET_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
      if (!res) throw new Error("No response from navigation");
      if (res.status() >= 500) throw new Error(`HTTP ${res.status()}`);
      report.pageTitle = await page.title();
      const shot = path.join(artifacts.dir, "homepage.png");
      await page.screenshot({ path: shot, fullPage: true });
      report.artifacts.screenshots.push(shot);
    });

    await step("basic-react-render", async () => {
      const hasRoot = await page.$("#root");
      if (!hasRoot) throw new Error("Missing #root");

      const deadline = Date.now() + 20000;
      let rootLen = 0;
      while (Date.now() < deadline) {
        rootLen = await page.$eval("#root", (el) => (el.innerHTML || "").length);
        if (rootLen >= 50) break;
        await sleep(500);
      }
      report.rootContentLength = rootLen;
      if (rootLen < 50) throw new Error("Root appears empty after waiting (possible blank screen)");
    });

    await step("wait-for-app-settle", async () => {
      // Give the app time to fetch data / settle.
      await sleep(8000);
      report.bodyTextSample = await page.evaluate(() =>
        (document.body?.innerText || "").replace(/\s+/g, " ").trim().slice(0, 240)
      );
      const shot = path.join(artifacts.dir, "after-10s.png");
      await page.screenshot({ path: shot, fullPage: true });
      report.artifacts.screenshots.push(shot);
    });

    await step("detect-dashboard-testids", async () => {
      const selectors = [
        '[data-testid="dashboard-container"]',
        '[data-testid="dashboard-header"]',
        '[data-testid="dashboard-content"]',
      ];
      const found = {};
      for (const sel of selectors) {
        found[sel] = Boolean(await page.$(sel));
      }
      report.detectedTestIds = found;
    });

    await step("probe-api-from-browser", async () => {
      const results = await page.evaluate(async (base) => {
        const paths = ["/api/v1/health", "/api/v1/config", "/api/v1/unified-data", "/api/v1/meta/routes"];
        const out = [];
        for (const p of paths) {
          try {
            const r = await fetch(base + p, { headers: { Accept: "application/json" } });
            const ct = r.headers.get("content-type") || "";
            const body = ct.includes("application/json") ? await r.json() : await r.text();
            out.push({
              path: p,
              status: r.status,
              ok: r.ok,
              body: typeof body === "string" ? body.slice(0, 200) : body,
            });
          } catch (e) {
            out.push({ path: p, status: 0, ok: false, error: String(e) });
          }
        }
        return out;
      }, API_BASE);
      report.apiProbe = results;
    });

    await step("optional-ui-interactions", async () => {
      const canInteract = Boolean(await page.$('[data-testid="refresh-button"]'));
      report.canUseTestIds = canInteract;
      if (!canInteract) return;
      await page.click('[data-testid="refresh-button"]');
      await sleep(1500);
      report.uiObservedErrorCard = Boolean(await page.$('[data-testid="error-card"]'));
      const shot = path.join(artifacts.dir, "after-refresh.png");
      await page.screenshot({ path: shot, fullPage: true });
      report.artifacts.screenshots.push(shot);
    });
  } finally {
    report.endedAt = new Date().toISOString();
    writeJson(report.artifacts.reportPath, report);
    await browser.close();
  }
}

await main();

