/**
 * @file blackbox_mcp_settings.js
 * @description MCP server configuration for BlackBox AI
 * 
 * This configuration defines the MCP server for sequentialthinking
 * as per the user's request and project rules.
 */

module.exports = {
  "github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking": {
    command: "npx",
    args: [
      "-y",
      "@modelcontextprotocol/server-sequential-thinking"
    ]
  }
};
