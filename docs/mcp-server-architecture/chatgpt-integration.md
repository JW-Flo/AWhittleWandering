# ChatGPT Integration Guide

This guide provides detailed information on integrating the Cloudflare-based MCP Server with ChatGPT, enabling AI assistants to discover and use the tools provided by the MCP Server.

## Table of Contents

1. [Integration Overview](#integration-overview)
2. [ChatGPT Custom Connector](#chatgpt-custom-connector)
3. [Authentication Setup](#authentication-setup)
4. [Testing Integration](#testing-integration)
5. [Tool Discovery](#tool-discovery)
6. [Tool Execution](#tool-execution)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

## Integration Overview

The Model Context Protocol (MCP) allows AI assistants like ChatGPT to discover and use tools provided by external servers. This integration enables ChatGPT to connect to your Cloudflare-based MCP Server and use the tools provided by its plugins.

The integration process involves:

1. Deploying the MCP Server to Cloudflare Workers
2. Configuring a custom connector in ChatGPT
3. Setting up authentication
4. Testing the integration
5. Using the tools in conversations

## ChatGPT Custom Connector

ChatGPT provides a Custom Connector feature that allows connecting to external MCP servers. To set up a custom connector for your MCP Server:

1. **Access Custom Connectors**:
   - Log in to ChatGPT
   - Go to Settings
   - Select "Custom Connectors"
   - Click "Add Connector"

2. **Configure Connector**:
   - **Name**: A descriptive name for your connector (e.g., "48 Continental USA MCP Server")
   - **Description**: A brief description of what your connector does
   - **Authentication**: Select "Bearer Token"
   - **URL**: The URL of your deployed MCP Server (e.g., `https://mcp-server.example.workers.dev`)
   - **Token**: The authentication token generated for the ChatGPT integration

3. **Save Connector**:
   - Click "Save" to create the connector
   - ChatGPT will attempt to connect to the MCP Server and discover available tools

## Authentication Setup

To secure the integration between ChatGPT and your MCP Server, you should use token-based authentication.

1. **Generate a Token**:
   ```javascript
   const token = await authService.generateToken('chatgpt-connector', Roles.USER);
   console.log('ChatGPT Integration Token:', token);
   ```

2. **Configure Token in ChatGPT**:
   - Add the token to the Custom Connector configuration

3. **Validate Token in MCP Server**:
   - The MCP Server should validate the token for all requests
   - Implement token validation as shown in the Authentication Implementation Guide

## Testing Integration

After setting up the integration, you should test it to ensure that ChatGPT can discover and use the tools provided by your MCP Server.

1. **Test Discovery**:
   - In a new ChatGPT conversation, enable the custom connector
   - Ask ChatGPT about the available tools
   - ChatGPT should list the tools provided by your MCP Server

2. **Test Execution**:
   - Ask ChatGPT to use one of the tools
   - Provide the necessary parameters for the tool
   - ChatGPT should execute the tool and return the results

3. **Test Error Handling**:
   - Intentionally provide invalid parameters
   - ChatGPT should receive and display an appropriate error message

## Tool Discovery

The MCP Server provides a discovery endpoint that allows ChatGPT to discover the available tools. The discovery response includes information about the server and its tools.

**Example Discovery Response**:
```json
{
  "name": "48 Continental USA MCP Server",
  "version": "1.0.0",
  "description": "MCP server for 48 Continental USA project with map and weather services",
  "servers": [
    {
      "name": "map-agent",
      "description": "MapBox Specialist Agent for route optimization and map rendering",
      "tools": [
        {
          "name": "optimizeRoute",
          "description": "Optimizes a route between multiple waypoints",
          "parameters": [
            {
              "name": "waypoints",
              "type": "array",
              "description": "Array of waypoints to optimize",
              "required": true,
              "items": {
                "type": "object",
                "properties": {
                  "latitude": {
                    "type": "number",
                    "description": "The latitude of the waypoint",
                    "required": true
                  },
                  "longitude": {
                    "type": "number",
                    "description": "The longitude of the waypoint",
                    "required": true
                  }
                }
              }
            }
          ]
        }
      ]
    }
  ]
}
```

## Tool Execution

ChatGPT can execute tools provided by the MCP Server by sending execution requests. The execution request includes the tool name and parameters.

**Example Execution Request**:
```json
{
  "server": "map-agent",
  "tool": "optimizeRoute",
  "parameters": {
    "waypoints": [
      { "latitude": 37.7749, "longitude": -122.4194 },
      { "latitude": 34.0522, "longitude": -118.2437 }
    ]
  }
}
```

**Example Execution Response**:
```json
{
  "route": {
    "distance": 383.1,
    "duration": 21780,
    "waypoints": [
      { "latitude": 37.7749, "longitude": -122.4194, "name": "San Francisco" },
      { "latitude": 34.0522, "longitude": -118.2437, "name": "Los Angeles" }
    ],
    "legs": [
      {
        "distance": 383.1,
        "duration": 21780,
        "steps": [
          // Route steps
        ]
      }
    ]
  }
}
```

## Troubleshooting

If you encounter issues with the integration, consider the following troubleshooting steps:

1. **Verify Connectivity**:
   - Check that the MCP Server is accessible from the internet
   - Verify that the URL in the Custom Connector configuration is correct
   - Ensure that the MCP Server is responding to requests

2. **Check Authentication**:
   - Verify that the token in the Custom Connector configuration is correct
   - Check that the token has not expired
   - Ensure that the token has the necessary permissions

3. **Inspect Discovery**:
   - Use a tool like curl or Postman to manually send a discovery request
   - Verify that the discovery response is correctly formatted
   - Check that the tools are properly defined

4. **Test Execution**:
   - Use a tool like curl or Postman to manually send an execution request
   - Verify that the execution response is correctly formatted
   - Check for any error messages in the MCP Server logs

5. **Review Logs**:
   - Check the MCP Server logs for any error messages
   - Look for authentication errors, validation errors, or execution errors
   - Ensure that the MCP Server is properly configured

## Best Practices

When integrating ChatGPT with your MCP Server, follow these best practices:

1. **Clear Tool Descriptions**:
   - Provide clear and concise descriptions for your tools
   - Include information about what the tool does and how to use it
   - Use examples to illustrate tool usage

2. **Robust Error Handling**:
   - Implement comprehensive error handling in your MCP Server
   - Return informative error messages to help users understand issues
   - Include suggestions for how to fix problems

3. **Efficient Authentication**:
   - Use token-based authentication for security
   - Implement token expiration and rotation
   - Limit token permissions to only what is necessary

4. **Performance Optimization**:
   - Optimize your MCP Server for performance
   - Use caching where appropriate
   - Minimize response times for tool execution

5. **Monitoring and Logging**:
   - Implement monitoring for your MCP Server
   - Log all requests and responses for debugging
   - Set up alerts for critical issues

6. **Regular Updates**:
   - Keep your MCP Server and plugins up to date
   - Add new tools and capabilities as needed
   - Respond to user feedback and improve the integration

By following this guide, you can successfully integrate your Cloudflare-based MCP Server with ChatGPT, enabling AI assistants to use the tools provided by your server to help users accomplish their tasks.
