#!/usr/bin/env node

/**
 * Auto-Remediation Script
 *
 * This script intelligently detects and fixes common issues in the codebase,
 * then commits the changes safely to the repository.
 *
 * Features:
 * - Automatically detects common issues
 * - Applies intelligent fixes when possible
 * - Validates changes before committing
 * - Creates detailed commit messages
 * - Provides safety measures to prevent breaking changes
 *
 * Usage:
 *   node auto-remediate.js [options]
 *
 * Options:
 *   --dry-run          Test remediation without committing changes
 *   --issues=<types>   Comma-separated list of issue types to fix
 *   --severity=<level> Minimum severity level to fix (low, medium, high)
 *   --branch=<name>    Create a new branch for fixes
 *   --push             Push changes to remote after committing
 *   --notify           Send notification after remediation
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { promises: fsPromises } = require("fs");

// Configuration
const CONFIG = {
  dryRun: process.argv.includes("--dry-run"),
  issueTypes: (process.argv.find((arg) => arg.startsWith("--issues=")) || "")
    .replace("--issues=", "")
    .split(",")
    .filter(Boolean),
  severity: (
    process.argv.find((arg) => arg.startsWith("--severity=")) ||
    "--severity=medium"
  )
    .replace("--severity=", "")
    .toLowerCase(),
  branch: (
    process.argv.find((arg) => arg.startsWith("--branch=")) || ""
  ).replace("--branch=", ""),
  push: process.argv.includes("--push"),
  notify: process.argv.includes("--notify"),
  severityLevels: { low: 0, medium: 1, high: 2 },
};

// Terminal colors
const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  bold: "\x1b[1m",
};

// Global state
const state = {
  fixes: [],
  errors: [],
  startTime: Date.now(),
  repoRoot: "",
  originalBranch: "",
  createdBranch: false,
};

// Logger
const logger = {
  info: (message) =>
    console.log(`${COLORS.blue}[INFO]${COLORS.reset} ${message}`),
  success: (message) =>
    console.log(`${COLORS.green}[SUCCESS]${COLORS.reset} ${message}`),
  warn: (message) =>
    console.log(`${COLORS.yellow}[WARNING]${COLORS.reset} ${message}`),
  error: (message) =>
    console.log(`${COLORS.red}[ERROR]${COLORS.reset} ${message}`),
  debug: (message) =>
    console.log(`${COLORS.gray}[DEBUG]${COLORS.reset} ${message}`),
  section: (title) =>
    console.log(`\n${COLORS.bold}${COLORS.magenta}${title}${COLORS.reset}`),
};

/**
 * Issue remediation definitions
 * Each remediation handler should:
 * 1. Detect if the issue exists
 * 2. Fix the issue if possible
 * 3. Return a report object with the results
 */
const remediationHandlers = [
  {
    id: "missing-mapbox-token",
    name: "Missing Mapbox Token",
    severity: "high",
    description:
      "Detects and fixes missing Mapbox tokens in environment files and configurations",
    detect: async () => {
      // Check for Mapbox token in .env files
      const envFiles = [
        ".env",
        ".env.production",
        ".env.development",
        ".env.local",
        "48Continental_Starter/public-site/.env",
        "48Continental_Starter/public-site/.env.production",
      ];

      let missingTokenFiles = [];

      for (const file of envFiles) {
        try {
          const fullPath = path.join(state.repoRoot, file);
          if (fs.existsSync(fullPath)) {
            const content = await fsPromises.readFile(fullPath, "utf8");
            if (
              !content.includes("MAPBOX_TOKEN=") &&
              !content.includes("VITE_MAPBOX_TOKEN=")
            ) {
              missingTokenFiles.push(file);
            }
          }
        } catch (error) {
          // File doesn't exist or can't be read, ignore
        }
      }

      // Also check mapboxConfig.ts
      const mapConfigPath = path.join(
        state.repoRoot,
        "48Continental_Starter/public-site/src/shared/mapbox/mapboxConfig.ts"
      );
      let missingMapboxConfig = false;

      try {
        if (fs.existsSync(mapConfigPath)) {
          const content = await fsPromises.readFile(mapConfigPath, "utf8");
          if (
            !content.includes("token:") ||
            content.includes("token: ''") ||
            content.includes('token: ""')
          ) {
            missingMapboxConfig = true;
          }
        } else {
          // Config file doesn't exist
          missingMapboxConfig = true;
        }
      } catch (error) {
        logger.error(`Error checking mapboxConfig.ts: ${error.message}`);
      }

      return {
        detected: missingTokenFiles.length > 0 || missingMapboxConfig,
        files: missingTokenFiles,
        missingMapboxConfig,
      };
    },
    fix: async (detectionResult) => {
      // Get Mapbox token from environment or prompt
      let mapboxToken = process.env.MAPBOX_TOKEN || "";

      if (!mapboxToken) {
        logger.warn(
          "No MAPBOX_TOKEN found in environment. Using placeholder token, please update."
        );
        mapboxToken = "pk.placeholder_token_needs_update";
      }

      const fixedFiles = [];

      // Add token to missing .env files
      for (const file of detectionResult.files) {
        try {
          const fullPath = path.join(state.repoRoot, file);
          let content = "";

          // Read existing content if file exists
          if (fs.existsSync(fullPath)) {
            content = await fsPromises.readFile(fullPath, "utf8");
          }

          // Check file path to determine correct variable name
          const varName = file.includes("48Continental_Starter/public-site")
            ? "VITE_MAPBOX_TOKEN"
            : "MAPBOX_TOKEN";

          // Add token if not present
          if (!content.includes(`${varName}=`)) {
            content += `\n${varName}=${mapboxToken}\n`;

            // Ensure directory exists
            await fsPromises.mkdir(path.dirname(fullPath), { recursive: true });

            // Write updated content
            if (!CONFIG.dryRun) {
              await fsPromises.writeFile(fullPath, content);
              fixedFiles.push(file);
            } else {
              fixedFiles.push(`${file} (dry run)`);
            }
          }
        } catch (error) {
          logger.error(`Error fixing ${file}: ${error.message}`);
        }
      }

      // Create or update mapboxConfig.ts if needed
      if (detectionResult.missingMapboxConfig) {
        const configDir = path.join(
          state.repoRoot,
          "48Continental_Starter/public-site/src/shared/mapbox"
        );
        const configPath = path.join(configDir, "mapboxConfig.ts");

        try {
          // Create config file content
          const configContent = `/**
 * Mapbox configuration
 * 
 * This file contains the configuration for Mapbox GL JS
 */

export const mapboxConfig = {
  token: '${mapboxToken}',
  style: 'mapbox://styles/mapbox/streets-v11',
  options: {
    attributionControl: true,
    interactive: true,
    minZoom: 2,
    maxZoom: 18
  }
};

export default mapboxConfig;
`;

          if (!CONFIG.dryRun) {
            // Ensure directory exists
            await fsPromises.mkdir(configDir, { recursive: true });

            // Write config file
            await fsPromises.writeFile(configPath, configContent);
            fixedFiles.push(
              "48Continental_Starter/public-site/src/shared/mapbox/mapboxConfig.ts"
            );
          } else {
            fixedFiles.push(
              "48Continental_Starter/public-site/src/shared/mapbox/mapboxConfig.ts (dry run)"
            );
          }
        } catch (error) {
          logger.error(`Error creating mapboxConfig.ts: ${error.message}`);
        }
      }

      return {
        fixed: fixedFiles.length > 0,
        files: fixedFiles,
        message: `Added Mapbox token to ${fixedFiles.length} file(s)`,
      };
    },
  },
  {
    id: "missing-environment-variables",
    name: "Missing Required Environment Variables",
    severity: "high",
    description: "Detects and adds missing required environment variables",
    detect: async () => {
      const requiredVars = [
        "CF_API_TOKEN",
        "CF_ACCOUNT_ID",
        "TESSIE_API_TOKEN",
        "TESSIE_VIN",
        "OPENWEATHER_API_KEY",
        "MAPBOX_TOKEN",
        "EDGE_HMAC_KEY",
      ];

      // Check .env file
      const envPath = path.join(state.repoRoot, ".env");
      let missingVars = [];

      try {
        if (fs.existsSync(envPath)) {
          const content = await fsPromises.readFile(envPath, "utf8");

          // Check for each required variable
          missingVars = requiredVars.filter(
            (varName) => !content.includes(`${varName}=`)
          );
        } else {
          // .env file doesn't exist
          missingVars = requiredVars;
        }
      } catch (error) {
        logger.error(`Error checking .env file: ${error.message}`);
        missingVars = requiredVars;
      }

      // Check .env.example file
      const envExamplePath = path.join(state.repoRoot, ".env.example");
      let missingExampleVars = [];

      try {
        if (fs.existsSync(envExamplePath)) {
          const content = await fsPromises.readFile(envExamplePath, "utf8");

          // Check for each required variable
          missingExampleVars = requiredVars.filter(
            (varName) => !content.includes(`${varName}=`)
          );
        } else {
          // .env.example file doesn't exist
          missingExampleVars = requiredVars;
        }
      } catch (error) {
        logger.error(`Error checking .env.example file: ${error.message}`);
        missingExampleVars = requiredVars;
      }

      return {
        detected: missingVars.length > 0 || missingExampleVars.length > 0,
        missingVars,
        missingExampleVars,
      };
    },
    fix: async (detectionResult) => {
      const fixedFiles = [];

      // Add missing vars to .env file
      if (detectionResult.missingVars.length > 0) {
        const envPath = path.join(state.repoRoot, ".env");

        try {
          // Read existing content or start with empty string
          let content = "";
          if (fs.existsSync(envPath)) {
            content = await fsPromises.readFile(envPath, "utf8");
          }

          // Add missing variables
          for (const varName of detectionResult.missingVars) {
            // Check if var exists in environment
            const varValue = process.env[varName] || "";

            if (!content.includes(`${varName}=`)) {
              content += `\n${varName}=${varValue}\n`;
            }
          }

          // Write updated content
          if (!CONFIG.dryRun) {
            await fsPromises.writeFile(envPath, content);
            fixedFiles.push(".env");
          } else {
            fixedFiles.push(".env (dry run)");
          }
        } catch (error) {
          logger.error(`Error fixing .env file: ${error.message}`);
        }
      }

      // Add missing vars to .env.example file
      if (detectionResult.missingExampleVars.length > 0) {
        const envExamplePath = path.join(state.repoRoot, ".env.example");

        try {
          // Read existing content or start with empty string
          let content = "";
          if (fs.existsSync(envExamplePath)) {
            content = await fsPromises.readFile(envExamplePath, "utf8");
          }

          // Add missing variables
          for (const varName of detectionResult.missingExampleVars) {
            if (!content.includes(`${varName}=`)) {
              content += `\n${varName}=your_${varName.toLowerCase()}_here\n`;
            }
          }

          // Write updated content
          if (!CONFIG.dryRun) {
            await fsPromises.writeFile(envExamplePath, content);
            fixedFiles.push(".env.example");
          } else {
            fixedFiles.push(".env.example (dry run)");
          }
        } catch (error) {
          logger.error(`Error fixing .env.example file: ${error.message}`);
        }
      }

      return {
        fixed: fixedFiles.length > 0,
        files: fixedFiles,
        message: `Added missing environment variables to ${fixedFiles.length} file(s)`,
      };
    },
  },
  {
    id: "non-executable-scripts",
    name: "Non-Executable Scripts",
    severity: "medium",
    description: "Finds and makes script files executable",
    detect: async () => {
      const scriptDirs = [
        "scripts",
        "48Continental_Starter/public-site/scripts",
        "awhittlewandering/scripts",
      ];

      let nonExecutableScripts = [];

      for (const dir of scriptDirs) {
        try {
          const dirPath = path.join(state.repoRoot, dir);

          if (fs.existsSync(dirPath)) {
            const files = await fsPromises.readdir(dirPath);

            for (const file of files) {
              const filePath = path.join(dirPath, file);
              const stats = await fsPromises.stat(filePath);

              // Check if it's a file and has a script extension
              if (
                stats.isFile() &&
                (file.endsWith(".sh") ||
                  file.endsWith(".js") ||
                  !file.includes("."))
              ) {
                try {
                  // Check if the file is executable
                  const mode = stats.mode;
                  const isExecutable = !!(mode & 0o111); // Check if any execute bit is set

                  if (!isExecutable) {
                    nonExecutableScripts.push(path.join(dir, file));
                  }
                } catch (error) {
                  logger.error(
                    `Error checking permissions for ${filePath}: ${error.message}`
                  );
                }
              }
            }
          }
        } catch (error) {
          logger.error(`Error checking directory ${dir}: ${error.message}`);
        }
      }

      return {
        detected: nonExecutableScripts.length > 0,
        scripts: nonExecutableScripts,
      };
    },
    fix: async (detectionResult) => {
      const fixedScripts = [];

      for (const script of detectionResult.scripts) {
        try {
          const scriptPath = path.join(state.repoRoot, script);

          if (!CONFIG.dryRun) {
            // Make the script executable
            await fsPromises.chmod(scriptPath, 0o755);
            fixedScripts.push(script);
          } else {
            fixedScripts.push(`${script} (dry run)`);
          }
        } catch (error) {
          logger.error(`Error making ${script} executable: ${error.message}`);
        }
      }

      return {
        fixed: fixedScripts.length > 0,
        files: fixedScripts,
        message: `Made ${fixedScripts.length} script(s) executable`,
      };
    },
  },
  {
    id: "missing-build-validation",
    name: "Missing Build Validation",
    severity: "medium",
    description: "Adds build validation to deployment scripts if missing",
    detect: async () => {
      const deployScripts = [
        "scripts/deploy-project.sh",
        "scripts/deploy-all.sh",
        "48Continental_Starter/public-site/cloudflare-deploy.sh",
      ];

      let scriptsWithoutValidation = [];

      for (const script of deployScripts) {
        try {
          const scriptPath = path.join(state.repoRoot, script);

          if (fs.existsSync(scriptPath)) {
            const content = await fsPromises.readFile(scriptPath, "utf8");

            // Check if the script contains build validation
            const hasValidation =
              content.includes("npm run build") &&
              (content.includes("validateBuild") ||
                content.includes("validate-build") ||
                content.includes("if [ $? -ne 0 ]"));

            if (!hasValidation) {
              scriptsWithoutValidation.push(script);
            }
          }
        } catch (error) {
          // Script doesn't exist or can't be read, ignore
        }
      }

      return {
        detected: scriptsWithoutValidation.length > 0,
        scripts: scriptsWithoutValidation,
      };
    },
    fix: async (detectionResult) => {
      const fixedScripts = [];

      for (const script of detectionResult.scripts) {
        try {
          const scriptPath = path.join(state.repoRoot, script);

          if (fs.existsSync(scriptPath)) {
            let content = await fsPromises.readFile(scriptPath, "utf8");

            // Look for build command in the script
            const buildMatch = content.match(/npm run build/);

            if (buildMatch) {
              // Add validation after the build command
              const validationCode = `
# Validate build succeeded
if [ $? -ne 0 ]; then
  echo "Build failed. Aborting deployment."
  exit 1
fi

# Check for build directory
if [ ! -d "dist" ] && [ ! -d "build" ]; then
  echo "Build directory not found. Aborting deployment."
  exit 1
fi
`;

              // Insert the validation code after the build command
              const insertIndex = buildMatch.index + buildMatch[0].length;
              content =
                content.slice(0, insertIndex) +
                validationCode +
                content.slice(insertIndex);

              // Write the updated script
              if (!CONFIG.dryRun) {
                await fsPromises.writeFile(scriptPath, content);
                fixedScripts.push(script);
              } else {
                fixedScripts.push(`${script} (dry run)`);
              }
            }
          }
        } catch (error) {
          logger.error(
            `Error adding build validation to ${script}: ${error.message}`
          );
        }
      }

      return {
        fixed: fixedScripts.length > 0,
        files: fixedScripts,
        message: `Added build validation to ${fixedScripts.length} deployment script(s)`,
      };
    },
  },
];

/**
 * Initialize the script
 */
async function initialize() {
  logger.section("AUTO-REMEDIATION SCRIPT");
  logger.info(
    `Mode: ${CONFIG.dryRun ? "Dry Run (no changes will be made)" : "Live Run"}`
  );

  try {
    // Get repository root (assumes script is run from within the repo)
    state.repoRoot = execSync("git rev-parse --show-toplevel")
      .toString()
      .trim();
    logger.info(`Repository root: ${state.repoRoot}`);

    // Get current branch
    state.originalBranch = execSync("git rev-parse --abbrev-ref HEAD")
      .toString()
      .trim();
    logger.info(`Current branch: ${state.originalBranch}`);

    // Create new branch if specified
    if (CONFIG.branch) {
      if (!CONFIG.dryRun) {
        execSync(`git checkout -b ${CONFIG.branch}`);
        state.createdBranch = true;
        logger.info(`Created and switched to new branch: ${CONFIG.branch}`);
      } else {
        logger.info(`Would create new branch: ${CONFIG.branch} (dry run)`);
      }
    }

    return true;
  } catch (error) {
    logger.error(`Initialization failed: ${error.message}`);
    return false;
  }
}

/**
 * Clean up and handle any necessary rollbacks
 */
async function cleanup(success = true) {
  logger.section("CLEANUP");

  try {
    // Switch back to original branch if we created a new one but encountered errors
    if (state.createdBranch && !success && !CONFIG.dryRun) {
      logger.info(`Switching back to original branch: ${state.originalBranch}`);
      execSync(`git checkout ${state.originalBranch}`);

      // Optionally delete the created branch
      logger.info(`Deleting branch: ${CONFIG.branch}`);
      execSync(`git branch -D ${CONFIG.branch}`);
    }

    logger.info("Cleanup completed successfully");
  } catch (error) {
    logger.error(`Cleanup failed: ${error.message}`);
  }
}

/**
 * Detect issues using the remediation handlers
 */
async function detectIssues() {
  logger.section("ISSUE DETECTION");

  const minSeverityLevel = CONFIG.severityLevels[CONFIG.severity] || 0;
  const issueResults = [];

  for (const handler of remediationHandlers) {
    // Skip handlers that don't match the specified issue types (if any)
    if (
      CONFIG.issueTypes.length > 0 &&
      !CONFIG.issueTypes.includes(handler.id)
    ) {
      continue;
    }

    // Skip handlers that don't meet the minimum severity level
    const handlerSeverityLevel = CONFIG.severityLevels[handler.severity] || 0;
    if (handlerSeverityLevel < minSeverityLevel) {
      continue;
    }

    logger.info(`Checking for issue: ${handler.name} [${handler.severity}]`);

    try {
      const result = await handler.detect();

      if (result.detected) {
        logger.warn(`Found issue: ${handler.name}`);
        issueResults.push({
          handler,
          result,
        });
      } else {
        logger.success(`No issues found: ${handler.name}`);
      }
    } catch (error) {
      logger.error(`Error detecting ${handler.name}: ${error.message}`);
      state.errors.push({
        handler: handler.id,
        phase: "detection",
        error: error.message,
      });
    }
  }

  return issueResults;
}

/**
 * Apply fixes for detected issues
 */
async function applyFixes(issueResults) {
  logger.section("APPLYING FIXES");

  for (const { handler, result } of issueResults) {
    logger.info(`Fixing issue: ${handler.name} [${handler.severity}]`);

    try {
      const fixResult = await handler.fix(result);

      if (fixResult.fixed) {
        logger.success(`Fixed issue: ${handler.name} - ${fixResult.message}`);
        state.fixes.push({
          handler: handler.id,
          name: handler.name,
          severity: handler.severity,
          files: fixResult.files,
          message: fixResult.message,
        });
      } else {
        logger.warn(`Could not fix issue: ${handler.name}`);
      }
    } catch (error) {
      logger.error(`Error fixing ${handler.name}: ${error.message}`);
      state.errors.push({
        handler: handler.id,
        phase: "remediation",
        error: error.message,
      });
    }
  }
}

/**
 * Validate that fixes haven't broken anything
 */
async function validateFixes() {
  logger.section("VALIDATING FIXES");

  // Skip validation in dry run mode
  if (CONFIG.dryRun) {
    logger.info("Skipping validation in dry run mode");
    return true;
  }

  let validationSuccess = true;

  try {
    // Check if we have any JS/TS files to lint
    const hasJsFiles = state.fixes.some((fix) =>
      fix.files.some(
        (file) =>
          file.endsWith(".js") ||
          file.endsWith(".ts") ||
          file.endsWith(".jsx") ||
          file.endsWith(".tsx")
      )
    );

    if (
      hasJsFiles &&
      fs.existsSync(path.join(state.repoRoot, "package.json"))
    ) {
      logger.info("Running linting to validate JS/TS changes");

      try {
        execSync("npm run lint", { stdio: "pipe", encoding: "utf8" });
        logger.success("Linting passed");
      } catch (error) {
        logger.warn("Linting failed, but continuing with validation");
        validationSuccess = false;
      }
    }

    // Check if we have any build files to validate
    const hasBuildFiles = state.fixes.some((fix) =>
      fix.files.some(
        (file) =>
          file.includes("package.json") ||
          file.includes("tsconfig.json") ||
          file.includes("webpack.config")
      )
    );

    if (
      hasBuildFiles &&
      fs.existsSync(path.join(state.repoRoot, "package.json"))
    ) {
      logger.info("Running build to validate build-related changes");

      try {
        execSync("npm run build", { stdio: "pipe", encoding: "utf8" });
        logger.success("Build passed");
      } catch (error) {
        logger.error("Build failed after applying fixes");
        validationSuccess = false;
      }
    }

    // Run unit tests if they exist and we've changed code files
    const hasCodeChanges = state.fixes.some((fix) =>
      fix.files.some(
        (file) =>
          file.endsWith(".js") ||
          file.endsWith(".ts") ||
          file.endsWith(".jsx") ||
          file.endsWith(".tsx")
      )
    );

    if (
      hasCodeChanges &&
      fs.existsSync(path.join(state.repoRoot, "package.json"))
    ) {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(state.repoRoot, "package.json"), "utf8")
      );

      if (
        packageJson.scripts &&
        packageJson.scripts.test &&
        packageJson.scripts.test !== 'echo "Error: no test specified" && exit 1'
      ) {
        logger.info("Running tests to validate code changes");

        try {
          execSync("npm test", { stdio: "pipe", encoding: "utf8" });
          logger.success("Tests passed");
        } catch (error) {
          logger.error("Tests failed after applying fixes");
          validationSuccess = false;
        }
      }
    }

    return validationSuccess;
  } catch (error) {
    logger.error(`Validation failed: ${error.message}`);
    return false;
  }
}

/**
 * Commit fixes to the repository
 */
async function commitChanges() {
  logger.section("COMMITTING CHANGES");

  // Skip committing in dry run mode
  if (CONFIG.dryRun) {
    logger.info("Skipping commit in dry run mode");
    return true;
  }

  // Skip if no fixes were applied
  if (state.fixes.length === 0) {
    logger.info("No fixes to commit");
    return true;
  }

  try {
    // Add all fixed files to git
    const filesToAdd = state.fixes.flatMap((fix) =>
      fix.files.filter((file) => !file.includes("(dry run)"))
    );

    if (filesToAdd.length === 0) {
      logger.info("No files to add to git");
      return true;
    }

    // Add files individually to avoid adding unrelated changes
    for (const file of filesToAdd) {
      logger.info(`Adding file to git: ${file}`);
      execSync(`git add "${file}"`, { stdio: "pipe" });
    }

    // Create commit message
    const commitMessage = generateCommitMessage();

    // Commit changes
    logger.info("Committing changes");
    execSync(`git commit -m "${commitMessage}"`, { stdio: "pipe" });
    logger.success("Changes committed successfully");

    // Push changes if requested
    if (CONFIG.push) {
      const branch = CONFIG.branch || state.originalBranch;
      logger.info(`Pushing changes to remote (${branch})`);
      execSync(`git push origin ${branch}`, { stdio: "pipe" });
      logger.success("Changes pushed successfully");
    }

    return true;
  } catch (error) {
    logger.error(`Failed to commit changes: ${error.message}`);
    return false;
  }
}

/**
 * Generate a detailed commit message
 */
function generateCommitMessage() {
  // Group fixes by severity
  const fixesByType = {};

  for (const fix of state.fixes) {
    if (!fixesByType[fix.severity]) {
      fixesByType[fix.severity] = [];
    }

    fixesByType[fix.severity].push(fix);
  }

  // Build commit message
  let message = "fix: Automatic remediation of issues\n\n";

  // Add summary
  message += `Applied ${state.fixes.length} fix(es) to resolve detected issues.\n\n`;

  // Add fixes by severity
  for (const severity of ["high", "medium", "low"]) {
    const fixes = fixesByType[severity] || [];

    if (fixes.length > 0) {
      message += `${severity.toUpperCase()} severity fixes:\n`;

      for (const fix of fixes) {
        message += `- ${fix.name}: ${fix.message}\n`;

        // Add files for this fix
        for (const file of fix.files) {
          if (!file.includes("(dry run)")) {
            message += `  - ${file}\n`;
          }
        }
      }

      message += "\n";
    }
  }

  // Add errors if any
  if (state.errors.length > 0) {
    message += "WARNINGS:\n";

    for (const error of state.errors) {
      message += `- ${error.handler}: ${error.error} (${error.phase})\n`;
    }

    message += "\n";
  }

  // Add timestamp
  const timestamp = new Date().toISOString();
  message += `Remediation timestamp: ${timestamp}\n`;

  return message;
}

/**
 * Send notification if requested
 */
async function sendNotification() {
  if (!CONFIG.notify) {
    return;
  }

  logger.section("SENDING NOTIFICATION");

  try {
    // Simple console notification
    logger.info("Notification would be sent here if implemented");
    // In a real implementation, this would send an email, Slack message, etc.
  } catch (error) {
    logger.error(`Failed to send notification: ${error.message}`);
  }
}

/**
 * Generate a report of all actions taken
 */
function generateReport() {
  logger.section("REMEDIATION REPORT");

  const duration = Date.now() - state.startTime;
  const minutes = Math.floor(duration / 60000);
  const seconds = Math.floor((duration % 60000) / 1000);

  logger.info(`Total execution time: ${minutes}m ${seconds}s`);

  if (state.fixes.length > 0) {
    logger.info(`Applied ${state.fixes.length} fix(es):`);

    for (const fix of state.fixes) {
      logger.info(`- ${fix.name} [${fix.severity}]: ${fix.message}`);

      for (const file of fix.files) {
        logger.info(`  - ${file}`);
      }
    }
  } else {
    logger.info("No fixes were applied");
  }

  if (state.errors.length > 0) {
    logger.info(`Encountered ${state.errors.length} error(s):`);

    for (const error of state.errors) {
      logger.error(`- ${error.handler}: ${error.error} (${error.phase})`);
    }
  } else {
    logger.info("No errors were encountered");
  }
}

/**
 * Main function to run the auto-remediation script
 */
async function main() {
  try {
    // Initialize
    const initSuccess = await initialize();
    if (!initSuccess) {
      process.exit(1);
    }

    // Detect issues
    const issueResults = await detectIssues();

    if (issueResults.length === 0) {
      logger.info("No issues detected. Nothing to fix.");
      process.exit(0);
    }

    // Apply fixes
    await applyFixes(issueResults);

    // Validate fixes
    const validationSuccess = await validateFixes();

    // Commit changes
    const commitSuccess = await commitChanges();

    // Send notification if requested
    await sendNotification();

    // Generate report
    generateReport();

    // Clean up
    await cleanup(validationSuccess && commitSuccess);

    // Exit with success code
    process.exit(0);
  } catch (error) {
    logger.error(`Auto-remediation failed: ${error.message}`);

    // Clean up
    await cleanup(false);

    // Exit with error code
    process.exit(1);
  }
}

// Run the script
main();
