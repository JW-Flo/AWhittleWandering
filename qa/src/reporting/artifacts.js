/**
 * Artifact utilities (no Puppeteer dependency).
 *
 * Used by both API and E2E runners to produce stable output paths.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const QA_ROOT = path.resolve(__dirname, "../..");
const ARTIFACTS_DIR = path.join(QA_ROOT, "reports", "artifacts");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function sanitizeFilePart(input) {
  return String(input)
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 120);
}

export function nowId() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(
    d.getUTCDate()
  )}-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
}

export function createArtifactPaths(runId = nowId()) {
  ensureDir(ARTIFACTS_DIR);
  const runDir = path.join(ARTIFACTS_DIR, runId);
  ensureDir(runDir);
  return {
    runId,
    dir: runDir,
    screenshotPath: (name) => path.join(runDir, `${sanitizeFilePart(name)}.png`),
    reportPath: (name) => path.join(runDir, `${sanitizeFilePart(name)}.json`),
  };
}

export function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}










