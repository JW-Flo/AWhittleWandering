// 48 Continental MCP Server
// This server provides tools for managing environment configurations and UI/UX improvements
// for the 48 Continental USA road trip project

const { createServer } = require("@modelcontextprotocol/server");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { exec } = require("child_process");

// Initialize server
const server = createServer();

// Paths configuration
const PROJECT_ROOT = process.cwd();
const PUBLIC_SITE_DIR = path.join(
  PROJECT_ROOT,
  "48Continental_Starter",
  "public-site"
);
const EDGE_WORKER_DIR = path.join(PROJECT_ROOT, "edge-worker");
const ENV_FILES = {
  publicSiteLocal: path.join(PUBLIC_SITE_DIR, ".env.local"),
  publicSiteExample: path.join(PUBLIC_SITE_DIR, ".env.example"),
  edgeWorkerDev: path.join(EDGE_WORKER_DIR, ".dev.vars"),
};

// Define tools
server.defineTool("syncEnvironmentVariables", {
  description:
    "Synchronize environment variables across 48 Continental project components",
  inputSchema: {
    type: "object",
    properties: {
      source: {
        type: "string",
        description: "Source environment file",
        enum: ["publicSite", "edgeWorker", "merged"],
      },
      syncType: {
        type: "string",
        description: "Type of synchronization",
        enum: ["tokens", "endpoints", "all"],
      },
    },
    required: ["source", "syncType"],
  },
  execute: async ({ source, syncType }) => {
    // Read environment files
    let publicSiteEnv = {};
    let edgeWorkerEnv = {};

    try {
      if (fs.existsSync(ENV_FILES.publicSiteLocal)) {
        publicSiteEnv = dotenv.parse(
          fs.readFileSync(ENV_FILES.publicSiteLocal)
        );
      }
    } catch (error) {
      return { error: `Failed to read public site env: ${error.message}` };
    }

    try {
      if (fs.existsSync(ENV_FILES.edgeWorkerDev)) {
        edgeWorkerEnv = dotenv.parse(fs.readFileSync(ENV_FILES.edgeWorkerDev));
      }
    } catch (error) {
      return { error: `Failed to read edge worker env: ${error.message}` };
    }

    // Mapping between public site and edge worker env variable names
    const variableMapping = {
      VITE_TESSIE_API_TOKEN: "TESSIE_API_TOKEN",
      VITE_TESSIE_VIN: "TESSIE_VIN",
      VITE_MAPBOX_TOKEN: "MAPBOX_TOKEN",
      VITE_OPENWEATHER_API_KEY: "OPENWEATHER_API_KEY",
      VITE_EDGE_WORKER_URL: null, // No direct mapping
      VITE_WEBSOCKET_ENDPOINT: null,
      VITE_API_BASE_URL: null,
    };

    // Variables to sync based on syncType
    let varsToSync = [];
    if (syncType === "tokens" || syncType === "all") {
      varsToSync.push(
        "VITE_TESSIE_API_TOKEN",
        "VITE_TESSIE_VIN",
        "VITE_MAPBOX_TOKEN",
        "VITE_OPENWEATHER_API_KEY"
      );
    }
    if (syncType === "endpoints" || syncType === "all") {
      varsToSync.push(
        "VITE_EDGE_WORKER_URL",
        "VITE_WEBSOCKET_ENDPOINT",
        "VITE_API_BASE_URL"
      );
    }

    // Prepare the updated configs
    let updatedPublicSiteEnv = { ...publicSiteEnv };
    let updatedEdgeWorkerEnv = { ...edgeWorkerEnv };

    const changes = {
      publicSite: [],
      edgeWorker: [],
    };

    // Perform synchronization based on source
    if (source === "publicSite") {
      // Sync from public site to edge worker
      for (const siteVar of varsToSync) {
        const workerVar = variableMapping[siteVar];
        if (workerVar && publicSiteEnv[siteVar]) {
          if (edgeWorkerEnv[workerVar] !== publicSiteEnv[siteVar]) {
            updatedEdgeWorkerEnv[workerVar] = publicSiteEnv[siteVar];
            changes.edgeWorker.push(
              `${workerVar}: ${edgeWorkerEnv[workerVar] || "unset"} → ${
                publicSiteEnv[siteVar]
              }`
            );
          }
        }
      }
    } else if (source === "edgeWorker") {
      // Sync from edge worker to public site
      for (const siteVar of varsToSync) {
        const workerVar = variableMapping[siteVar];
        if (workerVar && edgeWorkerEnv[workerVar]) {
          if (publicSiteEnv[siteVar] !== edgeWorkerEnv[workerVar]) {
            updatedPublicSiteEnv[siteVar] = edgeWorkerEnv[workerVar];
            changes.publicSite.push(
              `${siteVar}: ${publicSiteEnv[siteVar] || "unset"} → ${
                edgeWorkerEnv[workerVar]
              }`
            );
          }
        }
      }
    } else if (source === "merged") {
      // Take the value that's defined in either, prioritizing public site
      for (const siteVar of varsToSync) {
        const workerVar = variableMapping[siteVar];

        if (workerVar) {
          // If public site has value but edge worker doesn't, update edge worker
          if (publicSiteEnv[siteVar] && !edgeWorkerEnv[workerVar]) {
            updatedEdgeWorkerEnv[workerVar] = publicSiteEnv[siteVar];
            changes.edgeWorker.push(
              `${workerVar}: ${edgeWorkerEnv[workerVar] || "unset"} → ${
                publicSiteEnv[siteVar]
              }`
            );
          }
          // If edge worker has value but public site doesn't, update public site
          else if (!publicSiteEnv[siteVar] && edgeWorkerEnv[workerVar]) {
            updatedPublicSiteEnv[siteVar] = edgeWorkerEnv[workerVar];
            changes.publicSite.push(
              `${siteVar}: ${publicSiteEnv[siteVar] || "unset"} → ${
                edgeWorkerEnv[workerVar]
              }`
            );
          }
          // If both have different values, prioritize public site
          else if (
            publicSiteEnv[siteVar] &&
            edgeWorkerEnv[workerVar] &&
            publicSiteEnv[siteVar] !== edgeWorkerEnv[workerVar]
          ) {
            updatedEdgeWorkerEnv[workerVar] = publicSiteEnv[siteVar];
            changes.edgeWorker.push(
              `${workerVar}: ${edgeWorkerEnv[workerVar]} → ${publicSiteEnv[siteVar]}`
            );
          }
        }
      }
    }

    // Write updated configs if there are changes
    if (changes.publicSite.length > 0) {
      try {
        const envContent = Object.entries(updatedPublicSiteEnv)
          .map(([key, value]) => `${key}=${value}`)
          .join("\n");
        fs.writeFileSync(ENV_FILES.publicSiteLocal, envContent);
      } catch (error) {
        return {
          error: `Failed to write public site env: ${error.message}`,
          changes,
        };
      }
    }

    if (changes.edgeWorker.length > 0) {
      try {
        const envContent = Object.entries(updatedEdgeWorkerEnv)
          .map(([key, value]) => `${key}=${value}`)
          .join("\n");
        fs.writeFileSync(ENV_FILES.edgeWorkerDev, envContent);
      } catch (error) {
        return {
          error: `Failed to write edge worker env: ${error.message}`,
          changes,
        };
      }
    }

    return {
      changes,
      message: `Environment variables synchronized successfully from ${source}`,
      publicSiteUpdated: changes.publicSite.length > 0,
      edgeWorkerUpdated: changes.edgeWorker.length > 0,
    };
  },
});

// Tool for fixing common environment issues
server.defineTool("fixEnvironmentIssues", {
  description:
    "Automatically fix common environment issues in the 48 Continental project",
  inputSchema: {
    type: "object",
    properties: {
      fixTokens: { type: "boolean", default: true },
      fixEndpoints: { type: "boolean", default: true },
      useSuggestedValues: { type: "boolean", default: false },
    },
  },
  execute: async ({ fixTokens, fixEndpoints, useSuggestedValues }) => {
    // Read environment files
    let publicSiteEnv = {};
    let edgeWorkerEnv = {};

    try {
      if (fs.existsSync(ENV_FILES.publicSiteLocal)) {
        publicSiteEnv = dotenv.parse(
          fs.readFileSync(ENV_FILES.publicSiteLocal)
        );
      }
    } catch (error) {
      return { error: `Failed to read public site env: ${error.message}` };
    }

    try {
      if (fs.existsSync(ENV_FILES.edgeWorkerDev)) {
        edgeWorkerEnv = dotenv.parse(fs.readFileSync(ENV_FILES.edgeWorkerDev));
      }
    } catch (error) {
      return { error: `Failed to read edge worker env: ${error.message}` };
    }

    const updates = {
      publicSite: [],
      edgeWorker: [],
    };

    let updatedPublicSiteEnv = { ...publicSiteEnv };
    let updatedEdgeWorkerEnv = { ...edgeWorkerEnv };

    // Fix token issues
    if (fixTokens) {
      // Ensure both use the same Tessie API token
      if (
        publicSiteEnv.VITE_TESSIE_API_TOKEN &&
        edgeWorkerEnv.TESSIE_API_TOKEN &&
        publicSiteEnv.VITE_TESSIE_API_TOKEN !== edgeWorkerEnv.TESSIE_API_TOKEN
      ) {
        // Prioritize the public site token
        updatedEdgeWorkerEnv.TESSIE_API_TOKEN =
          publicSiteEnv.VITE_TESSIE_API_TOKEN;
        updates.edgeWorker.push(
          `TESSIE_API_TOKEN: ${edgeWorkerEnv.TESSIE_API_TOKEN} → ${publicSiteEnv.VITE_TESSIE_API_TOKEN}`
        );
      }

      // Ensure both use the same VIN
      if (
        publicSiteEnv.VITE_TESSIE_VIN &&
        edgeWorkerEnv.TESSIE_VIN &&
        publicSiteEnv.VITE_TESSIE_VIN !== edgeWorkerEnv.TESSIE_VIN
      ) {
        // Prioritize the public site VIN
        updatedEdgeWorkerEnv.TESSIE_VIN = publicSiteEnv.VITE_TESSIE_VIN;
        updates.edgeWorker.push(
          `TESSIE_VIN: ${edgeWorkerEnv.TESSIE_VIN} → ${publicSiteEnv.VITE_TESSIE_VIN}`
        );
      }

      // Add suggested values if requested and if tokens are missing
      if (useSuggestedValues) {
        // Set suggested Tessie API token if missing
        if (
          !publicSiteEnv.VITE_TESSIE_API_TOKEN &&
          !edgeWorkerEnv.TESSIE_API_TOKEN
        ) {
          const suggestedToken = "bqfufwiCC5QeXIhlZ9I1eCYoF9XFd9xo"; // Example value
          updatedPublicSiteEnv.VITE_TESSIE_API_TOKEN = suggestedToken;
          updatedEdgeWorkerEnv.TESSIE_API_TOKEN = suggestedToken;
          updates.publicSite.push(
            `VITE_TESSIE_API_TOKEN: unset → ${suggestedToken}`
          );
          updates.edgeWorker.push(
            `TESSIE_API_TOKEN: unset → ${suggestedToken}`
          );
        }

        // Set suggested VIN if missing
        if (!publicSiteEnv.VITE_TESSIE_VIN && !edgeWorkerEnv.TESSIE_VIN) {
          const suggestedVin = "5YJYGDEE5LF027324"; // Example value
          updatedPublicSiteEnv.VITE_TESSIE_VIN = suggestedVin;
          updatedEdgeWorkerEnv.TESSIE_VIN = suggestedVin;
          updates.publicSite.push(`VITE_TESSIE_VIN: unset → ${suggestedVin}`);
          updates.edgeWorker.push(`TESSIE_VIN: unset → ${suggestedVin}`);
        }
      }
    }

    // Fix endpoint issues
    if (fixEndpoints) {
      // Check if endpoints are local but edge worker is deployed
      if (
        publicSiteEnv.VITE_EDGE_WORKER_URL === "http://localhost:8787" &&
        publicSiteEnv.VITE_WEBSOCKET_ENDPOINT.includes("workers.dev")
      ) {
        // Align the edge worker URL with websocket URL
        const workerUrl = publicSiteEnv.VITE_WEBSOCKET_ENDPOINT.replace(
          "wss://",
          "https://"
        ).replace("/ws", "");
        updatedPublicSiteEnv.VITE_EDGE_WORKER_URL = workerUrl;
        updatedPublicSiteEnv.VITE_API_BASE_URL = workerUrl;
        updates.publicSite.push(
          `VITE_EDGE_WORKER_URL: ${publicSiteEnv.VITE_EDGE_WORKER_URL} → ${workerUrl}`
        );
        updates.publicSite.push(
          `VITE_API_BASE_URL: ${publicSiteEnv.VITE_API_BASE_URL} → ${workerUrl}`
        );
      }

      // Ensure API_BASE_URL matches EDGE_WORKER_URL if both exist
      if (
        publicSiteEnv.VITE_EDGE_WORKER_URL &&
        publicSiteEnv.VITE_API_BASE_URL &&
        publicSiteEnv.VITE_EDGE_WORKER_URL !== publicSiteEnv.VITE_API_BASE_URL
      ) {
        updatedPublicSiteEnv.VITE_API_BASE_URL =
          publicSiteEnv.VITE_EDGE_WORKER_URL;
        updates.publicSite.push(
          `VITE_API_BASE_URL: ${publicSiteEnv.VITE_API_BASE_URL} → ${publicSiteEnv.VITE_EDGE_WORKER_URL}`
        );
      }
    }

    // Write updated configs if there are changes
    if (updates.publicSite.length > 0) {
      try {
        const envContent = Object.entries(updatedPublicSiteEnv)
          .map(([key, value]) => `${key}=${value}`)
          .join("\n");
        fs.writeFileSync(ENV_FILES.publicSiteLocal, envContent);
      } catch (error) {
        return {
          error: `Failed to write public site env: ${error.message}`,
          updates,
        };
      }
    }

    if (updates.edgeWorker.length > 0) {
      try {
        const envContent = Object.entries(updatedEdgeWorkerEnv)
          .map(([key, value]) => `${key}=${value}`)
          .join("\n");
        fs.writeFileSync(ENV_FILES.edgeWorkerDev, envContent);
      } catch (error) {
        return {
          error: `Failed to write edge worker env: ${error.message}`,
          updates,
        };
      }
    }

    return {
      updates,
      message: "Environment issues fixed successfully",
      publicSiteUpdated: updates.publicSite.length > 0,
      edgeWorkerUpdated: updates.edgeWorker.length > 0,
    };
  },
});

// Tool for analyzing UI/UX issues
server.defineTool("analyzeUIUXIssues", {
  description: "Analyze the 48 Continental project for common UI/UX issues",
  inputSchema: {
    type: "object",
    properties: {
      components: {
        type: "array",
        items: {
          type: "string",
        },
        default: ["Dashboard", "Map", "StatesTracker"],
      },
    },
  },
  execute: async ({ components }) => {
    const results = [];
    const componentPaths = {
      Dashboard: path.join(PUBLIC_SITE_DIR, "src/components/Dashboard.jsx"),
      Map: path.join(PUBLIC_SITE_DIR, "src/components/Map.jsx"),
      StatesTracker: path.join(
        PUBLIC_SITE_DIR,
        "src/components/StatesTracker.jsx"
      ),
    };

    // Analyze each component
    for (const component of components) {
      const componentPath = componentPaths[component];
      if (!componentPath || !fs.existsSync(componentPath)) {
        results.push({
          component,
          error: `Component file not found: ${componentPath}`,
        });
        continue;
      }

      const content = fs.readFileSync(componentPath, "utf-8");
      const issues = [];

      // Check for common issues
      if (component === "Dashboard") {
        if (!content.includes("connectionStatus")) {
          issues.push("Missing connection status indicator in Dashboard");
        }
        if (!content.includes('className="map-layer-controls"')) {
          issues.push("Missing map layer controls in Dashboard");
        }
        if (
          !content.includes("mapLayers.weather") &&
          content.includes("weatherData")
        ) {
          issues.push("Weather data is available but not used in map layers");
        }
      }

      if (component === "Map") {
        if (
          !content.includes("mapLayers.satellite") ||
          !content.includes("mapLayers.chargingStations")
        ) {
          issues.push(
            "Map component might not fully support all layer toggles"
          );
        }
      }

      if (component === "StatesTracker") {
        if (
          !content.includes("visitedStates") ||
          !content.includes("currentState")
        ) {
          issues.push(
            "StatesTracker might not properly display visited states or current state"
          );
        }
      }

      // Check for responsive design issues
      if (
        !content.includes("@media") &&
        !fs.existsSync(componentPath.replace(".jsx", ".css"))
      ) {
        issues.push("Component might not have proper responsive design styles");
      }

      results.push({
        component,
        path: componentPath,
        issues: issues.length > 0 ? issues : ["No issues detected"],
      });
    }

    return {
      results,
      summary: `Analyzed ${components.length} components for UI/UX issues`,
    };
  },
});

// Tool for starting the local development server
server.defineTool("startLocalDev", {
  description: "Start the 48 Continental local development server",
  inputSchema: {
    type: "object",
    properties: {
      component: {
        type: "string",
        enum: ["public-site", "edge-worker", "all"],
        default: "all",
      },
    },
  },
  execute: async ({ component }) => {
    let command = "";
    let workingDir = "";

    if (component === "public-site") {
      workingDir = PUBLIC_SITE_DIR;
      command = "bun run dev";
    } else if (component === "edge-worker") {
      workingDir = EDGE_WORKER_DIR;
      command = "bun run dev";
    } else {
      // Run the root start script for all components
      workingDir = PROJECT_ROOT;
      command = "node scripts/start-local-dev.cjs";
    }

    return new Promise((resolve) => {
      exec(command, { cwd: workingDir }, (error, stdout, stderr) => {
        if (error) {
          resolve({
            success: false,
            error: error.message,
            output: stderr || stdout,
          });
        } else {
          resolve({
            success: true,
            component,
            output: stdout,
          });
        }
      });
    });
  },
});

// Start the server
server.listen(8890, () => {
  console.log("48 Continental MCP Server listening on port 8890");
});
