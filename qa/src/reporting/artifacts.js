<<<<<<< .merge_file_Ec9QeR
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
=======
import fs from "fs";
import path from "path";

// Maximum length for sanitized file path components to avoid filesystem path length limits
const MAX_FILE_PART_LENGTH = 120;
>>>>>>> .merge_file_SVyJTx

export function nowId() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
<<<<<<< .merge_file_Ec9QeR
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
=======
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}-${pad(
    d.getUTCHours()
  )}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
}

export function sanitizeFilePart(s) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(0, MAX_FILE_PART_LENGTH);
}

export function createArtifactPaths(runIdInput) {
  const runId = sanitizeFilePart(runIdInput || nowId());
  const cwd = process.cwd();
  const repoRoot = path.basename(cwd) === "qa" ? path.dirname(cwd) : cwd;
  const dir = path.join(repoRoot, "qa", "reports", "artifacts", runId);
  fs.mkdirSync(dir, { recursive: true });

  return {
    runId,
    dir,
    reportPath: (name) => path.join(dir, `${sanitizeFilePart(name)}.json`),
>>>>>>> .merge_file_SVyJTx
  };
}

export function writeJson(filePath, data) {
<<<<<<< .merge_file_Ec9QeR
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}










=======
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

>>>>>>> .merge_file_SVyJTx
