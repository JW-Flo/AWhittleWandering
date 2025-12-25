import fs from "fs";
import path from "path";

// Maximum length for filesystem path segments to avoid OS path length limits
const MAX_FILENAME_LENGTH = 120;

export function nowId() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}-${pad(
    d.getUTCHours()
  )}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
}

export function sanitizeFilePart(s) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(0, MAX_FILENAME_LENGTH);
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
  };
}

export function writeJson(filePath, data) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

