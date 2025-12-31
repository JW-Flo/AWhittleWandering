/**
 * Standalone E2E QA runner (no Vitest dependency).
 *
 * Output: qa/reports/artifacts/<runId>/e2e-runner.json + screenshots.
 *
 * Requires puppeteer available in NODE_PATH. Recommended invocation:
 *   npx -p puppeteer -c "node qa/run-e2e-qa.mjs"
 */
import { getQAConfig, joinUrl } from "./src/qa-config.js";
import {
  attachPageMonitors,
  createArtifactPaths,
  launchBrowser,
  safeScreenshot,
  writeJson,
} from "./src/puppeteer/harness.js";

const cfg = getQAConfig();
const FRONTEND_URL = cfg.frontendUrl || "https://awhittlewandering.pages.dev";
const artifacts = createArtifactPaths(process.env.QA_RUN_ID);

async function recordStep(report, name, fn, { screenshotOnFail = true } = {}) {
  const startedAt = Date.now();
  try {
    await fn();
    report.steps.push({
      name,
      ok: true,
      durationMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    const entry = {
      name,
      ok: false,
      durationMs: Date.now() - startedAt,
      error: e?.message || String(e),
      timestamp: new Date().toISOString(),
    };
    if (screenshotOnFail && report._page) {
      const p = artifacts.screenshotPath(`fail-${name}`);
      const ss = await safeScreenshot(report._page, p);
      if (ss.ok) report.artifacts.screenshots.push(p);
    }
    report.steps.push(entry);
    throw e;
  }
}

async function waitVisible(page, selector, timeout = 20000) {
  await page.waitForSelector(selector, { visible: true, timeout });
}

async function main() {
  const report = {
    runId: artifacts.runId,
    startedAt: new Date().toISOString(),
    frontendUrl: FRONTEND_URL,
    artifacts: {
      dir: artifacts.dir,
      screenshots: [],
      reportPath: artifacts.reportPath("e2e-runner"),
    },
    steps: [],
    errors: {},
  };

  const browser = await launchBrowser({ headless: true });
  const page = await browser.newPage();
  report._page = page; // internal
  await page.setViewport({ width: 1200, height: 800 });
  const monitors = attachPageMonitors(page);

  const goto = async (pathname) => {
    const url = joinUrl(FRONTEND_URL, pathname);
    const res = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: cfg.timeouts.navigationMs,
    });
    return { url, status: res?.status?.() ?? null };
  };

  try {
    await recordStep(report, "dashboard-load", async () => {
      const r = await goto("/");
      if (r.status == null || r.status >= 500) throw new Error(`HTTP ${r.status}`);
      await waitVisible(page, '[data-testid="dashboard-header"]');
      await waitVisible(page, '[data-testid="dashboard-content"]');
      const ss = await safeScreenshot(page, artifacts.screenshotPath("dashboard"));
      if (ss.ok) report.artifacts.screenshots.push(ss.path);
    });

    await recordStep(report, "dashboard-interactions", async () => {
      await goto("/");
      await waitVisible(page, '[data-testid="refresh-button"]');
      await page.click('[data-testid="refresh-button"]');
      await page.waitForTimeout(1200);

      await page.click('[data-testid="auth-login-button"]');
      await waitVisible(page, '[data-testid="auth-message"]', 15000);

      await page.click('[data-testid="tab-vehicle"]');
      await waitVisible(page, '[data-testid="tab-content-vehicle"]');
      await page.click('[data-testid="tab-roadtrip"]');
      await waitVisible(page, '[data-testid="tab-content-roadtrip"]');
      await page.click('[data-testid="tab-dashboard"]');
      await waitVisible(page, '[data-testid="tab-content-dashboard"]');
    });

    await recordStep(report, "coordination-navigation", async () => {
      await goto("/");
      await waitVisible(page, '[data-testid="coordination-link"]');
      await page.click('[data-testid="coordination-link"]');
      await page.waitForFunction(() => window.location.pathname === "/coordination", {
        timeout: cfg.timeouts.navigationMs,
      });
      await waitVisible(page, '[data-testid="coordination-page"]');
      const ss = await safeScreenshot(page, artifacts.screenshotPath("coordination"));
      if (ss.ok) report.artifacts.screenshots.push(ss.path);
    });

    await recordStep(report, "forced-unified-data-failure", async () => {
      await page.setRequestInterception(true);
      let injectedFailures = 0;
      let unifiedRequests = 0;

      const handler = async (req) => {
        const url = req.url();
        if (url.includes("/api/v1/unified-data")) {
          unifiedRequests += 1;
          if (injectedFailures < 1) {
            injectedFailures += 1;
            await req.respond({
              status: 500,
              contentType: "application/json",
              body: JSON.stringify({ ok: false, error: "forced failure" }),
            });
            return;
          }
        }
        await req.continue();
      };

      page.on("request", handler);

      await goto("/");
      await waitVisible(page, '[data-testid="error-message"]', 20000);
      await waitVisible(page, '[data-testid="retry-button"]', 20000);

      const ss = await safeScreenshot(page, artifacts.screenshotPath("forced-error"));
      if (ss.ok) report.artifacts.screenshots.push(ss.path);

      await page.click('[data-testid="retry-button"]');
      await page.waitForFunction(
        () => !document.querySelector('[data-testid="error-card"]'),
        { timeout: 20000 }
      );

      if (injectedFailures !== 1) throw new Error("did not inject exactly one failure");
      if (unifiedRequests < 2) throw new Error("retry did not trigger another request");

      page.off("request", handler);
      await page.setRequestInterception(false);
    });
  } finally {
    report.endedAt = new Date().toISOString();
    report.errors = {
      consoleErrors: monitors.consoleErrors,
      pageErrors: monitors.pageErrors,
      requestFailures: monitors.requestFailures,
    };
    writeJson(report.artifacts.reportPath, report);
    await browser.close();
    delete report._page;
  }

  const failed = report.steps.filter((s) => !s.ok).length;
  if (failed > 0) process.exit(1);
}

await main();










