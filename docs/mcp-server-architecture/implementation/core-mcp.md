# Core MCP Protocol Implementation Guide

This guide provides detailed information on implementing the core Model Context Protocol (MCP) handlers for the Cloudflare-based MCP Server.

## Table of Contents

1. [Protocol Overview](#protocol-overview)
2. [Implementation Structure](#implementation-structure)
3. [Request Handling](#request-handling)
4. [Discovery Endpoint](#discovery-endpoint)
5. [Tool Execution](#tool-execution)
6. [Error Handling](#error-handling)
7. [Integration with Authentication](#integration-with-authentication)
8. [Integration with Plugins](#integration-with-plugins)
9. [Example Implementation](#example-implementation)

## Protocol Overview

The Model Context Protocol (MCP) defines how AI assistants like ChatGPT interact with external tools and services. The protocol consists of:

1. **Discovery**: The assistant requests information about available tools.
2. **Execution**: The assistant requests execution of a specific tool with parameters.
3. **Response**: The server responds with the results of the tool execution.

## Implementation Structure

The core MCP implementation should be structured as follows:

```
src/
├── core/
│   ├── mcp/
│   │   ├── index.ts           # Main entry point for MCP handlers
│   │   ├── discovery.ts       # Tool discovery handler
│   │   ├── execution.ts       # Tool execution handler
│   │   ├── validation.ts      # Parameter validation
│   │   ├── error.ts           # Error handling
│   │   └── types.ts           # Type definitions
│   ├── auth/                  # Authentication integration
│   └── plugins/               # Plugin integration
```

## Request Handling

All MCP requests come through a single entry point, which routes to the appropriate handler based on the request type.

```typescript
// src/core/mcp/index.ts
import { handleDiscovery } from './discovery';
import { handleExecution } from './execution';
import { validateRequest } from './validation';
import { handleError } from './error';

export async function handleMCPRequest(request: Request): Promise<Response> {
  try {
    // Validate the request
    const { type, data } = await validateRequest(request);
    
    // Route to the appropriate handler
    switch (type) {
      case 'discovery':
        return await handleDiscovery(data);
      case 'execution':
        return await handleExecution(data);
      default:
        throw new Error(`Unknown request type: ${type}`);
    }
  } catch (error) {
    // Handle errors
    return handleError(error);
  }
}
```

## Discovery Endpoint

The discovery endpoint provides information about available tools to the AI assistant. It queries the plugin manager for available plugins and their tools.

```typescript
// src/core/mcp/discovery.ts
import { PluginManager } from '../plugins';

export async function handleDiscovery(data: any): Promise<Response> {
  // Get the plugin manager instance
  const pluginManager = PluginManager.getInstance();
  
  // Get all available plugins
  const plugins = await pluginManager.listPlugins();
  
  // Format the discovery response
  const response = {
    servers: plugins.map(plugin => ({
      name: plugin.getName(),
      description: plugin.getDescription(),
      tools: plugin.getTools().map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }))
    }))
  };
  
  // Return the response
  return new Response(JSON.stringify(response), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
```

## Tool Execution

The tool execution endpoint executes a specific tool with the provided parameters. It routes the execution request to the appropriate plugin.

```typescript
// src/core/mcp/execution.ts
import { PluginManager } from '../plugins';
import { validateParameters } from './validation';

export async function handleExecution(data: any): Promise<Response> {
  // Extract the execution details
  const { server, tool, parameters } = data;
  
  // Get the plugin manager instance
  const pluginManager = PluginManager.getInstance();
  
  // Get the plugin
  const plugin = await pluginManager.getPlugin(server);
  if (!plugin) {
    throw new Error(`Plugin not found: ${server}`);
  }
  
  // Validate the parameters
  const validatedParams = validateParameters(tool, parameters, plugin.getTools());
  
  // Execute the tool
  const result = await plugin.executeTool(tool, validatedParams);
  
  // Return the response
  return new Response(JSON.stringify(result), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
```

## Error Handling

Proper error handling is essential for providing helpful feedback to the AI assistant. The error handler should format errors in a consistent way.

```typescript
// src/core/mcp/error.ts
export function handleError(error: any): Response {
  // Format the error response
  const errorResponse = {
    error: {
      message: error.message || 'An unknown error occurred',
      code: error.code || 500,
      details: error.details || null
    }
  };
  
  // Return the error response
  return new Response(JSON.stringify(errorResponse), {
    status: error.code || 500,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
```

## Integration with Authentication

The MCP handlers should integrate with the authentication system to validate requests. This is typically done in the request validation step.

```typescript
// src/core/mcp/validation.ts
import { AuthService } from '../auth';

export async function validateRequest(request: Request): Promise<{ type: string, data: any }> {
  // Extract the authentication token from the request
  const authToken = request.headers.get('Authorization');
  
  // Validate the token
  const authService = AuthService.getInstance();
  const isValid = await authService.validateToken(authToken);
  if (!isValid) {
    throw new Error('Unauthorized');
  }
  
  // Parse the request body
  const body = await request.json();
  
  // Determine the request type
  let type = 'execution';
  if (request.url.endsWith('/discovery')) {
    type = 'discovery';
  }
  
  // Return the validated request
  return { type, data: body };
}
```

## Integration with Plugins

The MCP handlers interact with plugins through the plugin manager. The plugin manager provides methods for listing plugins, getting plugin details, and executing tools.

```typescript
// src/core/plugins/manager.ts
export class PluginManager {
  private static instance: PluginManager;
  private plugins: Map<string, Plugin> = new Map();
  
  private constructor() {
    // Initialize plugins
  }
  
  public static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }
  
  public async listPlugins(): Promise<Plugin[]> {
    return Array.from(this.plugins.values());
  }
  
  public async getPlugin(name: string): Promise<Plugin | null> {
    return this.plugins.get(name) || null;
  }
  
  public async registerPlugin(plugin: Plugin): Promise<void> {
    this.plugins.set(plugin.getName(), plugin);
  }
  
  public async unregisterPlugin(name: string): Promise<void> {
    this.plugins.delete(name);
  }
}
```

## Example Implementation

Here's a complete example of a Cloudflare Worker that implements the MCP protocol:

```typescript
// src/index.ts
import { handleMCPRequest } from './core/mcp';

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request: Request): Promise<Response> {
  // Handle CORS
  if (request.method === 'OPTIONS') {
    return handleCORS(request);
  }
  
  // Route to the appropriate handler
  if (request.url.includes('/mcp')) {
    return await handleMCPRequest(request);
  }
  
  // Handle other routes
  return new Response('Not Found', { status: 404 });
}

function handleCORS(request: Request): Response {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
```

## Next Steps

After implementing the core MCP protocol handlers, you'll need to:

1. Implement the authentication system
2. Implement the plugin system
3. Create plugins for specific functionality
4. Set up deployment and monitoring

For more information on these topics, see the related implementation guides:

- [Authentication Implementation](./authentication.md)
- [Plugin Development Guide](./plugin-development.md)
- [Admin Interface Development](./admin-interface.md)
