#!/usr/bin/env node
/**
 * Fix Mapbox Token Script
 *
 * This script uses the existing MCP infrastructure to fix Mapbox token issues.
 * It calls the appropriate tools in the 48Continental MCP server.
 */

import http from "http";

// Define the MCP server request for fixing the Mapbox token
const mcpRequest = {
  tool: "syncEnvironmentVariables",
  input: {
    source: "merged",
    syncType: "tokens",
  },
};

console.log("🗺️ Requesting MCP server to fix Mapbox token...");

// Send request to the MCP server
const req = http.request(
  {
    hostname: "localhost",
    port: 8890,
    path: "/",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  },
  (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      try {
        const result = JSON.parse(data);

        if (result.success) {
          console.log("✅ Successfully synchronized Mapbox token!");
          console.log("\nUpdates made:");

          if (result.updates && result.updates.publicSite) {
            console.log("\nPublic Site Updates:");
            result.updates.publicSite.forEach((update) =>
              console.log(`- ${update}`)
            );
          }

          if (result.updates && result.updates.edgeWorker) {
            console.log("\nEdge Worker Updates:");
            result.updates.edgeWorker.forEach((update) =>
              console.log(`- ${update}`)
            );
          }

          console.log(
            "\n🌐 Mapbox integration should now be working correctly."
          );
        } else {
          console.error("❌ Failed to synchronize Mapbox token:", result.error);
        }
      } catch (error) {
        console.error("❌ Error parsing MCP server response:", error);
      }
    });
  }
);

req.on("error", (error) => {
  console.error("❌ Error connecting to MCP server:", error.message);
  console.log(
    "Make sure the MCP server is running. Start it with: bun run start:mcp"
  );
});

// Send the request
req.write(JSON.stringify(mcpRequest));
req.end();
