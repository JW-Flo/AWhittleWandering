/**
 * @file blackbox_mcp_settings.js
 * @description MCP server configuration for BlackBox AI
 *
 * This configuration defines the MCP servers for sequentialthinking and mcp-server-chart
 * as per the user's request and project rules.
 */

module.exports = {
  "github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking": {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-sequential-thinking"],
  },
  "github.com/antvis/mcp-server-chart": {
    command: "npx",
    args: ["-y", "@antv/mcp-server-chart"],
  },
};
