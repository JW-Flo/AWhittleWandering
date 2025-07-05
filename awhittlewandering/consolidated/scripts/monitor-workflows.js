#!/usr/bin/env node

/**
 * GitHub Actions Workflow Monitor with Auto-remediation
 *
 * This script checks the status of GitHub Actions workflows and
 * can automatically re-run failed workflows or trigger remediation steps.
 *
 * Usage:
 *   node monitor-workflows.js
 *
 * Environment variables:
 *   GITHUB_TOKEN - GitHub Personal Access Token with workflow permissions
 *   GITHUB_OWNER - GitHub repository owner/organization
 *   GITHUB_REPO - GitHub repository name
 *   AUTO_REMEDIATE - Set to "true" to enable auto-remediation (default: false)
 *   NOTIFICATION_WEBHOOK - Webhook URL for sending notifications
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// Configuration
const config = {
  github: {
    token: process.env.GITHUB_TOKEN,
    owner: process.env.GITHUB_OWNER || "owner",
    repo: process.env.GITHUB_REPO || "repo",
    apiBaseUrl: "api.github.com",
  },
  remediation: {
    autoRemediate: process.env.AUTO_REMEDIATE === "true",
    maxRetries: 3,
    waitBetweenRetries: 5 * 60 * 1000, // 5 minutes
  },
  notification: {
    webhook: process.env.NOTIFICATION_WEBHOOK,
    sendFailureNotifications: true,
    sendSuccessNotifications: false,
  },
  logging: {
    logFilePath: path.join(__dirname, "../logs/workflow-monitor.log"),
    logToConsole: true,
  },
};

// Ensure the logs directory exists
const logsDir = path.dirname(config.logging.logFilePath);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Logger
const logger = {
  log: (message, level = "INFO") => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;

    // Log to console
    if (config.logging.logToConsole) {
      console.log(logMessage);
    }

    // Log to file
    fs.appendFileSync(config.logging.logFilePath, logMessage + "\n");
  },
  info: (message) => logger.log(message, "INFO"),
  warn: (message) => logger.log(message, "WARN"),
  error: (message) => logger.log(message, "ERROR"),
  success: (message) => logger.log(message, "SUCCESS"),
};

// Known issues and their remediation steps
const knownIssues = {
  "undefined visitedStates": {
    detect: (logs) =>
      logs.includes(
        "TypeError: Cannot read properties of undefined (reading 'length')"
      ) && logs.includes("visitedStates"),
    remediate: async () => {
      logger.info("Detected undefined visitedStates issue, applying fix...");
      // Execute the fix script or command
      await executeCommand("scripts/fix-visited-states.sh");
      return true;
    },
  },
  "mapbox token missing": {
    detect: (logs) =>
      logs.includes("MapboxTokenError") ||
      logs.includes("Mapbox token not found"),
    remediate: async () => {
      logger.info("Detected Mapbox token issue, verifying token...");
      await executeCommand(
        "cd 48Continental_Starter/public-site && npm run verify-mapbox-token"
      );
      return true;
    },
  },
  "API connection failure": {
    detect: (logs) =>
      logs.includes("Failed to connect to API") ||
      logs.includes("API connection timeout"),
    remediate: async () => {
      logger.info(
        "Detected API connection issue, triggering edge worker redeployment..."
      );
      await executeCommand("cd edge-worker && npx wrangler deploy");
      return true;
    },
  },
};

/**
 * Execute a shell command
 * @param {string} command Command to execute
 * @returns {Promise<string>} Command output
 */
function executeCommand(command) {
  const { exec } = require("child_process");

  return new Promise((resolve, reject) => {
    logger.info(`Executing command: ${command}`);

    exec(command, (error, stdout, stderr) => {
      if (error) {
        logger.error(`Command execution error: ${error.message}`);
        reject(error);
        return;
      }

      if (stderr) {
        logger.warn(`Command stderr: ${stderr}`);
      }

      logger.info(`Command stdout: ${stdout}`);
      resolve(stdout);
    });
  });
}

/**
 * Make a request to the GitHub API
 * @param {string} endpoint API endpoint
 * @param {string} method HTTP method
 * @param {object} data Request data
 * @returns {Promise<object>} Response data
 */
function githubRequest(endpoint, method = "GET", data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: config.github.apiBaseUrl,
      path: `/repos/${config.github.owner}/${config.github.repo}${endpoint}`,
      method: method,
      headers: {
        "User-Agent": "Workflow-Monitor",
        Authorization: `token ${config.github.token}`,
        Accept: "application/vnd.github.v3+json",
      },
    };

    const req = https.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(responseData));
          } catch (error) {
            resolve(responseData);
          }
        } else {
          reject(
            new Error(
              `GitHub API request failed with status ${res.statusCode}: ${responseData}`
            )
          );
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Get recent workflow runs
 * @returns {Promise<Array>} Recent workflow runs
 */
async function getRecentWorkflowRuns() {
  try {
    const response = await githubRequest("/actions/runs?per_page=10");
    return response.workflow_runs || [];
  } catch (error) {
    logger.error(`Failed to get recent workflow runs: ${error.message}`);
    return [];
  }
}

/**
 * Get logs for a workflow run
 * @param {number} runId Workflow run ID
 * @returns {Promise<string>} Workflow logs
 */
async function getWorkflowLogs(runId) {
  try {
    const response = await githubRequest(`/actions/runs/${runId}/logs`, "GET");
    return response;
  } catch (error) {
    logger.error(`Failed to get logs for run ${runId}: ${error.message}`);
    return "";
  }
}

/**
 * Re-run a failed workflow
 * @param {number} runId Workflow run ID
 * @returns {Promise<boolean>} Success status
 */
async function rerunFailedWorkflow(runId) {
  try {
    await githubRequest(`/actions/runs/${runId}/rerun`, "POST");
    logger.success(`Re-ran workflow run ${runId}`);
    return true;
  } catch (error) {
    logger.error(`Failed to re-run workflow run ${runId}: ${error.message}`);
    return false;
  }
}

/**
 * Send a notification
 * @param {string} message Notification message
 * @param {string} level Notification level (info, warning, error)
 * @returns {Promise<boolean>} Success status
 */
async function sendNotification(message, level = "info") {
  if (!config.notification.webhook) {
    return false;
  }

  try {
    const data = {
      text: message,
      level: level,
      source: "workflow-monitor",
      timestamp: new Date().toISOString(),
    };

    const url = new URL(config.notification.webhook);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(true);
        } else {
          reject(
            new Error(
              `Notification request failed with status ${res.statusCode}`
            )
          );
        }
      });

      req.on("error", (error) => {
        reject(error);
      });

      req.write(JSON.stringify(data));
      req.end();
    });
  } catch (error) {
    logger.error(`Failed to send notification: ${error.message}`);
    return false;
  }
}

/**
 * Attempt to remediate a failed workflow
 * @param {object} run Workflow run
 * @param {string} logs Workflow logs
 * @returns {Promise<boolean>} Success status
 */
async function remediateFailedWorkflow(run, logs) {
  // First, check for known issues
  for (const [issueName, issue] of Object.entries(knownIssues)) {
    if (issue.detect(logs)) {
      logger.info(`Detected known issue: ${issueName}`);

      if (config.remediation.autoRemediate) {
        try {
          const success = await issue.remediate();

          if (success) {
            logger.success(`Successfully remediated issue: ${issueName}`);
            await sendNotification(
              `🔧 Successfully remediated issue: ${issueName} for workflow "${run.name}" (${run.html_url})`,
              "info"
            );
            return true;
          }
        } catch (error) {
          logger.error(
            `Failed to remediate issue ${issueName}: ${error.message}`
          );
        }
      } else {
        logger.info(
          `Auto-remediation disabled. Would have remediated: ${issueName}`
        );
        await sendNotification(
          `⚠️ Detected issue: ${issueName} in workflow "${run.name}" but auto-remediation is disabled (${run.html_url})`,
          "warning"
        );
      }
    }
  }

  // If no known issue was remediated, try re-running the workflow
  if (config.remediation.autoRemediate) {
    logger.info(
      `No known issue pattern matched. Attempting to re-run workflow ${run.id}`
    );
    return await rerunFailedWorkflow(run.id);
  }

  return false;
}

/**
 * Process a workflow run
 * @param {object} run Workflow run
 */
async function processWorkflowRun(run) {
  logger.info(
    `Processing workflow run: ${run.id} (${run.name}) - Status: ${
      run.conclusion || run.status
    }`
  );

  // Skip if the workflow is still in progress
  if (run.status === "in_progress" || run.status === "queued") {
    logger.info(`Workflow run ${run.id} is still in progress. Skipping.`);
    return;
  }

  // If the workflow failed, try to remediate
  if (run.conclusion === "failure") {
    logger.warn(`Workflow run ${run.id} failed. Attempting to remediate.`);

    // Get the logs to analyze the failure
    const logs = await getWorkflowLogs(run.id);

    // Attempt to remediate
    const remediationSuccess = await remediateFailedWorkflow(run, logs);

    if (!remediationSuccess && config.notification.sendFailureNotifications) {
      await sendNotification(
        `❌ Workflow "${run.name}" failed and could not be automatically remediated. Manual intervention required. (${run.html_url})`,
        "error"
      );
    }
  } else if (
    run.conclusion === "success" &&
    config.notification.sendSuccessNotifications
  ) {
    // If the workflow succeeded, send a success notification if enabled
    await sendNotification(
      `✅ Workflow "${run.name}" completed successfully. (${run.html_url})`,
      "info"
    );
  }
}

/**
 * Main function
 */
async function main() {
  logger.info("Starting workflow monitor");

  try {
    // Get recent workflow runs
    const runs = await getRecentWorkflowRuns();

    if (runs.length === 0) {
      logger.info("No recent workflow runs found");
      return;
    }

    logger.info(`Found ${runs.length} recent workflow runs`);

    // Process each workflow run
    for (const run of runs) {
      await processWorkflowRun(run);
    }

    logger.success("Workflow monitoring completed successfully");
  } catch (error) {
    logger.error(`Workflow monitoring failed: ${error.message}`);

    if (config.notification.sendFailureNotifications) {
      await sendNotification(
        `⚠️ Workflow monitor encountered an error: ${error.message}`,
        "error"
      );
    }
  }
}

// Run the main function
main();
