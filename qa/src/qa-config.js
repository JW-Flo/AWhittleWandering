/**
 * QA runtime configuration loader.
 *
 * - Uses `qa/config.json` as defaults
 * - Allows env overrides for URLs/tokens
 * - Never logs secrets
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const QA_ROOT = path.resolve(__dirname, "..");
const DEFAULT_CONFIG_PATH = path.join(QA_ROOT, "config.json");

function toBool(value, defaultValue = false) {
  if (value == null) return defaultValue;
  const v = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(v)) return true;
  if (["0", "false", "no", "n", "off"].includes(v)) return false;
  return defaultValue;
}

export function normalizeBaseUrl(url) {
  if (!url) return url;
  return String(url).trim().replace(/\/+$/, "");
}

export function joinUrl(baseUrl, pathname) {
  const base = normalizeBaseUrl(baseUrl);
  if (!pathname) return base;
  const pathPart = String(pathname).startsWith("/") ? pathname : `/${pathname}`;
  return `${base}${pathPart}`;
}

function readJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

export function getQAConfig() {
  const fileConfig = fs.existsSync(DEFAULT_CONFIG_PATH)
    ? readJsonFile(DEFAULT_CONFIG_PATH)
    : {};

  const qa = fileConfig.qa || {};
  const endpoints = qa.endpoints || {};
  const api = endpoints.api || {};

  const frontendUrl = normalizeBaseUrl(
    process.env.QA_FRONTEND_URL || endpoints.frontend
  );
  const apiBaseUrl = normalizeBaseUrl(
    process.env.QA_API_BASE_URL || endpoints.backend
  );

  const adminToken = process.env.QA_ADMIN_TOKEN || "";

  const allowMutations = toBool(process.env.QA_ALLOW_MUTATIONS, false);
  const requireAdminToken = toBool(process.env.QA_REQUIRE_ADMIN_TOKEN, false);
  const stress = toBool(process.env.QA_STRESS, false);

  return {
    defaultsPath: DEFAULT_CONFIG_PATH,
    frontendUrl,
    apiBaseUrl,
    admin: {
      tokenPresent: Boolean(adminToken),
      token: adminToken,
      requireToken: requireAdminToken,
      allowMutations,
    },
    flags: {
      stress,
    },
    endpoints: {
      api,
    },
    timeouts: {
      // Keep defaults conservative; tests can override per-case.
      navigationMs: Number(process.env.QA_NAVIGATION_TIMEOUT_MS || 30000),
      requestMs: Number(process.env.QA_REQUEST_TIMEOUT_MS || 15000),
    },
  };
}

