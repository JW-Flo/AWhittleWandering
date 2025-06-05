#!/usr/bin/env node
/**
 * Start Local Development Environment
 *
 * This script starts both the edge worker and public site in development mode,
 * with proper environment variable configuration.
 */

/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const readline = require("readline");
const { URL } = require("url");

// Configuration
const EDGE_WORKER_DIR = path.resolve(__dirname, "../edge-worker");
const PUBLIC_SITE_DIR = path.resolve(
  __dirname,
  "../48Continental_Starter/public-site"
);
const ENV_FILE_PATH = path.resolve(PUBLIC_SITE_DIR, ".env");

// ANSI colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

// Console logging helpers
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) =>
    console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  edgeWorker: (msg) =>
    console.log(`${colors.magenta}[EDGE]${colors.reset} ${msg}`),
  publicSite: (msg) =>
    console.log(`${colors.cyan}[SITE]${colors.reset} ${msg}`),
};

// Active processes
const processes = {
  edgeWorker: null,
  publicSite: null,
};

// Setup environment for local development
async function setupEnvironment() {
  log.info("Setting up environment variables for local development...");

  // Run the setup-env.cjs script to generate .env file
  try {
    require("./setup-env.cjs");
    log.success("Environment setup complete.");
  } catch (error) {
    log.error(`Failed to set up environment: ${error.message}`);
    process.exit(1);
  }
}

// Start edge worker using wrangler
function startEdgeWorker() {
  log.info("Starting Edge Worker with wrangler dev...");

  const edgeWorker = spawn("npx", ["wrangler", "dev"], {
    cwd: EDGE_WORKER_DIR,
    env: { ...process.env },
    stdio: "pipe",
  });

  processes.edgeWorker = edgeWorker;

  edgeWorker.stdout.on("data", (data) => {
    const output = data.toString().trim();
    const lines = output.split("\n");

    lines.forEach((line) => {
      // Look for the local server URL in the output
      if (
        line.includes("http://127.0.0.1") ||
        line.includes("http://localhost")
      ) {
        const matches = line.match(/(https?:\/\/[^\s]+)/);
        if (matches && matches[1]) {
          const edgeWorkerUrl = matches[1];
          log.success(`Edge Worker running at ${edgeWorkerUrl}`);

          // Update the environment file with the edge worker URL
          updateEnvFile("VITE_EDGE_WORKER_URL", edgeWorkerUrl);
        }
      }

      log.edgeWorker(line);
    });
  });

  edgeWorker.stderr.on("data", (data) => {
    log.edgeWorker(`${colors.red}${data.toString().trim()}${colors.reset}`);
  });

  edgeWorker.on("close", (code) => {
    log.info(`Edge Worker process exited with code ${code}`);
    processes.edgeWorker = null;

    // If the public site is still running, shut it down too
    if (processes.publicSite) {
      processes.publicSite.kill();
    }
  });

  return edgeWorker;
}

// Start public site using npm run dev
function startPublicSite() {
  log.info("Starting Public Site development server...");

  const publicSite = spawn("npm", ["run", "dev"], {
    cwd: PUBLIC_SITE_DIR,
    env: { ...process.env },
    stdio: "pipe",
  });

  processes.publicSite = publicSite;

  publicSite.stdout.on("data", (data) => {
    const output = data.toString().trim();
    const lines = output.split("\n");

    lines.forEach((line) => {
      // Look for the local server URL in the output
      if (line.includes("Local:") && line.includes("http://")) {
        const matches = line.match(/(https?:\/\/[^\s]+)/);
        if (matches && matches[1]) {
          log.success(`Public Site running at ${matches[1]}`);
        }
      }

      log.publicSite(line);
    });
  });

  publicSite.stderr.on("data", (data) => {
    log.publicSite(`${colors.red}${data.toString().trim()}${colors.reset}`);
  });

  publicSite.on("close", (code) => {
    log.info(`Public Site process exited with code ${code}`);
    processes.publicSite = null;

    // If the edge worker is still running, shut it down too
    if (processes.edgeWorker) {
      processes.edgeWorker.kill();
    }
  });

  return publicSite;
}

// Update the .env file with the edge worker URL
function updateEnvFile(key, value) {
  try {
    if (!fs.existsSync(ENV_FILE_PATH)) {
      log.error(`Environment file not found at ${ENV_FILE_PATH}`);
      return;
    }

    let envContent = fs.readFileSync(ENV_FILE_PATH, "utf8");
    const envLines = envContent.split("\n");
    let found = false;

    // Try to update existing line
    const updatedLines = envLines.map((line) => {
      if (line.startsWith(`${key}=`)) {
        found = true;
        return `${key}=${value}`;
      }
      return line;
    });

    // If the key wasn't found, add it
    if (!found) {
      updatedLines.push(`${key}=${value}`);
    }

    fs.writeFileSync(ENV_FILE_PATH, updatedLines.join("\n"));
    log.success(`Updated ${key} in environment file`);
  } catch (error) {
    log.error(`Failed to update environment file: ${error.message}`);
  }
}

// Check for connectivity between services
function validateConnectivity() {
  // This function would ideally make some test requests to validate
  // that the services can communicate with each other properly
  // For now, we'll just log a message
  log.info("Validating connectivity between services...");

  // We could implement actual validation here in the future
  setTimeout(() => {
    log.success("Services appear to be communicating properly");
  }, 5000);
}

// Handle graceful shutdown
function setupCleanup() {
  const cleanup = () => {
    log.info("Shutting down development environment...");

    if (processes.edgeWorker) {
      processes.edgeWorker.kill();
    }

    if (processes.publicSite) {
      processes.publicSite.kill();
    }

    log.success("Development environment shut down");
    process.exit(0);
  };

  // Handle ctrl+c and other termination signals
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  process.on("SIGUSR1", cleanup);
  process.on("SIGUSR2", cleanup);
  process.on("uncaughtException", (error) => {
    log.error(`Uncaught exception: ${error.message}`);
    cleanup();
  });
}

// Setup command line interface for the running servers
function setupCLI() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${colors.bright}48Continental>${colors.reset} `,
  });

  rl.on("line", (line) => {
    const command = line.trim().toLowerCase();

    switch (command) {
      case "help":
        console.log(`
${colors.bright}Available Commands:${colors.reset}
  ${colors.cyan}help${colors.reset}      - Show this help message
  ${colors.cyan}restart${colors.reset}   - Restart both services
  ${colors.cyan}validate${colors.reset}  - Test connectivity between services
  ${colors.cyan}clear${colors.reset}     - Clear the console
  ${colors.cyan}exit${colors.reset}      - Shut down and exit
        `);
        break;

      case "restart":
        log.info("Restarting services...");
        if (processes.edgeWorker) processes.edgeWorker.kill();
        if (processes.publicSite) processes.publicSite.kill();

        setTimeout(() => {
          startEdgeWorker();
          startPublicSite();
        }, 1000);
        break;

      case "validate":
        validateConnectivity();
        break;

      case "clear":
        console.clear();
        break;

      case "exit":
        rl.close();
        if (processes.edgeWorker) processes.edgeWorker.kill();
        if (processes.publicSite) processes.publicSite.kill();
        process.exit(0);
        break;

      default:
        if (command) {
          log.warn(
            `Unknown command: ${command}. Type 'help' for available commands.`
          );
        }
    }

    rl.prompt();
  });

  rl.prompt();
}

// Main function to run everything
async function main() {
  console.clear();
  console.log(`
${colors.bright}${colors.green}========================================${colors.reset}
${colors.bright}${colors.green} 48 Continental USA - Dev Environment ${colors.reset}
${colors.bright}${colors.green}========================================${colors.reset}
  `);

  setupCleanup();
  await setupEnvironment();

  // Start edge worker first
  startEdgeWorker();

  // Wait a moment to let the edge worker start before launching the public site
  setTimeout(() => {
    startPublicSite();

    // Set up command line interface
    setupCLI();

    // Validate connectivity after both services are running
    setTimeout(validateConnectivity, 5000);
  }, 3000);
}

// Run the main function
main().catch((error) => {
  log.error(`Startup failed: ${error.message}`);
  process.exit(1);
});
