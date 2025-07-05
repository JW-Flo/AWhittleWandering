import { Router } from "itty-router";
import GitHubClient from "./services/github-client.js";
import { createTools } from "./tools/index.js";
import { handleCORS, handleNotFound } from "./utils/handlers.js";
import { createVehicleTrackerIssues } from "./automation/issue-creator.js";
import { autoGenerateNextTask } from "./automation/auto-task-generator.js";

// Create a new router
const router = Router();

// Configuration and environment
const getConfig = (env) => ({
  github: {
    appId: env.GITHUB_APP_ID,
    privateKey: env.GITHUB_APP_PRIVATE_KEY,
    installationId: env.GITHUB_APP_INSTALLATION_ID,
    apiUrl: env.GITHUB_API_URL || "https://api.github.com",
    owner: env.GITHUB_OWNER,
    repo: env.GITHUB_REPO,
  },
  cors: {
    allowedOrigins: (env.ALLOWED_ORIGINS || "").split(",").filter(Boolean),
  },
});

// Handle CORS preflight requests
router.options("*", handleCORS);

// MCP API endpoints
router.post("/tools/:toolName", async (request, env) => {
  const { toolName } = request.params;
  const config = getConfig(env);
  const githubClient = new GitHubClient(config.github);
  const tools = createTools(githubClient, env.GITHUB_MCP_KV);

  if (!tools[toolName]) {
    return new Response(
      JSON.stringify({ error: `Tool '${toolName}' not found` }),
      {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          ...handleCORS(request, config),
        },
      }
    );
  }

  try {
    const payload = await request.json();

    // If the tool is 'createVehicleTrackerIssues', chain auto task generation
    if (toolName === "createVehicleTrackerIssues") {
      const createdIssues = await createVehicleTrackerIssues(
        githubClient,
        env.GITHUB_MCP_KV,
        payload.tasks
      );
      // For each created issue, generate next task automatically
      const autoTasks = [];
      for (const issue of createdIssues) {
        const nextTask = await autoGenerateNextTask(
          githubClient,
          env.GITHUB_MCP_KV,
          {
            owner: config.github.owner,
            repo: config.github.repo,
            title: issue.title,
            labels: issue.labels,
            assignees: issue.assignees,
          }
        );
        autoTasks.push(nextTask);
      }
      return new Response(JSON.stringify({ createdIssues, autoTasks }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...handleCORS(request, config),
        },
      });
    }

    const result = await tools[toolName](payload);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...handleCORS(request, config),
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...handleCORS(request, config),
      },
    });
  }
});

// MCP Server information
router.get("/server-info", (request, env) => {
  const config = getConfig(env);
  const toolsList = Object.keys(
    createTools(new GitHubClient(config.github), env.GITHUB_MCP_KV)
  );

  return new Response(
    JSON.stringify({
      name: "GitHub MCP Server",
      version: "1.0.0",
      description:
        "MCP server providing GitHub integration tools for 48 Continental USA project",
      tools: toolsList.map((name) => ({ name })),
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...handleCORS(request, config),
      },
    }
  );
});

// Health check
router.get("/health", (request, env) => {
  const config = getConfig(env);
  return new Response(JSON.stringify({ status: "ok" }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ...handleCORS(request, config),
    },
  });
});

// Catch-all 404 handler
router.all("*", handleNotFound);

// Main handler for the worker
export default {
  async fetch(request, env, ctx) {
    return router.handle(request, env, ctx);
  },
};
