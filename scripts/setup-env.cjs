#!/usr/bin/env node
/**
 * Environment Setup Script
 *
 * Creates or updates environment files for local development
 * of the 48 Continental USA project components.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Paths
const PUBLIC_SITE_DIR = path.resolve(
  __dirname,
  "../48Continental_Starter/public-site"
);
const EDGE_WORKER_DIR = path.resolve(__dirname, "../edge-worker");
const PUBLIC_SITE_ENV = path.resolve(PUBLIC_SITE_DIR, ".env.local");
const PUBLIC_SITE_ENV_EXAMPLE = path.resolve(PUBLIC_SITE_DIR, ".env.example");
const EDGE_WORKER_ENV = path.resolve(EDGE_WORKER_DIR, ".dev.vars");

// ANSI colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

// Console logging helpers
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) =>
    console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
};

// Default environment variables
const defaultEnv = {
  PUBLIC_SITE: {
    VITE_EDGE_WORKER_URL: "http://localhost:8787",
    VITE_MAPBOX_TOKEN: process.env.MAPBOX_TOKEN || "",
    VITE_TESSIE_API_TOKEN: process.env.TESSIE_API_TOKEN || "",
    VITE_TESSIE_VIN: process.env.TESSIE_VIN || "",
    VITE_OPENWEATHER_API_KEY:
      process.env.OPENWEATHERMAP_API_KEY ||
      process.env.OPENWEATHER_API_KEY ||
      "",
    VITE_WEBSOCKET_ENDPOINT: "wss://thewanderingwhittle-edge.workers.dev/ws",
  },
  EDGE_WORKER: {
    TESSIE_API_TOKEN: process.env.TESSIE_API_TOKEN || "",
    TESSIE_VIN: process.env.TESSIE_VIN || "",
    OPENWEATHER_API_KEY:
      process.env.OPENWEATHERMAP_API_KEY ||
      process.env.OPENWEATHER_API_KEY ||
      "",
    MAPBOX_TOKEN: process.env.MAPBOX_TOKEN || "",
    EDGE_HMAC_KEY:
      process.env.EDGE_HMAC_KEY || crypto.randomBytes(32).toString("hex"),
  },
};

// Create or update environment files
function setupEnvironmentFiles() {
  log.info("Setting up environment files for local development...");

  // Make sure directories exist
  if (!fs.existsSync(PUBLIC_SITE_DIR)) {
    log.error(`Public site directory not found: ${PUBLIC_SITE_DIR}`);
    process.exit(1);
  }

  if (!fs.existsSync(EDGE_WORKER_DIR)) {
    log.error(`Edge worker directory not found: ${EDGE_WORKER_DIR}`);
    process.exit(1);
  }

  // Load existing environment files
  let publicSiteEnv = {};
  let edgeWorkerEnv = {};

  // Check for existing environment files
  if (fs.existsSync(PUBLIC_SITE_ENV)) {
    log.info(
      `Loading existing public site environment from ${PUBLIC_SITE_ENV}`
    );
    const envContent = fs.readFileSync(PUBLIC_SITE_ENV, "utf8");
    publicSiteEnv = parseEnvFile(envContent);
  } else if (fs.existsSync(PUBLIC_SITE_ENV_EXAMPLE)) {
    log.info(
      `Loading from example environment file ${PUBLIC_SITE_ENV_EXAMPLE}`
    );
    const envContent = fs.readFileSync(PUBLIC_SITE_ENV_EXAMPLE, "utf8");
    publicSiteEnv = parseEnvFile(envContent);
  }

  if (fs.existsSync(EDGE_WORKER_ENV)) {
    log.info(
      `Loading existing edge worker environment from ${EDGE_WORKER_ENV}`
    );
    const envContent = fs.readFileSync(EDGE_WORKER_ENV, "utf8");
    edgeWorkerEnv = parseEnvFile(envContent);
  }

  // Merge with defaults
  publicSiteEnv = { ...defaultEnv.PUBLIC_SITE, ...publicSiteEnv };
  edgeWorkerEnv = { ...defaultEnv.EDGE_WORKER, ...edgeWorkerEnv };

  // Check for required environment variables
  let missingVars = false;
  for (const key in defaultEnv.PUBLIC_SITE) {
    if (!publicSiteEnv[key] && process.env[key.replace("VITE_", "")]) {
      publicSiteEnv[key] = process.env[key.replace("VITE_", "")];
    }

    if ((!publicSiteEnv[key] && key.includes("TOKEN")) || key.includes("KEY")) {
      log.warn(`Missing environment variable: ${key}`);
      missingVars = true;
    }
  }

  for (const key in defaultEnv.EDGE_WORKER) {
    if (!edgeWorkerEnv[key] && process.env[key]) {
      edgeWorkerEnv[key] = process.env[key];
    }

    if (
      !edgeWorkerEnv[key] &&
      key !== "EDGE_HMAC_KEY" &&
      (key.includes("TOKEN") || key.includes("KEY"))
    ) {
      log.warn(`Missing environment variable: ${key}`);
      missingVars = true;
    }
  }

  if (missingVars) {
    log.warn(
      "Some API keys or tokens are missing. The application may not function correctly."
    );
    log.warn(
      "For full functionality, ensure all required environment variables are set."
    );
  }

  // Write environment files
  fs.writeFileSync(PUBLIC_SITE_ENV, formatEnvFile(publicSiteEnv));
  log.success(`Updated public site environment file: ${PUBLIC_SITE_ENV}`);

  fs.writeFileSync(EDGE_WORKER_ENV, formatEnvFile(edgeWorkerEnv));
  log.success(`Updated edge worker environment file: ${EDGE_WORKER_ENV}`);

  // Create .env file in public site directory (non-local for build tools)
  fs.writeFileSync(
    path.resolve(PUBLIC_SITE_DIR, ".env"),
    formatEnvFile(publicSiteEnv)
  );
  log.success(`Created non-local environment file for build tools`);

  // Return the environment variables
  return {
    publicSiteEnv,
    edgeWorkerEnv,
  };
}

// Parse environment file content
function parseEnvFile(content) {
  const env = {};
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith("#")) {
      const match = trimmedLine.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();

        // Remove quotes if present
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        env[key] = value;
      }
    }
  }

  return env;
}

// Format environment object into file content
function formatEnvFile(env) {
  let content = "";

  for (const [key, value] of Object.entries(env)) {
    content += `${key}=${value}\n`;
  }

  return content;
}

// Main function
function main() {
  log.info("Starting environment setup...");

  const env = setupEnvironmentFiles();

  log.info("Environment setup complete.");
  log.info("You can now run the development servers:");
  log.info(`  Edge Worker: cd ${EDGE_WORKER_DIR} && npx wrangler dev`);
  log.info(`  Public Site: cd ${PUBLIC_SITE_DIR} && npm run dev`);
  log.info("Or use the start-local-dev.js script to run both simultaneously.");

  return env;
}

// Run if called directly
if (require.main === module) {
  main();
} else {
  // Export for use as a module
  module.exports = main;
}
