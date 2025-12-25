/**
 * Puppeteer harness for reliable, repeatable E2E tests.
 *
 * - Standard launch options
 * - Console/page/network error capture
 * - Screenshot capture with deterministic naming
 *
 * Never log secrets/tokens. Do not embed Authorization headers here.
 *
 * IMPORTANT:
 * Some local environments can end up with a partially-broken Puppeteer install
 * (e.g. missing `node_modules/puppeteer/package.json`). To keep QA runnable,
 * `launchBrowser()` dynamically imports Puppeteer with a fallback to a direct file path.
 */
import fs from "fs";
import path from "path";
import { createArtifactPaths, writeJson, sanitizeFilePart, nowId } from "../reporting/artifacts.js";

export { createArtifactPaths, writeJson, sanitizeFilePart, nowId };

async function importPuppeteer() {
  // Preferred: normal package import
  try {
    const mod = await import("puppeteer");
    return mod?.default || mod;
  } catch {
    // Next best: puppeteer-core (no bundled browser required).
    try {
      const core = await import("puppeteer-core");
      return core?.default || core;
    } catch {
      // Last resort: direct file import for broken installs missing package.json
      // qa/src/puppeteer/harness.js -> repoRoot/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js
      const corePath = path.resolve(
        path.dirname(new URL(import.meta.url).pathname),
        "../../../node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js"
      );
      const fileUrl = new URL(`file://${corePath}`);
      const core = await import(fileUrl.href);
      return core?.default || core;
    }
  }
}

function findChromeExecutable() {
  const candidates = [];

  // Explicit override wins.
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    candidates.push(process.env.PUPPETEER_EXECUTABLE_PATH);
  }

  // Common macOS Chrome locations
  candidates.push("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome");
  candidates.push("/Applications/Chromium.app/Contents/MacOS/Chromium");

  // Chrome for Testing installed by `puppeteer browsers install chrome`
  // Typically: ~/.cache/puppeteer/chrome/<platform-build>/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing
  const home = process.env.HOME;
  if (home) {
    const base = path.join(home, ".cache", "puppeteer", "chrome");
    try {
      const dirs = fs.existsSync(base) ? fs.readdirSync(base) : [];
      for (const d of dirs) {
        const p = path.join(
          base,
          d,
          "chrome-mac-x64",
          "Google Chrome for Testing.app",
          "Contents",
          "MacOS",
          "Google Chrome for Testing"
        );
        candidates.push(p);
      }
    } catch {
      // ignore
    }
  }

  for (const p of candidates) {
    try {
      if (p && fs.existsSync(p)) return p;
    } catch {
      // ignore
    }
  }
  return undefined;
}

export async function launchBrowser({ headless = true } = {}) {
  const puppeteer = await importPuppeteer();
  const args = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
  ];

  const executablePath = findChromeExecutable();

  return await puppeteer.launch({
    headless,
    executablePath,
    args,
  });
}

export function attachPageMonitors(page) {
  const events = {
    consoleErrors: [],
    pageErrors: [],
    requestFailures: [],
    responses: [],
  };

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      events.consoleErrors.push({
        text: msg.text(),
        location: msg.location(),
        timestamp: new Date().toISOString(),
      });
    }
  });

  page.on("pageerror", (err) => {
    events.pageErrors.push({
      message: err?.message || String(err),
      timestamp: new Date().toISOString(),
    });
  });

  page.on("requestfailed", (req) => {
    events.requestFailures.push({
      url: req.url(),
      method: req.method(),
      failure: req.failure()?.errorText || "unknown",
      timestamp: new Date().toISOString(),
    });
  });

  page.on("response", (res) => {
    events.responses.push({
      url: res.url(),
      status: res.status(),
      contentType: res.headers()?.["content-type"],
      timestamp: new Date().toISOString(),
    });
  });

  return events;
}

export async function safeScreenshot(page, filePath) {
  try {
    await page.screenshot({ path: filePath, fullPage: true });
    return { ok: true, path: filePath };
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  }
}

// writeJson exported from reporting/artifacts.js


